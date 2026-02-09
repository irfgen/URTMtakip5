const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database dosyalarının yolları
const dbPath = path.join(__dirname, 'database.sqlite');

// Backup path
const backupPath = path.join(__dirname, `database_backup_stok_karti_id_${Date.now()}.sqlite`);

console.log('🔧 İş emirleri tablosuna stok_karti_id alanı ekleniyor...');

async function runMigration() {
  return new Promise((resolve, reject) => {
    // Backup oluştur
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`📋 Backup oluşturuldu: ${backupPath}`);
    } catch (error) {
      console.error('❌ Backup oluşturma hatası:', error);
      return reject(error);
    }

    // Database bağlantısı
    const db = new sqlite3.Database(dbPath);

    // Mevcut tablo yapısını kontrol et
    db.all("PRAGMA table_info(is_emirleri)", (err, tableInfo) => {
      if (err) {
        console.error('❌ Tablo bilgisi alma hatası:', err);
        db.close();
        return reject(err);
      }

      console.log('📊 Mevcut is_emirleri tablo yapısı:');
      tableInfo.forEach(column => {
        console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
      });

      // Stok kartı ID alanı zaten var mı kontrol et
      const stokKartiIdExists = tableInfo.some(column => column.name === 'stok_karti_id');

      if (stokKartiIdExists) {
        console.log('✅ stok_karti_id alanı zaten mevcut');
        
        // İstatistikleri göster ve kapat
        showStats(db, () => {
          db.close();
          resolve();
        });
      } else {
        // Stok kartı ID alanını ekle
        console.log('➕ stok_karti_id alanı ekleniyor...');
        
        db.run(`
          ALTER TABLE is_emirleri 
          ADD COLUMN stok_karti_id INTEGER REFERENCES stok_kartlari(id)
        `, (err) => {
          if (err) {
            console.error('❌ Alan ekleme hatası:', err);
            db.close();
            return reject(err);
          }

          console.log('✅ stok_karti_id alanı başarıyla eklendi');

          // Tablo yapısını tekrar kontrol et
          db.all("PRAGMA table_info(is_emirleri)", (err, updatedTableInfo) => {
            if (err) {
              console.error('❌ Güncellenmiş tablo bilgisi alma hatası:', err);
            } else {
              console.log('📊 Güncellenmiş is_emirleri tablo yapısı:');
              updatedTableInfo.forEach(column => {
                console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
              });
            }

            // İstatistikleri göster ve kapat
            showStats(db, () => {
              db.close();
              resolve();
            });
          });
        });
      }
    });
  });
}

function showStats(db, callback) {
  // İş emirleri sayısını göster
  db.get("SELECT COUNT(*) as count FROM is_emirleri", (err, isEmirleriCount) => {
    if (err) {
      console.error('❌ İş emirleri sayısı alma hatası:', err);
    } else {
      console.log(`📊 Toplam iş emri sayısı: ${isEmirleriCount.count}`);
    }

    // Stok kartları sayısını göster
    db.get("SELECT COUNT(*) as count FROM stok_kartlari", (err, stokKartlariCount) => {
      if (err) {
        console.error('❌ Stok kartları sayısı alma hatası:', err);
      } else {
        console.log(`📊 Toplam stok kartı sayısı: ${stokKartlariCount.count}`);
      }

      callback();
    });
  });
}

// Migration'ı çalıştır
runMigration()
  .then(() => {
    console.log('✅ Database migration tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration sırasında hata:', error);
    
    // Hata durumunda backup'ı geri yükle
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, dbPath);
        console.log('🔄 Backup geri yüklendi');
      } catch (restoreError) {
        console.error('❌ Backup geri yükleme hatası:', restoreError);
      }
    }
    
    process.exit(1);
  });
