# 🏗️ ÜRTM Takip Sistemi - Kapsamlı Mimar ve Bağımlılık Analizi

## 📊 Analiz Genel Bakışı

Bu analiz, ÜRTM Takip Sistemi'nin tüm mimari yapısını, bileşenlerinin birbiriyle ilişkilerini ve sistemin karmaşıklığını ortaya koymak amacıyla hazırlanmıştır. Sistem, endüstriyel üretim takibi için geliştirilmiş full-stack bir çözümdür.

**Proje Büyüklüğü:**
- **Backend**: ~36,000 satır kod, 180+ dosya
- **Frontend**: ~88,000 satır kod, 255+ dosya
- **Client Programları**: ~20,000+ satır kod, 4 platform
- **API Endpoint'leri**: 60+ REST endpoint
- **Veritabanı**: 32 tablo, karmaşık ilişkiler

---

## 🎯 Sistem Mimarisi Genel Görünüm

### 📋 Dört Katmanlı Mimari

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          🖥️ CLIENT PROGRAMLARI                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  ┌──────────────────┐     │
│  │   ESP32 CNC     │  │  STEP BOM        │  │   CAD Import      │  │  Dizin Tarama   │     │
│  │   Panel         │  │  Analyzer        │  │   Client          │  │  Client          │     │
│  │                 │  │                  │  │                   │  │                   │     │
│  │  Status: Real-  │  │  STEP Processing │  │  SolidWorks Auto    │  │  Directory Scan   │     │
│  │  Time Updates    │  │  & BOM Extraction │  │  & Thumbnail Gen.   │  │  & File Upload    │     │
│  └─────────────────┘  └──────────────────┘  └─────────────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │ HTTP/JSON & WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🌐 WEB APPLICATION (Frontend + Backend)             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     Frontend (React + MUI)                                │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐      │ │
│  │  │  Dashboard      │  │  İş Emirleri    │  │  Üretim Planı      │      │ │
│  │  │  & Analytics   │  │  & Management   │  │  & Optimization   │      │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘      │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐   │ │
│  │  │  State Management: Redux Toolkit                                   │   │ │
│  │  │  UI Framework: Material-UI + Custom Themes                     │   │ │
│  │  │  Device Detection: Mobile/Desktop Responsive Design              │   │ │
│  │  │  Real-time Updates: Socket.IO Client                               │   │ │
│  │  └───────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │ HTTP API + WebSocket
│                                    ▼
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     Backend (Node.js + Express)                           │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐      │ │
│  │  │  API Gateway    │  │  Business Logic  │  │  Real-time Hub     │      │ │
│  │  │  (60+ endpoints)│  │  (Controllers)   │  │  (Socket.IO)       │      │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘      │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐   │ │
│  │  │  Security Layer: JWT Authentication + Rate Limiting               │   │ │
│  │  │  Data Validation: Joi Input Validation                              │   │ │
│  │  │  File Management: Multer Upload + Static File Serving           │   │ │
│  │  │  Logging: Winston Structured Logging                             │   │ │
│  │  └───────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      🗄️ DATABASE LAYER (SQLite + Sequelize)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐      │
│  │  Business Data   │  │  User Auth       │  │  File & Media       │      │
│  │  (İş Emirleri,  │  │  (Users, Tokens) │  │  (Uploads,        │      │
│  │  Parçalar, ...)  │  │                 │  │  Thumbnails)        │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘      │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  32 Tables Total • Complex Relationships • Migrations • Indexing  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Bileşenler Arası İlişkiler

### 📊 API Katmanı İlişkileri

```mermaid
graph TD
    Client[Client Programları] --> API[Backend API Gateway]
    Frontend[Frontend React] --> API[Backend API Gateway]

    API --> Auth[Authentication Layer]
    API --> Routes[Route Handlers]
    API --> Controller[Business Logic Controllers]

    Controller --> DB[Database Layer]
    Controller --> SocketIO[Real-time Hub]

    SocketIO --> Frontend[Frontend Socket Client]
    SocketIO --> Client[Client Programs]

    DB --> SQLite[(SQLite Database)]
```

### 🏭 Veritabanı İlişki Haritası

