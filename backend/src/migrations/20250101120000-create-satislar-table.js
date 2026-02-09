'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // satislar tablosunu oluştur
    await queryInterface.createTable('satislar', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      makina_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        comment: 'Satılan makina UUID',
        references: {
          model: 'makinalar',
          key: 'makina_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      makina_adi: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Redundant ama hızlı sorgu için'
      },
      satis_adedi: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Kaç adet makina satıldı'
      },
      toplam_parca: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Kaç farklı parça stoktan düştü'
      },
      toplam_stok_dusulen: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Toplam kaç adet parça düşüldü'
      },
      durum: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'tamamlandi',
        comment: 'Satış durumu'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Opsiyonel not'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // İndeksler oluştur
    await queryInterface.addIndex('satislar', ['makina_id']);
    await queryInterface.addIndex('satislar', ['created_at']);
    await queryInterface.addIndex('satislar', ['durum']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('satislar');
  }
};
