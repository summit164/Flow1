import { NextRequest, NextResponse } from 'next/server';
import { logOrderToSheets } from '../../../lib/sheetsLogger';
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
    
    const ordersDir = process.env.NODE_ENV === 'production' ? path.join('/tmp', 'orders') : path.join(process.cwd(), 'orders');
    const masterOrdersPath = path.join(ordersDir, 'all_orders.json');
    
    if (!fs.existsSync(masterOrdersPath)) {
      return NextResponse.json({ orders: [] });
    }
    
    const allOrders = JSON.parse(fs.readFileSync(masterOrdersPath, 'utf8'));
    
    if (userId) {
      const userOrders = allOrders.filter((order: OrderData) => order.userId === userId);
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