```mermaid
erDiagram
    USERS ||--o{ USER_SESSIONS } : has
    USERS ||--o{ API_KEYS } : uses
    USERS ||--o{ USER_PREFERENCES } : has

    IS_EMIRLERI ||--o{ IS_EMRI_DURUM } : has
    IS_EMIRLERI ||--o{ PARCA_KAYITLARI } : tracks
    IS_EMIRLERI ||--o{ ISELEM_KAYITLARI } : logs
    IS_EMIRLERI ||--o{ URETIM_PLANLARI } : from
    IS_EMIRLERI ||--o{ TEZGAHLAR } : assigned_to

    TEZGAHLAR ||--o{ TEZGAH_DURUM_LOG } : logs
    TEZGAHLAR ||--o{ MAKINALAR } : includes

    PARcalar ||--o{ PARCA_KAYITLARI } : affects
    PARcalar ||--o{ BOM_ITEMS } : included_in
    PARcalar ||--o{ SEVKIYAT_KALEMLERI } : included_in

    URETIM_PLANLARI ||--o{ URETIM_PLAN_DETAY } : has
    URETIM_PLANLARI ||--o{ MAKINA_GROUP_PARTS } : includes

    BOMS ||--o{ BOM_ITEMS } : contains
    BOMS ||--o{ MAKINA_GROUPS } : categorized_by

    SEVKIYAT ||--o{ SEVKIYAT_KALEMLERI } : contains
    SEVKIYAT ||--o{ SEVKIYAT_RESIMLERI } : has

    NOTLAR ||--o{ KATEGORILER } : categorized_by
    FASONLAR ||--o{ FASON_GRUPLARI } : belongs_to
```

---

## 🔌 API Endpoint Mimarisi

### 📡 API Gateway Yapısı

```mermaid
graph LR
    subgraph "Client Request Flow"
        Client[Client Request] --> LB[Load Balancer]
        LB --> Gateway[API Gateway]
    end

    subgraph "Security Layer"
        Gateway --> Auth[JWT Auth Middleware]
        Gateway --> Rate[Rate Limiting]
        Gateway --> CORS[CORS Middleware]
        Gateway --> Validate[Input Validation]
    end

    subgraph "Route Layer"
        Validate --> Routes[Route Handlers]
        Routes --> Controller1[Business Controllers]
        Routes --> Controller2[File Controllers]
        Routes --> Controller3[Real-time Controllers]
    end

    subgraph "Business Logic"
        Controller1 --> Service1[Business Services]
        Controller2 --> Service2[File Services]
        Controller3 --> Service3[Real-time Services]
    end

    subgraph "Data Layer"
        Service1 --> DB[(SQLite Database)]
        Service2 --> Storage[File Storage]
        Service3 --> Cache[Redis Cache]
    end
```

### 📱 Frontend Component Mimarisi

```mermaid
graph TD
    subgraph "Layout Components"
        Layout[Layout.jsx]
        MobileLayout[MobileLayout.jsx]
    end

    subgraph "Page Components"
        Dashboard[Dashboard.jsx]
        IsEmirleri[IsEmirleri.jsx]
        Tezgahlar[Tezgahlar.jsx]
        Parcalar[Parcalar.jsx]
        UretimPlani[UretimPlani.jsx]
        StokKartlari[StokKartlari.jsx]
    end

    subgraph "Feature Components"
        Makindex[MakindexPage]
        WorkstationScheduler[WorkstationScheduler]
        DizinTarama[DizinTarama]
        Notlar[NotlarPage]
    end

    subgraph "Shared Components"
        DataGrid[MUI DataGrid]
        Forms[Form Components]
        Charts[Chart Components]
        Utils[Utility Components]
    end

    Layout --> Dashboard
    Layout --> IsEmirleri
    Layout --> Tezgahlar
    MobileLayout --> IsEmirleri
    MobileLayout --> Tezgahlar

    IsEmirleri --> Makindex
    Tezgahlar --> WorkstationScheduler
    Parcalar --> Notlar
    UretimPlani --> DizinTarama
```

---

## 🔄 Veri Akış Şemaları

### 📊 Üretim Süreci Akışı

