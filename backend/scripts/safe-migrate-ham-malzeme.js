const { sequelize } = require('../src/config/database');
const Parca = require('../src/models/Parca');
const StokKarti = require('../src/models/StokKarti');

/**
 * Foreign key kontrollerini kapatarak güvenli migration yapma
 */
async function safeRunMigration() {
  console.log('🔄 Güvenli migration başlatılıyor...');
  
  try {
    // Foreign key kontrollerini kapat
    await sequelize.query('PRAGMA foreign_keys = OFF');
    console.log('✅ Foreign key kontrolleri kapatıldı');
    
    // Migration script'ini import et ve çalıştır
    const { migrateHamMalzemeToStokKarti } = require('./migrate-ham-malzeme-to-stok-karti');
    
    console.log('🚀 Veri migration başlıyor...\n');
    await migrateHamMalzemeToStokKarti();
    
    // Foreign key kontrollerini tekrar aç
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('\n✅ Foreign key kontrolleri tekrar açıldı');
    
    console.log('\n🎉 Güvenli migration başarıyla tamamlandı!');
    
  } catch (error) {
    console.error('\n❌ Migration hatası:', error.message);
    
    // Hata durumunda da foreign key kontrollerini aç
    try {
      await sequelize.query('PRAGMA foreign_keys = ON');
      console.log('🔧 Foreign key kontrolleri hatadan sonra tekrar açıldı');
    } catch (fkError) {
      console.error('❌ Foreign key kontrollerini açarken hata:', fkError.message);
    }
    
    throw error;
  }
}

// Script'i çalıştır
if (require.main === module) {
  safeRunMigration()
    .then(() => {
      console.log('\n✅ Güvenli migration scripti başarıyla tamamlandı');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script hatası:', error);
      process.exit(1);
    });
}

module.exports = { safeRunMigration };
