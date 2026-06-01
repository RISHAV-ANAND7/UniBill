# 🚀 EzyBill Pro - Deployment Guide

## ✅ Pre-Deployment Checklist

- [ ] Node.js 20+ installed
- [ ] .env file created with strong JWT_SECRET
- [ ] ALLOWED_ORIGINS configured for your domain
- [ ] Build tested locally (`npm run build`)
- [ ] Database backup strategy planned
- [ ] HTTPS/SSL certificate ready (for production)
- [ ] Reverse proxy configured (nginx/Caddy)

---

## 🔑 Step 1: Generate Secrets

```bash
# Generate a strong JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output example:

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0
```

Copy this value - you'll need it in the next step.

---

## 🔧 Step 2: Configure Environment

### Option A: Automatic Setup (Recommended)

```bash
cd server
npm run setup-env
# Edits .env with your production values
```

### Option B: Manual Setup

```bash
cd server
cp .env.example .env
# Edit .env with a text editor
```

**server/.env** (production example):

```env
PORT=4000
NODE_ENV=production
JWT_SECRET=your-64-char-secret-from-step-1
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Environment Variables Reference

| Variable          | Required       | Type   | Default             | Notes                        |
| ----------------- | -------------- | ------ | ------------------- | ---------------------------- |
| `JWT_SECRET`      | ✅ Yes         | string | none                | **32+ chars, keep secret!**  |
| `PORT`            | ❌ No          | number | 4000                | Server port                  |
| `NODE_ENV`        | ❌ No          | string | development         | Set to `production` for prod |
| `ALLOWED_ORIGINS` | ⚠️ Recommended | string | localhost:5173,4000 | Comma-separated CORS origins |

---

## 🏗️ Step 3: Build Application

```bash
# From project root
npm run install:all    # Install all dependencies
npm run seed          # Optional: Load demo data
npm run build         # Build React frontend
```

Expected output:

- ✅ `client/dist/` folder created
- ✅ `server/data/ezybill.db` created (if first run)

---

## 🚀 Step 4: Start Server

### Linux/Mac

```bash
./start.sh
```

### Windows

```bash
start-prod.bat
```

### Manual

```bash
cd server
npm start
```

Expected output:

```
✅ EzyBill Pro API running on http://localhost:4000
```

---

## ✔️ Step 5: Verify Deployment

### Test Health Endpoint

```bash
curl http://localhost:4000/api/health

# Expected response:
# {
#   "status": "ok",
#   "service": "EzyBill Pro API",
#   "time": "2026-05-30T12:34:56.789Z"
# }
```

### Test Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ezybill.com","password":"admin123"}'

# Expected response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "user": {
#     "id": 1,
#     "name": "Admin",
#     "email": "admin@ezybill.com",
#     "role": "admin"
#   }
# }
```

### Access Web UI

- Open: **http://localhost:4000**
- Login with: `admin@ezybill.com` / `admin123`

---

## 📦 Production Deployment Platforms

### Option A: Docker (Recommended for Scalability)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm run install:all && npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

Build & run:

```bash
docker build -t ezybill-pro .
docker run -p 4000:4000 \
  -e JWT_SECRET="your-secret" \
  -e ALLOWED_ORIGINS="https://yourdomain.com" \
  -v ezybill-data:/app/server/data \
  ezybill-pro
```

### Option B: Node.js Hosting (Railway, Render, Heroku)

1. Connect GitHub repository
2. Set environment variables in platform dashboard:
   - `JWT_SECRET` = your-64-char-secret
   - `ALLOWED_ORIGINS` = your-domain
   - `NODE_ENV` = production
3. Platform auto-deploys on git push

### Option C: Linux VPS (DigitalOcean, AWS, Linode)

```bash
# SSH into server
ssh user@your-vps-ip

# Clone repository
git clone https://github.com/your-org/ezybill-pro.git
cd ezybill-pro

# Create .env
cp server/.env.example server/.env
# Edit with your secrets
nano server/.env

# Setup
npm run setup

# Run with PM2 (keep running)
npm install -g pm2
pm2 start "npm start" --name ezybill-pro
pm2 startup
pm2 save
```

### Option D: Systemd Service (Linux)

Create `/etc/systemd/system/ezybill-pro.service`:

```ini
[Unit]
Description=EzyBill Pro GST Billing ERP
After=network.target

[Service]
Type=simple
User=ezybill
WorkingDirectory=/opt/ezybill-pro
EnvironmentFile=/opt/ezybill-pro/server/.env
ExecStart=/usr/bin/node /opt/ezybill-pro/server/src/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable & start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ezybill-pro
sudo systemctl start ezybill-pro
sudo systemctl status ezybill-pro
```

---

## 🔐 Production Security Checklist

### Authentication & Authorization ✅

- [x] JWT tokens (7-day expiry)
- [x] bcryptjs password hashing (10 rounds)
- [x] Role-based access control (admin/cashier)

### Data Protection ⚠️ You Must Configure

- [ ] **JWT_SECRET** - Set to strong random value (not default)
- [ ] **HTTPS** - Configure SSL/TLS certificate
- [ ] **CORS** - Restrict to your domain(s)
- [ ] **Database backups** - Regular backups of `server/data/ezybill.db`
- [ ] **Rate limiting** - Consider adding to auth endpoints

### Server Hardening

- [ ] Set `NODE_ENV=production`
- [ ] Use reverse proxy (nginx, Caddy)
- [ ] Enable HTTP/2
- [ ] Set security headers (Helmet middleware - can add)
- [ ] Monitor logs (Sentry, ELK stack)
- [ ] Set up uptime monitoring (Uptime Robot, Pingdom)

### Database Backup Strategy

**Automated daily backup** (using cron):

```bash
# Add to crontab: 0 2 * * * /opt/ezybill-pro/backup.sh
#!/bin/bash
BACKUP_DIR="/backups/ezybill"
mkdir -p $BACKUP_DIR
cp /opt/ezybill-pro/server/data/ezybill.db \
   $BACKUP_DIR/ezybill-$(date +%Y%m%d-%H%M%S).db
# Keep last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

---

## 🔧 Nginx Reverse Proxy Configuration

```nginx
upstream ezybill_api {
    server localhost:4000;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    location / {
        proxy_pass http://ezybill_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Monitoring & Maintenance

### Check Server Status

```bash
# See if service is running
pm2 status

# View logs
pm2 logs ezybill-pro

# Monitor resource usage
pm2 monit
```

### Database Maintenance

```bash
# Optimize SQLite database
sqlite3 server/data/ezybill.db "VACUUM; ANALYZE;"

# Check database integrity
sqlite3 server/data/ezybill.db "PRAGMA integrity_check;"
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update (carefully test first)
npm update
npm run build
npm restart
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process on port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### JWT Authentication Fails

```bash
# Check .env JWT_SECRET
cat server/.env | grep JWT_SECRET

# Should be 32+ characters and consistent
```

### CORS Errors

```bash
# Check ALLOWED_ORIGINS in .env
cat server/.env | grep ALLOWED_ORIGINS

# Should match your domain (including protocol)
# Example: https://yourdomain.com,https://app.yourdomain.com
```

### Database Locked

```bash
# SQLite WAL file issue
rm server/data/ezybill.db-wal
rm server/data/ezybill.db-shm
# Restart server
```

---

## 📞 Support

- **GitHub Issues**: https://github.com/your-org/ezybill-pro/issues
- **API Documentation**: See README.md
- **Security Issues**: security@yourdomain.com (do not open public issues)

---

_Last updated: 2026-05-30_
_EzyBill Pro v1.0.0_
