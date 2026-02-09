'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tezgahlar', {
      tezgah_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tezgah_tanimi: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      tezgah_eksensayisi: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 2,
          max: 6
        }
      },
      tezgah_markavemodeli: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      tezgah_x: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tezgah_y: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tezgah_z: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tezgah_durumu: {
        type: Sequelize.ENUM('aktif', 'bakim', 'ariza', 'devre_disi'),
        allowNull: false,
        defaultValue: 'aktif'
      },
      tezgah_bakimgecmisi: {
        type: Sequelize.TEXT
      },
      son_bakim_tarihi: {
        type: Sequelize.DATE
      },
      bakim_periyodu: {
        type: Sequelize.INTEGER,
        comment: 'Bakım periyodu (gün)'
      },
      calisma_durumu: {
        type: Sequelize.ENUM('calisiyor', 'durdu'),
        allowNull: false,
        defaultValue: 'durdu'
      },
      durus_sebebi: {
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
    await queryInterface.addIndex('Tezgahlar', ['tezgah_durumu']);
    await queryInterface.addIndex('Tezgahlar', ['calisma_durumu']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tezgahlar');
  }
};