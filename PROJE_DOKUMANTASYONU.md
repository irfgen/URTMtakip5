# ÜRTM Takip Sistemi - Proje Dokümantasyonu

## Proje Genel Bakış

ÜRTM Takip Sistemi, imalat süreçlerini yönetmek için geliştirilmiş kapsamlı bir üretim takip yazılımıdır. Bu full-stack uygulama, iş emri yönetimi, parça takibi, tezgah optimizasyonu, BOM yönetimi ve üretim planlama gibi birçok modülü içermektedir.

### Teknoloji Stack

**Backend (Node.js + Express)**
- **Framework**: Express.js v4.18.2
- **Veritabanı**: SQLite3 + Sequelize ORM
- **Real-time**: Socket.IO v4.7.2
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer + Sharp (image processing)
- **Excel Processing**: xlsx, exceljs
- **Logging**: Winston
- **Validation**: Joi
- **Security**: Helmet, Express Rate Limiting
- **OCR**: Tesseract.js

**Frontend (React + Vite)**
- **Framework**: React v18.2.0
- **Build Tool**: Vite v5.0.6
- **UI Framework**: Material-UI v5.17.1
- **State Management**: Redux Toolkit v2.0.1
- **Routing**: React Router v6.20.1
- **HTTP Client**: Axios
- **Charts**: Chart.js + react-chartjs-2
- **Drag & Drop**: @hello-pangea/dnd
- **PDF**: react-pdf
- **QR Code**: qrcode.react
- **Real-time**: Socket.IO Client

**CNC Panel (ESP32)**
- **Platform**: ESP32 with PlatformIO
- **Connectivity**: WiFi
- **Communication**: HTTP/JSON

**Python CAD Tools**
- **STEP Processing**: FreeCAD API
- **CAD Integration**: SolidWorks COM automation
- **3D Rendering**: trimesh, matplotlib

## Sistem Mimarisi

### Backend Modülleri

#### 1. Üretim Yönetimi
- **İş Emirleri** (`isEmirleriRoutes`): Üretim iş emirlerinin takibi
- **İş Emri Durumları** (`isEmriDurumRoutes`): İş emri durum yönetimi
- **İş Emri Taslakları** (`isEmriTaslaklariRoutes`): İş emri taslak oluşturma
- **Tamamlanan İşler** (`tamamlananIsRoutes`): Biten işlerin takibi
- **İşlem Kayıtları** (`islemKaydiRoutes`): İşlem geçmişi

#### 2. Tezgah ve Makina Yönetimi
- **Tezgahlar** (`tezgahRoutes`): Tezgah bilgileri ve durumları
- **Tezgah İş Planları** (`tezgahIsPlanimi`): Tezgah bazlı iş planlama
- **Tezgah Durum Logları** (`tezgahDurumRoutes`): Tezgah durum geçmişi
- **Makinalar** (Module: `modules/makinalar`): Yeni nesil makina yönetimi
- **Workstation Scheduler** (`workstationSchedulerRoutes`): İş istasyonu planlama

#### 3. Parça ve BOM Yönetimi
- **Parçalar** (`parcaRoutes`): Parça katalog yönetimi
- **BOM** (`bomRoutes`): Malzeme listeleri yönetimi
- **Parça Kayıtları** (`parcaKayitlariRoutes`): Parça işlem geçmişi
- **Parça Takip Listeleri** (`parcaTakipListeleri`): Parça takip sistemleri
- **Parça Birleşik** (`parcaBirlesikRoutes`): Birleştirilmiş parça yönetimi
- **Parça İthalat** (`parcaImportRoutes`): Parça dış ithalat yönetimi

#### 4. Stok Yönetimi
- **Stok Kartları** (`stokKartlariRoutes`): Stok kartı yönetimi
- **Stok Takip Listeleri** (`stokTakipListeleri`): Stok takip sistemleri

#### 5. Üretim Planlama
- **Üretim Planı** (`uretimPlaniRoutes`): Ana üretim planlama sistemi
- **Üretim Planları V2** (`uretimPlanlariRoutes`): Basitleştirilmiş planlama
- **Makina Group Parts** (`makinaGroupPartsRoutes`): Makina-parça gruplama

#### 6. Fason Yönetimi
- **Fason Firmalar** (`fasonRoutes`): Fason yönetimi
- **Fason Grupları** (`fasonGrupRoutes`): Fason gruplama
- **Fason İş Emirleri** (Entegre): Fason bazlı iş yönetimi

