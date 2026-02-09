# ÜRTM Takip - Bilgi Tabanı İndeksi

## Dokümantasyon İndeksi

Bu indeks, ÜRTM Takip projesinin tüm dokümantasyonuna hızlı erişim sağlamak için oluşturulmuştur.

---

## 1. TEMEL DOKÜMANLAR

### [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
Tüm API endpoint'lerinin kapsamlı dokümantasyonu.

**İçindekiler:**
- RESTful API endpoint'leri
- Request/Response formatları
- Socket.IO events
- Hata kodları
- Rate limiting
- File upload

**Kullanım:**
```bash
# API referansı için
cat claudedocs/API_DOCUMENTATION.md
```

---

### [MODULE_DOCUMENTATION.md](./MODULE_DOCUMENTATION.md)
Tüm modüllerin detaylı açıklamaları.

**İçindekiler:**
- 20 ana modül
- Frontend/Backend bileşenleri
- İş akışları
- Modül ilişkileri

**Kullanım:**
```bash
# Modül referansı için
cat claudedocs/MODULE_DOCUMENTATION.md
```

---

### [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
Veritabanı şeması ve model ilişkileri.

**İçindekiler:**
- 38 veritabanı modeli
- Tablo yapıları
- İlişkiler (associations)
- Indexler
- Migrations

**Kullanım:**
```bash
# Veritabanı referansı için
cat claudedocs/DATABASE_SCHEMA.md
```

---

## 2. PROJE YAPISI

### Backend Yapısı
```
backend/src/
├── config/              # Konfigürasyon (4 dosya)
├── controllers/         # İş mantığı (48 controller)
├── middleware/          # Ara katman (6 middleware)
├── migrations/          # Veritabanı göçleri (18+)
├── models/              # Veritabanı modelleri (38 model)
├── modules/             # Modüler yapı (DDD)
├── routes/              # API rotaları (64 route)
├── services/            # İş servisleri (7 service)
├── socket/              # Socket.IO namespace'leri
├── tests/               # Test dosyaları
├── utils/               # Yardımcı fonksiyonlar
└── index.js             # Ana giriş noktası
```

### Frontend Yapısı
```
frontend/src/
├── api/                     # API istemcileri
├── components/              # React bileşenleri (200+)
│   ├── common/              # Ortak bileşenler
│   ├── mobile/              # Mobil bileşenler
│   └── [moduller]/          # Modül bileşenleri
├── hooks/                   # Custom hooks (4)
├── modules/                 # Modüler yapı
├── pages/                   # Sayfa bileşenleri (20+)
├── services/                # API servisleri (10+)
├── store/                   # Redux store
│   └── slices/              # Redux slices (6)
├── styles/                  # Stil dosyaları
├── tests/                   # Test dosyaları
├── utils/                   # Yardımcı fonksiyonlar
├── theme.js                 # Masaüstü teması
├── theme.mobile.js          # Mobil teması
├── App.jsx                  # Ana uygulama
└── main.jsx                 # Giriş noktası
```

---

## 3. MODÜLLER HARİTASI

### Üretim Yönetimi
- **İş Emirleri** → `backend/src/controllers/isEmirleriController.js`
- **Tezgahlar** → `backend/src/controllers/tezgahlarController.js`
- **Üretim Planları** → `backend/src/controllers/uretimPlaniController.js`

### Parça ve Malzeme
- **Parçalar** → `backend/src/controllers/parcalarController.js`
- **BOM Yönetimi** → `backend/src/controllers/bomsController.js`
- **Stok Kartları** → `backend/src/controllers/stokKartlariController.js`

### Dış İşlemler
- **Fason Yönetimi** → `backend/src/controllers/fasonController.js`
- **Sevkiyat** → `backend/src/controllers/sevkiyatController.js`
- **Tedarik** → `backend/src/controllers/tedarikController.js`

### Finans
- **Faturalar** → `backend/src/controllers/faturalarController.js`
- **İrsaliyeler** → `backend/src/controllers/irsaliyelerController.js`

