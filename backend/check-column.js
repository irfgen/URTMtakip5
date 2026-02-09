const sqlite3 = require('sqlite3').verbose();

// Veritabanı dosya yolu
const dbPath = './database.sqlite';

// Veritabanına bağlan
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanına bağlanma hatası:', err.message);
    return;
  }
  console.log('SQLite veritabanına bağlandı');

  // Mevcut sütunları kontrol et
  db.all("PRAGMA table_info(is_emri_ozetleri)", [], (err, rows) => {
    if (err) {
      console.error('Tablo bilgisi alınamadı:', err.message);
      closeDb();
      return;
    }
    
    // Tüm tablo bilgilerini göster
    console.log('Tablo yapısı:');
    rows.forEach((row) => {
      console.log(`${row.cid}. ${row.name} (${row.type})`);
    });
    
    closeDb();
  });
});

function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Veritabanı kapatma hatası:', err.message);
    } else {
      console.log('Veritabanı bağlantısı kapatıldı');
    }
  });
}
