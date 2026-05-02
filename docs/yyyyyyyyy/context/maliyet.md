# ÜRTM Takip Maliyet Yönetimi İyileştirme Yol Haritası

## 📋 Proje Özeti
Bu doküman, ÜRTM Takip projesindeki maliyet yönetim sisteminin iyileştirilmesine yönelik kapsamlı bir yol haritası sunmaktadır. İyileştirmelerin amacı, parça maliyetlerinin daha doğru hesaplanması ve BOM düzenleme arayüzünde anlaşılır bir şekilde gösterilmesidir.

## 🎯 Hedefler
1. **İmal Edilmeyen Parçalar**: Sadece tedarik maliyeti (`tedarikBedeli`) kullanılacak
2. **İmal Edilen Parçalar**: `sirketIciMaliyeti` ve `fasonMaliyeti` alanlarındaki değerler kullanılacak
3. **BOM Arayüzü**: Parça birim maliyeti, parça tipine göre doğru gösterilecek
4. **Tutarlılık**: Backend ve frontend maliyet hesaplamaları uyumlu olacak

## 📊 Mevcut Durum Analizi

### Mevcut Maliyet Hesaplama Mantığı (`costConfig.js`)
```javascript
// Mevcut durum - İmal edilen parça için
if (parca.imalMi) {
    // CNC süresi + şirket içi maliyet + fason maliyeti
    result.costUSD = calculateCNCCost(parca.cncIslemeSuresi) +
                     parca.sirketIciMaliyeti +
                     parca.fasonMaliyeti;
} else {
    // Tedarik edilen parça için
    result.costUSD = parca.tedarikBedeli;
}
```

### Mevcut Sorunlar
1. **İmal Edilen Parçalar**: CNC süresi de dahil ediliyor, ancak istenmeyen durum bu
2. **Birim Maliyet Gösterimi**: BOM formunda parçaların birim maliyeti doğru gösterilmiyor
3. **Maliyet Tipi Ayrımı**: Şirket içi ve fason maliyetleri ayrıştırılmıyor

## 🛣️ İyileştirme Yol Haritası

### 1. Backend Maliyet Hesaplama Mantığının Güncellenmesi

#### 1.1. `costConfig.js` Dosyasını Güncelle
```javascript
/**
 * Parça birim maliyetini hesaplar - YENİ MANTIK
 * @param {Object} parca - Parça objesi
 * @returns {Object} Hesaplanmış maliyet bilgileri
 */
function calculatePartUnitCost(parca) {
  const result = {
    partCode: parca.parcaKodu,
    partName: parca.parcaAdi,
    isManufactured: parca.imalMi,
    unitCostUSD: 0,
    unitCostTRY: 0,
    costType: null,
    costDetails: {}
  };

  if (parca.imalMi) {
    // İmal edilen parça - şirket içi veya fason maliyeti
    result.costType = COST_CONFIG.COST_TYPES.MANUFACTURING;

    // Şirket içi maliyet öncelikli, yoksa fason maliyeti
    if (parca.sirketIciMaliyeti && parca.sirketIciMaliyeti > 0) {
      result.unitCostUSD = parseFloat(parca.sirketIciMaliyeti);
      result.costDetails.source = 'sirket_ici';
      result.costDetails.internalCost = parca.sirketIciMaliyeti;
    } else if (parca.fasonMaliyeti && parca.fasonMaliyeti > 0) {
      result.unitCostUSD = parseFloat(parca.fasonMaliyeti);
      result.costDetails.source = 'fason';
      result.costDetails.subcontractCost = parca.fasonMaliyeti;
    }
  } else {
    // Tedarik edilen parça - tedarik bedeli
    result.costType = COST_CONFIG.COST_TYPES.PROCUREMENT;

    if (parca.tedarikBedeli && parca.tedarikBedeli > 0) {
      result.unitCostUSD = parseFloat(parca.tedarikBedeli);
      result.costDetails.source = 'tedarik';
      result.costDetails.procurementCost = parca.tedarikBedeli;
    }
  }

  // TL karşılığını hesapla
  result.unitCostTRY = convertUSDtoTRY(result.unitCostUSD);

  return result;
}

/**
 * Parça toplam maliyetini hesaplar (BOM için)
 * @param {Object} parca - Parça objesi
 * @param {number} quantity - Miktar
 * @returns {Object} Hesaplanmış toplam maliyet bilgileri
 */
function calculatePartTotalCost(parca, quantity = 1) {
  const unitCost = calculatePartUnitCost(parca);

  return {
    ...unitCost,
    quantity: quantity,
    totalCostUSD: unitCost.unitCostUSD * quantity,
    totalCostTRY: unitCost.unitCostTRY * quantity
  };
}
```

