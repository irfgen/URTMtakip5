# URTM Takip Sistemi - API Dokümantasyonu

## Genel Bakış

URTM Takip Sistemi, üretim takibi, envanter yönetimi, planlama ve raporlama işlevlerini bir araya getiren kapsamlı bir üretim yönetim sistemidir. Bu doküman, sistemin tüm API endpoint'lerini detaylı olarak açıklar.

### Temel Bilgiler

- **Base URL**: `http://127.0.0.1:3000/api`
- **Sunucu Portu**: 3000 (Backend), 5173 (Frontend)
- **Dosya Yükleme Limiti**: 100MB
- **Veritabanı**: SQLite
- **Authentication**: JWT tabanlı (mevcut sistemde implementasyonu devam ediyor)

### Genel API Özellikleri

- **CORS**: Tüm origin'lere izin verir
- **Response Format**: JSON
- **Error Handling**: Standardize edilmiş hata mesajları
- **Real-time Updates**: Socket.IO ile gerçek zamanlı veri akışı
- **File Upload**: Multer middleware ile dosya yükleme desteği

---

## 1. İŞ EMRİLERİ (Work Orders) API

İş emirleri, üretim sürecinin temelini oluşturur ve üretim adımlarını takip eder.

### Endpoint'ler

#### GET /api/is-emirleri
Tüm iş emirlerini listeler

