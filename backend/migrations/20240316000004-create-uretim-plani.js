'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UretimPlani', {
      plan_id: {
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
      tezgah_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tezgahlar',
          key: 'tezgah_id'
        }
      },
      personel_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Personel',
          key: 'personel_id'
        }
      },
      planlanan_baslama: {
        type: Sequelize.DATE,
        allowNull: false
      },
      planlanan_bitis: {
        type: Sequelize.DATE,
        allowNull: false
      },
      gerceklesen_baslama: {
        type: Sequelize.DATE
      },
      gerceklesen_bitis: {
        type: Sequelize.DATE
      },
      durum: {
        type: Sequelize.ENUM('planlandı', 'basladı', 'tamamlandı', 'iptal'),
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
    await queryInterface.addIndex('UretimPlani', ['planlanan_baslama']);
    await queryInterface.addIndex('UretimPlani', ['durum']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UretimPlani');
  }
};