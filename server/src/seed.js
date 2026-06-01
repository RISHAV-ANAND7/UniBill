import db from "./db.js";
import bcrypt from "bcryptjs";

console.log("🌱 Seeding UniBill database...");

// Reset
db.exec(`DELETE FROM invoice_items; DELETE FROM invoices; DELETE FROM stock_movements;
  DELETE FROM products; DELETE FROM categories; DELETE FROM customers; DELETE FROM users;`);

// Admin user
const pass = bcrypt.hashSync("admin123", 10);
db.prepare(
  "INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)",
).run("Admin", "admin@unibill.com", pass, "admin");
const cashierPass = bcrypt.hashSync("cashier123", 10);
db.prepare(
  "INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)",
).run("Cashier", "cashier@unibill.com", cashierPass, "cashier");

// Company
db.prepare(
  `UPDATE company SET name=?, gstin=?, phone=?, email=?, address=?, state=?, state_code=?,
  bank_name=?, bank_account=?, bank_ifsc=?, invoice_prefix=? WHERE id=1`,
).run(
  "Sharma Electronics & Hardware",
  "29ABCDE1234F1Z5",
  "+91 98765 43210",
  "sales@sharmaelectronics.in",
  "142, MG Road, Commercial Street\nBengaluru - 560001",
  "Karnataka",
  "29",
  "HDFC Bank",
  "50100123456789",
  "HDFC0001234",
  "INV",
);

// Categories
const cats = [
  "Electronics",
  "Hardware",
  "Mobile Accessories",
  "Home Appliances",
  "Stationery",
];
const catIds = {};
for (const c of cats) {
  const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(c);
  catIds[c] = info.lastInsertRowid;
}

// Products
const products = [
  [
    "LED Bulb 9W Philips",
    "ELEC-001",
    "8539",
    "Electronics",
    "PCS",
    60,
    99,
    12,
    150,
    20,
  ],
  [
    "Extension Board 4 Socket",
    "ELEC-002",
    "8536",
    "Electronics",
    "PCS",
    180,
    299,
    18,
    80,
    15,
  ],
  [
    "USB-C Cable 1m",
    "MOB-001",
    "8544",
    "Mobile Accessories",
    "PCS",
    45,
    149,
    18,
    200,
    30,
  ],
  [
    "Power Bank 10000mAh",
    "MOB-002",
    "8507",
    "Mobile Accessories",
    "PCS",
    650,
    1199,
    18,
    45,
    10,
  ],
  [
    "Phone Tempered Glass",
    "MOB-003",
    "7007",
    "Mobile Accessories",
    "PCS",
    25,
    99,
    18,
    300,
    50,
  ],
  [
    "Hammer Steel 500g",
    "HW-001",
    "8205",
    "Hardware",
    "PCS",
    120,
    249,
    18,
    60,
    10,
  ],
  [
    "Screwdriver Set 6pc",
    "HW-002",
    "8205",
    "Hardware",
    "SET",
    150,
    349,
    18,
    40,
    8,
  ],
  [
    "Drill Machine 13mm",
    "HW-003",
    "8467",
    "Hardware",
    "PCS",
    1800,
    2999,
    18,
    12,
    5,
  ],
  [
    "Ceiling Fan 1200mm",
    "HA-001",
    "8414",
    "Home Appliances",
    "PCS",
    1100,
    1899,
    18,
    25,
    5,
  ],
  [
    "Electric Kettle 1.5L",
    "HA-002",
    "8516",
    "Home Appliances",
    "PCS",
    550,
    999,
    18,
    30,
    6,
  ],
  [
    "Mixer Grinder 500W",
    "HA-003",
    "8509",
    "Home Appliances",
    "PCS",
    1600,
    2799,
    18,
    18,
    4,
  ],
  [
    "A4 Paper Ream 500",
    "STA-001",
    "4802",
    "Stationery",
    "PCS",
    230,
    320,
    12,
    100,
    20,
  ],
  [
    "Ball Pen Blue (Box)",
    "STA-002",
    "9608",
    "Stationery",
    "BOX",
    80,
    150,
    12,
    70,
    15,
  ],
  [
    "Notebook 200 Pages",
    "STA-003",
    "4820",
    "Stationery",
    "PCS",
    35,
    65,
    12,
    250,
    40,
  ],
  [
    'Smart LED TV 32"',
    "ELEC-003",
    "8528",
    "Electronics",
    "PCS",
    9500,
    14999,
    18,
    8,
    3,
  ],
];
const prodStmt = db.prepare(`INSERT INTO products
  (name, sku, hsn, category_id, unit, purchase_price, selling_price, tax_rate, stock, low_stock_alert)
  VALUES (?,?,?,?,?,?,?,?,?,?)`);
const prodIds = [];
for (const p of products) {
  const info = prodStmt.run(
    p[0],
    p[1],
    p[2],
    catIds[p[3]],
    p[4],
    p[5],
    p[6],
    p[7],
    p[8],
    p[9],
  );
  prodIds.push({
    id: info.lastInsertRowid,
    name: p[0],
    hsn: p[2],
    price: p[6],
    tax: p[7],
    unit: p[4],
  });
}

