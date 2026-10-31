// Amazon Clone Frontend Application Logic
const API_BASE = '/api';

// App State
const state = {
  products: [],
  categories: [],
  cart: JSON.parse(localStorage.getItem('amazon_cart') || '[]'),
  filters: {
    q: '',
    category: 'All',
    sort: 'featured',
    primeOnly: false,
    minPrice: '',
    maxPrice: ''
  },
  currentSlide: 0
};

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const searchCategory = document.getElementById('search-category');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const cartBadge = document.getElementById('cart-badge');
const cartDrawer = document.getElementById('cart-drawer');
const cartDrawerBackdrop = document.getElementById('cart-drawer-backdrop');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTotalCountEl = document.getElementById('cart-total-count');
const shippingBanner = document.getElementById('shipping-banner');
const categoriesListEl = document.getElementById('categories-filter-list');
const resultsCountEl = document.getElementById('results-count');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();
  fetchCategories();
  fetchProducts();
  updateCartUI();
  setupEventListeners();
});

// ==========================================================================
// Hero Slider
// ==========================================================================
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }

  document.getElementById('hero-next')?.addEventListener('click', () => {
    state.currentSlide = (state.currentSlide + 1) % slides.length;
    showSlide(state.currentSlide);
  });

  document.getElementById('hero-prev')?.addEventListener('click', () => {
    state.currentSlide = (state.currentSlide - 1 + slides.length) % slides.length;
    showSlide(state.currentSlide);
  });

  // Auto rotate every 6 seconds
  setInterval(() => {
    state.currentSlide = (state.currentSlide + 1) % slides.length;
    showSlide(state.currentSlide);
  }, 6000);
}

// ==========================================================================
// API Calls
// ==========================================================================
async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/products/categories`);
    const data = await res.json();
    state.categories = data.categories || [];
    renderCategories();
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function fetchProducts() {
  try {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 0; font-size: 16px; color: #666;">
        <div class="spinner"></div> Loading products...
      </div>`;

    const params = new URLSearchParams();
    if (state.filters.q) params.append('q', state.filters.q);
    if (state.filters.category && state.filters.category !== 'All') params.append('category', state.filters.category);
    if (state.filters.sort) params.append('sort', state.filters.sort);
    if (state.filters.primeOnly) params.append('primeOnly', 'true');
    if (state.filters.minPrice) params.append('minPrice', state.filters.minPrice);
    if (state.filters.maxPrice) params.append('maxPrice', state.filters.maxPrice);

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    const data = await res.json();
    state.products = data.products || [];
    renderProducts();
  } catch (err) {
    console.error('Failed to load products:', err);
    productsGrid.innerHTML = `
      <div class="no-products-box">
        <h3>Unable to load products</h3>
        <p>Please make sure the server is running on http://localhost:5000</p>
      </div>`;
  }
}

// ==========================================================================
// Renderers
// ==========================================================================
function renderCategories() {
  // Update header search dropdown
  let optionsHtml = `<option value="All">All Departments</option>`;
  state.categories.forEach(cat => {
    optionsHtml += `<option value="${cat.name}">${cat.name}</option>`;
  });
  searchCategory.innerHTML = optionsHtml;

  // Update sidebar list
  let sidebarHtml = `
    <li class="filter-item ${state.filters.category === 'All' ? 'active' : ''}" onclick="selectCategory('All')">
      <span>All Departments</span>
    </li>
  `;
  state.categories.forEach(cat => {
    sidebarHtml += `
      <li class="filter-item ${state.filters.category === cat.name ? 'active' : ''}" onclick="selectCategory('${cat.name}')">
        <span>${cat.name}</span>
        <span class="filter-count">${cat.count}</span>
      </li>
    `;
  });
  categoriesListEl.innerHTML = sidebarHtml;
}