```mermaid
flowchart TD
    A[Üretim Planı Oluşturma] --> B[Plan Doğrulma]
    B --> C[Parca Stok Kontrolü]
    C --> D{Stok Yeterli?}
    D -->|Evet| E[İş Emri Oluşturma]
    D -->|Hayır| F[Kritik Stok Uyarısı]
    F --> G[Satın Alma Planı]
    G --> C

    E --> H[Tezgah Atama]
    H --> I[İş Emri Başlatma]
    I --> J[Gerçek Zamanlı İzleme]

    J --> K[İş Tamamlandı?]
    K -->|Evet| L[Sevkiyat Hazırla]
    K -->|Hayır| M[İş Durumu Güncelleme]

    M --> J
    L --> N[Sevkiyat Tamamla]
    N --> O[Stok Güncelle]
    O --> P[Süreç Sonu]

    style A fill:#e1f5fe
    style P fill:#e8f5e8
    style E fill:#fff3e0
    style H fill:#f0fff4
    style I fill:#e8f5e8
    style L fill:#e8f5e8
    style N fill:#fff3e0
    style O fill:#e8f5e8
```

### 🔌 CAD Dosya İşleme Akışı

```mermaid
flowchart TD
    A[CAD Dosya Seçimi] --> B[Client Program Tespiti]
    B --> C[Dosya Formatı Kontrolü]
    C --> D{Desteklenen Format?}

    D -->|STEP| E[STEP BOM Analyzer]
    D -->|SolidWorks| F[CAD Import Client]
    D -->|PDF/Diğer| G[File Upload API]

    E --> H[FreeCAD İşlemi]
    F --> I[SolidWorks API]
    G --> J[Direct Upload]

    H --> K[BOM Çıkarma]
    I --> L[Thumbnail Oluşturma]
    J --> M[File Storage]

    K --> N[BOM Veritabanına Kaydet]
    L --> O[Thumbnail Storage]
    M --> P[File Meta Data Kaydet]

    N --> Q[Frontend Bildirimi]
    O --> Q
    P --> Q

    Q --> R[API Response]
    R --> S[İşlem Sonu]
```

### 📡 Real-time İletişim Akışı

```mermaid
sequenceDiagram
    participant ESP as ESP32 Panel
    participant API as Backend API
    participant DB as Database
    participant WS as WebSocket
    participant FE as Frontend

    ESP->>API: POST /api/cnc_link/status
    Note over ESP: Tezgah durumu güncellemesi

    API->>DB: Kaydet tezgah durumu
    API->>WS: Broadcast tezgah-guncellendi

    WS->>FE: Real-time güncelleme
    Note over WS: Tüm bağlı istemciler

    FE->>FE: UI güncelleme
    Note over FE: Anlık durum gösterimi
```

---

## 🖥️ Client Programları Entegrasyon Mimarisi

### 🔌 ESP32 CNC Panel Entegrasyonu

```mermaid
graph LR
    subgraph "ESP32 Device"
        ESP[ESP32 Microcontroller]
        WiFi[WiFi Module]
        IO[GPIO Inputs]
    end

    subgraph "Network Layer"
        HTTP[HTTP Client]
        JSON[JSON Parser]
    end

    subgraph "Backend System"
        API[CNC Link API]
        Socket[Socket.IO Hub]
        DB[(Database)]
    end

    IO --> ESP
    ESP --> WiFi
    WiFi --> HTTP
    HTTP --> API
    API --> DB
    API --> Socket
    Socket --> FE
```

### 🔬 Python CAD Programları Entegrasyonu

```mermaid
graph TD
    subgraph "Python Clients"
        STEP[STEP BOM Analyzer]
        CAD[CAD Import Client]
        Dizin[Dizin Tarama Client]
    end

    subgraph "External Systems"
        FreeCAD[FreeCAD API]
        SolidWorks[SolidWorks COM API]
        FileSystem[Windows File System]
    end

    subgraph "Backend System"
        API[CAD Import API]
        Socket[Socket.IO Hub]
        Storage[File Storage]
    end

    STEP --> FreeCAD
    CAD --> SolidWorks
    Dizin --> FileSystem

    FreeCAD --> API
    SolidWorks --> API
    FileSystem --> API

    API --> Socket
    API --> Storage
```

---

## 📊 Etki Analizi Haritası

### 🔴 Kritik Etki Alanları

