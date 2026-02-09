/**
 * Maliyet Sistemi Entegrasyon Testleri
 * API endpoint'lerinin ve veritabanı bağlantılarının doğruluğunu test eder
 */

const axios = require('axios');
const { sequelize } = require('../config/database');
const { calculatePartUnitCost } = require('./costConfig');

// Test konfigürasyonu
const API_BASE_URL = 'http://localhost:5000/api';

// Test verisi - gerçek parça kullanımı için
const testParcaKodu = 'TEST-PARCA-001';

// Entegrasyon test fonksiyonları
async function testParcaBirimMaliyetEndpoint() {
  console.log('\n🧪 Parça Birim Maliyet Endpoint Testi');
  console.log('=' * 50);

  try {
    // Önce test parçasını oluştur veya bul
    console.log('🔍 Test parçası aranıyor...');

    const response = await axios.get(`${API_BASE_URL}/parts/${testParcaKodu}/unit-cost`);

    console.log('✅ API Yanıtı Başarılı:');
    console.log(`📋 Parça Kodu: ${response.data.parcaKodu}`);
    console.log(`📋 Parça Adı: ${response.data.parcaAdi}`);
    console.log(`📋 İmal Mi: ${response.data.imalMi ? 'Evet' : 'Hayır'}`);

    const maliyetBilgileri = response.data.maliyetBilgileri;
    console.log(`💰 Birim Maliyet: $${maliyetBilgileri.birimMaliyetUSD}`);
    console.log(`🪙 TL Karşılığı: ₺${maliyetBilgileri.birimMaliyetTRY}`);
    console.log(`🏷️  Maliyet Kaynağı: ${maliyetBilgileri.maliyetKaynagi}`);
    console.log(`📝 Maliyet Tipi: ${maliyetBilgileri.maliyetTipi}`);

    const parcaDetaylari = response.data.parcaDetaylari;
    console.log('\n📊 Parça Detayları:');
    console.log(`   Tedarik Bedeli: $${parcaDetaylari.tedarikBedeli || 0}`);
    console.log(`   Şirket İçi Maliyeti: $${parcaDetaylari.sirketIciMaliyeti || 0}`);
    console.log(`   Fason Maliyeti: $${parcaDetaylari.fasonMaliyeti || 0}`);
    console.log(`   CNC İşleme Süresi: ${parcaDetaylari.cncIslemeSuresi || 0} dk`);

    return true;
  } catch (error) {
    console.log('❌ API Testi Başarısız:');
    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Hata Mesajı: ${error.response.data.message || error.response.data.error}`);
    } else if (error.request) {
      console.log('   Sunucuya ulaşılamadı. Backend çalışıyor mu?');
      console.log(`   Hata: ${error.message}`);
    } else {
      console.log(`   Hata: ${error.message}`);
    }
    return false;
  }
}

async function testBOMDetayEndpoint() {
  console.log('\n🧪 BOM Detay Endpoint Testi');
  console.log('=' * 50);

  try {
    // Test BOM'u bul
    console.log('🔍 Test BOM\'u aranıyor...');

    // Önce BOM listesini al
    const bomListResponse = await axios.get(`${API_BASE_URL}/boms?limit=5`);

    if (bomListResponse.data.length === 0) {
      console.log('⚠️  Test için BOM bulunamadı. Lütfen önce bir BOM oluşturun.');
      return false;
    }

    const testBOM = bomListResponse.data[0];
    console.log(`📋 Test BOM: ${testBOM.name} (ID: ${testBOM.id})`);

    // BOM detayını al
    const bomDetailResponse = await axios.get(`${API_BASE_URL}/boms/${testBOM.id}`);

    console.log('✅ BOM Detay API Yanıtı Başarılı:');
    console.log(`📋 BOM Adı: ${bomDetailResponse.data.name}`);
    console.log(`📋 BOM Kodu: ${bomDetailResponse.data.bom_kodu}`);

    const items = bomDetailResponse.data.items || [];
    console.log(`📦 Parça Sayısı: ${items.length}`);

    if (items.length > 0) {
      console.log('\n📊 Parça Maliyetleri:');
      items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}`);
        if (item.unitCostInfo) {
          console.log(`      Birim Maliyet: $${item.unitCostInfo.unitCostUSD.toFixed(2)}`);
          console.log(`      Maliyet Kaynağı: ${item.unitCostInfo.costDetails.source || 'Bilinmiyor'}`);
          console.log(`      Toplam Maliyet: $${item.totalCostInfo.totalCostUSD.toFixed(2)} (Miktar: ${item.quantity})`);
        } else {
          console.log('      Maliyet bilgisi bulunamadı');
        }
      });
    }

    const calculatedCosts = bomDetailResponse.data.calculatedCosts;
    if (calculatedCosts) {
      console.log('\n💰 BOM Toplam Maliyetleri:');
      console.log(`   İmalat Maliyeti: $${calculatedCosts.totalManufacturingCost.toFixed(2)}`);
      console.log(`   Tedarik Maliyeti: $${calculatedCosts.totalProcurementCost.toFixed(2)}`);
      console.log(`   Genel Toplam: $${calculatedCosts.totalCost.toFixed(2)}`);
    }

    return true;
  } catch (error) {
    console.log('❌ BOM API Testi Başarısız:');
    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Hata Mesajı: ${error.response.data.message || error.response.data.error}`);
    } else if (error.request) {
      console.log('   Sunucuya ulaşılamadı. Backend çalışıyor mu?');
      console.log(`   Hata: ${error.message}`);
    } else {
      console.log(`   Hata: ${error.message}`);
    }
    return false;
  }
}

async function testVeritabaniBaglantisi() {
  console.log('\n🧪 Veritabanı Bağlantı Testi');
  console.log('=' * 50);

  try {
    // Veritabanı bağlantısını test et
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı');

    // Parça tablosunu test et
    const [results, metadata] = await sequelize.query(`
      SELECT COUNT(*) as totalParcalar FROM parcalar LIMIT 1
    `);

    console.log(`📊 Veritabanı İstatistikleri:`);
    console.log(`   Toplam Parça Sayısı: ${results[0].totalParcalar}`);

    // Maliyet hesaplama fonksiyonunu veritabanı verisiyle test et
    const [parcaTest] = await sequelize.query(`
      SELECT parca_kodu, parca_adi, imalMi, tedarikBedeli, sirketIciMaliyeti, fasonMaliyeti
      FROM parcalar
      WHERE parca_kodu IS NOT NULL
      LIMIT 1
    `);

    if (parcaTest.length > 0) {
      const parca = parcaTest[0];
      console.log(`\n🧪 Veritabanı Maliyet Hesaplama Testi:`);
      console.log(`   Test Parçası: ${parca.parca_kodu} - ${parca.parca_adi}`);

      const maliyetSonucu = calculatePartUnitCost(parca);
      console.log(`   Hesaplanan Birim Maliyet: $${maliyetSonucu.unitCostUSD.toFixed(2)}`);
      console.log(`   Maliyet Kaynağı: ${maliyetSonucu.costDetails.source || 'Bilinmiyor'}`);
    }

    return true;
  } catch (error) {
    console.log('❌ Veritabanı Testi Başarısız:');
    console.log(`   Hata: ${error.message}`);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('🚀 Maliyet Sistemi Entegrasyon Testleri Başlıyor...\n');
  console.log('=' * 60);
  console.log('⚠️  ÖNEMLİ: Bu testlerin çalışması için backend sunucusunun çalışıyor olması gerekli!');
  console.log('⚠️  Başlatmak için: cd backend && npm run dev');
  console.log('=' * 60);

  let basariliTestSayisi = 0;
  let toplamTestSayisi = 3;

  // Test 1: Veritabanı bağlantısı
  console.log('\n📋 TEST 1/3: Veritabanı Bağlantısı');
  if (await testVeritabaniBaglantisi()) {
    basariliTestSayisi++;
  }

  // Test 2: Parça birim maliyet endpoint
  console.log('\n📋 TEST 2/3: Parça Birim Maliyet API');
  if (await testParcaBirimMaliyetEndpoint()) {
    basariliTestSayisi++;
  }

  // Test 3: BOM detay endpoint
  console.log('\n📋 TEST 3/3: BOM Detay API');
  if (await testBOMDetayEndpoint()) {
    basariliTestSayisi++;
  }

  // Sonuç özeti
  console.log('\n' + '=' * 60);
  console.log('📊 ENTEGRASYON TEST SONUÇLARI');
  console.log('=' * 60);
  console.log(`✅ Başarılı Test Sayısı: ${basariliTestSayisi}`);
  console.log(`❌ Başarısız Test Sayısı: ${toplamTestSayisi - basariliTestSayisi}`);
  console.log(`📈 Başarı Oranı: %${((basariliTestSayisi / toplamTestSayisi) * 100).toFixed(1)}`);

  if (basariliTestSayisi === toplamTestSayisi) {
    console.log('\n🎉 TÜM ENTEGRASYON TESTLERİ BAŞARILI! Sistem hazır.');
  } else {
    console.log('\n⚠️  DİKKAT! Bazı entegrasyon testleri başarısız oldu.');
    console.log('Lütfen sistem durumunu kontrol edin ve eksiklikleri giderin.');
  }

  console.log('\n' + '=' * 60);

  // Veritabanı bağlantısını kapat
  if (sequelize) {
    await sequelize.close();
  }
}

// Testleri çalıştır
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

module.exports = {
  runIntegrationTests,
  testParcaBirimMaliyetEndpoint,
  testBOMDetayEndpoint,
  testVeritabaniBaglantisi
};