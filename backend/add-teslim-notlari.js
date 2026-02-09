const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Fason teslim notlari kolonu ekleniyor...');

const migration = `ALTER TABLE fason_is_emirleri ADD COLUMN teslim_notlari TEXT`;

db.run(migration, function(err) {
  if (err) {
    console.log('Migration hatası (muhtemelen zaten var):', err.message);
  } else {
    console.log('Migration başarılı');
  }

  db.close((err) => {
    if (err) {
      console.error('Database kapatma hatası:', err.message);
    } else {
      console.log('Fason teslim notlari kolonu eklendi. Database bağlantısı kapatıldı.');
    }
  });
});
