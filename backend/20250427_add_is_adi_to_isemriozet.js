'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // is_adi sütununu ekle
      await queryInterface.addColumn('is_emri_ozetleri', 'is_adi', {
        type: DataTypes.STRING,
        allowNull: true
      });

      console.log('is_emri_ozetleri tablosuna is_adi sütunu eklendi.');
      return Promise.resolve();
    } catch (error) {
      console.error('Migration hatası:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // is_adi sütununu kaldır
      await queryInterface.removeColumn('is_emri_ozetleri', 'is_adi');
      
      console.log('is_emri_ozetleri tablosundan is_adi sütunu kaldırıldı.');
      return Promise.resolve();
    } catch (error) {
      console.error('Migration geri alma hatası:', error);
      return Promise.reject(error);
    }
  }
};
