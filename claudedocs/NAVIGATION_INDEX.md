# ÜRTM Takip - Dokümantasyon Navigasyon İndeksi

## 📑 Dokümantasyon Haritası

Bu indeks tüm dokümantasyon dosyalarını hızlı erişim için organize eder.

---

## 🎯 Hızlı Erişim

### Başlarken
- [README.md](#README.md) - Proje genel bakış
- [QUICK_GUIDE.md](#QUICK_GUIDE.md) - Hızlı başlangıç

### Geliştiriciler İçin
- [API_REFERENCE.md](#API_REFERENCE.md) - API endpoint'leri
- [DATABASE_SCHEMA.md](#DATABASE_SCHEMA.md) - Veritabanı şeması
- [FRONTEND_COMPONENTS.md](#FRONTEND_COMPONENTS.md) - Component'ler
- [SOCKET_EVENTS.md](#SOCKET_EVENTS.md) - WebSocket olayları

### Sistem Yöneticileri İçin
- [DEPLOYMENT.md](#DEPLOYMENT.md) - Deployment rehberi
- [TESTING.md](#TESTING.md) - Test stratejisi
- [ARCHITECTURE.md](#ARCHITECTURE.md) - Mimari kararları

---

## 📚 Dokümantasyon Dosyaları

### Ana Dokümantasyon

| Dosya | Konum | Açıklama |
|-------|-------|----------|
| [README.md](#README.md) | `/` | Proje genel bakış ve kurulum |
| [API_REFERENCE.md](#API_REFERENCE.md) | `/claudedocs/` | Tüm API endpoint'leri |
| [DATABASE_SCHEMA.md](#DATABASE_SCHEMA.md) | `/claudedocs/` | Veritabanı yapısı |
| [FRONTEND_COMPONENTS.md](#FRONTEND_COMPONENTS.md) | `/claudedocs/` | Component referansı |
| [SOCKET_EVENTS.md](#SOCKET_EVENTS.md) | `/claudedocs/` | WebSocket olayları |

### Proje Dokümantasyonu

| Dosya | Konum | Açıklama |
|-------|-------|----------|
| QUICK_GUIDE.md | `/` | 5 dakikalık hızlı başlangıç |
| CLAUDE.md | `/` | Claude Code talimatları |
| package.json | `/` | NPM script'leri ve bağımlılıklar |

### Sistem Dokümantasyonu

| Dosya | Konum | Açıklama |
|-------|-------|----------|
| ARCHITECTURE.md | `/docs/` | Sistem mimarisi |
| DEPLOYMENT.md | `/docs/` | Deployment rehberi |
| TESTING.md | `/docs/` | Test stratejisi |

---

## 🗂️ Kategori Bazlı Erişim

### Backend Development

#### API Endpoints
- [Core Endpoints](API_REFERENCE.md#core-endpoints)
- [Üretim Yönetimi](API_REFERENCE.md#üretim-yönetimi)
- [Parça ve Stok](API_REFERENCE.md#parça-ve-stok-yönetimi)
- [Makina ve Tezgah](API_REFERENCE.md#makina-ve-tezgah-yönetimi)
- [Sevkiyat](API_REFERENCE.md#sevkiyat-ve-lojistik)
- [Fatura/İrsaliye](API_REFERENCE.md#fatura-ve-irsaliye)

#### Models
- [Core Models](DATABASE_SCHEMA.md#core-modelleri)
- [Üretim Models](DATABASE_SCHEMA.md#üretim-modelleri)
- [Parça Models](DATABASE_SCHEMA.md#parça-ve-stok-modelleri)
- [Fatura Models](DATABASE_SCHEMA.md#fatura-ve-irsaliye-modelleri)

#### Routes
- `backend/src/routes/isEmirleriRoutes.js`
- `backend/src/routes/parcalarRoutes.js`
- `backend/src/routes/tezgahlarRoutes.js`
- `backend/src/routes/faturalarRoutes.js`

#### Controllers
- `backend/src/controllers/isEmirleriController.js`
- `backend/src/controllers/parcaController.js`
- `backend/src/controllers/faturaController.js`

### Frontend Development

#### Pages
- [Desktop Pages](FRONTEND_COMPONENTS.md#desktop-pages)
- [Mobile Pages](FRONTEND_COMPONENTS.md#mobile-pages)
- [Raporlar Pages](FRONTEND_COMPONENTS.md#raporlar-pages)

#### Components
- [Layout Components](FRONTEND_COMPONENTS.md#layout-components)
- [Common Components](FRONTEND_COMPONENTS.md#common-components)
- [Production Management](FRONTEND_COMPONENTS.md#production-management)
- [Mobile Components](FRONTEND_COMPONENTS.md#mobile-components)

#### Services
- `frontend/src/services/api.js`
- `frontend/src/services/faturaIrsaliyeSocket.js`
- `frontend/src/services/stokKartlariService.js`

#### Redux Slices
- `frontend/src/store/slices/isEmirleriSlice.js`
- `frontend/src/store/slices/uretimPlaniSlice.js`

---

## 🔍 Arama Konuları

### API Endpoint'leri
- **İş Emirleri**: `GET /api/is-emirleri`, `POST /api/is-emirleri`
- **Parçalar**: `GET /api/parcalar`, `POST /api/parcalar`
- **Tezgahlar**: `GET /api/tezgahlar`, `POST /api/tezgahlar`
- **Faturalar**: `GET /api/faturalar`, `POST /api/faturalar`
- **İrsaliyeler**: `GET /api/irsaliyeler`, `POST /api/irsaliyeler`

### Veritabanı Tabloları
- **is_emirleri**: İş emri kayıtları
- **parcalar**: Parça kartları
- **tezgahlar**: Tezgah bilgileri
- **faturalar**: Fatura kayıtları
- **irsaliyeler**: İrsaliye kayıtları
- **boms**: BOM kayıtları

### Component'ler
- **IsEmriKarti**: İş emri kartı
- **ParcaKarti**: Parça kartı
- **TezgahKarti**: Tezgah kartı
- **FaturaForm**: Fatura form'u
- **Dashboard**: Ana dashboard

### Socket Events
- **bom-guncellendi**: BOM güncellemeleri
- **isEmriGuncellendi**: İş emri değişiklikleri
- **stok-degisti**: Stok değişiklikleri
- **eslestirme-tamamlandi**: Eşleştirme tamamlandı

---

## 📖 Okuma Sırası

### Yeni Geliştirici
1. [README.md](#README.md) - Projeyi anlama
2. [QUICK_GUIDE.md](#QUICK_GUIDE.md) - Kurulum ve başlatma
3. [ARCHITECTURE.md](#ARCHITECTURE.md) - Mimariyi anlama
4. [API_REFERENCE.md](#API_REFERENCE.md) - API kullanımı
5. [FRONTEND_COMPONENTS.md](#FRONTEND_COMPONENTS.md) - Component kullanımı

### Backend Geliştirici
1. [DATABASE_SCHEMA.md](#DATABASE_SCHEMA.md) - Veritabanı yapısı
2. [API_REFERENCE.md](#API_REFERENCE.md) - Endpoint'ler
3. [ARCHITECTURE.md](#ARCHITECTURE.md) - Backend mimarisi
4. [TESTING.md](#TESTING.md) - Test yazma

### Frontend Geliştirici
1. [FRONTEND_COMPONENTS.md](#FRONTEND_COMPONENTS.md) - Component'ler
2. [API_REFERENCE.md](#API_REFERENCE.md) - API kullanımı
3. [SOCKET_EVENTS.md](#SOCKET_EVENTS.md) - Real-time güncellemeler
4. [MOBILE_SUPPORT.md](#MOBILE_SUPPORT.md) - Mobil geliştirme

### DevOps
1. [DEPLOYMENT.md](#DEPLOYMENT.md) - Deployment süreci
2. [ARCHITECTURE.md](#ARCHITECTURE.md) - Sistem yapısı
3. [TESTING.md](#TESTING.md) - Test stratejisi

---

## 🎓 Öğrenme Yolları

### Üretim Yönetimi Modülü
1. **Backend**: `isEmirleriController.js` → `isEmirleriRoutes.js`
2. **Frontend**: `IsEmriKarti.jsx` → `IsEmirler.jsx`
3. **API**: `GET /api/is-emirleri` → `POST /api/is-emirleri`
4. **Socket**: `isEmriGuncellendi` event

### Parça Yönetimi Modülü
1. **Backend**: `parcaController.js` → `parcalarRoutes.js`
2. **Frontend**: `ParcaKarti.jsx` → `Parcalar.jsx`
3. **API**: `GET /api/parcalar` → `POST /api/parcalar`
4. **Database**: `parcalar` table

### Fatura/İrsaliye Modülü
1. **Backend**: `faturaController.js` + `irsaliyeController.js`
2. **Frontend**: `FaturaForm.jsx` + `IrsaliyeForm.jsx`
3. **API**: `GET /api/faturalar` → `GET /api/irsaliyeler`
4. **Socket**: `/fatura-eslestirme` namespace

---

## 📁 Dosya Konumları

### Backend
```
backend/src/
├── config/           # Konfigürasyon
├── controllers/      # İş mantığı
├── models/           # Veritabanı modelleri
├── routes/           # API route'ları
├── middleware/       # Express middleware
├── services/         # Business servisler
├── socket/           # Socket.IO namespace'leri
├── migrations/       # Database migration'ları
└── utils/            # Yardımcı fonksiyonlar
```

### Frontend
```
frontend/src/
├── api/              # API client'leri
├── components/       # React component'leri
├── pages/            # Sayfa component'leri
├── store/            # Redux store
├── hooks/            # Custom hooks
├── services/         # Frontend servisler
└── utils/            # Yardımcı fonksiyonlar
```

---

## 🔗 Çapraz Referanslar

### API → Database
- `POST /api/parcalar` → `parcalar` table
- `GET /api/is-emirleri` → `is_emirleri` table
- `POST /api/faturalar` → `faturalar` table

### API → Frontend
- `api.js` → All API calls
- `faturaIrsaliyeSocket.js` → `/fatura-eslestirme` namespace

### Database → Socket
- `parcalar` table → `parca-eklendi` event
- `is_emirleri` table → `isEmriGuncellendi` event
- `stok_kartlari` table → `stok-degisti` event

---

## 📝 Güncelleme Geçmişi

### v14.dev1 (2024-12-24)
- Fatura-İrsaliye eşleştirme sistemi
- Socket.IO namespace'leri
- Dokümantasyon indeksi oluşturuldu

### v13.x (2024)
- Mobil UI iyileştirmeleri
- Makindex hiyerarşik sistem
- Test altyapısı

---

## 🛠️ Araçlar ve Komutlar

### Development
```bash
npm run dev              # Tüm sistemi başlat
cd backend && npm run dev  # Sadece backend
cd frontend && npm run dev  # Sadece frontend
```

### Testing
```bash
npm test                 # Backend tests
npm run test:frontend    # Frontend tests
```

### Build
```bash
npm run build            # Production build
```

---

## 📞 Destek

### Sorun Giderme
- [ARCHITECTURE.md](#ARCHITECTURE.md) - Mimari sorunları
- [TESTING.md](#TESTING.md) - Test sorunları
- [DEPLOYMENT.md](#DEPLOYMENT.md) - Deployment sorunları

### İletişim
- Git Issues: Project GitHub repository
- PM Agent: Aktif (Serena MCP)

---

*Son güncelleme: 2024-12-24 | Dokümantasyon Versiyon: v1.0*
