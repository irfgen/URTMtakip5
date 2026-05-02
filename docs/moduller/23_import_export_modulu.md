# 23. İMPORT/EXPORT Modülü

## Genel Bakış

Import/Export modülü, Excel ve CSV dosyalarından toplu veri aktarımı ve sistemin dışarıya veri aktarmasını sağlar.

**Route Dosyası:** `backend/src/routes/importExportRoutes.js`
**Controller Dosyası:** `backend/src/controllers/importExportController.js`
**Frontend Sayfası:** `frontend/src/pages/ImportExport.jsx`

---

## Modül Amacı

- Excel import (parça, stok, BOM)
- CSV import
- Toplu veri aktarımı
- Veri export (Excel, CSV, JSON)
- Dosya format dönüştürme
- İndeksleme ve arama

---

## Desteklenen Formatlar

### Import
| Format | Uzantı | Açıklama |
|--------|--------|----------|
| Excel | .xlsx, .xls | Microsoft Excel |
| CSV | .csv | Virgülle ayrılmış |
| JSON | .json | JSON format |

### Export
| Format | Uzantı | Açıklama |
|--------|--------|----------|
| Excel | .xlsx | Microsoft Excel |
| CSV | .csv | Virgülle ayrılmış |
| JSON | .json | JSON format |
| XML | .xml | XML format |

---

## API Endpointleri

### GET İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /status` | Import durumu |
| `GET /statistics` | İstatistikler |
| `GET /job-history` | İş geçmişi |
| `GET /job/:jobId` | İş detayı |
| `GET /index-list` | Index listesi |
| `GET /export-data` | Export verisi hazırla |
| `GET /download/:format` | Dosya indir |

### POST İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `POST /bulk-import` | Toplu import başlat |
| `POST /stop-bulk-import` | Import durdur |
| `POST /import-single/:indexId` | Tek import |
| `POST /index-folder` | Klasör indexle |
| `POST /index-files` | Dosyaları indexle |
| `POST /refresh-parts-check` | Parça kontrolünü yenile |
| `POST /export-archive` | Arşiv export |
| `POST /test-solidworks` | SolidWorks test |

### PUT İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `PUT /index/:indexId/status` | Index durumu güncelle |

### DELETE İşlemleri

| Endpoint | Açıklama |
|----------|----------|
| `DELETE /index/:indexId` | Index sil |

---

## Import Türleri

### Parça Import
| Kolon | Zorunlu | Açıklama |
|-------|---------|----------|
| parca_kodu | ✅ | Benzersiz kod |
| parca_adi | ✅ | Parça adı |
| kategori | ❌ | Kategori |
| birim | ❌ | Birim |
| alim_maliyeti | ❌ | Alım maliyeti |
| uretim_maliyeti | ❌ | Üretim maliyeti |

### Stok Import
| Kolon | Zorunlu | Açıklama |
|-------|---------|----------|
| stok_kodu | ✅ | Stok kodu |
| malzeme_adi | ✅ | Malzeme adı |
| miktar | ✅ | Miktar |
| birim_fiyat | ❌ | Birim fiyat |
| kritik_seviye | ❌ | Kritik seviye |

### BOM Import
| Kolon | Zorunlu | Açıklama |
|-------|---------|----------|
| bom_kodu | ✅ | BOM kodu |
| parca_kodu | ✅ | Ana parça |
| malzeme_kodu | ✅ | Malzeme |
| miktar | ✅ | Gerekli miktar |

---

## Import Durumları

| Durum | Açıklama |
|-------|----------|
| beklemede | Import bekliyor |
| isleniyor | Import işleniyor |
| basarili | Import başarılı |
| hatali | Import hatalı |
| kismi_basarili | Bazı satırlar başarılı |

---

## Temel Fonksiyonlar

### 1. excelImport(dosyaYolu, tur)
Excel dosyasını import eder.
- Dosya formatını kontrol eder
- Header eşleştirmesi yapar
- Satır satır işler

### 2. csvImport(dosyaYolu, tur)
CSV dosyasını import eder.
- Encoding tespiti
- Separator belirleme

### 3. veriExport(tur, format)
Belirtilen türde veri export eder.
- Excel için xlsx paketi kullanır
- Stream olarak gönderir

### 4. klasorIndexle(dizinYolu)
Klasördeki dosyaları indexler.

---

## Frontend Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `ImportExport.jsx` | Ana import/export sayfası |
| `DosyaSecici.jsx` | Dosya seçme arayüzü |
| `ImportOnizleme.jsx` | Import önizleme tablosu |
| `ImportSonuclari.jsx` | Import sonuçları |
| `ExportSecenekleri.jsx` | Export seçenekleri |
| `ImportGecmisi.jsx` | Import geçmişi |

---

## Socket.IO Events

| Olay | Açıklama |
|------|----------|
| `import:started` | Import başladı |
| `import:progress` | Import ilerliyor |
| `import:row-complete` | Satır tamamlandı |
| `import:completed` | Import tamamlandı |
| `import:error` | Import hatası |
| `export:started` | Export başladı |
| `export:completed` | Export tamamlandı |

---

## İlişkili Modüller

- **Parçalar** - Parça import/export
- **Stok Kartları** - Stok import/export
- **BOM** - BOM import/export
- **Üretim Planı** - Plan import

---

## Validasyon

- Dosya boyutu max 100MB
- Desteklenmeyen format hatası
- Eksik zorunlu kolon uyarısı
- Veri tipi uyumsuzluğu kontrolü

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| 1.0 | 2024-02 | İlk versiyon |
| 1.1 | 2024-06 | Excel import geliştirildi |
| 1.2 | 2024-09 | CSV desteği eklendi |
| 1.3 | 2024-12 | Batch processing eklendi |
| 1.4 | 2025-02 | Progress tracking eklendi |