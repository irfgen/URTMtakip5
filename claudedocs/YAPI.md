# ÜRTM Takip Sistemi - Proje Yapısı

## Dizin Ağacı

```
URTMtakip/
├── backend/                    # Express.js backend uygulaması
│   ├── src/
│   │   ├── config/            # Veritabanı ve uygulama yapılandırması
│   │   │   └── database.js    # Sequelize ve migration yönetimi
│   │   ├── controllers/       # İş mantığı controller'ları
│   │   │   ├── isEmirleriController.js
│   │   │   ├── tezgahController.js
│   │   │   ├── parcaController.js
│   │   │   └── ...
│   │   ├── middleware/        # Express middleware'leri
│   │   │   ├── socket.js      # Socket.IO middleware
│   │   │   └── ...
│   │   ├── models/            # Sequelize veri modelleri
│   │   │   ├── IsEmri.js
│   │   │   ├── Tezgah.js
│   │   │   ├── Parca.js
│   │   │   ├── Bom.js
│   │   │   ├── StokKarti.js
│   │   │   ├── Sevkiyat.js
│   │   │   ├── Fatura.js
│   │   │   ├── Irsaliye.js
│   │   │   └── ...
│   │   ├── routes/            # API route tanımlamaları
│   │   │   ├── isEmirleriRoutes.js
│   │   │   ├── tezgahRoutes.js
│   │   │   ├── parcaRoutes.js
│   │   │   ├── bomRoutes.js
│   │   │   ├── sevkiyat.js
│   │   │   ├── irsaliyeler.js
│   │   │   ├── faturalar.js
│   │   │   ├── eslestirme.js
│   │   │   └── ...
│   │   ├── services/          # Business logic servisleri
│   │   │   └── shipmentAutomationService.js
│   │   ├── socket/            # Socket.IO namespace'leri
│   │   │   └── namespaces/
│   │   │       └── faturaEslestirme.js
│   │   ├── queries/           # Veritabanı sorguları
│   │   │   └── gunlukVardiyaQueries.js
│   │   ├── modules/           # Modüler yapı
│   │   │   └── makinalar/     # Makina yönetim modülü
│   │   │       ├── routes/
│   │   │       └── controllers/
│   │   ├── migrations/        # Veritabanı migrateleri
│   │   │   ├── 20240912000001-add-tahmini-isleme-suresi.js
│   │   │   ├── 20250924_add_cost_fields_to_boms.js
│   │   │   └── 20250701000001-create-notlar-tables.js
│   │   ├── uploads/           # Yüklenen dosyalar (teknik resimler)
│   │   └── index.js           # Backend giriş noktası
│   ├── importlar/             # Excel import dosyaları
│   ├── uploads/               # Genel yüklenen dosyalar
│   ├── database.sqlite        # SQLite veritabanı
│   ├── package.json           # Backend bağımlılıkları
│   └── pm2.config.json        # PM2 yapılandırması
│
├── frontend/                  # React + Vite frontend uygulaması
│   ├── public/
│   │   └── uploads/           # Frontend için statik dosyalar
│   ├── src/
│   │   ├── components/        # React bileşenleri
│   │   │   ├── Layout.jsx              # Ana layout (desktop)
│   │   │   ├── MobileLayout.jsx        # Ana layout (mobil)
│   │   │   ├── Dashboard/              # Dashboard bileşenleri
│   │   │   ├── Raporlar/               # Raporlama bileşenleri
│   │   │   │   ├── IsEmriRaporKarti.jsx
│   │   │   │   ├── TezgahVardiyaKarti.jsx
│   │   │   │   ├── VardiyaBolmesi.jsx
│   │   │   │   ├── UretimIstatistikleri.jsx
│   │   │   │   └── TezgahCalismaTablosu.jsx
│   │   │   ├── UretimPlani/            # Üretim planlama bileşenleri
│   │   │   │   ├── ExcelUretimPlaniModal.jsx
│   │   │   │   ├── BomAnalyzeForm.jsx
│   │   │   │   ├── ExcelParcaOlusturModal.jsx
│   │   │   │   └── MakinaGroupPartsPage.jsx
│   │   │   ├── tedarik/                # Tedarik yönetimi
│   │   │   │   ├── TedarikTalepListesi.jsx
│   │   │   │   ├── TedarikTalepForm.jsx
│   │   │   │   └── FirmaYonetimPage.jsx
│   │   │   ├── Notlar/                 # Not sistemi
│   │   │   │   ├── NotlarPage.jsx
│   │   │   │   ├── NotEkleme.jsx
│   │   │   │   └── KategoriYonetimi.jsx
│   │   │   ├── makindex/               # Makindex hiyerarşik sistem
│   │   │   │   └── MakindexPage.jsx
│   │   │   ├── WorkstationScheduler/   # Tezgah iş planı
│   │   │   │   └── WorkstationScheduler.jsx
│   │   │   └── ...                     # Diğer bileşenler
│   │   ├── pages/             # Sayfa bileşenleri
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tezgahlar.jsx
│   │   │   ├── Parcalar.jsx
│   │   │   ├── IsEmirleri.jsx
│   │   │   ├── Makinalar.jsx
│   │   │   ├── UretimPlani.jsx
│   │   │   ├── Raporlar.jsx
│   │   │   ├── Sevkiyat.jsx
│   │   │   ├── Faturalar.jsx
│   │   │   ├── Irsaliyeler.jsx
│   │   │   ├── EslestirmeDesktop.jsx
│   │   │   └── ...
│   │   ├── pages/mobile/       # Mobil sayfa bileşenleri
│   │   │   ├── DashboardMobile.jsx
│   │   │   ├── TezgahlarMobile.jsx
│   │   │   ├── IsEmirleriMobileYeni.jsx
│   │   │   ├── UretimPlaniMobile.jsx
│   │   │   ├── ParcalarMobile.jsx
│   │   │   ├── IrsaliyelerMobile.jsx
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useDeviceDetect.js     # Cihaz algılama
│   │   │   └── ...
│   │   ├── store/             # Redux store
│   │   │   ├── index.js
│   │   │   └── slices/        # Redux slices
│   │   ├── services/          # API client
│   │   │   └── api.js         # Axios instance
│   │   ├── utils/             # Yardımcı fonksiyonlar
│   │   ├── modules/           # Modüler yapı
│   │   │   └── makinalar/     # Makina modülü
│   │   │       ├── components/
│   │   │       └── pages/
│   │   ├── theme.js           # Masaüstü tema
│   │   ├── theme.mobile.js    # Mobil tema
│   │   └── App.jsx            # React ana uygulama
│   ├── tests/                 # Frontend testleri
│   │   └── components/
│   ├── package.json           # Frontend bağımlılıkları
│   └── vite.config.js         # Vite yapılandırması
│
├── CNC_panel/                 # ESP32 CNC Panel projesi
│   ├── include/               # Header dosyaları
│   │   └── config.h           # WiFi ve API yapılandırması
│   ├── src/                   # Kaynak kod
│   │   └── main.cpp           # Ana program
│   ├── platformio.ini         # PlatformIO yapılandırması
│   └── README.md              # ESP32 dokümantasyonu
│
├── STEP_BOM_Analyzer/         # Python STEP BOM analiz aracı
│   ├── main.py                # GUI giriş noktası
│   ├── step_processor.py      # STEP dosya işleme
│   ├── bom_analyzer.py        # BOM analizi
│   ├── requirements.txt       # Python bağımlılıkları
│   └── README.md              # Kullanım kılavuzu
│
├── CAD_Import_Client/         # Python SolidWorks otomasyon
│   ├── main.py                # GUI giriş noktası
│   ├── solidworks_automation.py # SolidWorks COM arayüzü
│   ├── websocket_client.py    # WebSocket iletişimi
│   ├── requirements.txt       # Python bağımlılıkları
│   └── README.md              # Kullanım kılavuzu
│
├── claudedocs/                # Proje dokümantasyonu
│   ├── PROJE_GENEL_BAKIS.md
│   ├── YAPI.md
│   ├── API_DOKUMANTASYONU.md
│   ├── FRONTEND_REHBERI.md
│   ├── VERITABANI_SHEMA.md
│   └── YAYINLAMA.md
│
├── nginx-config.conf          # Nginx yapılandırması
├── package.json               # Root package.json (scripts)
├── CLAUDE.md                  # Claude Code talimatları
└── README.md                  # Proje README
```

