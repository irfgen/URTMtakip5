# ÜRTM Takip Sistemi - Proje Dokümantasyonu

## 📋 İçindekiler

- [Sistem Genel Bakış](#sistem-genel-bakış)
- [Mimari](#mimari)
- [Backend Yapısı](#backend-yapısı)
- [Frontend Yapısı](#frontend-yapısı)
- [Veritabanı Şeması](#veritabanı-şeması)
- [API Endpoints](#api-endpoints)
- [CNC Panel (ESP32)](#cnc-panel-esp32)
- [Python CAD Araçları](#python-cad-araçları)
- [Geliştirme Komutları](#geliştirme-komutları)

---

## Sistem Genel Bakış

**ÜRTM Takip Sistemi**, üretim takibi, iş emri yönetimi, stok kontrolü ve CNC tezgah izleme yeteneklerine sahip kapsamlı bir üretim yönetim sistemidir.

### Temel Özellikler

| Modül | Açıklama |
|-------|----------|
| **İş Emirleri** | Üretim iş emirlerinin oluşturulması ve takibi |
| **Tezgahlar** | CNC tezgahlarının yönetimi ve durum izleme |
| **Parçalar** | Parça katalogu ve teknik resim yönetimi |
| **Üretim Planı** | BOM tabanlı üretim planlaması |
| **Stok Kartları** | Stok yönetimi ve takip listeleri |
| **Fason İşler** | Alt yüklenici iş yönetimi |
| **Sevkiyat** | Sevkiyat ve teslimat takibi |
| **Arıza-Bakım** | Ekipman bakımı ve arıza kayıtları |
| **Vardiya Yönetimi** | Vardiya ve personel planlaması |
| **Raporlar** | Üretim raporları ve istatistikler |
| **MAKINDEX** | Hiyerarşik parça ve BOM yönetimi |

---

## Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                         ÜRTM Takip Sistemi                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Frontend      │    │    Backend      │    │  CNC Panel   │ │
│  │  (React + Vite) │◄──►│  (Express.js)   │◄──►│   (ESP32)    │ │
│  │   Port: 5173    │    │    Port: 3000   │    │   WiFi       │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                  ▲                              │
│                                  │                              │
│                        ┌─────────┴─────────┐                    │
│                        │   SQLite Database │                    │
│                        │  database.sqlite  │                    │
│                        └───────────────────┘                    │
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ STEP BOM        │    │ CAD Import      │                     │
│  │ Analyzer        │    │ Client          │                     │
│  │ (Python +       │    │ (Python +       │                     │
│  │  FreeCAD)       │    │  SolidWorks)    │                     │
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Teknoloji Yığını

#### Backend
- **Framework:** Express.js 4.18
- **Veritabanı:** SQLite + Sequelize ORM
- **Real-time:** Socket.IO 4.7
- **Logging:** Winston 3.11
- **Güvenlik:** Helmet 7.1
- **Dosya Yükleme:** Multer 2.0
- **Görüntü İşleme:** Sharp 0.32
- **OCR:** Tesseract.js 4.1
- **Migrasyon:** Umzug 3.8

#### Frontend
- **Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **UI Kütüphanesi:** Material-UI (MUI) 5.17
- **State Yönetimi:** Redux Toolkit 2.0
- **Routing:** React Router 6.20
- **HTTP Client:** Axios 1.9
- **Socket:** Socket.IO Client 4.7
- **Grafikler:** Chart.js 4.4 + React ChartJS-2
- **Form:** Formik 2.4 + Yup 1.6

---

## Backend Yapısı

### Dizin Hiyerarşisi

```
backend/src/
├── config/               # Konfigürasyon dosyaları
│   ├── config.js        # Uygulama konfigürasyonu
│   └── database.js      # Veritabanı bağlantısı ve migrasyonlar
├── controllers/          # İş mantığı kontrolleri
│   ├── isEmriController.js
│   ├── tezgahController.js
│   ├── parcaController.js
│   ├── uretimPlaniController.js
│   ├── fasonController.js
│   ├── stokKartlariController.js
│   ├── arizaBakimController.js
│   ├── raporController.js
│   └── ... (50+ controller)
├── models/              # Sequelize veri modelleri
│   ├── index.js        # Model loader ve ilişkiler
│   ├── IsEmri.js
│   ├── Tezgah.js
│   ├── Parca.js
│   ├── Bom.js
│   ├── StokKarti.js
│   ├── UretimPlani.js
│   ├── Fason.js
│   ├── Sevkiyat.js
│   ├── ArizaBakim.js
│   ├── Vardiya.js
│   ├── Personel.js
│   ├── Fatura.js
│   ├── Irsaliye.js
│   └── ... (50+ model)
├── routes/              # API rotaları
│   ├── isEmirleriRoutes.js
│   ├── tezgahRoutes.js
│   ├── parcaRoutes.js
│   ├── bomRoutes.js
│   ├── uretimPlaniRoutes.js
│   ├── fasonRoutes.js
│   ├── sevkiyat.js
│   ├── arizaBakimRoutes.js
│   ├── notlarRoutes.js
│   ├── vardiyaRoutes.js
│   ├── personelRoutes.js
│   └── ... (80+ route)
├── middleware/          # Özel middleware'ler
│   ├── errorHandler.js
│   ├── socket.js
│   └── teknikResimUpload.js
├── migrations/          # Veritabanı migrasyonları
│   ├── 20240912000001-add-tahmini-isleme-suresi.js
│   ├── 20250924_add_cost_fields_to_boms.js
│   ├── 20250701000001-create-notlar-tables.js
│   └── ... (15+ migration)
├── modules/             # Modüler yapı
│   └── makinalar/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── repositories/
├── socket/              # Socket.IO namespace'leri
│   └── namespaces/
│       └── faturaEslestirme.js
├── services/            # Servis katmanı
│   └── shipmentAutomationService.js
└── index.js            # Uygulama giriş noktası
```

### Modüller

#### 1. İş Emirleri (IsEmri)
- İş emri oluşturma, düzenleme, silme
- Durum yönetimi (Bekliyor, Devam Ediyor, Tamamlandı)
- İş emri taslakları yönetimi
- İşlem kayıtları takibi

#### 2. Tezgahlar (Tezgah)
- Tezgah kartları yönetimi
- Tezgah planlama
- Tezgah durum logları
- Tezgah raporları

#### 3. Parçalar (Parca)
- Parça katalogu
- Teknik resim yükleme
- Parça kayıtları
- Parça birleştirme geçmişi

#### 4. BOM Yönetimi (Bom)
- Hiyerarşik BOM yapısı
- Makine grup-parça ilişkileri
- BOM maliyet analizleri
- BOM görüntüleme ve yazdırma

#### 5. Üretim Planlama (UretimPlani)
- Excel tabanlı üretim planı
- BOM analizi
- Kritik stok uyarıları
- Karma üretim planları
- V2: JSON tabanlı basitleştirilmiş sistem

#### 6. Stok Yönetimi
- Stok kartları
- Stok takip listeleri
- Stok hareketleri
- Otomatik stok güncellemeleri

#### 7. Fason İşler (Fason)
- Fason firma yönetimi
- Fason iş emirleri
- Fason grupları
- Fason teklifleri

#### 8. Sevkiyat (Sevkiyat)
- Sevkiyat oluşturma
- Sevkiyat kalemleri
- Sevkiyat resimleri
- İç sevkiyatlar
- Otomatik sevkiyat servisi

#### 9. Arıza ve Bakım (ArizaBakim)
- Arıza kaydı oluşturma
- Bakım planlama
- Arıza istatistikleri

#### 10. Vardiya Yönetimi (Vardiya)
- Vardiya tanımları
- Personel atamaları
- Günlük vardiya raporları

#### 11. Fatura ve İrsaliye
- Fatura yönetimi
- İrsaliye oluşturma
- Fatura-İrsaliye eşleştirme
- Socket.IO tabanlı gerçek zamanlı eşleştirme

#### 12. MAKINDEX
- Hiyerarşik makine sınıfları
- BOM ağaç yapısı
- Gerçek zamanlı stok güncellemeleri
- WebSocket bildirimleri

---

## Frontend Yapısı

### Dizin Hiyerarşisi

```
frontend/src/
├── pages/                   # Sayfa bileşenleri
│   ├── Dashboard.jsx
│   ├── Tezgahlar.jsx
│   ├── Parcalar.jsx
│   ├── ParcaDetay.jsx
│   ├── IsEmirleri.jsx
│   ├── UretimPlani.jsx
│   ├── StokKartlari.jsx
│   ├── Fason.jsx
│   ├── Sevkiyat.jsx
│   ├── ArizaBakim/
│   │   ├── ArizaBakimListesi.jsx
│   │   ├── ArizaBakimEkle.jsx
│   │   └── ArizaBakimDetay.jsx
│   ├── mobile/             # Mobil sayfalar
│   │   ├── DashboardMobile.jsx
│   │   ├── TezgahlarMobile.jsx
│   │   ├── IsEmirleriMobileYeni.jsx
│   │   ├── UretimPlaniMobile.jsx
│   │   └── ... (30+ mobile page)
│   └── ... (50+ page)
├── components/              # Ortak bileşenler
│   ├── Layout.jsx
│   ├── MobileLayout.jsx
│   ├── IsEmriKarti.jsx
│   ├── TezgahKarti.jsx
│   ├── ParcaKarti.jsx
│   ├── BomForm.jsx
│   ├── UretimPlani/
│   │   ├── UretimPlaniForm.jsx
│   │   ├── BomAnalyzeForm.jsx
│   │   └── MakinaGroupPartsPage.jsx
│   ├── WorkstationScheduler/
│   │   ├── WorkstationScheduler.jsx
│   │   ├── TaskCard.jsx
│   │   └── ConflictDetector.jsx
│   ├── mobile/             # Mobil bileşenler
│   │   ├── IsEmriKartiMobile.jsx
│   │   ├── MobilParcaSecici.jsx
│   │   └── ... (40+ mobile component)
│   ├── Notlar/
│   ├── Uygunsuzluklar/
│   ├── VardiyaYonetimi/
│   ├── StokTakipListeleri/
│   └── ... (200+ component)
├── store/                   # Redux Store
│   ├── index.js
│   ├── store.js
│   └── slices/
│       ├── isEmirleriSlice.js
│       ├── uretimPlaniSlice.js
│       ├── schedulerSlice.js
│       ├── makindexSlice.js
│       ├── arizaBakimSlice.js
│       ├── uygunsuzluklarSlice.js
│       ├── personelSlice.js
│       └── timelineSlice.js
├── hooks/                   # Özel React Hooks
│   ├── useDeviceDetect.js
│   ├── useDeviceOverride.js
│   ├── useStokKartlari.js
│   └── usePullToRefresh.js
├── services/                # API servisleri
│   ├── api.js              # Ana API client
│   ├── socket.js           # Socket.IO service
│   ├── cacheService.js     # Cache servisi
│   ├── stokKartlariService.js
│   ├── notlarService.js
│   └── ... (15+ service)
├── utils/                   # Yardımcı fonksiyonlar
├── theme.js                 # Desktop tema
├── theme.mobile.js          # Mobil tema
├── App.jsx                  # Ana uygulama bileşeni
└── main.jsx                 # Uygulama giriş noktası
```

### Redux State Yönetimi

```javascript
{
  arizaBakim: { ... },      // Arıza bakım state
  isEmirleri: { ... },      // İş emirleri state
  uretimPlani: { ... },     // Üretim planı state
  timeline: { ... },        // Timeline state
  scheduler: { ... },       // Workstation scheduler state
  makindex: { ... },        // MAKINDEX state
  uygunsuzluklar: { ... },  // Uygunsuzluklar state
  personel: { ... }         // Personel state
}
```

### Cihaz Algılama

Uygulama otomatik olarak mobil ve masaüstü cihazları algılar:

- **Mobil:** `/mobile/*` rotaları, mobil tema, dokunmatik optimizasyon
- **Desktop:** Standart rotalar, masaüstü tema

---

## Veritabanı Şeması

### Temel Tablolar

| Tablo | Açıklama |
|-------|----------|
| `is_emirleri` | İş emirleri |
| `tezgahlar` | Tezgah/İstasyon bilgileri |
| `parcalar` | Parça katalogu |
| `boms` | Malzeme listeleri (BOM) |
| `stok_kartlari` | Stok kartları |
| `uretim_plani` | Üretim planları (ana sistem) |
| `uretim_planlari` | Üretim planları V2 |
| `sevkiyat` | Sevkiyat kayıtları |
| `fason` | Fason firmalar |
| `ariza_bakim` | Arıza ve bakım kayıtları |
| `vardiyalar` | Vardiya tanımları |
| `personel` | Personel bilgileri |
| `faturalar` | Fatura kayıtları |
| `irsaliyeler` | İrsaliye kayıtları |
| `notlar` | Not sistemi |
| `makina_siniflari` | MAKINDEX makine sınıfları |

### Model İlişkileri

```javascript
// Örnek ilişkiler
IsEmri.belongsTo(Parca);
IsEmri.belongsTo(Tezgah);
Parca.hasMany(Bom);
Bom.belongsTo(MakinaSinifi);
StokKarti.hasMany(StokHareket);
Sevkiyat.hasMany(SevkiyatKalem);
Fatura.hasMany(FaturaKalem);
```

---

## API Endpoints

### İş Emirleri
```
GET    /api/is-emirleri          - Tüm iş emirlerini listele
POST   /api/is-emirleri          - Yeni iş emri oluştur
GET    /api/is-emirleri/:id      - İş emri detayı
PUT    /api/is-emirleri/:id      - İş emri güncelle
DELETE /api/is-emirleri/:id      - İş emri sil
```

### Tezgahlar
```
GET    /api/tezgahlar            - Tüm tezgahları listele
POST   /api/tezgahlar            - Yeni tezgah oluştur
GET    /api/tezgahlar/:id        - Tezgah detayı
PUT    /api/tezgahlar/:id        - Tezgah güncelle
DELETE /api/tezgahlar/:id        - Tezgah sil
GET    /api/tezgah-durum         - Tezgah durumları
```

### Parçalar
```
GET    /api/parcalar             - Tüm parçaları listele
POST   /api/parcalar             - Yeni parça oluştur
GET    /api/parcalar/:parcaKodu  - Parça detayı
PUT    /api/parcalar/:parcaKodu  - Parça güncelle
DELETE /api/parcalar/:parcaKodu  - Parça sil
POST   /api/parcalar/import      - Parça içe aktar
```

### BOM
```
GET    /api/boms                 - Tüm BOM'ları listele
POST   /api/boms                 - Yeni BOM oluştur
GET    /api/boms/:id             - BOM detayı
PUT    /api/boms/:id             - BOM güncelle
DELETE /api/boms/:id             - BOM sil
```

### Üretim Planı
```
GET    /api/uretim-plani         - Üretim planları
POST   /api/uretim-plani         - Yeni üretim planı
GET    /api/uretim-plani/:id     - Plan detayı
PUT    /api/uretim-plani/:id     - Plan güncelle
POST   /api/uretim-plani/analyze - BOM analizi
```

### Stok Kartları
```
GET    /api/stok-kartlari        - Stok kartları listesi
POST   /api/stok-kartlari        - Yeni stok kartı
GET    /api/stok-kartlari/:id    - Stok kartı detayı
PUT    /api/stok-kartlari/:id    - Stok güncelle
POST   /api/stok-kartlari/hareket-ekle - Stok hareketi ekle
```

### MAKINDEX
```
GET    /api/makindex/siniflar    - Makine sınıfları
GET    /api/makindex/boms        - MAKINDEX BOM'ları
POST   /api/makindex/boms        - Yeni BOM oluştur
GET    /api/makindex/agac        - Hiyerarşik ağaç
POST   /api/makindex/siniflar    - Yeni sınıf oluştur
```

### Sevkiyat
```
GET    /api/sevkiyat             - Sevkiyat listesi
POST   /api/sevkiyat             - Yeni sevkiyat
GET    /api/sevkiyat/:id         - Sevkiyat detayı
PUT    /api/sevkiyat/:id         - Sevkiyat güncelle
POST   /api/sevkiyat/resim       - Resim yükle
```

### Fason
```
GET    /api/fason                - Fason firmalar
POST   /api/fason                - Yeni fason firma
GET    /api/fason-grup           - Fason grupları
POST   /api/fason-grup           - Yeni fason grup
```

### Arıza Bakım
```
GET    /api/ariza-bakim          - Arıza listesi
POST   /api/ariza-bakim          - Yeni arıza kaydı
GET    /api/ariza-bakim/:id      - Arıza detayı
PUT    /api/ariza-bakim/:id      - Arıza güncelle
```

### Raporlar
```
GET    /api/raporlar/uretim      - Üretim raporu
GET    /api/raporlar/tezgah      - Tezgah raporu
GET    /api/raporlar/gunluk-vardiya - Günlük vardiya raporu
```

### Vardiya Yönetimi
```
GET    /api/vardiyalar           - Vardiya listesi
POST   /api/vardiyalar           - Yeni vardiya
GET    /api/personel             - Personel listesi
POST   /api/vardiya-atama        - Vardiya ataması
```

### Fatura ve İrsaliye
```
GET    /api/faturalar            - Fatura listesi
POST   /api/faturalar            - Yeni fatura
GET    /api/faturalar/:id        - Fatura detayı
GET    /api/irsaliyeler          - İrsaliye listesi
POST   /api/irsaliyeler          - Yeni irsaliye
GET    /api/eslestirme           - Eşleştirme sayfası
```

### Notlar
```
GET    /api/notlar               - Not listesi
POST   /api/notlar               - Yeni not
GET    /api/kategoriler          - Kategori listesi
POST   /api/kategoriler          - Yeni kategori
```

### Socket.IO Events
``// Client → Server
socket.emit('isEmriGuncellendi', data)
socket.emit('makindex-join')
socket.emit('stok-degisti', data)
socket.emit('bom-guncellendi', data)

// Server → Client
socket.on('isEmriGuncellendi', data)
socket.on('makindex-stok-guncellemesi', data)
socket.on('makindex-bom-guncellemesi', data)
```

---

## CNC Panel (ESP32)

### Donanım
- **MCU:** ESP32
- **Platform:** PlatformIO
- **Framework:** Arduino
- **Bağlantı:** Wi-Fi

### Durum Kodları
| Kod | Durum |
|-----|-------|
| 0   | Boşta / Hazır |
| 1   | Çalışıyor |
| 2   | Hata / Bakım Gerekli |

### Ana Dosyalar
```
CNC_panel/
├── src/
│   ├── main.cpp              # Ana uygulama
│   ├── cnc_monitor.cpp       # CNC izleme
│   └── cnc_link.cpp          # Sunucu bağlantısı
├── include/
│   └── config.h              # Konfigürasyon
└── platformio.ini            # PlatformIO ayarları
```

### Komutlar
```bash
cd CNC_panel
pio run              # Derle
pio run -t upload    # Yükle
pio device monitor   # Seri monitör
```

---

## Python CAD Araçları

### STEP_BOM_Analyzer

STEP dosyalarından BOM çıkarımı ve 3D görüntüleme aracı.

**Özellikler:**
- STEP dosyası ayrıştırma
- BOM çıkarımı
- 3D görüntüleme (FreeCAD)
- Çoklu export formatı (JSON, Excel, CSV, XML)
- API entegrasyonu

**Bağımlılıklar:**
- FreeCAD
- numpy, matplotlib
- trimesh
- requests

```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt
python main.py
```

### CAD_Import_Client

SolidWorks COM otomasyonu ile küçük resim oluşturma aracı (Windows only).

**Özellikler:**
- SolidWorks COM entegrasyonu
- Toplu dosya işleme
- HTTP ile sunucu iletişimi
- WebSocket desteği

**Bağımlılıklar:**
- SolidWorks (Windows)
- win32com.client
- requests

```bash
cd CAD_Import_Client
pip install -r requirements.txt
python main.py
```

---

## Geliştirme Komutları

### Proje Başlatma

```bash
# Tüm bağımlılıkları yükle
npm run install:all

# Geliştirme sunucularını başlat (backend + frontend)
npm run dev

# Sadece backend
cd backend && npm run dev

# Sadece frontend
cd frontend && npm run dev
```

### Port Yapılandırması

| Servis | Port | Not |
|--------|------|-----|
| Backend | 3000 | Sabit |
| Frontend | 5173 | Sabit |

### Build ve Production

```bash
# Frontend build
npm run build

# Production start
npm run start

# Testler
npm test              # Backend
npm run test:frontend # Frontend
```

### Veritabanı Migrasyonları

```bash
cd backend
npm run migrate           # Tüm migrasyonları çalıştır
npm run migrate-durum     # Durum modülü migrasyonu
npm run check-durum-status # Durum kontrolü
```

### Temizlik

```bash
npm run clean:all      # Tüm node_modules sil
```

---

## Socket.IO Namespace'leri

### Main Namespace
- Genel iletişim
- İş emri güncellemeleri

### CAD Import Namespace (`/cad-import`)
- CAD istemci kaydı
- İş ilerlemesi bildirimleri
- Dosya işleme durumları

### Fatura Eşleştirme Namespace
- Fatura-İrsaliye eşleştirme
- Gerçek zamanlı eşleşme bildirimleri

---

## Middleware'ler

### Helmet
- Güvenlik header'ları
- CORS politikası

### Compression
- Response sıkıştırma

### Static File Serving
- `/uploads` - Yüklenen dosyalar
- `/importlar` - İçe aktarılan dosyalar

### Error Handler
- Global hata yakalama
- 413 Payload Too Large handling

---

## Logging

Winston tabanlı logging:

```javascript
// Log seviyeleri
logger.error()  // Hatalar
logger.warn()   // Uyarılar
logger.info()   // Bilgi
logger.debug()  // Debug
```

Log dosyaları:
- `error.log` - Sadece hatalar
- `combined.log` - Tüm loglar

---

## Güvenlik

### Helmet Konfigürasyonu
```javascript
helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})
```

### CORS
- Tüm originlere izin (development)
- Production'da kısıtlanmalı

### Rate Limiting
- API endpoint'leri için rate limiting

---

## Performans Optimizasyonları

### Backend
- SQLite WAL mode
- Connection pooling
- Response compression
- Image optimization (Sharp)
- Caching servisi

### Frontend
- Code splitting
- Component lazy loading
- Image lazy loading
- Redux state normalization

---

## Deployment

### Production Build
```bash
npm run build
```

### PM2 Konfigürasyonu
```bash
pm2 start pm2.config.json
```

### Nginx Konfigürasyonu
- Reverse proxy setup
- Static file serving
- SSL configuration

---

## Lisans ve Bilgi

**Versiyon:** 17.x
**Son Güncelleme:** 2025
**Geliştirici:** ÜRTM Takip Sistemi Ekibi

---

## Destek ve İletişim

Sorunlar için: [GitHub Issues](https://github.com/anthropics/claude-code/issues)

---

*Bu dokümantasyon otomatik olarak /sc:index komutu ile oluşturulmuştur.*
