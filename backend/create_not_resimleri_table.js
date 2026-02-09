const { sequelize } = require('./src/config/database');

async function createNotResimleriTable() {
  try {
    // not_resimleri tablosunu oluştur
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS not_resimleri (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        not_id INTEGER NOT NULL,
        resim_yolu VARCHAR(255) NOT NULL,
        resim_adi VARCHAR(255),
        resim_boyutu INTEGER,
        sira_no INTEGER DEFAULT 0,
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        aktif TINYINT(1) DEFAULT 1,
        FOREIGN KEY (not_id) REFERENCES notlar(id)
      )
    `);

    console.log('not_resimleri tablosu başarıyla oluşturuldu');
    
    // Mevcut notlardaki resimleri yeni tabloya taşı
    const [notlarWithImages] = await sequelize.query(`
      SELECT id, resim_yolu FROM notlar 
      WHERE resim_yolu IS NOT NULL AND resim_yolu != ''
    `);

    console.log(`${notlarWithImages.length} adet resimli not bulundu`);

    // Her bir resmi yeni tabloya taşı
    for (const not of notlarWithImages) {
      await sequelize.query(`
        INSERT INTO not_resimleri (not_id, resim_yolu, sira_no, olusturma_tarihi)
        VALUES (?, ?, 1, datetime('now'))
      `, {
        replacements: [not.id, not.resim_yolu]
      });
    }

    console.log('Mevcut resimler yeni tabloya taşındı');
    
    // Tablonun oluştuğunu kontrol et
    const [results] = await sequelize.query('PRAGMA table_info(not_resimleri)');
    console.log('\nnot_resimleri tablosu yapısı:');
    results.forEach(col => console.log(`${col.name}: ${col.type}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Hata:', err);
    process.exit(1);
  }
}

createNotResimleriTable();
