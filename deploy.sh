#!/bin/bash
# ÜRTM Takip Dizin Tarama Client v1.2.4 Deployment Script
# Generated: 2025-10-03 22:09:44

VERSION="1.2.4"
VERSION_FULL="1.2.4.20251003002"

echo "🚀 ÜRTM Takip Dizin Tarama Client Deployment"
echo "Version: $VERSION_FULL"
echo "Date: $(date)"
echo "----------------------------------------"

# Web sunucusu için dosyaları kopyala
if [ -d "/var/www/urtmtakip/downloads" ]; then
    echo "📁 Web sunucusuna dosyalar kopyalanıyor..."

    # Eski dosyaları temizle
    rm -f /var/www/urtmtakip/downloads/URTM_DizinTarama_Client_v*.zip
    rm -f /var/www/urtmtakip/downloads/URTM_DizinTarama_Client_v*.tar.gz

    # Yeni dosyaları kopyala
    cp URTM_DizinTarama_Client_v${VERSION}.zip /var/www/urtmtakip/downloads/
    cp URTM_DizinTarama_Client_v${VERSION}.tar.gz /var/www/urtmtakip/downloads/
    cp LATEST_RELEASE.json /var/www/urtmtakip/downloads/

    # İndirme linklerini güncelle (symlink)
    ln -sf URTM_DizinTarama_Client_v${VERSION}.zip /var/www/urtmtakip/downloads/URTM_DizinTarama_Client_latest.zip

    echo "✅ Web deployment tamamlandı"
else
    echo "⚠️  Web sunucu dizini bulunamadı: /var/www/urtmtakip/downloads"
fi

# Backup oluştur
if [ -d "/backup/urtmtakip/releases" ]; then
    echo "💾 Backup oluşturuluyor..."
    mkdir -p /backup/urtmtakip/releases/v$VERSION
    cp -r URTM_DizinTarama_Client_v$VERSION /backup/urtmtakip/releases/v$VERSION/
    cp URTM_DizinTarama_Client_v${VERSION}.* /backup/urtmtakip/releases/v$VERSION/
    echo "✅ Backup tamamlandı"
fi

echo "🎉 Deployment başarıyla tamamlandı!"
echo "İndirme linki: http://server/downloads/URTM_DizinTarama_Client_v${VERSION}.zip"
