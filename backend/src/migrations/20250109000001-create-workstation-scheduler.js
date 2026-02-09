'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Tezgah Zaman Planı tablosu oluştur
    await queryInterface.createTable('tezgah_zaman_plani', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tezgah_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tezgahlar',
          key: 'tezgah_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_emri_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'is_emirleri',
          key: 'is_emri_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      baslangic_zamani: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'İş emrinin planlanan başlangıç zamanı'
      },
      bitis_zamani: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'İş emrinin planlanan bitiş zamanı'
      },
      planlanan_sure_dakika: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 480,
        comment: 'Planlanan süre dakika cinsinden (480dk = 8 saat)'
      },
      gerceklesen_sure_dakika: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Gerçekleşen süre dakika cinsinden'
      },
      durum: {
        type: Sequelize.ENUM('planli', 'devam_ediyor', 'tamamlandi', 'ertelendi', 'iptal'),
        defaultValue: 'planli',
        comment: 'Planlanan işin mevcut durumu'
      },
      oncelik: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Öncelik seviyesi (1=düşük, 2=normal, 3=yüksek, 4=acil)'
      },
      notlar: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Planlama ile ilgili notlar'
      },
      olusturma_tarihi: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      guncelleme_tarihi: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // 2. İş Emirleri tablosuna yeni alanlar ekle
    await queryInterface.addColumn('is_emirleri', 'tahmini_sure_dakika', {
      type: Sequelize.INTEGER,
      defaultValue: 480,
      comment: 'Tahmini iş süresi dakika cinsinden'
    });

    await queryInterface.addColumn('is_emirleri', 'plan_durumu', {
      type: Sequelize.ENUM('planlanmadi', 'planlandi', 'devam_ediyor', 'tamamlandi'),
      defaultValue: 'planlanmadi',
      comment: 'İş emrinin planlama durumu'
    });

    await queryInterface.addColumn('is_emirleri', 'plan_baslangic', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Planlanan başlangıç zamanı'
    });

    await queryInterface.addColumn('is_emirleri', 'plan_bitis', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Planlanan bitiş zamanı'
    });

    // 3. Index'leri oluştur - Performans için kritik
    await queryInterface.addIndex('tezgah_zaman_plani', ['tezgah_id'], {
      name: 'idx_tezgah_zaman_plani_tezgah'
    });

    await queryInterface.addIndex('tezgah_zaman_plani', ['baslangic_zamani', 'bitis_zamani'], {
      name: 'idx_tezgah_zaman_plani_tarih'
    });

    await queryInterface.addIndex('tezgah_zaman_plani', ['durum'], {
      name: 'idx_tezgah_zaman_plani_durum'
    });

    await queryInterface.addIndex('tezgah_zaman_plani', ['is_emri_id'], {
      name: 'idx_tezgah_zaman_plani_is_emri'
    });

    // 4. Çakışma kontrolü için composite index
    await queryInterface.addIndex('tezgah_zaman_plani', ['tezgah_id', 'baslangic_zamani', 'bitis_zamani'], {
      name: 'idx_tezgah_zaman_plani_cakisma_kontrol'
    });

    // 5. İş Emirleri tablosuna da index ekle
    await queryInterface.addIndex('is_emirleri', ['plan_durumu'], {
      name: 'idx_is_emirleri_plan_durumu'
    });

    await queryInterface.addIndex('is_emirleri', ['plan_baslangic', 'plan_bitis'], {
      name: 'idx_is_emirleri_plan_tarih'
    });

    console.log('✅ Workstation Scheduler migration completed successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Index'leri sil
    await queryInterface.removeIndex('tezgah_zaman_plani', 'idx_tezgah_zaman_plani_cakisma_kontrol');
    await queryInterface.removeIndex('tezgah_zaman_plani', 'idx_tezgah_zaman_plani_is_emri');
    await queryInterface.removeIndex('tezgah_zaman_plani', 'idx_tezgah_zaman_plani_durum');
    await queryInterface.removeIndex('tezgah_zaman_plani', 'idx_tezgah_zaman_plani_tarih');
    await queryInterface.removeIndex('tezgah_zaman_plani', 'idx_tezgah_zaman_plani_tezgah');
    
    await queryInterface.removeIndex('is_emirleri', 'idx_is_emirleri_plan_tarih');
    await queryInterface.removeIndex('is_emirleri', 'idx_is_emirleri_plan_durumu');

    // İş emirleri tablosundaki yeni alanları kaldır
    await queryInterface.removeColumn('is_emirleri', 'plan_bitis');
    await queryInterface.removeColumn('is_emirleri', 'plan_baslangic');
    await queryInterface.removeColumn('is_emirleri', 'plan_durumu');
    await queryInterface.removeColumn('is_emirleri', 'tahmini_sure_dakika');

    // Ana tabloyu sil
    await queryInterface.dropTable('tezgah_zaman_plani');

    console.log('⚡ Workstation Scheduler migration rolled back');
  }
};