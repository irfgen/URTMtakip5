'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Mevcut yapıyı kontrol et
      console.log('Checking current table structure...');

      // parca_adi kolonunu mal_hizmet_adi olarak yeniden adlandır
      console.log('Renaming column: parca_adi -> mal_hizmet_adi');
      await queryInterface.renameColumn('irsaliye_kalemler', 'parca_adi', 'mal_hizmet_adi', {
        type: Sequelize.STRING(500),
        allowNull: true,
      }, { transaction });

      // stok_kodu validation'ını güncelle - allowNull true yap
      console.log('Updating stok_kodu to be nullable');
      await queryInterface.changeColumn('irsaliye_kalemler', 'stok_kodu', {
        type: Sequelize.STRING(100),
        allowNull: true,
      }, { transaction });

      await transaction.commit();
      console.log('Migration completed successfully!');
      console.log('Summary:');
      console.log('  - parca_adi → mal_hizmet_adi (renamed)');
      console.log('  - stok_kodu is now optional (nullable)');

    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Rolling back migration...');

      // Geri alma: mal_hizmet_adi → parca_adi
      await queryInterface.renameColumn('irsaliye_kalemler', 'mal_hizmet_adi', 'parca_adi', {
        type: Sequelize.STRING(200),
        allowNull: true,
      }, { transaction });

      // stok_kodu validation'ını geri yükle
      await queryInterface.changeColumn('irsaliye_kalemler', 'stok_kodu', {
        type: Sequelize.STRING(100),
        allowNull: false,
      }, { transaction });

      await transaction.commit();
      console.log('Rollback completed successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
