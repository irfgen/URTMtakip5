# Deployment Guide

## Production Deployment

This guide covers deploying ÜRTM Takip to production servers.

## Prerequisites

- Node.js 18+ on server
- PM2 process manager
- Nginx (recommended)
- Domain name with DNS configured

## Build Frontend

```bash
# Build React application
npm run build
```

Output in `frontend/dist/`

## Backend Setup

### 1. Environment Configuration

Create `backend/.env` on production server:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=strong-random-secret-key-at-least-32-chars
CORS_ORIGIN=https://your-domain.com
UPLOAD_MAX_SIZE=100MB
```

### 2. Install Dependencies

```bash
npm ci --production
```

### 3. Run Migrations

```bash
cd backend && npm run migrate
```

## PM2 Configuration

`pm2.config.json`:

```json
{
  "apps": [
    {
      "name": "urtmtakip-backend",
      "script": "backend/src/index.js",
      "instances": 1,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "error_file": "logs/urtmtakip-error.log",
      "out_file": "logs/urtmtakip-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true
    }
  ]
}
```

### Start Application

```bash
pm2 start pm2.config.json
pm2 save
```

### Commands

```bash
pm2 status              # Check status
pm2 logs urtmtakip-backend  # View logs
pm2 restart all         # Restart
pm2 stop all            # Stop
```

## Nginx Configuration

`nginx-config.conf`:

```nginx
upstream backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/URTMtakip/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Enable Nginx

```bash
# Test configuration
nginx -t

# Enable site
ln -s /etc/nginx/sites-available/urtmtakip /etc/nginx/sites-enabled/

# Restart
systemctl restart nginx
```

## SSL/HTTPS

Use Let's Encrypt or purchase SSL certificate.

### Let's Encrypt (Recommended)

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## Backup

### Database Backup

```bash
# Backup SQLite database
cp backend/database.sqlite backup/database-$(date +%Y%m%d).sqlite
```

### Automated Backups

Set up cron job:

```bash
crontab -e
# Add: 0 2 * * * /path/to/backup/script.sh
```

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
```

### Log Management

```bash
pm2 logs --lines 100
```

## Security Checklist

- [ ] Change JWT_SECRET to strong random key
- [ ] Configure CORS_ORIGIN to production domain
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall (allow ports 80, 443)
- [ ] Set up automated backups
- [ ] Enable log rotation

## Updates

To update to new version:

```bash
# Pull latest code
git pull

# Rebuild frontend
npm run build

# Restart PM2
pm2 restart all
```

## Troubleshooting

### Check Logs

```bash
pm2 logs urtmtakip-backend --err --lines 50
```

### Restart Application

```bash
pm2 restart all
```

### Check Status

```bash
pm2 status
curl http://localhost:3000/api/health
```