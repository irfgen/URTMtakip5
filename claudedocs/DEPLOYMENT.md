# ÜRTM Takip System - Deployment Guide

## Overview

This guide covers deployment procedures for the ÜRTM Takip production tracking system, including PM2 process management, Nginx reverse proxy configuration, environment setup, and build processes.

**Deployment Architecture**:
```
Internet → Nginx (80/443) → React Frontend (Build) → Express Backend (3000) → SQLite Database
                      ↓
                 Socket.IO WebSocket
```

---

## Prerequisites

### System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB
- OS: Ubuntu 20.04+ / Debian 11+ / Windows Server

**Recommended**:
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 50GB+ SSD
- OS: Ubuntu 22.04 LTS

### Software Requirements

- **Node.js**: v18.x or higher
- **NPM**: v9.x or higher
- **PM2**: Latest version
- **Nginx**: v1.18+ (for reverse proxy)
- **Git**: For deployment
- **SQLite3**: v3.x (bundled with backend)

---

## Environment Setup

### 1. Install Node.js

```bash
# Using NodeSource repository (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PM2 Globally

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 3. Install Nginx

```bash
sudo apt update
sudo apt install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Clone Repository

```bash
cd /var/www
sudo git clone <repository-url> urtmtakip
cd urtmakip
sudo chown -R $USER:$USER .
```

---

## Application Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Backend Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_PATH=./backend/database.sqlite

# JWT Secret (generate secure random string)
JWT_SECRET=your-secure-random-jwt-secret-here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://your-domain.com

# File Upload
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./backend/uploads

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Build Process

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Or install separately:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Build Frontend

```bash
cd frontend
npm run build

# Verify build
ls -la dist/
```

### 3. Database Setup

```bash
cd backend

# Run database migrations
npm run migrate

# Verify database
ls -la database.sqlite
```

---

## PM2 Configuration

### PM2 Config File

**File**: `pm2.config.js` (in project root)

```javascript
module.exports = {
  apps: [
    {
      name: 'urtmtakip-backend',
      script: './backend/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
    },
  ],
};
```

### Start with PM2

```bash
# Start application
pm2 start pm2.config.js

# Check status
pm2 status

# View logs
pm2 logs urtmtakip-backend

# Monitor
pm2 monit
```

### PM2 Commands

```bash
# Start
pm2 start pm2.config.js

# Stop
pm2 stop urtmtakip-backend

# Restart
pm2 restart urtmtakip-backend

# Reload (zero-downtime)
pm2 reload urtmtakip-backend

# Delete
pm2 delete urtmtakip-backend

# Save process list
pm2 save

# Startup script (auto-start on boot)
pm2 startup
# Follow the instructions, then run:
pm2 save
```

---

## Nginx Configuration

### Nginx Config File

**File**: `nginx-config.conf` (in project root)

```nginx
# Upstream for backend
upstream urtm_backend {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 64;
}

# Redirect HTTP to HTTPS (optional)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Root for frontend static files
    root /var/www/urtmtakip/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # Logging
    access_log /var/log/nginx/urtmtakip-access.log;
    error_log /var/log/nginx/urtmtakip-error.log;

    # Frontend static files with cache
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://urtmt_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO WebSocket proxy
    location /socket.io/ {
        proxy_pass http://urtmt_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # File upload endpoint (increase size limit)
    location /api/upload {
        proxy_pass http://urtmt_backend;
        client_max_body_size 100M;
        proxy_request_buffering off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### Deploy Nginx Config

```bash
# Copy config to Nginx sites-available
sudo cp nginx-config.conf /etc/nginx/sites-available/urtmtakip

# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/urtmtakip /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL/HTTPS Setup (Optional but Recommended)

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Manual SSL Configuration

If you have SSL certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of configuration
}
```

---

## Deployment Workflow

### Initial Deployment

```bash
# 1. Clone repository
git clone <repository-url> urtmtakip
cd urtmtakip

# 2. Install dependencies
npm run install:all

# 3. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 4. Build frontend
cd frontend
npm run build
cd ..

# 5. Run migrations
cd backend
npm run migrate
cd ..

# 6. Start with PM2
pm2 start pm2.config.js
pm2 save

# 7. Configure Nginx
sudo cp nginx-config.conf /etc/nginx/sites-available/urtmtakip
sudo ln -s /etc/nginx/sites-available/urtmtakip /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 8. Verify deployment
pm2 status
curl http://localhost:3000/api/health
```

### Update Deployment

```bash
# 1. SSH into server
ssh user@server

# 2. Navigate to project
cd /var/www/urtmtakip

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies (if package.json changed)
npm run install:all

# 5. Build frontend
cd frontend
npm run build
cd ..

# 6. Run migrations (if any)
cd backend
npm run migrate
cd ..

# 7. Restart PM2
pm2 restart urtmtakip-backend

# 8. Clear cache (optional)
pm2 reload urtmtakip-backend
```

---

## Database Management

### Backup

```bash
# Create backup directory
mkdir -p /var/backups/urtmtakip

