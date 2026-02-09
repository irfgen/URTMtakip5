const { Sequelize, Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Test mode detection
const isTest = process.env.NODE_ENV === 'test';

// Veritabanı dosyası için tam yol oluştur (in-memory for tests)
const dbPath = isTest
  ? ':memory:'
  : path.join(__dirname, '../../database.sqlite');

console.log('Veritabanı dosya yolu:', dbPath, isTest ? '(in-memory)' : '');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: isTest ? false : false,
  timezone: '+00:00', // UTC timezone - veritabanındaki saatler UTC formatında
  define: {
    timestamps: true,
    underscored: true
  },
  dialectOptions: {
    // SQLite için foreign key kısıtlamalarını etkinleştir
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
  // Her yeni bağlantıda SQLite ayarlarını uygula
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
});

const initializeDatabase = async () => {
  // Skip initialization in test mode
  if (process.env.NODE_ENV === 'test') {
    console.log('Test modu - veritabanı başlatma atlandı');
    return;
  }

  try {
    // Veritabanı dosyasının varlığını kontrol et
    const dbExists = fs.existsSync(dbPath);
    console.log('Veritabanı dosyası mevcut:', dbExists);

    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // Foreign key kısıtlamalarını devre dışı bırak (model adı/tablo adı uyuşmazlığı için)
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
    
    // ALTER davranışını ortam değişkeni ile kontrol et (varsayılan: kapalı)
    const AUTO_ALTER = process.env.DB_AUTO_ALTER === 'true';

    // Sync öncesi kalıcı *_backup tablolarını temizle
    await dropLingeringBackupTables();

    // Force sync yerine her modeli ayrı ayrı senkronize et
    const models = sequelize.models;
    for (const modelName in models) {
      try {
        await models[modelName].sync({ alter: AUTO_ALTER });
        console.log(`${modelName} tablosu başarıyla senkronize edildi`);
      } catch (err) {
        console.error(`${modelName} tablosu senkronizasyonunda hata:`, err.message);
        if (modelName === 'ParcaIslemeKayitlari') {
          console.error('ParcaIslemeKayitlari detaylı hata:', err);
        }
      }
    }
    
    console.log('Veritabanı tabloları güncellendi.');
    
    // Periyodik WAL checkpoint için interval başlat
    setInterval(async () => {
      try {
        await sequelize.query('PRAGMA wal_checkpoint(PASSIVE);');
        console.log('Periyodik WAL checkpoint tamamlandı.');
      } catch (error) {
        console.warn('WAL checkpoint hatası:', error.message);
      }
    }, 5 * 60 * 1000); // Her 5 dakikada bir
    
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
  initializeDatabase
};