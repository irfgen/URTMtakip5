const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://192.168.1.206:3000/api';

async function testTeklifExcelUpload() {
    try {
        console.log('Teklif Excel upload testi başlıyor...');
        
        // Test Excel dosyasını bul
        const excelPath = path.join(__dirname, 'test-teklif-dogru-format.xlsx');
        
        if (!fs.existsSync(excelPath)) {
            console.error('Test Excel dosyası bulunamadı:', excelPath);
            return;
        }
        
        console.log('Excel dosyası bulundu:', excelPath);
        
        // FormData oluştur
        const formData = new FormData();
        formData.append('excel', fs.createReadStream(excelPath));
        
        // API'ye gönder
        console.log('Excel dosyası yükleniyor...');
        const response = await axios.post(`${BASE_URL}/fason/teklifler/upload-excel`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000
        });
        
        console.log('API Response Status:', response.status);
        console.log('API Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.data) {
            console.log('\n=== PARSE SONUÇLARI ===');
            console.log('Teklif Grubu Adı:', response.data.teklifGrubuAdi);
            console.log('Toplam Satır Sayısı:', response.data.totalRows);
            console.log('İşlenen Veri Sayısı:', response.data.data.length);
            
            if (response.data.data.length > 0) {
                console.log('\nİlk 3 veri örneği:');
                response.data.data.slice(0, 3).forEach((item, index) => {
                    console.log(`${index + 1}. Satır:`, {
                        satir_no: item.satir_no,
                        parca_kodu: item.parca_kodu,
                        adet: item.adet,
                        firmalar: item.firmalar.length
                    });
                });
            }
        }
        
    } catch (error) {
        console.error('Test hatası:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

// Test'i çalıştır
testTeklifExcelUpload();