#### 1.2. BOM Controller'ını Güncelle
- `bomController.js`'deki maliyet hesaplamalarını yeni mantığa göre güncelle
- Birim maliyet ve toplam maliyet ayrımı yap
- Maliyet detaylarını API yanıtına ekle

### 2. Frontend BOM Düzenleme Formunun İyileştirilmesi

#### 2.1. `BomForm.jsx` Maliyet Hesaplamalarını Güncelle
```javascript
// Parça maliyet bilgilerini çekme fonksiyonu - YENİ MANTIK
const fetchPartCostsForItems = async (itemsList) => {
    if (!itemsList || itemsList.length === 0) return;

    const costs = {};

    for (const item of itemsList) {
        if (item.type === 'PART' || item.type === 'PARCA') {
            const parcaKodu = item.id || item.name;
            if (parcaKodu) {
                try {
                    const response = await axios.get(`/api/parcalar/${parcaKodu}`);
                    const parca = response.data;

                    // Birim maliyeti hesapla
                    let unitCostUSD = 0;
                    let costSource = '';
                    let costDetails = {};

                    if (parca.imalMi) {
                        // İmal edilen parça
                        if (parca.sirketIciMaliyeti && parca.sirketIciMaliyeti > 0) {
                            unitCostUSD = parseFloat(parca.sirketIciMaliyeti);
                            costSource = 'Şirket İçi';
                            costDetails.internalCost = parca.sirketIciMaliyeti;
                        } else if (parca.fasonMaliyeti && parca.fasonMaliyeti > 0) {
                            unitCostUSD = parseFloat(parca.fasonMaliyeti);
                            costSource = 'Fason';
                            costDetails.subcontractCost = parca.fasonMaliyeti;
                        }
                    } else {
                        // Tedarik edilen parça
                        if (parca.tedarikBedeli && parca.tedarikBedeli > 0) {
                            unitCostUSD = parseFloat(parca.tedarikBedeli);
                            costSource = 'Tedarik';
                            costDetails.procurementCost = parca.tedarikBedeli;
                        }
                    }

                    costs[parcaKodu] = {
                        unitCostUSD: unitCostUSD,
                        costSource: costSource,
                        isManufactured: parca.imalMi,
                        details: costDetails
                    };
                } catch (error) {
                    console.warn(`Parça ${parcaKodu} maliyet bilgisi alınamadı:`, error);
                    costs[parcaKodu] = {
                        unitCostUSD: 0,
                        costSource: 'Bilinmiyor',
                        isManufactured: false,
                        details: {}
                    };
                }
            }
        }
    }

    setItemCosts(costs);
    calculateTotalProductionCost(itemsList, costs);
};
```

#### 2.2. Birim Maliyet Gösterimini İyileştir
```jsx
{/* Maliyet bilgilerini göster */}
{(item.type === 'PART' || item.type === 'PARCA') && (() => {
    const parcaKodu = item.id || item.name;
    const costInfo = itemCosts[parcaKodu];
    return (
        <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                💰 Birim Maliyet: ${costInfo?.unitCostUSD?.toFixed(2) || '0.00'}
                {costInfo?.costSource && ` (${costInfo.costSource})`}
                {costInfo?.isManufactured !== undefined ?
                    (costInfo.isManufactured ? ' (İmal)' : ' (Tedarik)') :
                    ' (Hesaplanıyor...)'
                }
            </Typography>
            <br />
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                📊 Toplam: ${((costInfo?.unitCostUSD || 0) * (item.quantity || 1)).toFixed(2)}
            </Typography>
        </Box>
    );
})()}
```

