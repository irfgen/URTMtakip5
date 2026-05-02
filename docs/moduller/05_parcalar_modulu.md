# 5. PARÇALAR (Parts) Modülü

## Genel Bakış

Parçalar modülü, üretimde kullanılan tüm parçaların katalog bilgilerini, teknik çizimlerini ve stok bağlantılarını yönetir.

**Route Dosyası:** `backend/src/routes/parcaRoutes.js`
**Controller Dosyası:** `backend/src/controllers/parcaController.js`
**Frontend Sayfası:** `frontend/src/pages/Parcalar.jsx`

---

## Modül Amacı

- Parça tanımlama ve katalog yönetimi
- Teknik resim ve fotoğraf yönetimi
- QR kod üretimi
- Stok kartı entegrasyonu
- CAD dosyası bağlantısı
- Birim maliyet takibi

---

## Veritabanı Tablosu

**Ana Tablo:** `parcalar`

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER | Birincil anahtar |
| parca_kodu | STRING | Benzersiz parça kodu |
| parca_adi | STRING | Parça adı |
| kategori | STRING | Kategori |
| sinif | STRING | Sınıf |
| birim | STRING | Birim (adet, kg, mt) |
| agirlik | DECIMAL | Ağırlık (gram) |
| malzeme | STRING | Malzeme cinsi |
| boyut | STRING | Boyut bilgisi |
| alim_maliyeti | DECIMAL | Satın alma maliyeti |
| uretim_maliyeti | DECIMAL | Üretim maliyeti |
| min_stok | INTEGER | Minimum stok seviyesi |
| max_stok | INTEGER | Maximum stok seviyesi |
| stok_karti_id | INTEGER | Bağlı stok kartı ID |
| teknik_resim_url | STRING | Teknik çizim URL |
| thumbnail_url | STRING | Thumbnail URL |
| qr_kod_url | STRING | QR kod URL |
| cad_dosya_yolu | STRING | CAD dosya yolu |
| aktif | BOOLEAN | Aktif/Pasif |
| created_at | DATETIME | Oluşturulma tarihi |
| updated_at | DATETIME | Güncellenme tarihi |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /` | Tüm parçaları listele |
| `GET /:parcaKodu` | Parça detayı |
| `GET /:parcaKodu/qrcode` | QR kod oluştur/görüntüle |
| `GET /:parcaKodu/suggest-ham-malzeme` | Ham malzeme öner |
| `GET /:parcaKodu/stok-karti` | Bağlı stok kartı |
| `GET /stok-karti/olmayan` | Stok kartı bağlanmamış parçalar |
| `GET /ara` | Parça arama |
| `GET /:parcaKodu/bom` | Parçanın BOM'u |
| `GET /:parcaKodu/tum-bilgiler` | Tüm bilgiler |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /` | Yeni parça oluştur |
| `POST /import` | Parça import |
| `POST /import-excel` | Excel'den import |
| `POST /batch-check` | Toplu parça kontrolü |
| `POST /check-bulk` | Toplu kontrol |
| `POST /bulk-create` | Toplu oluşturma |
| `POST /upload-image` | Görsel yükleme |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /:parcaKodu` | Parça güncelle |
| `PUT /:parcaKodu/stok-karti` | Stok kartı ata |
| `PUT /update-cad-paths/:parcaKodu` | CAD yolu güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /:parcaKodu` | Parça sil |
| `DELETE /:parcaKodu/stok-karti` | Stok kartı bağlantısını kaldır |
| `DELETE /bulk` | Toplu silme |

---

## Temel Fonksiyonlar

### 1. parcaOlustur(parcaData)
Yeni parça oluşturur.
- Benzersiz parça kodu üretir
- Gerekli alanları doğrular

### 2. parcaGetir(parcaKodu)
Parça detayını getirir.
- Temel bilgiler
- Stok kartı bağlantısı
- BOM bilgisi

### 3. qrKodOlustur(parcaKodu)
Parça için QR kod oluşturur.
- DataMatrix formatında
- Parça kodu encode edilir

### 4. hamMalzemeOner(parcaKodu)
Parçanın üretimi için gerekli ham malzemeleri önerir.
- BOM analizi
- Stok karşılaştırması

### 5. stokKartiAta(parcaKodu, stokKartiId)
Parçaya stok kartı bağlar.
- İki yönlü referans
- Maliyet bilgisi senkronizasyonu

### 6. birimMaliyetHesapla(parcaKodu)
Parçanın birim maliyetini hesaplar.
- Alım + Üretim maliyeti
- Puantaj verileri

---

## QR Kod Sistemi

QR kod içeriği:
```
URTM:P:{parca_kodu}
```

Özellikler:
- DataMatrix format
- Otomatik oluşturma
- Etiket yazdırma desteği
- Mobil tarama desteği

