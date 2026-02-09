const { sequelize } = require('./src/config/database');

async function checkNotlarTable() {
  try {
    const [results] = await sequelize.query('PRAGMA table_info(notlar)');
    console.log('Notlar tablosu yapısı:');
    results.forEach(col => console.log(`${col.name}: ${col.type}`));
    
    // Mevcut verileri de kontrol edelim
    const [notlar] = await sequelize.query('SELECT COUNT(*) as count FROM notlar');
    console.log(`\nToplam not sayısı: ${notlar[0].count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Hata:', err);
    process.exit(1);
  }
}

checkNotlarTable();
