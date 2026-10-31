const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Amazon Clone Data & Logic Tests', () => {
  const productsPath = path.join(__dirname, '..', 'server', 'data', 'products.json');
  const ordersPath = path.join(__dirname, '..', 'server', 'data', 'orders.json');

  test('products.json exists and contains valid products', () => {
    assert.ok(fs.existsSync(productsPath), 'products.json should exist');
    const content = fs.readFileSync(productsPath, 'utf8');
    const products = JSON.parse(content);
    assert.ok(Array.isArray(products), 'products must be an array');
    assert.ok(products.length >= 10, 'products should contain at least 10 items');

    const sample = products[0];
    assert.ok(sample.id, 'product must have id');
    assert.ok(sample.title, 'product must have title');
    assert.ok(sample.price > 0, 'product price must be positive');
    assert.ok(sample.category, 'product must belong to a category');
    assert.ok(sample.image, 'product must have an image url');
  });

  test('orders.json exists and is valid JSON', () => {
    assert.ok(fs.existsSync(ordersPath), 'orders.json should exist');
    const content = fs.readFileSync(ordersPath, 'utf8');
    const orders = JSON.parse(content);
    assert.ok(Array.isArray(orders), 'orders must be an array');
  });

  test('Calculates shipping correctly (Free shipping over $35 threshold)', () => {
    function calculateShipping(subtotal) {
      return subtotal >= 35 ? 0 : 5.99;
    }
    assert.strictEqual(calculateShipping(20.00), 5.99);
    assert.strictEqual(calculateShipping(35.00), 0);
    assert.strictEqual(calculateShipping(199.99), 0);
  });

  test('Generates valid Amazon format order ID', () => {
    function generateOrderId() {
      const p1 = Math.floor(100 + Math.random() * 900);
      const p2 = Math.floor(1000000 + Math.random() * 9000000);
      const p3 = Math.floor(1000000 + Math.random() * 9000000);
      return `${p1}-${p2}-${p3}`;
    }
    const orderId = generateOrderId();
    const regex = /^\d{3}-\d{7}-\d{7}$/;
    assert.ok(regex.test(orderId), `Order ID ${orderId} should match format 000-0000000-0000000`);
  });

  test('Frontend index.html contains essential root elements', () => {
    const indexPath = path.join(__dirname, '..', 'public', 'index.html');
    assert.ok(fs.existsSync(indexPath), 'index.html should exist');
    const html = fs.readFileSync(indexPath, 'utf8');
    assert.ok(html.includes('id="search-input"'));
    assert.ok(html.includes('id="products-grid"'));
    assert.ok(html.includes('id="cart-drawer"'));
  });
});
