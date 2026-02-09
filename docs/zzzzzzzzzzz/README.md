# ÜRTM Takip Sistemi - Proje Dokümantasyonu

## 📋 Sistem Genel Bakış

**ÜRTM Takip Sistemi**, endüstriyel üretim takibi ve yönetimi için geliştirilmiş kapsamlı bir ERP çözümüdür. Sistem; üretim planlama, iş emri yönetimi, stok takibi, tezgah monitoringi ve CAD entegrasyonu gibi modüller içeren tam entegre bir platform sunar.

### 🎯 Temel Özellikler
- ✅ **Real-time Üretim Takibi**: Anlık iş emri ve tezgah durumu monitoring
- ✅ **Responsive Web Arayüzü**: Mobil ve masaüstü uyumlu modern arayüz
- ✅ **Multi-platform Client'lar**: ESP32, Python tabanlı özel uygulamalar
- ✅ **CAD Entegrasyonu**: SolidWorks ve STEP dosya entegrasyonu
- ✅ **Advanced Reporting**: Kapsamlı raporlama ve analitik özellikleri
- ✅ **BOM Yönetimi**: Hiyerarşik malzeme listesi yönetimi
- ✅ **Stok Optimizasyonu**: Otomatik stok seviye takibi ve uyarıları

---

## 🏗️ Sistem Mimarisi

### 📊 Teknoloji Stack
```
Frontend: React 18.2.0 + Material-UI + Redux Toolkit
Backend:  Node.js + Express.js + Socket.IO
Database:  SQLite + Sequelize ORM
Client:   Python (Tkinter/FreeCAD) + ESP32
```

### 🖥️ Platform Bileşenleri

#### 1. Web Uygulaması (Frontend + Backend)
- **Frontend**: 255+ React component, ~88K kod satırı
- **Backend**: 180+ Node.js modülü, ~36K kod satırı
- **Özellikler**: Responsive tasarım, real-time updates, modern UI

#### 2. Client Programları
- **CNC Panel**: ESP32 tabanlı tezgah monitoring cihazı
- **STEP BOM Analyzer**: STEP dosyalarından BOM çıkaran Python uygulaması
- **CAD Import Client**: SolidWorks otomasyon client'i
- **Dizin Tarama Client**: Windows dizin tarayıcı uygulaması

#### 3. Veritabanı ve API
- **Database**: SQLite ile portatif veritabanı
- **API**: 60+ REST endpoint, WebSocket real-time iletişim
- **Security**: JWT authentication, rate limiting, input validation

---

## 📚 Dokümantasyon İçeriği

### 🔗 Ana Dokümanlar

| Doküman | Açıklama | Hedef Kitle |
|---------|----------|-------------|
| [📖 API Documentation](./API_Documentation.md) | Tüm REST API endpoint'leri | Geliştiriciler |
| [🎨 Frontend Component Docs](./Frontend_Component_Documentation.md) | React component dokümantasyonu | Frontend geliştiricileri |
| [🖥️ Client Programs Docs](./Client_Programs_Documentation.md) | Client programları rehberi | Sistem yöneticileri |
| [📊 Makindex API](./Makindex_API.md) | Makindex modülü API dokümanı | Makindex kullanıcıları |
| [🗄️ Makindex Database Schema](./Makindex_Database_Schema.md) | Veritabanı yapısı | Veritabanı yöneticileri |

### 📖 Kullanım Kılavuzları

