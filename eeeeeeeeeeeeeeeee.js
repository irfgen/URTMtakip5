const fs = require('fs');
const path = require('path');

// Veritabanı dosya yolunu tanımla
const dbPath = path.join(__dirname, 'backend/database.sqlite');
console.log('Veritabanı dosya yolu:', dbPath);

const resetDatabase = async () => {
  // Veritabanı ve tüm ilgili dosyaları sil
  const dir = path.dirname(dbPath);
  const files = fs.readdirSync(dir);
  
  let dbFiles = [];
  
  files.forEach(file => {
    if (file.endsWith('.sqlite') || 
        file.endsWith('-journal') || 
        file.endsWith('-wal') || 
        file.endsWith('-shm') ||
        file.endsWith('.sqlite.bak')) {
      const filePath = path.join(dir, file);
      dbFiles.push(filePath);
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ ${file} dosyası silindi`);
      } catch (err) {
        console.error(`❌ ${file} dosyası silinemedi:`, err.message);
      }
    }
  });
  
  if (dbFiles.length === 0) {
    console.log('⚠️ Silinecek veritabanı dosyası bulunamadı.');
  } else {
    console.log('✅ Veritabanı tamamen temizlendi');
  }
  
  console.log('Şimdi uygulamayı yeniden başlatın:');
  console.log('cd backend && npm run dev');
};

resetDatabase();
