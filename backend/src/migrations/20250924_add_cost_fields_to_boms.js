'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('boms', 'uretim_maliyeti', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Üretim maliyeti (USD)'
    });

    await queryInterface.addColumn('boms', 'tedarik_maliyeti', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Tedarik maliyeti (USD)'
    });

    await queryInterface.addColumn('boms', 'tedarikci_firma', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Tedarikçi firma adı'
    });

    console.log('BOM maliyet alanları başarıyla eklendi');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('boms', 'uretim_maliyeti');
    await queryInterface.removeColumn('boms', 'tedarik_maliyeti');
    await queryInterface.removeColumn('boms', 'tedarikci_firma');
    console.log('BOM maliyet alanları kaldırıldı');
  }
};