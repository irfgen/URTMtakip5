# ÜRTM Takip Proje Kapsamlı Analiz Raporu

## Proje Genel Bakış

ÜRTM Takip, endüstriyel üretim takibi için geliştirilmiş kapsamlı bir full-stack uygulamasıdır. Sistem Node.js/Express backend ve React frontend ile SQLite veritabanını kullanır. ESP32 tabanlı CNC panel donanımı ve Python CAD araçları ile entegrasyon sağlar.

## Mimari Yapı

### 1. Backend (Node.js/Express/SQLite)
- **Giriş Noktası**: `/backend/src/index.js`
- **Veritabanı**: SQLite + Sequelize ORM (`/backend/database.sqlite`)
- **Port**: 3000 (sabit)
- **Ana Özellikler**:
  - RESTful API mimarisi
  - Socket.IO ile gerçek zamanlı iletişim
  - Winston log sistemi
  - Helmet güvenlik middleware
  - Dosya yükleme (100MB limit)
  - CORS desteği
  - Compression middleware

### 2. Frontend (React/Material-UI/Vite)
- **Giriş Noktası**: `/frontend/src/App.jsx`
- **Port**: 5173 (sabit)
- **Ana Özellikler**:
  - Material-UI component sistemi
  - Redux Toolkit state management
  - Otomatik mobil/desktop layout algılama
  - React Router routing
  - Vite build tool
  - Hot module replacement

### 3. CNC Panel (ESP32 Donanım)
- **Konum**: `/CNC_panel/` dizini
- **Platform**: PlatformIO tabanlı ESP32
- **Amaç**: CNC makine monitoring ve durum raporlama
- **İletişim**: Wi-Fi ile ana sistem

### 4. Python CAD Entegrasyon Araçları
- **STEP_BOM_Analyzer**: STEP dosya BOM çıkarma ve 3D rendering
- **CAD_Import_Client**: SolidWorks otomasyonu ve thumbnail oluşturma

## API Yapısı ve Endpoint'ler

Sistem 60+ route dosyası ile zengin API yapısına sahiptir:

### Üretim Modülleri
- `/api/is-emirleri` - İş emri yönetimi
- `/api/tezgahlar` - Tezgah/makine yönetimi
- `/api/parcalar` - Parça katalog yönetimi
- `/api/uretim-plani` - Üretim planlama (ana sistem)
- `/api/uretim-planlari` - Üretim planlama V2 (basitleştirilmiş)
- `/api/boms` - BOM (Bill of Materials) yönetimi

### Operasyonel Modüller
- `/api/fason` - Fason iş yönetimi
- `/api/sevkiyat` - Sevkiyat ve teslimat takibi
- `/api/stok-kartlari` - Stok yönetimi
- `/api/ariza-bakim` - Bakım ve arıza takibi
- `/api/notlar` - Not sistemi
- `/api/raporlar` - Raporlama ve analitik

### Yönetimsel Modüller
- `/api/personel` - Personel yönetimi
- `/api/vardiyalar` - Vardiya yönetimi
- `/api/firmalar` - Firma yönetimi
- `/api/tedarik` - Tedarik zinciri yönetimi

### Teknik Modüller
- `/api/teknik-resim` - Teknik resim analizi (OCR)
- `/api/cad-import` - CAD dosya import
- `/api/upload` - Dosya yükleme sistemi
- `/api/import-export` - Veri ithalat/ihracat

### Makindex Sistemi
- `/api/makindex` - Hiyerarşik makina-parça sistemi
- Özel Socket.IO olayları ve gerçek zamanlı güncellemeler

## Veritabanı Şeması

### Ana Tablolar
- **is_emirleri**: İş emirleri ve durum takibi
- **tezgahlar**: Tezgah/makineler
- **parcalar**: Parça katalog
- **boms**: Malzeme listeleri (Bill of Materials)
- **stok_kartlari**: Stok yönetimi
- **uretim_plani**: Üretim planları (ana sistem)
- **uretim_planlari**: Üretim planları V2
- **sevkiyat**: Sevkiyat kayıtları

### Destekleyici Tablolar
- **islem_kayitlari**: Process logları
- **tezgah_durum_log**: Makine durumu geçmişi
- **parca_kayitlari**: Parça işlem kayıtları
- **notlar**: Not sistemi
- **ariza_bakim**: Bakım kayıtları
- **personel**: Personel bilgileri
- **vardiyalar**: Vardiya tanımları
- **firmalar**: Firma bilgileri

### Migration Sistemi
- **Konum**: `/backend/src/migrations/`
- **Sistem**: umzug migration framework
- **Önemli Migrations**:
  - `20240912000001-add-tahmini-isleme-suresi.js`
  - `20250924_add_cost_fields_to_boms.js`
  - `20250701000001-create-notlar-tables.js`

## Mobil Destek

