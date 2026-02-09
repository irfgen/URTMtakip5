# ÜRTM Takip Sistemi - Production Deployment Rehberi

## Genel Bakış

Bu rehber, ÜRTM Takip Sistemi'ni production ortamına nasıl dağıteceğinizi açıklar. Sistem, backend (Node.js), frontend (React), ve opsiyonel olarak ESP32 CNC panel ve Python CAD araçlarından oluşur.

## Ön Koşullar

### Sunucu Gereksinimleri

**Minimum Gereksinimler**:
- CPU: 2 çekirdek
- RAM: 2GB
- Disk: 20GB boş alan
- OS: Ubuntu 20.04+ / Debian 11+ / RHEL 8+

**Önerilen Gereksinimler**:
- CPU: 4+ çekirdek
- RAM: 4GB+
- Disk: 50GB+ SSD
- OS: Ubuntu 22.04 LTS

### Yazılım Gereksinimleri

1. **Node.js**: 18.x veya üzeri
2. **NPM**: 9.x veya üzeri
3. **PM2**: Global PM2 kurulumu
4. **Nginx**: 1.18+ veya Apache 2.4+
5. **Git**: 2.25+
6. **Build Essentials**: Python, make, g++

### Opsiyonel Yazılım

1. **SSL Sertifikası**: Let's Encrypt (ücretsiz)
2. **Domain**: Domain adı (opsiyonel)
3. **Python 3.8+**: CAD araçları için
4. **PlatformIO**: ESP32 geliştirme için

## Kurulum Adımları

### 1. Sunucu Hazırlığı

```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Gerekli paketleri yükle
sudo apt install -y build-essential python3 python3-pip git curl wget

# Node.js yükle (NodeSource kullanarak)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 yükle (global)
sudo npm install -g pm2

# PM2'yi sistem başlangıcına ekle
pm2 startup
# Çıktıdaki komutu çalıştır
```

### 2. Proje Dosyalarını Sunucuya Yükleme

**Seçenek 1: Git ile Klonlama**

```bash
# Proje dizinini oluştur
sudo mkdir -p /var/www/urtmtakip
sudo chown -R $USER:$USER /var/www/urtmtakip

# Projeyi klonla
cd /var/www/urtmtakip
git clone <repository-url> .
```

**Seçenek 2: Manuel Upload**

```bash
# Projeyi lokal olarak paketle
tar -czf urtmtakip.tar.gz URTMtakip/

# Sunucuya upload et
scp urtmtakip.tar.gz user@server:/var/www/

# Sunucuda aç
cd /var/www/
tar -xzf urtmtakip.tar.gz
mv URTMtakip urtmtakip
```

### 3. Bağımlılıkları Yükleme

```bash
cd /var/www/urtmtakip

# Root bağımlılıkları yükle
npm install

# Backend bağımlılıkları yükle
cd backend
npm install

# Frontend bağımlılıkları yükle
cd ../frontend
npm install
```

### 4. Çevre Değişkenlerini Yapılandırma

```bash
# .env dosyasını oluştur
cd /var/www/urtmtakip/backend
nano .env
```

**.env dosyası içeriği**:
```env
NODE_ENV=production
PORT=3000

# Veritabanı (Varsayılan SQLite)
DB_PATH=./database.sqlite

# JWT Secret (Gelecekte)
JWT_SECRET=your-super-secret-jwt-key

# CORS (Varsayılan tüm originlere izin verir)
CORS_ORIGIN=*

# Log seviyesi
LOG_LEVEL=info
```

### 5. Frontend Build

```bash
cd /var/www/urtmtakip/frontend

# Production build oluştur
npm run build

# Build başarılı olmalı
# Build çıktısı: frontend/dist/ dizininde
```

### 6. Veritabanı Migration

```bash
cd /var/www/urtmtakip/backend

# Migratasyonları çalıştır
npm run migrate

# Durum kontrolü
npm run check-durum-status
```

### 7. PM2 Yapılandırması