#### 7. Sevkiyat Yönetimi
- **Sevkiyat** (`sevkiyatRoutes`): Sevkiyat takibi
- **Sevkiyat Firmaları** (`sevkiyat-firmalar`): Firmalar
- **Sevkiyat Lokasyonları** (`sevkiyat-lokasyonlar`): Lokasyon yönetimi
- **Sevkiyat Kalemleri** (`sevkiyat-kalemleri`): Sevkiyat kalemleri
- **Sevkiyat Raporları** (`sevkiyat-raporlar`): Sevkiyat raporlama
- **Toplu Sevkiyat** (`toplu-sevkiyat`): Toplu sevkiyat işlemleri

#### 8. Bakım ve Arıza Yönetimi
- **Arıza Bakım** (`arizaBakimRoutes`): Bakım takibi
- **Teknik Resimler** (`teknikResimRoutes`): Teknik resim analizi

#### 9. Raporlama
- **Raporlar** (`raporRoutes`): Genel raporlama
- **Tezgah Raporları** (`tezgahRaporRoutes`): Tezgah bazlı raporlar
- **İş Emri Özetleri** (`isEmriOzetiRoutes`): İş emri analizleri

#### 10. İnsan Kaynakları
- **Vardiya Yönetimi** (`vardiyaRoutes`): Vardiya takibi
- **Personel Yönetimi** (`personelRoutes`): Personel bilgileri
- **Vardiya Atama** (`vardiyaAtamaRoutes`): Vardiya atama sistemi

#### 11. Sipariş Yönetimi
- **Siparişler** (`siparislerRoutes`): Sipariş takibi
- **Sipariş Dokümanları** (`siparisDokumaniRoutes`): Doküman yönetimi

#### 12. Sistem Yönetimi
- **Kategoriler** (`kategorilerRoutes`): Kategori yönetimi
- **Notlar** (`notlarRoutes`): Not sistemi
- **Gruplar** (`grupRoutes`): Grup yönetimi
- **Upload** (`uploadRoutes`): Dosya yükleme
- **Download** (`downloadRoutes`): Dosya indirme
- **İthalat/İhracat** (`importExportRoutes`): Veri transferi

#### 13. Entegrasyonlar
- **CAD Import** (`cadImportRoutes`): CAD dosya entegrasyonu
- **CNC Link** (`cncLinkRoutes`): CNC makineler entegrasyonu
- **Timeline** (`timelineRoutes`): Zaman çizelgesi
- **Dizin Tarama** (`dizinTaramaRoutes`): Dosya sistemi taraması
- **CAD Files** (`cadFilesRoutes`): CAD dosya yönetimi

#### 14. Makindex Sistemi
- **Makindex** (`makindexRoutes`): Hiyerarşik malzeme sistemi

### Frontend Komponentleri

#### 1. Ana Komponentler
- **App.jsx**: Ana uygulama ve routing
- **Layout.jsx**: Ana layout yapısı
- **MobileLayout.jsx**: Mobil layout

#### 2. Üretim Yönetimi
- **IsEmriListesi**: İş emri listeleme
- **IsEmriEkleForm**: İş emri ekleme
- **IsEmriKarti**: İş emri detay kartı
- **IsEmriKanbanBoard**: Kanban tablo görünümü
- **MobileIsEmriKarti**: Mobil iş emri kartı

#### 3. Parça ve BOM Yönetimi
- **ParcaKarti**: Parça kartı
- **ParcaSecici**: Parça seçici
- **BomListesi**: BOM listeleme
- **BomForm**: BOM form
- **BomPrintModal**: BOM yazdırma modal

#### 4. Tezgah Yönetimi
- **MakinaListesi**: Makina listesi
- **MakinaForm**: Makina form
- **TezgahEkleForm**: Tezgah ekleme
- **TezgahZamanCizelgesi**: Tezgah zaman çizelgesi

#### 5. Üretim Planlama
- **UretimPlaniForm**: Üretim planı form
- **UretimPlaniListesi**: Üretim planı listesi
- **PlanlamaGerceklesmeDashboard**: Planlama gerçekleşme dashboard
- **UretimZamanCizelgesi**: Üretim zaman çizelgesi

#### 6. Stok Yönetimi
- **StokKartiForm**: Stok kartı form
- **StokKartiSecici**: Stok kartı seçici

#### 7. Fason Yönetimi
- **FirmaYonetimModal**: Firma yönetimi
- **FirmaEkleModal**: Firma ekleme
- **FasonConfirmDialog**: Fason onay dialogu

