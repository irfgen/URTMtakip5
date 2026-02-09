const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('WAL checkpoint işlemi başlatılıyor...');

db.run('PRAGMA wal_checkpoint(FULL);', function(err) {
    if (err) {
        console.error('Hata:', err.message);
    } else {
        console.log('WAL checkpoint başarıyla tamamlandı');
    }
    
    db.close((err) => {
        if (err) {
            console.error('Veritabanı kapatılırken hata:', err.message);
        } else {
            console.log('Veritabanı bağlantısı kapatıldı');
        }
    });
});
