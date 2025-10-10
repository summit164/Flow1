import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { logOrderToSheets } from '../../../lib/sheetsLogger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
let SHEET_NAME = 'Orders';

// Normalize private key (supports GOOGLE_PRIVATE_KEY_B64 and GOOGLE_PRIVATE_KEY)
const rawKey = process.env.GOOGLE_PRIVATE_KEY_B64
  ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8')
  : (process.env.GOOGLE_PRIVATE_KEY || '');

const normalizedPrivateKey = rawKey
  .replace(/\\n/g, '\n')
  .replace(/\r/g, '')
  .replace(/^['"]|['"]$/g, '')
  .trim();

// Прямую работу с API в POST заменяем на общий логгер с идемпотентным upsert,
// чтобы исключить дубли. Оставляем клиент только для диагностик в GET.
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: normalizedPrivateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderData } = body;

    if (!orderData) {
      return NextResponse.json({ error: 'Order data is required' }, { status: 400 });
    }

    // Пишем через общий логгер: он выполняет upsert по ключу (колонка H)
    const res = await logOrderToSheets(orderData);
    if (!res.ok) {
      return NextResponse.json({ success: false, message: 'Logging failed', error: res.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Order logged successfully' });
  } catch (error: any) {
    const details = error?.response?.data?.error?.message || error?.message || 'Unknown error';
    console.error('Error logging to Google Sheets:', details);
    return NextResponse.json({ success: false, message: 'Order processed but logging failed', error: details }, { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const diag = url.searchParams.get('diag');

  if (!diag) {
    return NextResponse.json({ message: 'Google Sheets integration endpoint' });
  }

  const missingEnv: string[] = [];
  if (!process.env.GOOGLE_SPREADSHEET_ID) missingEnv.push('GOOGLE_SPREADSHEET_ID');
  if (!process.env.GOOGLE_CLIENT_EMAIL) missingEnv.push('GOOGLE_CLIENT_EMAIL');
  if (!normalizedPrivateKey) missingEnv.push('GOOGLE_PRIVATE_KEY or GOOGLE_PRIVATE_KEY_B64');

  const envOk = missingEnv.length === 0;

  let spreadsheetAccess: 'ok' | 'error' = 'error';
  let details: string | undefined;
  let availableSheets: string[] = [];
  let usingSheet: string | undefined;

  if (envOk) {
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID as string } as any);
      availableSheets = spreadsheetInfo.data.sheets?.map((sheet: any) => sheet.properties?.title || '') || [];
      spreadsheetAccess = 'ok';
      usingSheet = availableSheets.includes(SHEET_NAME) ? SHEET_NAME : availableSheets[0];
    } catch (error: any) {
      details = (error?.response?.data?.error?.message) || error?.message || 'Unknown error';
      spreadsheetAccess = 'error';
    }
  }

  return NextResponse.json({
    diagnostics: true,
    envOk,
    missingEnv,
    spreadsheetAccess,
    details,
    availableSheets,
    usingSheet,
    serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL || null,
  }, { status: envOk && spreadsheetAccess === 'ok' ? 200 : 500 });
}