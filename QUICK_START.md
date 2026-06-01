# 🚀 UniBill — Quick Start (2 minutes)

## Installation

```bash
# 1. Install all dependencies
npm run install:all

# 2. Create database & demo data
npm run seed

# 3a. PRODUCTION MODE (single port)
npm run build && npm start
# → Open http://localhost:4000

# 3b. OR DEVELOPMENT MODE (hot reload)
# Terminal 1:
npm run dev:server

# Terminal 2:
npm run dev:client
# → Open http://localhost:5173
```

---

## 🔑 Login Credentials

**Admin** (full access)

- Email: `admin@unibill.com`
- Password: `admin123`

**Cashier** (POS only)

- Email: `cashier@unibill.com`
- Password: `cashier123`

---

## ⚡ Key Features

- **POS**: Fast invoice creation with GST calculation
- **Invoices**: Print/PDF ready with auto-numbering
- **Products**: Inventory with automatic stock deduction
- **Customers**: Ledger tracking with opening balance
- **Reports**: Sales, GST, inventory, and more
- **Settings**: Company profile, GSTIN, bank details

---

## 📋 Common Commands

```bash
npm run dev              # Start both servers (requires 2 terminals)
npm run seed            # Reset database with demo data
npm run build           # Build production frontend
npm start               # Start production server
npm run setup:env       # Generate production .env file
```

---

## 🐛 Troubleshooting

**Port already in use?**

```bash
# Find process on port 4000 and kill it
# Or use a different port:
export PORT=5000
npm run dev:server
```

**Database error?**

```bash
# Clear and rebuild database
npm run seed
```

**Build failed?**

```bash
# Reinstall dependencies
rm -rf node_modules server/node_modules client/node_modules
npm run install:all
```

---

## 📚 Documentation

- **Full Setup Guide**: `LOCAL_SETUP.md` (comprehensive step-by-step)
- **Main Readme**: `README.md` (features & architecture)
- **Architecture Overview**: See `LOCAL_SETUP.md` section "📂 Project Structure"

---

## 🌍 Access URLs

| Component    | URL                              | Port |
| ------------ | -------------------------------- | ---- |
| Frontend     | http://localhost:5173            | 5173 |
| Backend API  | http://localhost:4000/api        | 4000 |
| Health Check | http://localhost:4000/api/health | 4000 |

---

**Need help?** → Read `LOCAL_SETUP.md` for detailed troubleshooting
