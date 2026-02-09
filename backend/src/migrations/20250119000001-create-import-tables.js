'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // import_index tablosunu oluştur
    await queryInterface.createTable('import_index', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      full_path: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
        comment: 'Dosyanın tam yolu (benzersiz anahtar)'
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Dosya adı (uzantısız)'
      },
      extension: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Dosya uzantısı (.sldprt, .sldpart, .sldasm)'
      },
      status: {
        type: Sequelize.ENUM('pending', 'exists', 'ready_to_import', 'importing', 'imported', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'İşlem durumu'
      },
      hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'Dosya hash\'i (değişiklik tespiti için)'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Hata durumunda hata mesajı'
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

    // import_job tablosunu oluştur
    await queryInterface.createTable('import_job', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      job_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'İş adı (opsiyonel)'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'İş başlangıç zamanı'
      },
      finished_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'İş bitiş zamanı'
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Toplam işlenecek dosya sayısı'
      },
      success_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Başarılı import sayısı'
      },
      fail_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Başarısız import sayısı'
      },
      state: {
        type: Sequelize.ENUM('running', 'completed', 'canceled', 'failed'),
        allowNull: false,
        defaultValue: 'running',
        comment: 'İş durumu'
      },
      config: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'İş konfigürasyon ayarları'
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

    // import_client tablosunu oluştur
    await queryInterface.createTable('import_client', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      client_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Client benzersiz kimliği'
      },
      client_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Client adı'
      },
      client_info: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Client sistem bilgileri'
      },
      status: {
        type: Sequelize.ENUM('connected', 'disconnected', 'working'),
        allowNull: false,
        defaultValue: 'disconnected',
        comment: 'Client durumu'
      },
      last_seen: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Son görülme zamanı'
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

    // import_index tablosuna client_id foreign key ekle
    await queryInterface.addColumn('import_index', 'client_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'İndeksleme yapan client id'
    });

    // import_job tablosuna client_id foreign key ekle
    await queryInterface.addColumn('import_job', 'client_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'İşi yapan client id'
    });

    // Index'ler ekle
    await queryInterface.addIndex('import_index', ['status'], {
      name: 'idx_import_index_status'
    });
    
    await queryInterface.addIndex('import_index', ['extension'], {
      name: 'idx_import_index_extension'
    });
    
    await queryInterface.addIndex('import_index', ['file_name'], {
      name: 'idx_import_index_file_name'
    });

    await queryInterface.addIndex('import_index', ['client_id'], {
      name: 'idx_import_index_client_id'
    });

    await queryInterface.addIndex('import_job', ['state'], {
      name: 'idx_import_job_state'
    });
    
    await queryInterface.addIndex('import_job', ['started_at'], {
      name: 'idx_import_job_started_at'
    });

    await queryInterface.addIndex('import_job', ['client_id'], {
      name: 'idx_import_job_client_id'
    });

    await queryInterface.addIndex('import_client', ['status'], {
      name: 'idx_import_client_status'
    });

    await queryInterface.addIndex('import_client', ['last_seen'], {
      name: 'idx_import_client_last_seen'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Index'leri sil
    await queryInterface.removeIndex('import_index', 'idx_import_index_status');
    await queryInterface.removeIndex('import_index', 'idx_import_index_extension');
    await queryInterface.removeIndex('import_index', 'idx_import_index_file_name');
    await queryInterface.removeIndex('import_index', 'idx_import_index_client_id');
    await queryInterface.removeIndex('import_job', 'idx_import_job_state');
    await queryInterface.removeIndex('import_job', 'idx_import_job_started_at');
    await queryInterface.removeIndex('import_job', 'idx_import_job_client_id');
    await queryInterface.removeIndex('import_client', 'idx_import_client_status');
    await queryInterface.removeIndex('import_client', 'idx_import_client_last_seen');
    
    // Kolonları sil
    await queryInterface.removeColumn('import_index', 'client_id');
    await queryInterface.removeColumn('import_job', 'client_id');
    
    // Tabloları sil
    await queryInterface.dropTable('import_client');
    await queryInterface.dropTable('import_job');
    await queryInterface.dropTable('import_index');
  }
};