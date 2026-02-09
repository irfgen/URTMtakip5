#!/bin/bash

# Sunucuya deployment scripti
# Kullanım: ./deploy-to-server.sh [develop|production]

# Konfigürasyon dosyasını yükle
if [ -f ".deploy-config" ]; then
    source .deploy-config
else
    echo "❌ .deploy-config dosyası bulunamadı!"
    exit 1
fi

BRANCH=${1:-production}

# Konfigürasyondan değerleri al veya varsayılanları kullan
SERVER_USER=${SERVER_USER:-"your_username"}
SERVER_IP=${SERVER_IP:-"your_server_ip"}
SERVER_PATH=${SERVER_PATH:-"/var/www/urtmtakip"}

echo "🚀 $BRANCH dalını sunucuya deploy ediliyor..."
echo "📋 Sunucu: $SERVER_USER@$SERVER_IP"
echo "📁 Yol: $SERVER_PATH"

echo "🚀 $BRANCH dalını sunucuya deploy ediliyor..."

# Önce değişiklikleri push et
git push origin $BRANCH

# Sunucuda deployment
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_PATH
    
    # Backup al
    if [ -d "backup" ]; then
        rm -rf backup_old
        mv backup backup_old
    fi
    cp -r . backup
    
    # Yeni kodu çek
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
    
    # Bağımlılıkları güncelle
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Backend varsa restart et
    if [ -f "backend/package.json" ]; then
        cd backend
        npm install
        cd ..
        # systemctl restart your-app-service
    fi
    
    # Frontend build
    if [ -f "frontend/package.json" ]; then
        cd frontend
        npm install
        npm run build
        cd ..
    fi
    
    echo "✅ $BRANCH dalı başarıyla deploy edildi!"
EOF

echo "🎉 Deployment tamamlandı!"
