'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // TedarikTalebi tablosuna yeni alanlar ekle
    await queryInterface.addColumn('tedarik_talepleri', 'otomatik_sevkiyat', {
      type: Sequelize.BOOLEAN,
      defaultValue: 0,
      allowNull: false,
      comment: 'Otomatik sevkiyat oluşturulsun mu'
    });

    await queryInterface.addColumn('tedarik_talepleri', 'son_islem_tarihi', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Son işlem tarihi'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Alanları geri al
    await queryInterface.removeColumn('tedarik_talepleri', 'otomatik_sevkiyat');
    await queryInterface.removeColumn('tedarik_talepleri', 'son_islem_tarihi');
  }
};