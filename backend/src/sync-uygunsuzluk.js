const { sequelize } = require('./config/database');

// Model'leri import et
const UygunsuzlukRaporlari = require('./models/UygunsuzlukRaporlari');
const UygunsuzlukNotlari = require('./models/UygunsuzlukNotlari');
const UygunsuzlukTedbirleri = require('./models/UygunsuzlukTedbirleri');
const UygunsuzlukDosyalari = require('./models/UygunsuzlukDosyalari');

async function syncTables() {
  try {
    console.log('Veritabanına bağlanılıyor...');
    await sequelize.authenticate();
    console.log('✓ Bağlantı başarılı');

    console.log('\nTablolar senkronize ediliyor...');
    await sequelize.sync();
    console.log('✓ Tablolar oluşturuldu/ güncellendi');

    // Tabloları kontrol et
    const [results] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'uygunsuzluk%'"
    );
    
    console.log('\nOluşturulan uygunsuzluk tabloları:');
    results.forEach(t => {
      console.log(`  - ${t.name}`);
    });

    console.log('\n✓ İşlem tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Hata:', error.message);
    process.exit(1);
  }
}

syncTables();
