'use strict';

/**
 * Migration: parca_adi → mal_hizmet_adi RENAME + NOT NULL
 *
 * Amaç: Column ismini düzelt ve zorunlu yap (fatura-irsaliye eşleştirme için)
 *
 * Sorun: Migration'da 'parca_adi' ama model'de 'mal_hizmet_adi' kullanılıyor
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Mevcut NULL kayıtları varsayılan değerle doldur
    await queryInterface.sequelize.query(`
      UPDATE irsaliye_kalemleri
      SET parca_adi = COALESCE(parca_adi, 'Belirtilmemiş')
      WHERE parca_adi IS NULL
    `);

    // 2. Column rename: parca_adi → mal_hizmet_adi
    await queryInterface.renameColumn('irsaliye_kalemleri', 'parca_adi', 'mal_hizmet_adi');

    // 3. Type ve constraint güncelle: VARCHAR(500) NOT NULL
    await queryInterface.changeColumn('irsaliye_kalemleri', 'mal_hizmet_adi', {
      type: Sequelize.STRING(500),
      allowNull: false,
      comment: 'Mal/Hizmet adı (eşleştirme için kritik alan)'
    });

    console.log('✅ irsaliye_kalemleri: parca_adi → mal_hizmet_adi (NOT NULL) yapıldı');
  },

  down: async (queryInterface, Sequelize) => {
    // Geri alma: mal_hizmet_adi → parca_adi (nullable)
    await queryInterface.changeColumn('irsaliye_kalemleri', 'mal_hizmet_adi', {
      type: Sequelize.STRING(200),
      allowNull: true
    });

    await queryInterface.renameColumn('irsaliye_kalemleri', 'mal_hizmet_adi', 'parca_adi');

    console.log('⏪ irsaliye_kalemleri: mal_hizmet_adi → parca_adi (nullable) geri alındı');
  }
};
