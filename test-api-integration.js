#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BACKEND_URL = 'http://192.168.1.206:3000';
const FRONTEND_URL = 'http://192.168.1.206:5173';

console.log('🧪 İş Emri Malzeme Sipariş Fonksiyonalitesi Test Süiti');
console.log('='   .repeat(60));

// Test 1: Backend upload endpoint için test
async function testUploadEndpoint() {
  console.log('\n� Test 1: Sipariş dokümanı upload endpoint testi');
  
  try {
    // Create a simple test file
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, 'Bu bir test sipariş dokümanıdır.');
    
    const formData = new FormData();
    formData.append('siparis_dokumani', fs.createReadStream(testFilePath));
    formData.append('parcaKodu', 'TEST_PARCA_001');
    
    const response = await axios.post(`${BACKEND_URL}/api/upload/siparis-dokumani`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('✅ Upload endpoint çalışıyor');
    console.log('📄 Dönen response:', response.data);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    return response.data;
  } catch (error) {
    console.log('❌ Upload endpoint hatası:', error.message);
    return null;
  }
}

// Test 2: Parça bilgilerini kontrol et
async function testParcaBilgileri() {
  console.log('\n🔍 Test 2: Parça bilgileri ve malzeme alanları testi');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/parcalar`);
    const data = response.data;
    const parcalar = data.parcalar || data; // Handle different response formats
    
    if (parcalar && parcalar.length > 0) {
      const ornekParca = parcalar[0];
      console.log('✅ Parça bilgileri alındı');
      console.log('📄 Örnek parça:', {
        id: ornekParca.id,
        parcaKodu: ornekParca.parcaKodu,
        hamMalzemeCinsi: ornekParca.hamMalzemeCinsi,
        hamMalzemeOlculeri: ornekParca.hamMalzemeOlculeri
      });
      
      // Check if hamMalzemeCinsi and hamMalzemeOlculeri fields exist
      if (ornekParca.hamMalzemeCinsi !== undefined && ornekParca.hamMalzemeOlculeri !== undefined) {
        console.log('✅ Malzeme alanları mevcut');
      } else {
        console.log('⚠️  Malzeme alanları bulunamadı');
      }
      
      return ornekParca;
    } else {
      console.log('⚠️  Hiç parça bulunamadı');
      return null;
    }
  } catch (error) {
    console.log('❌ Parça bilgileri alma hatası:', error.message);
    return null;
  }
}

// Test 3: İş emri oluşturma API'si test (malzeme sipariş ile)
async function testIsEmriCreation(parca) {
  console.log('\n� Test 3: İş emri oluşturma API testi (Malzeme Sipariş ile)');
  
  if (!parca) {
    console.log('❌ Parça bilgisi olmadan iş emri oluşturulamaz');
    return null;
  }
  
  try {
    const testIsEmri = {
      is_adi: `Test İş Emri - Malzeme Sipariş - ${parca.parcaKodu}`,
      plan_liste_no: `AUTO-${Date.now()}`,
      adet: 10,
      malzeme: `${parca.hamMalzemeCinsi || 'Test Malzeme Cinsi'} / ${parca.hamMalzemeOlculeri || 'Test Malzeme Ölçüleri'}`,
      malzemesi_siparis_edilecekmi: true,
      malzeme_siparis_tarihi: '2025-05-25',
      siparis_dokumani_dosya_yolu: '/uploads/siparis_dokumanlari/test_document.txt',
      teslim_tarihi: '2025-06-01',
      durum: 'Bekliyor',
      oncelik: 'Normal',
      aciklama: 'Malzeme sipariş fonksiyonalitesi test iş emri',
      parca_kodu: parca.parcaKodu
    };
    
    const response = await axios.post(`${BACKEND_URL}/api/is-emirleri`, testIsEmri);
    
    console.log('✅ İş emri oluşturma API\'si çalışıyor');
    console.log('� Oluşturulan iş emri:', {
      id: response.data.is_emri_id,
      no: response.data.is_emri_no,
      adi: response.data.is_adi,
      parcaKodu: response.data.parca_kodu
    });
    
    return response.data;
  } catch (error) {
    console.log('❌ İş emri oluşturma hatası:', error.message);
    if (error.response) {
      console.log('📄 Hata detayı:', error.response.data);
    }
    return null;
  }
}

// Test 4: Frontend bileşen kontrolü
async function testFrontendComponent() {
  console.log('\n�️  Test 4: Frontend bileşen kontrolü');
  
  try {
    // Check if frontend is accessible
    const response = await axios.get(FRONTEND_URL);
    console.log('✅ Frontend erişilebilir');
    
    // Note: Gerçek DOM test için browser automation gerekli
    // Bu test sadece frontend'in çalıştığını kontrol eder
    console.log('📝 Not: Detaylı UI testi için tarayıcıda manuel kontrol gerekli');
    console.log(`🔗 Test URL: ${FRONTEND_URL}/#/mobile/parcalar`);
    
    return true;
  } catch (error) {
    console.log('❌ Frontend erişim hatası:', error.message);
    return false;
  }
}

// Ana test fonksiyonu
async function runTests() {
  console.log('� Testler başlatılıyor...\n');
  
  const results = {};
  
  // Test 1: Upload endpoint
  results.upload = await testUploadEndpoint();
  
  // Test 2: Parça bilgileri
  results.parca = await testParcaBilgileri();
  
  // Test 3: İş emri oluşturma (parça bilgisini kullanarak)
  results.isEmri = await testIsEmriCreation(results.parca);
  
  // Test 4: Frontend
  results.frontend = await testFrontendComponent();
  
  // Sonuçları özetle
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SONUÇLARI');
  console.log('='.repeat(60));
  
  console.log(`📤 Upload Endpoint: ${results.upload ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`🔍 Parça Bilgileri: ${results.parca ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`📝 İş Emri Oluşturma: ${results.isEmri ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`🖥️  Frontend: ${results.frontend ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Genel Başarı Oranı: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('🎉 Tüm testler başarıyla geçti!');
    console.log(`\n📱 Mobil uygulamayı test etmek için: ${FRONTEND_URL}/#/mobile/parcalar`);
    if (results.parca) {
      console.log(`🔗 Direkt parça detayı: ${FRONTEND_URL}/#/mobile/parcalar/${results.parca.parcaKodu}`);
    }
  } else {
    console.log('⚠️  Bazı testler başarısız oldu. Lütfen hataları kontrol edin.');
  }
}

// Test suite'i çalıştır
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testUploadEndpoint,
  testParcaBilgileri,
  testIsEmriCreation,
  testFrontendComponent,
  runTests
};
