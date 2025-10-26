require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4004;
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(express.json());
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/helpers', require('./routes/helpers'));
app.use('/api/orders', require('./routes/orders'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});