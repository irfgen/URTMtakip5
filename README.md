# ÜRTM Takip Sistemi

Üretim Takip Sistemi (ÜRTM), imalat endüstrisi için geliştirilmiş, end-to-end üretim yönetimi çözümüdür.

## Sistem Hakkında

ÜRTM Takip, karmaşık üretim süreçlerini dijitalleştiren kapsamlı bir sistemdir. İş emri yönetiminden stok takibine, CNC entegrasyonundan CAD/CAM otomasyonuna kadar tüm üretim döngüsünü tek bir platformda yönetir.

### Ana Özellikler

- **İş Emri Yönetimi**: Planlama, takip ve durum yönetimi
- **Üretim Planlama**: V1 (BOM tabanlı) ve V2 (JSON tabanlı) çift sistem
- **Tezgah Yönetimi**: Gerçek zamanlı durum takibi ve ESP32 entegrasyonu
- **Stok Yönetimi**: Otomatik stok güncelleme ve kritik seviye uyarıları
- **BOM Yönetimi**: Malzeme listesi ve maliyet analizi
- **Mobil Destek**: Android/iOS uyumlu responsive tasarım
- **CAD Entegrasyonu**: STEP dosya analizi ve BOM çıkarma
- **Raporlama**: Detaylı üretim raporları ve Excel export

### Teknik Altyapı

- **Backend**: Node.js + Express.js + Sequelize ORM + SQLite
- **Frontend**: React 18 + Vite + Material-UI + Redux Toolkit
- **Donanım**: ESP32 tabanlı CNC monitoring paneli
- **CAD Araçları**: Python + FreeCAD + SolidWorks COM automation
- **Real-time**: Socket.IO ile anlık veri akışı

## Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- NPM 8+
- Python 3.8+ (CAD araçları için)
- ESP32 geliştirme ortamı (CNC panel için)

### Kurulum

```bash
# Projeyi klonlayın
git clone https://github.com/username/URTMtakip.git
cd URTMtakip

# Tüm bağımlılıkları kurun
npm run install:all

# Veritabanı migrasyonlarını çalıştırın
cd backend && npm run migrate

# Geliştirme sunucusunu başlatın
cd .. && npm run dev
```

Sistem şu adreslerde çalışacaktır:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## Port Konfigürasyonu

- **Frontend**: Port 5173 (sabit, değiştirilemez)
- **Backend**: Port 3000 (sabit, değiştirilemez)
- Port çakışması durumunda: `npm run restart` komutunu kullanın

## Modüller

### 1. İş Emri Yönetimi
- **Route**: `backend/src/routes/isEmirleriRoutes.js`
- **Controller**: `backend/src/controllers/isEmirleriController.js`
- **Frontend**: `frontend/src/pages/IsEmirleri.jsx`

### 2. Üretim Planlama
- **V1 Sistem**: BOM tabanlı, karmaşik planlama (`/api/uretim-plani`)
- **V2 Sistem**: JSON tabanlı, basitleştirilmiş (`/api/uretim-planlari`)

### 3. Tezgah Yönetimi
- **Route**: `backend/src/routes/tezgahRoutes.js`
- **Hardware**: ESP32 tabanlı CNC panel

### 4. Stok Yönetimi
- **Route**: `backend/src/routes/stokKartlariRoutes.js`
- **Otomatik Güncelleme**: İş emirlerinden stoğa yansıtma

### 5. Parça ve BOM Yönetimi
- **Parça Katalog**: Teknik çizimler, fotoğraflar
- **BOM Sistemi**: Hiyerarşik malzeme listesi

## Proje Yapısı

```
URTMtakip/
├── backend/              # Node.js API sunucusu (port 3000)
├── frontend/           # React uygulaması (port 5173)
├── CNC_panel/          # ESP32 donanım kodu
├── STEP_BOM_Analyzer/  # Python STEP analizi
├── CAD_Import_Client/ # Python SolidWorks client
├── docs/              # Dokümantasyon
└── docs/moduller/     # Modül dokümanları
```

## Geliştirme Komutları

```bash
# Geliştirme sunucusu (her iki server birlikte)
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Testler
npm test

# Build
npm run build
```

## Dokümantasyon

- [API Reference](./docs/API_REFERENCE.md) - 60+ endpoint
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Model yapısı
- [Frontend Reference](./docs/FRONTEND_REFERENCE.md) - Component yapıs��
- [Development Guide](./docs/DEVELOPMENT.md) - Geliştirme rehberi
- [Module Docs](./docs/moduller/) - Tüm modül dokümanları

## Lisans

Bu proje özel mülkiyet yazılımıdır. Tüm hakları saklıdır.