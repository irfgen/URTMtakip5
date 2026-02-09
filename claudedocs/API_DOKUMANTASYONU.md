# ÜRTM Takip Sistemi - API Dokümantasyonu

## Genel Bilgiler

- **Base URL**: `http://localhost:3000/api` (geliştirme)
- **Production URL**: Domain'inize göre değişir
- **Content-Type**: `application/json`
- **Authentication**: JWT (gelecekte eklenecek)
- **Rate Limiting**: Express-rate-limit ile yapılandırılmış

## CORS Politikası

Tüm origin'lere izin verir (geliştirme):
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## API Endpoint'leri

### 1. İş Emirleri (Work Orders)

**Base Path**: `/api/is-emirleri`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm iş emirlerini listeler |
| POST | `/` | Yeni iş emri oluşturur |
| PUT | `/:id` | İş emrini günceller |
| DELETE | `/:id` | İş emrini siler |
| GET | `/:id` | İş emri detayını getirir |
| POST | `/sirala` | İş emri önceliklerini günceller |
| POST | `/batch-create` | Excel'den toplu iş emri oluşturur |
| POST | `/create-from-plan` | Üretim planından iş emri oluşturur |
| GET | `/by-uretim-plani/:uretimPlaniId` | Üretim planına göre iş emirleri |
| GET | `/atanabilir-modal` | Atanabilir iş emirlerini getirir (modal için) |
| POST | `/:id/confirm-fason` | Fason durumuna geçiş onayı |