## Dizinlerin Amaçları

### `/backend/src/config/`
Uygulama yapılandırma dosyaları:
- `database.js`: Sequelize bağlantısı, migrasyon yönetimi
- Ortam değişkenleri (.env)
- Veritabanı bağlantı havuzu

### `/backend/src/controllers/`
İş mantığı controller'ları. Her modül için ayrı controller:
- İstekleri alır ve doğrular
- Business logic'i uygular
- Veritabanı işlemlerini gerçekleştirir
- Response'ları hazırlar

### `/backend/src/middleware/`
Express middleware'leri:
- `socket.js`: Socket.IO middleware
- Auth middleware (gelecekte)
- Error handling middleware
- Logging middleware

### `/backend/src/models/`
Sequelize veritabanı modelleri:
- Tablo yapıları tanımları
- İlişkiler (has-many, belongs-to, etc.)
- Validasyon kuralları
- Model instance method'ları

### `/backend/src/routes/`
API endpoint tanımlamaları:
- RESTful route'lar
- HTTP method mapping (GET, POST, PUT, DELETE)
- Controller bağlantıları
- Middleware kullanımı

### `/backend/src/services/`
Business logic servisleri:
- `shipmentAutomationService.js`: Otomatik sevkiyat servisi
- Complex business logic
- Background task'ler
- External API entegrasyonları

