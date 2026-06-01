import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable is required in production",
    );
  }
  console.warn(
    "⚠️  JWT_SECRET not set, using development default. MUST be set in production!",
  );
}

export function signToken(payload) {
  return jwt.sign(
    payload,
    JWT_SECRET || "unibill-dev-secret-change-in-production",
    { expiresIn: "7d" },
  );
}

export function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(
      token,
      JWT_SECRET || "unibill-dev-secret-change-in-production",
    );
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
