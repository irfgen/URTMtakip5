const { sequelize } = require('./src/config/database');

async function runMigration() {
  try {
    console.log('BOM maliyet alanları migration başlatılıyor...');

    // uretim_maliyeti alanını ekle
    await sequelize.query(`
      ALTER TABLE boms ADD COLUMN uretim_maliyeti DECIMAL(10,2) DEFAULT NULL
    `).catch(err => {
      if (err.message.includes('already exists') || err.message.includes('duplicate column name')) {
        console.log('uretim_maliyeti alanı zaten mevcut');
      } else {
        throw err;
      }
    });

    // tedarik_maliyeti alanını ekle
    await sequelize.query(`
      ALTER TABLE boms ADD COLUMN tedarik_maliyeti DECIMAL(10,2) DEFAULT NULL
    `).catch(err => {
      if (err.message.includes('already exists') || err.message.includes('duplicate column name')) {
        console.log('tedarik_maliyeti alanı zaten mevcut');
      } else {
        throw err;
      }
    });

    // tedarikci_firma alanını ekle
    await sequelize.query(`
      ALTER TABLE boms ADD COLUMN tedarikci_firma VARCHAR(255) DEFAULT NULL
    `).catch(err => {
      if (err.message.includes('already exists') || err.message.includes('duplicate column name')) {
        console.log('tedarikci_firma alanı zaten mevcut');
      } else {
        throw err;
      }
    });

    console.log('✅ BOM maliyet alanları başarıyla eklendi!');

    // Yeni alanları kontrol et
    const [results] = await sequelize.query("PRAGMA table_info(boms)");
    const columns = results.map(col => col.name);
    console.log('📋 BOM tablosu alanları:', columns);

  } catch (error) {
    console.error('❌ Migration hatası:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Script çalıştır
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n🎉 Migration başarıyla tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration başarısız:', error.message);
      process.exit(1);
    });
}

module.exports = { runMigration };