const axios = require('axios');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function createMissingParts() {
    console.log('🔧 Eksik parçalar oluşturuluyor...\n');

    try {
        // Excel dosyasını oku
        const excelPath = path.join(__dirname, 'docs', 'DPEO FREZE TEKLIF LISTESI.xlsx');
        console.log('📁 Excel dosyası okunuyor:', excelPath);
        
        if (!fs.existsSync(excelPath)) {
            throw new Error('Excel dosyası bulunamadı!');
        }

        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Excel'den parça bilgilerini çıkar
        const parcaBilgileri = [];
        
        for (let i = 2; i < data.length; i++) { // 3. satırdan başla (0-indexed)
            const row = data[i];
            if (row && row[1]) { // PARÇA ADI sütunu boş değilse
                const parcaKodu = row[1];
                const malzemeKesiti = row[2] || '';
                const uzunluk = row[3] || '';
                const malzemeCinsi = row[4] || '';
                
                parcaBilgileri.push({
                    parcaKodu,
                    malzemeKesiti,
                    uzunluk,
                    malzemeCinsi
                });
            }
        }

        console.log(`📊 Excel'den ${parcaBilgileri.length} parça bilgisi çıkarıldı\n`);

        // Her parça için kontrol et ve yoksa oluştur
        let oluşturulan = 0;
        let mevcut = 0;

        for (const parca of parcaBilgileri) {
            try {
                // Parça var mı kontrol et
                const kontrol = await axios.get(`${BASE_URL}/fason-teklif/check-parca-kodu`, {
                    params: { parca_kodu: parca.parcaKodu }
                });

                if (kontrol.data.exists) {
                    console.log(`✅ ${parca.parcaKodu} - Zaten mevcut`);
                    mevcut++;
                } else {
                    console.log(`❌ ${parca.parcaKodu} - Yok, oluşturuluyor...`);
                    
                    // Yeni parça oluştur
                    const yeniParca = {
                        parcaKodu: parca.parcaKodu,
                        parcaAdi: parca.parcaKodu, // Şimdilik parça kodu = parça adı
                        kategori: 'FASON_TEKLIF_IMPORT',
                        stokAdeti: 0,
                        kritikStok: 0,
                        imalMi: false,
                        hamMalzemeCinsi: parca.malzemeCinsi,
                        hamMalzemeOlculeri: `${parca.malzemeKesiti} x ${parca.uzunluk}mm`
                    };

                    const response = await axios.post(`${BASE_URL}/parcalar`, yeniParca);
                    
                    if (response.status === 201) {
                        console.log(`✅ ${parca.parcaKodu} - Başarıyla oluşturuldu`);
                        oluşturulan++;
                    } else {
                        console.log(`❌ ${parca.parcaKodu} - Oluşturulamadı`);
                    }
                }
            } catch (error) {
                console.log(`❌ ${parca.parcaKodu} - Hata: ${error.response?.data?.message || error.message}`);
            }

            // API'ye fazla yük vermemek için kısa bekleme
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('\n🎉 Parça oluşturma işlemi tamamlandı!');
        console.log(`📊 Özet:`);
        console.log(`   - Mevcut parçalar: ${mevcut}`);
        console.log(`   - Oluşturulan parçalar: ${oluşturulan}`);
        console.log(`   - Toplam: ${mevcut + oluşturulan}`);

        // Şimdi tekrar teklif kaydını deneyelim
        if (oluşturulan > 0) {
            console.log('\n🔄 Tekrar teklif kaydı deneniyor...');
            
            // Excel'i yeniden yükle
            const formData = new FormData();
            const fileBuffer = fs.readFileSync(excelPath);
            const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            formData.append('excel', blob, 'DPEO FREZE TEKLIF LISTESI.xlsx');

            const uploadResponse = await axios.post(`${BASE_URL}/fason-teklif/upload-excel`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (uploadResponse.data.success) {
                const teklifler = uploadResponse.data.data.teklifler;

                // Toplu teklif kaydı
                const bulkResponse = await axios.post(`${BASE_URL}/fason-teklif/bulk-create`, {
                    teklifler: teklifler.slice(0, 12) // İlk 12 teklifi test et
                });

                console.log(`✅ Toplu teklif kaydı sonucu:`);
                console.log(`   - Başarılı: ${bulkResponse.data.basarili}`);
                console.log(`   - Başarısız: ${bulkResponse.data.basarisiz}`);
            }
        }

    } catch (error) {
        console.error('❌ Hata:', error.response?.data || error.message);
        console.error('Stack:', error.stack);
    }
}

// Script'i çalıştır
createMissingParts();
