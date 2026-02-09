'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // stok_hareketleri tablosunu oluştur
    await queryInterface.createTable('stok_hareketleri', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      satis_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Satış kaydı referansı',
        references: {
          model: 'satislar',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parca_kodu: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Parça kodu',
        references: {
          model: 'parcalar',
          key: 'parca_kodu'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      parca_adi: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Parça adı'
      },
      bom_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'BOM ID'
      },
      bom_adi: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'BOM adı'
      },
      birim_miktar: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'BOM içindeki birim miktar'
      },
      satis_adedi: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Satılan makina adedi'
      },
      dusulen_miktar: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Düşülen toplam miktar (birim_miktar × satis_adedi)'
      },
      onceki_stok: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Stok düşmeden önceki miktar'
      },
      sonraki_stok: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Stok düşmeden sonraki miktar'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // İndeksler oluştur
    await queryInterface.addIndex('stok_hareketleri', ['satis_id']);
    await queryInterface.addIndex('stok_hareketleri', ['parca_kodu']);
    await queryInterface.addIndex('stok_hareketleri', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('stok_hareketleri');
  }
};
