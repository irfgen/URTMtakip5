'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('KaliteKontrol', {
      kontrol_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      is_emri_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'IsEmirleri',
          key: 'is_emri_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      kontrolor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Personel',
          key: 'personel_id'
        }
      },
      kontrol_tarihi: {
        type: Sequelize.DATE,
        allowNull: false
      },
      olcum_sonuclari: {
        type: Sequelize.JSON
      },
      uygunluk_durumu: {
        type: Sequelize.ENUM('uygun', 'sartli_kabul', 'red'),
        allowNull: false
      },
      red_sebebi: {
        type: Sequelize.TEXT
      },
      duzeltici_faaliyet: {
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
    await queryInterface.addIndex('KaliteKontrol', ['kontrol_tarihi']);
    await queryInterface.addIndex('KaliteKontrol', ['uygunluk_durumu']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('KaliteKontrol');
  }
};