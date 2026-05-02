# ÜRTM Takip - BOM (Bill of Materials) Yapısı Analizi

## Genel Bakış

ÜRTM Takip projesindeki BOM (Bill of Materials) sistemi, üretim süreçlerinde gereken malzeme listelerini yönetmek için tasarlanmış kapsamlı bir modüldür. Bu sistem, Excel'den BOM oluşturma, hiyerarşik yapı oluşturma ve maliyet hesaplama gibi özellikler sunmaktadır.

## Veritabanı Yapısı

### Ana Tablolar

#### 1. `boms` Tablosu (Ana BOM tablosu)
- **id** (INTEGER, PRIMARY KEY, AUTO_INCREMENT) - BOM ID
- **bom_kodu** (STRING(100), UNIQUE) - BOM kodu
- **name** (STRING) - BOM adı
- **bom_aciklamasi** (TEXT) - BOM açıklaması
- **versiyon** (STRING(20), default: '1.0') - Versiyon bilgisi
- **aktif** (BOOLEAN, default: true) - Aktif durumu
- **grup_tipi** (STRING(20), default: 'standard') - Grup tipi: 'standard', 'marka', 'ozel'
- **marka** (STRING(100)) - Marka bazlı gruplama için
- **ozel_etiket** (STRING(255)) - Özel etiketler
- **gorsel_ikon** (STRING(50)) - Görsel ikon
- **uretim_maliyeti**, **tedarik_maliyeti**, **tedarikci_firma** - Maliyet alanları (daha sonra eklendi)

#### 2. `bom_parcalar` Tablosu (BOM-Parça ilişki tablosu)
- **id** (INTEGER, PRIMARY KEY) - İlişki ID
- **bomId** (INTEGER, FOREIGN KEY -> boms.id) - BOM ID
- **parcaKodu** (STRING) - Parça kodu (STRING olarak saklanıyor, ID tutarsızlığı var)
- **miktar** (DECIMAL) - Miktar
- **birim** (STRING, default: 'adet') - Birim
- **pozisyon** (STRING) - Pozisyon bilgisi

#### 3. `makina_bom` Tablosu (Makina-BOM ilişki tablosu)
- **bom_id** (FOREIGN KEY -> boms.id) - BOM ID
- **makina_id** (FOREIGN KEY -> makinalar.makina_id) - Makina ID

## Backend Yapısı

### Model (backend/src/models/Bom.js)

**Önemli Özellikler:**
- BOM modeli Sequelize ile tanımlanmış
- İlişkiler: `belongsToMany` ile Makinalar tablosuna bağlanmış
- Özel metotlar ile karmaşık sorgular yönetiliyor

**Kritik Metotlar:**
1. **`getBomsByMakinaId(makinaId)`** - Makinaya ait BOM'ları getirir
   - İki farklı veri kaynağını kontrol eder:
     - `makina_bom` ara tablosu
     - `makinalar.items` JSON alanı
   - ID tutarsızlığı problemi: Makinalar UUID ID kullanıyor, BOM tablosu integer ID

2. **`getParcalarByBomId(bomId)`** - BOM'un parçalarını getirir
   - JOIN sorguları ile parça ve stok bilgilerini birleştirir
   - `LEFT JOIN` kullanarak eksik parçaları da listeler

3. **`transformToGroupFormat(bom)`** - BOM'u grup formatına çevirir
   - Frontend uyumluluğu için veri formatını düzenler

### Controller (backend/src/controllers/bomController.js)

**Ana Endpoint'ler:**
1. **`listBoms`** - BOM listesi (filtreleme ve sıralama ile)
2. **`getBomDetail`** - BOM detayı (parça ve maliyet bilgileri ile)
   - Maliyet hesaplamaları için `calculatePartUnitCost` kullanıyor
   - Her parça için detaylı maliyet analizi yapılıyor
3. **`createBom`** - Yeni BOM oluştur
4. **`updateBom`** - BOM güncelle
5. **`deleteBom`** - BOM sil
6. **`searchParts`** - Parça arama (BOM formu için)
7. **`searchBoms`** - BOM arama (BOM formu için)
8. **`getPartUnitCost`** - Parça birim maliyeti hesaplama

## Frontend Yapısı

### Ana Komponentler

#### 1. BomForm.jsx (frontend/src/components/BomForm.jsx)
- **Özellikler:**
  - Yeni BOM oluşturma ve mevcut BOM düzenleme
  - Gerçek zamanlı maliyet hesaplamaları
  - Parça ve BOM ekleme/kaldırma
  - İş emri oluşturma entegrasyonu
  - Resimli parça gösterimi