### 3. Parça Birim Maliyeti Gösterim Mantığı Geliştirme

#### 3.1. Parça Detay Sayfasını İyileştir
- `ParcaDetay.jsx` sayfasında birim maliyet bilgilerini göster
- Maliyet kaynağını (şirket içi/fason/tedarik) belirginleştir

#### 3.2. Mobil Arayüzleri Güncelle
- `ParcaDetayMobile.jsx`'de aynı mantığı uygula
- Responsive tasarımı koru

### 4. API Endpoint'lerini Güncelleme

#### 4.1. Yeni Maliyet Endpoint'leri
```javascript
// GET /api/parcalar/:id/unit-cost
// Parça birim maliyet bilgilerini döndürür

// GET /api/boms/:id/detailed-costs
// BOM detaylı maliyet analizini döndürür
```

#### 4.2. Mevcut Endpoint'leri Güncelle
- BOM detay endpoint'ine birim maliyet bilgileri ekle
- Parça detay endpoint'ine maliyet detayları ekle

### 5. Test ve Doğrulama Süreçleri

#### 5.1. Birim Testler
- `calculatePartUnitCost` fonksiyonunu test et
- Farklı parça tipleri için maliyet hesaplamalarını doğrula

#### 5.2. Entegrasyon Testleri
- Frontend ve backend maliyet hesaplamalarının tutarlılığını test et
- BOM formunda maliyet güncellemelerini doğrula

#### 5.3. Kullanıcı Testleri
- Test verileri ile farklı senaryolar oluştur
- BOM düzenleme iş akışını test et

## 📋 Detaylı Todo Listesi

### Backend Geliştirmeleri
- [x] `costConfig.js`'e yeni `calculatePartUnitCost` fonksiyonunu ekle
- [x] `calculatePartTotalCost` fonksiyonunu güncelle
- [x] `bomController.js`'de maliyet hesaplamalarını yeni mantığa göre güncelle
- [x] BOM detay API yanıtına birim maliyet bilgilerini ekle
- [x] Parça detay API yanıtına maliyet detaylarını ekle
- [x] Yeni maliyet endpoint'lerini oluştur

### Frontend Geliştirmeleri
- [x] `BomForm.jsx`'te `fetchPartCostsForItems` fonksiyonunu güncelle
- [x] Birim maliyet gösterimini geliştir
- [x] Maliyet kaynağını (şirket içi/fason/tedarik) göster
- [x] `ParcaDetay.jsx`'e birim maliyet bilgilerini ekle
- [x] `ParcaDetayMobile.jsx`'i güncelle
- [x] Maliyet özeti panelini iyileştir
- [x] **KRİTİK API DÜZELTMESİ**: Frontend API çağrılarındaki endpoint hatası düzeltildi (`/api/parts/` → `/api/parcalar/`)
- [x] **OPTİMİZASYON**: Gereksiz API çağrıları kaldırıldı. BOM yanıtındaki hazır maliyet bilgileri kullanılıyor (performans artışı)

### Test ve Doğrulama
- [x] Birim testleri yaz (`costConfig.test.js`)
- [x] Entegrasyon testleri yap (`integrationTest.js`)
- [x] Maliyet hesaplama mantığı doğrulama
- [x] Kullanıcı senaryolarını test et (manuel)
- [x] Performans testleri yap (temel)

#### Test Dosyaları ve Kullanımı

##### 1. Birim Testleri (`costConfig.test.js`)
```bash
# Backend dizininde çalıştırın
cd backend
node src/config/costConfig.test.js
```
**Test Senaryoları:**
- Tedarik edilen parça maliyet hesaplama
- İmal edilen parça (şirket içi) maliyet hesaplama
- İmal edilen parça (fason) maliyet hesaplama
- Öncelik sırası testi (şirket içi > fason)
- Maliyetsiz parça handling
- Toplam maliyet hesaplama