// Customers
const customers = [
  [
    "Rajesh Kumar",
    "+91 99001 11223",
    "rajesh@gmail.com",
    "29AAAAA0000A1Z5",
    "12 Jayanagar, Bengaluru",
    "Karnataka",
    "29",
  ],
  [
    "Priya Enterprises",
    "+91 98800 22334",
    "priya@enterprises.in",
    "29BBBBB1111B1Z5",
    "45 Indiranagar, Bengaluru",
    "Karnataka",
    "29",
  ],
  [
    "Tamil Traders",
    "+91 95000 33445",
    "info@tamiltraders.in",
    "33CCCCC2222C1Z5",
    "78 Anna Salai, Chennai",
    "Tamil Nadu",
    "33",
  ],
  [
    "Mumbai Supplies Co",
    "+91 90000 44556",
    "sales@mumbaisupplies.in",
    "27DDDDD3333D1Z5",
    "23 Andheri, Mumbai",
    "Maharashtra",
    "27",
  ],
  ["Walk-in Customer", "", "", "", "", "Karnataka", "29"],
];
const custStmt = db.prepare(
  `INSERT INTO customers (name, phone, email, gstin, address, state, state_code) VALUES (?,?,?,?,?,?,?)`,
);
const custIds = [];
for (const c of customers) custIds.push(custStmt.run(...c).lastInsertRowid);

// Generate sample invoices over last 30 days
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const companyState = "29";
const paymentModes = ["Cash", "UPI", "Card", "Credit"];

function fy(date) {
  const y = date.getFullYear();
  return date.getMonth() >= 3
    ? `${y}-${(y + 1).toString().slice(2)}`
    : `${y - 1}-${y.toString().slice(2)}`;
}

let invCounter = {};
for (let d = 30; d >= 0; d--) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  const dateStr = date.toISOString().slice(0, 10);
  const numInvoices = Math.floor(Math.random() * 4) + 1;
  for (let n = 0; n < numInvoices; n++) {
    const cust = customers[Math.floor(Math.random() * customers.length)];
    const custIdx = customers.indexOf(cust);
    const custStateCode = cust[6];
    const isInterstate = custStateCode !== companyState ? 1 : 0;

    const numItems = Math.floor(Math.random() * 4) + 1;
    const items = [];
    let subtotal = 0,
      taxable = 0,
      cgst = 0,
      sgst = 0,
      igst = 0;
    for (let i = 0; i < numItems; i++) {
      const p = prodIds[Math.floor(Math.random() * prodIds.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const lineGross = round2(qty * p.price);
      const lineTaxable = lineGross;
      const taxAmt = round2((lineTaxable * p.tax) / 100);
      subtotal += lineGross;
      taxable += lineTaxable;
      if (isInterstate) igst += taxAmt;
      else {
        cgst += taxAmt / 2;
        sgst += taxAmt / 2;
      }
      items.push({
        ...p,
        qty,
        lineTaxable,
        taxAmt,
        total: round2(lineTaxable + taxAmt),
      });
    }
    cgst = round2(cgst);
    sgst = round2(sgst);
    igst = round2(igst);
    taxable = round2(taxable);
    const raw = taxable + cgst + sgst + igst;
    const total = Math.round(raw);
    const roundOff = round2(total - raw);

    const fyStr = fy(date);
    const key = `INV/${fyStr}`;
    invCounter[key] = (invCounter[key] || 0) + 1;
    const invoiceNo = `${key}/${String(invCounter[key]).padStart(4, "0")}`;

    const pm = paymentModes[Math.floor(Math.random() * paymentModes.length)];
    const paid =
      pm === "Credit" ? (Math.random() > 0.5 ? 0 : round2(total * 0.5)) : total;
    const status = paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid";

    const info = db
      .prepare(
        `INSERT INTO invoices
      (invoice_no, customer_id, customer_name, customer_gstin, customer_state_code, date,
       subtotal, taxable_amount, cgst, sgst, igst, round_off, total, paid, payment_mode, status, is_interstate)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        invoiceNo,
        custIds[custIdx],
        cust[0],
        cust[3],
        custStateCode,
        dateStr,
        round2(subtotal),
        taxable,
        cgst,
        sgst,
        igst,
        roundOff,
        total,
        paid,
        pm,
        status,
        isInterstate,
      );
    const invId = info.lastInsertRowid;
    for (const it of items) {
      db.prepare(
        `INSERT INTO invoice_items
        (invoice_id, product_id, name, hsn, qty, unit, price, tax_rate, taxable, tax_amount, total)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        invId,
        it.id,
        it.name,
        it.hsn,
        it.qty,
        it.unit,
        it.price,
        it.tax,
        it.lineTaxable,
        it.taxAmt,
        it.total,
      );
    }
  }
}

console.log("✅ Seed complete!");
console.log("   Admin login: admin@ezybill.com / admin123");
console.log("   Cashier login: cashier@ezybill.com / cashier123");
console.log(
  `   ${db.prepare("SELECT COUNT(*) AS c FROM invoices").get().c} invoices, ${products.length} products, ${customers.length} customers`,
);
process.exit(0);