| Konu | Doküman | Açıklama |
|------|---------|----------|
| 🚀 **Kurulum** | [CLAUDE.md](../CLAUDE.md) | Sistem kurulum ve başlangıç rehberi |
| 🔧 **Geliştirme** | [Development Guide](../CLAUDE.md#development-commands) | Geliştirme ortamı ve komutları |
| 📱 **Mobil Kullanım** | [Mobile Features](../CLAUDE.md#mobile-support) | Mobil arayüz özellikleri |
| 🔌 **CAD Entegrasyonu** | [CAD Tools](../CLAUDE.md#python-cad-tools) | CAD araçları entegrasyonu |

---

## 🚀 Hızlı Başlangıç

### 📋 Sistem Gereksinimleri

#### Minimum Gereksinimler
- **OS**: Windows 10+, Linux, macOS
- **RAM**: 8 GB (16 GB önerilir)
- **Storage**: 2 GB boş alan
- **Network**: İnternet bağlantısı
- **Python**: 3.8+ (client programları için)

#### Development Gereksinimleri
- **Node.js**: 18+ ve npm
- **Git**: Versiyon kontrolü
- **VS Code**: Geliştirme ortamı (önerilir)
- **FreeCAD**: STEP dosya işleme için
- **SolidWorks**: CAD entegrasyonu için (Windows)

### ⚡ Kurulum Adımları

#### 1. Ana Sistem Kurulumu
```bash
# 1. Repository clone
git clone <repository_url>
cd URTMtakip

# 2. Tüm bağımlılıkları kur
npm run install:all

# 3. Geliştirme ortamını başlat
npm run dev
```

#### 2. Client Programları Kurulumu

##### CNC Panel (ESP32)
```bash
cd CNC_panel
pio run              # Build
pio run -t upload    # ESP32'ye yükle
```

##### STEP BOM Analyzer
```bash
cd STEP_BOM_Analyzer
KURULUM.bat          # Otomatik kurulum (Windows)
```

##### CAD Import Client
```bash
cd CAD_Import_Client
pip install -r requirements.txt
python main.py
```

##### Dizin Tarama Client
```bash
cd DizinTarama_Client
simple_install.bat   # Hızlı kurulum
run_simple.bat       # Başlatma
```

### 🌐 Sisteme Erişim

#### Web Arayüzü
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

#### Default Giriş Bilgileri
- **Kullanıcı Adı**: admin
- **Şifre**: admin (geliştirme ortamı için)

---

## 🎯 Modüller ve Özellikler

### 🏭 Üretim Yönetimi

#### İş Emirleri (Work Orders)
- Oluşturma, güncelleme, silme
- Sürükle-bırak sıralama
- Durum yönetimi
- Toplu işlemler
- Excel içe/dışa aktarma

#### Üretim Planlama
- Plan oluşturma ve yönetimi
- Makina atama optimizasyonu
- Critical stock analizi
- Timeline ve Gantt chart
- Excel entegrasyonu

#### Tezgah Yönetimi
- Tezgah durum takibi
- Real-time monitoring
- Kapasite planlama
- Performans analizi

### 📦 Stok ve Parça Yönetimi

#### Parça Kartları
- Parça bilgileri ve teknik resimler
- Stok durumu takibi
- Fiyatlandırma ve maliyet analizi
- Tedarikçi bilgileri

#### Stok Kartları
- Stok hareketleri
- Minimum/maksimum seviye yönetimi
- Otomatik stok uyarıları
- Depo lokasyonu takibi

#### BOM Yönetimi
- Hiyerarşik malzeme listeleri
- Cost analizi
- Parça ilişkileri
- Versiyon kontrolü

### 📊 Raporlama ve Analitik

#### Üretim Raporları
- İş emri performansı
- Tezgah verimliliği
- Üretim istatistikleri
- Zaman çizelgesi analizi

#### Stok Raporları
- Stok durumu raporları
- Değerleme raporları
- Hareket raporları
- Tükenme riski analizi

#### Finansal Raporlar
- Maliyet analizi
- Kârlılık raporları
- Fason maliyetleri
- Sevkiyat raporları

### 🔧 Bakım ve Arıza Yönetimi

#### Arıza Kayıtları
- Arıza bildirim ve takibi
- Bakım planları
- Çözüm süresi analizi
- Personel atamaları

#### Preventif Bakım
- Bakım takvimi
- Otomatik bakım hatırlatmaları
- Yedek parça yönetimi
- Bakım maliyet analizi

---

## 🔄 Real-time Özellikler

### 📡 WebSocket Events
```javascript
// İş emri güncellemeleri
socket.on('isEmriGuncellendi', (data) => {
  // Real-time iş emri güncellemeleri
});

// Stok değişiklikleri
socket.on('stok-degisti', (data) => {
  // Stok seviyesi değişiklikleri
});

// Tezgah durumları
socket.on('tezgah-durum-guncellendi', (data) => {
  // Tezgah statüsü güncellemeleri
});
```

### 📱 Mobile Optimization
- Responsive tasarım
- Touch-optimized arayüz
- Offline destek
- Push notifications (gelecek sürüm)

---

## 🔗 Entegrasyonlar

### 🔌 CAD Entegrasyonu

#### SolidWorks Entegrasyonu
- Otomatik thumbnail oluşturma
- Meta-data çıkarma
- Versiyon kontrolü
- Batch processing

#### STEP Dosya Desteği
- 3D model işleme
- BOM çıkarma
- Görselleştirme
- FreeCAD entegrasyonu

### 📁 Dosya Yönetimi
- Teknik resim yükleme
- OCR desteği
- Versiyonlama
- Erişim kontrolü

### 🌐 API Entegrasyonu
- RESTful API
- WebSocket real-time
- Third-party entegrasyon desteği
- Webhook'lar (gelecek sürüm)

---

## 🛠️ Geliştirme

### 📋 Development Commands
```bash
# Full stack development
npm run dev              # Backend + Frontend
npm run build            # Frontend build
npm test                 # Backend tests
npm run test:frontend    # Frontend tests

# Backend only
cd backend
npm run dev              # Development server
npm start                # Production server
npm test                 # Run tests
npm run migrate          # Database migrations

# Frontend only
cd frontend
npm run dev              # Vite dev server
npm run build            # Production build
npm test                 # Run tests
```

### 🔧 Code Standards
- ESLint ve Prettier konfigürasyonu
- Git hooks ile pre-commit validation
- Semantic versioning
- Comprehensive testing

### 📊 Performance Monitoring
- Application performance monitoring
- Error tracking ve logging
- Database query optimization
- Frontend bundle optimization

---

## 🔒 Güvenlik

### 🛡️ Güvenlik Özellikleri
- JWT token-based authentication
- Password hashing (bcrypt)
- Input validation ve sanitization
- SQL injection koruması
- CORS yapılandırması
- Rate limiting
- File upload güvenliği

### 🔐 Access Control
- Rol bazlı yetkilendirme
- API endpoint koruması
- Veri erişim kontrolleri
- Audit logging

---

## 📚 Referanslar

### 📖 Dokümantasyon
- [React Documentation](https://react.dev/)
- [Material-UI Docs](https://mui.com/)
- [Node.js Guide](https://nodejs.org/en/docs/)
- [Express.js](https://expressjs.com/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Socket.IO](https://socket.io/docs/)
- [PlatformIO](https://docs.platformio.org/)
- [FreeCAD API](https://wiki.freecad.org/FreeCAD_Scripting_Basics)

### 🛠️ Tools ve Libraries
- **Frontend**: React, Redux Toolkit, Material-UI, Vite
- **Backend**: Express.js, Socket.IO, Sequelize, Winston
- **Database**: SQLite, Umzug migrations
- **Testing**: Jest, Vitest, React Testing Library
- **Development**: Nodemon, ESLint, Prettier

---

## 📞 Destek ve İletişim

### 🐛 Hata Raporlama
- GitHub Issues üzerinden bildirim
- Log dosyaları ile detaylı raporlama
- Ekran görüntüleri ve adımlar

### 💡 Öneri ve İstekler
- Feature request'ler için GitHub Discussions
- Kullanıcı geri bildirimleri
- İyileştirme önerileri

### 📧 Teknik Destek
- Sistem yöneticileri için teknik rehber
- Geliştiriciler için API dokümantasyonu
- Troubleshooting kılavuzları

---

## 📜 Lisans ve Versiyon

### 📄 Lisans
Bu proje [MIT Lisansı](../LICENSE) altında dağıtılmaktadır.

### 🏷️ Versiyon Bilgisi
- **Mevcut Versiyon**: v13.119
- **Release Date**: 2024-11-02
- **Node.js Version**: 18+
- **React Version**: 18.2.0
- **Python Version**: 3.8+

### 🔄 Update Geçmişi
- v13.x: Modern frontend ve mobile desteği
- v12.x: Real-time özellikler ve WebSocket entegrasyonu
- v11.x: CAD entegrasyonu ve client programları
- v10.x: Core özellikler ve web arayüzü

---

## 🔮 Gelecek Planları

### 📈 Short-term (3-6 ay)
- TypeScript geçişi
- Advanced reporting modülü
- Mobile uygulama (React Native)
- Enhanced security features

### 🎯 Medium-term (6-12 ay)
- Microservices mimari
- Cloud deployment desteği
- Machine learning entegrasyonu
- Advanced analytics

### 🚀 Long-term (1+ yıl)
- Enterprise features
- Multi-company desteği
- AI-powered optimization
- Global deployment

---

*Bu dokümantasyon ÜRTM Takip Sistemi'nin güncel durumunu yansıtmaktadır. Son güncelleme: 2024-11-02*

---

**🔗 Hızlı Linkler:**
- [🚀 Kurulum Rehberi](../CLAUDE.md#development-commands)
- [📡 API Dokümantasyonu](./API_Documentation.md)
- [🎨 Frontend Rehberi](./Frontend_Component_Documentation.md)
- [🖥️ Client Programları](./Client_Programs_Documentation.md)
- [🗄️ Veritabanı Şeması](./Makindex_Database_Schema.md)