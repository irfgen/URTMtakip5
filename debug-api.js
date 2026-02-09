// Debug script to compare API responses between endpoints
// Run this in browser console on http://localhost:5173/

async function debugAPIResponses() {
  console.log('🔍 API Debug: Tezgah İş Planı vs İş Emirleri Karşılaştırması');

  try {
    // Test 1: Tezgah İş Planı API
    console.log('\n📊 Test 1: Tezgah İş Planı API (/api/tezgah-is-plani)');
    console.time('Tezgah İş Planı API');

    const tezgahResponse = await fetch('/api/tezgah-is-plani');
    const tezgahData = await tezgahResponse.json();

    console.timeEnd('Tezgah İş Planı API');
    console.log('Status:', tezgahResponse.status);
    console.log('Total iş emri:', Object.values(tezgahData.data || {}).flat().length);
    console.log('BEKLEMEDE iş emri:', tezgahData.data?.BEKLEMEDE?.length || 0);

    if (tezgahData.data?.BEKLEMEDE?.length > 0) {
      console.log('İlk 5 BEKLEMEDE iş emri:');
      tezgahData.data.BEKLEMEDE.slice(0, 5).forEach((isemri, index) => {
        console.log(`  ${index + 1}. ${isemri.is_emri_no} - ${isemri.is_adi} - Durum: ${isemri.durum}`);
      });
    }

    // Test 2: İş Emirleri API (Beklemede filtresi ile)
    console.log('\n📊 Test 2: İş Emirleri API (/api/is-emirleri?durum=beklemede)');
    console.time('İş Emirleri API');

    const isEmirleriResponse = await fetch('/api/is-emirleri?durum=beklemede');
    const isEmirleriData = await isEmirleriResponse.json();

    console.timeEnd('İş Emirleri API');
    console.log('Status:', isEmirleriResponse.status);
    console.log('Total iş emri:', isEmirleriData.length || 0);

    if (isEmirleriData.length > 0) {
      console.log('İlk 5 iş emri:');
      isEmirleriData.slice(0, 5).forEach((isemri, index) => {
        console.log(`  ${index + 1}. ${isemri.is_emri_no} - ${isemri.is_adi} - Durum: ${isemri.durum}`);
      });
    }

    // Test 3: İş Emirleri API (tüm durumlar)
    console.log('\n📊 Test 3: İş Emirleri API (tüm işler)');
    console.time('İş Emirleri API (tüm)');

    const tumIsEmirleriResponse = await fetch('/api/is-emirleri');
    const tumIsEmirleriData = await tumIsEmirleriResponse.json();

    console.timeEnd('İş Emirleri API (tüm)');
    console.log('Status:', tumIsEmirleriResponse.status);
    console.log('Total iş emri:', tumIsEmirleriData.length || 0);

    // Durum bazında gruplama
    const durumGruplari = {};
    tumIsEmirleriData.forEach(isemri => {
      const durum = isemri.durum || 'belirtilmemiş';
      if (!durumGruplari[durum]) {
        durumGruplari[durum] = [];
      }
      durumGruplari[durum].push(isemri);
    });

    console.log('\n📈 Durum Dağılımı:');
    Object.entries(durumGruplari).forEach(([durum, isler]) => {
      console.log(`  ${durum}: ${isler.length} iş`);
    });

    // Karşılaştırma
    console.log('\n🔍 Karşılaştırma Sonuçları:');
    const tezgahBeklemede = tezgahData.data?.BEKLEMEDE?.length || 0;
    const isEmirleriBeklemede = isEmirleriData.length || 0;

    console.log(`Tezgah İş Planı BEKLEMEDE: ${tezgahBeklemede}`);
    console.log(`İş Emirleri BEKLEMEDE: ${isEmirleriBeklemede}`);
    console.log(`Fark: ${Math.abs(tezgahBeklemede - isEmirleriBeklemede)}`);

    if (tezgahBeklemede !== isEmirleriBeklemede) {
      console.log('⚠️  VERİ TUTARSIZLIĞI TESPİT EDİLDİ!');

      // Detaylı analiz
      console.log('\n🔬 Detaylı Analiz:');
      const tezgahBeklemedeIDs = new Set(tezgahData.data?.BEKLEMEDE?.map(i => i.is_emri_no) || []);
      const isEmirleriBeklemedeIDs = new Set(isEmirleriData.map(i => i.is_emri_no));

      const tezgahaOzelIsler = [...tezgahBeklemedeIDs].filter(id => !isEmirleriBeklemedeIDs.has(id));
      const isEmirlerineOzelIsler = [...isEmirleriBeklemedeIDs].filter(id => !tezgahBeklemedeIDs.has(id));

      if (tezgahaOzelIsler.length > 0) {
        console.log(`Tezgah İş Planı'nda olan ama İş Emirleri'nde olmayan ${tezgahaOzelIsler.length} iş:`);
        console.log(tezgahaOzelIsler.slice(0, 10));
      }

      if (isEmirlerineOzelIsler.length > 0) {
        console.log(`İş Emirleri'nde olan ama Tezgah İş Planı'nda olmayan ${isEmirlerineOzelIsler.length} iş:`);
        console.log(isEmirlerineOzelIsler.slice(0, 10));
      }
    } else {
      console.log('✅ Veri tutarlı - her iki API aynı sonucu döndürüyor');
    }

  } catch (error) {
    console.error('❌ API test sırasında hata:', error);
  }
}

// Database direkt kontrolü
async function checkDatabaseDirectly() {
  console.log('\n🗄️  Database Kontrolü (Backend API üzerinden):');

  try {
    // Ham SQL sorgusu ile kontrol
    const response = await fetch('/api/raporlar/is-emri-ozet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Database iş emri sayıları:', data);
    } else {
      console.log('Database kontrolü başarısız:', response.status);
    }
  } catch (error) {
    console.error('Database kontrol hatası:', error);
  }
}

// Script'i çalıştır
console.log('🚀 Debug script yüklendi!');
console.log('💻 Çalıştırmak için: debugAPIResponses() veya checkDatabaseDirectly()');

window.debugAPIResponses = debugAPIResponses;
window.checkDatabaseDirectly = checkDatabaseDirectly;