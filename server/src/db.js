import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "unibill.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'My Company',
  gstin TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  state TEXT DEFAULT 'Karnataka',
  state_code TEXT DEFAULT '29',
  logo TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  bank_ifsc TEXT DEFAULT '',
  terms TEXT DEFAULT 'Goods once sold will not be taken back.',
  invoice_prefix TEXT DEFAULT 'INV',
  currency TEXT DEFAULT '₹'
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT,
  hsn TEXT DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  unit TEXT DEFAULT 'PCS',
  purchase_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  tax_rate REAL DEFAULT 18,
  stock REAL DEFAULT 0,
  low_stock_alert REAL DEFAULT 5,
  barcode TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  address TEXT DEFAULT '',
  state TEXT DEFAULT 'Karnataka',
  state_code TEXT DEFAULT '29',
  opening_balance REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT DEFAULT 'Walk-in Customer',
  customer_gstin TEXT DEFAULT '',
  customer_state_code TEXT DEFAULT '29',
  date TEXT DEFAULT (date('now')),
  subtotal REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  discount_type TEXT DEFAULT 'amount',
  taxable_amount REAL DEFAULT 0,
  cgst REAL DEFAULT 0,
  sgst REAL DEFAULT 0,
  igst REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  total REAL DEFAULT 0,
  paid REAL DEFAULT 0,
  payment_mode TEXT DEFAULT 'Cash',
  status TEXT DEFAULT 'paid',
  is_interstate INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  hsn TEXT DEFAULT '',
  qty REAL NOT NULL,
  unit TEXT DEFAULT 'PCS',
  price REAL NOT NULL,
  discount REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  taxable REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  qty REAL NOT NULL,
  reference TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Ensure single company row exists
const companyExists = db.prepare("SELECT id FROM company WHERE id = 1").get();
if (!companyExists) {
  db.prepare("INSERT INTO company (id, name) VALUES (1, ?)").run(
    "EzyBill Pro Store",
  );
}

export default db;
