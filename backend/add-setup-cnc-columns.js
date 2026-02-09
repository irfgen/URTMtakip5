const db = require('./config/database').sequelize;

// SQLite sorgusu ile doğrudan sütunları ekleme
async function addColumns() {
  try {
    // Veritabanı bağlantısını oluştur
    await db.authenticate();
    console.log('Veritabanına bağlanıldı.');

    // setup_sayisi sütununu ekle
    await db.query(`
      PRAGMA foreign_keys=off;
      
      BEGIN TRANSACTION;
      
      -- is_emri_ozetleri tablosuna setup_sayisi sütununu ekle
      ALTER TABLE is_emri_ozetleri ADD COLUMN setup_sayisi INTEGER DEFAULT 0;
      
      -- is_emri_ozetleri tablosuna cnc_suresi sütununu ekle
      ALTER TABLE is_emri_ozetleri ADD COLUMN cnc_suresi REAL DEFAULT 0;
      
      COMMIT;
      
      PRAGMA foreign_keys=on;
    `);

    console.log('setup_sayisi ve cnc_suresi sütunları başarıyla eklendi.');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

addColumns();
