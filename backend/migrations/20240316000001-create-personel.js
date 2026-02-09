'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Personel', {
      personel_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ad: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      soyad: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      tc_kimlik: {
        type: Sequelize.STRING(11),
        unique: true
      },
      dogum_tarihi: {
        type: Sequelize.DATE
      },
      ise_baslama_tarihi: {
        type: Sequelize.DATE,
        allowNull: false
      },
      pozisyon: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      departman: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      telefon: {
        type: Sequelize.STRING(15)
      },
      email: {
        type: Sequelize.STRING(100),
        unique: true
      },
      adres: {
        type: Sequelize.TEXT
      },
      aktif_durum: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      vardiya: {
        type: Sequelize.ENUM('sabah', 'aksam', 'gece'),
        allowNull: false
      },
      izin_durumu: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      olusturma_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      guncelleme_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // İndeksler
    await queryInterface.addIndex('Personel', ['tc_kimlik']);
    await queryInterface.addIndex('Personel', ['aktif_durum']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Personel');
  }
};