const { Sequelize, Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Test mode detection
const isTest = process.env.NODE_ENV === 'test';

// PostgreSQL or SQLite dialect selection
// DB_DIALECT=postgresql → use PostgreSQL
// DB_DIALECT=sqlite (default or absent) → use SQLite
const DB_DIALECT = process.env.DB_DIALECT || 'sqlite';

// Veritabanı dosyası için tam yol oluştur (in-memory for tests)
const dbPath = isTest
  ? ':memory:'
  : path.join(__dirname, '../../database.sqlite');

console.log('Veritabanı dosya yolu:', dbPath, isTest ? '(in-memory)' : '');
console.log('Dialect:', DB_DIALECT);

// Connection config generator - supports both PostgreSQL and SQLite
const getSequelizeConfig = () => {
  if (DB_DIALECT === 'postgresql') {
    // PostgreSQL configuration
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      // URL format: postgresql://user:pass@host:port/dbname
      return {
        dialect: 'postgres',
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        },
        pool: {
          max: 20,
          min: 5,
          acquire: 30000,
          idle: 10000
        }
      };
    }
    // Individual parameters fallback
    return {
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'urtmtakip',
      username: process.env.DB_USER || 'urfuser',
      password: process.env.DB_PASS || 'urfpass',
      logging: false,
      timezone: '+00:00',
      define: {
        timestamps: true,
        underscored: true
      },
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000
      }
    };
  }

  // SQLite configuration (default fallback)
  return {
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    timezone: '+00:00',
    define: {
      timestamps: true,
      underscored: true
    },
    dialectOptions: {
      foreignKeys: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
      evict: 1000
    },
    retry: {
      max: 5
    },
    hooks: {
      afterConnect: async (connection, config) => {
        await connection.query('PRAGMA busy_timeout = 30000;');
        await connection.query('PRAGMA foreign_keys = OFF;');
        await connection.query('PRAGMA journal_mode = WAL;');
        await connection.query('PRAGMA synchronous = NORMAL;');
        await connection.query('PRAGMA cache_size = 10000;');
        await connection.query('PRAGMA temp_store = MEMORY;');
      }
    }
  };
};

const sequelize = new Sequelize(getSequelizeConfig());

const initializeDatabase = async () => {
  // Skip initialization in test mode
  if (process.env.NODE_ENV === 'test') {
    console.log('Test modu - veritabanı başlatma atlandı');
    return;
  }

  try {
    // Veritabanı dosyasının varlığını kontrol et (SQLite only)
    if (DB_DIALECT !== 'postgresql') {
      const dbExists = fs.existsSync(dbPath);
      console.log('Veritabanı dosyası mevcut:', dbExists);
    }

    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.', DB_DIALECT === 'postgresql' ? '(PostgreSQL)' : '(SQLite)');

    if (DB_DIALECT === 'postgresql') {
      // PostgreSQL: sync all models
      const AUTO_ALTER = process.env.DB_AUTO_ALTER === 'true';
      const models = sequelize.models;
      for (const modelName in models) {
        try {
          await models[modelName].sync({ alter: AUTO_ALTER });
          console.log(`${modelName} tablosu senkronize edildi`);
        } catch (err) {
          console.error(`${modelName} senkronizasyon hatası:`, err.message);
        }
      }
    } else {
      // SQLite: existing PRAGMA setup
      await sequelize.query('PRAGMA foreign_keys = OFF;');
      console.log('SQLite foreign key kısıtlamaları devre dışı bırakıldı.');

      // SQLite performans optimizasyonları
      await sequelize.query('PRAGMA journal_mode = WAL;');
      await sequelize.query('PRAGMA busy_timeout = 30000;');
      await sequelize.query('PRAGMA synchronous = NORMAL;');
      await sequelize.query('PRAGMA wal_autocheckpoint = 1000;');
      await sequelize.query('PRAGMA cache_size = 10000;');
      await sequelize.query('PRAGMA temp_store = MEMORY;');
      await sequelize.query('PRAGMA mmap_size = 268435456;'); // 256MB
      console.log('SQLite performans ayarları yapıldı.');

      // İlk başta tam checkpoint yap
      await sequelize.query('PRAGMA wal_checkpoint(TRUNCATE);');
      console.log('WAL checkpoint tamamlandı.');
    }

    // Sync all models for PostgreSQL
    if (DB_DIALECT === 'postgresql') {
      console.log('Veritabanı tabloları güncellendi.');
    }

    // Periyodik WAL checkpoint için interval başlat (SQLite only)
    if (DB_DIALECT !== 'postgresql') {
      setInterval(async () => {
        try {
          await sequelize.query('PRAGMA wal_checkpoint(PASSIVE);');
          console.log('Periyodik WAL checkpoint tamamlandı.');
        } catch (error) {
          console.warn('WAL checkpoint hatası:', error.message);
        }
      }, 5 * 60 * 1000); // Her 5 dakikada bir
    }

  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
    throw error;
  }
};

async function runMigrations() {
  const migrationsPath = path.join(__dirname, '../migrations');
  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.js'))
    .sort();

  for (const file of migrationFiles) {
    const migration = require(path.join(migrationsPath, file));
    try {
      await migration.up(sequelize.getQueryInterface(), Sequelize);
      console.log(`Migration başarılı: ${file}`);
    } catch (error) {
      console.error(`Migration hatası (${file}):`, error);
      throw error;
    }
  }
}

// Migration komutunu kontrol et
if (process.argv[2] === 'migrate') {
  runMigrations()
    .then(() => {
      console.log('Tüm migrationlar başarıyla tamamlandı');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration hatası:', error);
      process.exit(1);
    });
}

async function dropLingeringBackupTables() {
  try {
    const [rows] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup'");
    if (Array.isArray(rows) && rows.length) {
      for (const r of rows) {
        const tableName = r.name || r.NAME;
        if (tableName) {
          try {
            await sequelize.query(`DROP TABLE IF EXISTS "${tableName}"`);
            console.log(`Temizlendi: ${tableName}`);
          } catch (e) {
            console.warn(`Backup tablosu düşürülemedi (${tableName}): ${e.message}`);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Backup tablo tarama hatası:', e.message);
  }
}

module.exports = {
  sequelize,
  Op,
  Transaction: Sequelize.Transaction,
  QueryTypes: Sequelize.QueryTypes,
  initializeDatabase,
  DB_DIALECT
};
