/**
 * Migration Script: İş Emirlerinin Durumlarını "tezgahta" Olarak Güncelle
 * 
 * Bu script mevcut sistemdeki makine-spesifik durumları ("freze", "torna", "5 metre", "6 metre")
 * unified "tezgahta" durumuna çevirir. Bu sayede atanmış iş emirleri diğer makinelerde görünmez.
 * 
 * Çalıştırma: node migrate-durum-to-tezgahta.js
 */

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Veritabanı bağlantısı
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'), // Ana database dosyası
  logging: console.log // SQL sorgularını göster
});

// IsEmri model tanımı
const IsEmri = sequelize.define('IsEmri', {
  is_emri_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  is_emri_no: {
    type: DataTypes.STRING,
    allowNull: false
  },
  durum: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'beklemede'
  },
  parca_kodu: DataTypes.STRING,
  is_adi: DataTypes.STRING,
  adet: DataTypes.INTEGER,
  atanan_tezgah_id: DataTypes.INTEGER,
  atanma_zamani: DataTypes.DATE,
  teslim_tarihi: DataTypes.DATE
}, {
  tableName: 'is_emirleri',
  timestamps: true
});

async function migrateStatus() {
  try {
    console.log('🔄 Migration başlatılıyor...');
    
    // Veritabanına bağlan
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı');
    
    // Mevcut durumları analiz et
    const currentStatuses = await sequelize.query(
      'SELECT durum, COUNT(*) as count FROM is_emirleri GROUP BY durum ORDER BY count DESC',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📊 Mevcut durumlar:');
    currentStatuses.forEach(status => {
      console.log(`  ${status.durum}: ${status.count} adet`);
    });
    
    // Güncellenecek durumlar
    const targetStatuses = ['freze', 'torna', '5 metre', '6 metre'];
    
    // Her durum için güncelleme yap
    let totalUpdated = 0;
    
    for (const status of targetStatuses) {
      const updateResult = await IsEmri.update(
        { durum: 'tezgahta' },
        { 
          where: { durum: status },
          returning: false // SQLite için
        }
      );
      
      const updatedCount = updateResult[0]; // Güncellenen kayıt sayısı
      console.log(`📝 "${status}" -> "tezgahta": ${updatedCount} kayıt güncellendi`);
      totalUpdated += updatedCount;
    }
    
    console.log(`\n✅ Toplam ${totalUpdated} kayıt güncellendi`);
    
    // Güncelleme sonrası durumları kontrol et
    const newStatuses = await sequelize.query(
      'SELECT durum, COUNT(*) as count FROM is_emirleri GROUP BY durum ORDER BY count DESC',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📊 Güncelleme sonrası durumlar:');
    newStatuses.forEach(status => {
      console.log(`  ${status.durum}: ${status.count} adet`);
    });
    
    // Backup oluşturma önerisi
    console.log('\n💡 Öneriler:');
    console.log('  - Değişiklikler kalıcıdır, geri almak için backup kullanın');
    console.log('  - Frontend uygulamasını yeniden başlatın');
    console.log('  - Tezgah atama işlemlerini test edin');
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Veritabanı bağlantısı kapatıldı');
  }
}

// Script'i doğrudan çalıştırma kontrolü
if (require.main === module) {
  console.log('🚀 İş Emri Durum Migration Script');
  console.log('=======================================');
  
  // Kullanıcı onayı (production güvenliği için)
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Bu işlem iş emirlerinin durumlarını kalıcı olarak değiştirecek. Devam etmek istiyor musunuz? (evet/hayır): ', (answer) => {
    if (answer.toLowerCase() === 'evet' || answer.toLowerCase() === 'e') {
      migrateStatus().then(() => {
        console.log('\n🎉 Migration tamamlandı!');
        rl.close();
      });
    } else {
      console.log('❌ Migration iptal edildi');
      rl.close();
    }
  });
} else {
  // Module olarak import edildiğinde
  module.exports = { migrateStatus, IsEmri, sequelize };
}
