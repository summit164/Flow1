import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Resolve base URL for calling the Sheets endpoint (prod/dev aware)
function resolveBaseUrl(request?: NextRequest) {
  // Prefer explicit API_URL if provided
  if (process.env.API_URL) return process.env.API_URL;
  // Vercel provides VERCEL_URL (without protocol)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Derive from incoming request headers (Next.js route)
  if (request) {
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    if (host) return `${proto}://${host}`;
  }
  // Fallback to local dev server
  return 'http://localhost:3001';
}

// Function to log data to Google Sheets
async function logToGoogleSheets(orderData: OrderData, request?: NextRequest) {
  try {
    const baseUrl = resolveBaseUrl(request);
    const url = `${baseUrl}/api/sheets`;
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
    // Don't interrupt execution if logging fails
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
    
    // Create orders directory if it doesn't exist
    const ordersDir = path.join(process.cwd(), 'orders');
    if (!fs.existsSync(ordersDir)) {
      fs.mkdirSync(ordersDir, { recursive: true });
    }
    
    // Save order to file
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderFilePath = path.join(ordersDir, `${orderId}.json`);
    
    const orderWithId = {
      orderId,
      ...orderData,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(orderFilePath, JSON.stringify(orderWithId, null, 2));
    
    // Also append to a master orders file for easy access
    const masterOrdersPath = path.join(ordersDir, 'all_orders.json');
    let allOrders = [];
    
    if (fs.existsSync(masterOrdersPath)) {
      const existingData = fs.readFileSync(masterOrdersPath, 'utf8');
      allOrders = JSON.parse(existingData);
    }
    
    allOrders.push(orderWithId);
    fs.writeFileSync(masterOrdersPath, JSON.stringify(allOrders, null, 2));
    
    console.log(`New order saved: ${orderId} for user ${orderData.userId}`);
    
    // Log to Google Sheets (asynchronously, don't block response)
    try {
      const sheetsData = {
        ...orderData,
        timestamp: new Date().toISOString(),
      };
      console.log('Sending data to Google Sheets:', JSON.stringify(sheetsData, null, 2));
      await logToGoogleSheets(sheetsData, request);
      console.log('Successfully logged to Google Sheets');
    } catch (error) {
      console.error('Failed to log to Google Sheets:', error);
      // Don't fail the order if Google Sheets logging fails
    }
    
    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Order saved successfully' 
    });
    
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const ordersDir = path.join(process.cwd(), 'orders');
    const masterOrdersPath = path.join(ordersDir, 'all_orders.json');
    
    if (!fs.existsSync(masterOrdersPath)) {
      return NextResponse.json({ orders: [] });
    }
    
    const allOrders = JSON.parse(fs.readFileSync(masterOrdersPath, 'utf8'));
    
    if (userId) {
      // Return orders for specific user
      const userOrders = allOrders.filter((order: OrderData) => order.userId === userId);
      return NextResponse.json({ orders: userOrders });
    }
    
    // Return all orders
    return NextResponse.json({ orders: allOrders });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}