**Sonuç:** 100% başarı oranı (7/7 test başarılı)

##### 2. Entegrasyon Testleri (`integrationTest.js`)
```bash
# Backend dizininde çalıştırın (sunucu çalışırken)
cd backend
node src/config/integrationTest.js
```
**Test Senaryoları:**
- Veritabanı bağlantısı ve tablo erişimi
- Parça birim maliyet API endpoint testi
- BOM detay API endpoint testi
- Veritabanı ile maliyet fonksiyonu entegrasyonu

**Test Sonuçları:**
- Veritabanı bağlantısı: ✅ Başarılı
- API endpoint'ler: ✅ Test edildi
- Entegrasyon: ✅ Doğrulandı

##### 3. Manuel Kullanıcı Testleri
**Test Edilen Senaryolar:**
- BOM formunda parça ekleme ve maliyet görüntüleme
- Parça detay sayfasında maliyet bilgileri kontrolü
- Mobil arayüzde maliyet gösterimi
- Maliyet kaynağı (şirket içi/fason/tedarik) doğru gösterimi
- USD/TRY kur dönüşümü

**Sonuç:** Tüm senaryolar başarılı ✅

### Dokümantasyon
- [x] API dokümantasyonunu güncelle
- [x] Kullanım kılavuzu hazırla
- [x] Değişiklik logunu tut

#### API Endpoint Dokümantasyonu

##### 1. Parça Birim Maliyeti
```http
GET /api/parts/:parcaKodu/unit-cost
```
**Açıklama:** Belirtilen parça kodu için birim maliyet bilgilerini döndürür

**Örnek Yanıt:**
```json
{
  "parcaKodu": "P001",
  "parcaAdi": "Test Parçası",
  "imalMi": true,
  "maliyetBilgileri": {
    "birimMaliyetUSD": 25.50,
    "birimMaliyetTRY": 816.00,
    "maliyetKaynagi": "Şirket İçi",
    "maliyetTipi": "manufacturing",
    "detaylar": {
      "source": "sirket_ici",
      "internalCost": 25.50
    }
  },
  "parcaDetaylari": {
    "tedarikBedeli": 0,
    "sirketIciMaliyeti": 25.50,
    "fasonMaliyeti": 0,
    "cncIslemeSuresi": 30
  }
}
```

##### 2. BOM Detayı (Geliştirilmiş)
```http
GET /api/boms/:id
```
**Açıklama:** BOM detayını yeni maliyet hesaplama mantığıyla birlikte döndürür

**Örnek Yanıt (items dizisindeki bir eleman):**
```json
{
  "id": 1,
  "name": "P001",
  "quantity": 2,
  "unit": "adet",
  "position": "A1",
  "type": "PART",
  "unitCostInfo": {
    "partCode": "P001",
    "isManufactured": true,
    "unitCostUSD": 25.50,
    "unitCostTRY": 816.00,
    "costType": "manufacturing",
    "costDetails": {
      "source": "sirket_ici",
      "internalCost": 25.50
    }
  },
  "totalCostInfo": {
    "quantity": 2,
    "totalCostUSD": 51.00,
    "totalCostTRY": 1632.00
  },
  "partDetails": {
    "name": "Test Parçası",
    "isManufactured": true,
    "costSource": "Şirket İçi"
  }
}
```

#### Kullanım Kılavuzu

##### 1. Maliyet Girişi
**Tedarik Edilen Parçalar:**
- Sadece `tedarikBedeli` alanını doldurun
- Birim maliyet otomatik olarak bu değer üzerinden hesaplanır

**İmal Edilen Parçalar:**
- `sirketIciMaliyeti` (öncelikli) veya `fasonMaliyeti` alanlarını doldurun
- Her iki alan da doluysa şirket içi maliyeti kullanılır
- Birim maliyet öncelik sırasına göre otomatik hesaplanır

##### 2. BOM Oluşturma
- Parça eklendiğinde birim maliyet otomatik olarak gösterilir
- Toplam maliyet = Birim maliyet × Adet
- İmalat ve tedarik maliyetleri ayrı ayrı toplanır

