module.exports = {
  up: async ({ sequelize }) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Tabloyu yeniden oluştur with correct FK references
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS uygunsuzluk_raporlari_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rapor_no VARCHAR(255) NOT NULL UNIQUE,
          baslik VARCHAR(200) NOT NULL,
          aciklama TEXT NOT NULL,
          kategori TEXT NOT NULL DEFAULT 'diger',
          oncelik TEXT NOT NULL DEFAULT 'orta',
          lokasyon VARCHAR(255),
          tezgah_id INTEGER REFERENCES tezgahlar (tezgah_id) ON DELETE SET NULL ON UPDATE CASCADE,
          durum TEXT NOT NULL DEFAULT 'acik',
          raporlayan_id INTEGER NOT NULL REFERENCES personeller (id) ON DELETE NO ACTION ON UPDATE CASCADE,
          sorumlu_id INTEGER REFERENCES personeller (id) ON DELETE SET NULL ON UPDATE CASCADE,
          atama_tarihi DATETIME,
          hedef_tarih DATETIME,
          tespit_tarihi DATETIME NOT NULL,
          kapanma_tarihi DATETIME,
          maliyet DECIMAL(10, 2),
          etkinlik_puani INTEGER,
          resim_yollar JSON DEFAULT '[]',
          aktif TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL
        );
      `);
      
      // Index'leri oluştur
      await sequelize.query(`
        CREATE INDEX uygunsuzluk_raporlari_new_durum ON uygunsuzluk_raporlari_new (durum);
        CREATE INDEX uygunsuzluk_raporlari_new_kategori ON uygunsuzluk_raporlari_new (kategori);
        CREATE INDEX uygunsuzluk_raporlari_new_oncelik ON uygunsuzluk_raporlari_new (oncelik);
        CREATE INDEX uygunsuzluk_raporlari_new_raporlayan_id ON uygunsuzluk_raporlari_new (raporlayan_id);
        CREATE INDEX uygunsuzluk_raporlari_new_sorumlu_id ON uygunsuzluk_raporlari_new (sorumlu_id);
        CREATE INDEX uygunsuzluk_raporlari_new_tespit_tarihi ON uygunsuzluk_raporlari_new (tespit_tarihi);
      `);
      
      // Verileri kopyala
      await sequelize.query(`
        INSERT INTO uygunsuzluk_raporlari_new 
        SELECT * FROM uygunsuzluk_raporlari;
      `);
      
      // Eski tabloyu sil
      await sequelize.query(`DROP TABLE uygunsuzluk_raporlari;`);
      
      // Yeni tabloyu yeniden adlandır
      await sequelize.query(`ALTER TABLE uygunsuzluk_raporlari_new RENAME TO uygunsuzluk_raporlari;`);
      
      await transaction.commit();
      console.log('Uygunsuzluk raporlari tablosu foreign key\'leri düzeltildi.');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  
  down: async ({ sequelize }) => {
    // Geri alma işlemi
    await sequelize.query(`DROP TABLE IF EXISTS uygunsuzluk_raporlari;`);
  }
};
