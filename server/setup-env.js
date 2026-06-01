#!/usr/bin/env node
/**
 * UniBill - Environment Setup Helper
 * Generates required environment variables for production deployment
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

const generateSecret = (length = 32) =>
  crypto.randomBytes(length).toString("hex");

console.log("\n🔐 UniBill - Deployment Configuration Generator\n");

const currentDir = path.dirname(new URL(import.meta.url).pathname);
const envPath = path.join(currentDir, ".env");

// Check if .env exists
if (fs.existsSync(envPath)) {
  console.log("⚠️  .env file already exists at:", envPath);
  console.log("   Skipping generation to preserve existing configuration.\n");
  process.exit(0);
}

// Generate secrets
const jwtSecret = generateSecret(32);

// Create .env file content
const envContent = `# UniBill - Generated Configuration
# Generated: ${new Date().toISOString()}

# Server Configuration
PORT=4000
NODE_ENV=production

# Security - MUST be kept secret
JWT_SECRET=${jwtSecret}

# CORS - Restrict to your domain
# For development: http://localhost:5173,http://localhost:4000
# For production: https://yourdomain.com,https://app.yourdomain.com
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4000

# Database (optional - uses default location by default)
# DATABASE_PATH=./data/unibill.db

# Logging (optional)
# LOG_LEVEL=info
`;

// Write .env file
fs.writeFileSync(envPath, envContent, { mode: 0o600 });
console.log("✅ Created .env file at:", envPath);
console.log("   (permissions: readable by owner only)\n");

console.log("🔑 Generated JWT_SECRET:");
console.log(`   ${jwtSecret}\n`);

console.log("📋 Configuration Checklist:\n");
console.log("1. ✅ JWT_SECRET generated");
console.log("2. ⚠️  Review .env and update ALLOWED_ORIGINS for your domain");
console.log("3. ⚠️  Never commit .env file (already in .gitignore)");
console.log("4. ✅ Ready to start: npm start\n");

console.log("🚀 Quick Start:");
console.log("   cd server");
console.log("   npm install");
console.log("   cd ..");
console.log("   npm run build");
console.log("   npm start\n");
