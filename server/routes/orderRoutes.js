const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ordersFilePath = path.join(__dirname, '..', 'data', 'orders.json');

// Helper to read orders
function readOrders() {
  try {
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading orders:', err);
    return [];
  }
}

// Helper to write orders
function writeOrders(orders) {
  fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
}

// Helper to generate Amazon format order ID (e.g., 114-4928172-8491023)
function generateOrderId() {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(1000000 + Math.random() * 9000000);
  const p3 = Math.floor(1000000 + Math.random() * 9000000);
  return `${p1}-${p2}-${p3}`;
}

// GET /api/orders - List all orders
router.get('/', (req, res) => {
  const orders = readOrders();
  // Sort most recent first
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ count: orders.length, orders });
});

// GET /api/orders/:id - Get order details
router.get('/:id', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

// POST /api/orders - Place a new order
router.post('/', (req, res) => {
  const { items, customer, paymentMethod } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  if (!customer || !customer.fullName || !customer.address || !customer.city) {
    return res.status(400).json({ error: 'Customer details and shipping address are required' });
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const shipping = subtotal > 35 ? 0 : 5.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  // Delivery estimate: 2-3 business days
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);

  const newOrder = {
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    status: 'Confirmed - Preparing for Shipment',
    estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }),
    customer: {
      fullName: customer.fullName.trim(),
      email: customer.email || 'customer@example.com',
      address: customer.address.trim(),
      city: customer.city.trim(),
      state: customer.state || '',
      zipCode: customer.zipCode || '',
      country: customer.country || 'United States'
    },
    paymentMethod: paymentMethod || 'Amazon Pay / Card ending in 4242',
    pricing: {
      subtotal: +subtotal.toFixed(2),
      shipping: shipping,
      tax: tax,
      total: total
    },
    items: items.map(item => ({
      productId: item.id || item.productId,
      title: item.title,
      price: item.price,
      quantity: item.quantity || 1,
      image: item.image
    }))
  };

  const orders = readOrders();
  orders.unshift(newOrder);
  writeOrders(orders);

  res.status(201).json({
    message: 'Order placed successfully!',
    order: newOrder
  });
});

module.exports = router;