| Değişiklik Alanı | Etkilen Bileşenler | Etki Seviyesi | Açıklama |
|-------------------|---------------------|---------------|----------|
| **Veritabanı Şeması** | Tüm sistem | 🔴 Kritik | Tablo ilişkileri değişirse tüm API'ler, frontend ve client'lar etkilenir |
| **Core API'ler** | Frontend + Client'lar | 🔴 Kritik | `/api/is-emirleri` gibi ana endpoint'ler tüm UI'leri etkiler |
| **Socket.IO Konfigurasyonu** | Real-time özellikler | 🔴 Kritik | Anlık güncellemeler bozulur |
| **Authentication Sistemi** | Tüm protected alanlar | 🔴 Kritik | Güvenlik açığı oluşur |

### 🟡 Orta Etki Alanları

| Değişiklik Alanı | Etkilen Bileşenler | Etki Seviyesi | Açıklama |
|-------------------|---------------------|---------------|----------|
| **Redux Store Yapısı** | Frontend state yönetimi | 🟡 Orta | State management bozulur |
| **Business Logic Katmanı** | API controller'ları | 🟡 Orta | İş kuralları etkilenir |
| **File Upload Sistemi** | CAD entegrasyonu | 🟡 Orta | Dosya işlemleri engellenir |
| **Database Modelleri** | API katmanı | 🟡 Orta | Veri işlemleri hata verir |

### 🟢 Düşük Etki Alanları

| Değişiklik Alanı | Etkilen Bileşenler | Etki Seviyesi | Açıklama |
|-------------------|---------------------|---------------|----------|
| **UI Component'leri** | Spesifik sayfalar | 🟢 Düşük | Sadece o sayfa etkilenir |
| **CSS Theme'leri** | Görünüm | 🟢 Düşük | Sadece görsel etkilenir |
| **Log Level'ları** | Debugging | 🟢 Düşük | Sadece geliştirme etkilenir |
| **Validation Kuralları** | Input doğrulma | 🟢 Düşük | Sadece veri kalitesini etkiler |

---

## 🎯 Değişiklik Etki Matrisi

### 📋 Sistem Bileşeni Değişiklikleri ve Etkileri

| Bileşen | Değişiklik Türü | Etkilen Alanlar | Etki Süresi | Geriye Dönüş | Test Gerekliliği |
|---------|----------------|----------------|--------------|-------------|-------------------|
| **Database Schema** | Tablo yapısı değişikliği | Tüm sistem | 1-2 gün | Migration gerekir | Migration test |
| **Core API** | Endpoint değişikliği | Frontend + Client'lar | 1-3 gün | API versiyonlama | Integration test |
| **Socket.IO** | Event yapısı değişikliği | Real-time özellikler | 2-5 gün | Event uyumsuzluğu | Real-time test |
| **Redux Store** | State yapısı değişikliği | Frontend | 1-2 hafta | State reset | Regression test |
| **Frontend Routes** | URL yapısı değişikliği | Navigation | 1 hafta | Link bozulur | Navigation test |
| **Client Protocol** | İletişim protokolü | Client programları | 2-4 hafta | Erişim kesilir | Integration test |

---

## 🚨 Risk Analizi ve Öneriler

### 🔴 Yüksek Risk Alanları

1. **Veritabanı Şeması Değişiklikleri**
   - **Risk**: Tüm sistem çökme riski
   - **Önlem**: Version kontrolü + migration planı
   - **Test**: Geriye dönüş senaryoları

2. **Core API'lerde Breaking Changes**
   - **Risk**: Tüm kullanıcı etkilenir
   - **Önlem**: API versioning + backward compatibility
   - **Test**: Entegrasyon test paketi

3. **Authentication Sistemi Değişiklikleri**
   - **Risk**: Güvenlik açığı
   - **Önlem**: Kademeli geçiş + güvenlik denetimi
   - **Test**: Penetration testing

### 🟡 Orta Risk Alanları

1. **Redux Store Restructuring**
   - **Risk**: State management bozulması
   - **Önlem**: Incremental migration + state persistence
   - **Test**: State consistency testleri

2. **File Upload Sistemi Değişiklikleri**
   - **Risk**: CAD entegrasyonu bozulması
   - **Önlem**: Backward compatibility + gradual migration
   - **Test**: File processing testleri

### 🟢 Düşük Risk Alanları

1. **UI Component Değişiklikleri**
   - **Risk**: Sadece görsel etkiler
   - **Önlem**: Component versioning + A/B test
   - **Test**: Visual regression testleri