#### 8. Sevkiyat Yönetimi
- **SevkiyatForm**: Sevkiyat form
- **SevkiyatListesi**: Sevkiyat listesi
- **SevkiyatResimModal**: Sevkiyat resim modal

#### 9. Bakım ve Arıza
- **ArizaBakimForm**: Arıza bakım form (controller exists but component may need creation)

#### 10. Raporlama
- **UretimIstatistikleri**: Üretim istatistikleri
- **TezgahCalismaTablosu**: Tezgah çalışma tablosu
- **VardiyaTezgahRaporu**: Vardiya tezgah raporu
- **ParcaBazliIsEmirleriRaporu**: Parça bazlı iş emirleri raporu
- **TamamlananIsEmirleriRaporu**: Tamamlanan işler raporu

#### 11. İnsan Kaynakları
- **VardiyaYonetimi**: Vardiya yönetimi
- **PersonelListesi**: Personel listesi
- **PersonelYonetimi**: Personel yönetimi

#### 12. Sistem Yönetimi
- **Notlar**: Not sistemi
- **GrupEkleForm**: Grup ekleme form
- **GrupListesi**: Grup listesi

#### 13. Entegrasyonlar
- **DizinTarama**: Dizin tarama
- **CameraCapture**: Kamera yakalama
- **TeklifImportModal**: Teklif ithalat modal

## Veritabanı Şeması

### Ana Tablolar

#### Üretim Tabloları
- **is_emirleri**: İş emri ana tablosu
- **is_emri_taslaklari**: İş emri taslakları
- **is_emri_durumlari**: İş emri durumları
- **islem_kayitlari**: İşlem kayıtları
- **tamamlanan_isler**: Tamamlanan işler

#### Tezgah ve Makina Tabloları
- **tezgahlar**: Tezgah bilgileri
- **makinalar**: Makina bilgileri
- **makina_siniflari**: Makina sınıfları
- **tezgah_durum_loglari**: Tezgah durum logları
- **tezgah_zaman_planlari**: Tezgah zaman planları

#### Parça ve BOM Tabloları
- **parcalar**: Parça ana tablosu
- **boms**: BOM (Malzeme Listesi)
- **parca_kayitlari**: Parça kayıtları
- **parca_takip_listeleri**: Parça takip listeleri
- **parca_birlestirme_loglari**: Parça birleştirme logları

#### Stok Tabloları
- **stok_kartlari**: Stok kartları
- **stok_takip_listeleri**: Stok takip listeleri

#### Üretim Planlama
- **uretim_plani**: Ana üretim planı
- **uretim_planlari**: Üretim planları V2
- **tezgah_planlanan_isler**: Tezgah planlanan işler

#### Fason Tabloları
- **fasonlar**: Fason firmalar
- **fason_gruplari**: Fason grupları
- **fason_is_emirleri**: Fason iş emirleri
- **fason_teklifleri**: Fason teklifleri

#### Sevkiyat Tabloları
- **sevkiyatlar**: Sevkiyat ana tablosu
- **sevkiyat_kalemleri**: Sevkiyat kalemleri
- **sevkiyat_firmalari**: Sevkiyat firmaları
- **sevkiyat_lokasyonlari**: Sevkiyat lokasyonları
- **sevkiyat_resimleri**: Sevkiyat resimleri

#### İK Tabloları
- **personeller**: Personel bilgileri
- **vardiyalar**: Vardiya bilgileri
- **vardiya_atamalari**: Vardiya atamaları

#### Sipariş Tabloları
- **siparisler**: Sipariş ana tablosu
- **siparis_dokumanlari**: Sipariş dokümanları

#### Sistem Tabloları
- **gruplar**: Gruplar
- **not_kategorileri**: Not kategorileri
- **notlar**: Notlar
- **kategoriler**: Kategoriler

#### Makindex Tabloları
- **makindex_hiyerarsi**: Makindex hiyerarşi

## API Endpoint'leri

### Üretim Yönetimi
```
GET    /api/is-emirleri          - İş emirlerini listele
POST   /api/is-emirleri          - Yeni iş emri oluştur
GET    /api/is-emirleri/:id      - İş emri detayı
PUT    /api/is-emirleri/:id      - İş emri güncelle
DELETE /api/is-emirleri/:id      - İş emri sil
```

