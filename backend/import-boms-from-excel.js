const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const excelFilePath = path.join(__dirname, '../docs/boms.xlsx');
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🚀 BOM verilerini Excel dosyasından veritabanına aktarılıyor...');

function parseItemsList(itemsText) {
    if (!itemsText || typeof itemsText !== 'string') {
        return [];
    }
    
    const items = [];
    // Split by semicolon and clean up each item
    const parts = itemsText.split(';').map(part => part.trim());
    
    for (const part of parts) {
        if (!part) continue;
        
        // Parse format: "PARÇA: part_name x quantity"
        const match = part.match(/^PARÇA:\s*(.+?)\s*x(\d+(?:\.\d+)?)$/);
        if (match) {
            const [, partName, quantity] = match;
            items.push({
                type: 'PARCA',
                name: partName.trim(),
                quantity: parseFloat(quantity)
            });
        } else {
            console.log(`⚠️  Tanınmayan öğe formatı: "${part}"`);
        }
    }
    
    return items;
}

function parseDate(dateString) {
    if (!dateString) return new Date().toISOString();
    
    // Excel'den gelen tarih formatı: "26.05.2025 15:13:00"
    const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (match) {
        const [, day, month, year, hour, minute, second] = match;
        const date = new Date(year, month - 1, day, hour, minute, second);
        return date.toISOString();
    }
    
    // Fallback to current date
    console.log(`⚠️  Tarih formatı tanınmadı: "${dateString}", şu anki tarih kullanılıyor`);
    return new Date().toISOString();
}

try {
    // Excel dosyasını oku
    if (!fs.existsSync(excelFilePath)) {
        console.error('❌ Excel dosyası bulunamadı:', excelFilePath);
        process.exit(1);
    }

    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = 'BOM Kayıtları';
    
    if (!workbook.SheetNames.includes(sheetName)) {
        console.error(`❌ "${sheetName}" sayfası bulunamadı`);
        console.log('Mevcut sayfalar:', workbook.SheetNames);
        process.exit(1);
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Excel'den ${data.length} BOM kaydı okundu`);

    // Veritabanı bağlantısı
    const db = new sqlite3.Database(dbPath);

    // Mevcut BOM'ları kontrol et
    db.all('SELECT bom_id FROM boms', (err, existingBoms) => {
        if (err) {
            console.error('❌ Mevcut BOM kayıtları okunamadı:', err.message);
            db.close();
            process.exit(1);
        }

        const existingBomIds = new Set(existingBoms.map(b => b.bom_id));
        console.log(`🔍 Veritabanında ${existingBomIds.size} mevcut BOM bulundu`);

        let insertedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        let processedCount = 0;

        console.log('\n📝 BOM işleme başlatılıyor...\n');

        function processNext() {
            if (processedCount >= data.length) {
                console.log('\n✅ İşlem tamamlandı!');
                console.log(`📈 Özet:`);
                console.log(`  - Yeni eklenen: ${insertedCount}`);
                console.log(`  - Güncellenen: ${updatedCount}`);
                console.log(`  - Hata: ${errorCount}`);
                console.log(`  - Toplam işlenen: ${processedCount}`);
                db.close();
                return;
            }

            const row = data[processedCount];
            processedCount++;

            const bomId = row['BOM ID'];
            const bomName = row['BOM Adı'];
            const createdAt = parseDate(row['Oluşturma Tarihi']);
            const updatedAt = parseDate(row['Güncelleme Tarihi']);
            const itemsList = row['Öğe Listesi'];

            if (!bomId || !bomName) {
                console.log(`⚠️  Satır ${processedCount}: BOM ID veya adı boş, atlanıyor`);
                errorCount++;
                setImmediate(processNext);
                return;
            }

            // Parse items list
            const items = parseItemsList(itemsList);
            const itemsJson = JSON.stringify(items);

            if (existingBomIds.has(bomId)) {
                // Update existing BOM
                const updateSql = `
                    UPDATE boms 
                    SET name = ?, items = ?, updated_at = ?
                    WHERE bom_id = ?
                `;
                
                db.run(updateSql, [bomName, itemsJson, updatedAt, bomId], function(err) {
                    if (err) {
                        console.error(`❌ BOM güncelleme hatası (${bomId}):`, err.message);
                        errorCount++;
                    } else {
                        console.log(`🔄 Güncellendi: ${bomName} (${items.length} öğe)`);
                        updatedCount++;
                    }
                    setImmediate(processNext);
                });
            } else {
                // Insert new BOM
                const insertSql = `
                    INSERT INTO boms (bom_id, name, description, items, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                const description = `${items.length} bileşenli BOM - Excel'den aktarıldı`;
                
                db.run(insertSql, [bomId, bomName, description, itemsJson, createdAt, updatedAt], function(err) {
                    if (err) {
                        console.error(`❌ BOM ekleme hatası (${bomId}):`, err.message);
                        errorCount++;
                    } else {
                        console.log(`➕ Eklendi: ${bomName} (${items.length} öğe)`);
                        insertedCount++;
                    }
                    setImmediate(processNext);
                });
            }
        }

        processNext();
    });

} catch (error) {
    console.error('❌ İşlem sırasında hata oluştu:', error.message);
    process.exit(1);
}
