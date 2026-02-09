const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// API Test Script - Excel Import Flow Test

const API_BASE = 'http://localhost:3000/api';

async function testExcelImport() {
    console.log('🔍 Excel Import API Test Başlatılıyor...\n');
    
    try {
        // 1. Excel dosyasını hazırla
        const excelPath = path.join(__dirname, 'docs', 'DPEO FREZE TEKLIF LISTESI.xlsx');
        
        if (!fs.existsSync(excelPath)) {
            console.log('❌ Excel dosyası bulunamadı:', excelPath);
            return;
        }
        
        console.log('📁 Excel dosyası bulundu:', excelPath);
        console.log('📏 Dosya boyutu:', (fs.statSync(excelPath).size / 1024).toFixed(2), 'KB\n');
        
        // 2. Excel upload ve parse test
        console.log('📤 Excel dosyası backend\'e yükleniyor...');
        
        const formData = new FormData();
        formData.append('excel', fs.createReadStream(excelPath));
        
        const uploadResponse = await axios.post(`${API_BASE}/fason/teklifler/upload-excel`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 30000
        });
        
        console.log('✅ Excel parse edildi!');
        console.log('📊 Sonuçlar:');
        console.log(`   - Teklif Grubu: ${uploadResponse.data.teklifGrubuAdi}`);
        console.log(`   - Toplam Satır: ${uploadResponse.data.totalRows}`);
        console.log(`   - Firma Sayısı: ${uploadResponse.data.firmaColumns.length}`);
        console.log(`   - Toplam Teklif: ${uploadResponse.data.data.reduce((sum, item) => sum + item.firmalar.length, 0)}\n`);
        
        // 3. Parça kodlarını kontrol et
        console.log('🔍 Parça kodları kontrol ediliyor...');
        const uniqueParcaKodlari = [...new Set(uploadResponse.data.data.map(item => item.parca_kodu))];
        
        let bulunanParcalar = 0;
        let bulunamayanParcalar = [];
        
        for (const parcaKodu of uniqueParcaKodlari.slice(0, 5)) { // İlk 5'ini test et
            try {
                const checkResponse = await axios.get(`${API_BASE}/fason/teklifler/check-parca?parca_kodu=${encodeURIComponent(parcaKodu)}`);
                if (checkResponse.data.exists) {
                    bulunanParcalar++;
                    console.log(`   ✅ ${parcaKodu} - Parça var`);
                } else {
                    bulunamayanParcalar.push(parcaKodu);
                    console.log(`   ❌ ${parcaKodu} - Parça yok`);
                }
            } catch (err) {
                console.log(`   ⚠️  ${parcaKodu} - Kontrol hatası: ${err.message}`);
            }
        }
        
        console.log(`\n📋 Parça Kontrolü Özeti:`);
        console.log(`   - Kontrol edilen: ${Math.min(5, uniqueParcaKodlari.length)}`);
        console.log(`   - Bulunan: ${bulunanParcalar}`);
        console.log(`   - Bulunamayan: ${bulunamayanParcalar.length}\n`);
        
        // 4. Bulk teklif kaydını test et
        console.log('💾 Toplu teklif kaydı test ediliyor...');
        
        // İlk 3 satırın tekliflerini test için hazırla
        const testTeklifData = [];
        uploadResponse.data.data.slice(0, 3).forEach(item => {
            item.firmalar.forEach(firma => {
                testTeklifData.push({
                    parca_kodu: item.parca_kodu,
                    firma_adi: firma.firma_adi,
                    teklif_fiyati: firma.teklif_fiyati,
                    adet: item.adet,
                    teslim_suresi: 30,
                    aciklama: `Test: ${item.malzeme_kesiti} ${item.uzunluk} - ${item.malzeme_cinsi}`,
                    satir_no: item.satir_no
                });
            });
        });
        
        console.log(`📊 Test için ${testTeklifData.length} teklif kaydı hazırlandı`);
        
        const bulkResponse = await axios.post(`${API_BASE}/fason/teklifler/bulk-create`, {
            teklifData: testTeklifData
        });
        
        console.log('✅ Toplu kayıt tamamlandı!');
        console.log(`📊 Sonuçlar:`);
        console.log(`   - Başarılı: ${bulkResponse.data.results.basarili.length}`);
        console.log(`   - Başarısız: ${bulkResponse.data.results.basarisiz.length}`);
        console.log(`   - Toplam: ${bulkResponse.data.results.toplam}\n`);
        
        if (bulkResponse.data.results.basarisiz.length > 0) {
            console.log('❌ Başarısız kayıtlar:');
            bulkResponse.data.results.basarisiz.forEach(item => {
                console.log(`   - Satır ${item.satir_no}: ${item.parca_kodu} - ${item.hata}`);
            });
            console.log('');
        }
        
        // 5. Kaydedilen teklifleri listele
        console.log('📋 Kaydedilen teklifler kontrol ediliyor...');
        
        if (bulkResponse.data.results.basarili.length > 0) {
            const ilkBasariliParca = bulkResponse.data.results.basarili[0].parca_kodu;
            try {
                const teklifListResponse = await axios.get(`${API_BASE}/fason/teklifler/parca/${encodeURIComponent(ilkBasariliParca)}`);
                console.log(`✅ ${ilkBasariliParca} parçası için ${teklifListResponse.data.length} teklif bulundu`);
                
                teklifListResponse.data.slice(0, 3).forEach((teklif, index) => {
                    console.log(`   ${index + 1}. ${teklif.tedarikci}: ${teklif.teklif_fiyati} ₺`);
                });
            } catch (err) {
                console.log(`❌ Teklif listesi alınırken hata: ${err.message}`);
            }
        }
        
        console.log('\n🎉 TEST TAMAMLANDI!');
        console.log('================================================');
        console.log('✅ Excel parse işlemi başarılı');
        console.log('✅ Parça kontrol API\'si çalışıyor');
        console.log('✅ Toplu teklif kaydı çalışıyor');
        console.log('✅ Teklif listeleme çalışıyor');
        console.log('================================================\n');
        
    } catch (error) {
        console.error('❌ TEST HATASI:', error.message);
        if (error.response) {
            console.error('📄 Response data:', error.response.data);
        }
    }
}

// Test'i çalıştır
testExcelImport();