**PM2 Konfigürasyon Dosyası**:

`pm2.config.json` dosyasını düzenle:

```json
{
  "apps": [
    {
      "name": "urtmtakip-backend",
      "script": "./backend/src/index.js",
      "cwd": "/var/www/urtmtakip",
      "instances": 1,
      "exec_mode": "fork",
      "watch": false,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "log_file": "/var/log/pm2/urtmtakip-backend.log",
      "error_file": "/var/log/pm2/urtmtakip-backend-error.log",
      "out_file": "/var/log/pm2/urtmtakip-backend-out.log",
      "merge_logs": true,
      "time": true,
      "max_restarts": 10,
      "min_uptime": "10s",
      "max_memory_restart": "500M"
    }
  ]
}
```

**PM2'yi Başlatma**:

```bash
cd /var/www/urtmtakip

# PM2'yi başlat
pm2 start pm2.config.json

# Durumu kontrol et
pm2 status

# Logları görüntüle
pm2 logs urtmtakip-backend

# PM2'yi kaydet
pm2 save
```

### 8. Nginx Yapılandırması

**Nginx Kurulumu**:

```bash
# Nginx yükle
sudo apt install -y nginx

# Nginx'i başlat
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Nginx Konfigürasyon Dosyası**:

```bash
# Konfigürasyon dosyasını oluştur
sudo nano /etc/nginx/sites-available/urtmtakip
```

**Nginx Konfigürasyonu** (`/etc/nginx/sites-available/urtmtakip`):

```nginx
# URTM Takip Nginx Konfigürasyonu
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Kendi domain'inizi yazın

    # Client max body size limiti artır (100MB)
    client_max_body_size 100M;

    # Frontend (React build dosyaları)
    location / {
        root /var/www/urtmtakip/frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        # Cache ayarları
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;  # Backend port'unuz
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # API endpoint'leri için body size limiti
        client_max_body_size 100M;
        proxy_request_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }

    # WebSocket desteği
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Güvenlik headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip sıkıştırma
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}

# HTTPS yönlendirmesi (SSL sertifikası aldıktan sonra)
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com www.your-domain.com;
#
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#
#     # Yukarıdaki konfigürasyonları buraya kopyalayın
# }
```

**Site'ı Aktifleştir**:

```bash
# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/urtmtakip /etc/nginx/sites-enabled/

# Default site'ı kaldır (opsiyonel)
sudo rm /etc/nginx/sites-enabled/default

# Nginx yapılandırmasını test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

### 9. Güvenlik Ayarları

**UFW (Uncomplicated Firewall) Ayarları**:

```bash
# UFW yükle
sudo apt install -y ufw

# Kuralları ekle
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (SSL sonrası)

# Firewall'ı etkinleştir
sudo ufw enable

# Durumu kontrol et
sudo ufw status
```

### 10. SSL Sertifikası (Let's Encrypt - Opsiyonel)

**Certbot Kurulumu**:

```bash
# Certbot yükle
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Otomatik yenileme test et
sudo certbot renew --dry-run
```

## Servis Yönetimi

### PM2 Komutları

```bash
# Uygulamayı başlat
pm2 start pm2.config.json

# Uygulamayı durdur
pm2 stop urtmtakip-backend

# Uygulamayı yeniden başlat
pm2 restart urtmtakip-backend

# Uygulamayı sil
pm2 delete urtmtakip-backend

# Durumu görüntüle
pm2 status

# Logları görüntüle
pm2 logs urtmtakip-backend

# Monitor et
pm2 monit

# Kayıtlı uygulamaları listele
pm2 list

# Sistem başlangıcında başlat
pm2 startup
pm2 save
```

### Nginx Komutları

```bash
# Nginx'i başlat
sudo systemctl start nginx

# Nginx'i durdur
sudo systemctl stop nginx

# Nginx'i yeniden başlat
sudo systemctl restart nginx

# Yapılandırmayı yeniden yükle
sudo systemctl reload nginx

# Durumu kontrol et
sudo systemctl status nginx

# Yapılandırmayı test et
sudo nginx -t
```

