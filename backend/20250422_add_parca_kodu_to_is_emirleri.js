'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Eğer parca_kodu zaten varsa hatayı yut ve devam et
    try {
      await queryInterface.addColumn('is_emirleri', 'parca_kodu', {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'parcalar',
          key: 'parca_kodu'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('is_emirleri tablosuna parca_kodu sütunu başarıyla eklendi.');
      return Promise.resolve();
    } catch (error) {
      if (error && error.message && error.message.includes('duplicate column name')) {
        console.warn('parca_kodu sütunu zaten mevcut, migration atlanıyor.');
        return Promise.resolve();
      }
      console.error('Migrasyon hatası:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Geri alma durumunda sütunu kaldır
      await queryInterface.removeColumn('is_emirleri', 'parca_kodu');
      console.log('is_emirleri tablosundan parca_kodu sütunu kaldırıldı.');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Migrasyon geri alma hatası:', error);
      return Promise.reject(error);
    }
  }
};
