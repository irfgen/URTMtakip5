'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. makina_siparisleri tablosunu oluştur
    await queryInterface.createTable('makina_siparisleri', {
      siparis_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      siparis_no: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Sipariş numarası (örn: SIP-2026-0001)'
      },
      makina_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        comment: 'Makina UUID',
        references: {
          model: 'makinalar',
          key: 'makina_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      musteri_adi: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Müşteri tam adı'
      },
      musteri_telefon: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'İletişim telefonu'
      },
      musteri_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'İletişim e-posta'
      },
      adet: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Sipariş adedi'
      },
      durum: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Beklemede',
        comment: 'Sipariş durumu: Beklemede, Gövde Montaj, Boyada, Son montajda, Üretimde, Tamamlandı, İptal'
      },
      siparis_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Sipariş alma tarihi'
      },
      teslim_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Planlanan teslim tarihi'
      },
      tamamlanma_tarihi: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Gerçekleşen teslim tarihi'
      },
      notlar: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Sipariş notları'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // makina_siparisleri indexleri
    await queryInterface.addIndex('makina_siparisleri', ['makina_id']);
    await queryInterface.addIndex('makina_siparisleri', ['durum']);
    await queryInterface.addIndex('makina_siparisleri', ['siparis_tarihi']);
    await queryInterface.addIndex('makina_siparisleri', ['siparis_no'], {
      unique: true
    });

    // 2. makina_stok tablosunu oluştur
    await queryInterface.createTable('makina_stok', {
      stok_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      makina_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        comment: 'Makina UUID',
        references: {
          model: 'makinalar',
          key: 'makina_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      adet: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Stok adedi'
      },
      depo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Depo ID (opsiyonel): 1=Ana Depo, 2=Alaaddin Bey Depo'
      },
      giris_kaynagi: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Giriş kaynağı: Satın Alma, Üretim, Montaj'
      },
      giris_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Stok giriş tarihi'
      },
      siparis_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        comment: 'İlgili sipariş ID (eğer üretimden geldiyse)',
        references: {
          model: 'makina_siparisleri',
          key: 'siparis_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      seri_nolari: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Seri numaraları JSON formatında'
      },
      notlar: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Stok notları'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // makina_stok indexleri
    await queryInterface.addIndex('makina_stok', ['makina_id']);
    await queryInterface.addIndex('makina_stok', ['depo_id']);
    await queryInterface.addIndex('makina_stok', ['giris_tarihi']);
    await queryInterface.addIndex('makina_stok', ['siparis_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('makina_stok');
    await queryInterface.dropTable('makina_siparisleri');
  }
};
