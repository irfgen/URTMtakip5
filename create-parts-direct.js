const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Eksik parçalar listesi
const eksikParcalar = [
    { parcaKodu: 'EPEO_KSC-002', malzemeKesiti: '40X25', uzunluk: '45', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'EPEO_KSC-003', malzemeKesiti: '30X20', uzunluk: '85', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'EPEO_CZC_002', malzemeKesiti: '40X25', uzunluk: '45', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'DPEO_CZC_015', malzemeKesiti: '40X25', uzunluk: '30', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'DPEO_PKR_004', malzemeKesiti: '50X20', uzunluk: '53', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'EPEO_PKP_006', malzemeKesiti: '120X60', uzunluk: '120', malzemeCinsi: 'C1040' },
    { parcaKodu: 'DPEO_PKP_007', malzemeKesiti: '20X15', uzunluk: '153', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'D383_KOPRU_019', malzemeKesiti: '10X15', uzunluk: '105', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'DPEO_BLK_008-SOL', malzemeKesiti: '50X50', uzunluk: '340', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'DPEO_BLK_008-SAG', malzemeKesiti: '50X50', uzunluk: '340', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'EPEO_BLK_007', malzemeKesiti: '100X40', uzunluk: '526', malzemeCinsi: 'SICAK' },
    { parcaKodu: 'DPEO-BLK_012', malzemeKesiti: '35X25', uzunluk: '90', malzemeCinsi: 'ALÜMİNYUM' },
    { parcaKodu: 'DPEO_TSY_005', malzemeKesiti: '20X15', uzunluk: '130', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'DPEO_UBS_009', malzemeKesiti: '25X100', uzunluk: '50', malzemeCinsi: 'POLIEMID' },
    { parcaKodu: 'DPEO_UBS_010', malzemeKesiti: '25X100', uzunluk: '50', malzemeCinsi: 'POLIEMID' },
    { parcaKodu: 'EPEO_ARB_001', malzemeKesiti: '100X25', uzunluk: '705', malzemeCinsi: 'SICAK' },
    { parcaKodu: 'EPEO_ARB_002', malzemeKesiti: '100X25', uzunluk: '335', malzemeCinsi: 'SICAK' },
    { parcaKodu: 'EPEO_YDT_004', malzemeKesiti: '20X30', uzunluk: '60', malzemeCinsi: 'SOĞUK' },
    { parcaKodu: 'EPEO_YDK_001', malzemeKesiti: '50X50', uzunluk: '85', malzemeCinsi: 'SICAK' }
];

async function createMissingParts() {
    console.log('🔧 Eksik parçalar oluşturuluyor...\n');

    let oluşturulan = 0;
    let zatenVar = 0;
    let hata = 0;

    for (const parca of eksikParcalar) {
        try {
            console.log(`📝 ${parca.parcaKodu} oluşturuluyor...`);
            
            // Yeni parça oluştur
            const yeniParca = {
                parcaKodu: parca.parcaKodu,
                parcaAdi: parca.parcaKodu,
                kategori: 'FASON_TEKLIF_IMPORT',
                stokAdeti: 0,
                kritikStok: 0,
                tedarikBedeli: 0,
                imalMi: true,
                hamMalzemeCinsi: parca.malzemeCinsi,
                hamMalzemeOlculeri: `${parca.malzemeKesiti} x ${parca.uzunluk}mm`,
                fasonMaliyeti: 0,
                sirketIciMaliyeti: 0,
                setupSayisi: 0,
                cncIslemeSuresi: 0,
                siyah: false
            };

            const response = await axios.post(`${BASE_URL}/parcalar`, yeniParca);
            
            if (response.status === 201) {
                console.log(`✅ ${parca.parcaKodu} - Başarıyla oluşturuldu`);
                oluşturulan++;
            } else {
                console.log(`❌ ${parca.parcaKodu} - Beklenmeyen yanıt (${response.status})`);
                hata++;
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('Parça kodu zaten mevcut')) {
                console.log(`✅ ${parca.parcaKodu} - Zaten mevcut`);
                zatenVar++;
            } else {
                console.log(`❌ ${parca.parcaKodu} - Hata: ${error.response?.data?.message || error.message}`);
                hata++;
            }
        }

        // API'ye fazla yük vermemek için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n🎉 Parça oluşturma işlemi tamamlandı!');
    console.log(`📊 Özet:`);
    console.log(`   - Oluşturulan parçalar: ${oluşturulan}`);
    console.log(`   - Zaten mevcut: ${zatenVar}`);
    console.log(`   - Hata: ${hata}`);
    console.log(`   - Toplam: ${oluşturulan + zatenVar + hata}`);

    return oluşturulan > 0;
}

// Script'i çalıştır
createMissingParts()
    .then(created => {
        if (created) {
            console.log('\n🔄 Parçalar oluşturuldu, artık teklif kaydı test edebiliriz!');
        }
    })
    .catch(error => {
        console.error('❌ Genel Hata:', error.message);
    });
