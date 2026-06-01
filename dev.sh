#!/usr/bin/env bash
# EzyBill Pro - development mode (hot reload, two servers)
set -e
cd "$(dirname "$0")"
(cd server && npm run dev) &
SERVER_PID=$!
(cd client && npm run dev)
kill $SERVER_PID 2>/dev/null || true
