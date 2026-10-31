const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const productsFilePath = path.join(__dirname, '..', 'data', 'products.json');

// Helper to read products
function readProducts() {
  try {
    const data = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading products:', err);
    return [];
  }
}

// Helper to write products
function writeProducts(products) {
  fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
}

// GET /api/products/categories - Distinct categories with counts
router.get('/categories', (req, res) => {
  const products = readProducts();
  const categoryCounts = {};

  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat]
  }));

  res.json({ categories, total: products.length });
});

// GET /api/products - Search, filter, and sort
router.get('/', (req, res) => {
  let products = readProducts();
  const { q, category, minPrice, maxPrice, sort, primeOnly } = req.query;

  // Search filter
  if (q && q.trim()) {
    const keyword = q.trim().toLowerCase();
    products = products.filter(p =>
      p.title.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword) ||
      p.category.toLowerCase().includes(keyword)
    );
  }

  // Category filter
  if (category && category !== 'All') {
    products = products.filter(
      p => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Prime only filter
  if (primeOnly === 'true') {
    products = products.filter(p => p.prime === true);
  }

  // Price range filter
  if (minPrice) {
    products = products.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= parseFloat(maxPrice));
  }

  // Sorting
  if (sort === 'price-low') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'reviews') {
    products.sort((a, b) => b.reviewCount - a.reviewCount);
  }

  res.json({
    count: products.length,
    products
  });
});

// GET /api/products/:id - Single product
router.get('/:id', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
});

// POST /api/products - Create a product
router.post('/', (req, res) => {
  const { title, description, price, originalPrice, category, image, prime, badge } = req.body;

  if (!title || !price || !category) {
    return res.status(400).json({ error: 'Title, price, and category are required' });
  }

  const products = readProducts();
  const newProduct = {
    id: 'prod_' + crypto.randomUUID().slice(0, 8),
    title: title.trim(),
    description: description ? description.trim() : '',
    price: parseFloat(price),
    originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
    rating: 5.0,
    reviewCount: 1,
    category: category.trim(),
    image: image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    prime: prime === true || prime === 'true',
    badge: badge || 'New'
  };

  products.unshift(newProduct);
  writeProducts(products);

  res.status(201).json({ message: 'Product created successfully', product: newProduct });
});

// DELETE /api/products/:id - Remove a product
router.delete('/:id', (req, res) => {
  const products = readProducts();
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const deleted = products.splice(index, 1)[0];
  writeProducts(products);

  res.json({ message: 'Product deleted successfully', product: deleted });
});

module.exports = router;
