#!/bin/bash

# HIZLI SUNUCU KURULUM CHECKLIST
# Bu script'i adım adım takip edin

echo "🚀 URTM Takip Sunucu Kurulum Checklist"
echo "========================================"

echo ""
echo "1️⃣ SUNUCU HAZIRLAMA"
echo "✅ Ubuntu/CentOS sunucunuz var mı?"
echo "✅ Root/sudo erişiminiz var mı?"
echo "✅ SSH ile bağlanabiliyor musunuz?"
read -p "Hazırsanız Enter'a basın..."

echo ""
echo "2️⃣ SUNUCUDA ÇALIŞTIRMANIZ GEREKENLER:"
echo "-------------------------------------"
echo "# Sunucunuza SSH ile bağlanın:"
echo "ssh root@YOUR_SERVER_IP"
echo ""
echo "# Bu komutu çalıştırın:"
echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
echo "sudo apt update && sudo apt install -y nodejs git nginx"
echo "sudo npm install -g pm2"
echo ""
echo "# Uygulama dizini oluşturun:"
echo "sudo mkdir -p /var/www/urtmtakip"
echo "sudo chown \$USER:\$USER /var/www/urtmtakip"
echo ""
echo "# SSH key oluşturun:"
echo "ssh-keygen -t rsa -b 4096"
echo "cat ~/.ssh/id_rsa.pub"
echo ""
read -p "Bu adımları tamamladıysanız Enter'a basın..."

echo ""
echo "3️⃣ GITHUB AYARLARI"
echo "-------------------"
echo "✅ GitHub'da Settings > SSH Keys'e gidin"
echo "✅ Sunucudan aldığınız SSH key'i ekleyin"
echo "✅ Sunucuda projeyi klonlayın:"
echo "git clone git@github.com:irfgen/URTMtakip.git /var/www/urtmtakip"
read -p "GitHub ayarları tamam mı? Enter'a basın..."

echo ""
echo "4️⃣ YEREL KONFIGÜRASYON"
echo "----------------------"
echo "Şimdi yerel projenizdeki .deploy-config dosyasını düzenleyin:"
echo ""

# .deploy-config dosyasını interaktif olarak düzenle
read -p "Sunucu IP adresiniz: " server_ip
read -p "Sunucu kullanıcı adınız: " server_user
read -p "Domain adınız (varsa, yoksa IP): " domain_name

# Konfigürasyon dosyasını güncelle
cat > .deploy-config << EOF
# Git Workflow Konfigürasyonu
# Bu dosyayı deployment script'inizde kullanabilirsiniz

# Sunucu Bilgileri
SERVER_USER=$server_user
SERVER_IP=$server_ip
SERVER_PATH=/var/www/urtmtakip
SERVER_PORT=22

# Dal Bilgileri
DEVELOP_BRANCH=develop
PRODUCTION_BRANCH=production
MAIN_BRANCH=main

# Backup Ayarları
BACKUP_COUNT=5
BACKUP_DIR=backups

# Service Ayarları  
BACKEND_SERVICE=urtmtakip-backend
FRONTEND_BUILD_COMMAND="npm run build"

# Domain Bilgisi
DOMAIN=$domain_name

# Bildirim Ayarları
SLACK_WEBHOOK=""
DISCORD_WEBHOOK=""

# Otomatik Test
RUN_TESTS_BEFORE_DEPLOY=false
TEST_COMMAND="npm test"
EOF

echo "✅ Konfigürasyon dosyası güncellendi!"

echo ""
echo "5️⃣ İLK DEPLOYMENT"
echo "-----------------"
echo "Artık deployment yapabilirsiniz:"
echo "./deploy-to-server.sh production"
echo ""
echo "🎉 Kurulum rehberi tamamlandı!"
echo "Detaylar için SERVER-SETUP-GUIDE.md dosyasını okuyun."
