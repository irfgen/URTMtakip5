# ÜRTM Takip - API Dokümantasyonu

## API Genel Bakış

ÜRTM Takip sistemi, RESTful API tasarımı ile ifade edilen kapsamlı bir üretim takip sistemidir. Tüm endpoint'ler `/api` prefix'i altında toplanmıştır.

**Base URL:** `http://127.0.0.1:3000/api`

**Authentication:** JWT token (hazır altyapı mevcut)

**Rate Limiting:** Express rate limiter aktif

**Content-Type:** `application/json`

---

## 1. İŞ EMİRLERİ MODÜLÜ

### Endpoints

#### `GET /is-emirleri`
Tüm iş emirlerini listeler.

**Query Params:**
- `sayfa` (number) - Sayfa numarası
- `limit` (number) - Sayfa başına kayıt
- `durum` (string) - Durum filtresi
- `tezgah_id` (number) - Tezgah filtresi
- `sort` (string) - Sıralama

**Response:**
```json
{
  "toplamKayit": 150,
  "sayfa": 1,
  "sayfaSayisi": 15,
  "data": [...]
}
```

#### `POST /is-emirleri`
Yeni iş emri oluşturur.

**Request Body:**
```json
{
  "tezgah_id": 5,
  "parca_kodu": "P001",
  "adet": 100,
  "oncelik": "orta",
  "durum": "beklemede",
  "aciklama": "Acil üretim"
}
```

#### `PUT /is-emirleri/:id`
İş emri günceller.

**Params:**
- `id` (number) - İş emri ID

**Request Body:**
```json
{
  "durum": "uretime_baslandi",
  "aciklama": "Güncellenmiş açıklama"
}
```

#### `DELETE /is-emirleri/:id`
İş emri siler.

**Params:**
- `id` (number) - İş emri ID

#### `POST /is-emirleri/sirala`
İş emri sıralamasını günceller.

**Request Body:**
```json
{
  "siralamalar": [
    {"id": 1, "sira": 1},
    {"id": 2, "sira": 2}
  ]
}
```

#### `POST /is-emirleri/batch-create`
Excel'den toplu iş emri oluşturur.

**Request Body:**
```json
{
  "dosya": "excel_file.xlsx",
  "uretim_plani_id": 5
}
```

#### `POST /is-emirleri/create-from-plan`
Üretim planından iş emirleri oluşturur.

**Request Body:**
```json
{
  "uretim_plani_id": 5,
  "tezgahlar": [1, 2, 3]
}
```

#### `GET /is-emirleri/by-uretim-plani/:uretimPlaniId`
Üretim planına göre iş emirlerini filtreler.

#### `GET /is-emirleri/atanabilir-modal`
Atanabilir iş emirlerini getirir (modal için).

#### `POST /is-emirleri/:id/confirm-fason`
İş emrinin fason dönüşümünü onaylar.

---

## 2. TEZGAHLAR MODÜLÜ

### Endpoints

#### `GET /tezgahlar`
Tüm tezgahları listeler.

**Response:**
```json
[
  {
    "id": 1,
    "adi": "CNC-01",
    "calisma_durumu": "musait",
    "aktif_is_emri_id": null
  }
]
```

#### `POST /tezgahlar`
Yeni tezgah ekler.

**Request Body:**
```json
{
  "adi": "CNC-02",
  "tipi": "CNC",
  "konum": "Atolye 1"
}
```

#### `PUT /tezgahlar/:id`
Tezgah günceller.

#### `DELETE /tezgahlar/:id`
Tezgah siler.

#### `POST /tezgahlar/:id/ata-is`
Tezgaha iş emri atar.

**Request Body:**
```json
{
  "is_emri_id": 15
}
```

#### `DELETE /tezgahlar/:id/cikar-is`
Tezgahdan iş emri çıkarır.

#### `GET /tezgahlar/:id/rapor`
Tezgah raporunu getirir.

---

## 3. PARÇALAR MODÜLÜ

### Endpoints

#### `GET /parcalar`
Tüm parçaları listeler.

**Query Params:**
- `sayfa` (number) - Sayfa numarası
- `limit` (number) - Sayfa başına kayıt
- `arama` (string) - Arama terimi
- `grup` (string) - Grup filtresi

#### `POST /parcalar`
Yeni parça ekler.

**Request Body:**
```json
{
  "parca_kodu": "P001",
  "parca_adi": "Mil 20mm",
  "grup": "Milletler",
  "stok_adedi": 50,
  "birim": "adet",
  "ham_malzeme_kodu": "H001"
}
```

