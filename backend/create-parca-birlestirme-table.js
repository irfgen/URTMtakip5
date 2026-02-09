const { sequelize } = require('./src/config/database');

async function createParcaBirlestirmeTable() {
  try {
    console.log('🔧 Parça birleştirme log tablosu oluşturuluyor...');
    
    // SQL komutunu çalıştır
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS parca_birlestirme_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutulan_parca_kodu VARCHAR(255) NOT NULL,
        silinen_parca_kodlari JSON NOT NULL,
        transfer_detaylari JSON NOT NULL,
        onceki_durum JSON,
        kullanici_id VARCHAR(255),
        kullanici_ip VARCHAR(255),
        aciklama TEXT,
        rollback_durumu ENUM('aktif', 'geri_alindi', 'geri_alinamaz') DEFAULT 'aktif',
        rollback_tarihi DATETIME,
        rollback_kullanici_id VARCHAR(255),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tutulan_parca_kodu) REFERENCES parcalar(parca_kodu) ON UPDATE CASCADE
      );
    `);
    
    // İndeksleri oluştur
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_parca_birlestirme_log_tutulan_parca 
      ON parca_birlestirme_log(tutulan_parca_kodu);
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_parca_birlestirme_log_rollback_durumu 
      ON parca_birlestirme_log(rollback_durumu);
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_parca_birlestirme_log_created_at 
      ON parca_birlestirme_log(createdAt);
    `);
    
    console.log('✅ Parça birleştirme log tablosu başarıyla oluşturuldu!');
    console.log('📊 Tablo özellikleri:');
    console.log('   - Birleştirme işlemlerinin tam log kaydı');
    console.log('   - Rollback (geri alma) desteği');
    console.log('   - Kullanıcı ve zaman izleme');
    console.log('   - Transfer edilen veri detayları');
    
  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error);
    throw error;
  }
}

// Eğer doğrudan çalıştırılıyorsa
if (require.main === module) {
  createParcaBirlestirmeTable()
    .then(() => {
      console.log('🎉 İşlem tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 İşlem başarısız:', error);
      process.exit(1);
    });
}

module.exports = createParcaBirlestirmeTable;