Sistem responsive design ile mobil destek sunar:
- **Mobil Route'lar**: `/mobile/` prefix ile
- **Otomatik Algılama**: `useDeviceDetect` hook
- **Touch Optimized**: Üretim zemin kullanımı için
- **Ayrı Mobil Komponentler**: `/frontend/src/components/mobile/`

## Dosya Yükleme ve Depolama

- **Backend Uploads**: `/backend/uploads/` ve `/backend/importlar/`
- **Frontend Uploads**: `/frontend/public/uploads/`
- **Desteklenen Formatlar**: PNG, JPG, Excel, PDF
- **Boyut Limiti**: 100MB
- **OCR Desteği**: Tesseract.js ile teknik resim metin çıkarma

## Gerçek Zamanlı İletişim (Socket.IO)

### Genel Event'ler
- `isEmriGuncellendi` - İş emri güncellemeleri
- `makindex-join/leave` - Makindex odası yönetimi
- `stok-degisti` - Stok değişiklik bildirimleri
- `parca-eklendi` - Yeni parça ekleme
- `bom-guncellendi` - BOM güncellemeleri

### CAD Import Namespace
- `/cad-import` namespace
- Client registration ve management
- Job progress tracking
- File processing status updates

## Development Komutları

### Ana Komutlar
```bash
# Tüm bağımlılıkları kur
npm run install:all

# Development modunda çalıştır (backend + frontend)
npm run dev

# Production modunda başlat
npm run start

# Frontend build
npm run build

# Testleri çalıştır
npm test
```

### Backend Sadece
```bash
cd backend
npm run dev      # Development (port 3000)
npm start        # Production (port 3000)
npm test         # Jest testleri
npm run migrate  # Database migrations
```

### Frontend Sadece
```bash
cd frontend
npm run dev      # Vite dev server (port 5173)
npm run build    # Production build
npm test         # Vitest testleri
```

### CNC Panel (ESP32)
```bash
cd CNC_panel
pio run                    # Build
pio run -t upload          # Upload to ESP32
pio device monitor         # Serial monitor
```

### Python CAD Araçları
```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt
python main.py

cd CAD_Import_Client
pip install -r requirements.txt
python main.py
```

## Port Politikası

**KRİTİK**: Proje bu portları kullanmalı:
- **Frontend**: 5173 (daima bu portu kullan, meşgulse öldür ve tekrar başlat)
- **Backend**: 3000 (daima bu portu kullan, meşgulse öldür ve tekrar başlat)
- Başka port kullanılmamalı

## Güvenlik ve Performans

### Güvenlik
- Helmet middleware
- CORS configuration
- Rate limiting
- Input validation (Joi)
- Password hashing (bcryptjs)
- JWT authentication

### Performans
- SQLite connection pooling
- Compression middleware
- Image optimization (Sharp)
- Code splitting (React lazy loading)
- Redux state normalization

## External Entegrasyonlar

### 1. CNC Panel Donanımı
- ESP32 Wi-Fi connectivity
- Gerçek zamanlı durum raporlama
- Durum kodları: 0 (boşta), 1 (çalışıyor), 2 (hata/bakım)

### 2. STEP_BOM_Analyzer
- FreeCAD entegrasyonu
- STEP file parsing
- 3D rendering ve thumbnail
- Çoklu export formatı (JSON, Excel, CSV, XML)

### 3. CAD_Import_Client
- SolidWorks COM automation
- Batch processing
- Windows-only (SolidWorks gerektirir)
- HTTP API ve WebSocket iletişimi

## Test Frameworks

### Backend
- Jest için unit testleri
- Supertest için API endpoint testleri
- Database migration testleri

### Frontend
- Vitest component testleri
- React Testing Library
- End-to-end test desteği (Cypress ile yapılandırılabilir)

### ESP32
- PlatformIO embedded testleri
- Device monitoring

## Deployment

### Production Kurulum
- PM2 configuration (`pm2.config.json`)
- Nginx configuration (`nginx-config.conf`)
- Service dosyaları (`urtmtakip.service`)
- Automated deployment scripts

### Server Requirements
- Node.js 18+
- SQLite3
- Nginx (reverse proxy)
- PM2 (process manager)

## Önemli Notlar

1. **Port Yönetimi**: Frontend 5173, Backend 3000 portlarını ZORUNLU olarak kullanır
2. **Mobil Destek**: Responsive design ve otomatik mobil/desktop algılama
3. **Real-time**: Socket.IO ile anlık güncellemeler
4. **Dosya İşlemleri**: 100MB limit, OCR desteği, çoklu format
5. **CAD Entegrasyonu**: STEP dosyaları ve SolidWorks otomasyonu
6. **CNC Donanım**: ESP32 tabanlı monitoring cihazı
7. **Migration Sistemi**: Veritabanı şema güncellemeleri için umzug

Bu sistem aktif olarak geliştirilmektedir (v13.x) ve üretim ortamları için kapsamlı takip yetenekleri sunar.