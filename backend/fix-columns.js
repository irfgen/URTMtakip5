const sqlite3 = require('sqlite3').verbose();

// Veritabanı bağlantısını oluştur
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Veritabanına bağlanırken hata:', err.message);
    process.exit(1);
  }
  console.log('Veritabanına başarıyla bağlandı.');
  
  // Tablo şemasını kontrol et
  db.get("PRAGMA table_info(is_emri_ozetleri)", (err, rows) => {
    if (err) {
      console.error('Tablo bilgisi alınamadı:', err.message);
      closeDb();
      return;
    }
    
    console.log('Tablo şeması:', rows);
    
    // Sütun ekleme işlemini gerçekleştir
    addColumns();
  });
});

// Sütunları ekle
function addColumns() {
  db.exec(`
    BEGIN TRANSACTION;
    
    -- setup_sayisi sütununu ekle
    ALTER TABLE is_emri_ozetleri ADD COLUMN setup_sayisi INTEGER DEFAULT 0;
    
    -- cnc_suresi sütununu ekle
    ALTER TABLE is_emri_ozetleri ADD COLUMN cnc_suresi REAL DEFAULT 0;
    
    COMMIT;
  `, (err) => {
    if (err) {
      console.error('Sütun ekleme hatası:', err.message);
    } else {
      console.log('setup_sayisi ve cnc_suresi sütunları başarıyla eklendi.');
    }
    
    // Değişiklikleri kontrol et
    db.get("PRAGMA table_info(is_emri_ozetleri)", (err, rows) => {
      if (err) {
        console.error('Güncellenmiş tablo bilgisi alınamadı:', err.message);
      } else {
        console.log('Güncellenmiş tablo şeması:', rows);
      }
      
      closeDb();
    });
  });
}

// Veritabanı bağlantısını kapat
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Veritabanı kapatılırken hata:', err.message);
    } else {
      console.log('Veritabanı bağlantısı kapatıldı.');
    }
  });
}