#### `GET /parcalar/:parcaKodu`
Parça detayını getirir.

#### `PUT /parcalar/:parcaKodu`
Parça günceller.

#### `DELETE /parcalar/:parcaKodu`
Parça siler.

#### `POST /parcalar/import`
Excel'den parça içe aktarır.

---

## 4. ÜRETİM PLANLARI MODÜLÜ

### Ana Sistem (`/uretim-plani`)

#### `GET /uretim-plani`
Tüm üretim planlarını listeler.

#### `POST /uretim-plani`
Yeni üretim planı oluşturur.

**Request Body:**
```json
{
  "plan_adi": "Ocak 2025",
  "tip": "karma",
  "baslangic_tarihi": "2025-01-01",
  "bitis_tarihi": "2025-01-31"
}
```

#### `GET /uretim-plani/:id`
Üretim planı detayını getirir.

#### `PUT /uretim-plani/:id`
Üretim planı günceller.

#### `DELETE /uretim-plani/:id`
Üretim planı siler.

#### `POST /uretim-plani/excel-import`
Excel'den üretim planı içe aktarır.

#### `GET /uretim-plani/bom-analiz`
BOM analizi yapar.

### V2 Sistem (`/uretim-planlari`)

#### `GET /uretim-planlari`
Basit üretim planlarını listeler.

#### `POST /uretim-planlari`
Yeni basit plan oluşturur.

---

## 5. BOM YÖNETİMİ MODÜLÜ

### Endpoints

#### `GET /boms`
Tüm BOM'ları listeler.

**Query Params:**
- `ust_parca_kodu` (string) - Üst parça kodu

#### `POST /boms`
Yeni BOM oluşturur.

**Request Body:**
```json
{
  "ust_parca_kodu": "P001",
  "alt_parca_kodu": "H001",
  "miktar": 2.5,
  "birim": "kg"
}
```

#### `PUT /boms/:id`
BOM günceller.

#### `DELETE /boms/:id`
BOM siler.

#### `GET /gruplar`
Parça gruplarını listeler.

#### `POST /gruplar`
Yeni grup oluşturur.

---

## 6. FASON İŞLER MODÜLÜ

### Endpoints

#### `GET /fason`
Fason işleri listeler.

#### `POST /fason`
Yeni fason işi oluşturur.

**Request Body:**
```json
{
  "is_emri_id": 15,
  "fason_grup_id": 3,
  "adicikar": 100,
  "teslim_tarihi": "2025-01-15"
}
```

#### `PUT /fason/:id`
Fason işi günceller.

#### `GET /fason-grup`
Fason grupları listeler.

#### `POST /fason-grup`
Yeni fason grubu oluşturur.

---

## 7. STOK KARTLARI MODÜLÜ

### Endpoints

#### `GET /stok-kartlari`
Stok kartlarını listeler.

#### `POST /stok-karti`
Yeni stok kartı oluşturur.

**Request Body:**
```json
{
  "stok_kodu": "H001",
  "stok_adi": "Çelik 20mm",
  "stok_turu": "Ham Malzeme",
  "birim": "kg",
  "mevcut_stok": 500,
  "kritik_seviye": 100
}
```

#### `PUT /stok-karti/:id`
Stok kartı günceller.

#### `POST /stok-karti/:id/giris`
Stok girişi yapar.

#### `POST /stok-karti/:id/cikis`
Stok çıkışı yapar.

---

## 8. SEVKİYAT MODÜLÜ

### Endpoints

#### `GET /sevkiyat`
Sevkiyat listesi.

#### `POST /sevkiyat`
Yeni sevkiyat oluşturur.

**Request Body:**
```json
{
  "musteri_adi": "ABC Ltd.",
  "sevkiyat_tarihi": "2025-01-15",
  "aciklama": "Acil sevkiyat"
}
```

#### `PUT /sevkiyat/:id`
Sevkiyat günceller.

#### `POST /sevkiyat-kalemleri`
Sevkiyat kalemi ekler.

#### `POST /sevkiyat/resimler`
Sevkiyat resmi yükler.

---

## 9. FATURA VE İRSALİYE MODÜLÜ

### Endpoints

#### `GET /faturalar`
Fatura listesi.

#### `POST /faturalar`
Yeni fatura oluşturur.

#### `GET /faturalar/:id`
Fatura detayı.