### Bakım
- **Arıza-Bakım** → `backend/src/controllers/arizaBakimController.js`
- **Vardiya Yönetimi** → `backend/src/controllers/vardiyalarController.js`

### Diğer
- **MAKINDEX** → `backend/src/controllers/makindexController.js`
- **Notlar** → `backend/src/controllers/notlarController.js`
- **Raporlar** → `backend/src/controllers/raporlarController.js`

---

## 4. ROUTE MAP

### İş Emirleri
```
GET    /api/is-emirleri              → Liste
POST   /api/is-emirleri              → Oluştur
PUT    /api/is-emirleri/:id          → Güncelle
DELETE /api/is-emirleri/:id          → Sil
POST   /api/is-emirleri/sirala       → Sırala
POST   /api/is-emirleri/batch-create → Toplu oluştur
```

### Tezgahlar
```
GET    /api/tezgahlar            → Liste
POST   /api/tezgahlar            → Oluştur
PUT    /api/tezgahlar/:id        → Güncelle
DELETE /api/tezgahlar/:id        → Sil
POST   /api/tezgahlar/:id/ata-is → İş ata
```

### Parçalar
```
GET    /api/parcalar        → Liste
POST   /api/parcalar        → Oluştur
GET    /api/parcalar/:kod   → Detay
PUT    /api/parcalar/:kod   → Güncelle
DELETE /api/parcalar/:kod   → Sil
```

---

## 5. DATABASE MODEL MAP

### Çekirdek Modeller
```
IsEmri          → iş_emirleri
Tezgah          → tezgahlar
Parca           → parcalar
UretimPlani     → uretim_plani
UretimPlaniV2   → uretim_planlari
```

### Yönetim Modelleri
```
Fason          → fason
FasonGrup      → fason_gruplar
ArizaBakim     → ariza_bakim
Vardiya        → vardiyalar
Personel       → personel
```

### Stok Modelleri
```
StokKarti        → stok_kartlari
Bom              → boms
Sevkiyat         → sevkiyat
SevkiyatKalem    → sevkiyat_kalemleri
```

### Finans Modelleri
```
Fatura           → faturalar
FaturaKalem      → fatura_kalemleri
Irsaliye         → irsaliyeler
IrsaliyeKalem    → irsaliye_kalemleri
```

---

## 6. COMPONENT MAP

### İş Emri Bileşenleri
```
IsEmriKarti.jsx           → Desktop kart
IsEmriKartiMobile.jsx     → Mobil kart
IsEmriListesi.jsx         → Liste
IsEmriKanbanBoard.jsx     → Kanban board
IsEmriEkleForm.jsx        → Ekleme formu
IsEmriDuzenleForm.jsx     → Düzenleme formu
```

### Parça Bileşenleri
```
ParcaKarti.jsx            → Parça kartı
ParcaSecici.jsx           → Parça seçici
ParcaDuzenleForm.jsx      → Düzenleme
ParcaBirlesikYonetimi.jsx → Birleştirme
```

### Tezgah Bileşenleri
```
TezgahKarti.jsx               → Tezgah kartı
TezgahKutusu.jsx               → Tezgah kutusu
TezgahPerformansDashboard.jsx  → Dashboard
```

---

## 7. SOCKET.IO NAMESPACES

### Main Namespace (`/`)
```
isEmriGuncellendi         → İş emri güncellemesi
stok-degisti              → Stok değişikliği
parca-eklendi             → Yeni parça
bom-guncellendi           → BOM güncellemesi
makina-sinifi-guncellendi → Makina sınıfı güncellemesi
```

### CAD Import Namespace (`/cad-import`)
```
register-client    → Client kaydı
job-progress       → İş ilerlemesi
file-processed     → Dosya işlendi
heartbeat          → Heartbeat
start-job          → İş başlat
stop-job           → İş durdur
```

### Fatura Eşleştirme
```
fatura-eslestirme  → Fatura eşleştirme
irsaliye-updated   → İrsaliye güncellendi
```

---

## 8. REDUX SLICES

