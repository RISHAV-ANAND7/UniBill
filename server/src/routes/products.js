import { Router } from "express";
import db from "../db.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(auth);

// Categories
router.get("/categories", (req, res) => {
  res.json(db.prepare("SELECT * FROM categories ORDER BY name").all());
});
router.post("/categories", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name required" });
  try {
    const info = db
      .prepare("INSERT INTO categories (name) VALUES (?)")
      .run(name.trim());
    res.json({ id: info.lastInsertRowid, name: name.trim() });
  } catch {
    res.status(409).json({ error: "Category already exists" });
  }
});
router.delete("/categories/:id", (req, res) => {
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Products
router.get("/", (req, res) => {
  const { search, category, lowstock } = req.query;
  let sql = `SELECT p.*, c.name AS category_name FROM products p
             LEFT JOIN categories c ON p.category_id = c.id WHERE p.active = 1`;
  const params = [];
  if (search) {
    sql +=
      " AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.hsn LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (category) {
    sql += " AND p.category_id = ?";
    params.push(category);
  }
  if (lowstock === "1") sql += " AND p.stock <= p.low_stock_alert";
  sql += " ORDER BY p.name";
  res.json(db.prepare(sql).all(...params));
});

router.get("/:id", (req, res) => {
  const p = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found" });
  res.json(p);
});

router.post("/", (req, res) => {
  const b = req.body;
  const info = db
    .prepare(
      `INSERT INTO products
    (name, sku, hsn, category_id, unit, purchase_price, selling_price, tax_rate, stock, low_stock_alert, barcode)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      b.name,
      b.sku || "",
      b.hsn || "",
      b.category_id || null,
      b.unit || "PCS",
      b.purchase_price || 0,
      b.selling_price || 0,
      b.tax_rate ?? 18,
      b.stock || 0,
      b.low_stock_alert ?? 5,
      b.barcode || "",
    );
  if (b.stock > 0) {
    db.prepare(
      "INSERT INTO stock_movements (product_id, type, qty, reference) VALUES (?, ?, ?, ?)",
    ).run(info.lastInsertRowid, "opening", b.stock, "Opening stock");
  }
  res.json(
    db.prepare("SELECT * FROM products WHERE id = ?").get(info.lastInsertRowid),
  );
});

router.put("/:id", (req, res) => {
  const b = req.body;
  db.prepare(
    `UPDATE products SET name=?, sku=?, hsn=?, category_id=?, unit=?,
    purchase_price=?, selling_price=?, tax_rate=?, stock=?, low_stock_alert=?, barcode=? WHERE id=?`,
  ).run(
    b.name,
    b.sku || "",
    b.hsn || "",
    b.category_id || null,
    b.unit || "PCS",
    b.purchase_price || 0,
    b.selling_price || 0,
    b.tax_rate ?? 18,
    b.stock || 0,
    b.low_stock_alert ?? 5,
    b.barcode || "",
    req.params.id,
  );
  res.json(
    db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id),
  );
});

router.post("/:id/stock", (req, res) => {
  const { qty, type, reference } = req.body;
  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  const delta = type === "out" ? -Math.abs(qty) : Math.abs(qty);
  db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(
    delta,
    req.params.id,
  );
  db.prepare(
    "INSERT INTO stock_movements (product_id, type, qty, reference) VALUES (?, ?, ?, ?)",
  ).run(
    req.params.id,
    type || "adjustment",
    delta,
    reference || "Manual adjustment",
  );
  res.json(
    db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id),
  );
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  db.prepare("UPDATE products SET active = 0 WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