- **Durum Yönetimi:**
  - `items` - BOM içeriği
  - `bomCostData` - Maliyet bilgileri
  - `itemCosts` - Her öğenin maliyeti
  - `calculatedProductionCost` - Hesaplanan üretim maliyeti

#### 2. BomListesi.jsx
- BOM listeleme ve yönetim arayüzü
- Arama, filtreleme ve sıralama
- Düzenleme ve silme işlemleri
- Print modal entegrasyonu

#### 3. BomPrintModal.jsx
- 3x2 grid formatında BOM kartları yazdırma
- Özel CSS print stilleri
- Parça resimleri ile yazdırma

#### 4. ExceldenBomUret.jsx (Excel'den BOM Üret)
**Dosya:** /home/urtmtakip/Belgeler/URTMtakip/frontend/src/pages/yonetimsel/ExceldenBomUret.jsx

**Özellikler:**
- **Desteklenen Formatlar:** .xlsx, .xls
- **Gerekli Kolonlar:** "Parça Adı", "Adet"
- **İşlem Akışı:**
  1. Excel dosyası XLSX kütüphanesi ile okunur
  2. Türkçe karakter normalize edilir (ı→i, ç→c, ş→s, ğ→g, ü→u, ö→o)
  3. Parça adları API ile eşleştirilir
  4. Eşleşen parçaların resimleri ve bilgileri getirilir
  5. BOM olarak kaydedilir

**Kod Örneği:**
```javascript
// Excel veri işleme
const processExcelData = async (data) => {
  const header = data[0].map(h => (h || '').toString().trim().toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    // ... diğer karakter dönüşümleri
  );

  const parcaAdiIdx = header.findIndex(h => h.replace(/\s+/g, '').includes('parcaadi'));
  const adetIdx = header.findIndex(h => h.replace(/\s+/g, '').includes('adet'));

  // Parça eşleştirme
  for (let i = 1; i < data.length; i++) {
    const response = await axios.get(`/api/parcalar?aramaMetni=${encodeURIComponent(parcaAdi)}`);
    // Eşleşen parça bulunur ve listeye eklenir
  }
};
```

## Excel'den BOM Üret Özelliği

### İşlem Akışı
1. **Dosya Seçimi:** Kullanıcı Excel dosyasını seçer
2. **Kolon Tespiti:** Sistem "Parça Adı" ve "Adet" kolonlarını otomatik bulur
3. **Parça Eşleştirme:** Her parça adı için sistem veritabanında arama yapar
4. **Görsel Önizleme:** Eşleşen parçaların resimleri ve bilgileri gösterilir
5. **BOM Kaydı:** Onay ile BOM sistem olarak kaydedilir

### Güçlü Yönleri
- Türkçe karakter desteği
- Esnek kolon isimlendirme
- Resimli önizleme
- Hata toleransı (API hatası olsa bile işlem devam eder)

### Zayıf Yönleri
- Sadece "Parça Adı" ile eşleştirme yapıyor
- Başarısız eşleşmeler için geri bildirim yok
- Toplu düzeltme imkanı sunmuyor
- Manuel eşleştirme seçeneği yok

## Maliyet Yönetimi

### Maliyet Hesaplama Mantığı (backend/src/config/costConfig.js)
- **Maliyet Türleri:**
  - İmalat (manufacturing): `sirketIciMaliyeti` veya `fasonMaliyeti`
  - Tedarik (procurement): `tedarikBedeli`
  - Döviz çevrimleri (USD/TRY)

- **Hesaplama Akışı:**
  1. Parçanın tipi belirlenir (imal mı, tedarik mi)
  2. Birim maliyet hesaplanır
  3. Miktar ile çarpılarak toplam maliyet bulunur
  4. BOM toplam maliyeti agregate edilir

## BOM Hiyerarşik Yapısı

### Grup Tipleri
1. **`standard`** - Standart BOM'lar
2. **`marka`** - Marka bazlı gruplar (örn: ADVANTAGE)
3. **`ozel`** - Özel gruplar

### Makina Entegrasyonu
- Bir makina birden çok BOM ile ilişkili olabilir
- ADVANTAGE makineleri için otomatik grup oluşturma
- İki farklı ilişki yöntemi:
  1. `makina_bom` ara tablosu
  2. `makinalar.items` JSON alanı

## Tespit Edilen Sorunlar ve Problemler

### 1. Kritik Veri Tutarlılığı Sorunları

