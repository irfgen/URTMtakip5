const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database dosyalarının yolları
const dbPath = path.join(__dirname, 'database.sqlite');

// Backup path
const backupPath = path.join(__dirname, `database_backup_stok_karti_id_${Date.now()}.sqlite`);

console.log('🔧 İş emirleri tablosuna stok_karti_id alanı ekleniyor...');

async function runMigration() {
  return new Promise((resolve, reject) => {
    // Backup oluştur
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`📋 Backup oluşturuldu: ${backupPath}`);
    } catch (error) {
      console.error('❌ Backup oluşturma hatası:', error);
      return reject(error);
    }

    // Database bağlantısı
    const db = new sqlite3.Database(dbPath);

  // Mevcut tablo yapısını kontrol et
  const tableInfo = db.prepare("PRAGMA table_info(is_emirleri)").all();
  console.log('📊 Mevcut is_emirleri tablo yapısı:');
  tableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
  });

  // Stok kartı ID alanı zaten var mı kontrol et
  const stokKartiIdExists = tableInfo.some(column => column.name === 'stok_karti_id');

  if (stokKartiIdExists) {
    console.log('✅ stok_karti_id alanı zaten mevcut');
  } else {
    // Stok kartı ID alanını ekle
    console.log('➕ stok_karti_id alanı ekleniyor...');
    
    db.exec(`
      ALTER TABLE is_emirleri 
      ADD COLUMN stok_karti_id INTEGER REFERENCES stok_kartlari(id)
    `);

    console.log('✅ stok_karti_id alanı başarıyla eklendi');
  }

  // Tablo yapısını tekrar kontrol et
  const updatedTableInfo = db.prepare("PRAGMA table_info(is_emirleri)").all();
  console.log('📊 Güncellenmiş is_emirleri tablo yapısı:');
  updatedTableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
  });

  // İş emirleri sayısını göster
  const isEmirleriCount = db.prepare("SELECT COUNT(*) as count FROM is_emirleri").get();
  console.log(`📊 Toplam iş emri sayısı: ${isEmirleriCount.count}`);

  // Stok kartları sayısını göster
  const stokKartlariCount = db.prepare("SELECT COUNT(*) as count FROM stok_kartlari").get();
  console.log(`📊 Toplam stok kartı sayısı: ${stokKartlariCount.count}`);

  db.close();
  console.log('✅ Database migration tamamlandı!');

} catch (error) {
  console.error('❌ Migration sırasında hata:', error);
  
  // Hata durumunda backup'ı geri yükle
  if (fs.existsSync(backupPath)) {
    try {
      fs.copyFileSync(backupPath, dbPath);
      console.log('🔄 Backup geri yüklendi');
    } catch (restoreError) {
      console.error('❌ Backup geri yükleme hatası:', restoreError);
    }
  }
  
  process.exit(1);
}
