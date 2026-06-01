# 🧾 UniBill

**An industry-grade, full-stack GST Billing, POS & Inventory ERP** — a professional billing system built with a real backend API and database.

![Stack](https://img.shields.io/badge/Node-20-green) ![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/SQLite-WAL-lightgrey) ![License](https://img.shields.io/badge/license-MIT-black)

---

## ✨ Features

### 🛒 Point of Sale (POS)

- Lightning-fast product search (name / SKU / barcode)
- Click-to-add cart with live quantity & price editing
- On-the-fly customer creation
- Per-bill discount (₹ or %), multiple payment modes
- Real-time GST computation with intra/inter-state detection

### 🧾 GST-Compliant Invoicing

- **Automatic CGST + SGST** for intra-state supply
- **Automatic IGST** for inter-state supply (based on state codes)
- HSN/SAC codes, tax-rate-wise summary table
- Indian-format **amount in words**
- Round-off handling, balance due tracking
- Print / save-as-PDF ready invoice template
- Auto financial-year invoice numbering (`INV/2026-27/0001`)

### 📦 Inventory Management

- Product catalog with categories, units, HSN, tax slabs
- Purchase & selling prices, stock levels
- **Auto stock deduction** on each sale
- Stock in/out adjustments with audit trail (stock movements)
- Low-stock alerts & inventory valuation (cost & retail)

### 👥 Customers

- Customer master with GSTIN, state, contact
- Per-customer ledger: invoices, total business, outstanding dues

### 📊 Reports & Analytics

- Dashboard: today/month/total sales, dues, stock value
- 7-day sales trend, payment-mode breakdown, top products
- Sales report, **GSTR-1 style GST summary**, inventory valuation
- **CSV export** for all reports

### 🔐 Auth & Settings

- JWT authentication, bcrypt password hashing
- Role-based users (admin / cashier)
- Configurable company profile, GSTIN, bank details, invoice terms

---

## 🏗️ Tech Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Recharts |
| Backend  | Node.js, Express                                     |
| Database | SQLite (better-sqlite3, WAL mode)                    |
| Auth     | JWT + bcryptjs                                       |

---

## 🚀 Quick Start

### Option A — One command (production build)

```bash
./start.sh
```

Then open **http://localhost:4000**

### Option B — Manual

```bash
# 1. Install dependencies
npm run install:all

# 2. Seed demo data (products, customers, ~67 invoices)
npm run seed

# 3a. Production: build client + serve from API
npm run build && npm start          # → http://localhost:4000

# 3b. OR Development with hot reload (two terminals)
npm run dev:server                  # API on :4000
npm run dev:client                  # Vite on :5173 (proxies /api)
```

### 🔑 Demo Credentials

| Role    | Email                 | Password     |
| ------- | --------------------- | ------------ |
| Admin   | `admin@unibill.com`   | `admin123`   |
| Cashier | `cashier@unibill.com` | `cashier123` |

---

## 📂 Project Structure

```
ezybill-pro/
├── server/                 # Express API + SQLite
│   └── src/
│       ├── index.js        # Server entry (also serves built client)
│       ├── db.js           # Schema & connection
│       ├── seed.js         # Demo data generator
│       ├── middleware/     # JWT auth
│       └── routes/         # auth, products, customers, invoices, reports, company
├── client/                 # React + Vite + Tailwind SPA
│   └── src/
│       ├── pages/          # Dashboard, POS, Invoices, Products, Customers, Reports, Settings, Login
│       └── components/     # Layout, UI kit, Icons
├── start.sh                # One-command production runner
└── dev.sh                  # Dev runner
```

---

## 🧮 GST Logic

The supply type is determined by comparing the **customer's state code** with the **company's state code** (set in Settings):

- **Same state (intra-state)** → tax split into **CGST + SGST** (half each)
- **Different state (inter-state)** → single **IGST**

Tax is computed per line item at its own GST slab (0/5/12/18/28%), with invoice totals rounded to the nearest rupee and the round-off recorded.

---

## 🔌 API Overview

All endpoints prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method              | Endpoint                                                                  | Description            |
| ------------------- | ------------------------------------------------------------------------- | ---------------------- |
| POST                | `/auth/login` `/auth/register`                                            | Authentication         |
| GET/POST/PUT/DELETE | `/products`                                                               | Product CRUD           |
| POST                | `/products/:id/stock`                                                     | Stock adjustment       |
| GET/POST/PUT/DELETE | `/customers`                                                              | Customer CRUD + ledger |
| GET/POST/DELETE     | `/invoices`                                                               | Invoice management     |
| GET                 | `/invoices/next-no`                                                       | Next invoice number    |
| GET                 | `/reports/dashboard` `/reports/sales` `/reports/gst` `/reports/inventory` | Analytics              |
| GET/PUT             | `/company`                                                                | Company settings       |

---

## 📝 Notes

- The SQLite database is created at `server/data/ezybill.db` on first run.
- Change `JWT_SECRET` via an environment variable in production.
- Invoice print uses the browser's native print dialog → choose "Save as PDF".

## ?? Deployment Guide

### ? Pre-Deployment Checklist

Before deploying to production, follow these steps:

#### 1?? Generate Strong JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: abc123def456... (copy this)
```

#### 2?? Create .env File in server/ Directory

```bash
cd server
cp .env.example .env
# Edit .env with your production values:
```

**server/.env** (production example):

```env
PORT=4000
NODE_ENV=production
JWT_SECRET=your-64-char-random-secret-from-step-1
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

#### 3?? Environment Variables Reference

| Variable          | Required       | Example              | Description                        |
| ----------------- | -------------- | -------------------- | ---------------------------------- |
| `JWT_SECRET`      | ? Yes          | `abc123...`          | **Must be 32+ chars, kept secret** |
| `PORT`            | ? Optional     | `4000`               | Server port (default: 4000)        |
| `NODE_ENV`        | ? Optional     | `production`         | Environment (default: development) |
| `ALLOWED_ORIGINS` | ?? Recommended | `https://domain.com` | Comma-separated CORS origins       |

#### 4?? Build & Deploy

**One-Command Deployment** (Linux/Mac):

```bash
./start.sh
```

- Installs dependencies
- Seeds demo data (if first run)
- Builds React frontend
- Starts server on configured port

**Manual Deployment**:

```bash
# Install
npm run install:all

# Build
npm run build

# Start (with .env vars)
npm start
```

#### 5?? Verify Deployment

```bash
# Health check
curl http://localhost:4000/api/health

# Should return:
# {"status":"ok","service":"EzyBill Pro API","time":"2026-05-30T..."}

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ezybill.com","password":"admin123"}'
```

### ?? Security Hardening

? **Done Automatically**:

- JWT token validation on protected routes
- bcryptjs password hashing (10 rounds)
- Foreign key constraints in database
- Parameterized SQL queries (SQL injection prevention)
- Token expiry (7 days)
- CORS origin validation

?? **You Must Configure**:

- `JWT_SECRET` - Set to strong random value
- `ALLOWED_ORIGINS` - Restrict CORS to your domain(s)
- Database backups - Implement routine for `server/data/ezybill.db`
- HTTPS - Use reverse proxy (nginx) or cloud platform's SSL

### ?? Production Deployment Platforms

#### **Option A: Docker (Recommended)**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm run install:all && npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

#### **Option B: Node.js Hosting (Railway, Render, Heroku)**

- Set `JWT_SECRET` in platform environment variables
- Set `ALLOWED_ORIGINS` to your app URL
- Deploy from GitHub (automatic builds)

#### **Option C: Linux VPS (AWS/DigitalOcean)**

```bash
# After SSH into server
git clone your-repo
cd ezybill-pro
cp server/.env.example server/.env
# Edit server/.env with your secrets
npm run setup
npm start  # or use PM2/systemd to keep running
```

### ??? Security Notes for Production

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Rotate JWT_SECRET periodically** - Invalidates old tokens
3. **Use HTTPS only** - Configure reverse proxy (nginx, Caddy)
4. **Database**: Keep backups of `server/data/ezybill.db`
5. **Monitor logs** - Set up error tracking (Sentry, LogRocket)

---

_Built as an industry-grade reference implementation. � EzyBill Pro._
