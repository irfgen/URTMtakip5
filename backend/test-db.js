const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Veritabanı test ediliyor:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
        process.exit(1);
    }
    console.log('Veritabanına başarıyla bağlanıldı.');
    
    // Mevcut parça sayısını kontrol et
    db.get('SELECT COUNT(*) as count FROM parcalar', (err, row) => {
        if (err) {
            console.error('Sorgu hatası:', err.message);
        } else {
            console.log('Mevcut parça sayısı:', row.count);
        }
        
        // Mevcut parça kodlarını al
        db.all('SELECT parca_kodu FROM parcalar LIMIT 5', (err, rows) => {
            if (err) {
                console.error('Parça kodu sorgu hatası:', err.message);
            } else {
                console.log('İlk 5 parça kodu:', rows.map(r => r.parca_kodu));
            }
            db.close();
            console.log('Test tamamlandı.');
        });
    });
});