#### `GET /irsaliyeler`
İrsaliye listesi.

#### `POST /irsaliyeler`
Yeni irsaliye oluşturur.

#### `POST /eslestirme`
Fatura-irsaliye eşleştirme (Socket.IO).

---

## 10. ARIZA-BAKIM MODÜLÜ

### Endpoints

#### `GET /ariza-bakim`
Arıza kayıtları listesi.

#### `POST /ariza-bakim`
Yeni arıza kaydı oluşturur.

**Request Body:**
```json
{
  "tezgah_id": 5,
  "ariza_turu": "Mekanik",
  "aciklama": "Motor arızası",
  "bildiren": "Ahmet Yılmaz"
}
```

#### `PUT /ariza-bakim/:id`
Arıza kaydı günceller.

#### `DELETE /ariza-bakim/:id`
Arıza kaydı siler.

---

## 11. MAKINDEX MODÜLÜ

### Endpoints

#### `GET /makindex/boms`
BOM hiyerarşisini getirir.

**Query Params:**
- `root_parca_kodu` (string) - Kök parça kodu

#### `GET /makindex/siniflar`
Makina sınıflarını listeler.

#### `GET /makindex/makinalar`
Makinaları listeler.

#### `GET /makindex/parcalar`
Parçaları listeler.

#### `POST /makindex/search`
Gelişmiş arama yapar.

---

## 12. TEDARİK MODÜLÜ

### Endpoints

#### `GET /tedarik/talepler`
Tedarik talepleri listesi.

#### `POST /tedarik/talepler`
Yeni tedarik talebi oluşturur.

**Request Body:**
```json
{
  "stok_karti_id": 10,
  "miktar": 500,
  "oncelik": "yuksek",
  "aciklama": "Kritik stok"
}
```

#### `PUT /tedarik/talepler/:id`
Talep günceller.

#### `GET /tedarik/firmalar`
Firma listesi.

---

## 13. RAPORLAR MODÜLÜ

### Endpoints

#### `GET /raporlar/uretim`
Üretim raporu.

#### `GET /raporlar/performans`
Performans raporu.

#### `GET /raporlar/stok`
Stok raporu.

#### `GET /raporlar/fason`
Fason raporu.

---

## 14. NOTLAR MODÜLÜ

### Endpoints

#### `GET /notlar`
Notları listeler.

#### `POST /notlar`
Yeni not oluşturur.

#### `PUT /notlar/:id`
Not günceller.

#### `DELETE /notlar/:id`
Not siler.

#### `GET /notlar/kategoriler`
Kategorileri listeler.

---

## 15. VARDİYA YÖNETİMİ MODÜLÜ

### Endpoints

#### `GET /vardiyalar`
Vardiya listesi.

#### `POST /vardiyalar`
Yeni vardiya oluşturur.

#### `GET /vardiya-atamalar`
Vardiya atamaları.

#### `POST /vardiya-atamalar`
Vardiya ataması yapar.

---

## 16. DİĞER ENDPOINTS

### Timeline
- `GET /timeline` - Timeline verisi

### Scheduler
- `GET /scheduler/availability` - Müsaitlik durumu
- `POST /scheduler/assign` - İş atama

### Workstation Plan
- `GET /tezgah-is-plani` - İş planı
- `POST /tezgah-is-plani` - Plan oluştur

### CNC Link
- `POST /cnc_link/status` - CNC durum güncelleme

### CAD Import
- `POST /cad-import/register` - CAD client kayıt
- `GET /cad-import/jobs` - İş listesi

### Teknik Resim
- `POST /teknik-resim/upload` - Resim yükle
- `POST /teknik-resim/analyze` - OCR analizi

---

## SOCKET.IO EVENTS

### Main Namespace (`/`)

**Server → Client:**
- `isEmriGuncellendi` - İş emri güncellendi
- `stok-degisti` - Stok değişti
- `parca-eklendi` - Yeni parça eklendi
- `bom-guncellendi` - BOM güncellendi
- `makina-sinifi-guncellendi` - Makina sınıfı güncellendi

**Client → Server:**
- `makindex-join` - MAKINDEX odasına katıl
- `makindex-leave` - MAKINDEX odasından ayrıl

### CAD Import Namespace (`/cad-import`)

**Server → Client:**
- `job-progress` - İş ilerlemesi
- `file-processed` - Dosya işlendi

