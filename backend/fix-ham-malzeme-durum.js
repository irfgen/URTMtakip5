const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Mevcut ham malzeme durumlarını güncelleniyor...');

// Mevcut "beklemede" durumunu "gönderilmedi" olarak güncelle
const updateQuery = `
  UPDATE fason_is_emirleri 
  SET ham_malzeme_durumu = 'gönderilmedi' 
  WHERE ham_malzeme_durumu = 'beklemede' OR ham_malzeme_durumu IS NULL
`;

db.run(updateQuery, function(err) {
  if (err) {
    console.error('Ham malzeme durumu güncellenemedi:', err.message);
  } else {
    console.log(`${this.changes} kayıt güncellendi.`);
  }

  // Mevcut ham malzeme gönderim tarihi olan kayıtları "gönderildi" olarak işaretle
  const updateSentQuery = `
    UPDATE fason_is_emirleri 
    SET ham_malzeme_durumu = 'gönderildi' 
    WHERE ham_malzeme_gonderim_tarihi IS NOT NULL
  `;
  
  db.run(updateSentQuery, function(err) {
    if (err) {
      console.error('Gönderilmiş ham malzeme durumu güncellenemedi:', err.message);
    } else {
      console.log(`${this.changes} gönderilmiş kayıt güncellendi.`);
    }

    db.close((err) => {
      if (err) {
        console.error('Database kapatma hatası:', err.message);
      } else {
        console.log('Ham malzeme durumları güncellendi. Database bağlantısı kapatıldı.');
      }
    });
  });
});