---

## CAD Dosya Entegrasyonu

### Desteklenen Formatlar

| Format | Uzantı | Açıklama |
|--------|--------|----------|
| STEP | .stp, .step | Nötral format |
| IGES | .igs | Nötral format |
| SolidWorks Part | .sldprt | Native format |
| SolidWorks Assembly | .sldasm | Native format |

### CAD Dosya Yolu Yönetimi

- Mutlak yol depolama
- Ağ sürücüsü desteği
- Otomatik thumbnail oluşturma

---

## Alt Modüller

### 1. Parça Import
**Dosya:** `parcaImportRoutes.js`
**Açıklama:** Excel ve CSV'den toplu parça importu

### 2. Parça Kayıtları
**Dosya:** `parcaKayitlariRoutes.js`
**Açıklama:** Parça hareket kayıtları (giriş/çıkış)

### 3. Parça Birleştirme
**Dosya:** `parcaBirlesikRoutes.js`
**Açıklama:** Birleşik parça yönetimi

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `Parcalar.jsx` | Ana parça sayfası |
| `ParcaListesi.jsx` | Parça listesi tablosu |
| `ParcaDetay.jsx` | Parça detay görünümü |
| `ParcaForm.jsx` | Parça ekleme/düzenleme formu |
| `ParcaArama.jsx` | Arama componenti |
| `QRKodGoruntuleyici.jsx` | QR kod görüntüleme |
| `TeknikResimGoruntuleyici.jsx` | Teknik çizim görüntüleme |
| `ParcaBOM.jsx` | Parça BOM görünümü |

---

## Image Fallback Sistemi

Birden fazla görsel kaynağı dener:

```javascript
const imageSources = [
  primaryUrl,        // Ana görsel
  thumbnailUrl,      // Thumbnail
  cadPreviewUrl,     // CAD önizleme
  placeholderUrl     // Placeholder
];

const getAvailableImage = async (sources) => {
  for (const src of sources) {
    const isAvailable = await checkImageAvailable(src);
    if (isAvailable) return src;
  }
  return placeholderUrl;
};
```

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `parca:created` | Yeni parça oluşturuldu |
| `parca:updated` | Parça güncellendi |
| `parca:deleted` | Parça silindi |
| `parca:stokKartiChanged` | Stok kartı bağlantısı değişti |

---

## İlişkili Modüller

- **BOM Yönetimi** - Parça malzeme listesi
- **Stok Kartları** - Stok bağlantısı
- **İş Emirleri** - Parça kullanımı
- **Üretim Planı** - Parça planlaması
- **Teknik Çizimler** - CAD dosyaları

---

## Kullanım Senaryoları

### Senaryo 1: Yeni Parça Ekleme
1. Kullanıcı "Yeni Parça" seçer
2. Parça kodu ve adı girer
3. Kategori ve sınıf seçer
4. Malzeme ve boyut bilgilerini girer
5. Maliyet bilgilerini girer
6. Teknik resim yükler
7. Kaydet butonuna tıklar

### Senaryo 2: Stok Kartı Bağlama
1. Kullanıcı parça detayını açar
2. "Stok Kartı Bağla" seçer
3. Stok kartı araması yapar
4. İlgili stok kartını seçer
5. Sistem otomatik maliyet bilgilerini senkronize eder

### Senaryo 3: CAD Dosya Bağlama
1. Kullanıcı parça detayını açar
2. "CAD Dosyası" sekmesine geçer
3. Dosya yolu girer veya tarayıcıdan seçer
4. Sistem CAD önizlemesi oluşturur

---

## Validasyon Kuralları

- `parca_kodu` benzersiz ve zorunlu
- `parca_adi` zorunlu, en fazla 200 karakter
- `alim_maliyeti` >= 0
- `uretim_maliyeti` >= 0
- `agirlik` > 0 (opsiyonel)
- `min_stok` <= `max_stok`

---

## Hata Kodları

| Kod | Mesaj | Açıklama |
|-----|-------|----------|
| PR001 | Parça bulunamadı | Geçersiz parça kodu |
| PR002 | Parça kodu mevcut | Aynı kodlu parça var |
| PR003 | Stok kartı bulunamadı | Geçersiz stok kartı ID |
| PR004 | CAD dosya bulunamadı | Dosya yolu geçersiz |
| PR005 | Geçersiz görsel | Görsel yüklenemedi |

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-01 | İlk versiyon |
| 1.1 | 2024-04 | QR kod sistemi eklendi |
| 1.2 | 2024-07 | CAD dosya entegrasyonu |
| 1.3 | 2024-10 | Image fallback sistemi |
| 1.4 | 2024-12 | Batch import özelliği |
| 1.5 | 2025-01 | CAD path yönetimi |