import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import customerRoutes from "./routes/customers.js";
import invoiceRoutes from "./routes/invoices.js";
import reportRoutes from "./routes/reports.js";
import companyRoutes from "./routes/company.js";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS configuration - restrict to allowed origins
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:4000"
).split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.some((allowed) => origin.includes(allowed.trim()))
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    service: "UniBill API",
    time: new Date().toISOString(),
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/company", companyRoutes);

// Serve built frontend in production
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api"))
      return res.status(404).json({ error: "Not found" });
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ EzyBill Pro API running on http://localhost:${PORT}`),
);
