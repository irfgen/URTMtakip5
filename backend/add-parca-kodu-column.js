const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosya yolu
const dbPath = path.join(__dirname, 'database.sqlite');

// Veritabanına bağlan
const db = new sqlite3.Database(dbPath);

// Sütun ekle
db.serialize(() => {
  console.log('Veritabanına bağlanıldı:', dbPath);
  
  // İşlemi başlat
  db.run('BEGIN TRANSACTION;');
  
  // is_emirleri tablosunda parca_kodu sütunu var mı kontrol et
  db.get("PRAGMA table_info(is_emirleri);", (err, rows) => {
    if (err) {
      console.error('Tablo bilgisi alınamadı:', err.message);
      db.run('ROLLBACK;');
      db.close();
      return;
    }
    
    // İşlemi gerçekleştir
    db.run(`ALTER TABLE is_emirleri ADD COLUMN parca_kodu TEXT REFERENCES parcalar(parca_kodu);`, (err) => {
      if (err) {
        console.error('Sütun ekleme hatası:', err.message);
        db.run('ROLLBACK;');
      } else {
        console.log('parca_kodu sütunu is_emirleri tablosuna başarıyla eklendi.');
        db.run('COMMIT;');
      }
      
      // Veritabanı bağlantısını kapat
      db.close(() => {
        console.log('Veritabanı bağlantısı kapatıldı.');
      });
    });
  });
});
