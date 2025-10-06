import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

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

const auth = new google.auth.GoogleAuth({
  // For service accounts, достаточно client_email и private_key
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

    if (!SPREADSHEET_ID) {
      console.error('GOOGLE_SPREADSHEET_ID not configured');
      return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 500 });
    }

    // Discover sheets and select target sheet
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID } as any);
      const availableSheets = spreadsheetInfo.data.sheets?.map((sheet: any) => sheet.properties?.title || '') || [];
      console.log('Available sheets:', availableSheets);
      if (!availableSheets.includes(SHEET_NAME) && availableSheets.length > 0) {
        SHEET_NAME = availableSheets[0];
        console.log(`Sheet "Orders" not found, using "${SHEET_NAME}" instead`);
      }
    } catch (error) {
      console.error('Error getting spreadsheet info:', error);
      return NextResponse.json({ error: 'Failed to access Google Sheets' }, { status: 500 });
    }

    // Format row data
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
      const name = item.flower?.name || item.name || 'Товар';
      const price = item.flower?.price ?? item.price ?? 0;
      const quantity = item.quantity ?? 1;
      return `${name} x${quantity} (${price}₽)`;
    }).join('; ');

    const rowData = [
      timestamp,
      String(orderData.userId || ''),
      String(orderData.phoneNumber || ''),
      String(items || ''),
      `${orderData.total || 0}₽`,
      String(orderData.address || ''),
      String(orderData.status || 'новый')
    ];

    console.log('Sending row data to Google Sheets:', rowData);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID as string,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    } as any);

    console.log('Order logged to Google Sheets:', orderData.userId);
    return NextResponse.json({ success: true, message: 'Order logged successfully' });
  } catch (error: any) {
    console.error('Error logging to Google Sheets:', error);
    return NextResponse.json({ success: false, message: 'Order processed but logging failed', error: error?.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Google Sheets integration endpoint' });
}