### Tezgah Yönetimi
```
GET    /api/tezgahlar            - Tezgah listesi
POST   /api/tezgahlar            - Yeni tezgah ekle
GET    /api/tezgahlar/:id        - Tezgah detayı
PUT    /api/tezgahlar/:id        - Tezgah güncelle
DELETE /api/tezgahlar/:id        - Tezgah sil
GET    /api/tezgah/durum/:id     - Tezgah durumu
PUT    /api/tezgah/durum/:id     - Tezgah durumu güncelle
```

### Parça Yönetimi
```
GET    /api/parcalar             - Parça listesi
POST   /api/parcalar             - Yeni parça ekle
GET    /api/parcalar/:id         - Parça detayı
PUT    /api/parcalar/:id         - Parça güncelle
DELETE /api/parcalar/:id         - Parça sil
GET    /api/parcalar/search      - Parça ara
```

### BOM Yönetimi
```
GET    /api/boms                 - BOM listesi
POST   /api/boms                 - Yeni BOM oluştur
GET    /api/boms/:id             - BOM detayı
PUT    /api/boms/:id             - BOM güncelle
DELETE /api/boms/:id             - BOM sil
GET    /api/boms/analyze/:id     - BOM analizi
```

### Stok Yönetimi
```
GET    /api/stok-kartlari        - Stok kartları listesi
POST   /api/stok-kartlari        - Yeni stok kartı
GET    /api/stok-kartlari/:id    - Stok kartı detayı
PUT    /api/stok-kartlari/:id    - Stok kartı güncelle
DELETE /api/stok-kartlari/:id    - Stok kartı sil
GET    /api/stok/durum/:parcaId  - Parça stok durumu
```

### Üretim Planlama
```
GET    /api/uretim-plani         - Üretim planı listesi
POST   /api/uretim-plani         - Yeni üretim planı
GET    /api/uretim-plani/:id     - Üretim planı detayı
PUT    /api/uretim-plani/:id     - Üretim planı güncelle
DELETE /api/uretim-plani/:id     - Üretim planı sil
POST   /api/uretim-plani/excel   - Excel'den plan içe aktar
```

### Fason Yönetimi
```
GET    /api/fasonlar             - Fason listesi
POST   /api/fasonlar             - Yeni fason ekle
GET    /api/fasonlar/:id         - Fason detayı
PUT    /api/fasonlar/:id         - Fason güncelle
DELETE /api/fasonlar/:id         - Fason sil
GET    /api/fason-gruplari       - Fason grupları
```

### Sevkiyat Yönetimi
```
GET    /api/sevkiyat             - Sevkiyat listesi
POST   /api/sevkiyat             - Yeni sevkiyat oluştur
GET    /api/sevkiyat/:id         - Sevkiyat detayı
PUT    /api/sevkiyat/:id         - Sevkiyat güncelle
DELETE /api/sevkiyat/:id         - Sevkiyat sil
POST   /api/sevkiyat/resim       - Sevkiyat resim yükle
```

### Raporlama
```
GET    /api/raporlar/uretim      - Üretim raporu
GET    /api/raporlar/tezgah      - Tezgah raporu
GET    /api/raporlar/is-emri     - İş emri raporu
GET    /api/raporlar/stok        - Stok raporu
GET    /api/raporlar/excel       - Excel raporu indir
```

## CNC Panel Entegrasyonu

### ESP32 Yapılandırması
- **Konum**: `CNC_panel/` dizini
- **Platform**: PlatformIO tabanlı ESP32
- **Bağlantı**: WiFi ile ana sisteme bağlanır
- **İletişim**: HTTP/JSON formatında veri gönderir
- **Durum Kodları**: 0 (boşta), 1 (çalışıyor), 2 (hata/bakım)

### Veri Akışı
1. ESP32 tezgah durumunu sürekli izler
2. Değişiklik olduğunda ana sunucuya HTTP isteği gönderir
3. Sunucu veriyi veritabanına kaydeder
4. Socket.IO ile tüm istemcilere gerçek zamanlı bildirim gönderir

## Python CAD Araçları

### STEP BOM Analyzer
- **Konum**: `STEP_BOM_Analyzer/` dizini
- **Amaç**: STEP dosyalarından BOM çıkarma
- **Özellikler**:
  - STEP dosya parsing
  - 3D rendering ve thumbnail oluşturma
  - Çoklu format export (JSON, Excel, CSV, XML)
  - FreeCAD entegrasyonu
  - Ana sistem ile API entegrasyonu

### CAD Import Client
- **Konum**: `CAD_Import_Client/` dizini
- **Amaç**: SolidWorks otomasyonu
- **Özellikler**:
  - SolidWorks COM otomasyonu
  - Thumbnail oluşturma
  - Batch processing
  - WebSocket ile gerçek zamanlı iletişim
  - Sadece Windows (SolidWorks gerekli)

