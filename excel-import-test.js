const XLSX = require('xlsx');
const path = require('path');

// Excel dosyasının yapısını test eden ve düzeltilmiş parser
function testExcelImport() {
    try {
        const excelPath = path.join(__dirname, 'docs', 'DPEO FREZE TEKLIF LISTESI.xlsx');
        console.log('Excel dosyası test ediliyor:', excelPath);
        
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('\n=== EXCEL YAPISI ===');
        console.log('Toplam satır:', jsonData.length);
        console.log('Teklif grubu:', jsonData[0][0]);
        console.log('Başlıklar:', jsonData[1]);
        
        // Sütun mapping'i (düzeltilmiş)
        const headers = jsonData[1];
        const columnMapping = {
            adet: 0,           // ADET
            parca_adi: 1,      // PARÇA ADI  
            kesit: 2,          // KESIT
            boy: 3,            // BOY
            malzeme: 4         // MAZLEME
        };
        
        // Firma sütunları (5. sütundan itibaren)
        const firmaColumns = [];
        for (let i = 5; i < headers.length; i++) {
            if (headers[i] && headers[i].toString().trim()) {
                firmaColumns.push({
                    index: i,
                    firmaAdi: headers[i].toString().trim()
                });
            }
        }
        
        console.log('\n=== FIRMA SÜTUNLARI ===');
        firmaColumns.forEach(f => {
            console.log(`${f.index}: ${f.firmaAdi}`);
        });
        
        // Veri satırlarını parse et
        console.log('\n=== VERİ SATIRLARI ===');
        const processedData = [];
        
        for (let i = 2; i < Math.min(jsonData.length, 7); i++) { // İlk 5 veri satırını test et
            const row = jsonData[i];
            
            if (!row || row.every(cell => !cell && cell !== 0)) continue;
            
            const baseData = {
                satir_no: i + 1,
                adet: row[columnMapping.adet] || 0,
                parca_adi: (row[columnMapping.parca_adi] || '').toString().trim(),
                kesit: (row[columnMapping.kesit] || '').toString().trim(),
                boy: row[columnMapping.boy] || '',
                malzeme: (row[columnMapping.malzeme] || '').toString().trim(),
                firmalar: []
            };
            
            // Firma tekliflerini al
            firmaColumns.forEach(firma => {
                const fiyat = row[firma.index];
                if (fiyat && fiyat !== '' && !isNaN(parseFloat(fiyat))) {
                    baseData.firmalar.push({
                        firma_adi: firma.firmaAdi,
                        teklif_fiyati: parseFloat(fiyat)
                    });
                }
            });
            
            if (baseData.parca_adi && baseData.firmalar.length > 0) {
                processedData.push(baseData);
            }
            
            console.log(`Satır ${i + 1}:`, {
                parça: baseData.parca_adi,
                adet: baseData.adet,
                firma_sayısı: baseData.firmalar.length,
                firmalar: baseData.firmalar.map(f => `${f.firma_adi}: ${f.teklif_fiyati}`)
            });
        }
        
        console.log('\n=== SONUÇ ===');
        console.log(`Toplam işlenebilir satır: ${processedData.length}`);
        console.log(`Toplam teklif sayısı: ${processedData.reduce((sum, item) => sum + item.firmalar.length, 0)}`);
        
        // Veritabanı formatına dönüştür
        const teklifler = [];
        processedData.forEach(item => {
            item.firmalar.forEach(firma => {
                teklifler.push({
                    parca_kodu: item.parca_adi, // Bu PARCA_ADI sütunundaki değer
                    tedarikci: firma.firma_adi,
                    teklif_fiyati: firma.teklif_fiyati,
                    adet: item.adet,
                    malzeme_kesiti: item.kesit,
                    uzunluk: item.boy,
                    malzeme_cinsi: item.malzeme,
                    teslim_suresi: 30, // Default
                    aciklama: `Kesit: ${item.kesit}, Boy: ${item.boy}, Malzeme: ${item.malzeme}`,
                    satir_no: item.satir_no
                });
            });
        });
        
        console.log('\n=== VERİTABANI FORMATI ===');
        console.log('İlk 5 teklif kaydı:');
        teklifler.slice(0, 5).forEach((teklif, index) => {
            console.log(`${index + 1}. ${teklif.parca_kodu} - ${teklif.tedarikci}: ${teklif.teklif_fiyati} TL`);
        });
        
        return {
            success: true,
            teklifGrubuAdi: jsonData[0][0],
            processedData: processedData,
            teklifler: teklifler,
            stats: {
                toplamSatir: processedData.length,
                toplamTeklif: teklifler.length,
                firmaSayisi: firmaColumns.length
            }
        };
        
    } catch (error) {
        console.error('Test hatası:', error);
        return { success: false, error: error.message };
    }
}

// Test çalıştır
const result = testExcelImport();
if (result.success) {
    console.log('\n✅ Test başarılı!');
    console.log('İstatistikler:', result.stats);
} else {
    console.log('\n❌ Test başarısız:', result.error);
}
