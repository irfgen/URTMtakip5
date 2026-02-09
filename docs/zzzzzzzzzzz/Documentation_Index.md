# 📚 ÜRTM Takip Sistemi - Dokümantasyon İndeksi

## 🔍 Dokümantasyon Haritası

Bu indeks, ÜRTM Takip Sistemi'ndeki tüm dokümanları organize eder ve kolay navigasyon sağlar.

---

## 📖 Kategori Bazlı Dokümanlar

### 🚀 [Genel Bakış ve Başlangıç](./README.md)
**Sistem genel tanıtımı ve hızlı başlangıç rehberi**
- ✅ Sistem mimarisi ve teknoloji stack
- ✅ Kurulum adımları ve gereksinimler
- ✅ Modüller ve özellikler
- ✅ Real-time özellikler
- ✅ Entegrasyonlar
- ✅ Development ortamı kurulumu

### 📡 [API Dokümantasyonu](./API_Documentation.md)
**RESTful API endpoint'leri ve WebSocket olayları**
- 🔗 Authentication ve güvenlik
- 📋 Tüm modüllerin endpoint'leri
- 🔄 Real-time WebSocket olayları
- 📝 Request/Response formatları
- 🚨 Error handling
- 📊 Rate limiting ve performans

### 🎨 [Frontend Component Dokümantasyonu](./Frontend_Component_Documentation.md)
**React component'leri ve frontend mimarisi**
- 🏗️ Component yapısı ve organizasyonu
- 📱 Responsive tasarım ve mobil optimizasyon
- 🎨 Theming sistemi
- 🔄 State management (Redux Toolkit)
- 📱 Custom hooks
- 🎯 Component pattern'leri
- ⚡ Performans optimizasyonu

### 🖥️ [Client Programları Dokümantasyonu](./Client_Programs_Documentation.md)
**Python ve ESP32 tabanlı client programları**
- 🔧 CNC Panel (ESP32) kurulum ve kullanım
- 🔬 STEP BOM Analyzer (Python) entegrasyonu
- 🖼️ CAD Import Client (SolidWorks) otomasyonu
- 📁 Dizin Tarama Client (Windows) özellikleri
- 🔄 Client programları arası entegrasyon
- 🛠️ Development ve maintenance

### 🗄️ [Makindex Modül Dokümantasyonu](./Makindex_API.md)
**Hiyerarşik parça sistemi API ve kullanımı**
- 📊 API endpoint'leri
- 🏗️ Veritabanı yapısı
- 🔄 Real-time entegrasyon
- 📱 Frontend entegrasyonu

### 🗃️ [Makindex Veritabanı Şeması](./Makindex_Database_Schema.md)
**Makindex modülü veritabanı tasarımı**
- 📊 Tablo yapıları
- 🔗 İlişkiler ve constraint'ler
- 🔄 Veri akışı diagramları
- 📝 SQL sorgu örnekleri

---

## 🎯 Hedef Kitle Bazlı Rehberler

