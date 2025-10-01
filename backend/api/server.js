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
app.use(cors({
  origin: ['http://localhost:3000', 'https://localhost:3000'],
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
    const ordersPath = path.join(__dirname, '../orders/all_orders.json');
    if (fs.existsSync(ordersPath)) {
      const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      res.json(orders);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading orders:', error);
    res.status(500).json({ error: 'Failed to read orders' });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const newOrder = req.body;
    const timestamp = new Date().toISOString();
    const orderId = `order_${Date.now()}`;
    
    const orderWithMeta = {
      id: orderId,
      timestamp,
      ...newOrder
    };

    // Save individual order file
    const orderPath = path.join(__dirname, `../orders/${orderId}.json`);
    fs.writeFileSync(orderPath, JSON.stringify(orderWithMeta, null, 2));

    // Update all orders file
    const allOrdersPath = path.join(__dirname, '../orders/all_orders.json');
    let allOrders = [];
    
    if (fs.existsSync(allOrdersPath)) {
      allOrders = JSON.parse(fs.readFileSync(allOrdersPath, 'utf8'));
    }
    
    allOrders.push(orderWithMeta);
    fs.writeFileSync(allOrdersPath, JSON.stringify(allOrders, null, 2));

    // Log to Google Sheets (asynchronously, don't block response)
    const logToGoogleSheets = async (orderData) => {
      try {
        const postData = JSON.stringify({ orderData });
        
        const options = {
          hostname: 'localhost',
          port: 3001,
          path: '/api/sheets',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`Order ${orderData.id} logged to Google Sheets successfully`);
              } else {
                console.error(`Google Sheets API error: ${res.statusCode} - ${data}`);
              }
            } catch (parseError) {
              console.error('Failed to parse Google Sheets response:', parseError);
            }
          });
        });

        req.on('error', (error) => {
          console.error('Failed to log to Google Sheets:', error);
        });

        req.write(postData);
        req.end();
      } catch (error) {
        console.error('Failed to log to Google Sheets:', error);
      }
    };

    // Call Google Sheets logging asynchronously
    logToGoogleSheets(orderWithMeta).catch(console.error);

    res.status(201).json({ 
      success: true, 
      orderId,
      message: 'Order created successfully' 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
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