const { sequelize } = require('./src/config/database');

async function createVardiyaYonetimiTables() {
  try {
    console.log('Vardiya yönetimi tabloları oluşturuluyor...');
    
    // Vardiyalar tablosunu oluştur
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vardiyalar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vardiya_adi VARCHAR(100) NOT NULL,
        baslangic_saati TIME NOT NULL,
        bitis_saati TIME NOT NULL,
        haftalik_calisma_gunleri TEXT DEFAULT '[1,2,3,4,5]',
        aktif BOOLEAN DEFAULT 1,
        aciklama TEXT,
        renk VARCHAR(7) DEFAULT '#1976d2',
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Vardiyalar tablosu oluşturuldu');
    
    // Personeller tablosunu oluştur
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS personeller (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        personel_adi VARCHAR(100) NOT NULL,
        sicil_no VARCHAR(20) UNIQUE,
        pozisyon VARCHAR(100),
        telefon VARCHAR(20),
        email VARCHAR(100),
        vardiya_id INTEGER,
        aktif BOOLEAN DEFAULT 1,
        maas DECIMAL(10,2),
        ise_baslama_tarihi DATE,
        notlar TEXT,
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vardiya_id) REFERENCES vardiyalar(id)
      )
    `);
    
    console.log('✓ Personeller tablosu oluşturuldu');
    
    // Vardiya atamaları tablosunu oluştur
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vardiya_atamalari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        personel_id INTEGER NOT NULL,
        vardiya_id INTEGER NOT NULL,
        tarih DATE NOT NULL,
        baslangic_saati TIME,
        bitis_saati TIME,
        durum VARCHAR(20) DEFAULT 'planlanan' CHECK (durum IN ('planlanan', 'aktif', 'tamamlandi', 'iptal')),
        fiili_baslangic DATETIME,
        fiili_bitis DATETIME,
        notlar TEXT,
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (personel_id) REFERENCES personeller(id),
        FOREIGN KEY (vardiya_id) REFERENCES vardiyalar(id),
        UNIQUE(personel_id, tarih)
      )
    `);
    
    console.log('✓ Vardiya atamaları tablosu oluşturuldu');
    
    // Örnek vardiya verilerini ekle
    await sequelize.query(`
      INSERT OR IGNORE INTO vardiyalar (vardiya_adi, baslangic_saati, bitis_saati, haftalik_calisma_gunleri, renk, aciklama)
      VALUES 
        ('Gündüz Vardiyası', '08:00:00', '17:00:00', '[1,2,3,4,5]', '#1976d2', 'Standart gündüz çalışma vardiyası'),
        ('Gece Vardiyası', '20:00:00', '05:00:00', '[1,2,3,4,5]', '#f44336', 'Gece çalışma vardiyası'),
        ('Hafta Sonu', '09:00:00', '18:00:00', '[6,7]', '#ff9800', 'Hafta sonu çalışma vardiyası')
    `);
    
    console.log('✓ Örnek vardiya verileri eklendi');
    
    // Örnek personel verilerini ekle
    await sequelize.query(`
      INSERT OR IGNORE INTO personeller (personel_adi, sicil_no, pozisyon, vardiya_id, telefon)
      VALUES 
        ('Ahmet Yılmaz', '001', 'CNC Operatörü', 1, '0555-000-0001'),
        ('Mehmet Demir', '002', 'Torna Operatörü', 1, '0555-000-0002'),
        ('Fatma Kaya', '003', 'Kalite Kontrol', 2, '0555-000-0003'),
        ('Ali Özkan', '004', 'Usta', 1, '0555-000-0004')
    `);
    
    console.log('✓ Örnek personel verileri eklendi');
    
    console.log('🎉 Vardiya yönetimi tabloları başarıyla oluşturuldu!');
    
  } catch (error) {
    console.error('❌ Vardiya yönetimi tabloları oluşturulurken hata:', error);
  } finally {
    await sequelize.close();
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  createVardiyaYonetimiTables();
}

module.exports = { createVardiyaYonetimiTables };