### 👨‍💻 Geliştiriciler İçin
| Konu | Doküman | Öncelik |
|------|---------|---------|
| 🚀 Sistem Kurulumu | [Genel Bakış](./README.md#hızlı-başlangıç) | 🟢 Yüksek |
| 📡 API Kullanımı | [API Dokümantasyonu](./API_Documentation.md) | 🟢 Yüksek |
| 🎨 Frontend Geliştirme | [Frontend Docs](./Frontend_Component_Documentation.md) | 🟡 Orta |
| 🖥️ Client Development | [Client Programs](./Client_Programs_Documentation.md) | 🟡 Orta |
| 🗄️ Veritabanı Tasarımı | [Makindex Schema](./Makindex_Database_Schema.md) | 🟡 Orta |

### 🔧 Sistem Yöneticileri İçin
| Konu | Doküman | Öncelik |
|------|---------|---------|
| 🚀 Kurulum ve Konfigürasyon | [Genel Bakış](./README.md#kurulum-adımları) | 🟢 Yüksek |
| 🖥️ Client Programları | [Client Programs](./Client_Programs_Documentation.md) | 🟢 Yüksek |
| 📊 Monitoring ve Bakım | [Genel Bakış](./README.md#performance-monitoring) | 🟡 Orta |
| 🔒 Güvenlik Konfigürasyonu | [API Dokümantasyonu](./API_Documentation.md#security-features) | 🟢 Yüksek |

### 👥 Son Kullanıcılar İçin
| Konu | Doküman | Öncelik |
|------|---------|---------|
| 🚀 Hızlı Başlangıç | [Genel Bakış](./README.md#kullanım-kılavuzları) | 🟢 Yüksek |
| 📱 Mobil Kullanım | [Frontend Docs](./Frontend_Component_Documentation.md#mobile-optimization) | 🟡 Orta |
| 🎯 Temel Özellikler | [Genel Bakış](./README.md#modüller-ve-özellikler) | 🟢 Yüksek |

---

## 🔗 Çapraz Referanslar

### 📊 Modül Bazlı Referanslar

| Modül | API Dokümanı | Frontend Component | Client Programı |
|-------|--------------|-------------------|------------------|
| 🏭 İş Emirleri | [İş Emirleri API](./API_Documentation.md#iş-emirleri-work-orders) | [İş Emirleri Component](./Frontend_Component_Documentation.md#iş-emirleri-work-orders) | - |
| 🏗️ Tezgahlar | [Tezgahlar API](./API_Documentation.md#tezgahlar-workstations) | [Tezgahlar Component](./Frontend_Component_Documentation.md#tezgahlar-workstations) | [CNC Panel](./Client_Programs_Documentation.md#1-cnc-panel-esp32) |
| 📦 Parçalar | [Parçalar API](./API_Documentation.md#parçalar-parts) | [Parçalar Component](./Frontend_Component_Documentation.md#parçalar-ve-stok-parts-inventory) | [CAD Import Client](./Client_Programs_Documentation.md#3-cad-import-client-python) |
| 📋 BOM Yönetimi | [BOM API](./API_Documentation.md#bom-yönetimi-bill-of-materials) | [BOM Component](./Frontend_Component_Documentation.md#bom-yönetimi-bill-of-materials) | [STEP BOM Analyzer](./Client_Programs_Documentation.md#2-step-bom-analyzer-python) |
| 📅 Üretim Planı | [Üretim Planı API](./API_Documentation.md#üretim-planı-production-planning) | [Üretim Planı Component](./Frontend_Component_Documentation.md#üretim-planı-production-planning) | - |
| 🗃️ Makindex | [Makindex API](./Makindex_API.md) | [Makindex Component](./Frontend_Component_Documentation.md#makindex-module) | - |

### 🔧 Teknoloji Bazlı Referanslar

| Teknoloji | İlgili Dokümanlar |
|------------|------------------|
| **React** | [Frontend Component Docs](./Frontend_Component_Documentation.md) |
| **Node.js** | [API Dokümantasyonu](./API_Documentation.md) |
| **Python** | [Client Programs](./Client_Programs_Documentation.md) |
| **ESP32** | [CNC Panel](./Client_Programs_Documentation.md#1-cnc-panel-esp32) |
| **Socket.IO** | [API Dokümantasyonu](./API_Documentation.md#real-time-communication-socketio), [Frontend Docs](./Frontend_Component_Documentation.md#real-time-features) |
| **SQLite** | [Makindex Database Schema](./Makindex_Database_Schema.md) |

---

## 🗺️ Navigasyon Akışları

### 🚀 Yeni Geliştirici Akışı
1. **Sistem Tanıtım** → [Genel Bakış](./README.md)
2. **Kurulum** → [Genel Bakış > Kurulum](./README.md#hızlı-başlangıç)
3. **API Öğrenme** → [API Dokümantasyonu](./API_Documentation.md)
4. **Frontend Geliştirme** → [Frontend Component Docs](./Frontend_Component_Documentation.md)
5. **Client Entegrasyon** → [Client Programs](./Client_Programs_Documentation.md)

### 🔧 Sistem Yöneticisi Akışı
1. **Kurulum ve Konfigürasyon** → [Genel Bakış](./README.md)
2. **Client Programları** → [Client Programs](./Client_Programs_Documentation.md)
3. **API Güvenliği** → [API Dokümantasyonu](./API_Documentation.md#security-features)
4. **Monitoring** → [Genel Bakış](./README.md#performance-monitoring)
5. **Troubleshooting** → [Client Programs > Troubleshooting](./Client_Programs_Documentation.md#troubleshooting)

### 👥 Son Kullanıcı Akışı
1. **Hızlı Başlangıç** → [Genel Bakış](./README.md#kullanım-kılavuzları)
2. **Temel Özellikler** → [Genel Bakış](./README.md#modüller-ve-özellikler)
3. **Mobil Kullanım** → [Frontend Docs](./Frontend_Component_Documentation.md#mobile-optimization)
4. **Destek** → [Genel Bakış](./README.md#destek-ve-iletişim)

---

## 🏷️ Etiket Bazlı Arama

### 🔍 Kategori Etiketleri
```
#api - API endpoint'leri ve dokümantasyonu
#frontend - React component'leri ve UI
#backend - Node.js server ve API
#mobile - Mobil özellikler ve optimizasyon
#database - Veritabanı şeması ve sorgular
#client - Client programları ve entegrasyon
#security - Güvenlik özellikleri ve konfigürasyon
#performance - Performans optimizasyonu ve monitoring
#deployment - Kurulum ve dağıtım
#troubleshooting - Sorun çözme ve hata ayıklama
```

### 🎯 Rol Bazlı Etiketler
```
#developer - Geliştirici için bilgiler
#admin - Sistem yöneticisi için bilgiler
#user - Son kullanıcı için bilgiler
#beginner - Başlangıç seviyesi bilgiler
#advanced - İleri seviye bilgiler
```

---

## 📱 Quick Reference

### 🚀 En Çok Kullanılan Linkler
- [🚀 Sistem Kurulumu](./README.md#hızlı-başlangıç)
- [📡 API Authentication](./API_Documentation.md#authentication)
- [🎨 Component Listesi](./Frontend_Component_Documentation.md#core-components)
- [🖥️ Client Kurulumu](./Client_Programs_Documentation.md#cnc-panel-esp32-kurulum)
- [🔧 Development Commands](./README.md#development-commands)

### 📊 İstatistikler
- **Toplam Doküman**: 7 ana doküman
- **API Endpoint'leri**: 60+
- **Frontend Component'leri**: 255+
- **Client Programları**: 4
- **Kapsanan Özellikler**: 20+ modül

---

## 🔗 Harici Kaynaklar

### 📖 Resmi Dokümantasyonlar
- [React Documentation](https://react.dev/)
- [Material-UI Docs](https://mui.com/)
- [Node.js Guide](https://nodejs.org/en/docs/)
- [Express.js](https://expressjs.com/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Socket.IO](https://socket.io/docs/)

### 🛠️ Development Tools
- [VS Code](https://code.visualstudio.com/)
- [PlatformIO](https://platformio.org/)
- [FreeCAD](https://www.freecadweb.org/)
- [Git Documentation](https://git-scm.com/doc)

---

## 📝 Dokümantasyon Katkıları

### ✍️ Dokümantasyon Güncelleme
- Her yeni özellik için ilgili dokümanı güncelle
- API değişikliklerini API dokümantasyonuna yansıt
- Component değişikliklerini frontend dokümantasyonuna ekle
- Client program güncellemelerini ilgili dokümanda belirt

### 🔄 Review Süreci
1. Doküman güncellemesi
2. Kod review ile doğrulama
3. Test senaryolarını güncelleme
4. Dokümantasyon yayınla

### 📊 Kalite Standartları
- ✅ Güncel ve doğrulanmış bilgiler
- ✅ Kod örnekleri ve pratik uygulamalar
- ✅ Çapraz referanslar ve linkler
- ✅ Hata ayıklama ve troubleshooting bilgileri
- ✅ Sürüm uyumluluğu notları

---

## 🔮 Gelecek Planları

### 📈 Dokümantasyon Geliştirmeleri
- 🎥 Video tutorial'lar
- 🔄 Interactive API browser
- 📱 Mobil uygulama dokümantasyonu
- 🤖 AI-powered yardım sistemi
- 🌐 Multi-language desteği

### 📚 Ek Kaynaklar
- 🎯 Best practice rehberleri
- 🔧 Advanced optimization teknikleri
- 📊 Case studies ve örnekler
- 🎪 Community contribution rehberleri

---

**💡 İpucu**: Bu indeksi bookmark'layarak tüm dokümanlara hızlı erişim sağlayabilirsiniz. Dokümanlar güncellendikçe bu indeks de otomatik olarak güncellenecektir.

---

*Son güncelleme: 2024-11-02 | Versiyon: v1.0*