## Monitoring ve Loglar

### Log Konumları

**PM2 Logları**:
- `/var/log/pm2/urtmtakip-backend.log`
- `/var/log/pm2/urtmtakip-backend-error.log`
- `/var/log/pm2/urtmtakip-backend-out.log`

**Nginx Logları**:
- `/var/log/nginx/access.log`
- `/var/log/nginx/error.log`

**Backend Logları**:
- `/var/www/urtmtakip/backend/combined.log`
- `/var/www/urtmtakip/backend/error.log`

### Log Yönetimi

```bash
# PM2 loglarını temizle
pm2 flush

# Son 100 satır log görüntüle
pm2 logs urtmtakip-backend --lines 100

# Real-time log izleme
pm2 logs urtmtakip-backend

# Nginx loglarını görüntüle
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoring Araçları

**PM2 Monitoring**:

```bash
# Interaktif monitoring
pm2 monit

# Web-based monitoring (PM2 Plus)
pm2 web
```

**Sistem Monitoring**:

```bash
# CPU ve RAM kullanımı
htop

# Disk kullanımı
df -h

# Disk I/O
iotop

# Ağ bağlantıları
sudo netstat -tulpn
```

## Yedekleme ve Geri Yükleme

### Yedekleme Stratejisi

**Veritabanı Yedeği**:

```bash
# Yedekleme script'i oluştur
nano /var/www/urtmtakip/scripts/backup.sh
```

**backup.sh içeriği**:
```bash
#!/bin/bash
# Yedekleme script'i

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/urtmtakip"
DB_PATH="/var/www/urtmtakip/backend/database.sqlite"

# Yedekleme dizinini oluştur
mkdir -p $BACKUP_DIR

# Veritabanını yedekle
cp $DB_PATH $BACKUP_DIR/database.sqlite.$DATE

# Eski yedekleri temizle (7 günden eski)
find $BACKUP_DIR -name "database.sqlite.*" -mtime +7 -delete

echo "Yedekleme tamamlandı: $DATE"
```

**Otomatik Yedekleme (Cron Job)**:

```bash
# Script'e izin ver
chmod +x /var/www/urtmtakip/scripts/backup.sh

# Cron job ekle (her gün saat 02:00)
crontab -e

# Satır ekle:
0 2 * * * /var/www/urtmtakip/scripts/backup.sh
```

### Geri Yükleme

```bash
# Yedeği bul
ls -lh /var/backups/urtmtakip/

# Yedeği geri yükle
sudo systemctl stop urtmtakip-backend
cp /var/backups/urtmtakip/database.sqlite.YYYYMMDD_HHMMSS /var/www/urtmtakip/backend/database.sqlite
sudo systemctl start urtmtakip-backend
```

## Güncelleme ve Bakım

### Uygulamayı Güncelleme

```bash
# 1. Yedek al
cd /var/www/urtmtakip
/scripts/backup.sh

# 2. PM2'yi durdur
pm2 stop urtmtakip-backend

# 3. Güncellemeleri çek
git pull origin main

# 4. Bağımlılıkları güncelle
npm install
cd backend && npm install
cd ../frontend && npm install

# 5. Frontend build
cd frontend
npm run build

# 6. Migratasyonları çalıştır
cd ../backend
npm run migrate

# 7. PM2'yi başlat
pm2 restart urtmtakip-backend

# 8. Durumu kontrol et
pm2 status
pm2 logs urtmtakip-backend
```

### Nginx Güncelleme

```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

## Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

**1. Port Kullanımda Hatası**:

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Çözüm**:
```bash
# Portu kullanan işlemi bul
sudo lsof -i :3000

# İşlemi sonlandır
kill -9 <PID>

# PM2'yi yeniden başlat
pm2 restart urtmtakip-backend
```

**2. EACCES Hatası (Permission Denied)**:

```
Error: EACCES: permission denied
```

