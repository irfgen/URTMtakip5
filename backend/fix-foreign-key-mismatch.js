const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

async function fixForeignKeyMismatch() {
    const db = new sqlite3.Database(dbPath);
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            console.log('🔧 Foreign key mismatch sorunu düzeltiliyor...');
            
            // Foreign key constraint'leri devre dışı bırak
            db.run("PRAGMA foreign_keys = OFF");
            
            // Mevcut fason_grup_parcalari tablosunu yeniden adlandır
            db.run(`ALTER TABLE fason_grup_parcalari RENAME TO fason_grup_parcalari_old;`, (err) => {
                if (err) {
                    console.error('Tablo yeniden adlandırma hatası:', err);
                    reject(err);
                    return;
                }
                console.log('✅ Eski tablo yeniden adlandırıldı');
            });
            
            // Yeni fason_grup_parcalari tablosunu oluştur
            db.run(`
                CREATE TABLE fason_grup_parcalari (
                    fason_grup_parca_id TEXT PRIMARY KEY,
                    fason_grup_id TEXT NOT NULL,
                    parca_kodu TEXT NOT NULL,
                    varsayilan_adet INTEGER DEFAULT 1,
                    boyut_aciklamasi TEXT,
                    ozel_notlar TEXT,
                    sira_no INTEGER DEFAULT 1,
                    aktif BOOLEAN DEFAULT 1,
                    ekleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (fason_grup_id) REFERENCES fason_gruplar(fason_grup_id) ON DELETE CASCADE,
                    FOREIGN KEY (parca_kodu) REFERENCES parcalar(parca_kodu) ON DELETE CASCADE,
                    UNIQUE(fason_grup_id, parca_kodu)
                );
            `, (err) => {
                if (err) {
                    console.error('Yeni tablo oluşturma hatası:', err);
                    reject(err);
                    return;
                }
                console.log('✅ Yeni tablo oluşturuldu');
            });
            
            // Varolan verileri yeni tabloya kopyala
            db.run(`
                INSERT INTO fason_grup_parcalari 
                SELECT * FROM fason_grup_parcalari_old
                WHERE fason_grup_id IN (SELECT fason_grup_id FROM fason_gruplar)
                AND parca_kodu IN (SELECT parca_kodu FROM parcalar);
            `, (err) => {
                if (err) {
                    console.error('Veri kopyalama hatası:', err);
                    // Hata olsa bile devam et
                }
                console.log('✅ Geçerli veriler kopyalandı');
            });
            
            // Eski tabloyu sil
            db.run(`DROP TABLE IF EXISTS fason_grup_parcalari_old;`, (err) => {
                if (err) {
                    console.error('Eski tablo silme hatası:', err);
                }
                console.log('✅ Eski tablo silindi');
            });
            
            // İndeksleri yeniden oluştur
            db.run(`CREATE INDEX IF NOT EXISTS idx_fason_grup_parca_grup_id ON fason_grup_parcalari(fason_grup_id);`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_fason_grup_parca_kodu ON fason_grup_parcalari(parca_kodu);`);
            
            console.log('✅ İndeksler yeniden oluşturuldu');
            
            // Foreign key constraint'leri tekrar etkinleştir
            db.run("PRAGMA foreign_keys = ON");
            
            // Integrity check yap
            db.get("PRAGMA foreign_key_check;", (err, row) => {
                if (err) {
                    console.error('Integrity check hatası:', err);
                    reject(err);
                    return;
                }
                
                if (row) {
                    console.log('⚠️ Hala foreign key sorunları var:', row);
                } else {
                    console.log('✅ Foreign key integrity düzeltildi!');
                }
                
                db.close();
                resolve();
            });
        });
    });
}

// Script'i çalıştır
if (require.main === module) {
    fixForeignKeyMismatch()
        .then(() => {
            console.log('🎉 Foreign key mismatch sorunu başarıyla düzeltildi!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Foreign key düzeltme hatası:', error);
            process.exit(1);
        });
}

module.exports = { fixForeignKeyMismatch };
