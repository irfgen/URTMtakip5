'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // not_kategorileri tablosunu oluştur
    await queryInterface.createTable('not_kategorileri', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      kategori_adi: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      renk_kodu: {
        type: Sequelize.STRING,
        defaultValue: '#007bff'
      },
      olusturma_tarihi: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      guncelleme_tarihi: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      aktif: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }
    });

    // notlar tablosunu oluştur
    await queryInterface.createTable('notlar', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      baslik: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      icerik: {
        type: Sequelize.TEXT
      },
      resim_yolu: {
        type: Sequelize.STRING
      },
      kategori_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'not_kategorileri',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      olusturma_tarihi: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      guncelleme_tarihi: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      kullanici_id: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      aktif: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }
    });

    // İndeksler oluştur
    await queryInterface.addIndex('notlar', ['kategori_id']);
    await queryInterface.addIndex('notlar', ['olusturma_tarihi']);
    await queryInterface.addIndex('notlar', ['aktif']);
    await queryInterface.addIndex('not_kategorileri', ['aktif']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notlar');
    await queryInterface.dropTable('not_kategorileri');
  }
};
