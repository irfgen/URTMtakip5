// Image URL Test Utility
// Bu dosya görsel URL'lerinin doğruluğunu test etmek için kullanılır

/**
 * Görsel URL'sinin geçerliliğini test eder
 * @param {string} url Test edilecek URL
 * @returns {Promise<boolean>} URL geçerli mi?
 */
export const testImageURL = (url) => {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string') {
      console.warn('Geçersiz URL formatı:', url);
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => {
      console.warn('Görsel yüklenemedi:', url);
      resolve(false);
    };
    img.src = url;
  });
};

/**
 * Verilen görsellerin tümünü test eder
 * @param {Record<string, string>} imageMap Görsel URL'lerinin bulunduğu nesne
 * @returns {Promise<Record<string, boolean>>} Her görsel için sonuç
 */
export const bulkTestImages = async (imageMap) => {
  const results = {};

  const entries = Object.entries(imageMap);
  console.log(`${entries.length} adet görsel test ediliyor...`);

  for (const [key, url] of entries) {
    results[key] = await testImageURL(url);
  }

  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`Test sonuçları: ${successCount}/${entries.length} başarılı`);

  return results;
};

/**
 * İş emirleri için görsel test fonksiyonu
 * @param {Array} isEmirleri İş emirleri dizisi 
 * @param {Record<string, string>} parcaGorselleri Görsel haritası
 */
export const testIsEmriImages = async (isEmirleri, parcaGorselleri) => {
  if (!isEmirleri?.length) {
    console.warn('Test edilecek iş emri bulunamadı.');
    return;
  }

  const imageTests = {};
  let altPathTests = {};
  
  // Önce mevcut görselleri test et
  for (const isEmri of isEmirleri) {
    const emriId = isEmri.id || isEmri.is_emri_id;
    if (!emriId) continue;
    
    const gorselUrl = parcaGorselleri[emriId];
    if (gorselUrl) {
      imageTests[`${isEmri.is_emri_no || emriId} (Mevcut)`] = gorselUrl;
    }
    
    // Alternatif yolları da test et
    if (isEmri.parca?.parca_kodu) {
      const parcaKodu = isEmri.parca.parca_kodu;
      altPathTests[`${isEmri.is_emri_no || emriId} (Alt1)`] = `/uploads/fotograflar/${parcaKodu}.jpg`;
      altPathTests[`${isEmri.is_emri_no || emriId} (Alt2)`] = `/uploads/fotograflar/${parcaKodu.replace(/[^a-zA-Z0-9]/g, '')}.jpg`;
    }
  }
  
  console.group('Parça Görselleri Test Sonuçları');
  console.log('Mevcut Görseller:');
  const currentResults = await bulkTestImages(imageTests);
  
  console.log('\nAlternatif Görsel Yolları:');
  const altResults = await bulkTestImages(altPathTests);
  console.groupEnd();
  
  return {
    currentResults,
    altResults
  };
};

// Tarayıcı ortamında global olarak kullanılabilir yap
if (typeof window !== 'undefined') {
  window.imageTestUtils = {
    testImageURL,
    bulkTestImages,
    testIsEmriImages
  };
}

export default {
  testImageURL,
  bulkTestImages,
  testIsEmriImages
};
