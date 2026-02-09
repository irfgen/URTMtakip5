const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelFilePath = path.join(__dirname, '../docs/boms.xlsx');

console.log('🔍 BOM Excel dosyası analiz ediliyor...');

try {
    // Excel dosyasının var olup olmadığını kontrol et
    if (!fs.existsSync(excelFilePath)) {
        console.error('❌ Excel dosyası bulunamadı:', excelFilePath);
        process.exit(1);
    }

    // Excel dosyasını oku
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log('📑 Bulunan sayfa isimleri:');
    workbook.SheetNames.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
    });

    // Her sayfa için analiz yap
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\n📊 Sayfa "${sheetName}" analiz ediliyor:`);
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`  📝 Toplam kayıt sayısı: ${data.length}`);
        
        if (data.length > 0) {
            console.log('  🏷️  Sütun isimleri:');
            Object.keys(data[0]).forEach((column, colIndex) => {
                console.log(`    ${colIndex + 1}. ${column}`);
            });
            
            console.log('\n  📄 İlk 3 kayıt örneği:');
            data.slice(0, 3).forEach((row, rowIndex) => {
                console.log(`    Kayıt ${rowIndex + 1}:`);
                Object.entries(row).forEach(([key, value]) => {
                    console.log(`      ${key}: ${value}`);
                });
                console.log('    ---');
            });
        }
    });

} catch (error) {
    console.error('❌ Excel dosyası analiz edilirken hata oluştu:', error.message);
    process.exit(1);
}
