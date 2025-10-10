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
  orderId?: string;
}

// Compute deterministic key for idempotent upsert (one order → one row)
function computeOrderKey(orderData: OrderLogData): string {
  const itemsText = (orderData.items || []).map((item: any) => {
    const name = item?.flower?.name || item?.name || 'Товар';
    const price = item?.flower?.price ?? item?.price ?? 0;
    const quantity = item?.quantity ?? 1;
    return `${name} x${quantity} (${price})`;
  }).join(';');
  const base = [
    orderData.orderId || '',
    orderData.userId || '',
    String(orderData.total ?? 0),
    itemsText
  ].join('|');
  // Simple stable hash
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  return `key_${Math.abs(hash)}`;
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

  const orderKey = computeOrderKey(orderData);

  const rowData = [
    timestamp,
    String(orderData.userId || ''),
    String(orderData.phoneNumber || ''),
    String(items || ''),
    `${orderData.total || 0} руб.`,
    String(orderData.address || ''),
    String(orderData.status || 'новый'),
    orderKey
  ];

  try {
    // Try to find existing row by orderKey in column H and ensure recent time window
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    } as any);

    const rows = (existing.data.values || []) as string[][];
    let targetRowIndex: number | null = null; // 1-based index in sheet
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || [];
      const cellKey = row[7] ?? '';
      if (cellKey === orderKey) {
        // Parse timestamp from column A (ru-RU locale string); if parsing fails, treat as match only if key equals
        const tsCell = row[0] ?? '';
        let tsMs = Number.NaN;
        try {
          // Try to parse as locale string via Date constructor
          tsMs = new Date(tsCell).getTime();
        } catch {}
        if (!Number.isNaN(tsMs)) {
          if ((now - tsMs) <= windowMs) {
            targetRowIndex = i + 1; // offset for 1-based
            break;
          }
        } else {
          // If cannot parse timestamp, still treat as match (conservative) to prevent duplication
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    if (targetRowIndex) {
      // Update existing row (A:H) to avoid duplicates
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${targetRowIndex}:H${targetRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowData] },
      } as any);
    } else {
      // Append new row (A:H)
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:H`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowData] },
      } as any);
    }
    return { ok: true };
  } catch (error: any) {
    const details = error?.response?.data?.error?.message || error?.message || 'Unknown error';
    return { ok: false, error: details };
  }
}