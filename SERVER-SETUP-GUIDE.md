# 🖥️ URTM Takip Sunucu Kurulum Rehberi

## 1️⃣ Sunucu Hazırlığı

### Sunucu Gereksinimleri
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Minimum 2GB (Önerilen 4GB+)
- **Disk**: Minimum 20GB
- **CPU**: 2 vCPU+

### Başlangıç Kurulumu
```bash
# 1. Sunucunuza SSH ile bağlanın
ssh root@your-server-ip

# 2. Kurulum scriptini çalıştırın
wget https://raw.githubusercontent.com/irfgen/URTMtakip/develop/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

## 2️⃣ Git ve SSH Ayarları

### SSH Key Oluşturma
```bash
# Sunucuda SSH key oluşturun
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Public key'i görüntüleyin
cat ~/.ssh/id_rsa.pub
```

### GitHub'a SSH Key Ekleme
1. GitHub'da Settings > SSH and GPG keys
2. "New SSH key" tıklayın
3. Yukarıdaki public key'i yapıştırın

### Projeyi Klonlama
```bash
# Proje dizinini oluşturun
sudo mkdir -p /var/www/urtmtakip
sudo chown $USER:$USER /var/www/urtmtakip

# Projeyi klonlayın
git clone git@github.com:irfgen/URTMtakip.git /var/www/urtmtakip
cd /var/www/urtmtakip
```

## 3️⃣ Uygulama Kurulumu

### Backend Kurulumu
```bash
cd /var/www/urtmtakip/backend
npm install --production
```

### Frontend Build
```bash
cd /var/www/urtmtakip/frontend
npm install
npm run build
```

### Database Ayarları
```bash
# SQLite database'i için yazma izni
sudo chown www-data:www-data /var/www/urtmtakip/backend/database.sqlite
sudo chmod 664 /var/www/urtmtakip/backend/database.sqlite
```

## 4️⃣ Nginx Ayarları

### Nginx Site Konfigürasyonu
```bash
# Konfigürasyon dosyasını kopyalayın
sudo cp /var/www/urtmtakip/nginx-config.conf /etc/nginx/sites-available/urtmtakip

# Domain'inizi düzenleyin
sudo nano /etc/nginx/sites-available/urtmtakip
# "your-domain.com" kısmını değiştirin

# Site'i aktifleştirin
sudo ln -s /etc/nginx/sites-available/urtmtakip /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Nginx'i test edin ve restart edin
sudo nginx -t
sudo systemctl restart nginx
```

## 5️⃣ PM2 ile Uygulama Çalıştırma

### PM2 Kurulumu ve Başlatma
```bash
cd /var/www/urtmtakip

# PM2 konfigürasyonunu başlat
pm2 start pm2.config.json

# PM2'yi sistem başlangıcına ekle
pm2 startup
pm2 save
```

### PM2 Komutları
```bash
pm2 status              # Uygulamaların durumu
pm2 logs urtmtakip-backend  # Logları göster
pm2 restart urtmtakip-backend  # Restart
pm2 stop urtmtakip-backend     # Durdur
```

## 6️⃣ SSL Sertifikası (Let's Encrypt)

### Certbot Kurulumu
```bash
sudo apt install certbot python3-certbot-nginx
```

### SSL Sertifikası Alma
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Otomatik Yenileme
```bash
sudo crontab -e
# Bu satırı ekleyin:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 7️⃣ Sunucu İzleme

### Log Dosyaları
```bash
# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PM2 logları
pm2 logs

# Sistem logları
sudo journalctl -u nginx -f
```

### Güvenlik
```bash
# Firewall durumu
sudo ufw status

# Fail2ban kurulumu (SSH saldırılarına karşı)
sudo apt install fail2ban
```

## 8️⃣ Backup Stratejisi

### Otomatik Backup Scripti
```bash
#!/bin/bash
# /home/user/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
APP_DIR="/var/www/urtmtakip"

mkdir -p $BACKUP_DIR

# Kod backup
tar -czf $BACKUP_DIR/urtmtakip_code_$DATE.tar.gz -C /var/www urtmtakip

# Database backup (SQLite)
cp $APP_DIR/backend/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# Eski backupları sil (30 günden eski)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.sqlite" -mtime +30 -delete

echo "Backup tamamlandı: $DATE"
```

### Crontab'a Ekleme
```bash
crontab -e
# Günlük 02:00'da backup
0 2 * * * /home/user/backup.sh
```

## 9️⃣ Sorun Giderme

### Yaygın Sorunlar
1. **502 Bad Gateway**: PM2 uygulaması çalışmıyor
2. **403 Forbidden**: Dosya izinleri problemi
3. **500 Internal Error**: Backend'de hata var

### Debug Komutları
```bash
# Nginx durumu
sudo systemctl status nginx

# PM2 durumu
pm2 status

# Port kontrolü
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5000
```

## 🔧 Konfigürasyon Dosyaları

Yerel projenizdeki `.deploy-config` dosyasını güncelleyin:
```bash
SERVER_USER=your_server_username
SERVER_IP=your_server_ip
SERVER_PATH=/var/www/urtmtakip
```

Bu kurulumdan sonra artık yerel makinenizden deployment yapabilirsiniz:
```bash
./deploy-to-server.sh production
```
