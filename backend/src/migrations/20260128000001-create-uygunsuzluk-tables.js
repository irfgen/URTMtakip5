'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // uygunsuzluk_raporlari tablosunu oluştur
    await queryInterface.createTable('uygunsuzluk_raporlari', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rapor_no: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      baslik: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      kategori: {
        type: Sequelize.ENUM('is_guvenligi', 'kalite', 'cevre', 'surec', 'diger'),
        allowNull: false,
        defaultValue: 'diger'
      },
      oncelik: {
        type: Sequelize.ENUM('dusuk', 'orta', 'yuksek', 'acil'),
        allowNull: false,
        defaultValue: 'orta'
      },
      lokasyon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tezgah_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'tezgahlar',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      durum: {
        type: Sequelize.ENUM('acik', 'atandi', 'inceleniyor', 'cozum_bekliyor', 'kapatildi', 'iptal'),
        allowNull: false,
        defaultValue: 'acik'
      },
      raporlayan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'personel',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      sorumlu_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'personel',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      atama_tarihi: {
        type: Sequelize.DATE,
        allowNull: true
      },
      hedef_tarih: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tespit_tarihi: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      kapanma_tarihi: {
        type: Sequelize.DATE,
        allowNull: true
      },
      maliyet: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      etkinlik_puani: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      resim_yollar: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      },
      aktif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // uygunsuzluk_notlari tablosunu oluştur
    await queryInterface.createTable('uygunsuzluk_notlari', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rapor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'uygunsuzluk_raporlari',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      yazan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'personel',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      not: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // uygunsuzluk_tedbirleri tablosunu oluştur
    await queryInterface.createTable('uygunsuzluk_tedbirleri', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rapor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'uygunsuzluk_raporlari',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tedbir_turu: {
        type: Sequelize.ENUM('duzeltici', 'onleyici', 'her_ikisi'),
        allowNull: false,
        defaultValue: 'duzeltici'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      durum: {
        type: Sequelize.ENUM('planlandı', 'devam_ediyor', 'tamamlandi'),
        allowNull: false,
        defaultValue: 'planlandı'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // uygunsuzluk_dosyalari tablosunu oluştur
    await queryInterface.createTable('uygunsuzluk_dosyalari', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rapor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'uygunsuzluk_raporlari',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dosya_adi: {
        type: Sequelize.STRING,
        allowNull: false
      },
      dosya_yolu: {
        type: Sequelize.STRING,
        allowNull: false
      },
      dosya_tipi: {
        type: Sequelize.ENUM('resim', 'pdf', 'doc', 'diger'),
        allowNull: false,
        defaultValue: 'diger'
      },
      yukleyen_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'personel',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // İndeksler oluştur - uygunsuzluk_raporlari
    await queryInterface.addIndex('uygunsuzluk_raporlari', ['durum']);
    await queryInterface.addIndex('uygunsuzluk_raporlari', ['kategori']);
    await queryInterface.addIndex('uygunsuzluk_raporlari', ['oncelik']);
    await queryInterface.addIndex('uygunsuzluk_raporlari', ['raporlayan_id']);
    await queryInterface.addIndex('uygunsuzluk_raporlari', ['sorumlu_id']);
    await queryInterface.addIndex('uygunsuzluk_raporlari', ['tespit_tarihi']);
    await queryInterface.addIndex('uygunsuzluk_raporlari', ['aktif']);

    // İndeksler oluştur - uygunsuzluk_notlari
    await queryInterface.addIndex('uygunsuzluk_notlari', ['rapor_id']);
    await queryInterface.addIndex('uygunsuzluk_notlari', ['yazan_id']);
    await queryInterface.addIndex('uygunsuzluk_notlari', ['created_at']);

    // İndeksler oluştur - uygunsuzluk_tedbirleri
    await queryInterface.addIndex('uygunsuzluk_tedbirleri', ['rapor_id']);
    await queryInterface.addIndex('uygunsuzluk_tedbirleri', ['tedbir_turu']);
    await queryInterface.addIndex('uygunsuzluk_tedbirleri', ['durum']);

    // İndeksler oluştur - uygunsuzluk_dosyalari
    await queryInterface.addIndex('uygunsuzluk_dosyalari', ['rapor_id']);
    await queryInterface.addIndex('uygunsuzluk_dosyalari', ['dosya_tipi']);
    await queryInterface.addIndex('uygunsuzluk_dosyalari', ['yukleyen_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Tabloları sil (ter逆 sırayla)
    await queryInterface.dropTable('uygunsuzluk_dosyalari');
    await queryInterface.dropTable('uygunsuzluk_tedbirleri');
    await queryInterface.dropTable('uygunsuzluk_notlari');
    await queryInterface.dropTable('uygunsuzluk_raporlari');
  }
};
