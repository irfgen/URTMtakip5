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
    
    // Mevcut sütun isimlerini al
    const columnNames = rows.map(row => row.name);
    console.log('Mevcut sütunlar:', columnNames);
    
    // Eklenecek sütunları kontrol et
    const setupExists = columnNames.includes('setup_sayisi');
    const cncExists = columnNames.includes('cnc_suresi');
    
    // Sütunları ekle
    let commands = [];
    
    if (!setupExists) {
      commands.push("ALTER TABLE is_emri_ozetleri ADD COLUMN setup_sayisi INTEGER DEFAULT 0;");
      console.log('setup_sayisi sütunu eklenecek');
    }
    
    if (!cncExists) {
      commands.push("ALTER TABLE is_emri_ozetleri ADD COLUMN cnc_suresi REAL DEFAULT 0;");
      console.log('cnc_suresi sütunu eklenecek');
    }
    
    if (commands.length === 0) {
      console.log('Eklenecek sütun yok, tüm sütunlar zaten mevcut');
      closeDb();
      return;
    }
    
    // Komutları çalıştır
    db.serialize(() => {
      db.run("BEGIN TRANSACTION;");
      
      commands.forEach(cmd => {
        db.run(cmd, (err) => {
          if (err) console.error('Sütun ekleme hatası:', cmd, err.message);
          else console.log('Komut başarıyla çalıştırıldı:', cmd);
        });
      });
      
      db.run("COMMIT;", (err) => {
        if (err) console.error('Transaction commit hatası:', err.message);
        else console.log('Tüm değişiklikler kaydedildi');
        
        // Son durumu kontrol et
        db.all("PRAGMA table_info(is_emri_ozetleri)", [], (err, updatedRows) => {
          if (err) {
            console.error('Güncellenmiş tablo bilgisi alınamadı:', err.message);
          } else {
            console.log('Güncellenmiş sütunlar:', updatedRows.map(row => row.name));
          }
          closeDb();
        });
      });
    });
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
