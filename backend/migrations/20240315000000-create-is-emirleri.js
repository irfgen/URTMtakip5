'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('is_emirleri', {
      is_emri_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      is_emri_no: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      is_adi: {
        type: Sequelize.STRING,
        allowNull: false
      },
      musteri_adi: {
        type: Sequelize.STRING,
        allowNull: false
      },
      planlanan_adet: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Üretilmesi planlanan toplam adet'
      },
      gerceklesen_adet: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Gerçekte üretilen adet'
      },
      iskarta_adet: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Üretim sırasında ıskarta olan adet'
      },
      ham_malzeme: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Kullanılacak ham malzeme bilgisi'
      },
      planlanan_baslama_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'İşin başlaması planlanan tarih'
      },
      gerceklesen_baslama_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'İşin gerçekte başladığı tarih'
      },
      teslim_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'İşin teslim edilmesi gereken tarih'
      },
      bitis_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'İşin bittiği tarih'
      },
      oncelik: {
        type: Sequelize.ENUM('dusuk', 'normal', 'yuksek', 'acil'),
        defaultValue: 'normal'
      },
      durum: {
        type: Sequelize.ENUM('FREZE', 'TORNA', 'ISLEMDE', 'TAMAMLANAN'),
        defaultValue: 'FREZE'
      },
      islem_adimlari: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: 'Yapılacak işlemlerin sırası ve detayları'
      },
      aciklama: {
        type: Sequelize.TEXT
      },
      hareketler: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: 'İş emrinin tüm hareket geçmişi'
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
    await queryInterface.addIndex('is_emirleri', ['is_emri_no']);
    await queryInterface.addIndex('is_emirleri', ['durum']);
    await queryInterface.addIndex('is_emirleri', ['teslim_tarihi']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('is_emirleri');
  }
};