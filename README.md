# 🛒 Amazon Clone - Full Stack Project

A simple, modern, full-stack Amazon Clone built with **Node.js**, **Express**, and clean **Vanilla JavaScript & CSS3**.

---

## 📁 Project Structure

```
amazon-clone/
├── package.json                # Project dependencies & scripts
├── test/
│   └── api.test.js             # Automated unit & validation tests
├── server/
│   ├── data/
│   │   ├── products.json       # Product catalog datastore
│   │   └── orders.json         # Orders datastore
│   ├── routes/
│   │   ├── productRoutes.js    # Product CRUD & filter endpoints
│   │   └── orderRoutes.js      # Orders & checkout endpoints
│   └── server.js               # Express application entrypoint
└── public/
    ├── css/
    │   └── styles.css          # Amazon UI design system
    ├── js/
    │   └── app.js              # Storefront, cart, & checkout logic
    └── index.html              # Main frontend interface
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Application
```bash
npm start
```
*(Or use `npm run dev` for auto-reloading during development)*

Open your browser at:
👉 **`http://localhost:5000`**

### 3. Run Automated Tests
```bash
npm test
```

---

## 📡 REST API Endpoints

- `GET /api/health` - Server health check
- `GET /api/products` - Product list (supports `?q=`, `?category=`, `?sort=`, `?primeOnly=`, `?minPrice=`, `?maxPrice=`)
- `GET /api/products/categories` - Categories list with item counts
- `GET /api/products/:id` - Single product details
- `POST /api/products` - Add new product
- `DELETE /api/products/:id` - Remove product
- `GET /api/orders` - Order history list
- `POST /api/orders` - Place new order
