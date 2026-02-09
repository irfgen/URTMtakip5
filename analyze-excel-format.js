#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Excel dosyasını analiz et
const excelPath = '/home/urtmtakip/Belgeler/URTMtakip/docs/DPEO FREZE TEKLIF LISTESI.xlsx';

console.log('📊 Excel Dosyası Format Analizi');
console.log('='.repeat(50));
console.log(`📁 Dosya: ${excelPath}`);

try {
    // Excel dosyasını oku
    const workbook = XLSX.readFile(excelPath);
    
    console.log('\n📋 Çalışma Sayfaları:');
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`  ${index + 1}. ${sheetName}`);
    });
    
    // İlk sayfayı analiz et
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    console.log(`\n🔍 "${firstSheetName}" Sayfası Analizi:`);
    
    // JSON formatına çevir
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length > 0) {
        console.log('\n📊 İlk 10 Satır:');
        data.slice(0, 10).forEach((row, index) => {
            console.log(`  Satır ${index + 1}:`, row);
        });
        
        // Başlık satırını analiz et
        if (data[0]) {
            console.log('\n🏷️  Başlık Satırı (Kolonlar):');
            data[0].forEach((header, index) => {
                if (header) {
                    console.log(`  ${String.fromCharCode(65 + index)} kolonunda: "${header}"`);
                }
            });
        }
        
        // Parça kodu ve adet kolonlarını bul
        console.log('\n🔎 Parça Kodu ve Adet Kolonları Arama:');
        
        const headerRow = data[0];
        let parcaKoduIndex = -1;
        let adetIndex = -1;
        
        headerRow.forEach((header, index) => {
            if (header && typeof header === 'string') {
                const headerLower = header.toLowerCase().replace(/\s+/g, '').replace(/[ıİçÇşŞğĞüÜöÖ]/g, match => {
                    const map = { 'ı': 'i', 'İ': 'I', 'ç': 'c', 'Ç': 'C', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O' };
                    return map[match] || match;
                });
                
                // Parça kodu arama
                if (headerLower.includes('parca') || headerLower.includes('kod') || headerLower.includes('part')) {
                    parcaKoduIndex = index;
                    console.log(`  ✅ Parça Kodu kolonu bulundu: ${String.fromCharCode(65 + index)} - "${header}"`);
                }
                
                // Adet arama
                if (headerLower.includes('adet') || headerLower.includes('qty') || headerLower.includes('quantity') || headerLower.includes('miktar')) {
                    adetIndex = index;
                    console.log(`  ✅ Adet kolonu bulundu: ${String.fromCharCode(65 + index)} - "${header}"`);
                }
            }
        });
        
        if (parcaKoduIndex === -1) {
            console.log('  ❌ Parça kodu kolonu bulunamadı');
        }
        if (adetIndex === -1) {
            console.log('  ❌ Adet kolonu bulunamadı');
        }
        
        // Örnek veri satırları
        if (parcaKoduIndex >= 0 || adetIndex >= 0) {
            console.log('\n📝 Örnek Veri Satırları:');
            data.slice(1, 6).forEach((row, index) => {
                const parcaKodu = parcaKoduIndex >= 0 ? row[parcaKoduIndex] : 'N/A';
                const adet = adetIndex >= 0 ? row[adetIndex] : 'N/A';
                console.log(`  Satır ${index + 2}: Parça="${parcaKodu}", Adet="${adet}"`);
            });
        }
        
        console.log(`\n📈 Toplam Satır Sayısı: ${data.length}`);
        console.log(`📈 Veri Satırı Sayısı: ${data.length - 1} (başlık hariç)`);
        
    } else {
        console.log('❌ Veri bulunamadı');
    }
    
} catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Stack:', error.stack);
}

console.log('\n' + '='.repeat(50));
console.log('✅ Analiz tamamlandı');
