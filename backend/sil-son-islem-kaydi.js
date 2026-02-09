// Script to delete the last processed job record for CNC machine 99
// Run with: node sil-son-islem-kaydi.js

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Database configuration
const dbPath = path.join(__dirname, 'database.sqlite');

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Connect to database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

// Define IslemKaydi model
const IslemKaydi = sequelize.define('IslemKaydi', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  is_emri_id: { type: DataTypes.INTEGER, allowNull: false },
  is_emri_no: { type: DataTypes.STRING, allowNull: false },
  tezgah_id: { type: DataTypes.INTEGER, allowNull: false },
  durum: { type: DataTypes.STRING(50), allowNull: false },
  islenen_adet: { type: DataTypes.INTEGER, defaultValue: 0 },
  aciklama: { type: DataTypes.TEXT, allowNull: true },
  tarih_saat: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'islem_kayitlari',
  timestamps: false
});

async function main() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // Check database schema
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log('Veritabanındaki tablolar:', tables);
      
      if (tables.includes('islem_kayitlari')) {
        // Check table structure
        const tableInfo = await sequelize.query('PRAGMA table_info(islem_kayitlari);', { 
          type: sequelize.QueryTypes.SELECT 
        });
        console.log('islem_kayitlari tablosu yapısı:', tableInfo.map(col => col.name).join(', '));
      } else {
        console.error('islem_kayitlari tablosu bulunamadı!');
        return;
      }
    } catch (err) {
      console.error('Veritabanı şeması kontrol edilirken hata:', err.message);
    }

    // Find the last processed job record for tezgah_id 99
    const lastRecord = await IslemKaydi.findOne({
      where: {
        tezgah_id: 99
      },
      order: [['tarih_saat', 'DESC']]
    });

    if (!lastRecord) {
      console.log('CNC 99 için işlem kaydı bulunamadı!');
      return;
    }

    // Show information about the record to be deleted
    console.log('Silinecek kayıt bilgileri:');
    console.log(`ID: ${lastRecord.id}`);
    console.log(`İş Emri ID: ${lastRecord.is_emri_id}`);
    console.log(`İş Emri No: ${lastRecord.is_emri_no}`);
    console.log(`Durum: ${lastRecord.durum}`);
    console.log(`İşlem Tarihi: ${lastRecord.tarih_saat}`);
    console.log(`Açıklama: ${lastRecord.aciklama || 'Yok'}`);

    // Confirm deletion
    console.log('\nKayıt siliniyor...');
    
    // Delete the record
    await lastRecord.destroy();
    
    console.log('Kayıt başarıyla silindi!');

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the script
main();