2. **Log Format Değişiklikleri**
   - **Risk**: Monitoring zorluğu
   - **Önlem**: Log parser güncellemesi
   - **Test**: Log parsing testleri

---

## 📋 Kapsam ve Bakım Stratejileri

### 🔍 İzleme ve Gözlem

1. **Real-time Monitoring**
   - API response süreleri
   - Database query performansı
   - WebSocket bağlantı durumu

2. **Change Impact Tracking**
   - Code dependency analizi
   - API usage istatistikleri
   - Error rate monitoring

3. **Performance Monitoring**
   - Bundle size analizleri
   - Memory kullanımı
   - CPU utilization

### 🛠️ Değişiklik Yönetimi

1. **Pre-deployment Checklist**
   - Etki analizi tamamlanması
   - Test senaryoları çalıştırılması
   - Rollback planı hazırlanması

2. **Canary Deployment**
   - Kritik olmayan kullanıcılar için test
   - Performans ve stabilite izleme
   - Kademeli yayına planı

3. **Feature Flags**
   - Yeni özellikleri kademeli açma
   - Anında devre edebilme yeteneği
   - A/B test desteği

---

## 🎯 Sonuç ve Öneriler

### 📊 Proje Karmaşıklığı Değerlendirmesi

**Mimari Skoru**: 8/10 (Çok Karmaşık)
- ✅ **Fazla Katmanlı**: 4 ana katman
- ✅ **Fazla Bağımlı**: 60+ API, 32 veritabanı tablosu
- ✅ **Farklı Platformlar**: Web, mobil, embedded, desktop
- ⚠️ **Teknik Borç**: Yüksek karmaşıklık, bakım zorluğu yüksek

### 🔧 Stratejik Öneriler

1. **Dokümantasyon Güncellemesi**
   - Bu analiz raporunu proje dokümantasyonuna ekle
   - Etki matrisini sürekli güncelle
   - Değişiklik prosedürlerini standardize et

2. **İmpact Analysis Tool'u Geliştirme**
   - Otomatik bağımlılık analizi tool'u oluştur
   - Code dependency mapping yap
   - Risk skorlama sistemi kur

3. **Change Management Süreci**
   - Değişiklik talep formu standardize et
   - Etki analiz zorunlu hale getir
   - Onay mekanizması kur

### 📈 Uzun Vadeli Planlama

1. **Kısa Vadeli (1-3 ay)**
   - Etki analiz otomasyonu
   - Risk skorlama sistemi
   - Change management süreçleri

2. **Orta Vadeli (3-12 ay)**
   - Mimari refactoring
   - Teknik borç yönetimi
   - Bakım otomasyonları

3. **Uzun Vadeli (1+ yıl)**
   - Sistem modernizasyonu
   - Platform geçişleri
   - Enterprise özellikleri

---

## 🔗 Referans ve Bağlantılar

### 📚 İlgili Dokümanlar
- [📖 Gen Bakış](docs/README.md) - Sistem genel tanıtımı
- [📡 API Dokümantasyonu](docs/API_Documentation.md) - 60+ API endpoint'i
- [🎨 Frontend Component'leri](docs/Frontend_Component_Documentation.md) - 255+ React component'i
- [🖥️ Client Programları](docs/Client_Programs_Documentation.md) - 4 platform client programı

### 🔗 Proje Dosya Yapısı
```
URTMtakip/
├── backend/                 # Backend kodu (Node.js)
├── frontend/                # Frontend kodu (React)
├── CNC_panel/              # ESP32 programı
├── STEP_BOM_Analyzer/      # Python STEP analizi
├── CAD_Import_Client/      # Python CAD istemcileri
├── DizinTarama_Client/     # Python dizin tarayıcı
└── docs/                   # Dokümantasyon (7 ana doküman)
```

---

**Önemli Not:** Bu analiz raporu, projedeki değişikliklerin etkilerini anlamak için bir referans dokümanı olarak kullanılmalıdır. Her değişiklik yapılmadan önce bu raporu inceleyerek potansiyel etkileri değerlendirilmelidir.

*Rapor Tarihi: 2024-11-02 | Analiz Edilen Proje: ÜRTM Takip Sistemi | Kapsam: Tam Sistem Mimarisi*