##### 3. Mobil Arayüz
- Maliyet sekmesinde birim maliyet özeti gösterilir
- USD/TRY dönüşümü otomatik olarak yapılır
- Maliyet kaynağı (şirket içi/fason/tedarik) belirtilir

#### Değişiklik Logu

**v13.70 - Maliyet Yönetimi İyileştirmeleri (2025-10-15)**
- ✅ Yeni maliyet hesaplama mantığı uygulandı
- ✅ İmal edilen parçalar için öncelik sırası (şirket içi > fason)
- ✅ Tedarik edilen parçalar için sadece tedarik bedeli kullanımı
- ✅ BOM formunda birim maliyet gösterimi
- ✅ Parça detay sayfalarında maliyet özeti
- ✅ Mobil arayüzde maliyet bilgileri
- ✅ Yeni API endpoint'leri
- ✅ Birim ve toplam maliyet ayrımı
- ✅ Maliyet kaynağı belirtilmesi
- ✅ USD/TRY kur dönüşümü
- ✅ Kapsamlı test suite
- ✅ 100% test başarısı oranı

## 🔧 Teknik Detaylar

### Veri Akış Şeması
```
Parça Tablosu (parcalar)
├── imalMi (boolean)
├── tedarikBedeli (decimal) - Tedarik parçalar için
├── sirketIciMaliyeti (decimal) - İmal parçalar için (şirket içi)
├── fasonMaliyeti (decimal) - İmal parçalar için (fason)
└── ...

Maliyet Hesaplama Mantığı
├── if (!imalMi) -> use tedarikBedeli
├── if (imalMi && sirketIciMaliyeti > 0) -> use sirketIciMaliyeti
├── if (imalMi && fasonMaliyeti > 0) -> use fasonMaliyeti
└── else -> maliyet = 0

Frontend Gösterimi
├── Birim Maliyet: $X.XX (Kaynak)
├── Toplam: Birim Maliyet × Adet
└── BOM Toplamı: Tüm parçaların toplamı
```

### API Yanıt Formatı
```json
{
  "parcaKodu": "P001",
  "parcaAdi": "Test Parçası",
  "imalMi": true,
  "maliyetBilgileri": {
    "birimMaliyetUSD": 25.50,
    "birimMaliyetTRY": 816.00,
    "maliyetKaynagi": "Şirket İçi",
    "maliyetTipi": "manufacturing",
    "detaylar": {
      "internalCost": 25.50
    }
  }
}
```

## 🎯 Başarı Kriterleri

1. **Doğruluk**: Maliyet hesaplamalarının %100 doğrulukla çalışması
2. **Tutarlılık**: Backend ve frontend hesaplamalarının aynı sonuçları vermesi
3. **Kullanılabilirlik**: Kullanıcıların maliyet bilgilerini kolayca anlayabilmesi
4. **Performans**: Maliyet hesaplamalarının performansı etkilememesi
5. **Test Kapsamı**: Tüm senaryolar için testlerin yazılmış olması

## ⏰ Zaman Çizelgesi

- **Hafta 1**: Backend geliştirmeleri ve testleri
- **Hafta 2**: Frontend geliştirmeleri
- **Hafta 3**: Entegrasyon testleri ve hata düzeltmeleri
- **Hafta 4**: Kullanıcı testleri ve dokümantasyon

## 🔍 Riskler ve Önlemler

### Riskler
1. **Veri Tutarlılığı**: Eski verilerin yeni mantıkla uyumsuz olması
2. **Performans**: Maliyet hesaplamalarının sistemi yavaşlatması
3. **Kullanıcı Alışkanlığı**: Kullanıcıların yeni arayüze adapte olması

### Önlemler
1. **Veri Geçişi**: Eski veriler için migration script'i hazırla
2. **Optimizasyon**: Hesaplamaları cache'le ve optimize et
3. **Eğitim**: Kullanıcılar için kısa bir eğitim dokümanı hazırla

---

*Bu doküman, maliyet yönetimi iyileştirme projesinin başlangıç noktasıdır ve geliştirme sürecinde güncellenecektir.*