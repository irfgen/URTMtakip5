const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

function addUretimSonucuColumn() {
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    console.log('🔧 İş emri özetleri tablosuna uretim_sonucu kolonu ekleniyor...');

    // Önce kolonun var olup olmadığını kontrol et
    db.all("PRAGMA table_info(is_emri_ozetleri)", (err, columns) => {
      if (err) {
        console.error('❌ Tablo bilgileri alınamadı:', err.message);
        reject(err);
        return;
      }

      const hasUretimSonucuColumn = columns.some(col => col.name === 'uretim_sonucu');

      if (hasUretimSonucuColumn) {
        console.log('✅ uretim_sonucu kolonu zaten mevcut');
        db.close();
        resolve();
        return;
      }

      // Kolonu ekle
      db.run(`ALTER TABLE is_emri_ozetleri ADD COLUMN uretim_sonucu INTEGER DEFAULT 0`, (err) => {
        if (err) {
          console.error('❌ Kolon eklenirken hata:', err.message);
          reject(err);
        } else {
          console.log('✅ uretim_sonucu kolonu başarıyla eklendi');
          resolve();
        }
        db.close();
      });
    });
  });
}

// Script doğrudan çalıştırılırsa
if (require.main === module) {
  addUretimSonucuColumn()
    .then(() => {
      console.log('🎉 Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addUretimSonucuColumn;