**Query Parameters:**
- `durum` (optional): İş emri durumuna göre filtreleme
- `baslangic_tarihi` (optional): Başlangıç tarihine göre filtreleme
- `bitis_tarihi` (optional): Bitiş tarihine göre filtreleme
- `sayfa` (optional): Sayfa numarası (varsayılan: 1)
- `limit` (optional): Sayfa başına kayıt sayısı

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "is_emri_id": "IE2024001",
      "parca_kodu": "PR001",
      "miktar": 100,
      "durum": "beklemede",
      "baslangic_tarihi": "2024-01-01",
      "bitis_tarihi": "2024-01-15",
      "aciklama": "Örnek iş emri"
    }
  ],
  "total": 1,
  "page": 1
}
```

#### POST /api/is-emirleri
Yeni iş emri oluşturur

**Request Body:**
```json
{
  "parca_kodu": "PR002",
  "miktar": 50,
  "tezgah_id": 1,
  "aciklama": "Yeni iş emri",
  "baslangic_tarihi": "2024-02-01",
  "termin_tarihi": "2024-02-15"
}
```

#### GET /api/is-emirleri/:id
Belirtilen ID'li iş emri detaylarını getirir

#### PUT /api/is-emirleri/:id
İş emri bilgilerini günceller

#### DELETE /api/is-emirleri/:id
İş emri siler

#### POST /api/is-emirleri/sirala
İş emirlerinin sırasını günceller (öncelik için)

**Request Body:**
```json
{
  "sira_listesi": [
    { "is_emri_id": 1, "sira": 1 },
    { "is_emri_id": 2, "sira": 2 }
  ]
}
```

#### POST /api/is-emirleri/batch-create
Excel'den toplu iş emri oluşturur

#### POST /api/is-emirleri/create-from-plan
Üretim planından iş emirleri oluşturur

#### GET /api/is-emirleri/atanabilir-modal
Modal için atanabilir iş emirlerini durumuna göre gruplandırılmış olarak getirir

#### POST /api/is-emirleri/:id/confirm-fason
İş emrinin fason durumuna geçişini onaylar

---

## 2. TEZGAHLAR (Workstations) API

Tezgahlar, üretim makinelerini ve istasyonlarını yönetir.

### Endpoint'ler

#### GET /api/tezgahlar
Tüm tezgahları listeler

**Response:**
```json
[
  {
    "tezgah_id": 1,
    "tezgah_tanimi": "CNC Tezgah 1",
    "tezgah_kodu": "CNC001",
    "durum": "calisiyor",
    "pozisyon_x": 100,
    "pozisyon_y": 200,
    "kapasite": 8,
    "is_emirleri": []
  }
]
```

#### GET /api/tezgahlar/:id
Tek bir tezgahın detaylarını ve iş emirlerini getirir

#### POST /api/tezgahlar
Yeni tezgah ekler

**Request Body:**
```json
{
  "tezgah_tanimi": "Yeni Tezgah",
  "tezgah_kodu": "TZG002",
  "durum": "hazir",
  "kapasite": 5
}
```

#### PUT /api/tezgahlar/:id
Tezgah bilgilerini günceller

#### DELETE /api/tezgahlar/:id
Tezgah siler (ilişkili kayıtlarla birlikte)

#### POST /api/tezgahlar/pozisyonlar
Tezgah pozisyonlarını toplu günceller

**Request Body:**
```json
[
  {
    "tezgah_id": 1,
    "x": 150,
    "y": 250
  }
]
```

---

## 3. PARÇALAR (Parts) API

Parça kataloğu yönetimi ve parça bilgileri.

### Endpoint'ler

#### GET /api/parcalar
Tüm parçaları listeler

**Query Parameters:**
- `sayfa` (optional): Sayfa numarası
- `limit` (optional): Sayfa başına kayıt
- `arama` (optional): Parça adında veya kodunda arama

#### POST /api/parcalar
Yeni parça ekler

**Request Body:**
```json
{
  "parca_kodu": "PR003",
  "parca_adi": "Yeni Parça",
  "aciklama": "Parça açıklaması",
  "birim": "adet",
  "kritik_stok": 10
}
```

#### GET /api/parcalar/:parcaKodu
Belirtilen parça koduna göre parça detaylarını getirir

#### PUT /api/parcalar/:parcaKodu
Parça bilgilerini günceller

#### DELETE /api/parcalar/:parcaKodu
Parçayı siler

#### GET /api/parcalar/check
Tek parça kodunun varlığını kontrol eder

#### POST /api/parcalar/check-bulk
Birden fazla parça kodunu kontrol eder

#### POST /api/parcalar/batch-check
Toplu parça kontrolü yapar

#### GET /api/parcalar/:parcaKodu/suggest-ham-malzeme
Parça için ham malzeme önerileri sunar

#### GET /api/parcalar/resim-yolu/:parca_kodu
Parçanın resim yolunu getirir

#### GET /api/parcalar/stok-karti/olmayan
Stok kartı olmayan parçaları listeler

#### PUT /api/parcalar/:parcaKodu/stok-karti
Parçaya stok kartı atar

#### DELETE /api/parcalar/:parcaKodu/stok-karti
Parçadan stok kartını kaldırır

#### GET /api/parcalar/:parcaKodu/qrcode
Parça için QR kod oluşturur

---

## 4. ÜRETİM PLANI (Production Planning) API

Ana üretim planlama sistemi.

### Endpoint'ler

#### GET /api/uretim-plani
Tüm üretim planlarını listeler

#### GET /api/uretim-plani/:id
Üretim planı detaylarını getirir

#### POST /api/uretim-plani
Yeni üretim planı oluşturur

**Request Body:**
```json
{
  "plan_adi": "Ocak Üretim Planı",
  "baslangic_tarihi": "2024-01-01",
  "bitis_tarihi": "2024-01-31",
  "aciklama": "Aylık üretim planı"
}
```

#### POST /api/uretim-plani/is-emri-tabanli
İş emri tabanlı üretim planı oluşturur

#### POST /api/uretim-plani/karma
Karma (mixed) üretim planı oluşturur

#### POST /api/uretim-plani/excel-import
Excel dosyasından üretim planı import eder

#### PUT /api/uretim-plani/:id
Üretim planını günceller

#### DELETE /api/uretim-plani/:id
Üretim planını siler

#### POST /api/uretim-plani/bom-analizi
BOM analizi yapar

#### POST /api/uretim-plani/kritik-stok/is-emri
Kritik stoktaki parça için iş emri oluşturur

#### POST /api/uretim-plani/:id/is-emri
Üretim planına iş emri ekler

#### DELETE /api/uretim-plani/:id/is-emri
Üretim planından iş emri kaldırır

---

## 5. ÜRETİM PLANLARI V2 API

Basitleştirilmiş üretim planlama sistemi.

### Endpoint'ler

#### GET /api/uretim-planlari
Tüm V2 üretim planlarını listeler

#### POST /api/uretim-planlari
Yeni V2 üretim planı oluşturur

#### GET /api/uretim-planlari/:id
V2 üretim planı detaylarını getirir

#### PUT /api/uretim-planlari/:id
V2 üretim planını günceller

#### DELETE /api/uretim-planlari/:id
V2 üretim planını siler

---

## 6. BOM YÖNETİMİ (Bill of Materials) API

Malzeme listesi (BOM) yönetimi.

### Endpoint'ler

#### GET /api/boms
Tüm BOM'ları listeler

#### POST /api/boms
Yeni BOM oluşturur

**Request Body:**
```json
{
  "parca_kodu": "PR001",
  "makina_id": 1,
  "aciklama": "BOM açıklaması",
  "malzemeler": [
    {
      "malzeme_kodu": "ML001",
      "miktar": 2,
      "birim": "adet"
    }
  ]
}
```

#### GET /api/boms/:id
BOM detaylarını getirir

#### PUT /api/boms/:id
BOM'u günceller

#### DELETE /api/boms/:id
BOM'u siler

#### GET /api/search/parts
Parça arama yapar (form içinde kullanılır)

#### GET /api/search/boms
Diğer BOM'ları arar

#### GET /api/parts/:parcaKodu/unit-cost
Parçanın birim maliyetini hesaplar

---

## 7. STOK KARTLARI (Inventory Management) API

Stok ve envanter yönetimi.

### Endpoint'ler

#### GET /api/stok-kartlari
Stok kartlarını listeler (sayfalama, arama, filtreleme ile)

**Query Parameters:**
- `sayfa` (optional): Sayfa numarası
- `limit` (optional): Sayfa başına kayıt
- `kesit` (optional): Kesite göre filtre
- `malzeme_cinsi` (optional): Malzeme cinsine göre filtre
- `firma` (optional): Firmaya göre filtre
- `arama` (optional): Genel arama

#### POST /api/stok-kartlari
Yeni stok kartı oluşturur

**Request Body:**
```json
{
  "kesit": "Kare",
  "malzeme_cinsi": "Alüminyum",
  "malzeme_adi": "Alüminyum Levha",
  "boy": "1000x2000",
  "adet": 50,
  "kritik_stok_miktari": 10,
  "firma": "Firma A"
}
```

#### GET /api/stok-kartlari/:id
Stok kartı detaylarını getirir

#### PUT /api/stok-kartlari/:id
Stok kartını günceller

#### DELETE /api/stok-kartlari/:id
Stok kartını siler

#### GET /api/stok-kartlari/kritik-stok
Kritik stokta olan malzemeleri listeler

#### GET /api/stok-kartlari/istatistikler
Stok istatistiklerini getirir

#### GET /api/stok-kartlari/firmalar
Firma listesini getirir

#### GET /api/stok-kartlari/malzeme-cinsleri
Malzeme cinsi listesini getirir

#### GET /api/stok-kartlari/search
Gelişmiş arama yapar

---

## 8. FASON İŞLER (Subcontractor Management) API

Dış üretim ve fason iş yönetimi.

### Endpoint'ler

#### Fason İş Emirleri

##### GET /api/fason/is-emirleri
Tüm fason iş emirlerini listeler

##### GET /api/fason/is-emirleri/selectable
Seçilebilir fason iş emirlerini listeler

##### GET /api/fason/is-emirleri/by-uretim-plani/:uretim_plani_id
Üretim planına bağlı fason iş emirlerini listeler

##### GET /api/fason/is-emirleri/:id
Fason iş emri detaylarını getirir

##### POST /api/fason/is-emirleri
Yeni fason iş emri oluşturur

##### PUT /api/fason/is-emirleri/:id
Fason iş emrini günceller

##### DELETE /api/fason/is-emirleri/:id
Fason iş emrini siler

##### POST /api/fason/is-emirleri/:id/teslim-al
Fason iş emrini teslim alır

##### PATCH /api/fason/is-emirleri/:id/durum
Fason iş emri durumunu günceller

#### Ham Malzeme İşlemleri

##### POST /api/fason/is-emirleri/:id/ham-malzeme-gonder
Fasona ham malzeme gönderir

##### PATCH /api/fason/is-emirleri/:id/ham-malzeme-durum
Ham malzeme durumunu günceller

##### POST /api/fason/is-emirleri/:id/ham-malzeme-teslim
Ham malzemeyi teslim eder

#### Fason Teklifler

##### GET /api/fason/teklifler
Tüm fason tekliflerini listeler

##### GET /api/fason/teklifler/parca/:parca_kodu
Parça koduna göre teklifleri listeler

##### GET /api/fason/teklifler/is-emri/:fason_is_emri_id
Fason iş emrine göre teklifleri listeler

##### POST /api/fason/teklifler
Yeni teklif oluşturur

##### PUT /api/fason/teklifler/:id
Teklifi günceller

##### DELETE /api/fason/teklifler/:id
Teklifi siler

##### POST /api/fason/teklifler/:id/kabul-et
Teklifi kabul eder

#### Excel Import

##### POST /api/fason/teklifler/upload-excel
Excel dosyasından teklif import eder

##### GET /api/fason/teklifler/check-parca
Parça kodunu kontrol eder

##### POST /api/fason/teklifler/bulk-create
Toplu teklif oluşturur

---

## 9. SEVKİYAT (Shipping Management) API

Sevkiyat ve teslimat yönetimi.

### Endpoint'ler

#### Ana Sevkiyat

##### GET /api/sevkiyat
Tüm sevkiyatları listeler

##### POST /api/sevkiyat
Yeni sevkiyat oluşturur

##### GET /api/sevkiyat/:id
Sevkiyat detaylarını getirir

##### PUT /api/sevkiyat/:id
Sevkiyatı günceller

##### DELETE /api/sevkiyat/:id
Sevkiyatı siler

#### Tedarik Talepleri Entegrasyonu

##### GET /api/sevkiyat/tedarik-talepleri
Onaylanan tedarik taleplerini listeler

#### Sub-Routes

##### /api/sevkiyat/lokasyonlar
Sevkiyat lokasyonlarını yönetir

##### /api/sevkiyat/raporlar
Sevkiyat raporlarını oluşturur

##### /api/sevkiyat-kalemleri
Sevkiyat kalemlerini yönetir

##### /api/sevkiyat/resimler
Sevkiyat resimlerini yönetir

##### /api/toplu-sevkiyat
Toplu sevkiyat işlemleri

---

## 10. ARIZA-BAKIM (Maintenance Management) API

Makine arıza ve bakım takibi.

### Endpoint'ler

#### GET /api/ariza-bakim
Tüm arıza ve bakım kayıtlarını listeler

**Query Parameters:**
- `tezgah_id` (optional): Tezgah ID'sine göre filtre
- `durum` (optional): Duruma göre filtre
- `tarih_baslangic` (optional): Başlangıç tarihi
- `tarih_bitis` (optional): Bitiş tarihi

#### GET /api/ariza-bakim/istatistikler
Arıza-bakım istatistiklerini getirir

#### GET /api/ariza-bakim/:id
Tek bir arıza/bakım detayını getirir

#### GET /api/ariza-bakim/tezgah/:tezgah_id/aktif
Tezgahın aktif arıza/bakım kayıtlarını listeler

#### POST /api/ariza-bakim
Yeni arıza/bakım kaydı oluşturur

**Request Body:**
```json
{
  "tezgah_id": 1,
  "tip": "ariza",
  "aciklama": "Motor arızası",
  "bakim_turu": "planli",
  "durum": "devam_ediyor",
  "baslangic_tarihi": "2024-01-01",
  "bitis_tarihi": null
}
```

#### PUT /api/ariza-bakim/:id
Arıza/bakım kaydını günceller

#### DELETE /api/ariza-bakim/:id
Arıza/bakım kaydını siler

---

## 11. NOTLAR (Notes Management) API

Not ve belge yönetim sistemi.

### Endpoint'ler

#### GET /api/notlar
Tüm notları listeler

**Query Parameters:**
- `kategori` (optional): Kategoriye göre filtre
- `etiket` (optional): Etikete göre filtre
- `arama` (optional): İçerik arama

#### POST /api/notlar
Yeni not oluşturur

**Request Body:**
```json
{
  "baslik": "Önemli Not",
  "icerik": "Not içeriği",
  "kategori": "Üretim",
  "etiketler": ["önemli", "acil"],
  "oncelik": "yuksek"
}
```

#### GET /api/notlar/:id
Not detaylarını getirir

#### PUT /api/notlar/:id
Notu günceller

#### DELETE /api/notlar/:id
Notu siler

#### POST /api/notlar/:id/resim
Note resim ekler

#### DELETE /api/notlar/:id/resim/:resimId
Not resmini siler

---

## 12. RAPORLAR (Reporting) API

Üretim raporları ve analitikler.

### Endpoint'ler

#### GET /api/raporlar
Tüm raporları listeler

#### POST /api/raporlar/uretim
Üretim raporu oluşturur

#### POST /api/raporlar/stok
Stok raporu oluşturur

#### POST /api/raporlar/performans
Performans raporu oluşturur

#### GET /api/raporlar/:id
Rapor detaylarını getirir

#### POST /api/raporlar/:id/export
Raporu export eder (Excel/PDF)

---

## 13. VARDİYA YÖNETİMİ (Shift Management) API

Vardiya ve personel yönetimi.

### Endpoint'ler

#### Vardiyalar

##### GET /api/vardiyalar
Tüm vardiyaları listeler

##### POST /api/vardiyalar
Yeni vardiya oluşturur

##### GET /api/vardiyalar/:id
Vardiya detaylarını getirir

##### PUT /api/vardiyalar/:id
Vardiyayı günceller

##### DELETE /api/vardiyalar/:id
Vardiyayı siler

#### Personel

##### GET /api/personel
Tüm personeli listeler

##### POST /api/personel
Yeni personel ekler

##### GET /api/personel/:id
Personel detaylarını getirir

##### PUT /api/personel/:id
Personel bilgilerini günceller

##### DELETE /api/personel/:id
Personeli siler

#### Vardiya Atamaları

##### GET /api/vardiya-atamalari
Vardiya atamalarını listeler

##### POST /api/vardiya-atamalari
Yeni vardiya ataması yapar

##### PUT /api/vardiya-atamalari/:id
Vardiya atamasını günceller

##### DELETE /api/vardiya-atamalari/:id
Vardiya atamasını siler

---

## 14. TEKNİK RESİM (Technical Drawing) API

Teknik resim ve OCR analizi.

### Endpoint'ler

#### POST /api/teknik-resim/analiz
Teknik resim dosyasını analiz eder

#### GET /api/teknik-resim/:id
Teknik resim detaylarını getirir

#### POST /api/teknik-resim/:id/ocr
Resim üzerinde OCR işlemi yapar

---

## 15. MAKINDEX (Hierarchical System) API

Makine ve hiyerarşik sistem yönetimi.

### Endpoint'ler

#### GET /api/makindex/makineler
Makine hiyerarşisini listeler

#### POST /api/makindex/makineler
Yeni makine ekler

#### GET /api/makindex/boms
BOM hiyerarşisini listeler

#### POST /api/makindex/boms
Yeni hiyerarşik BOM oluşturur

---

## 16. CAD IMPORT API

CAD dosya import ve yönetimi.

### Endpoint'ler

#### GET /api/cad-import/clients
CAD import client'larını listeler

#### POST /api/cad-import/job
Yeni import işi başlatır

#### GET /api/cad-import/job/:id
İş durumunu getirir

#### GET /api/cad-import/files
CAD dosyalarını listeler

---

## 17. CNC LINK API

CNC makineleri ile iletişim.

### Endpoint'ler

#### GET /api/cnc_link/status
CNC bağlantı durumunu kontrol eder

#### POST /api/cnc_link/command
CNC makinesine komut gönderir

#### GET /api/cnc_link/data
CNC verilerini çeker

---

## 18. FİRMA VE PERSONEL YÖNETİMİ API

#### Firmalar

##### GET /api/firmalar
Tüm firmaları listeler

##### POST /api/firmalar
Yeni firma ekler

##### GET /api/firmalar/:id
Firma detaylarını getirir

##### PUT /api/firmalar/:id
Firma bilgilerini günceller

##### DELETE /api/firmalar/:id
Firmayı siler

---

## 19. DOSYA YÜKLEME (File Upload) API

Dosya yükleme yönetimi.

### Endpoint'ler

#### POST /api/upload
Dosya yükler

**Request:** multipart/form-data
- `file`: Dosya
- `type`: Dosya tipi
- `folder`: Hedef klasör

#### GET /api/uploads/:filename
Yüklenen dosyayı sunar

---

## 20. IMPORT/EXPORT API

Veri import/export işlemleri.

### Endpoint'ler

#### POST /api/import-export/import
Veri import eder

#### POST /api/import-export/export
Veri export eder

#### GET /api/import-export/templates
Import şablonlarını listeler

---

## Socket.IO Events

Gerçek zamanlı veri akışı için kullanılır.

### Connection

```javascript
const socket = io('http://127.0.0.1:3000');
```

### Events

#### Genel
- `isEmriGuncellendi`: İş emri güncellemesi
- `connection`: Yeni bağlantı
- `disconnect`: Bağlantı kesilmesi

#### Makindex
- `makindex-join`: Makindex odasına katılma
- `makindex-leave`: Makindex odasından ayrılma
- `stok-degisti`: Stok değişikliği
- `parca-eklendi`: Yeni parça eklendi
- `bom-guncellendi`: BOM güncellendi
- `makina-sinifi-guncellendi`: Makina sınıfı güncellendi

#### CAD Import
- `register-client`: Client kaydı
- `job-progress`: İş ilerlemesi
- `file-processed`: Dosya işlendi
- `heartbeat`: Client heartbeat
- `start-job`: İş başlatma
- `stop-job`: İş durdurma

---

## Error Handling

Tüm API endpoint'leri standardize edilmiş hata formatı kullanır:

```json
{
  "success": false,
  "error": "Hata mesajı",
  "code": "ERROR_CODE",
  "details": "Detaylı hata bilgisi (development modunda)"
}
```

### Common HTTP Status Codes

- `200`: Başarılı
- `201`: Oluşturuldu
- `400`: Bad Request
- `401`: Unauthorized (JWT implementasyonu sonrası aktif olacak)
- `403`: Forbidden
- `404`: Not Found
- `413`: Payload Too Large (dosya boyutu limiti aşıldı)
- `500`: Internal Server Error

---

## Örnek Kullanım Senaryoları

### 1. İş Emri Oluşturma

```javascript
// 1. Önce tezgahları listele
const tezgahlar = await fetch('/api/tezgahlar').then(r => r.json());

