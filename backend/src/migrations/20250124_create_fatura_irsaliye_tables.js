'use strict';

/**
 * Fatura & İrsaliye Eşleştirme Sistemi
 * Migration: 4 tablo oluşturma
 *
 * Expert Panel Requirements:
 * - Composite indexes for performance optimization
 * - Foreign key constraints for data integrity
 * - Lock mechanism fields (locked_by, locked_at)
 * - Cross-reference fields for matching audit trail
 *
 * Tables:
 * 1. irsaliyeler - Ana irsaliye tablosu
 * 2. irsaliye_kalemleri - İrsaliye kalemleri
 * 3. faturalar - Ana fatura tablosu
 * 4. fatura_kalemleri - Fatura kalemleri
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ============================================================
    // 1. irsaliyeler tablosu
    // ============================================================
    await queryInterface.createTable('irsaliyeler', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      irsaliye_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Benzersiz irsaliye numarası'
      },
      tedarikci_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'firmalar',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
        comment: 'Dışarıdan tedarikçi ID'
      },
      belge_tarih: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Belge tarihi'
      },
      kayit_tarih: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      belge_tipi: {
        type: Sequelize.ENUM('gelis', 'cikis'),
        allowNull: false,
        defaultValue: 'gelis',
        comment: 'Belge tipi: gelis veya cikis'
      },
      toplam_kalem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Toplam kalem sayısı'
      },
      toplam_miktar: {
        type: Sequelize.REAL,
        allowNull: false,
        defaultValue: 0,
        comment: 'Toplam miktar'
      },
      durum: {
        type: Sequelize.ENUM('bekliyor', 'kismi_eslesti', 'tam_eslesti'),
        allowNull: false,
        defaultValue: 'bekliyor',
        comment: 'Eşleşme durumu'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'personeller',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
        comment: 'Oluşturan kullanıcı'
      },
      locked_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'personeller',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
        comment: 'Lock sahibi kullanıcı ID'
      },
      locked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Lock zamanı'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // İrsaliyeler indeksler
    await queryInterface.addIndex('irsaliyeler', ['tedarikci_id'], {
      name: 'idx_irs_tedarikci'
    });
    await queryInterface.addIndex('irsaliyeler', ['durum'], {
      name: 'idx_irs_durum'
    });
    await queryInterface.addIndex('irsaliyeler', ['belge_tarih'], {
      name: 'idx_irs_tarih'
    });
    await queryInterface.addIndex('irsaliyeler', ['locked_by', 'locked_at'], {
      name: 'idx_irs_lock'
    });
    await queryInterface.addIndex('irsaliyeler', ['irsaliye_no'], {
      unique: true,
      name: 'idx_irs_no_unique'
    });

    // ============================================================
    // 2. irsaliye_kalemleri tablosu
    // ============================================================
    await queryInterface.createTable('irsaliye_kalemleri', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      irsaliye_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'irsaliyeler',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Ana irsaliye ID'
      },
      tedarikci_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'firmalar',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
        comment: 'Denormalizasyon - hızlı eşleştirme için'
      },
      stok_kodu: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Serbest kod girişi (validasyon yok)'
      },
      parca_adi: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      miktar: {
        type: Sequelize.REAL,
        allowNull: false,
        comment: 'Kalem miktarı'
      },
      birim: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Adet',
        comment: 'Birim: Adet, KG, Lt, Mt vb.'
      },
      eslesme_durumu: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Bekliyor, 1: Eşleşti'
      },
      eslesen_fatura_kalem_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fatura_kalemleri',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
        comment: 'Eşleşen fatura kalemi ID (cross-reference)'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // İrsaliye kalemleri indeksler
    await queryInterface.addIndex('irsaliye_kalemleri', ['irsaliye_id'], {
      name: 'idx_irk_irsaliye'
    });
    await queryInterface.addIndex('irsaliye_kalemleri', ['tedarikci_id'], {
      name: 'idx_irk_tedarikci'
    });
    await queryInterface.addIndex('irsaliye_kalemleri', ['stok_kodu'], {
      name: 'idx_irk_stok'
    });
    await queryInterface.addIndex('irsaliye_kalemleri', ['eslesme_durumu'], {
      name: 'idx_irk_eslesme'
    });
    await queryInterface.addIndex('irsaliye_kalemleri', ['eslesen_fatura_kalem_id'], {
      name: 'idx_irk_eslesen_fatura'
    });
    // Expert Panel: Composite index for optimized matching
    await queryInterface.addIndex('irsaliye_kalemleri', ['tedarikci_id', 'eslesme_durumu', 'stok_kodu'], {
      name: 'idx_irk_matching_optimization'
    });

    // ============================================================
    // 3. faturalar tablosu
    // ============================================================
    await queryInterface.createTable('faturalar', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fatura_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Benzersiz fatura numarası'
      },
      tedarikci_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'firmalar',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
        comment: 'Dışarıdan tedarikçi ID'
      },
      belge_tarih: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Belge tarihi'
      },
      vade_tarih: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Vade tarihi'
      },
      kayit_tarih: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      toplam_kalem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Toplam kalem sayısı'
      },
      toplam_miktar: {
        type: Sequelize.REAL,
        allowNull: false,
        defaultValue: 0,
        comment: 'Toplam miktar'
      },
      ara_toplam: {
        type: Sequelize.REAL,
        allowNull: false,
        defaultValue: 0,
        comment: 'Ara toplam (tutar bilgisi - sadece kaydetme)'
      },
      kdv: {
        type: Sequelize.REAL,
        allowNull: false,
        defaultValue: 0,
        comment: 'KDV tutarı'
      },
      genel_toplam: {
        type: Sequelize.REAL,
        allowNull: false,
        defaultValue: 0,
        comment: 'Genel toplam'
      },
      durum: {
        type: Sequelize.ENUM('bekliyor', 'kismi_eslesti', 'tam_eslesti'),
        allowNull: false,
        defaultValue: 'bekliyor',
        comment: 'Eşleşme durumu'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'personeller',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
        comment: 'Oluşturan kullanıcı'
      },
      locked_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'personeller',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
        comment: 'Lock sahibi kullanıcı ID'
      },
      locked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Lock zamanı'
      },
      belge_dosya_yolu: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Yüklenen PDF/Görsel dosya yolu'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Faturalar indeksler
    await queryInterface.addIndex('faturalar', ['tedarikci_id'], {
      name: 'idx_fat_tedarikci'
    });
    await queryInterface.addIndex('faturalar', ['durum'], {
      name: 'idx_fat_durum'
    });
    await queryInterface.addIndex('faturalar', ['belge_tarih'], {
      name: 'idx_fat_tarih'
    });
    await queryInterface.addIndex('faturalar', ['locked_by', 'locked_at'], {
      name: 'idx_fat_lock'
    });
    await queryInterface.addIndex('faturalar', ['fatura_no'], {
      unique: true,
      name: 'idx_fat_no_unique'
    });

    // ============================================================
    // 4. fatura_kalemleri tablosu
    // ============================================================
    await queryInterface.createTable('fatura_kalemleri', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fatura_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'faturalar',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Ana fatura ID'
      },
      tedarikci_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'firmalar',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
        comment: 'Denormalizasyon'
      },
      stok_kodu: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Stok kodu'
      },
      parca_adi: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      miktar: {
        type: Sequelize.REAL,
        allowNull: false,
        comment: 'Kalem miktarı'
      },
      birim: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Adet'
      },
      birim_fiyat: {
        type: Sequelize.REAL,
        allowNull: false,
        defaultValue: 0,
        comment: 'Birim fiyat (sadece kayıt amaçlı)'
      },
      toplam_tutar: {
        type: Sequelize.REAL,
        allowNull: false,
        defaultValue: 0,
        comment: 'miktar * birim_fiyat'
      },
      eslesme_durumu: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Bekliyor, 1: Eşleşti'
      },
      eslesen_irsaliye_kalem_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'irsaliye_kalemleri',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
        comment: 'Eşleşen irsaliye kalemi ID (cross-reference)'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Fatura kalemleri indeksler
    await queryInterface.addIndex('fatura_kalemleri', ['fatura_id'], {
      name: 'idx_fk_fatura'
    });
    await queryInterface.addIndex('fatura_kalemleri', ['tedarikci_id'], {
      name: 'idx_fk_tedarikci'
    });
    await queryInterface.addIndex('fatura_kalemleri', ['stok_kodu'], {
      name: 'idx_fk_stok'
    });
    await queryInterface.addIndex('fatura_kalemleri', ['eslesme_durumu'], {
      name: 'idx_fk_eslesme'
    });
    await queryInterface.addIndex('fatura_kalemleri', ['eslesen_irsaliye_kalem_id'], {
      name: 'idx_fk_eslesen_irsaliye'
    });
    // Expert Panel: Composite index for optimized matching
    await queryInterface.addIndex('fatura_kalemleri', ['tedarikci_id', 'eslesme_durumu', 'stok_kodu'], {
      name: 'idx_fk_matching_optimization'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop order: child tables first, then parent tables
    await queryInterface.dropTable('fatura_kalemleri');
    await queryInterface.dropTable('faturalar');
    await queryInterface.dropTable('irsaliye_kalemleri');
    await queryInterface.dropTable('irsaliyeler');
  }
};
