const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Veritabanı dosyasını sil
const dbPath = path.join(__dirname, 'database.sqlite');
// Yedek veritabanını oluştur
const backupPath = path.join(__dirname, 'database.sqlite.bak');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('          📊 Veritabanı Tamamen Sıfırlama İşlemi                ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Yedek oluştur
const createBackup = () => {
  if (fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log('✅ Veritabanı yedeği oluşturuldu:', backupPath);
      return true;
    } catch (err) {
      console.error('❌ Veritabanı yedeği oluşturulamadı:', err.message);
      return false;
    }
  }
  return false;
};

// SQLite temizleme işlemi
const cleanSQLiteFiles = () => {
  // SQLite'ın oluşturduğu tüm geçici dosyaları temizle
  const dir = path.dirname(dbPath);
  const files = fs.readdirSync(dir);
  
  let tempFilesRemoved = 0;
  
  files.forEach(file => {
    if (file.endsWith('-journal') || file.endsWith('-wal') || file.endsWith('-shm')) {
      try {
        fs.unlinkSync(path.join(dir, file));
        tempFilesRemoved++;
      } catch (err) {
        console.error(`❌ Geçici dosya silinemedi ${file}:`, err.message);
      }
    }
  });
  
  if (tempFilesRemoved > 0) {
    console.log(`✅ ${tempFilesRemoved} adet SQLite geçici dosyası temizlendi`);
  }
};

// Ana işlem
const resetDatabase = async () => {
  // Yedek oluştur
  createBackup();
  
  // Varsa geçici dosyaları temizle
  cleanSQLiteFiles();
  
  try {
    // Veritabanı dosyasının varlığını kontrol et
    if (fs.existsSync(dbPath)) {
      // Dosya izinlerini kontrol et
      try {
        fs.accessSync(dbPath, fs.constants.W_OK);
        
        // Veritabanı dosyasını kapat (Windows için faydalı)
        if (process.platform === 'win32') {
          console.log('Windows platformu algılandı, sqlite3 işlemlerini kapatma...');
          exec('taskkill /f /im sqlite3.exe', () => {});
        }
        
        // Dosyayı sil
        fs.unlinkSync(dbPath);
        console.log('✅ Veritabanı dosyası başarıyla silindi.');
      } catch (err) {
        if (err.code === 'EACCES') {
          console.error('❌ Yetki hatası: Dosyayı silmek için yeterli izniniz yok.');
          console.error('   Aşağıdaki komutu manuel olarak çalıştırmayı deneyin:');
          console.error(`   sudo rm "${dbPath}"`);
          return;
        } else {
          throw err;
        }
      }
    } else {
      console.log('ℹ️ Veritabanı dosyası bulunamadı, silme işlemi gerekli değil.');
    }
    
    // Yeni boş veritabanı dosyası oluştur
    fs.writeFileSync(dbPath, '');
    console.log('✅ Yeni boş veritabanı dosyası oluşturuldu.');
    
    console.log('\n✅ İşlem tamamlandı. Şimdi uygulamayı başlatabilirsiniz:');
    console.log('   npm run dev');
    console.log('\n📝 Not: Veritabanı yedeğini geri yüklemek isterseniz:');
    console.log(`   cp "${backupPath}" "${dbPath}"`);
    
  } catch (error) {
    console.error('\n❌ Veritabanı sıfırlama hatası:', error.message);
  }
};

// İşlemi başlat
resetDatabase();