### State Management
```
isEmirleriSlice     → İş emirleri durumu
makindexSlice       → MAKINDEX durumu
schedulerSlice      → Scheduler durumu
timelineSlice       → Timeline durumu
uretimPlaniSlice    → Üretim planı durumu
arizaBakimSlice     → Arıza-bakım durumu
```

---

## 9. CUSTOM HOOKS

```
useDeviceDetect()     → Mobil/masaüstü algılama
useDeviceOverride()   → Cihaz geçişi
usePullToRefresh()    → Pull-to-refresh
useStokKartlari()     → Stok kartları yönetimi
```

---

## 10. MIDDLEWARE

### Backend Middleware
```
auth.js                → Kimlik doğrulama
errorHandler.js        → Hata yönetimi
rateLimiter.js         → İstek sınırlama
socket.js              → Socket.IO
teknikResimUpload.js   → Dosya yükleme
```

---

## 11. MIGRATIONS

### Mevcut Migrations
```
20240912000001-add-tahmini-isleme-suresi.js
20250924_add_cost_fields_to_boms.js
20250701000001-create-notlar-tables.js
```

### Migration Komutları
```bash
npm run migrate                  # Tüm migrations
npm run migrate-durum            # Durum modülü
npm run rollback-durum-migration # Rollback
npm run check-durum-status       # Durum kontrolü
```

---

## 12. DEVELOPMENT COMMANDS

### Full Stack
```bash
npm run dev           # Development (backend + frontend)
npm run start         # Production
npm run build         # Frontend build
npm test              # Test
```

### Backend Only
```bash
cd backend
npm run dev           # Development (port 3000)
npm start             # Production
npm test              # Test
npm run migrate       # Migrations
```

### Frontend Only
```bash
cd frontend
npm run dev           # Development (port 5173)
npm run build         # Build
npm test              # Test
```

---

## 13. EXTERNAL INTEGRATIONS

### CNC Panel (ESP32)
**Location:** `CNC_panel/`
**Communication:** HTTP + Wi-Fi
**Status Codes:** 0 (idle), 1 (running), 2 (error)

### CAD Import Client
**Location:** `CAD_Import_Client/`
**Platform:** Python + Windows COM
**Format:** `.sldprt`, `.sldasm`

### STEP BOM Analyzer
**Location:** `STEP_BOM_Analyzer/`
**Platform:** Python + FreeCAD
**Format:** STEP files

---

## 14. PORT CONFIGURATION

### Development
- **Backend:** `3000`
- **Frontend:** `5173`

### Production
- **Backend:** `3000` (PM2)
- **Frontend:** Nginx serving static files

---

## 15. TESTING

### Backend Tests
```bash
cd backend
npm test              # Run Jest tests
```

### Frontend Tests
```bash
cd frontend
npm test              # Run Vitest tests
```

---

## 16. PERFORMANCE TIPS

### Backend
- SQLite WAL mode aktif
- Connection pooling
- Compression middleware
- Image optimization (Sharp)

### Frontend
- Code splitting (React lazy)
- Manual chunks (vendor, MUI, charts)
- Image lazy loading
- Redux state normalization

---

## 17. SECURITY

### Aktif Önlemler
- Helmet (HTTP headers)
- CORS (Cross-origin kontrolü)
- Rate limiting
- Input validation (Joi)
- File upload security (Multer)

---

## 18. LOGGING

### Winston Logger
- Error logs: `backend/error.log`
- Combined logs: `backend/combined.log`
- Console output: Development mode

---

## 19. COMMON ISSUES

### Port Conflicts
```bash
# Port 3000'i öldür
lsof -ti:3000 | xargs kill

# Port 5173'i öldür
lsof -ti:5173 | xargs kill
```

### Database Locks
```bash
# SQLite WAL mode kontrolü
sqlite3 backend/database.sqlite "PRAGMA journal_mode;"
```

### Migration Issues
```bash
# Migration durumunu kontrol et
npm run check-durum-status
```

---

## 20. FILE STRUCTURE REFERENCE

