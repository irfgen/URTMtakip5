const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function createFasonGrupTables() {
  try {
    console.log('🚀 Fason grup tabloları oluşturuluyor...');

    // Fason gruplar tablosunu oluştur
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS fason_gruplar (
        fason_grup_id TEXT PRIMARY KEY,
        grup_adi TEXT NOT NULL UNIQUE,
        aciklama TEXT,
        renk TEXT DEFAULT '#1976d2',
        aktif BOOLEAN DEFAULT 1,
        toplam_parca_sayisi INTEGER DEFAULT 0,
        olusturan_kisi TEXT,
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `, { type: QueryTypes.RAW });

    console.log('✅ fason_gruplar tablosu oluşturuldu');

    // Fason grup parçaları tablosunu oluştur
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS fason_grup_parcalari (
        fason_grup_parca_id TEXT PRIMARY KEY,
        fason_grup_id TEXT NOT NULL,
        parca_kodu TEXT NOT NULL,
        varsayilan_adet INTEGER DEFAULT 1,
        boyut_aciklamasi TEXT,
        ozel_notlar TEXT,
        sira_no INTEGER DEFAULT 1,
        aktif BOOLEAN DEFAULT 1,
        ekleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fason_grup_id) REFERENCES fason_gruplar(fason_grup_id) ON DELETE CASCADE,
        FOREIGN KEY (parca_kodu) REFERENCES parcalar(parcaKodu) ON DELETE CASCADE,
        UNIQUE(fason_grup_id, parca_kodu)
      );
    `, { type: QueryTypes.RAW });

    console.log('✅ fason_grup_parcalari tablosu oluşturuldu');

    // Fason iş emirleri tablosuna fason_grup_id sütunu ekle
    await sequelize.query(`
      ALTER TABLE fason_is_emirleri 
      ADD COLUMN fason_grup_id TEXT REFERENCES fason_gruplar(fason_grup_id);
    `, { type: QueryTypes.RAW });

    console.log('✅ fason_is_emirleri tablosuna fason_grup_id sütunu eklendi');

    // İndeksler oluştur
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_fason_grup_aktif ON fason_gruplar(aktif);
    `, { type: QueryTypes.RAW });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_fason_grup_parca_grup_id ON fason_grup_parcalari(fason_grup_id);
    `, { type: QueryTypes.RAW });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_fason_grup_parca_kodu ON fason_grup_parcalari(parca_kodu);
    `, { type: QueryTypes.RAW });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_fason_is_emri_grup_id ON fason_is_emirleri(fason_grup_id);
    `, { type: QueryTypes.RAW });

    console.log('✅ İndeksler oluşturuldu');

    // Bazı örnek gruplar ekle
    await sequelize.query(`
      INSERT OR IGNORE INTO fason_gruplar (
        fason_grup_id, grup_adi, aciklama, renk, olusturan_kisi
      ) VALUES 
      ('grup-001', 'Küçük Parçalar', 'Boyutları küçük olan parçalar için grup', '#4CAF50', 'System'),
      ('grup-002', 'Büyük Parçalar', 'Boyutları büyük olan parçalar için grup', '#FF9800', 'System'),
      ('grup-003', 'Hassas İşlemler', 'Özel işlem gerektiren parçalar', '#F44336', 'System'),
      ('grup-004', 'Standart İşlemler', 'Rutin işlemler için grup', '#2196F3', 'System');
    `, { type: QueryTypes.RAW });

    console.log('✅ Örnek fason grupları eklendi');

    console.log('🎉 Fason grup tabloları başarıyla oluşturuldu!');

  } catch (error) {
    console.error('❌ Fason grup tabloları oluşturulurken hata:', error);
    throw error;
  }
}

// Scripti doğrudan çalıştırabilmek için
if (require.main === module) {
  createFasonGrupTables()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createFasonGrupTables;
