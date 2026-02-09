'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Hammadde', {
      hammadde_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      hammadde_kodu: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      hammadde_adi: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      malzeme_turu: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      stok_miktari: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      birim: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      minimum_stok: {
        type: Sequelize.DECIMAL(10, 2)
      },
      tedarikci_id: {
        type: Sequelize.INTEGER
      },
      raf_konumu: {
        type: Sequelize.STRING(50)
      },
      fiyat: {
        type: Sequelize.DECIMAL(10, 2)
      },
      para_birimi: {
        type: Sequelize.STRING(3),
        defaultValue: 'TRY'
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
    await queryInterface.addIndex('Hammadde', ['hammadde_kodu']);
    await queryInterface.addIndex('Hammadde', ['malzeme_turu']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Hammadde');
  }
};