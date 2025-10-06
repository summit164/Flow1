import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://192.168.1.6:3000',
  process.env.NEXTJS_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Flower Shop Backend API',
    version: '1.0.0',
    endpoints: [
      'GET /api/orders - Get all orders',
      'POST /api/orders - Create new order',
      'GET /api/sheets - Google Sheets integration'
    ]
  });
});

// Orders API
app.get('/api/orders', (req, res) => {
  try {
    const { userId } = req.query;
    const ordersPath = path.join(__dirname, '../orders/all_orders.json');
    
    if (fs.existsSync(ordersPath)) {
      let orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      
      // Фильтрация по userId, если параметр передан
      if (userId) {
        orders = orders.filter(order => order.userId === userId);
        console.log(`🔍 Фильтрация заказов для пользователя ${userId}: найдено ${orders.length} заказов`);
      }
      
      res.json({ orders, count: orders.length });
    } else {
      res.json({ orders: [], count: 0 });
    }
  } catch (error) {
    console.error('Error reading orders:', error);
    res.status(500).json({ error: 'Failed to read orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = req.body;
    console.log('📥 Received order data:', JSON.stringify(newOrder, null, 2));
    const timestamp = new Date().toISOString();
    const orderId = `order_${Date.now()}`;
    
    const orderWithMeta = {
      id: orderId,
      timestamp,
      ...newOrder
    };

    // Choose safe orders directory (/tmp in production)
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const ordersDir = isProd ? path.join('/tmp', 'orders') : path.join(__dirname, '../orders');

    // Best-effort local logging; never block response
    try {
      if (!fs.existsSync(ordersDir)) {
        fs.mkdirSync(ordersDir, { recursive: true });
      }

      const orderPath = path.join(ordersDir, `${orderId}.json`);
      fs.writeFileSync(orderPath, JSON.stringify(orderWithMeta, null, 2), 'utf8');

      const allOrdersPath = path.join(ordersDir, 'all_orders.json');
      let allOrders = [];
      if (fs.existsSync(allOrdersPath)) {
        try {
          allOrders = JSON.parse(fs.readFileSync(allOrdersPath, 'utf8'));
        } catch (e) {
          console.warn('Failed to parse all_orders.json, resetting:', e);
          allOrders = [];
        }
      }
      allOrders.push(orderWithMeta);
      fs.writeFileSync(allOrdersPath, JSON.stringify(allOrders, null, 2), 'utf8');
    } catch (fsErr) {
      console.error('Skipping local file log due to error:', fsErr);
    }

    // Log to Google Sheets directly via handler (no network)
    try {
      const { default: sheetsHandler } = await import('./sheets.js');
      await sheetsHandler(
        { method: 'POST', body: { orderData: orderWithMeta } },
        { status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; } }
      );
      console.log(`Order ${orderId} logged to Google Sheets via handler`);
    } catch (sheetsErr) {
      console.error('Sheets logging failed (non-blocking):', sheetsErr);
    }

    res.status(201).json({ 
      success: true, 
      orderId,
      message: 'Order created successfully' 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', detail: error?.message });
  }
});

// Google Sheets API endpoint
app.get('/api/sheets', (req, res) => {
  res.json({ message: 'Google Sheets integration endpoint' });
});

app.post('/api/sheets', async (req, res) => {
  try {
    const { default: sheetsHandler } = await import('./sheets.js');
    await sheetsHandler(req, res);
  } catch (error) {
    console.error('Error loading sheets handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🌸 Flower Shop Backend API running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🔗 Frontend URL: http://localhost:3000`);
});

export default app;