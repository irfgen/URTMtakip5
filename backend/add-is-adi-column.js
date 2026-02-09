'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config.json').development;

async function runMigration() {
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    storage: config.storage, // SQLite için
    logging: console.log
  });

  try {
    // Bağlantıyı test et
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');

    // is_emri_ozetleri tablosuna is_adi sütunu ekle
    await sequelize.query(`PRAGMA table_info(is_emri_ozetleri)`).then(async ([columns]) => {
      const columnExists = columns.some(column => column.name === 'is_adi');
      
      if (!columnExists) {
        console.log('is_adi sütunu ekleniyor...');
        await sequelize.query(`ALTER TABLE is_emri_ozetleri ADD COLUMN is_adi TEXT`);
        console.log('is_adi sütunu eklendi.');
      } else {
        console.log('is_adi sütunu zaten mevcut.');
      }
    });

    console.log('Migration başarıyla tamamlandı.');
  } catch (error) {
    console.error('Migration hatası:', error);
  } finally {
    await sequelize.close();
    console.log('Veritabanı bağlantısı kapatıldı.');
  }
}

runMigration();
