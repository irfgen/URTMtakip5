# ⚡ ÜRTM Takip Hızlı Başlangıç Rehberi

## 🚀 5 Dakikada Başlayın

### 1. Kurulum
```bash
# Ana dizinde
npm run install:all  # Tüm bağımlılıkları kur
```

### 2. Sistemi Çalıştırın
```bash
npm run dev  # Backend (3000) + Frontend (5173)
```

### 3. Uygulamaya Erişin
- **Ana Uygulama**: http://localhost:5173
- **Mobile Arayüz**: http://localhost:5173/mobile
- **API Base URL**: http://localhost:3000/api

## 🎯 Rolünüze Göre Hızlı Linkler

### Backend Geliştiricisi
```bash
# Dokümanları göster
./nav role backend-dev

# Hızlı komutlar
cd backend && npm run dev    # Development
npm test                     # Testler
npm run migrate             # Migrasyon
```

### Frontend Geliştiricisi
```bash
# Dokümanları göster
./nav role frontend-dev

# Hızlı komutlar
cd frontend && npm run dev   # Development (port 5173)
npm test                    # Testler
npm run build              # Build
```

### Operatör
- **Giriş**: http://localhost:5173
- **Mobile**: http://localhost:5173/mobile
- [Operatör Rehberi](./docs/operator-guide.md)

### Yönetici
- **Dashboard**: http://localhost:5173/dashboard
- **Raporlar**: http://localhost:5173/raporlar
- [Yönetici Rehberi](./docs/manager-dashboard.md)

## 📚 Temel Modüller

| Modül | Açıklama | Link |
|-------|----------|------|
| İş Emirleri | Üretim iş takibi | `/is-emirleri` |
| Tezgahlar | Makine yönetimi | `/tezgahlar` |
| Parçalar | Parça kataloğu | `/parcalar` |
| Üretim Planı | Üretim planlama | `/uretim-plani` |
| Stok | Stok yönetimi | `/stok` |
| Sevkiyat | Sevkiyat takibi | `/sevkiyat` |

## 🔧 Sık Kullanılan Komutlar

```bash
# Portları öldür ve yeniden başlat
npm run stop && npm run dev

# Tüm modülleri kur
npm run install:all

# Veritabanı migrasyonu
cd backend && npm run migrate

# Frontend build
npm run build

# Testler
npm test  # Backend
cd frontend && npm test  # Frontend

# Production modunda çalıştır
npm run start
```

## 🆘 Yardım

```bash
# Navigasyon yardımı
./nav help

# Dokümantasyon
cat docs/README.md

# Tüm komutlar
./nav list-roles  # Roller
./nav list-types  # Doküman tipleri
```

## 📱 Mobile Uygulama

Mobile arayüz otomatik olarak algılanır:
- **URL**: http://localhost:5173/mobile
- **Responsive**: Otomatik mobil/desktop
- **Touch**: Dokunma optimizasyonlu

## 🔍 Hızlı Doküman Arama

**Dokümanlar:**
- [API Dokümantasyonu](./docs/api-documentation.md)
- [Veritabanı Şeması](./docs/database-schema.md)
- [React Komponentleri](./docs/react-components.md)
- [Troubleshooting](./docs/troubleshooting.md)

**Arama İpuçları:**
- API → `./nav type api`
- Veritabanı → `./nav type database`
- Frontend → `./nav type frontend`
- Deployment → `./nav type deployment`

---

**💡 İpucu**: Detaylı dokümantasyon için [Bilgi Bankası](./docs/knowledge-base-navigation.md) bölümüne göz atın.