function renderProducts() {
  resultsCountEl.innerText = state.products.length;

  if (state.products.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-products-box">
        <h3>No results found</h3>
        <p>Try clearing some filters or searching for something else like "laptop", "shoes", or "coffee".</p>
        <button class="btn-reset-filters" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = state.products.map(product => {
    const stars = renderStarRating(product.rating);
    const discount = product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

    const badgeClass = {
      'Best Seller': 'badge-best-seller',
      "Amazon's Choice": 'badge-amazon-choice',
      'Top Deal': 'badge-top-deal',
      'Popular': 'badge-popular'
    }[product.badge] || 'badge-popular';

    return `
      <div class="product-card" data-id="${product.id}">
        ${product.badge ? `<div class="product-badge ${badgeClass}">${product.badge}</div>` : ''}
        
        <div class="product-image-container" onclick="openQuickView('${product.id}')">
          <img class="product-image" src="${product.image}" alt="${escapeHtml(product.title)}" loading="lazy" />
        </div>

        <div class="product-category-tag">${product.category}</div>
        <h2 class="product-title" onclick="openQuickView('${product.id}')" title="${escapeHtml(product.title)}">
          ${escapeHtml(product.title)}
        </h2>

        <div class="product-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">${product.rating.toFixed(1)}</span>
          <span class="review-count">(${product.reviewCount.toLocaleString()})</span>
        </div>

        <div class="product-price-section">
          ${discount > 0 ? `<span class="discount-tag">-${discount}%</span>` : ''}
          <div class="product-price">
            <span class="price-currency">$</span>
            <span class="price-main">${product.price.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `<span class="price-original">$${product.originalPrice.toFixed(2)}</span>` : ''}
        </div>

        ${product.prime ? `
          <div class="prime-delivery">
            <span class="prime-badge-text">prime</span>
            <span>Two-Day FREE Delivery</span>
          </div>
        ` : `
          <div class="prime-delivery">
            <span>Standard FREE delivery on $35+</span>
          </div>
        `}

        <div class="product-card-actions">
          <button class="btn-add-cart" onclick="addToCart('${product.id}')">
            Add to Cart
          </button>
          <button class="btn-quick-view" onclick="openQuickView('${product.id}')" title="Quick View">
            👁
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderStarRating(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ==========================================================================
// Cart Operations
// ==========================================================================
function addToCart(productId, quantity = 1) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = state.cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      prime: product.prime,
      quantity: quantity
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added to Cart: "${product.title.slice(0, 30)}..."`);
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
  showToast('Item removed from cart');
}

function saveCart() {
  localStorage.setItem('amazon_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Update badge in nav
  cartBadge.innerText = totalCount;
  if (cartTotalCountEl) cartTotalCountEl.innerText = totalCount;
  if (cartSubtotalEl) cartSubtotalEl.innerText = `$${subtotal.toFixed(2)}`;

  // Shipping progress
  if (shippingBanner) {
    if (subtotal >= 35) {
      shippingBanner.innerHTML = `<strong>✓ Congratulations!</strong> Your order qualifies for <strong>FREE Shipping</strong>.`;
      shippingBanner.style.backgroundColor = '#e8f5e9';
      shippingBanner.style.color = '#2e7d32';
    } else {
      const remaining = (35 - subtotal).toFixed(2);
      shippingBanner.innerHTML = `Add <strong>$${remaining}</strong> of eligible items to get <strong>FREE Shipping</strong>!`;
      shippingBanner.style.backgroundColor = '#f0f8ff';
      shippingBanner.style.color = '#0056b3';
    }
  }

  // Render items in drawer
  if (state.cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-view">
        <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <p>Your Amazon Cart is empty</p>
        <p style="font-size: 12px; margin-top: 6px;">Shop today's epic deals and explore popular categories!</p>
      </div>
    `;
  } else {
    cartItemsContainer.innerHTML = state.cart.map(item => `
      <div class="cart-item-row">
        <img class="cart-item-img" src="${item.image}" alt="${escapeHtml(item.title)}" />
        <div class="cart-item-info">
          <div class="cart-item-title">${escapeHtml(item.title)}</div>
          <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
          <div class="cart-item-controls">
            <div class="qty-controller">
              <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="cart-item-delete" onclick="removeFromCart('${item.id}')">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function toggleCart(open = true) {
  if (open) {
    cartDrawer.classList.add('open');
    cartDrawerBackdrop.classList.add('open');
  } else {
    cartDrawer.classList.remove('open');
    cartDrawerBackdrop.classList.remove('open');
  }
}

// ==========================================================================
// Checkout Flow & Orders
// ==========================================================================
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty! Add items first.');
    return;
  }
  toggleCart(false);

  const subtotal = state.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const shipping = subtotal > 35 ? 0 : 5.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  const modalBody = document.getElementById('checkout-modal-body');
  modalBody.innerHTML = `
    <form id="checkout-form" onsubmit="handlePlaceOrder(event)">
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" id="cust-name" class="form-input" placeholder="e.g. John Doe" required />
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="cust-email" class="form-input" placeholder="john@example.com" />
      </div>
      <div class="form-group">
        <label>Street Address *</label>
        <input type="text" id="cust-address" class="form-input" placeholder="123 Amazon Way, Suite 400" required />
      </div>
      <div class="form-row">
        <div class="form-group" style="flex: 2;">
          <label>City *</label>
          <input type="text" id="cust-city" class="form-input" placeholder="Seattle" required />
        </div>
        <div class="form-group" style="flex: 1;">
          <label>State</label>
          <input type="text" id="cust-state" class="form-input" placeholder="WA" />
        </div>
        <div class="form-group" style="flex: 1;">
          <label>Zip Code</label>
          <input type="text" id="cust-zip" class="form-input" placeholder="98109" />
        </div>
      </div>

      <div class="form-group">
        <label>Payment Method</label>
        <select id="payment-method" class="form-select">
          <option value="Amazon Pay (1-Click)">Amazon Pay (1-Click Instant)</option>
          <option value="Credit / Debit Card ending in 4242">Credit / Debit Card (Visa, MC, Amex)</option>
          <option value="Cash on Delivery">Cash on Delivery (COD)</option>
          <option value="UPI / Net Banking">UPI / Net Banking</option>
        </select>
      </div>

      <div style="background: #f7f7f7; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Items (${state.cart.length}):</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Shipping & Handling:</span>
          <span>${shipping === 0 ? '<span style="color:#007600">FREE</span>' : '$' + shipping.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>Estimated Tax:</span>
          <span>$${tax.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; border-top: 1px solid #ddd; padding-top: 8px; color: #b12704;">
          <span>Order Total:</span>
          <span>$${total.toFixed(2)}</span>
        </div>
      </div>

      <button type="submit" class="btn-primary" id="btn-submit-order">Place Your Order</button>
    </form>
  `;

  openModal('checkout-modal');
}

async function handlePlaceOrder(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-submit-order');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Processing Order...';

  const orderPayload = {
    customer: {
      fullName: document.getElementById('cust-name').value,
      email: document.getElementById('cust-email').value,
      address: document.getElementById('cust-address').value,
      city: document.getElementById('cust-city').value,
      state: document.getElementById('cust-state').value,
      zipCode: document.getElementById('cust-zip').value
    },
    paymentMethod: document.getElementById('payment-method').value,
    items: state.cart
  };

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');

    // Clear cart
    state.cart = [];
    saveCart();
    updateCartUI();

    // Show confirmation in modal
    const modalBody = document.getElementById('checkout-modal-body');
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 20px 10px;">
        <div style="font-size: 48px; color: #2e7d32; margin-bottom: 12px;">✓</div>
        <h3 style="font-size: 22px; color: #0f1111; margin-bottom: 8px;">Order Placed, Thank You!</h3>
        <p style="color: #565959; margin-bottom: 16px;">Confirmation will be sent to your email.</p>

        <div style="background: #f0f8ff; border: 1px solid #d0e7ff; padding: 14px; border-radius: 6px; text-align: left; margin-bottom: 20px;">
          <p><strong>Order ID:</strong> #${data.order.id}</p>
          <p><strong>Estimated Delivery:</strong> ${data.order.estimatedDelivery}</p>
          <p><strong>Total Paid:</strong> $${data.order.pricing.total.toFixed(2)} (${data.order.paymentMethod})</p>
          <p><strong>Shipping To:</strong> ${data.order.customer.fullName}, ${data.order.customer.address}, ${data.order.customer.city}</p>
        </div>

        <button class="btn-primary" onclick="closeModal('checkout-modal'); openOrdersModal();">
          View In "Your Orders"
        </button>
      </div>
    `;

    showToast('🎉 Order placed successfully!');
  } catch (err) {
    alert(err.message);
    submitBtn.disabled = false;
    submitBtn.innerText = 'Place Your Order';
  }
}

// ==========================================================================
// Orders History View
// ==========================================================================
async function openOrdersModal() {
  openModal('orders-modal');
  const container = document.getElementById('orders-modal-body');
  container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading your orders...</div>';

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: #666;">
          <h3>No orders placed yet!</h3>
          <p style="margin-top: 8px;">Browse our catalog and place your first order.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="orders-list">
        ${orders.map(order => `
          <div class="order-card">
            <div class="order-card-header">
              <div class="order-header-col">
                <span>ORDER PLACED</span>
                <strong>${new Date(order.createdAt).toLocaleDateString()}</strong>
              </div>
              <div class="order-header-col">
                <span>TOTAL</span>
                <strong>$${order.pricing.total.toFixed(2)}</strong>
              </div>
              <div class="order-header-col">
                <span>SHIP TO</span>
                <strong>${escapeHtml(order.customer.fullName)}</strong>
              </div>
              <div class="order-header-col order-header-id">
                <span>ORDER # ${order.id}</span>
              </div>
            </div>
            <div class="order-card-body">
              <div class="order-status-badge">● ${order.status}</div>
              <p style="font-size: 13px; color: #565959; margin-bottom: 12px;">
                Arriving: <strong>${order.estimatedDelivery}</strong>
              </p>
              <div class="order-items-preview">
                ${order.items.map(item => `
                  <div class="order-preview-row">
                    <img class="order-preview-img" src="${item.image}" alt="" />
                    <div style="flex: 1; font-size: 13px;">
                      <div style="font-weight: 600;">${escapeHtml(item.title)}</div>
                      <div style="color: #666;">Qty: ${item.quantity} | $${item.price.toFixed(2)} each</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color: red;">Failed to load orders: ${err.message}</p>`;
  }
}

// ==========================================================================
// Quick View & Add Product Modals
// ==========================================================================
function openQuickView(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const modalBody = document.getElementById('quickview-modal-body');
  modalBody.innerHTML = `
    <div class="quickview-container">
      <div class="quickview-img-box">
        <img class="quickview-img" src="${product.image}" alt="${escapeHtml(product.title)}" />
      </div>
      <div class="quickview-details">
        <span class="product-category-tag">${product.category}</span>
        <h2 style="font-size: 18px; margin: 4px 0 10px;">${escapeHtml(product.title)}</h2>
        
        <div class="product-rating" style="margin-bottom: 12px;">
          <span class="stars">${renderStarRating(product.rating)}</span>
          <span class="rating-num">${product.rating.toFixed(1)}</span>
          <span class="review-count">(${product.reviewCount.toLocaleString()} ratings)</span>
        </div>

        <div style="font-size: 24px; font-weight: 700; color: #0f1111; margin-bottom: 10px;">
          $${product.price.toFixed(2)}
          ${product.originalPrice > product.price ? `
            <span style="font-size: 14px; color: #565959; text-decoration: line-through; margin-left: 8px;">
              $${product.originalPrice.toFixed(2)}
            </span>
          ` : ''}
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #333; margin-bottom: 18px;">
          ${escapeHtml(product.description)}
        </p>

        <div style="margin-bottom: 16px;">
          <span style="color: #067d62; font-weight: 700;">In Stock</span>
          ${product.prime ? `<div class="prime-delivery" style="margin-top: 4px;"><span class="prime-badge-text">prime</span> FREE Next-Day Delivery</div>` : ''}
        </div>

        <button class="btn-add-cart" style="width: 100%; padding: 12px;" onclick="addToCart('${product.id}'); closeModal('quickview-modal');">
          Add to Cart
        </button>
      </div>
    </div>
  `;

  openModal('quickview-modal');
}

function openAddProductModal() {
  openModal('add-product-modal');
}

async function handleCreateProduct(e) {
  e.preventDefault();
  const title = document.getElementById('new-prod-title').value;
  const category = document.getElementById('new-prod-category').value;
  const price = document.getElementById('new-prod-price').value;
  const originalPrice = document.getElementById('new-prod-original-price').value;
  const image = document.getElementById('new-prod-image').value;
  const description = document.getElementById('new-prod-desc').value;
  const prime = document.getElementById('new-prod-prime').checked;
  const badge = document.getElementById('new-prod-badge').value;

  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        price,
        originalPrice,
        image,
        description,
        prime,
        badge
      })
    });

    if (!res.ok) throw new Error('Failed to create product');

    showToast('Product added successfully!');
    closeModal('add-product-modal');
    e.target.reset();
    fetchCategories();
    fetchProducts();
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================================================
// Filter & Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Search Bar
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  // Sort Dropdown
  sortSelect.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    fetchProducts();
  });

  // Search Category Select
  searchCategory.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    fetchProducts();
  });

  // Price Filter form
  document.getElementById('price-filter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.filters.minPrice = document.getElementById('min-price').value;
    state.filters.maxPrice = document.getElementById('max-price').value;
    fetchProducts();
  });

  // Prime Only toggle
  document.getElementById('prime-filter')?.addEventListener('change', (e) => {
    state.filters.primeOnly = e.target.checked;
    fetchProducts();
  });
}

function performSearch() {
  state.filters.q = searchInput.value.trim();
  state.filters.category = searchCategory.value;
  fetchProducts();
}

function selectCategory(categoryName) {
  state.filters.category = categoryName;
  searchCategory.value = categoryName;
  fetchProducts();
  renderCategories();
}

function resetFilters() {
  state.filters.q = '';
  state.filters.category = 'All';
  state.filters.sort = 'featured';
  state.filters.primeOnly = false;
  state.filters.minPrice = '';
  state.filters.maxPrice = '';

  searchInput.value = '';
  searchCategory.value = 'All';
  sortSelect.value = 'featured';
  if (document.getElementById('min-price')) document.getElementById('min-price').value = '';
  if (document.getElementById('max-price')) document.getElementById('max-price').value = '';
  if (document.getElementById('prime-filter')) document.getElementById('prime-filter').checked = false;

  fetchProducts();
  renderCategories();
}

// ==========================================================================
// Modal Helpers & Utility
// ==========================================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}
