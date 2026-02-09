'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IsEmirleri', {
      is_emri_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      is_emri_no: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      musteri_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      urun_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      siparis_miktari: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      teslim_tarihi: {
        type: Sequelize.DATE,
        allowNull: false
      },
      oncelik: {
        type: Sequelize.ENUM('dusuk', 'normal', 'yuksek', 'acil'),
        defaultValue: 'normal'
      },
      durum: {
        type: Sequelize.ENUM('beklemede', 'uretimde', 'tamamlandi', 'iptal'),
        defaultValue: 'beklemede'
      },
      baslama_tarihi: {
        type: Sequelize.DATE
      },
      bitis_tarihi: {
        type: Sequelize.DATE
      },
      notlar: {
        type: Sequelize.TEXT
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
    await queryInterface.addIndex('IsEmirleri', ['is_emri_no']);
    await queryInterface.addIndex('IsEmirleri', ['durum']);
    await queryInterface.addIndex('IsEmirleri', ['teslim_tarihi']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('IsEmirleri');
  }
};