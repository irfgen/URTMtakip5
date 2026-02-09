// Sevkiyat Modülü AŞAMA 1 - Database Migration
// URTMtakip projesi için basit sevkiyat veritabanı tabloları

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası yolu
const dbPath = path.join(__dirname, 'database.sqlite');

function createSevkiyatTables() {
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Foreign key desteğini etkinleştir
            db.run("PRAGMA foreign_keys = ON");

            // 1. Sevkiyat Firmaları Tablosu
            db.run(`
                CREATE TABLE IF NOT EXISTS sevkiyat_firmalari (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    firma_adi VARCHAR(255) NOT NULL UNIQUE,
                    tip VARCHAR(10) NOT NULL CHECK (tip IN ('ic', 'dis')),
                    adres TEXT,
                    telefon VARCHAR(50),
                    yetkili_kisi VARCHAR(255),
                    aktif BOOLEAN DEFAULT 1,
                    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Sevkiyat firmaları tablosu oluşturma hatası:', err);
                }
            });

            // 2. Sevkiyat Lokasyonları Tablosu
            db.run(`
                CREATE TABLE IF NOT EXISTS sevkiyat_lokasyonlari (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lokasyon_adi VARCHAR(255) NOT NULL UNIQUE,
                    tip VARCHAR(10) NOT NULL CHECK (tip IN ('ic', 'dis')),
                    adres TEXT,
                    aktif BOOLEAN DEFAULT 1,
                    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Sevkiyat lokasyonları tablosu oluşturma hatası:', err);
                }
            });

            // 3. Sevkiyatlar Ana Tablosu
            db.run(`
                CREATE TABLE IF NOT EXISTS sevkiyatlar (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sevkiyat_no VARCHAR(50) NOT NULL UNIQUE,
                    tip VARCHAR(10) NOT NULL CHECK (tip IN ('gelen', 'giden')),
                    firma_id INTEGER NOT NULL,
                    lokasyon_id INTEGER NOT NULL,
                    tarih DATETIME NOT NULL,
                    durum VARCHAR(20) NOT NULL DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'tamamlandi', 'iptal')),
                    aciklama TEXT,
                    olusturan_kullanici VARCHAR(255) NOT NULL,
                    olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (firma_id) REFERENCES sevkiyat_firmalari(id) ON DELETE RESTRICT,
                    FOREIGN KEY (lokasyon_id) REFERENCES sevkiyat_lokasyonlari(id) ON DELETE RESTRICT
                )
            `, (err) => {
                if (err) {
                    console.error('Sevkiyatlar tablosu oluşturma hatası:', err);
                }
            });

            // 4. Sevkiyat Resimleri Tablosu
            db.run(`
                CREATE TABLE IF NOT EXISTS sevkiyat_resimler (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sevkiyat_id INTEGER NOT NULL,
                    resim_adi VARCHAR(255) NOT NULL,
                    resim_yolu VARCHAR(500) NOT NULL,
                    dosya_boyutu INTEGER,
                    yuklenme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sevkiyat_id) REFERENCES sevkiyatlar(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    console.error('Sevkiyat resimleri tablosu oluşturma hatası:', err);
                }
            });

            // İndeksler oluştur
            db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_tarih ON sevkiyatlar(tarih)");
            db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_tip ON sevkiyatlar(tip)");
            db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_durum ON sevkiyatlar(durum)");
            db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_firma ON sevkiyatlar(firma_id)");
            db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_lokasyon ON sevkiyatlar(lokasyon_id)");
            db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyat_resimler_sevkiyat ON sevkiyat_resimler(sevkiyat_id)");

            // Örnek firma ve lokasyon verilerini ekle
            insertSampleData(db);

        });

        db.close((err) => {
            if (err) {
                console.error('Veritabanı kapatma hatası:', err);
                reject(err);
            } else {
                console.log('✅ Sevkiyat modülü veritabanı tabloları başarıyla oluşturuldu!');
                resolve();
            }
        });
    });
}

function insertSampleData(db) {
    // Örnek firmalar
    const sampleFirms = [
        ['TERKIN', 'dis', 'Dış Firma Adresi 1', '0212-555-0001', 'Ahmet Yılmaz'],
        ['VATAN', 'dis', 'Dış Firma Adresi 2', '0212-555-0002', 'Mehmet Kaya'],
        ['ALTERM', 'dis', 'Dış Firma Adresi 3', '0212-555-0003', 'Ali Demir'],
        ['KOWAY', 'dis', 'Dış Firma Adresi 4', '0212-555-0004', 'Ayşe Şen'],
        ['ARELSAN', 'dis', 'Dış Firma Adresi 5', '0212-555-0005', 'Fatma Öz'],
        ['BM MIL', 'dis', 'Dış Firma Adresi 6', '0212-555-0006', 'Hasan Çelik'],
        ['EFE LAZER', 'dis', 'Dış Firma Adresi 7', '0212-555-0007', 'Zeynep Yıldız']
    ];

    const firmStmt = db.prepare(`
        INSERT OR IGNORE INTO sevkiyat_firmalari (firma_adi, tip, adres, telefon, yetkili_kisi)
        VALUES (?, ?, ?, ?, ?)
    `);

    sampleFirms.forEach(firm => {
        firmStmt.run(firm);
    });
    firmStmt.finalize();

    // Örnek lokasyonlar
    const sampleLocations = [
        ['BALIKLI', 'ic', 'İç Lokasyon - Balıklı Tesisi'],
        ['ORGANIZE', 'ic', 'İç Lokasyon - Organize Sanayi'],
        ['KAYAPA', 'ic', 'İç Lokasyon - Kayapa Tesisi']
    ];

    const locStmt = db.prepare(`
        INSERT OR IGNORE INTO sevkiyat_lokasyonlari (lokasyon_adi, tip, adres)
        VALUES (?, ?, ?)
    `);

    sampleLocations.forEach(location => {
        locStmt.run(location);
    });
    locStmt.finalize();

    console.log('✅ Örnek firma ve lokasyon verileri eklendi');
}

// Sevkiyat numarası üretme fonksiyonu
function generateSevkiyatNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = now.getTime().toString().slice(-3); // Son 3 digit
    
    return `SEV-${year}${month}${day}-${time}`;
}

// Export functions
module.exports = {
    createSevkiyatTables,
    generateSevkiyatNo
};

// Eğer dosya doğrudan çalıştırılırsa migration'ı başlat
if (require.main === module) {
    createSevkiyatTables()
        .then(() => {
            console.log('Migration tamamlandı!');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Migration hatası:', err);
            process.exit(1);
        });
}
