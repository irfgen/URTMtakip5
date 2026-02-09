// Maliyet debug scripti
console.log('=== Maliyet Debug Scripti ===');

// BOM detayını çek
fetch('/api/boms/109')
  .then(response => response.json())
  .then(bomData => {
    console.log('✅ BOM API Yanıtı:', bomData);
    console.log('📊 BOM adı:', bomData.name);
    console.log('📦 Parça sayısı:', bomData.items?.length || 0);

    if (bomData.items && bomData.items.length > 0) {
      const firstItem = bomData.items[0];
      console.log('🔍 İlk parça bilgileri:', {
        name: firstItem.name,
        quantity: firstItem.quantity,
        unitCostUSD: firstItem.unitCostInfo?.unitCostUSD,
        costSource: firstItem.unitCostInfo?.costDetails?.source
      });
    }

    console.log('💰 Hesaplanan maliyetler:', bomData.calculatedCosts);
  })
  .catch(error => {
    console.error('❌ BOM API Hatası:', error);
  });

// Bir parça maliyetini çek
fetch('/api/parts/KB_UST_BASKI1_001/unit-cost')
  .then(response => response.json())
  .then(costData => {
    console.log('✅ Parça maliyet API Yanıtı:', costData);
    console.log('💵 Birim maliyet:', costData.maliyetBilgileri?.birimMaliyetUSD);
    console.log('🏷️ Maliyet kaynağı:', costData.maliyetBilgileri?.maliyetKaynagi);
  })
  .catch(error => {
    console.error('❌ Parça maliyet API Hatası:', error);
  });

console.log('=== Debug Scripti Bitti ===');