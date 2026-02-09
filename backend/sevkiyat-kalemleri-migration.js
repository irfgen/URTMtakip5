// Sevkiyat Kalemleri Tablosu Migration
// Sevkiyat modülüne stok kartı ve parça seçimi için yeni tablo

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası yolu
const dbPath = path.join(__dirname, 'database.sqlite');

function createSevkiyatKalemleriTable() {
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Foreign key desteğini etkinleştir
            db.run("PRAGMA foreign_keys = ON");

            // Sevkiyat Kalemleri Tablosu
            db.run(`
                CREATE TABLE IF NOT EXISTS sevkiyat_kalemleri (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sevkiyat_id INTEGER NOT NULL,
                    kalem_tipi VARCHAR(20) NOT NULL CHECK (kalem_tipi IN ('stok_karti', 'parca')),
                    stok_karti_id INTEGER NULL,
                    parca_kodu VARCHAR(255) NULL,
                    adet INTEGER NOT NULL DEFAULT 1,
                    birim_fiyati DECIMAL(10,2) NULL,
                    toplam_fiyat DECIMAL(10,2) NULL,
                    aciklama TEXT,
                    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sevkiyat_id) REFERENCES sevkiyatlar(id) ON DELETE CASCADE,
                    FOREIGN KEY (stok_karti_id) REFERENCES stok_kartlari(id) ON DELETE SET NULL,
                    FOREIGN KEY (parca_kodu) REFERENCES parcalar(parca_kodu) ON DELETE SET NULL,
                    CHECK (
                        (kalem_tipi = 'stok_karti' AND stok_karti_id IS NOT NULL AND parca_kodu IS NULL) OR
                        (kalem_tipi = 'parca' AND parca_kodu IS NOT NULL AND stok_karti_id IS NULL)
                    )
                )
            `, (err) => {
                if (err) {
                    console.error('Sevkiyat kalemleri tablosu oluşturma hatası:', err);
                    reject(err);
                    return;
                }

                console.log('✅ Sevkiyat kalemleri tablosu başarıyla oluşturuldu!');

                // İndeksler oluştur
                db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyat_kalemleri_sevkiyat ON sevkiyat_kalemleri(sevkiyat_id)");
                db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyat_kalemleri_stok_karti ON sevkiyat_kalemleri(stok_karti_id)");
                db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyat_kalemleri_parca ON sevkiyat_kalemleri(parca_kodu)");
                db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyat_kalemleri_tip ON sevkiyat_kalemleri(kalem_tipi)");

                console.log('✅ İndeksler başarıyla oluşturuldu!');

                db.close((err) => {
                    if (err) {
                        console.error('Veritabanı kapatma hatası:', err);
                        reject(err);
                    } else {
                        console.log('✅ Sevkiyat kalemleri migration tamamlandı!');
                        resolve();
                    }
                });
            });
        });
    });
}

// Export function
module.exports = {
    createSevkiyatKalemleriTable
};

// Eğer dosya doğrudan çalıştırılırsa migration'ı başlat
if (require.main === module) {
    createSevkiyatKalemleriTable()
        .then(() => {
            console.log('Sevkiyat kalemleri migration tamamlandı!');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Migration hatası:', err);
            process.exit(1);
        });
}
