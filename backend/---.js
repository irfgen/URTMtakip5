const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Veritabanı dosyası
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Veritabanı dosya yolu:', dbPath);

const resetDatabase = async () => {
  // Varsa SQLite geçici dosyalarını temizle
  const dir = path.dirname(dbPath);
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    if (file.endsWith('.sqlite') || 
        file.endsWith('-journal') || 
        file.endsWith('-wal') || 
        file.endsWith('-shm') ||
        file.endsWith('.sqlite.bak')) {
      try {
        fs.unlinkSync(path.join(dir, file));
        console.log(`✅ ${file} dosyası silindi`);
      } catch (err) {
        console.error(`❌ ${file} dosyası silinemedi:`, err.message);
      }
    }
  });
  
  console.log('✅ Veritabanı tamamen temizlendi');
  console.log('Şimdi uygulamayı yeniden başlatın: npm run dev');
};

resetDatabase();
