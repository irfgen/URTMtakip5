'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create makina_siniflari table
    await queryInterface.createTable('makina_siniflari', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      ad: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Makina sınıfının adı (örn: Panel Ebatlama Sınıfı)'
      },
      aciklama: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Makina sınıfı hakkında detaylı açıklama'
      },
      aktif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Sınıfın aktif olup olmadığı'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Kayıt oluşturulma tarihi'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Kayıt güncelleme tarihi'
      }
    });

    // 2. Add indexes for makina_siniflari table
    await queryInterface.addIndex('makina_siniflari', ['ad'], { unique: true });
    await queryInterface.addIndex('makina_siniflari', ['aktif']);
    await queryInterface.addIndex('makina_siniflari', ['created_at']);

    // 3. Add makina_sinifi_id column to makinalar table
    await queryInterface.addColumn('makinalar', 'makina_sinifi_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Makina sınıfı foreign key',
      references: {
        model: 'makina_siniflari',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 4. Add index for makina_sinifi_id in makinalar table
    await queryInterface.addIndex('makinalar', ['makina_sinifi_id']);

    // 5. Create makina_bom junction table
    await queryInterface.createTable('makina_bom', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      makina_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        comment: 'Makina ID foreign key',
        references: {
          model: 'makinalar',
          key: 'makina_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      bom_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'BOM ID foreign key',
        references: {
          model: 'boms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'İlişki oluşturulma tarihi'
      }
    });

    // 6. Add unique constraint for makina_bom table
    await queryInterface.addIndex('makina_bom', ['makina_id', 'bom_id'], { unique: true });
    await queryInterface.addIndex('makina_bom', ['makina_id']);
    await queryInterface.addIndex('makina_bom', ['bom_id']);
    await queryInterface.addIndex('makina_bom', ['created_at']);

    // Not: bom_parcalar tablosu zaten mevcut, yeniden oluşturulmayacak
    // bom_parcalar: bomId, parcaKodu, miktar, birim, pozisyon alanlarını içerir

    // 7. Insert initial makina sınıfları data
    await queryInterface.bulkInsert('makina_siniflari', [
      {
        ad: 'Panel Ebatlama Sınıfı',
        aciklama: 'Panel ebatlama makineleri ve kesim tezgahları',
        aktif: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ad: 'Kenar Bantlama Sınıfı',
        aciklama: 'Kenar bantlama makineleri ve kenar işleme tezgahları',
        aktif: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ad: 'Çizgili Yatar Daire Sınıfı',
        aciklama: 'Çizgili yatar daire makineleri ve delik açma tezgahları',
        aktif: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ad: 'Kapı Üretim Makineleri Sınıfı',
        aciklama: 'Kapı üretimi için özel makineler ve tezgahlar',
        aktif: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        ad: 'CNC Freze Sınıfı',
        aciklama: 'CNC freze makineleri ve otomatik işleme merkezleri',
        aktif: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Drop makina_bom junction table
    await queryInterface.dropTable('makina_bom');

    // 2. Remove makina_sinifi_id column from makinalar table
    await queryInterface.removeColumn('makinalar', 'makina_sinifi_id');

    // 3. Drop makina_siniflari table
    await queryInterface.dropTable('makina_siniflari');

    // Not: bom_parcalar tablosu korunacak, çünkü bu BOM-parça ilişkisi için gerekli
  }
};