const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Test script - gerçek Excel dosyasını backend logic ile test et

// Backend logic'ini simulate eden function
function processExcelFile(filePath) {
    try {
        console.log(`[INFO] Excel dosyası işleniyor: ${filePath}`);
        
        // Excel dosyasını oku
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Excel'i JSON'a çevir
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 3) {
            throw new Error('Excel dosyası en az 3 satır içermelidir (teklif grubu + başlık + veri)');
        }

        // İlk satır teklif grubu adı, ikinci satır başlıklar
        const teklifGrubuAdi = jsonData[0][0];
        const headers = jsonData[1];
        console.log('[DEBUG] Teklif grubu adı:', teklifGrubuAdi);
        console.log('[DEBUG] Excel başlıkları:', headers);

        // Sütun mapping'i - DPEO Excel formatına özel
        const expectedColumns = {
            adet: ['adet', 'miktar', 'quantity', 'adet:'],
            parca_kodu: ['parça adı', 'parca adi', 'parca_kodu', 'parça kodu', 'part code', 'parça adı:', 'parca adi:', 'PARÇA ADI'],
            malzeme_kesiti: ['sipariş ölçüsü', 'siparis olcusu', 'malzeme kesiti', 'kesit', 'section', 'ölçü', 'olcu', 'KESIT'],
            uzunluk: ['uzunluk', 'length', 'uzunluk:', 'boy', 'BOY'],
            malzeme_cinsi: ['mazleme', 'malzeme cinsi', 'malzeme', 'material', 'malzeme cinsi:', 'malzeme:', 'MAZLEME']
        };

        // Sütun indekslerini bul - case insensitive ve trim işlemi
        const columnMapping = {};
        Object.keys(expectedColumns).forEach(key => {
            const index = headers.findIndex(header => {
                if (!header) return false;
                const cleanHeader = header.toString().toLowerCase().trim();
                return expectedColumns[key].some(expected => 
                    cleanHeader === expected.toLowerCase() || 
                    cleanHeader.includes(expected.toLowerCase()) ||
                    expected.toLowerCase().includes(cleanHeader)
                );
            });
            if (index !== -1) {
                columnMapping[key] = index;
                console.log(`[DEBUG] ${key} sütunu bulundu: index ${index}, başlık: "${headers[index]}"`);
            } else {
                console.log(`[WARNING] ${key} sütunu bulunamadı. Beklenen: ${expectedColumns[key].join(', ')}`);
            }
        });

        console.log('[DEBUG] Sütun mapping:', columnMapping);

        // Firma sütunlarını bul (5. sütundan sonraki tüm sütunlar)
        const firmaColumns = [];
        const baseColumnCount = 5; // adet, parça, kesit, uzunluk, malzeme cinsi
        for (let i = baseColumnCount; i < headers.length; i++) {
            if (headers[i] && headers[i].toString().trim()) {
                firmaColumns.push({
                    index: i,
                    firmaAdi: headers[i].toString().trim()
                });
            }
        }

        console.log('[DEBUG] Bulunan firma sütunları:', firmaColumns);

        // Veri satırlarını işle (3. satırdan başlayarak - index 2)
        const processedData = [];
        for (let rowIndex = 2; rowIndex < jsonData.length; rowIndex++) {
            const row = jsonData[rowIndex];
            
            // Boş satırları atla
            if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
                console.log(`[DEBUG] Satır ${rowIndex + 1} boş, atlanıyor`);
                continue;
            }

            console.log(`[DEBUG] Satır ${rowIndex + 1} işleniyor:`, row);

            const baseData = {
                satir_no: rowIndex + 1,
                adet: columnMapping.adet !== undefined ? (row[columnMapping.adet] || 0) : 0,
                parca_kodu: columnMapping.parca_kodu !== undefined ? (row[columnMapping.parca_kodu] || '').toString().trim() : '',
                malzeme_kesiti: columnMapping.malzeme_kesiti !== undefined ? (row[columnMapping.malzeme_kesiti] || '').toString().trim() : '',
                uzunluk: columnMapping.uzunluk !== undefined ? (row[columnMapping.uzunluk] || '').toString().trim() : '',
                malzeme_cinsi: columnMapping.malzeme_cinsi !== undefined ? (row[columnMapping.malzeme_cinsi] || '').toString().trim() : '',
                firmalar: []
            };

            console.log(`[DEBUG] Satır ${rowIndex + 1} base data:`, baseData);

            // Her firma için teklif fiyatını al
            firmaColumns.forEach(firma => {
                const fiyat = row[firma.index];
                console.log(`[DEBUG] Firma ${firma.firmaAdi} (index ${firma.index}): fiyat = "${fiyat}"`);
                if (fiyat && fiyat.toString().trim() !== '') {
                    const numericFiyat = parseFloat(fiyat.toString().replace(',', '.'));
                    if (!isNaN(numericFiyat)) {
                        baseData.firmalar.push({
                            firma_adi: firma.firmaAdi,
                            teklif_fiyati: numericFiyat
                        });
                    }
                }
            });

            console.log(`[DEBUG] Satır ${rowIndex + 1} firmalar:`, baseData.firmalar);

            // En az bir firma teklifi varsa ve parça kodu varsa ekle
            if (baseData.firmalar.length > 0 && baseData.parca_kodu) {
                processedData.push(baseData);
                console.log(`[DEBUG] Satır ${rowIndex + 1} eklendi`);
            } else {
                console.log(`[DEBUG] Satır ${rowIndex + 1} eklenmedi - parça kodu: "${baseData.parca_kodu}", firma sayısı: ${baseData.firmalar.length}`);
            }
        }

        console.log('[DEBUG] İşlenen veri sayısı:', processedData.length);
        
        // Veritabanı formatına dönüştür
        const teklifData = [];
        processedData.forEach(item => {
            item.firmalar.forEach(firma => {
                teklifData.push({
                    parca_kodu: item.parca_kodu,
                    firma_adi: firma.firma_adi,
                    teklif_fiyati: firma.teklif_fiyati,
                    adet: item.adet,
                    teslim_suresi: 30, // Default 30 gün
                    aciklama: `Kesit: ${item.malzeme_kesiti || ''}, Boy: ${item.uzunluk || ''}, Malzeme: ${item.malzeme_cinsi || ''}`.trim(),
                    satir_no: item.satir_no
                });
            });
        });

        return {
            success: true,
            message: 'Excel dosyası başarıyla parse edildi',
            teklifGrubuAdi: teklifGrubuAdi,
            headers: headers,
            columnMapping: columnMapping,
            firmaColumns: firmaColumns,
            data: processedData,
            teklifData: teklifData,
            totalRows: processedData.length,
            totalTeklifler: teklifData.length
        };

    } catch (error) {
        console.error('[HATA] Excel parse edilirken hata:', error);
        return {
            success: false,
            message: 'Excel dosyası işlenirken hata oluştu',
            error: error.message
        };
    }
}

