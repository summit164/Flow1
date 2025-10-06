import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Resolve base URL for calling local API routes in any environment
function resolveBaseUrl(req: NextRequest): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

// Function to log data to Google Sheets
async function logToGoogleSheets(req: NextRequest, orderData: OrderData) {
  try {
    const base = resolveBaseUrl(req);
    const url = `${base}/api/sheets`;
    console.log('Calling Google Sheets API at:', url);
    console.log('Payload:', JSON.stringify({ orderData }, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderData }),
    });
    
    console.log('Google Sheets API response status:', response.status);
    const result = await response.json();
    console.log('Google Sheets logging result:', result);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} - ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error('Failed to log to Google Sheets:', error);
    throw error;
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

    // Log to Google Sheets (do not fail request on errors)
    try {
      const sheetsData = {
        ...orderData,
        timestamp: new Date().toISOString(),
      };
      console.log('Sending data to Google Sheets:', JSON.stringify(sheetsData, null, 2));
      await logToGoogleSheets(request, sheetsData);
      console.log('Successfully logged to Google Sheets');
    } catch (error) {
      console.error('Failed to log to Google Sheets:', error);
    }
    
    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Order saved successfully' 
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


