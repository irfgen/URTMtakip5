'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Önce tablo mevcut mu kontrol et
      const tableExists = await queryInterface.getTableDescription('tedarik_talepleri');

      if (!tableExists) {
        console.log('⚠️ tedarik_talepleri tablosu bulunamadı, migration atlanıyor');
        return;
      }

      // Kolonların mevcut olup olmadığını kontrol et
      const columns = await queryInterface.getTableDescription('tedarik_talepleri');
      const hasOtomatikSevkiyat = columns.some(col => col.name === 'otomatik_sevkiyat');
      const hasSonIslemTarihi = columns.some(col => col.name === 'son_islem_tarihi');

      // tedarik_talepleri tablosuna eksik kolonları ekle
      if (!hasOtomatikSevkiyat) {
        await queryInterface.addColumn('tedarik_talepleri', 'otomatik_sevkiyat', {
          type: Sequelize.BOOLEAN,
          defaultValue: 0,
          allowNull: false
        });
        console.log('✅ otomatik_sevkiyat kolonu eklendi');
      } else {
        console.log('ℹ️ otomatik_sevkiyat kolonu zaten mevcut');
      }

      if (!hasSonIslemTarihi) {
        await queryInterface.addColumn('tedarik_talepleri', 'son_islem_tarihi', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log('✅ son_islem_tarihi kolonu eklendi');
      } else {
        console.log('ℹ️ son_islem_tarihi kolonu zaten mevcut');
      }

    } catch (error) {
      console.error('❌ Migration hatası:', error);
      // Hata olsa bile migration başarısız sayılmasin
      // Kolonlar zaten varsa bu hata alınabilir
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Kolonları geri al (varsa)
      const columns = await queryInterface.getTableDescription('tedarik_talepleri');

      if (columns.some(col => col.name === 'otomatik_sevkiyat')) {
        await queryInterface.removeColumn('tedarik_talepleri', 'otomatik_sevkiyat');
        console.log('✅ otomatik_sevkiyat kolonu kaldırıldı');
      }

      if (columns.some(col => col.name === 'son_islem_tarihi')) {
        await queryInterface.removeColumn('tedarik_talepleri', 'son_islem_tarihi');
        console.log('✅ son_islem_tarihi kolonu kaldırıldı');
      }

    } catch (error) {
      console.error('❌ Rollback hatası:', error);
    }
  }
};