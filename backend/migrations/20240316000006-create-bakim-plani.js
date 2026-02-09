'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BakimPlani', {
      bakim_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tezgah_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tezgahlar',
          key: 'tezgah_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      bakim_turu: {
        type: Sequelize.ENUM('periyodik', 'ariza', 'onleyici'),
        allowNull: false
      },
      planlanan_tarih: {
        type: Sequelize.DATE,
        allowNull: false
      },
      gerceklesen_tarih: {
        type: Sequelize.DATE
      },
      bakim_personeli_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Personel',
          key: 'personel_id'
        }
      },
      bakim_aciklamasi: {
        type: Sequelize.TEXT
      },
      maliyet: {
        type: Sequelize.DECIMAL(10, 2)
      },
      durum: {
        type: Sequelize.ENUM('planlandı', 'tamamlandı', 'ertelendi', 'iptal'),
        defaultValue: 'planlandı'
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
    await queryInterface.addIndex('BakimPlani', ['planlanan_tarih']);
    await queryInterface.addIndex('BakimPlani', ['durum']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('BakimPlani');
  }
};