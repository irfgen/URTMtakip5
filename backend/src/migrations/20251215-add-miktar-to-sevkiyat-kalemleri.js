'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. sevkiyat_kalemleri tablosuna miktar kolonunu ekle
        await queryInterface.addColumn('sevkiyat_kalemleri', 'miktar', {
            type: Sequelize.DECIMAL(10, 3),
            allowNull: true,
            defaultValue: null,
            comment: 'Sevkiyat kaleminin miktarı'
        });

        // 2. Mevcut kayıtlar için varsayılan miktar atama (opsiyonel)
        // Eğer mevcut kayıtların miktarı yoksa, 1.0 olarak ayarla
        await queryInterface.sequelize.query(`
            UPDATE sevkiyat_kalemleri
            SET miktar = 1.0
            WHERE miktar IS NULL
        `);
    },

    down: async (queryInterface, Sequelize) => {
        // Geri alma: miktar kolonunu kaldır
        await queryInterface.removeColumn('sevkiyat_kalemleri', 'miktar');
    }
};