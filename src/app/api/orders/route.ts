import { NextRequest, NextResponse } from 'next/server';
import { logOrderToSheets } from '../../../lib/sheetsLogger';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Resolve base URL for calling local API routes in any environment
function resolveBaseUrl(req: NextRequest): string {
  // Prefer Vercel provided URL in production
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Use explicit only if it is not localhost and looks valid
  const explicit = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  if (explicit && !/localhost|127\.0\.0\.1|::1/i.test(explicit)) {
    return explicit.replace(/\/$/, '');
  }

  // Fallback to same-origin headers
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

// Function to log data to Google Sheets (direct, without internal HTTP)
async function logToGoogleSheets(_req: NextRequest, orderData: OrderData): Promise<{ ok: boolean; status?: number; error?: string }>{
  try {
    const res = await logOrderToSheets(orderData as any);
    if (!res.ok) {
      return { ok: false, status: 500, error: res.error };
    }
    return { ok: true, status: 200 };
  } catch (error: any) {
    console.error('Failed to log to Google Sheets:', error);
    return { ok: false, status: 500, error: error?.message || 'unknown' };
  }
}

interface CartItem {
  id: string;
  flower: {
    id: string;
    name: string;
    price: number;
    emoji: string;
    description: string;
  };
  quantity: number;
}

interface OrderData {
  userId: string;
  phoneNumber?: string;
  address?: string;
  telegramId?: string;
  items: CartItem[];
  total: number;
  timestamp: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json();

    // Generate orderId and prepare orderWithId
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderWithId = {
      orderId,
      ...orderData,
      createdAt: new Date().toISOString()
    };

    // Try local file logging, but never fail if it errors (Vercel /tmp only)
    try {
      const ordersDir = process.env.NODE_ENV === 'production'
        ? path.join('/tmp', 'orders')
        : path.join(process.cwd(), 'orders');

      if (!fs.existsSync(ordersDir)) {
        fs.mkdirSync(ordersDir, { recursive: true });
      }

      const orderFilePath = path.join(ordersDir, `${orderId}.json`);
      fs.writeFileSync(orderFilePath, JSON.stringify(orderWithId, null, 2));

      const masterOrdersPath = path.join(ordersDir, 'all_orders.json');
      let allOrders: any[] = [];
      if (fs.existsSync(masterOrdersPath)) {
        const existingData = fs.readFileSync(masterOrdersPath, 'utf8');
        try {
          allOrders = JSON.parse(existingData);
        } catch (e) {
          console.warn('Failed to parse existing all_orders.json, resetting:', e);
          allOrders = [];
        }
      }
      allOrders.push(orderWithId);
      fs.writeFileSync(masterOrdersPath, JSON.stringify(allOrders, null, 2));

      console.log(`New order saved locally: ${orderId} for user ${orderData.userId}`);
    } catch (fsErr) {
      console.error('Filesystem write skipped due to error/environment:', fsErr);
    }

    // Log to Google Sheets (do not fail request on errors), and expose diagnostics
    const sheetsData = {
      ...orderData,
      orderId,
      timestamp: new Date().toISOString(),
    };
    console.log('Sending data to Google Sheets:', JSON.stringify(sheetsData, null, 2));
    const sheetsResult = await logToGoogleSheets(request, sheetsData);
    if (sheetsResult.ok) {
      console.log('Successfully logged to Google Sheets');
    } else {
      console.error('Google Sheets logging failed:', sheetsResult);
    }
    
    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Order saved successfully',
      sheetsLogged: sheetsResult.ok,
      sheetsStatus: sheetsResult.status ?? null,
      sheetsError: sheetsResult.error ?? null,
    });
    
  } catch (error) {
    console.error('Error saving order:', error);
        return NextResponse.json(
      { success: false, message: 'Failed to save order', error: (error as any)?.message || 'unknown' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // 1) Попытка прочитать из Google Sheets
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID as string;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY_B64
      ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8')
      : (process.env.GOOGLE_PRIVATE_KEY || '');
    const normalizedPrivateKey = String(rawKey)
      .replace(/\\n/g, '\n')
      .replace(/\r/g, '')
      .replace(/^['"]|['"]$/g, '')
      .trim();
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    if (spreadsheetId && clientEmail && normalizedPrivateKey) {
      try {
        const auth = new google.auth.GoogleAuth({
          credentials: { client_email: clientEmail, private_key: normalizedPrivateKey },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });

        let sheetName = 'Orders';
        try {
          const info = await sheets.spreadsheets.get({ spreadsheetId } as any);
          const titles = info.data.sheets?.map((s: any) => s.properties?.title || '') || [];
          if (!titles.includes(sheetName) && titles.length > 0) sheetName = titles[0];
        } catch {}

        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A:G` } as any);
        const rows = (res.data.values || []) as string[][];

        const ordersFromSheets = rows
          .filter((r) => r.length >= 2)
          .map((r) => {
            const [ts, uId, phone, itemsText, totalCell, address, status] = r;
            let items: any[] = [];
            if (itemsText) {
              try {
                items = itemsText.split(';').map((chunk) => {
                  const part = chunk.trim();
                  const nameMatch = part.match(/^(.*?)\s+x(\d+)/);
                  const priceMatch = part.match(/\((\d+[\d\s]*)\s*руб\.?\)/i);
                  const name = nameMatch ? nameMatch[1].trim() : part;
                  const quantity = nameMatch ? Number(nameMatch[2]) : 1;
                  const price = priceMatch ? Number(priceMatch[1].replace(/\s/g, '')) : 0;
                  return { flower: { name, price, emoji: '•', description: '' }, quantity };
                });
              } catch {
                items = [{ flower: { name: itemsText, price: 0, emoji: '•', description: '' }, quantity: 1 }];
              }
            }
            const totalMatch = String(totalCell || '').match(/(\d+[\d\s]*)/);
            const total = totalMatch ? Number(totalMatch[1].replace(/\s/g, '')) : 0;
            return {
              orderId: `sheet_${Date.now()}`,
              userId: String(uId || ''),
              phoneNumber: phone || undefined,
              address: address || undefined,
              items,
              total,
              timestamp: ts || new Date().toISOString(),
              status: String(status || 'новый'),
            } as any;
          })
          .filter((o) => {
            if (!userId) return true;
            const q = String(userId);
            return (
              o.userId === q ||
              o.userId === `telegram_${q}` ||
              (q.startsWith('phone_') && o.userId.replace(/\D/g, '').includes(q.replace(/\D/g, '')))
            );
          });

        if (ordersFromSheets.length > 0 || userId) {
          return NextResponse.json({ orders: ordersFromSheets });
        }
      } catch (e) {
        console.warn('Sheets read failed, falling back to local file:', (e as any)?.message || e);
      }
    }

    // 2) Фолбэк: локальные файлы (dev)
    const ordersDir = process.env.NODE_ENV === 'production' ? path.join('/tmp', 'orders') : path.join(process.cwd(), 'orders');
    const masterOrdersPath = path.join(ordersDir, 'all_orders.json');
    if (!fs.existsSync(masterOrdersPath)) {
      return NextResponse.json({ orders: [] });
    }
    const allOrders = JSON.parse(fs.readFileSync(masterOrdersPath, 'utf8'));
    if (userId) {
      const q = String(userId);
      const userOrders = allOrders.filter((order: OrderData) => (
        order.userId === q ||
        order.userId === `telegram_${q}` ||
        (q.startsWith('phone_') && String(order.userId || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')))
      ));
      return NextResponse.json({ orders: userOrders });
    }
    return NextResponse.json({ orders: allOrders });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}