# Backup database
cp backend/database.sqlite /var/backups/urtmtakip/db_$(date +%Y%m%d_%H%M%S).sqlite

# Backup with compression
gzip -c backend/database.sqlite > /var/backups/urtmtakip/db_$(date +%Y%m%d_%H%M%S).sqlite.gz
```

### Automated Backup Script

**File**: `scripts/backup.sh`

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/urtmtakip"
DB_PATH="/var/www/urtmtakip/backend/database.sqlite"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH $BACKUP_DIR/db_$DATE.sqlite

# Compress backup
gzip $BACKUP_DIR/db_$DATE.sqlite

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_*.sqlite.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sqlite.gz"
```

**Add to crontab**:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/urtmtakip/scripts/backup.sh
```

### Restore

```bash
# Stop application
pm2 stop urtmtakip-backend

# Restore database
cp /var/backups/urtmtakip/db_20250107_020000.sqlite.gz .
gunzip db_20250107_020000.sqlite.gz
cp db_20250107_020000.sqlite /var/www/urtmtakip/backend/database.sqlite

# Start application
pm2 start urtmtakip-backend
```

---

## Monitoring & Logging

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs urtmtakip-backend

# Log with lines
pm2 logs urtmtakip-backend --lines 100

# Clear logs
pm2 flush
```

### Application Logs

**Backend logs**: `backend/logs/`
- `error.log`: Error messages
- `combined.log`: All logs
- `access.log`: API access logs

**PM2 logs**: `logs/`
- `backend-error.log`: PM2 error output
- `backend-out.log`: PM2 standard output

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/urtmtakip-access.log

# Error logs
sudo tail -f /var/log/nginx/urtmtakip-error.log
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use PM2 to stop
pm2 stop all
```

#### 2. Database Locked

```bash
# Check for SQLite lock files
ls -la backend/database.sqlite-*

# Remove lock files (ensure no process is using database)
rm backend/database.sqlite-shm
rm backend/database.sqlite-wal
```

#### 3. PM2 App Not Starting

```bash
# Check PM2 logs
pm2 logs urtmtakip-backend --err

# Check configuration
pm2 show urtmtakip-backend

# Restart with fresh state
pm2 delete urtmtakip-backend
pm2 start pm2.config.js
```

#### 4. Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs urtmtakip-backend

# Verify backend port
curl http://localhost:3000/api/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/urtmtakip-error.log
```

#### 5. Frontend Not Loading

```bash
# Check if frontend build exists
ls -la frontend/dist/

# Rebuild frontend
cd frontend
npm run build

# Check Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Performance Tuning

### PM2 Cluster Mode

```javascript
// pm2.config.js
module.exports = {
  apps: [{
    name: 'urtmtakip-backend',
    script: './backend/src/index.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    // ... other config
  }]
};
```

### Nginx Caching

```nginx
# Add to server block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating;
    # ... other proxy config
}
```

### SQLite Optimization

```javascript
// In backend/src/config/database.js
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Enable WAL mode for better performance
  dialectOptions: {
    mode: sequelize.OPEN_READWRITE | sequelize.OPEN_CREATE
  }
});
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local

# Add:
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/urtmtakip-error.log

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### 3. File Permissions

```bash
# Set appropriate permissions
sudo chown -R www-data:www-data /var/www/urtmtakip
sudo chmod -R 755 /var/www/urtmtakip
sudo chmod 644 /var/www/urtmtakip/backend/database.sqlite
```

### 4. Environment Variables Security

```bash
# Make .env file readable only by owner
chmod 600 .env

# Never commit .env to git
echo ".env" >> .gitignore
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancing**: Use Nginx upstream with multiple backend instances
2. **Database Migration**: Consider PostgreSQL for better concurrency
3. **Session Storage**: Use Redis for session storage
4. **File Storage**: Use S3 or dedicated file server

### Vertical Scaling

1. **Increase Server Resources**: More CPU, RAM, SSD storage
2. **Optimize Database**: Indexes, query optimization
3. **Caching**: Redis for frequently accessed data
4. **CDN**: Serve static files via CDN

---

## Maintenance

### Regular Maintenance Tasks

**Daily**:
- Monitor application logs
- Check disk space
- Verify backups

**Weekly**:
- Review error logs
- Check performance metrics
- Test backup restoration

**Monthly**:
- Update dependencies (npm packages)
- Review and optimize database
- Security updates

### Update Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all (be careful)
npm update

# Test thoroughly after updates
pm2 restart urtmtakip-backend
```

---

## Rollback Procedure

### Quick Rollback

```bash
# 1. Revert to previous commit
git log --oneline -10  # Find commit hash
git reset --hard <commit-hash>

# 2. Restore database backup
cp /var/backups/urtmtakip/db_backup.sqlite backend/database.sqlite

# 3. Rebuild frontend
cd frontend
npm run build
cd ..

# 4. Restart application
pm2 restart urtmtakip-backend

# 5. Verify
pm2 status
curl http://localhost:3000/api/health
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-07  
**Related Files**: PROJECT_OVERVIEW.md, API_DOCUMENTATION.md, FRONTEND_GUIDE.md
