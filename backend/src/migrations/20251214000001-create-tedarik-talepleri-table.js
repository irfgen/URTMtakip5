'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // tedarik_talepleri tablosunu oluştur
    await queryInterface.createTable('tedarik_talepleri', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      talep_kodu: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
        comment: 'Otomatik üretilen talep kodu'
      },
      kaynak_tipi: {
        type: Sequelize.ENUM('is_emri', 'parca', 'stok_karti', 'manuel'),
        allowNull: false,
        defaultValue: 'manuel',
        comment: 'Talep kaynağı'
      },
      kaynak_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Kaynak ID (is_emri, parca, stok_karti)'
      },
      is_emri_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'İş emri ID (eğer iş emrinden oluşturulduysa)'
      },
      parca_kodu: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Parça kodu'
      },
      stok_karti_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Stok kartı ID'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Talep açıklaması'
      },
      talep_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Talep oluşturma tarihi'
      },
      onay_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Onay tarihi'
      },
      tedarik_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Tedarik tarihi'
      },
      durum: {
        type: Sequelize.ENUM('beklemede', 'onaylandi', 'reddedildi', 'sipariste', 'teslim_edildi'),
        allowNull: false,
        defaultValue: 'beklemede',
        comment: 'Talep durumu'
      },
      talep_eden_kullanici: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Talep oluşturan kullanıcı'
      },
      onaylayan_kullanici: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Talebi onaylayan kullanıcı'
      },
      miktar: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Talep miktarı (detay tablosu kullanıldığında)'
      },
      birim: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Birim (kg, adet, metrekare vb)'
      },
      birim_fiyat: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Birim fiyat'
      },
      toplam_tutar: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Toplam talep tutarı'
      },
      siparis_dokumani: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Sipariş dokümanı dosya yolu'
      },
      irsaliye_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'İrsaliye numarası'
      },
      irsaliye_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'İrsaliye tarihi'
      },
      teslim_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Teslimat tarihi'
      },
      notlar: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ek notlar'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // tedarik_detaylari tablosunu oluştur
    await queryInterface.createTable('tedarik_detaylari', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      talep_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Tedarik talebi ID',
        references: {
          model: 'tedarik_talepleri',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      malzeme_adi: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Malzeme adı'
      },
      malzeme_kodu: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Malzeme kodu'
      },
      miktar: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Miktar'
      },
      birim: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'adet',
        comment: 'Birim (kg, adet, metrekare vb)'
      },
      birim_fiyat: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Birim fiyat'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Satır açıklaması'
      },
      stok_karti_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'İlişkili stok kartı ID',
        references: {
          model: 'stok_kartlari',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      teknik_ozellikler: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Teknik özellikler ve spesifikasyonlar'
      },
      termin_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Termin tarihi'
      },
      karsilanan_miktar: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Karşılanan teslimat miktarı'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // İndeksler oluştur - tedarik_talepleri
    await queryInterface.addIndex('tedarik_talepleri', ['talep_kodu'], { unique: true });
    await queryInterface.addIndex('tedarik_talepleri', ['durum']);
    await queryInterface.addIndex('tedarik_talepleri', ['kaynak_tipi', 'kaynak_id']);
    await queryInterface.addIndex('tedarik_talepleri', ['talep_tarihi']);
    await queryInterface.addIndex('tedarik_talepleri', ['parca_kodu']);
    await queryInterface.addIndex('tedarik_talepleri', ['stok_karti_id']);
    await queryInterface.addIndex('tedarik_talepleri', ['is_emri_id']);
    await queryInterface.addIndex('tedarik_talepleri', ['onay_tarihi']);
    await queryInterface.addIndex('tedarik_talepleri', ['teslim_tarihi']);

    // İndeksler oluştur - tedarik_detaylari
    await queryInterface.addIndex('tedarik_detaylari', ['talep_id']);
    await queryInterface.addIndex('tedarik_detaylari', ['malzeme_kodu']);
    await queryInterface.addIndex('tedarik_detaylari', ['stok_karti_id']);
    await queryInterface.addIndex('tedarik_detaylari', ['termin_tarihi']);
  },

  down: async (queryInterface, Sequelize) => {
    // Tabloları sil
    await queryInterface.dropTable('tedarik_detaylari');
    await queryInterface.dropTable('tedarik_talepleri');
  }
};