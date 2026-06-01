#!/usr/bin/env bash
# EzyBill Pro - one command production startup
set -e
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
(cd server && npm install --silent)
(cd client && npm install --silent)

if [ ! -f server/data/ezybill.db ]; then
  echo "🌱 Seeding demo data..."
  (cd server && npm run seed)
fi

echo "🏗️  Building frontend..."
(cd client && npm run build)

echo "🚀 Starting EzyBill Pro on http://localhost:4000"
cd server && npm start
