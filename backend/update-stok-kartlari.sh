#!/bin/bash

echo "🔧 Stok kartları tablosu güncelleniyor..."

# SQLite komutlarını çalıştır
sqlite3 database.sqlite <<EOF
-- 1. Backup oluştur
CREATE TABLE stok_kartlari_backup AS SELECT * FROM stok_kartlari;

-- 2. Yeni tablo oluştur
CREATE TABLE stok_kartlari_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kesit VARCHAR(50) NOT NULL,
    boy DECIMAL(10,2),
    malzeme_cinsi VARCHAR(100) NOT NULL,
    malzeme_adi VARCHAR(200),
    adet INTEGER NOT NULL DEFAULT 0,
    kritik_stok_miktari INTEGER NOT NULL DEFAULT 0,
    lokasyon VARCHAR(50),
    adres TEXT,
    firma VARCHAR(100),
    aktif_mi TINYINT(1) NOT NULL DEFAULT 1,
    olusturma_tarihi DATETIME NOT NULL,
    guncelleme_tarihi DATETIME NOT NULL
);

-- 3. Mevcut verileri yeni tabloya kopyala
INSERT INTO stok_kartlari_new (
    id, kesit, boy, malzeme_cinsi, malzeme_adi, adet, kritik_stok_miktari,
    lokasyon, adres, firma, aktif_mi, olusturma_tarihi, guncelleme_tarihi
)
SELECT 
    id, enboy_cap, uzunluk, malzeme_cinsi, NULL, adet, kritik_stok_miktari,
    lokasyon, adres, firma, aktif_mi, olusturma_tarihi, guncelleme_tarihi
FROM stok_kartlari;

-- 4. Eski tabloyu sil
DROP TABLE stok_kartlari;

-- 5. Yeni tabloyu eski isimle yeniden adlandır
ALTER TABLE stok_kartlari_new RENAME TO stok_kartlari;

-- 6. İndeksleri yeniden oluştur
CREATE INDEX idx_stok_kartlari_malzeme_cinsi ON stok_kartlari (malzeme_cinsi);
CREATE INDEX idx_stok_kartlari_firma ON stok_kartlari (firma);
CREATE INDEX idx_stok_kartlari_aktif ON stok_kartlari (aktif_mi);
CREATE INDEX idx_stok_kartlari_stok_durumu ON stok_kartlari (adet, kritik_stok_miktari);
CREATE INDEX idx_stok_kartlari_kesit ON stok_kartlari (kesit);
CREATE INDEX idx_stok_kartlari_malzeme_adi ON stok_kartlari (malzeme_adi);

EOF

if [ $? -eq 0 ]; then
    echo "✅ Stok kartları tablosu başarıyla güncellendi:"
    echo "  - enboy_cap → kesit"
    echo "  - uzunluk → boy"
    echo "  - malzeme_adi alanı eklendi"
    
    # Güncellenen tablo yapısını göster
    echo ""
    echo "📋 Güncellenmiş tablo yapısı:"
    sqlite3 database.sqlite ".schema stok_kartlari"
else
    echo "❌ Migration sırasında hata oluştu!"
    exit 1
fi