**Client → Server:**
- `register-client` - Client kayıt
- `heartbeat` - Heartbeat
- `start-job` - İş başlat
- `stop-job` - İş durdur

### Fatura Eşleştirme Namespace

**Events:**
- `fatura-eslestirme` - Fatura eşleştirme
- `irsaliye-updated` - İrsaliye güncellendi

---

## HATA KODLARI

| Status | Kod | Açıklama |
|--------|-----|----------|
| 200 | SUCCESS | Başarılı |
| 201 | CREATED | Oluşturuldu |
| 400 | BAD_REQUEST | Geçersiz istek |
| 401 | UNAUTHORIZED | Yetkisiz |
| 403 | FORBIDDEN | Yasaklı |
| 404 | NOT_FOUND | Bulunamadı |
| 413 | PAYLOAD_TOO_LARGE | Dosya çok büyük (100MB+) |
| 500 | INTERNAL_ERROR | Sunucu hatası |

---

## RATE LIMITING

- **Genel:** 100 istek / 15 dakika
- **Excel İçe Aktarma:** 10 istek / saat
- **CAD Import:** 50 istek / dakika

---

## FILE UPLOAD

**Desteklenen Formatlar:**
- Resimler: `.png`, `.jpg`, `.jpeg`
- Excel: `.xlsx`, `.xls`
- PDF: `.pdf`

**Maksimum Dosya Boyutu:**
- Genel: 100MB
- Excel: 50MB
- Resim: 10MB

**Upload Endpoints:**
- `/uploads/` - Genel dosyalar
- `/importlar/` - Excel içe aktarma
- `/api/teknik-resim/upload` - Teknik resimler

---

## VERİ DOĞRULAMA

Tüm endpoint'ler Joi kullanarak input validation yapar:

```javascript
{
  "adi": "string|required|min:3|max:100",
  "adet": "number|required|min:1",
  "tezgah_id": "number|required|integer"
}
```

---

## PAGINATION

Tüm list endpoint'leri pagination destekler:

**Query Params:**
- `sayfa` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```json
{
  "toplamKayit": 150,
  "sayfa": 1,
  "sayfaSayisi": 15,
  "data": [...]
}
```

---

## SIRALAMA

**Query Param:** `sort` (string)

**Format:** `alan:yön`

**Örnekler:**
- `adi:asc` - A-Z sıralama
- `adi:desc` - Z-A sıralama
- `olusturma_tarihi:desc` - Yeniden eskiye

---

## FİLTRELEME

Her modül kendi filtrelerini destekler:

**Örnek:**
```
GET /is-emirleri?durum=uretimde&tezgah_id=5
```

---

## CORS

**Allowed Origins:**
- `http://localhost:5173` (Development)
- Production URL (Production)

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization

---

## SECURITY

- **Helmet:** HTTP header güvenliği
- **Rate Limiter:** İstek sınırlama
- **CORS:** Cross-origin kontrolü
- **Input Validation:** Joi ile doğrulama
- **File Upload:** Multer güvenliği

---

## LOGGING

**Winston Logger:**
- Error logs: `error.log`
- Combined logs: `combined.log`
- Console output: Development mode

---

## CACHE

**Cache Service:**
- Önbellek süresi: 5 dakika (varsayılan)
- Manuel cache temizleme: `/api/cache/clear`

---

## VERSIYONLAMA

API versiyonlama şu anda yok. Tüm endpoint'ler `/api` altında.

Gelecek versiyonlar için `/api/v1`, `/api/v2` planlanmıştır.

---

## MIGRATION

Veritabanı migrations için `backend/src/migrations/` dizinine bakınız.

Migration komutları:
```bash
npm run migrate          # Tüm migrations
npm run migrate-durum    # Sadece durum modülü
```

---

## DEPO

**Repository:** [GitHub Repository]

**Dokümantasyon:** Bu dosya

**İletişim:** Development Team

---

## DEĞİŞİKLİK GEÇMİŞİ

### v14.0.0 (2025)
- MAKINDEX modülü eklendi
- CAD import entegrasyonu
- CNC panel WebSocket desteği
- Timeline ve Scheduler modülleri

### v13.0.0 (2024)
- Üretim planı V2 eklendi
- Redux Toolkit geçişi
- Mobil layout iyileştirmeleri

### v12.0.0 (2024)
- Fason yönetimi
- Stok kartları modülü
- Arıza-bakım takibi

---

## LİSANS

Tüm hakları saklıdır. © 2025 ÜRTM Takip
