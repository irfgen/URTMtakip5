const XLSX = require('xlsx');
const path = require('path');

// Excel dosyasını oku ve analiz et
function analyzeExcelFile(filePath) {
    try {
        console.log(`Excel dosyası okunuyor: ${filePath}`);
        
        // Excel dosyasını oku
        const workbook = XLSX.readFile(filePath);
        
        console.log('Worksheet isimleri:');
        console.log(workbook.SheetNames);
        
        // Her worksheet'i analiz et
        workbook.SheetNames.forEach((sheetName, index) => {
            console.log(`\n=== WORKSHEET ${index + 1}: ${sheetName} ===`);
            
            const worksheet = workbook.Sheets[sheetName];
            
            // Worksheet'i JSON formatına çevir
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log(`Toplam satır sayısı: ${jsonData.length}`);
            
            if (jsonData.length > 0) {
                console.log('\nİlk 10 satır:');
                jsonData.slice(0, 10).forEach((row, rowIndex) => {
                    console.log(`Satır ${rowIndex + 1}:`, row);
                });
                
                // Header satırını tespit et
                if (jsonData.length > 0) {
                    console.log('\nPotansiyel header satırı:');
                    console.log(jsonData[0]);
                }
                
                // Dolu olmayan hücreleri filtrele ve yapıyı anla
                const nonEmptyRows = jsonData.filter(row => 
                    row && row.some(cell => cell !== undefined && cell !== null && cell !== '')
                );
                
                console.log(`Dolu satır sayısı: ${nonEmptyRows.length}`);
                
                if (nonEmptyRows.length > 1) {
                    console.log('\nVeri örneği (ilk 5 dolu satır):');
                    nonEmptyRows.slice(0, 5).forEach((row, rowIndex) => {
                        console.log(`Dolu Satır ${rowIndex + 1}:`, row);
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('Excel dosyası okunurken hata:', error);
    }
}

// Ana fonksiyon
function main() {
    const excelPath = path.join(__dirname, 'docs', 'DPEO FREZE TEKLIF LISTESI.xlsx');
    analyzeExcelFile(excelPath);
}

main();