## Geliştirme Ortamı Kurulumu

### Gerekli Araçlar
- Node.js 18+
- NPM veya Yarn
- SQLite3
- Git
- Python 3.8+ (CAD araçları için)
- FreeCAD (STEP_BOM_Analyzer için)
- SolidWorks (CAD_Import_Client için, Windows only)
- PlatformIO (CNC Panel için)

### Kurulum Adımları
```bash
# 1. Tüm dependency'leri yükle
npm run install:all

# 2. Geliştirme modunda başlat
npm run dev

# 3. Frontend build
npm run build

# 4. Test çalıştırma
npm test
```

### Port Yapılandırması
- **Frontend**: 5173 (sabit)
- **Backend**: 3000 (sabit)
- Not: Portlar meşgulse otomatik olarak öldürülüp yeniden başlatılır

## Deployment

### Production Kurulumu
- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy)
- **Database**: SQLite (production-ready)
- **SSL**: HTTPS için yapılandırılabilir
- **Backup**: Otomatik veritabanı yedekleme

### Docker Kurulumu (İsteğe Bağlı)
- Backend ve frontend ayrı container'lar
- SQLite volume persistence
- Nginx reverse proxy container

## Güvenlik

### Authentication
- JWT token tabanlı authentication
- bcryptjs ile password hashing
- Role-based access control (isteğe bağlı)

### Data Security
- SQL injection koruması (Sequelize ORM)
- XSS koruması (Helmet middleware)
- CSRF koruması (isteğe bağlı)
- File upload güvenliği (Multer + Sharp)

### Network Security
- CORS yapılandırması
- Rate limiting
- HTTPS güçlendirme (production)

## Performance Optimizasyonu

### Backend Optimizasyonları
- SQLite connection pooling
- Sharp ile image optimization
- Compression middleware
- Caching stratejileri
- Batch processing destek

### Frontend Optimizasyonları
- Code splitting (React lazy loading)
- Material-UI tree shaking
- Image lazy loading
- Redux state normalization
- Service worker (isteğe bağlı)

## Testing

### Backend Testleri
```bash
cd backend
npm test                    # Jest testleri
npm test -- --coverage      # Coverage raporu
npm test -- --watch        # Watch modu
```

### Frontend Testleri
```bash
cd frontend
npm test                   # Vitest testleri
npm test -- --coverage     # Coverage raporu
npm test -- --ui          # Vitest UI
```

## Monitoring ve Logging

### Logging
- Winston tabanlı structured logging
- Log seviyeleri (error, warn, info, debug)
- File ve console output
- Request/Response logging

### Error Handling
- Global error handler middleware
- 404 error handling
- Graceful degradation
- Error reporting (isteğe bağlı)

## Socket.IO Real-time Events

### Client Events
- `connection` - Yeni bağlantı
- `disconnect` - Bağlantı kesilmesi
- `is_emri_guncelle` - İş emri güncellemesi
- `tezgah_durum_degisikligi` - Tezgah durumu değişikliği
- `stok_guncelleme` - Stok güncellemesi

### Server Events
- Real-time bildirimler
- Dashboard güncellemeleri
- System status değişiklikleri
- User activity tracking

## Development Best Practices

### Code Structure
- Feature-based organization
- Separation of concerns
- DRY principle
- SOLID principles

### Code Quality
- ESLint/Prettier configuration
- TypeScript migration plan (isteğe bağlı)
- Code review process
- Automated testing

### Git Workflow
- Feature branches
- Pull requests
- Code review requirements
- Semantic versioning

## Future Enhancements

### Planlanan Özellikler
- TypeScript migration
- Advanced analytics dashboard
- Machine learning predictions
- Mobile app (React Native)
- IoT device integration expansion
- Cloud deployment options

### Scalability Improvements
- Database migration (PostgreSQL/MySQL)
- Microservices architecture
- Load balancing
- Caching layer (Redis)
- CDN integration

## Support and Documentation

### İletişim
- Repository: ÜRTM Takip Sistemi
- Documentation: `/docs` klasörü
- Issues: GitHub Issues (varsa)

### Training
- User manuals in `/docs/users`
- Developer guides in `/docs/developers`
- API documentation in `/docs/api`

---

*Bu dokümantasyon projenin mevcut durumunu (v13.x serisi) yansıtmaktadır ve geliştirilmeye devam etmektedir.*