// 2. Yeni iş emri oluştur
const yeniIsEmri = await fetch('/api/is-emirleri', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    parca_kodu: 'PR001',
    miktar: 100,
    tezgah_id: tezgahlar[0].tezgah_id,
    aciklama: 'Acil üretim'
  })
}).then(r => r.json());

// 3. Socket.io ile gerçek zamanlı güncellemeleri dinle
socket.on('isEmriGuncellendi', (data) => {
  console.log('İş emri güncellendi:', data);
});
```

### 2. Stok Takibi

```javascript
// Kritik stoktaki malzemeleri getir
const kritikStok = await fetch('/api/stok-kartlari/kritik-stok').then(r => r.json());

// Stok değişikliklerini dinle
socket.on('makindex-stok-guncellemesi', (data) => {
  if (data.yeniStok < data.kritikStok) {
    alert(`Kritik stok uyarısı: ${data.parcaKodu}`);
  }
});
```

### 3. Üretim Planlama

```javascript
// Excel'den üretim planı import et
const formData = new FormData();
formData.append('file', excelFile);

const plan = await fetch('/api/uretim-plani/excel-import', {
  method: 'POST',
  body: formData
}).then(r => r.json());

// Plandan iş emirleri oluştur
const isEmirleri = await fetch('/api/is-emirleri/create-from-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uretim_plani_id: plan.id })
}).then(r => r.json());
```

---

## Rate Limiting ve Güvenlik

- Dosya upload: 100MB limit
- CORS: Tüm origin'lere izin (development için)
- Input validation: Joi schema validation
- SQL Injection protection: Sequelize ORM
- File security: File type filtering

---

## Swagger/OpenAPI

Şu anda otomatik Swagger dokümantasyonu bulunmamaktadır. Manuel dokümantasyon bu dosyada tutulmaktadır.

---

## Versiyon Geçmişi

- **v1.0**: Temel CRUD operasyonları
- **v2.0**: Socket.io entegrasyonu
- **v3.0**: Fason ve sevkiyat modülleri
- **v4.0**: CAD import ve teknik resim analizi
- **v5.0**: Makindex hiyerarşik sistem

---

## İletişim ve Destek

API ile ilgili sorularınız için:
- Backend Developer Team
- Repository: /backend/src/routes/ dizini
- Documentation updates: Bu dosya üzerinden

---

## Development Notes

### API Testing
Postman collection kullanılabilir:
```json
{
  "info": {
    "name": "URTM Takip API",
    "description": "Complete API documentation"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://127.0.0.1:3000/api"
    }
  ]
}
```

### Database Schema
Tüm tablolar ve ilişkiler için: `/backend/src/models/` dizini

### Migrations
Veritabanı migrasyonları için: `/backend/src/migrations/` dizini

### Testing
```bash
cd backend
npm test
```