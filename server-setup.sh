#!/bin/bash

# URTM Takip Sunucu Kurulum Scripti
# Bu scripti sunucunuzda root veya sudo yetkili kullanıcı ile çalıştırın

echo "🚀 URTM Takip Sunucu Kurulumu Başlıyor..."

# Sistem güncellemesi
echo "📦 Sistem güncelleniyor..."
sudo apt update && sudo apt upgrade -y

# Node.js kurulumu
echo "🟢 Node.js kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git kurulumu
echo "🔧 Git kuruluyor..."
sudo apt install git -y

# PM2 kurulumu (Process Manager)
echo "⚙️ PM2 kuruluyor..."
sudo npm install -g pm2

# Nginx kurulumu
echo "🌐 Nginx kuruluyor..."
sudo apt install nginx -y

# Firewall ayarları
echo "🔥 Firewall ayarları..."
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Node.js (geliştirme)
sudo ufw --force enable

# Uygulama dizini oluştur
echo "📁 Uygulama dizini oluşturuluyor..."
sudo mkdir -p /var/www/urtmtakip
sudo chown $USER:$USER /var/www/urtmtakip

echo "✅ Sunucu kurulumu tamamlandı!"
echo ""
echo "🔑 Şimdi yapmanız gerekenler:"
echo "1. SSH key oluşturun: ssh-keygen -t rsa"
echo "2. GitHub'a SSH key ekleyin"
echo "3. Projeyi klonlayın: git clone git@github.com:irfgen/URTMtakip.git /var/www/urtmtakip"
echo "4. Konfigürasyon dosyalarını ayarlayın"
