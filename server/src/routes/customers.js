import { Router } from "express";
import db from "../db.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(auth);

router.get("/", (req, res) => {
  const { search } = req.query;
  let sql = `SELECT c.*,
    (SELECT COUNT(*) FROM invoices i WHERE i.customer_id = c.id) AS invoice_count,
    (SELECT COALESCE(SUM(i.total),0) FROM invoices i WHERE i.customer_id = c.id) AS total_business,
    (SELECT COALESCE(SUM(i.total - i.paid),0) FROM invoices i WHERE i.customer_id = c.id) + c.opening_balance AS due_amount
    FROM customers c`;
  const params = [];
  if (search) {
    sql += " WHERE c.name LIKE ? OR c.phone LIKE ? OR c.gstin LIKE ?";
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  sql += " ORDER BY c.name";
  res.json(db.prepare(sql).all(...params));
});

router.get("/:id", (req, res) => {
  const c = db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  const invoices = db
    .prepare(
      "SELECT * FROM invoices WHERE customer_id = ? ORDER BY date DESC, id DESC",
    )
    .all(req.params.id);
  res.json({ ...c, invoices });
});

router.post("/", (req, res) => {
  const b = req.body;
  if (!b.name) return res.status(400).json({ error: "Customer name required" });
  const info = db
    .prepare(
      `INSERT INTO customers
    (name, phone, email, gstin, address, state, state_code, opening_balance)
    VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(
      b.name,
      b.phone || "",
      b.email || "",
      b.gstin || "",
      b.address || "",
      b.state || "Karnataka",
      b.state_code || "29",
      b.opening_balance || 0,
    );
  res.json(
    db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(info.lastInsertRowid),
  );
});

router.put("/:id", (req, res) => {
  const b = req.body;
  db.prepare(
    `UPDATE customers SET name=?, phone=?, email=?, gstin=?, address=?, state=?, state_code=?, opening_balance=? WHERE id=?`,
  ).run(
    b.name,
    b.phone || "",
    b.email || "",
    b.gstin || "",
    b.address || "",
    b.state || "Karnataka",
    b.state_code || "29",
    b.opening_balance || 0,
    req.params.id,
  );
  res.json(
    db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id),
  );
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
