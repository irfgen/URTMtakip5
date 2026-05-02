# ÜRTM Takip - Bilgi Bankası ve Navigasyon Dizini

## 📚 İçerik Tablosu

- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Kullanıcı Persona ve Navigasyon](#kullanıcı-persona-ve-navigasyon)
- [Teknik Referans](#teknik-referans)
- [Öğrenme Kaynakları](#öğrenme-kaynakları)
- [Hızlı Referanslar](#hızlı-referanslar)
- [Sistem Dokümantasyonu Dizini](#sistem-dokümantasyonu-dizini)
- [Troubleshooting](#troubleshooting)

## 🚀 Hızlı Başlangıç

### Sistemi Çalıştırma
```bash
# Ana dizinde
npm run install:all  # İlk kurulum için
npm run dev          # Geliştirme modunda başlat
```

### Port Bilgisi
- **Frontend**: Port 5173 (sabit)
- **Backend**: Port 3000 (sabit)

### Temel Bilgiler
- Proje Türü: Full-stack Node.js/React Üretim Takip Sistemi
- Veritabanı: SQLite + Sequelize ORM
- Frontend: React + Material-UI + Vite
- Backend: Express.js + Socket.IO
- Embedded: ESP32 CNC Panel (CNC_panel/)

---

## 👥 Kullanıcı Persona ve Navigasyon

### Backend Geliştiricisi
**İhtiyaçları**: API, veritabanı, sunucu kurulumu

**Hızlı Navigasyon**:
- [API Dokümantasyonu](./docs/api-documentation.md)
- [Veritabanı Şeması](./docs/database-schema.md)
- [Sunucu Kurulumu](./docs/development-environment.md)
- [Backend Komutları](#hızlı-referanslar)

**Önemli Dosyalar**:
```
backend/
├── src/
│   ├── controllers/     # İş mantığı
│   ├── models/         # Veritabanı modelleri
│   ├── routes/         # API rotaları
│   ├── migrations/     # Veritabanı migrasyonları
│   └── index.js        # Sunucu giriş noktası
├── package.json
└── database.sqlite     # Veritabanı dosyası
```

### Frontend Geliştiricisi
**İhtiyaçları**: React komponentleri, state yönetimi, stil

**Hızlı Navigasyon**:
- [React Komponent Dokümantasyonu](./docs/react-components.md)
- [Frontend Mimarisi](./docs/frontend-architecture.md)
- [Redux Toolkit Dokümantasyonu](./docs/redux-toolkit-guide.md)
- [UI/UX Kuralları](./docs/ui-ux-guidelines.md)

**Önemli Dosyalar**:
```
frontend/
├── src/
│   ├── components/     # Genel komponentler
│   ├── components/mobile/  # Mobile komponentler
│   ├── pages/          # Sayfa komponentleri
│   ├── store/          # Redux store
│   ├── services/       # API servisleri
│   ├── hooks/          # Custom hooklar
│   └── App.jsx         # Ana uygulama
├── public/
└── package.json
```

### Full-Stack Geliştiricisi
**İhtiyaçları**: Komple sistem anlayışı

**Hızlı Navigasyon**:
- [Sistem Mimarisi](./docs/system-architecture.md)
- [API Dokümantasyonu](./docs/api-documentation.md)
- [Komponent Dokümantasyonu](./docs/react-components.md)
- [Development Komutları](#hızlı-referanslar)

### DevOps Mühendisi
**İhtiyaçları**: Deployment, bakım, monitoring

**Hızlı Navigasyon**:
- [Deployment Rehberi](./docs/deployment-guide.md)
- [Performans Optimizasyonu](./docs/performance-optimization.md)
- [Backup Yönetimi](./docs/backup-management.md)
- [Loglama ve Monitoring](./docs/logging-monitoring.md)

**Önemli Dosyalar**:
```
├── pm2.config.json     # PM2 konfigürasyonu
├── nginx-config.conf   # Nginx konfigürasyonu
├── docker-compose.yml  # Docker konfigürasyonu
└── scripts/           # Deployment scriptleri
```

### Sistem Yöneticisi
**İhtiyaçları**: Veritabanı yönetimi, yedekleme

**Hızlı Navigasyon**:
- [Veritabanı Migrasyonları](./docs/database-migrations.md)
- [Backup Prosedürleri](./docs/backup-management.md)
- [Veritabanı Bakım Rehberi](./docs/database-maintenance.md)

### Üretim Operatörü
**İhtiyaçları**: Günlük sistem kullanımı

**Hızlı Navigasyon**:
- [Operatör Kullanım Rehberi](./docs/operator-guide.md)
- [Mobile Uygulama Kullanımı](./docs/mobile-app-usage.md)
- [Sıkça Sorulan Sorular](./docs/operator-faq.md)

### Üretim Müdürü
**İhtiyaçları**: Raporlar, planlama, gözetim

**Hızlı Navigasyon**:
- [Yönetim Paneli Kullanımı](./docs/management-dashboard.md)
- [Raporlama Sistemi](./docs/reporting-system.md)
- [Üretim Planlama](./docs/production-planning.md)

---

## 📖 Teknik Referans

### API Referansı
**Base URL**: `http://localhost:3000/api`

**Ana Endpoint'ler**:
- `/is-emirleri` - İş emirleri yönetimi
- `/tezgahlar` - Tezgah/makine yönetimi
- `/parcalar` - Parça kataloğu
- `/uretim-plani` - Üretim planlama (ana sistem)
- `/uretim-planlari` - Üretim planlama V2
- `/bom` - BOM yönetimi
- `/stok` - Stok yönetimi
- `/sevkiyat` - Sevkiyat takibi

[Detaylı API Dokümantasyonu](./docs/api-documentation.md)

### Veritabanı Şeması
**Ana Tablolar**:
- `is_emirleri` - İş emirleri
- `tezgahlar` - Tezgahlar/makineler
- `parcalar` - Parça kataloğu
- `boms` - BOM yapıları
- `stok_kartlari` - Stok kartları
- `uretim_plani` - Üretim planları
- `uretim_planlari` - Üretim planları V2
- `sevkiyat` - Sevkiyat kayıtları

[Veritabanı Şeması Dokümantasyonu](./docs/database-schema.md)

### Komponent Kütüphanesi
**MUI Temelli Komponentler**:
- `DataTable` - Veri tabloları
- `FormDialog` - Form diyalogları
- `StatusChip` - Durum etiketleri
- `ActionButtons` - Aksiyon butonları
- `FileUpload` - Dosya yükleme
- `ImageViewer` - Resim görüntüleme

**Mobile Komponentler**:
- `MobileLayout` - Mobil layout
- `TouchButton` - Dokunma optimizasyonlu buton
- `SwipeCard` - Kaydırma kartları
- `MobileDataTable` - Mobil veri tabloları

[React Komponent Dokümantasyonu](./docs/react-components.md)

### Konfigürasyon Seçenekleri
**Environment Variables**:
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
UPLOAD_MAX_SIZE=104857600  # 100MB
```

**Önemli Konfigürasyon Dosyaları**:
- `backend/src/config/database.js` - Veritabanı konfigürasyonu
- `frontend/vite.config.js` - Vite konfigürasyonu
- `CNC_panel/include/config.h` - ESP32 konfigürasyonu

---

## 🎓 Öğrenme Kaynakları

### Başlangıç Tutorials
1. [Geliştirme Ortamı Kurulumu](./docs/tutorials/dev-setup.md)
2. [İlk Özelliği Geliştirme](./docs/tutorials/first-feature.md)
3. [API Endpoint Oluşturma](./docs/tutorials/api-endpoint.md)
4. [React Komponenti Ekleme](./docs/tutorials/react-component.md)

### Adım Adım Rehberler
- [Yeni Modül Ekleme](./docs/guides/new-module.md)
- [Veritabanı Migrasyonu](./docs/guides/database-migration.md)
- [Mobile Layout Ekleme](./docs/guides/mobile-layout.md)
- [CNC Panel Entegrasyonu](./docs/guides/cnc-integration.md)

### Best Practices
- [Kodlama Standartları](./docs/best-practices/coding-standards.md)
- [Git Workflow](./docs/best-practices/git-workflow.md)
- [Güvenlik İlkeleri](./docs/best-practices/security.md)
- [Test Stratejileri](./docs/best-practices/testing.md)

### Performans Rehberleri
- [Frontend Optimizasyonu](./docs/performance/frontend-optimization.md)
- [Backend Performansı](./docs/performance/backend-performance.md)
- [Veritabanı Optimizasyonu](./docs/performance/database-optimization.md)
- [Mobil Performans](./docs/performance/mobile-performance.md)

---

## ⚡ Hızlı Referanslar

### Port Konfigürasyonu
- Frontend: 5173 (sabit, başka port kullanma)
- Backend: 3000 (sabit, başka port kullanma)
- Proxies: Frontend → Backend (3000)

### Development Komutları Cheat Sheet
```bash
# Proje Geneli
npm run install:all    # Tüm bağımlılıkları kur
npm run dev           # Geliştirme modunda başlat
npm run start         # Production modunda başlat
npm run build         # Frontend build
npm test              # Backend testleri
npm run test:frontend # Frontend testleri

# Backend Only
cd backend
npm run dev          # Development (port 3000)
npm start            # Production (port 3000)
npm test             # Jest testleri
npm run migrate      # Veritabanı migrasyonları

# Frontend Only
cd frontend
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build
npm test             # Vitest testleri

# CNC Panel
cd CNC_panel
pio run              # ESP32 build
pio run -t upload    # ESP32 upload

# Python Tools
cd STEP_BOM_Analyzer
python main.py       # BOM analizörü

cd CAD_Import_Client
python main.py       # CAD import istemcisi
```

### API Endpoint Hızlı Referans
**İş Emirleri**:
- GET `/api/is-emirleri` - Tüm iş emirleri
- POST `/api/is-emirleri` - Yeni iş emri
- PUT `/api/is-emirleri/:id` - İş emri güncelle
- DELETE `/api/is-emirleri/:id` - İş emri sil

**Tezgahlar**:
- GET `/api/tezgahlar` - Tüm tezgahlar
- GET `/api/tezgahlar/:id/durum` - Tezgah durumu
- POST `/api/tezgahlar/:id/durum` - Durum güncelle

**Parçalar**:
- GET `/api/parcalar` - Parça listesi
- GET `/api/parcalar/:id/teknik-resim` - Teknik resim
- POST `/api/parcalar` - Yeni parça

### Veritabanı Migrasyon Komutları
```bash
cd backend

# Tüm migrasyonları çalıştır
npm run migrate

# Durum kontrol
npm run check-durum-status

# Belirli modül migrasyonu
npm run migrate-durum

# Geri alma
npm run rollback-durum-migration
```

### Önemli Dosya Konumları
```
/home/urtmtakip/Belgeler/URTMtakip/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API controllerları
│   │   ├── models/        # Veritabanı modelleri
│   │   ├── routes/        # API rotaları
│   │   └── migrations/    # Migrasyon dosyaları
│   ├── uploads/           # Dosya yüklemeleri
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React komponentleri
│   │   ├── pages/         # Sayfalar
│   │   ├── store/         # Redux store
│   │   └── services/      # API servisleri
│   └── public/
│       └── uploads/       # Public dosyalar
├── CNC_panel/             # ESP32 kodu
├── STEP_BOM_Analyzer/     # Python BOM analizörü
├── CAD_Import_Client/     # Python CAD client
└── docs/                  # Dokümantasyon
```

### Ana Bağımlılıklar ve Versiyonlar
**Backend**:
- Express.js: ^4.18.x
- Sequelize: ^6.32.x
- Socket.IO: ^4.7.x
- SQLite3: ^5.1.x

**Frontend**:
- React: ^18.2.x
- Material-UI: ^5.14.x
- Redux Toolkit: ^1.9.x
- Vite: ^4.4.x

---

## 📋 Sistem Dokümantasyonu Dizini

### API Dokümantasyonu
- [API Documentation](./docs/api-documentation.md) - Tüm API endpoint'leri ve örnekleri
- [API Reference](./docs/api-reference.md) - Hızlı API referansı
- [Postman Collection](./docs/postman-collection.json) - API test koleksiyonu

### Veritabanı Dokümantasyonu
- [Database Schema](./docs/database-schema.md) - Veritabanı yapısı ve ilişkiler
- [Database Migrations](./docs/database-migrations.md) - Migrasyon rehberi
- [Database Maintenance](./docs/database-maintenance.md) - Bakım ve optimizasyon

### Frontend Dokümantasyonu
- [React Components](./docs/react-components.md) - Komponent kütüphanesi
- [Frontend Architecture](./docs/frontend-architecture.md) - Frontend mimarisi
- [Redux Toolkit Guide](./docs/redux-toolkit-guide.md) - State yönetimi
- [UI/UX Guidelines](./docs/ui-ux-guidelines.md) - Tasarım kuralları

### Backend Dokümantasyonu
- [Backend Architecture](./docs/backend-architecture.md) - Backend mimarisi
- [Authentication System](./docs/authentication-system.md) - Kimlik doğrulama
- [File Upload System](./docs/file-upload-system.md) - Dosya yükleme
- [Real-time Features](./docs/real-time-features.md) - Socket.IO entegrasyonu

### Deployment ve Operations
- [Deployment Guide](./docs/deployment-guide.md) - Deployment rehberi
- [Development Environment](./docs/development-environment.md) - Geliştirme ortamı
- [Performance Optimization](./docs/performance-optimization.md) - Performans
- [Backup Management](./docs/backup-management.md) - Yedekleme

### Üretim Modülleri
- [İş Emirleri Modülü](./docs/modules/work-orders.md) - Work Orders
- [Tezgahlar Modülü](./docs/modules/workstations.md) - Workstations
- [Parça Yönetimi](./docs/modules/parts-management.md) - Parts Management
- [Üretim Planlama](./docs/modules/production-planning.md) - Production Planning
- [BOM Yönetimi](./docs/modules/bom-management.md) - BOM Management

### Entegrasyonlar
- [CNC Panel ESP32](./docs/integrations/cnc-panel-esp32.md) - ESP32 entegrasyonu
- [CAD Integration](./docs/integrations/cad-integration.md) - CAD entegrasyonu
- [Excel Integration](./docs/integrations/excel-integration.md) - Excel entegrasyonu

### Kullanıcı Rehberleri
- [Operator Guide](./docs/operator-guide.md) - Operatör kullanım rehberi
- [Manager Dashboard](./docs/manager-dashboard.md) - Yönetim paneli
- [Mobile App Usage](./docs/mobile-app-usage.md) - Mobil uygulama

### Teknik Rehberler
- [Best Practices](./docs/best-practices/) - Kodlama standartları
- [Troubleshooting](./docs/troubleshooting.md) - Sorun çözümü
- [FAQ](./docs/faq.md) - Sıkça sorulan sorular
- [Glossary](./docs/glossary.md) - Terimler sözlüğü

### Versiyon Bilgisi
- **Dokümantasyon Versiyonu**: 1.0.0
- **Son Güncelleme**: 2025-12-22
- **Proje Versiyonu**: v13.dev18

### Dokümanlar Arası Bağımlılıklar
1. [API Documentation](./docs/api-documentation.md) ← [Database Schema](./docs/database-schema.md)
2. [React Components](./docs/react-components.md) ← [UI/UX Guidelines](./docs/ui-ux-guidelines.md)
3. [Deployment Guide](./docs/deployment-guide.md) ← [Development Environment](./docs/development-environment.md)

---

## 🔧 Troubleshooting

### Sık Karşılaşılan Sorunlar

#### Port Konflikti
```bash
# Portları öldür ve yeniden başlat
npm run stop
npm run dev
```

#### Veritabanı Bağlantı Hatası
```bash
# Veritabanı dosyası izinlerini kontrol et
ls -la backend/database.sqlite*

# Migrasyonları yeniden çalıştır
cd backend && npm run migrate
```

#### Frontend Build Hatası
```bash
# Node modüllerini temizle ve yeniden kur
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Destek Kaynakları
- [Troubleshooting Guide](./docs/troubleshooting.md) - Detaylı sorun çözümü
- [FAQ](./docs/faq.md) - Sıkça sorulan sorular
- [Issue Templates](./.github/ISSUE_TEMPLATE/) - Issue şablonları
- [Discord Channel](https://discord.gg/urtmtakip) - Topluluk desteği

---

## 🔍 Dokümantasyon Arama

### Anahtar Kelimeler
- API, REST, Endpoint → [API Documentation](./docs/api-documentation.md)
- React, Component, Redux → [React Components](./docs/react-components.md)
- Database, Schema, Migration → [Database Schema](./docs/database-schema.md)
- Deployment, Docker, PM2 → [Deployment Guide](./docs/deployment-guide.md)
- Mobile, Touch, Responsive → [Mobile App Usage](./docs/mobile-app-usage.md)
- CNC, ESP32, Hardware → [CNC Panel ESP32](./docs/integrations/cnc-panel-esp32.md)

### Etiket Tabanlı Navigasyon
**#backend**: Sunucu tarafı geliştirme
**#frontend**: İstemci tarafı geliştirme
**#database**: Veritabanı işlemleri
**#deployment**: Yayınlama ve operasyonlar
**#integration**: Harici sistem entegrasyonları
**#mobile**: Mobil uygulama geliştirme
**#production**: Üretim modülleri
**#troubleshooting**: Sorun çözümü

---

## 📊 Proje Durumu

### Aktif Geliştirme
- Backend API geliştirmeleri
- Frontend mobil optimizasyonları
- CNC Panel ESP32 entegrasyonu

### Planlanan Özellikler
- Gerçek zamanlı üretim takibi
- Gelişmiş raporlama sistemi
- IoT sensör entegrasyonu

### Bilinen Sorunlar
- Mobile responsive bazı ekranların optimizasyonu
- Large dosya upload performansı
- Veritabanı sorgu optimizasyonu

---

## 📞 İletişim ve Destek

### Proje Ekibi
- **Backend Lead**: backend@example.com
- **Frontend Lead**: frontend@example.com
- **DevOps Lead**: devops@example.com

### Topluluk
- **Discord**: https://discord.gg/urtmtakip
- **Forum**: https://forum.urtmtakip.com
- **Documentation**: https://docs.urtmtakip.com

### Katkı
- [Contribution Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [License](./LICENSE)

---

*Bu bilgi bankası projesi geliştikçe güncellenmektedir. Son güncelleme: 22 Aralık 2025*