**Çözüm**:
```bash
# Dosya izinlerini düzelt
sudo chown -R $USER:$USER /var/www/urtmtakip
chmod -R 755 /var/www/urtmtakip
```

**3. Nginx 502 Bad Gateway**:

**Çözüm**:
```bash
# Backend çalışıyor mu kontrol et
pm2 status

# Backend'i başlat
pm2 start urtmtakip-backend

# Nginx yapılandırmasını kontrol et
sudo nginx -t
```

**4. Database Locked Hatası**:

**Çözüm**:
```bash
# SQLite lock dosyasını sil
rm /var/www/urtmtakip/backend/database.sqlite-shm
rm /var/www/urtmtakip/backend/database.sqlite-wal

# Backend'i yeniden başlat
pm2 restart urtmtakip-backend
```

**5. Out of Memory Hatası**:

**Çözüm**:
```bash
# PM2 memory limitini artır
pm2 restart urtmtakip-backend --max-memory-restart 1000M

# Swap alanı ekle
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Log Analizi

```bash
# Hata loglarını ara
grep -i "error" /var/log/pm2/urtmtakip-backend-error.log

# Uyarı loglarını ara
grep -i "warning" /var/log/pm2/urtmtakip-backend-error.log

# Son 100 satırı görüntüle
tail -n 100 /var/log/pm2/urtmtakip-backend-error.log
```

## Performans Optimizasyonu

### Backend Optimizasyonu

**1. PM2 Cluster Mode**:

```json
{
  "apps": [{
    "name": "urtmtakip-backend",
    "script": "./backend/src/index.js",
    "instances": "max",  // CPU çekirdek sayısı kadar
    "exec_mode": "cluster"
  }]
}
```

**2. Nginx Caching**:

```nginx
# Cache zone ekle
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=urtmtakip_cache:10m max_size=1g inactive=60m;

server {
    location /api {
        proxy_cache urtmtakip_cache;
        proxy_cache_valid 200 10m;
        proxy_cache_use_stale error timeout invalid_header updating;
    }
}
```

### Frontend Optimizasyonu

**1. Build Optimizasyonu**:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        }
      }
    }
  }
});
```

**2. CDN Kullanımı** (Gelecekte):

```javascript
// Statik dosyaları CDN'e upload et
// Cloudflare, AWS CloudFront, veya bunny.net kullan
```

## Güvenlik Önerileri

### 1. HTTPS Kullanımı

```bash
# Let's Encrypt ile ücretsiz SSL al
sudo certbot --nginx -d your-domain.com
```

### 2. Güvenlik Headers

```nginx
# Nginx'e ekle
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 3. Rate Limiting

```nginx
# Nginx'e ekle
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
    }
}
```

### 4. Güvenlik Taraması

```bash
# NPM audit
npm audit

# Güncellemeleri uygula
npm audit fix

# Sistem güncellemeleri
sudo apt update && sudo apt upgrade -y
```

## Ölçeklendirme

### Horizontal Scaling

**Load Balancer ile Nginx**:

```nginx
upstream backend_servers {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location /api {
        proxy_pass http://backend_servers;
    }
}
```

### Vertical Scaling

**Sunucu Kaynaklarını Artırma**:
- CPU: 4 → 8 çekirdek
- RAM: 4GB → 8GB
- Disk: SSD kullanımı

## Destek ve Yardım

### Dokümantasyon
- Proje README: `/README.md`
- CLAUDE.md: Geliştirici talimatları
- ClaudeDocs: `/claudedocs/`

### Loglar
- PM2: `pm2 logs urtmtakip-backend`
- Nginx: `/var/log/nginx/`
- Backend: `/var/www/urtmtakip/backend/`

### Monitor
- PM2: `pm2 monit`
- Sistem: `htop`, `iotop`, `netstat`

### Yedekleme
- Otomatik yedekleme: `/var/backups/urtmtakip/`
- Manuel yedekleme: `/var/www/urtmtakip/scripts/backup.sh`
