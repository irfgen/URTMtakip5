const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Ham malzeme takibi için kolonlar ekle
const migrations = [
  // Fason iş emirleri tablosuna ham malzeme kolonları ekle
  `ALTER TABLE fason_is_emirleri ADD COLUMN ham_malzeme_gonderim_tarihi DATETIME`,
  `ALTER TABLE fason_is_emirleri ADD COLUMN ham_malzeme_durumu VARCHAR DEFAULT 'gönderilmedi'`,
  `ALTER TABLE fason_is_emirleri ADD COLUMN ham_malzeme_miktari DECIMAL(10,3)`,
  `ALTER TABLE fason_is_emirleri ADD COLUMN gonderim_irsaliye_no VARCHAR`,
  `ALTER TABLE fason_is_emirleri ADD COLUMN gonderen_kisi VARCHAR`,
  `ALTER TABLE fason_is_emirleri ADD COLUMN ham_malzeme_notlar TEXT`,
  `ALTER TABLE fason_is_emirleri ADD COLUMN ham_malzeme_teslim_tarihi DATETIME`,
  `ALTER TABLE fason_is_emirleri ADD COLUMN ham_malzeme_teslim_sorumlusu VARCHAR`
];

console.log('Ham malzeme takibi kolonları ekleniyor...');

migrations.forEach((migration, index) => {
  db.run(migration, function(err) {
    if (err) {
      console.log(`Migration ${index + 1} hatası (muhtemelen zaten var):`, err.message);
    } else {
      console.log(`Migration ${index + 1} başarılı`);
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Database kapatma hatası:', err.message);
  } else {
    console.log('Ham malzeme takibi eklendi. Database bağlantısı kapatıldı.');
  }
});
