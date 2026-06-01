import { Router } from "express";
import db from "../db.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

function generateInvoiceNo() {
  const company = db
    .prepare("SELECT invoice_prefix FROM company WHERE id = 1")
    .get();
  const prefix = company?.invoice_prefix || "INV";
  const year = new Date().getFullYear();
  const fy =
    new Date().getMonth() >= 3
      ? `${year}-${(year + 1).toString().slice(2)}`
      : `${year - 1}-${year.toString().slice(2)}`;
  const count = db
    .prepare("SELECT COUNT(*) AS c FROM invoices WHERE invoice_no LIKE ?")
    .get(`${prefix}/${fy}/%`).c;
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}/${fy}/${seq}`;
}

// List invoices with filters
router.get("/", (req, res) => {
  const { search, status, from, to } = req.query;
  let sql = "SELECT * FROM invoices WHERE 1=1";
  const params = [];
  if (search) {
    sql += " AND (invoice_no LIKE ? OR customer_name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (from) {
    sql += " AND date >= ?";
    params.push(from);
  }
  if (to) {
    sql += " AND date <= ?";
    params.push(to);
  }
  sql += " ORDER BY id DESC";
  res.json(db.prepare(sql).all(...params));
});

router.get("/next-no", (req, res) => {
  res.json({ invoice_no: generateInvoiceNo() });
});

router.get("/:id", (req, res) => {
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE id = ?")
    .get(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  invoice.items = db
    .prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
    .all(req.params.id);
  res.json(invoice);
});

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

router.post("/", (req, res) => {
  const b = req.body;
  if (!b.items || b.items.length === 0)
    return res.status(400).json({ error: "At least one item is required" });

  // Check stock availability for all items
  for (const item of b.items) {
    if (item.product_id) {
      const product = db
        .prepare("SELECT stock FROM products WHERE id = ?")
        .get(item.product_id);
      if (!product || product.stock < item.qty) {
        return res
          .status(400)
          .json({
            error: `Insufficient stock for item: ${item.name}. Available: ${product?.stock || 0}, Requested: ${item.qty}`,
          });
      }
    }
  }

  const company = db
    .prepare("SELECT state_code FROM company WHERE id = 1")
    .get();
  const companyState = company?.state_code || "29";
  const custStateCode = b.customer_state_code || companyState;
  const isInterstate = custStateCode !== companyState ? 1 : 0;

  // Compute line items
  let subtotal = 0,
    totalTaxable = 0,
    totalCgst = 0,
    totalSgst = 0,
    totalIgst = 0;
  const computed = b.items.map((it) => {
    const lineGross = round2(it.qty * it.price);
    const lineDiscount = round2(it.discount || 0);
    const taxable = round2(lineGross - lineDiscount);
    const taxAmount = round2((taxable * (it.tax_rate || 0)) / 100);
    const total = round2(taxable + taxAmount);
    subtotal += lineGross;
    totalTaxable += taxable;
    if (isInterstate) {
      totalIgst += taxAmount;
    } else {
      totalCgst += taxAmount / 2;
      totalSgst += taxAmount / 2;
    }
    return { ...it, taxable, tax_amount: taxAmount, total };
  });

  // Invoice-level discount
  let invoiceDiscount = 0;
  if (b.discount) {
    invoiceDiscount =
      b.discount_type === "percent"
        ? round2((subtotal * b.discount) / 100)
        : round2(b.discount);
  }

  subtotal = round2(subtotal);
  const taxableBeforeDiscount = totalTaxable;
  totalTaxable = round2(totalTaxable - invoiceDiscount);
  
  // Re-proportion GST based on discount ratio
  let discountRatio = 1;
  if (taxableBeforeDiscount > 0 && invoiceDiscount > 0) {
    discountRatio = totalTaxable / taxableBeforeDiscount;
  }
  totalCgst = round2(totalCgst * discountRatio);
  totalSgst = round2(totalSgst * discountRatio);
  totalIgst = round2(totalIgst * discountRatio);

  const rawTotal = totalTaxable + totalCgst + totalSgst + totalIgst;
  const grandTotal = Math.round(rawTotal);
  const roundOff = round2(grandTotal - rawTotal);

  const invoiceNo = b.invoice_no || generateInvoiceNo();
  const paid = b.paid ?? grandTotal;
  const status = paid >= grandTotal ? "paid" : paid > 0 ? "partial" : "unpaid";

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO invoices
      (invoice_no, customer_id, customer_name, customer_gstin, customer_state_code, date,
       subtotal, discount, discount_type, taxable_amount, cgst, sgst, igst, round_off, total,
       paid, payment_mode, status, is_interstate, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        invoiceNo,
        b.customer_id || null,
        b.customer_name || "Walk-in Customer",
        b.customer_gstin || "",
        custStateCode,
        b.date || new Date().toISOString().slice(0, 10),
        subtotal,
        b.discount || 0,
        b.discount_type || "amount",
        totalTaxable,
        totalCgst,
        totalSgst,
        totalIgst,
        roundOff,
        grandTotal,
        paid,
        b.payment_mode || "Cash",
        status,
        isInterstate,
        b.notes || "",
      );
    const invoiceId = info.lastInsertRowid;

    const itemStmt = db.prepare(`INSERT INTO invoice_items
      (invoice_id, product_id, name, hsn, qty, unit, price, discount, tax_rate, taxable, tax_amount, total)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const it of computed) {
      itemStmt.run(
        invoiceId,
        it.product_id || null,
        it.name,
        it.hsn || "",
        it.qty,
        it.unit || "PCS",
        it.price,
        it.discount || 0,
        it.tax_rate || 0,
        it.taxable,
        it.tax_amount,
        it.total,
      );
      if (it.product_id) {
        db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(
          it.qty,
          it.product_id,
        );
        db.prepare(
          "INSERT INTO stock_movements (product_id, type, qty, reference) VALUES (?, ?, ?, ?)",
        ).run(it.product_id, "sale", -it.qty, invoiceNo);
      }
    }
    return invoiceId;
  });

  const id = tx();
  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
  invoice.items = db
    .prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
    .all(id);
  res.json(invoice);
});

router.patch("/:id/payment", (req, res) => {
  const { paid } = req.body;
  const invoice = db
    .prepare("SELECT * FROM invoices WHERE id = ?")
    .get(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  const status =
    paid >= invoice.total ? "paid" : paid > 0 ? "partial" : "unpaid";
  db.prepare("UPDATE invoices SET paid = ?, status = ? WHERE id = ?").run(
    paid,
    status,
    req.params.id,
  );
  res.json(
    db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id),
  );
});

router.delete("/:id", (req, res) => {
  const items = db
    .prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
    .all(req.params.id);
  const tx = db.transaction(() => {
    for (const it of items) {
      if (it.product_id) {
        db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(
          it.qty,
          it.product_id,
        );
      }
    }
    db.prepare("DELETE FROM invoices WHERE id = ?").run(req.params.id);
  });
  tx();
  res.json({ ok: true });
});

export default router;
