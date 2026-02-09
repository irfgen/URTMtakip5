const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// foto_path düzelt
const fixFotoPath = `
UPDATE Parcalar
SET foto_path = '/uploads/fotograflar/' || foto_path
WHERE foto_path IS NOT NULL
  AND foto_path != ''
  AND foto_path NOT LIKE '/uploads/fotograflar/%';
`;

// teknik_resim_path düzelt
const fixTeknikResimPath = `
UPDATE Parcalar
SET teknik_resim_path = '/uploads/teknik_resimler/' || teknik_resim_path
WHERE teknik_resim_path IS NOT NULL
  AND teknik_resim_path != ''
  AND teknik_resim_path NOT LIKE '/uploads/teknik_resimler/%';
`;

db.serialize(() => {
  db.run(fixFotoPath, function(err) {
    if (err) {
      console.error('foto_path güncelleme hatası:', err.message);
    } else {
      console.log('foto_path güncellemesi tamamlandı.');
    }
  });
  db.run(fixTeknikResimPath, function(err) {
    if (err) {
      console.error('teknik_resim_path güncelleme hatası:', err.message);
    } else {
      console.log('teknik_resim_path güncellemesi tamamlandı.');
    }
  });
});

db.close();
