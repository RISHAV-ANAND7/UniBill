import { Router } from "express";
import db from "../db.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", auth, (req, res) => {
  res.json(db.prepare("SELECT * FROM company WHERE id = 1").get());
});

router.put("/", auth, requireRole("admin"), (req, res) => {
  const b = req.body;
  db.prepare(
    `UPDATE company SET name=?, gstin=?, phone=?, email=?, address=?, state=?, state_code=?,
    logo=?, bank_name=?, bank_account=?, bank_ifsc=?, terms=?, invoice_prefix=?, currency=? WHERE id=1`,
  ).run(
    b.name || "My Company",
    b.gstin || "",
    b.phone || "",
    b.email || "",
    b.address || "",
    b.state || "Karnataka",
    b.state_code || "29",
    b.logo || "",
    b.bank_name || "",
    b.bank_account || "",
    b.bank_ifsc || "",
    b.terms || "",
    b.invoice_prefix || "INV",
    b.currency || "₹",
  );
  res.json(db.prepare("SELECT * FROM company WHERE id = 1").get());
});

export default router;