// Ana test fonksiyonu
function testRealExcel() {
    const excelPath = path.join(__dirname, 'docs', 'DPEO FREZE TEKLIF LISTESI.xlsx');
    
    if (!fs.existsSync(excelPath)) {
        console.error('❌ Excel dosyası bulunamadı:', excelPath);
        return;
    }

    console.log('🔍 Gerçek Excel dosyası test ediliyor...');
    console.log('📁 Dosya yolu:', excelPath);
    
    const result = processExcelFile(excelPath);
    
    if (result.success) {
        console.log('\n✅ EXCEL PARSE BAŞARILI!');
        console.log('================================================');
        console.log(`📊 Teklif Grubu: ${result.teklifGrubuAdi}`);
        console.log(`📋 Toplam İşlenen Satır: ${result.totalRows}`);
        console.log(`💼 Toplam Teklif Sayısı: ${result.totalTeklifler}`);
        console.log(`🏢 Firma Sayısı: ${result.firmaColumns.length}`);
        console.log('================================================');
        
        console.log('\n🏢 Bulunan Firmalar:');
        result.firmaColumns.forEach((firma, index) => {
            console.log(`  ${index + 1}. ${firma.firmaAdi}`);
        });
        
        console.log('\n📋 İlk 5 Teklif Kaydı:');
        result.teklifData.slice(0, 5).forEach((teklif, index) => {
            console.log(`  ${index + 1}. ${teklif.parca_kodu} - ${teklif.firma_adi}: ${teklif.teklif_fiyati} ₺`);
        });
        
        if (result.teklifData.length > 5) {
            console.log(`  ... ve ${result.teklifData.length - 5} teklif daha`);
        }
        
        console.log('\n📄 JSON çıktısı kaydetme...');
        fs.writeFileSync('teklif-test-result.json', JSON.stringify(result, null, 2));
        console.log('✅ Sonuç teklif-test-result.json dosyasına kaydedildi');
        
    } else {
        console.log('\n❌ EXCEL PARSE BAŞARISIZ!');
        console.log('================================================');
        console.log(`🚨 Hata: ${result.message}`);
        if (result.error) {
            console.log(`📝 Detay: ${result.error}`);
        }
        console.log('================================================');
    }
}

// Test'i çalıştır
testRealExcel();