### `/backend/src/socket/`
Socket.IO namespace'leri:
- `faturaEslestirme`: Fatura-irsaliye eşleştirme
- CAD import namespace (index.js içinde)
- Real-time event yönetimi

### `/backend/src/modules/`
Modüler yapı:
- Her modül bağımsiz routes/controllers
- Şu an: `makinalar` modülü
- Gelecekte daha fazla modül

### `/backend/src/migrations/`
Veritabanı migrasyon dosyaları:
- Timestamp formatında: `YYYYMMDDHHMMSS-desiption.js`
- Up/Down fonksiyonları
- Versiyon kontrolü

### `/backend/uploads/` ve `/frontend/public/uploads/`
Yüklenen dosyalar:
- Teknik resimler
- Sevkiyat belgeleri
- Sipariş dokümanları
- User avatar'ları

### `/frontend/src/components/`
React bileşenleri:
- **Layout**: Ana layout bileşenleri
- **Dashboard**: Dashboard widget'ları
- **Raporlar**: Raporlama bileşenleri
- **UretimPlani**: Üretim planlama
- **Tedarik**: Tedarik yönetimi
- **Notlar**: Not sistemi
- **Makindex**: Hiyerarşik makina sistemi
- **WorkstationScheduler**: Tezgah iş planı

### `/frontend/src/pages/`
Sayfa seviyesinde bileşenler:
- Her sayfa için ayrı bileşen
- Route'larda doğrudan kullanılır
- Composable pattern

### `/frontend/src/pages/mobile/`
Mobil özgü sayfa bileşenleri:
- Touch-optimized
- Daha basit layout'lar
- Mobil route'larda kullanılır

### `/frontend/src/hooks/`
Custom React hooks:
- `useDeviceDetect`: Masaüstü/mobil algılama
- `useAuth`: Authentication (gelecekte)
- `useApi`: API çağrıları için hook

### `/frontend/src/store/`
Redux store yapısı:
- `index.js`: Store konfigürasyonu
- `slices/`: Redux Toolkit slices
- State management

