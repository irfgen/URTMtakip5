# ÜRTM Takip Dokümantasyon Merkezi

## 📖 Hızlı Navigasyon

**🚀 Comprehensive English Documentation:**
- [Project Overview](PROJECT_OVERVIEW.md) - Complete system overview and architecture
- [API Reference](API_REFERENCE.md) - Complete API endpoint documentation
- [Component Structure](COMPONENTS.md) - Frontend component hierarchy and props
- [Database Schema](DATABASE.md) - Database tables and relationships
- [Development Guide](DEVELOPMENT.md) - Development workflow and procedures

**🚀 Hızlı Başlangıç İçin (Turkish):**
- [Bilgi Bankası Ana Dizin](knowledge-base-navigation.md) - Tüm dokümantasyon için ana navigasyon
- [Hızlı Başlangıç Rehberi](quick-start.md) - 5 dakikada sistemi çalıştırın
- [API Dokümantasyonu](api-documentation.md) - API endpoint'leri
- [React Komponentleri](react-components.md) - Frontend komponentleri

**👥 Rolünüze Özel Dokümanlar:**
```bash
# Navigasyon yardımcısını kullanın
node docs/nav-helper.js role backend-dev    # Backend geliştiricisi
node docs/nav-helper.js role frontend-dev   # Frontend geliştiricisi
node docs/nav-helper.js role fullstack-dev  # Full-stack geliştiricisi
node docs/nav-helper.js role devops         # DevOps mühendisi
node docs/nav-helper.js role operator       # Operatör
node docs/nav-helper.js role manager        # Yönetici
```

## 📚 Kategori Bazlı Dokümanlar

### API ve Backend
- [API Dokümantasyonu](api-documentation.md) - Tüm API endpoint'leri
- [Backend Mimarisi](backend-architecture.md) - Sunucu tarafı mimari
- [Veritabanı Şeması](database-schema.md) - Veritabanı yapısı
- [Authentication Sistemi](authentication-system.md) - Kimlik doğrulama

### Frontend ve UI
- [React Komponentleri](react-components.md) - Komponent kütüphanesi
- [Frontend Mimarisi](frontend-architecture.md) - İstemci tarafı mimari
- [Redux Toolkit Guide](redux-toolkit-guide.md) - State yönetimi
- [UI/UX Kuralları](ui-ux-guidelines.md) - Tasarım standartları
- [Mobile App](mobile-app-usage.md) - Mobil uygulama

### Üretim Modülleri
- [İş Emirleri](modules/work-orders.md) - Work Orders modülü
- [Tezgahlar](modules/workstations.md) - Workstation modülü
- [Parça Yönetimi](modules/parts-management.md) - Parts modülü
- [Üretim Planlama](modules/production-planning.md) - Production Planning
- [BOM Yönetimi](modules/bom-management.md) - Bill of Materials

### Deployment ve Operations
- [Deployment Guide](deployment-guide.md) - Yayınlama rehberi
- [Development Environment](development-environment.md) - Geliştirme ortamı
- [Performance Optimization](performance-optimization.md) - Performans
- [Backup Management](backup-management.md) - Yedekleme

### Entegrasyonlar
- [CNC Panel ESP32](integrations/cnc-panel-esp32.md) - Donanım entegrasyonu
- [CAD Integration](integrations/cad-integration.md) - CAD yazılımları
- [Excel Integration](integrations/excel-integration.md) - Excel entegrasyonu

### Rehberler ve Dökümanlar
- [Operator Guide](operator-guide.md) - Operatör kullanım rehberi
- [Manager Dashboard](manager-dashboard.md) - Yönetim paneli
- [Troubleshooting](troubleshooting.md) - Sorun çözümü
- [FAQ](faq.md) - Sıkça sorulan sorular

## 🎯 Hızlı Komutlar

```bash
# Sistemi başlat
npm run dev

# Testleri çalıştır
npm test

# Build
npm run build

# Tüm bağımlılıkları kur
npm run install:all

# Veritabanı migrasyonu
cd backend && npm run migrate

# Frontend testleri
cd frontend && npm test
```

## 🔍 Doküman Arama

**Etiketler:**
- `#api` - API dokümanları
- `#frontend` - Frontend geliştirme
- `#backend` - Backend geliştirme
- `#database` - Veritabanı
- `#deployment` - Deployment
- `#mobile` - Mobil uygulama
- `#production` - Üretim modülleri

**Anahtar Kelimeler:**
- Express.js, React, Redux, Sequelize, SQLite, Socket.IO, Material-UI, Vite, ESP32

## 📊 Proje Bilgisi

- **Versiyon**: v13.dev18
- **Son Güncelleme**: 2025-12-22
- **Lisans**: [LICENSE](../LICENSE)
- **Katkı**: [CONTRIBUTING.md](../CONTRIBUTING.md)

## 🤝 Destek

- **Topluluk**: [Discord](https://discord.gg/urtmtakip)
- **Forum**: [Forum](https://forum.urtmtakip.com)
- **Issue**: [GitHub Issues](https://github.com/urtmtakip/issues)

---

**💡 İpucu**: Dokümantasyon içinde hızlıca gezinmek için `nav-helper.js` script'ini kullanın:
```bash
node docs/nav-helper.js help
```