# ÜRTM Takip Sistemi - Proje Genel Bakış

## Sistem Amacı ve Kapsamı

ÜRTM Takip, imalat sanayi için geliştirilmiş kapsamlı bir üretim takip ve yönetim sistemidir. Sistem, üretim süreçlerinin uçtan uca yönetimini sağlar ve aşağıdaki alanlarda entegre çözümler sunar:

- **Üretim Planlama**: Excel tabanlı üretim planları ve BOM (Bill of Materials) analizi
- **İş Emri Yönetimi**: İş emirlerinin oluşturulması, takibi ve durum yönetimi
- **Tezgah/İstasyon Yönetimi**: Makine ve çalışma istasyonlarının takibi
- **Stok Yönetimi**: Parça ve malzeme stoklarının izlenmesi
- **Fason İşler**: Dış kaynaklı üretim süreçlerinin yönetimi
- **Sevkiyat**: Teslimat ve lojistik süreçlerin takibi
- **Arıza/Bakım**: Ekipman bakım ve arıza kayıtları
- **Raporlama**: Üretim istatistikleri ve performans raporları
- **Mobil Destek**: Üretim alanı için mobil arayüz

## Mimari Genel Bakış

Sistem, modern mikro-servis mimarisi prensipleriyle tasarlanmış çok katmanlı bir yapıya sahiptir:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT KATMANI                        │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (5173)    │    Python CAD Araçları         │
│  - Desktop UI             │    - STEP_BOM_Analyzer         │
│  - Mobile UI              │    - CAD_Import_Client         │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION KATMANI                    │
├─────────────────────────────────────────────────────────────┤
│  Express.js Backend (3000)   │   Socket.IO Real-time        │
│  - REST API                 │   - Canlı güncellemeler       │
│  - Business Logic           │   - Bildirimler               │
│  - File Upload/Download     │   - CAD client iletişimi      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                         DATA KATMANI                         │
├─────────────────────────────────────────────────────────────┤
│  SQLite Database              │   ESP32 Hardware            │
│  - Sequelize ORM             │   - CNC Panel (WiFi)         │
│  - Migration Sistemi         │   - Makine durumu raporu      │
│  - Veri bütünlüğü            │   - Real-time bağlantı       │
└─────────────────────────────────────────────────────────────┘
```

## Teknoloji Yığını

### Backend (Node.js + Express.js)
- **Framework**: Express.js 4.18+
- **Veritabanı**: SQLite3 + Sequelize ORM 6.37+
- **Real-time**: Socket.IO 4.7+
- **Güvenlik**: Helmet, JWT, bcryptjs
- **Validasyon**: Joi 17.11+
- **Dosya İşleme**: Multer, Sharp (resim işleme)
- **Excel**: XLSX, ExcelJS
- **OCR**: Tesseract.js 4.1+ (teknik resim metin çıkarma)
- **Logging**: Winston 3.11+
- **Test**: Jest, Supertest
- **Process Manager**: PM2

### Frontend (React + Vite)
- **Framework**: React 18.2+ + Vite 5.0+
- **UI Kütüphanesi**: Material-UI (MUI) 5.17+
- **State Management**: Redux Toolkit 2.0+
- **Routing**: React Router DOM 6.20+
- **HTTP Client**: Axios 1.9+
- **Real-time Client**: Socket.IO Client 4.7+
- **Grafikler**: Chart.js 4.4+, Recharts 3.2+
- **PDF**: react-pdf 7.7+
- **Drag & Drop**: @hello-pangea/dnd 18.0+
- **Form Yönetimi**: Formik 2.4+ + Yup 1.6+
- **Test**: Vitest 1.0+, React Testing Library

### CNC Panel (ESP32)
- **Platform**: ESP32 mikrodenetleyici
- **Build Sistemi**: PlatformIO
- **İletişim**: WiFi + HTTP Client
- **Amaç**: CNC tezgahlarının gerçek zamanlı durum raporlama

### Python CAD Araçları
- **STEP_BOM_Analyzer**:
  - STEP dosyası BOM çıkarımı
  - 3D rendering ve thumbnail oluşturma
  - FreeCAD entegrasyonu
  - Çoklu format export (JSON, Excel, CSV, XML)

- **CAD_Import_Client**:
  - SolidWorks COM otomasyonu
  - Toplu CAD dosyası işleme
  - WebSocket ile canlı iletişim
  - Windows-only (SolidWorks gerektirir)

## Modüle Göre Temel Özellikler

### 1. İş Emirleri (Work Orders)
- Oluşturma, düzenleme, silme işlemleri
- Üretim planından toplu iş emri oluşturma
- Durum yönetimi (beklemede, üretimde, tamamlandı, fason)
- Önceliklendirme (düşük, normal, yüksek, acil)
- İşlem kayıtları ile ilişkilendirme
- Parça ve tezgah atama
- Tahmini işleme süresi hesaplama

### 2. Tezgahlar (Workstations)
- Tezgah/istasyon yönetimi
- Durum logları ve geçmiş takibi
- İş planı ve zaman planlaması
- CNC panel entegrasyonu ( gerçek zamanlı durum)
- Vardiya atamaları
- Performans raporları

### 3. Parçalar (Parts)
- Parça katalog yönetimi
- Teknik resim yükleme ve OCR analizi
- Parça birleştirme ve birleşik parça oluşturma
- Stok durumu entegrasyonu
- Parça kayıt geçmişi
- Takip listeleri oluşturma

### 4. Üretim Planı (Production Planning)
**Ana Sistem**:
- Excel tabanlı BOM içe aktarma
- Makine-grup parça eşleştirme
- Kritik stok analizi ve uyarılar
- Karma (karma) planlama desteği
- Makine bazlı, özel liste ve karma planlar

**V2 Sistemi**:
- JSON tabanlı iş emri listeleri
- Basitleştirilmiş planlama arayüzü
- Hafif yapılandırma

### 5. BOM Yönetimi (Bill of Materials)
- Hiyerarşik BOM yapısı
- Parça ilişkileri ve bağımlılıklar
- Stok entegrasyonu
- Maliyet hesaplama
- Versiyon takibi

### 6. Fason İşler (Subcontracting)
- Fason iş emri oluşturma
- Fason teklif yönetimi
- Fason grupları
- İş emri -> Fason dönüşümü
- Takip ve durum yönetimi

### 7. Sevkiyat (Shipping)
- Sevkiyat kayıt oluşturma
- Kalem detayları
- Resim/document ekleme
- Lokasyon yönetimi
- Toplu sevkiyat
- İç sevkiyatlar
- Otomatik sevkiyat servisi
- İrsaliye entegrasyonu

### 8. Stok Kartları (Inventory)
- Stok kartı yönetimi
- Stok hareketleri (giriş/çıkış)
- Minimum stok uyarıları
- Takip listeleri
- Parça-stok entegrasyonu

### 9. Arıza-Bakım (Maintenance)
- Arıza kayıt oluşturma
- Bakım planlama
- Durum takibi
- Personel ataması
- Maliyet takibi

### 10. Vardiya Yönetimi (Shift Management)
- Vardiya tanımları
- Personel atamaları
- Vardiya raporları
- Günlük vardiya özeti
- Tezgah vardiya kartları

### 11. Raporlar (Reports)
- İş emri raporu kartı
- Parça bazlı iş emirleri raporu
- Tezgah çalışma tablosu
- Üretim istatistikleri
- Günlük vardiya raporu
- Sevkiyat raporları

### 12. Tedarik Yönetimi (Procurement)
- Tedarik talebi oluşturma
- Firma yönetimi
- Talep detayları
- Durum takibi
- Onay süreçleri

### 13. Fatura & İrsaliye
- Fatura oluşturma ve yönetimi
- İrsaliye kayıt oluşturma
- Eşleştirme modülü
- Kalem detayları
- Satış entegrasyonu

### 14. Makina Yönetimi
- Makina sınıfları
- Makina grupları
- Makina-stok yönetimi
- Sipariş takibi
- Makindex hiyerarşik sistem

### 15. Notlar (Notes)
- Kategorize edilmiş not sistemi
- Etiketleme
- Arama ve filtreleme
- Kategori yönetimi

## Mobil Destek

Sistem, üretim alanı kullanımı için kapsamlı mobil destek sunar:

- **Otomatik Cihaz Algılama**: Masaüstü/mobil otomatik geçiş
- **Dokunmatik Optimize Arayüz**: Büyük butonlar, swipe gestures
- **Mobil Routes**: `/mobile/` öneki ile ayrı mobil endpoints
- **QR Kod Okuyucu**: İş emri ve parça tarama
- **Offline Desteği**: Service worker ile cache
- **Responsive Design**: Tüm ekran boyutlarına uyum

## Veri Akışı

```
Excel Üretim Planı
       ↓
   BOM Analizi
       ↓
 Parça Eşleştirme
       ↓
  İş Emri Oluştur
       ↓
  Tezgah Atama
       ↓
 Üretim Başlat
       ↓
 İşlem Kayıtları
       ↓
   Tamamla
       ↓
  Stok Güncelle
       ↓
  Raporla
```

## Sınırlamalar ve Gelecek Geliştirmer

### Mevcut Sınırlamalar
- Tek kullanıcı veritabanı (SQLite)
- Client-side rendering (React SPA)
- Sabit port yapılandırması (Backend: 3000, Frontend: 5173)

### Potansiyel Geliştirmeler
- PostgreSQL/MySQL geçişi
- Server-side rendering (Next.js)
- Çoklu dil desteği
- Rol bazlı yetkilendirme (RBAC)
- mikro-ödemeler entegrasyonu
- ERP sistemi entegrasyonu
