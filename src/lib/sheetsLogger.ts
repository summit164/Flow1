import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID as string;
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

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: normalizedPrivateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface OrderLogData {
  userId: string;
  phoneNumber?: string;
  address?: string;
  telegramId?: string;
  items: any[];
  total: number;
  timestamp: string;
  status: string;
}

export async function logOrderToSheets(orderData: OrderLogData): Promise<{ ok: boolean; error?: string }>{
  // Validate required env variables
  const missingEnv: string[] = [];
  if (!process.env.GOOGLE_SPREADSHEET_ID) missingEnv.push('GOOGLE_SPREADSHEET_ID');
  if (!process.env.GOOGLE_CLIENT_EMAIL) missingEnv.push('GOOGLE_CLIENT_EMAIL');
  if (!normalizedPrivateKey) missingEnv.push('GOOGLE_PRIVATE_KEY or GOOGLE_PRIVATE_KEY_B64');
  if (missingEnv.length > 0) {
    return { ok: false, error: `Google Sheets not configured: ${missingEnv.join(', ')}` };
  }

  try {
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID } as any);
    const availableSheets = spreadsheetInfo.data.sheets?.map((sheet: any) => sheet.properties?.title || '') || [];
    if (!availableSheets.includes(SHEET_NAME) && availableSheets.length > 0) {
      SHEET_NAME = availableSheets[0];
    }
  } catch (error: any) {
    const details = (error?.response?.data?.error?.message) || error?.message || 'Unknown error';
    return { ok: false, error: `Failed to access Google Sheets: ${details}` };
  }

  // Prepare row data similar to /api/sheets
  const timestamp = new Date(orderData.timestamp).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const items = (orderData.items || []).map((item: any) => {
    const name = item?.flower?.name || item?.name || 'Товар';
    const price = item?.flower?.price ?? item?.price ?? 0;
    const quantity = item?.quantity ?? 1;
    return `${name} x${quantity} (${price} руб.)`;
  }).join('; ');

  const rowData = [
    timestamp,
    String(orderData.userId || ''),
    String(orderData.phoneNumber || ''),
    String(items || ''),
    `${orderData.total || 0} руб.`,
    String(orderData.address || ''),
    String(orderData.status || 'новый')
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'RAW',
      requestBody: { values: [rowData] },
    } as any);
    return { ok: true };
  } catch (error: any) {
    const details = error?.response?.data?.error?.message || error?.message || 'Unknown error';
    return { ok: false, error: details };
  }
}