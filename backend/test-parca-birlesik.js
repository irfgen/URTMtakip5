const axios = require('axios');

// Test URL'si
const BASE_URL = 'http://localhost:5000/api/parca-birlesik';

// Test fonksiyonları
async function testTekrarliParcalar() {
  console.log('🔍 Tekrarlı parça analizi testi başlatılıyor...');
  
  try {
    const response = await axios.get(`${BASE_URL}/tekrarli-parcalar`);
    
    console.log('✅ Tekrarlı parça analizi başarılı!');
    console.log(`📊 ${response.data.data.length} adet tekrarlı grup tespit edildi`);
    
    if (response.data.data.length > 0) {
      console.log('\n📋 İlk grubun detayları:');
      const ilkGrup = response.data.data[0];
      console.log(`- Grup anahtarı: ${ilkGrup.grup_anahtari}`);
      console.log(`- Parça sayısı: ${ilkGrup.parca_sayisi}`);
      console.log('- Parçalar:');
      
      ilkGrup.parcalar.forEach((parca, index) => {
        console.log(`  ${index + 1}. ${parca.parcaKodu} - ${parca.parcaAdi}`);
        console.log(`     Stok: ${parca.stokAdeti}, Bağlı veri: ${parca.bagliVeriler.toplam}`);
      });
      
      return ilkGrup;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Tekrarlı parça analizi hatası:', error.response?.data || error.message);
    return null;
  }
}

async function testBirlestirmeOnizleme(tutulanParcaKodu, silinenParcaKodlari) {
  console.log('\n🔮 Birleştirme önizleme testi başlatılıyor...');
  
  try {
    const response = await axios.post(`${BASE_URL}/birlestirme-onizleme`, {
      tutulan_parca_kodu: tutulanParcaKodu,
      silinen_parca_kodlari: silinenParcaKodlari
    });
    
    console.log('✅ Birleştirme önizlemesi başarılı!');
    console.log('📊 Önizleme detayları:');
    console.log(`- Transfer edilecek stok: ${response.data.data.toplamlar.transfer_edilecek_stok}`);
    console.log(`- Etkilenecek kayıt: ${response.data.data.toplamlar.toplam_etkilenen_kayit}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Birleştirme önizleme hatası:', error.response?.data || error.message);
    return null;
  }
}

async function testParcaBirlestirme(tutulanParcaKodu, silinenParcaKodlari) {
  console.log('\n🔧 Parça birleştirme testi başlatılıyor...');
  console.log('⚠️  DİKKAT: Bu test gerçek veri manipülasyonu yapar!');
  
  // Güvenlik için onay iste
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Gerçekten birleştirme testini yapmak istiyor musunuz? (EVET yazın): ', async (answer) => {
      rl.close();
      
      if (answer !== 'EVET') {
        console.log('❌ Birleştirme testi iptal edildi.');
        resolve(null);
        return;
      }
      
      try {
        const response = await axios.post(`${BASE_URL}/birlestir`, {
          tutulan_parca_kodu: tutulanParcaKodu,
          silinen_parca_kodlari: silinenParcaKodlari,
          yeni_parca_bilgileri: {
            // Test için boş bırakıyoruz
          }
        });
        
        console.log('✅ Parça birleştirme başarılı!');
        console.log('📊 Birleştirme sonuçları:');
        console.log(`- Tutulan parça: ${response.data.data.tutulan_parca}`);
        console.log(`- Silinen parçalar: ${response.data.data.silinen_parcalar.join(', ')}`);
        console.log('- Transfer edilen veriler:');
        console.log(`  • İş emirleri: ${response.data.data.transfer_edilen.is_emirleri}`);
        console.log(`  • BOM kayıtları: ${response.data.data.transfer_edilen.bom_kayitlari}`);
        console.log(`  • Parça kayıtları: ${response.data.data.transfer_edilen.parca_kayitlari}`);
        console.log(`  • Stok adeti: ${response.data.data.transfer_edilen.stok_adeti}`);
        
        resolve(response.data.data);
      } catch (error) {
        console.error('❌ Parça birleştirme hatası:', error.response?.data || error.message);
        resolve(null);
      }
    });
  });
}

// Ana test fonksiyonu
async function runTests() {
  console.log('🚀 Parça Birleştirme Sistemi Test Süreci Başlatılıyor...\n');
  
  // 1. Tekrarlı parça analizi testi
  const tekrarliGrup = await testTekrarliParcalar();
  
  if (!tekrarliGrup || tekrarliGrup.parcalar.length < 2) {
    console.log('\n⚠️  Test için yeterli tekrarlı parça bulunamadı.');
    console.log('📝 Test verisi oluşturmak için manuel olarak benzer parçalar ekleyin.');
    return;
  }
  
  // Test için parça kodlarını hazırla
  const tutulanParcaKodu = tekrarliGrup.parcalar[0].parcaKodu;
  const silinenParcaKodlari = tekrarliGrup.parcalar.slice(1).map(p => p.parcaKodu);
  
  console.log(`\n📋 Test parametreleri:`);
  console.log(`- Tutulan parça: ${tutulanParcaKodu}`);
  console.log(`- Silinecek parçalar: ${silinenParcaKodlari.join(', ')}`);
  
  // 2. Birleştirme önizleme testi
  const onizleme = await testBirlestirmeOnizleme(tutulanParcaKodu, silinenParcaKodlari);
  
  if (!onizleme) {
    console.log('\n❌ Önizleme testi başarısız, birleştirme testine geçilemiyor.');
    return;
  }
  
  // 3. Birleştirme testi (opsiyonel ve tehlikeli)
  console.log('\n⚠️  Gerçek birleştirme testi tehlikeli bir işlemdir!');
  console.log('🔄 Bu test gerçek veritabanı değişiklikleri yapar.');
  
  const birlestirmeResult = await testParcaBirlestirme(tutulanParcaKodu, silinenParcaKodlari);
  
  if (birlestirmeResult) {
    console.log('\n🎉 Tüm testler başarıyla tamamlandı!');
  } else {
    console.log('\n✅ Güvenli testler tamamlandı. Birleştirme testi atlandı.');
  }
}

// Test veri oluşturma fonksiyonu
async function createTestData() {
  console.log('🛠️  Test verisi oluşturuluyor...');
  
  // Bu fonksiyon gerekirse test verisi oluşturmak için kullanılabilir
  // Şimdilik boş bırakıyoruz
  
  console.log('ℹ️  Test verisi oluşturma henüz implement edilmedi.');
  console.log('📝 Manuel olarak benzer parçalar ekleyerek test yapabilirsiniz.');
}

// Komut satırı argümanlarını kontrol et
const args = process.argv.slice(2);

if (args.includes('--create-test-data')) {
  createTestData();
} else {
  runTests();
}

module.exports = {
  testTekrarliParcalar,
  testBirlestirmeOnizleme,
  testParcaBirlestirme,
  createTestData
};