### Uploads
```
backend/uploads/       # Genel yüklemeler
backend/importlar/     # Excel içe aktarma
frontend/public/uploads/  # Frontend yüklemeleri
```

### Logs
```
backend/error.log      # Hata logları
backend/combined.log   # Tüm loglar
```

---

## 21. QUICK REFERENCE

### İş Emri Durumları
```
beklemede            → Oluşturuldu
atanacak             → Atama bekliyor
uretime_baslandi     → Üretime başlandı
uretimde             → Aktif üretim
tamamlandi           → Tamamlandı
iptal                → İptal edildi
fasona_gonderildi    → Fasona gönderildi
```

### Tezgah Durumları
```
musait    → İş kabul eder
calisiyor → Aktif üretim
bakim     → Bakımda/arıza
```

### Öncelik Seviyeleri
```
dusuk   → Düşük öncelik
orta    → Orta öncelik
yuksek  → Yüksek öncelik
kritik  → Kritik öncelik
```

---

## 22. GIT WORKFLOW

### Branch Strategy
- `main` → Production (v13)
- `v14.dev1` → Development

### Commit Convention
```
feat:  Yeni özellik
fix:   Bug fix
docs:  Dokümantasyon
refactor: Kod refactor
test:  Test ekleme
```

---

## 23. DEPENDENCIES

### Backend Key Dependencies
```
express          → Web framework
sequelize        → ORM
socket.io        → Real-time
winston          → Logging
multer           → File upload
joi              → Validation
```

### Frontend Key Dependencies
```
react            → UI framework
@mui/material    → UI components
@reduxjs/toolkit → State management
react-router-dom → Routing
axios            → HTTP client
socket.io-client → Real-time
```

---

## 24. CODE STYLE

### Naming Conventions
- **Backend:** `camelCase` (variables), `PascalCase` (classes)
- **Frontend:** `PascalCase` (components), `camelCase` (functions)
- **Database:** `snake_case` (fields)

### File Structure
- Controllers: `*Controller.js`
- Routes: `*Routes.js` veya `*.js`
- Components: `*.jsx`
- Services: `*.js`

---

## 25. USEFUL SNIPPETS

### API Call Example
```javascript
import axios from 'axios';

const response = await axios.get('/api/is-emirleri', {
  params: { durum: 'uretimde' }
});
```

### Socket.IO Example
```javascript
import { socket } from './utils/socketClient';

socket.on('isEmriGuncellendi', (data) => {
  console.log('İş emri güncellendi:', data);
});
```

### Redux Example
```javascript
import { useDispatch } from 'react-redux';
import { fetchIsEmirleri } from './store/slices/isEmirleriSlice';

const dispatch = useDispatch();
dispatch(fetchIsEmirleri());
```

---

## 26. DOCUMENTATION UPDATES

### Versiyon Geçmişi
- **v14.0.0** (2025) - MAKINDEX, CAD import, CNC panel
- **v13.0.0** (2024) - Üretim planı V2, Redux Toolkit
- **v12.0.0** (2024) - Fason, Stok kartları, Arıza-bakım

---

## 27. CONTACT & SUPPORT

### Development Team
- Backend Team
- Frontend Team
- DevOps Team

### Repository
- GitHub Repository

---

## 28. FUTURE PLANS

### Yakında Gelecek Özellikler
- TypeScript migration
- Microservices architecture
- Redis caching
- Real-time analytics dashboard
- Mobile app (React Native)

---

## SON GÜNCELLEME

**Tarih:** 2025-01-01
**Versiyon:** v14.0.0
**Durum:** Aktif Geliştirme

---

## KAYNAKLAR

### Dokümanlar
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [MODULE_DOCUMENTATION.md](./MODULE_DOCUMENTATION.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

### Proje Dosyaları
- `CLAUDE.md` - Proje genel bakış
- `package.json` - Dependencies
- `README.md` - Proje açıklaması

---

Bu indeks, ÜRTM Takip projesinin hızlı referans rehberidir. Detaylı bilgi için ilgili dokümanlara başvurunuz.