**İş Emri Model**:
```javascript
{
  is_emri_id: Integer,
  is_emri_no: String (unique),
  is_adi: String,
  plan_liste_no: String,
  adet: Integer,
  malzeme: String,
  teslim_tarihi: Date,
  oncelik: Enum ['dusuk', 'normal', 'yuksek', 'acil'],
  durum: String (default: 'beklemede'),
  tezgah_id: Integer,
  uretim_plani_id: Integer,
  parca_kodu: String,
  aciklama: Text,
  setup_sayisi: Integer,
  cnc_suresi: Float,
  tahmini_isleme_suresi: Integer (vardiya),
  hareketler: JSON,
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 2. Tezgahlar (Workstations)

**Base Path**: `/api/tezgahlar`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm tezgahları listeler |
| POST | `/` | Yeni tezgah oluşturur |
| PUT | `/:id` | Tezgah günceller |
| DELETE | `/:id` | Tezgah siler |
| GET | `/:id` | Tezgah detayını getirir |
| GET | `/:id/durum-log` | Tezgah durum loglarını getirir |

**Tezgah Model**:
```javascript
{
  tezgah_id: Integer,
  tezgah_adi: String,
  tezgah_kodu: String (unique),
  kapasite: Integer,
  durum: String,
  aktif: Boolean (default: true)
}
```

### 3. Parçalar (Parts)

**Base Path**: `/api/parcalar`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm parçaları listeler |
| POST | `/` | Yeni parça oluşturur |
| PUT | `/:id` | Parça günceller |
| DELETE | `/:id` | Parça siler |
| GET | `/:id` | Parça detayını getirir |
| GET | `/arama/:query` | Parça araması |
| POST | `/import` | Parça import eder |
| GET | `/stok/:kod` | Parça stok durumunu getirir |

**Parça Model**:
```javascript
{
  parca_kodu: String (unique, primary key),
  parca_adi: String,
  birim: String,
  stok_miktari: Integer (default: 0),
  min_stok: Integer (default: 0),
  aciklama: Text,
  teknik_resim: String (dosya yolu),
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 4. BOM (Bill of Materials)

**Base Path**: `/api/boms`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm BOM'ları listeler |
| POST | `/` | Yeni BOM oluşturur |
| PUT | `/:id` | BOM günceller |
| DELETE | `/:id` | BOM siler |
| GET | `/:id` | BOM detayını getirir |
| GET | `/:id/parcalar` | BOM parçalarını getirir |
| POST | `/analiz` | BOM analizi yapar |
| GET | `/makina/:makinaId` | Makina BOM'larını getirir |

**BOM Model**:
```javascript
{
  bom_id: Integer,
  bom_adi: String,
  makina_id: Integer,
  versiyon: String,
  toplam_maliyet: Float (default: 0),
  aktif: Boolean (default: true),
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 5. Üretim Planı (Production Planning)

**Base Path**: `/api/uretim-plani`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm üretim planlarını listeler |
| POST | `/` | Yeni üretim planı oluşturur |
| PUT | `/:id` | Üretim planı günceller |
| DELETE | `/:id` | Üretim planı siler |
| GET | `/:id` | Üretim planı detayını getirir |
| POST | `/excel-import` | Excel'den import eder |
| GET | `/:id/is-emirleri` | Plan iş emirlerini getirir |
| POST | `/kritik-stok` | Kritik stok analizi |

**Üretim Planı Model**:
```javascript
{
  uretim_plani_id: Integer,
  plan_adi: String,
  plan_tipi: Enum ['makine', 'ozel-liste', 'karma'],
  baslama_tarihi: Date,
| bitis_tarihi: Date,
  durum: String (default: 'hazir'),
  excel_dosyasi: String (dosya yolu),
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 6. Üretim Planları V2

**Base Path**: `/api/uretim-planlari`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm planları listeler (V2) |
| POST | `/` | Yeni plan oluşturur (V2) |
| PUT | `/:id` | Plan günceller (V2) |
| DELETE | `/:id` | Plan siler (V2) |

### 7. Fason İşler (Subcontracting)

**Base Path**: `/api/fason`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm fason işleri listeler |
| POST | `/` | Yeni fason işi oluşturur |
| PUT | `/:id` | Fason işi günceller |
| DELETE | `/:id` | Fason işi siler |
| GET | `/:id` | Fason işi detayını getirir |
| POST | `/:id/onayla` | Fason işi onaylar |

### 8. Fason Gruplar

**Base Path**: `/api/fason-grup`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm fason gruplarını listeler |
| POST | `/` | Yeni fason grubu oluşturur |
| PUT | `/:id` | Fason grubu günceller |
| DELETE | `/:id` | Fason grubu siler |

### 9. Sevkiyat (Shipping)

**Base Path**: `/api/sevkiyat`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm sevkiyatları listeler |
| POST | `/` | Yeni sevkiyat oluşturur |
| PUT | `/:id` | Sevkiyat günceller |
| DELETE | `/:id` | Sevkiyat siler |
| GET | `/:id` | Sevkiyat detayını getirir |
| POST | `/:id/resim` | Resim yükler |
| GET | `/raporlar` | Sevkiyat raporları |

**Sevkiyat Model**:
```javascript
{
  sevkiyat_id: Integer,
  musteri_adi: String,
  teslim_tarihi: Date,
| adres: Text,
  durum: String (default: 'hazirlaniyor'),
  aciklama: Text,
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 10. Sevkiyat Kalemleri

**Base Path**: `/api/sevkiyat-kalemleri`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm kalemleri listeler |
| POST | `/` | Yeni kalem oluşturur |
| PUT | `/:id` | Kalem günceller |
| DELETE | `/:id` | Kalem siler |

### 11. Stok Kartları (Inventory Cards)

**Base Path**: `/api/stok-kartlari`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm stok kartlarını listeler |
| POST | `/` | Yeni stok kartı oluşturur |
| PUT | `/:id` | Stok kartı günceller |
| DELETE | `/:id` | Stok kartı siler |
| GET | `/:id` | Stok kartı detayını getirir |
| GET | `/:id/hareketler` | Stok hareketlerini getirir |

**Stok Kartı Model**:
```javascript
{
  stok_karti_id: Integer,
  stok_kodu: String (unique),
  stok_adi: String,
  birim: String,
  mevcut_stok: Integer (default: 0),
  min_stok: Integer (default: 0),
  maks_stok: Integer,
  kritik_seviye: Integer,
  aciklama: Text,
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 12. Stok Hareketleri

**Base Path**: `/api/stok-karti`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/hareket-ekle` | Stok hareketi ekler |
| GET | `/hareket-raporu` | Stok hareket raporu |

### 13. Arıza/Bakım (Maintenance)

**Base Path**: `/api/ariza-bakim`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm arıza/bakım kayıtlarını listeler |
| POST | `/` | Yeni arıza/bakım kaydı oluşturur |
| PUT | `/:id` | Kaydı günceller |
| DELETE | `/:id` | Kaydı siler |
| GET | `/:id` | Kayıt detayını getirir |

**Arıza/Bakım Model**:
```javascript
{
  ariza_bakim_id: Integer,
  tezgah_id: Integer,
  tip: Enum ['ariza', 'bakim'],
| baslik: String,
  aciklama: Text,
  durum: String (default: 'acik'),
  baslama_tarihi: Date,
  bitis_tarihi: Date,
  personel_id: Integer,
  maliyet: Float,
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 14. Vardiyalar (Shifts)

**Base Path**: `/api/vardiyalar`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm vardiyaları listeler |
| POST | `/` | Yeni vardiya oluşturur |
| PUT | `/:id` | Vardiya günceller |
| DELETE | `/:id` | Vardiya siler |
| GET | `/:id` | Vardiya detayını getirir |
| GET | `/:id/personel` | Vardiya personelini getirir |

### 15. Personel

**Base Path**: `/api/personel`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm personeli listeler |
| POST | `/` | Yeni personel oluşturur |
| PUT | `/:id` | Personel günceller |
| DELETE | `/:id` | Personel siler |

### 16. Vardiya Atamaları

**Base Path**: `/api/vardiya-atama`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm atamaları listeler |
| POST | `/` | Yeni atama oluşturur |
| PUT | `/:id` | Atama günceller |
| DELETE | `/:id` | Atama siler |

### 17. Raporlar (Reports)

**Base Path**: `/api/raporlar`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/is-emri/:id` | İş emri raporu |
| GET | `/tezgah/:id` | Tezgah raporu |
| GET | `/uretim-istatistikleri` | Üretim istatistikleri |
| GET | `/gunluk-vardiya` | Günlük vardiya raporu |
| GET | `/vardiya-bolmesi` | Vardiya bölümü raporu |

### 18. Günlük Vardiya Raporu

**Base Path**: `/api/raporlar/gunluk-vardiya`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Günlük vardiya özeti |
| GET | `/detayli` | Detaylı vardiya raporu |

### 19. Tedarik (Procurement)

**Base Path**: `/api/tedarik`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/talepler` | Tüm tedarik taleplerini listeler |
| POST | `/talep` | Yeni talep oluşturur |
| PUT | `/talep/:id` | Talebi günceller |
| DELETE | `/talep/:id` | Talebi siler |
| GET | `/firmalar` | Tüm firmaları listeler |
| POST | `/firma` | Yeni firma oluşturur |

### 20. Notlar (Notes)

**Base Path**: `/api/notlar`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm notları listeler |
| POST | `/` | Yeni not oluşturur |
| PUT | `/:id` | Notu günceller |
| DELETE | `/:id` | Notu siler |
| GET | `/kategoriler` | Kategorileri listeler |
| POST | `/kategori` | Yeni kategori oluşturur |

### 21. Kategoriler

**Base Path**: `/api/kategoriler`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm kategorileri listeler |
| POST | `/` | Yeni kategori oluşturur |
| PUT | `/:id` | Kategori günceller |
| DELETE | `/:id` | Kategori siler |

### 22. Makinalar (Machines)

**Base Path**: `/api/makinalar` (yeni modüler yapı)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm makineleri listeler |
| POST | `/` | Yeni makina oluşturur |
| PUT | `/:id` | Makina günceller |
| DELETE | `/:id` | Makina siler |
| GET | `/:id` | Makina detayını getirir |

### 23. Makina Sipariş

**Base Path**: `/api/makina-siparis`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm siparişleri listeler |
| POST | `/` | Yeni sipariş oluşturur |
| PUT | `/:id` | Siparişi günceller |
| DELETE | `/:id` | Siparişi siler |

### 24. Makina Stok

**Base Path**: `/api/makina-stok`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm stokları listeler |
| POST | `/` | Yeni stok oluşturur |
| PUT | `/:id` | Stoğu günceller |
| DELETE | `/:id` | Stoğu siler |

### 25. Makindex (Hiyerarşik Makina Sistemi)

**Base Path**: `/api/makindex`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/siniflar` | Tüm sınıfları listeler |
| GET | `/boms` | BOM ağacını getirir |
| POST | `/boms` | Yeni BOM ekler |
| PUT | `/boms/:id` | BOM günceller |
| DELETE | `/boms/:id` | BOM siler |
| GET | `/stok` | Stok durumunu getirir |

### 26. Faturalar (Invoices)

**Base Path**: `/api/faturalar`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm faturaları listeler |
| POST | `/` | Yeni fatura oluşturur |
| PUT | `/:id` | Fatura günceller |
| DELETE | `/:id` | Fatura siler |
| GET | `/:id` | Fatura detayını getirir |
| POST | `/:id/kalem` | Kalem ekler |
| GET | `/:id/kalemler` | Kalemleri getirir |

**Fatura Model**:
```javascript
{
  fatura_id: Integer,
  fatura_no: String (unique),
  musteri_adi: String,
  tarih: Date,
  toplam_tutar: Float (default: 0),
  durum: String (default: 'taslak'),
| aciklama: Text,
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 27. İrsaliyeler (Delivery Notes)

**Base Path**: `/api/irsaliyeler`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm irsaliyeleri listeler |
| POST | `/` | Yeni irsaliye oluşturur |
| PUT | `/:id` | İrsaliye günceller |
| DELETE | `/:id` | İrsaliye siler |
| GET | `/:id` | İrsaliye detayını getirir |
| POST | `/:id/kalem` | Kalem ekler |
| GET | `/:id/kalemler` | Kalemleri getirir |

**İrsaliye Model**:
```javascript
{
  irsaliye_id: Integer,
  irsaliye_no: String (unique),
  musteri_adi: String,
  tarih: Date,
  durum: String (default: 'hazirlaniyor'),
  aciklama: Text,
  olusturma_tarihi: Date,
  guncelleme_tarihi: Date
}
```

### 28. Eşleştirme (Matching)

**Base Path**: `/api/eslestirme`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/fatura-irsaliye` | Fatura-irsaliye eşleştirme |
| POST | `/eslestir` | Eşleştirme yapar |
| DELETE | `/eslestirme/:id` | Eşleştirmeyi kaldırır |

### 29. Satış (Sales)

**Base Path**: `/api/satis`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm satışları listeler |
| POST | `/` | Yeni satış oluşturur |
| PUT | `/:id` | Satış günceller |
| DELETE | `/:id` | Satış siler |

### 30. Firmalar

**Base Path**: `/api/firmalar`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm firmaları listeler |
| POST | `/` | Yeni firma oluşturur |
| PUT | `/:id` | Firma günceller |
| DELETE | `/:id` | Firma siler |

### 31. Tezgah İş Planı (Workstation Scheduler)

**Base Path**: `/api/scheduler` ve `/api/tezgah-is-plani`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/jobs` | Planlanan işleri getirir |
| POST | `/schedule` | İş planlar |
| PUT | `/job/:id` | İş planını günceller |
| DELETE | `/job/:id` | İş planını siler |
| GET | `/timeline` | Timeline verilerini getirir |

### 32. Timeline

**Base Path**: `/api/timeline`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Timeline verilerini getirir |
| POST | `/` | Yeni olay ekler |
| PUT | `/:id` | Olay günceller |
| DELETE | `/:id` | Olay siler |

### 33. Upload (File Upload)

**Base Path**: `/api/upload`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/teknik-resim` | Teknik resim yükler |
| POST | `/dokuman` | Doküman yükler |
| POST | `/resim` | Genel resim yükler |

**Upload Limitleri**:
- Maksimum dosya boyutu: 100MB
- Desteklenen formatlar: PNG, JPG, JPEG, PDF

### 34. Download (File Download)

**Base Path**: `/api/download`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Dosya indirir |
| GET | `/zip` | Zip olarak indirir |

### 35. CAD Import

**Base Path**: `/api/cad-import`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/clients` | Bağlı client'ları listeler |
| POST | `/job` | Yeni iş oluşturur |
| POST | `/start/:clientId` | İş başlatır |
| POST | `/stop/:jobId` | İş durdurur |

### 36. CNC Link

**Base Path**: `/api/cnc_link`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/status` | CNC panel durumunu getirir |
| POST | `/connect` | CNC panel'e bağlanır |
| POST | `/disconnect` | CNC panel bağlantısını keser |

### 37. Dizin Tarama

**Base Path**: `/api/dizin-tarama`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/` | Dizin tarar |
| GET | `/sonuclar` | Tarama sonuçlarını getirir |

### 38. İç/Dış Import-Export

**Base Path**: `/api/import-export`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/import` | Veri import eder |
| GET | `/export` | Veri export eder |

### 39. Otomatik Sevkiyat

**Base Path**: `/api/shipment-automation`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/status` | Servis durumunu getirir |
| POST | `/start` | Servisi başlatır |
| POST | `/stop` | Servisi durdurur |
| GET | `/jobs` | Aktif işleri listeler |

### 40. İş Emri Taslakları

**Base Path**: `/api/is-emri-taslaklari`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm taslakları listeler |
| POST | `/` | Yeni taslak oluşturur |
| PUT | `/:id` | Taslak günceller |
| DELETE | `/:id` | Taslak siler |
| POST | `/:id/ugrate` | Taslaktan iş emri oluşturur |

### 41. İş Emri Durumları

**Base Path**: `/api/is-emri-durumlari`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm durumları listeler |
| POST | `/` | Yeni durum oluşturur |
| PUT | `/:id` | Durum günceller |
| DELETE | `/:id` | Durum siler |

### 42. İşlem Kayıtları

**Base Path**: `/api/islem-kayitlari`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Tüm kayıtları listeler |
| POST | `/` | Yeni kayıt oluşturur |
| GET | `/:isEmriId` | İş emri kayıtlarını getirir |

## WebSocket Events

### General Namespace (`/`)

**Client → Server**:
```javascript
// İş emri güncellemeleri
socket.emit('isEmriGuncellendi', data)

// Makindex events
socket.emit('makindex-join')
socket.emit('makindex-leave')

// Stok değişiklikleri
socket.emit('stok-degisti', { parcaKodu, yeniStok, oncekiStok })

// Parça ekleme
socket.emit('parca-eklendi', { parcaKodu, parcaAdi, bomId })

// BOM güncellemeleri
socket.emit('bom-guncellendi', { bomId, makinaId, degisiklik })

// Makina sınıfı güncellemeleri
socket.emit('makina-sinifi-guncellendi', { sinifId, degisiklik })
```

**Server → Client**:
```javascript
// İş emri güncellemeleri
socket.on('isEmriGuncellendi', data)

// Makindex güncellemeleri
socket.on('makindex-stok-guncellemesi', data)
socket.on('makindex-parca-eklendi', data)
socket.on('makindex-bom-guncellemesi', data)
socket.on('makindex-sinif-guncellemesi', data)
```

### CAD Import Namespace (`/cad-import`)

**Client → Server**:
```javascript
// Client kayıt
socket.emit('register-client', { client_id, client_name, client_info })

// İş progress
socket.emit('job-progress', { job_id, progress, status, client_id })

// Dosya işleme
socket.emit('file-processed', { file_path, status, client_id, thumbnail_path })

// Heartbeat
socket.emit('heartbeat')
```

**Server → Client**:
```javascript
// Kayıt başarılı
socket.on('registration-success', { message, client_id })

// Kayıt hatası
socket.on('registration-error', { error })

// İş başlatma komutu
socket.on('start-job-command', job_config)

// İş durdurma komutu
socket.on('stop-job-command', { job_id })

// Client bağlandı bildirimi
socket.on('client-connected', { client_id, client_name, connected_at })

// Client ayrıldı bildirimi
socket.on('client-disconnected', { client_id, client_name, disconnected_at })
```

### Fatura Eşleştirme Namespace

**Server → Client**:
```javascript
// Fatura güncellemesi
socket.on('fatura-guncellendi', faturaData)

// İrsaliye güncellemesi
socket.on('irsaliye-guncellendi', irsaliyeData)

// Eşleştirme güncellemesi
socket.on('eslestirme-guncellendi', eslestirmeData)
```

## Response Format'ları

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Hata mesajı",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Validasyon hatası",
  "validationErrors": [
    {
      "field": "email",
      "message": "Geçersiz e-posta adresi"
    }
  ]
}
```

## Rate Limiting

API endpoint'leri için rate limiting uygulanır:

- **General**: 100 istek / 15 dakika
- **Upload**: 10 istek / 15 dakika
- **Heavy Operations**: 5 istek / 15 dakika

Rate limit aşıldığında:
```json
{
  "error": "Çok fazla istek",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

## Pagination

List endpoint'lerinde pagination desteklenir:

```
GET /api/parcalar?page=1&limit=20&sort=parca_adi&order=ASC
```

**Query Parametreleri**:
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına öğe sayısı (default: 20, max: 100)
- `sort`: Sıralama alanı
- `order`: Sıralama yönü (ASC, DESC)

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Filtering

Arama ve filtreleme desteklenir:

```
GET /api/parcalar?arama=kelime&durum=aktif&min_stok=10
```

## HTTP Status Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Yetkisiz |
| 403 | Yasaklı |
| 404 | Bulunamadı |
| 413 | Payload çok büyük (100MB limit) |
| 422 | Validasyon hatası |
| 429 | Rate limit aşıldı |
| 500 | Sunucu hatası |
| 503 | Hizmet kullanılamıyor |