### `/frontend/src/services/`
API client:
- `api.js`: Axios instance
- Endpoint tanımlamaları
- Request/response interceptor'lar

## Modül Organizasyonu

### Modüler Yapı Prensipleri

Sistem, modüler genişletilebilir yapı prensiplerine göre tasarlanmıştır:

1. **Feature-based Modules**: Her özellik bağımsiz modül
2. **Co-location**: İlgili dosyalar birlikte
3. **Dependency Injection**: Modüller arası gevşek bağımlılık
4. **API Versioning**: API versiyonlama desteği

### Modül Örneği: Makina Yönetimi

```
/modules/makinalar/
├── routes/
│   └── makinalarRoutes.js     # /api/makinalar endpoint'leri
├── controllers/
│   └── makinalarController.js # İş mantığı
└── (gelecekte services, models)
```

## Bileşenler Arası Referanslar

### Backend İç Referanslar

```
index.js (entry point)
  ↓
routes/ (API endpoints)
  ↓
controllers/ (business logic)
  ↓
models/ (database operations)
  ↓
database.js (Sequelize)
  ↓
database.sqlite (data storage)
```

### Frontend İç Referanslar

```
App.jsx (main app)
  ↓
Routes (react-router)
  ↓
Pages/ (page components)
  ↓
Components/ (reusable components)
  ↓
Hooks/ (custom hooks)
  ↓
Services/api.js (API calls)
  ↓
Backend API
```

### Real-time İletişim

```
Frontend (socket.io-client)
  ↓ WebSocket
Backend (socket.io server)
  ↓ Namespaces
  ├─ / (general)
  ├─ /cad-import (CAD tools)
  └─ /fatura-eslestirme (matching)
  ↓
Events emit/receive
```

## Ana Dosyaların Amacı

### `/backend/src/index.js`
- Express uygulama başlatma
- Middleware'leri yükleme
- Route'ları kaydetme
- Socket.IO sunucusu başlatma
- Veritabanı bağlantısı
- HTTP sunucusu başlatma (port 3000)

### `/frontend/src/App.jsx`
- React Router konfigürasyonu
- Masaüstü/mobil route ayrımı
- Theme provider
- Ana layout bileşenleri
- Sayfa route tanımlamaları

### `/backend/package.json` ve `/frontend/package.json`
- Bağımlılık yönetimi
- Script tanımlamaları
- Versiyon bilgisi

### `/package.json` (root)
- Monorepo script'leri
- `npm run dev`: Hem backend hem frontend başlat
- `npm run build`: Frontend build
- `npm run install:all`: Tüm bağımlılıkları yükle

## Önemli Konfigürasyon Dosyaları

### `pm2.config.json`
- Production process manager
- Backend sunucusu yönetimi
- Log yönetimi
- Restart politikaları

### `nginx-config.conf`
- Reverse proxy konfigürasyonu
- SSL yönlendirme (gelecekte)
- Static file serving
- WebSocket proxy
- Gzip sıkıştırma

### `.env` (oluşturulmalı)
- Ortam değişkenleri
- API anahtarları
- Veritabanı bağlantı bilgileri
- Port yapılandırmaları

## Dosya İsimlendirme Standartları

### Backend
- Routes: `{modul}Routes.js` (örn: `isEmirleriRoutes.js`)
- Controllers: `{modul}Controller.js` (örn: `isEmirleriController.js`)
- Models: PascalCase (örn: `IsEmri.js`, `StokKarti.js`)
- Migrations: `YYYYMMDDHHMMSS-description.js`

### Frontend
- Components: PascalCase.jsx (örn: `Dashboard.jsx`, `ParcaKarti.jsx`)
- Pages: PascalCase.jsx (örn: `IsEmirleri.jsx`)
- Hooks: camelCase.js (örn: `useDeviceDetect.js`)
- Utilities: camelCase.js (örn: `formatDate.js`)

### Mobil Bileşenler
- `*Mobile.jsx` suffix'i
- `/pages/mobile/` dizini
- `useDeviceDetect` hook ile otomatik seçim
