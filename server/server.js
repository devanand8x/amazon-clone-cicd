const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'Amazon Clone Full-Stack API'
  });
});

// Fallback to index.html for SPA feel
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🛒 Amazon Clone Server is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📡 API Endpoints:`);
  console.log(`   - GET  /api/products`);
  console.log(`   - GET  /api/products/categories`);
  console.log(`   - POST /api/products`);
  console.log(`   - GET  /api/orders`);
  console.log(`   - POST /api/orders`);
  console.log(`===============================================`);
});
