// filepath: /home/irfan/Documents/PROJELER/URTMtakip/backend/run-tezgah-durum-log-migration.js
const path = require('path');
const Sequelize = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

// Veritabanı bağlantısını oluştur
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Veritabanı dosya yolu:', dbPath);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

// Migration'ları çalıştıracak nesneyi oluştur
const umzug = new Umzug({
  migrations: { 
    glob: '20250420_create_tezgah_durum_log_table.js',
    path: path.join(__dirname, 'migrations') 
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Migration işlemini çalıştır
(async () => {
  try {
    console.log('TezgahDurumLog migration\'ı çalıştırılıyor...');
    const migrations = await umzug.up();
    console.log('Migration başarıyla tamamlandı!');
    console.log('Çalıştırılan migration dosyaları:', migrations.map(m => m.name).join(', '));
  } catch (error) {
    console.error('Migration sırasında hata oluştu:', error);
  } finally {
    await sequelize.close();
  }
})();
