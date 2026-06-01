import { Router } from 'express';
import db from '../db.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.use(auth);

router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';

  const todaySales = db.prepare("SELECT COALESCE(SUM(total),0) AS v, COUNT(*) AS c FROM invoices WHERE date = ?").get(today);
  const monthSales = db.prepare("SELECT COALESCE(SUM(total),0) AS v, COUNT(*) AS c FROM invoices WHERE date >= ?").get(monthStart);
  const totalSales = db.prepare("SELECT COALESCE(SUM(total),0) AS v, COUNT(*) AS c FROM invoices").get();
  const totalDue = db.prepare("SELECT COALESCE(SUM(total - paid),0) AS v FROM invoices WHERE status != 'paid'").get();
  const customers = db.prepare("SELECT COUNT(*) AS c FROM customers").get();
  const products = db.prepare("SELECT COUNT(*) AS c FROM products WHERE active = 1").get();
  const lowStock = db.prepare("SELECT COUNT(*) AS c FROM products WHERE active = 1 AND stock <= low_stock_alert").get();
  const stockValue = db.prepare("SELECT COALESCE(SUM(stock * purchase_price),0) AS v FROM products WHERE active = 1").get();

  // Last 7 days sales trend
  const trend = db.prepare(`
    SELECT date, COALESCE(SUM(total),0) AS total, COUNT(*) AS count
    FROM invoices WHERE date >= date('now', '-6 days')
    GROUP BY date ORDER BY date`).all();

  // Fill missing days
  const trendMap = Object.fromEntries(trend.map(t => [t.date, t]));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    days.push({ date: ds, total: trendMap[ds]?.total || 0, count: trendMap[ds]?.count || 0 });
  }

  const topProducts = db.prepare(`
    SELECT name, SUM(qty) AS qty, SUM(total) AS revenue
    FROM invoice_items GROUP BY name ORDER BY revenue DESC LIMIT 5`).all();

  const recentInvoices = db.prepare('SELECT * FROM invoices ORDER BY id DESC LIMIT 8').all();

  const paymentModes = db.prepare(`
    SELECT payment_mode, COALESCE(SUM(total),0) AS total, COUNT(*) AS count
    FROM invoices GROUP BY payment_mode`).all();

  res.json({
    todaySales, monthSales, totalSales, totalDue,
    customers: customers.c, products: products.c, lowStock: lowStock.c,
    stockValue: stockValue.v, trend: days, topProducts, recentInvoices, paymentModes
  });
});

router.get('/sales', (req, res) => {
  const { from, to } = req.query;
  const f = from || '1970-01-01';
  const t = to || '2999-12-31';
  const summary = db.prepare(`SELECT COALESCE(SUM(total),0) AS total, COALESCE(SUM(taxable_amount),0) AS taxable,
    COALESCE(SUM(cgst),0) AS cgst, COALESCE(SUM(sgst),0) AS sgst, COALESCE(SUM(igst),0) AS igst,
    COALESCE(SUM(paid),0) AS paid, COUNT(*) AS count FROM invoices WHERE date BETWEEN ? AND ?`).get(f, t);
  const invoices = db.prepare('SELECT * FROM invoices WHERE date BETWEEN ? AND ? ORDER BY date DESC, id DESC').all(f, t);
  res.json({ summary, invoices });
});

// GSTR-style tax report
router.get('/gst', (req, res) => {
  const { from, to } = req.query;
  const f = from || '1970-01-01';
  const t = to || '2999-12-31';
  const byRate = db.prepare(`
    SELECT ii.tax_rate,
      COALESCE(SUM(ii.taxable),0) AS taxable,
      COALESCE(SUM(CASE WHEN i.is_interstate = 0 THEN ii.tax_amount/2 ELSE 0 END),0) AS cgst,
      COALESCE(SUM(CASE WHEN i.is_interstate = 0 THEN ii.tax_amount/2 ELSE 0 END),0) AS sgst,
      COALESCE(SUM(CASE WHEN i.is_interstate = 1 THEN ii.tax_amount ELSE 0 END),0) AS igst,
      COALESCE(SUM(ii.tax_amount),0) AS total_tax
    FROM invoice_items ii JOIN invoices i ON ii.invoice_id = i.id
    WHERE i.date BETWEEN ? AND ?
    GROUP BY ii.tax_rate ORDER BY ii.tax_rate`).all(f, t);
  res.json({ byRate });
});

router.get('/inventory', (req, res) => {
  const products = db.prepare(`SELECT p.*, c.name AS category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id WHERE p.active = 1 ORDER BY p.name`).all();
  const totalValue = products.reduce((s, p) => s + p.stock * p.purchase_price, 0);
  const totalRetail = products.reduce((s, p) => s + p.stock * p.selling_price, 0);
  res.json({ products, totalValue, totalRetail });
});

export default router;