#### ID Tutarsızlığı
- **Sorun:** `bom_parcalar` tablosu `parcaKodu` string kullanıyor, ancak parça tablosu ID bazlı
- **Etkisi:** JOIN işlemlerinde performans düşüklüğü ve tutarsızlık
- **Çözüm:** `parcaKodu` yerine `parcaId` (INTEGER) kullanılmalı

#### Makinalar.items JSON Alanı
- **Sorun:** Makinalar UUID ID'ler içeriyor, BOM tablosunda integer ID'ler var
- **Etkisi:** `getBomsByMakinaId` metodunda karmaşık dönüştürme mantığı
- **Çözüm:** Tüm ID'leri aynı formata standartlaştırmak

### 2. Performans Sorunları

#### Çoklu JOIN Sorguları
- **Sorun:** BOM detayı çekerken çoklu join sorguları çalışıyor
- **Etkisi:** Büyük BOM'lar için yavaş yüklenme
- **Çözüm:** Lazy loading veya caching mekanizması

#### Maliyet Hesaplamaları
- **Sorun:** Her parça için ayrı maliyet hesaplaması yapılıyor
- **Etkisi:** Frontend'de yavaş yanıt
- **Çözüm:** Batch processing veya debouncing

### 3. Kullanıcı Deneyimi Sorunları

#### Excel Import Esnekliği
- **Sorun:** Sadece "Parça Adı" ile eşleştirme yapıyor
- **Etkisi:** Eşleşmeyen parçalar kayboluyor
- **Çözüm:** Manuel eşleştirme seçeneği eklemek

#### Hata Yönetimi
- **Sorun:** Import sırasında hatalar sessizce ignore ediliyor
- **Etkisi:** Kullanıcı eşleşmeyen parçaları göremiyor
- **Çözüm:** Hata raporu ve düzeltme imkanı

### 4. Veri Yapısı Sorunları

#### bom_parcalar Tablosu Tasarımı
- **Sorun:** `parcaKodu` string olarak saklanıyor
- **Etkisi:** Performans ve tutarsızlık sorunları
- **Çözüm:** `parcaId` integer foreign key kullanımı

#### Versiyonlama
- **Sorun:** Basit versiyon sistemi var
- **Etkisi:** Change tracking zayıf
- **Çözüm:** Comprehensive versioning ve audit trail

### 5. Excel Integration Sorunları

#### Kapsamlı Eşleştirme
- **Sorun:** Sadece parça adı ile eşleştirme
- **Etkisi:** Benzer isimli parçalarda hata
- **Çözüm:** Parça kodu, açıklama ve fuzzy search desteği

#### Hata Raporlama
- **Sorun:** Başarısız eşleşmeler hakkında bilgi yok
- **Etkisi:** Kullanıcı sonucu kontrol edemiyor
- **Çözüm:** Validation report ve correction interface

## Önerilen İyileştirmeler

### 1. Veri Yapısı İyileştirmeleri
- `bom_parcalar` tablosunda `parcaId` kullanımına geçiş
- ID standartlaştırması (tüm tablolarda aynı format)
- İlişkisel tutarlılık için constraint'ler eklenmeli

### 2. Performans Optimizasyonları
- BOM sorgularında caching mekanizması
- Sayfalama için virtual scrolling
- Maliyet hesaplamaları için debouncing

### 3. Yeni Özellikler
- BOM şablonları
- Toplu import/export
- BOM onay workflow'u
- Değişiklik tarihçesi (audit log)
- Manuel parça eşleştirme interface'i

### 4. Entegrasyonlar
- STEP_BOM_Analyzer ile daha derin entegrasyon
- CAD yazılımları ile senkronizasyon
- MRP/ERP sistem entegrasyonu

## Güvenlik ve Yetkilendirme

### Mevcut Durum
- Basic input validation (Joi)
- SQL injection koruması (Sequelize ORM)
- File upload kısıtlamaları

### Öneriler
- BOM erişim yetkilendirmesi
- Hassas maliyet bilgileri için şifreleme
- Değişiklik logları ve audit trail
- Role-based access control

## Sonuç

ÜRTM Takip BOM yönetim sistemi temel işlevleri yerine getiriyor olsa da, yukarıda belirtilen sorunlar nedeniyle üretim ortamında ciddi problemlere yol açabilir. Özellikle veri tutarsızlığı, performans sorunları ve kullanıcı deneyimi eksiklikleri acil olarak çözülmesi gereken konulardır. Önerilen iyileştirmeler ile daha sağlam, performanslı ve kullanıcı dostu bir BOM yönetim sistemi oluşturulabilir.

---

**Dokümantasyon Versiyonu:** 1.0
**Analiz Tarihi:** 22 Aralık 2025
**Proje Versiyonu:** v13.dev18