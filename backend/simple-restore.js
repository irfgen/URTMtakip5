const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();

const excelFilePath = path.join(__dirname, '../docs/parcalar.xlsx');
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🚀 Excel verilerini akıllı şekilde veritabanına entegre ediliyor...');

// Excel dosyasını oku
const workbook = XLSX.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`📊 Excel'den ${data.length} kayıt okundu`);

// Veritabanı bağlantısı
const db = new sqlite3.Database(dbPath);

// Mevcut parça kodlarını al
db.all('SELECT parca_kodu FROM parcalar', (err, existingParts) => {
    if (err) {
        console.error('❌ Mevcut kayıtlar okunamadı:', err.message);
        process.exit(1);
    }

    const existingCodes = new Set(existingParts.map(p => p.parca_kodu));
    console.log(`🔍 Veritabanında ${existingCodes.size} mevcut parça bulundu`);

    let updatedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;
    let processedCount = 0;

    console.log('\n📝 İşlem başlatılıyor...\n');

    data.forEach((row, index) => {
        const parcaKodu = row['Parça Kodu'];
        if (!parcaKodu) {
            console.log(`⚠️  Satır ${index + 1}: Parça kodu boş, atlanıyor`);
            processedCount++;
            checkCompletion();
            return;
        }

        const currentDate = new Date().toISOString();

        if (existingCodes.has(parcaKodu)) {
            // Güncelle
            const updateQuery = `
                UPDATE parcalar SET
                    stok_adeti = ?, kritik_stok = ?, foto_path = ?,
                    tedarik_bedeli = ?, imal_mi = ?, ham_malzeme_cinsi = ?,
                    ham_malzeme_olculeri = ?, updated_at = ?, siyah = ?,
                    parca_kayit_idleri = ?, kategori = ?
                WHERE parca_kodu = ?
            `;

            db.run(updateQuery, [
                row['Stok Adeti'] || 0,
                row['Kritik Stok'] || 0,
                row['Fotoğraf'] || null,
                row['Tedarik Bedeli'] || 0,
                row['İmal mı?'] === true ? 1 : 0,
                row['Ham Malzeme Cinsi'] || null,
                row['Ham Malzeme Ölçüleri'] || null,
                currentDate,
                row['Siyah mı?'] === true ? 1 : 0,
                row['Parça Adı'] || null,
                row['Kategori'] || null,
                parcaKodu
            ], function(err) {
                if (err) {
                    console.error(`❌ Güncelleme hatası - ${parcaKodu}:`, err.message);
                } else {
                    updatedCount++;
                    console.log(`🔄 Güncellendi: ${parcaKodu}`);
                }
                processedCount++;
                checkCompletion();
            });
        } else {
            // Yeni kayıt ekle
            const insertQuery = `
                INSERT INTO parcalar (
                    parca_kodu, stok_adeti, kritik_stok, foto_path,
                    tedarik_bedeli, imal_mi, ham_malzeme_cinsi,
                    ham_malzeme_olculeri, created_at, updated_at,
                    siyah, parca_kayit_idleri, kategori
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(insertQuery, [
                parcaKodu,
                row['Stok Adeti'] || 0,
                row['Kritik Stok'] || 0,
                row['Fotoğraf'] || null,
                row['Tedarik Bedeli'] || 0,
                row['İmal mı?'] === true ? 1 : 0,
                row['Ham Malzeme Cinsi'] || null,
                row['Ham Malzeme Ölçüleri'] || null,
                currentDate,
                currentDate,
                row['Siyah mı?'] === true ? 1 : 0,
                row['Parça Adı'] || null,
                row['Kategori'] || null
            ], function(err) {
                if (err) {
                    console.error(`❌ Ekleme hatası - ${parcaKodu}:`, err.message);
                } else {
                    insertedCount++;
                    console.log(`➕ Eklendi: ${parcaKodu}`);
                }
                processedCount++;
                checkCompletion();
            });
        }
    });

    function checkCompletion() {
        if (processedCount === data.length) {
            console.log('\n✅ İşlem tamamlandı!');
            console.log(`📊 Özet:`);
            console.log(`   🔄 Güncellenen: ${updatedCount}`);
            console.log(`   ➕ Eklenen: ${insertedCount}`);
            console.log(`   ⏭️  Atlanan: ${skippedCount}`);
            console.log(`   📝 Toplam işlenen: ${processedCount}`);
            
            // Son kontrol
            db.get('SELECT COUNT(*) as total FROM parcalar', (err, row) => {
                if (!err) {
                    console.log(`\n🎯 Veritabanındaki toplam parça sayısı: ${row.total}`);
                }
                db.close();
            });
        }
    }
});
