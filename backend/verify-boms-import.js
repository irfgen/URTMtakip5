const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔍 BOM veritabanı doğrulanıyor...');

const db = new sqlite3.Database(dbPath);

// Total count
db.get('SELECT COUNT(*) as total FROM boms', (err, row) => {
    if (err) {
        console.error('❌ Hata:', err.message);
        return;
    }
    
    console.log(`📊 Toplam BOM sayısı: ${row.total}`);
    
    // Sample BOM with full details
    db.get(`
        SELECT bom_id, name, description, items, created_at, updated_at 
        FROM boms 
        WHERE name LIKE '%56_KB_KANAL_ACMA%' 
        LIMIT 1
    `, (err, bom) => {
        if (err) {
            console.error('❌ Hata:', err.message);
            return;
        }
        
        if (bom) {
            console.log('\n📋 Örnek BOM:');
            console.log(`  ID: ${bom.bom_id}`);
            console.log(`  Adı: ${bom.name}`);
            console.log(`  Açıklama: ${bom.description}`);
            console.log(`  Oluşturma: ${bom.created_at}`);
            console.log(`  Güncelleme: ${bom.updated_at}`);
            
            try {
                const items = JSON.parse(bom.items);
                console.log(`  Öğe sayısı: ${items.length}`);
                console.log('\n  🔧 İlk 5 öğe:');
                items.slice(0, 5).forEach((item, index) => {
                    console.log(`    ${index + 1}. ${item.name} (${item.quantity} adet) - ${item.type}`);
                });
                
                if (items.length > 5) {
                    console.log(`    ... ve ${items.length - 5} öğe daha`);
                }
            } catch (parseError) {
                console.error('❌ JSON parse hatası:', parseError.message);
            }
        }
        
        // Summary by name patterns
        db.all(`
            SELECT 
                CASE 
                    WHEN name LIKE 'KB_%' THEN 'KB Serisi'
                    WHEN name LIKE '56_%' THEN '56 Serisi'
                    WHEN name LIKE 'ADVANTAGE_%' THEN 'Advantage Serisi'
                    WHEN name LIKE 'ROYAL8_%' THEN 'Royal8 Serisi'
                    WHEN name LIKE 'PVC_%' THEN 'PVC Serisi'
                    ELSE 'Diğer'
                END as kategori,
                COUNT(*) as adet
            FROM boms 
            GROUP BY kategori
            ORDER BY adet DESC
        `, (err, categories) => {
            if (err) {
                console.error('❌ Hata:', err.message);
                return;
            }
            
            console.log('\n📈 BOM kategorileri:');
            categories.forEach(cat => {
                console.log(`  ${cat.kategori}: ${cat.adet} adet`);
            });
            
            db.close();
            console.log('\n✅ Doğrulama tamamlandı!');
        });
    });
});
