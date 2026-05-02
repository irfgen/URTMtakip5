# Makindex - Üretim Makineleri Hiyerarşik Yapılandırma Sistemi

## Genel Bakış
Makindex, üretimdeki makineleri hiyerarşik bir yapıda organize eden ve görselleştiren bir modüldür. Bu sistem, makina sınıflarından parçalara kadar tüm üretim yapısını klasör yapısı benzeri bir arayüzde sunar. Sistemimizde var olan gurup yapısına, parça yapısına, stok kartı yapısına, makina yapısına ek olarak makina sınıfı yapısı ile beraber üretilen tüm makina, gurup ve parçalar hiyerarşik olarak görselleştirilecek ve kullanıcı aradığını kolayca bulabilecek istediği işlemi yapabilecek.

## Hiyerarşik Yapı Şablonu

```
📁 Makina Sınıfı
├── 📁 Makina
│   ├── 📁 Gurup
│   │   ├── 📁 Parça
│   │   │   ├── 📁 Stok Kartı
│   │   │   ├── 📁 Stok Kartı
│   │   │   └── ...
│   │   ├── 📁 Parça
│   │   └── ...
│   ├── 📁 Gurup
│   └── ...
├── 📁 Makina
└── ...
```

## Makina Sınıfları ve Modelleri

### 1. Panel Ebatlama Sınıfı
```
📁 Panel Ebatlama Sınıfı
├── 📁 DRAGON PE 420-5
├── 📁 DRAGON PE 383
└── 📁 DRAGON PE 420-4
```

### 2. Kenar Bantlama Sınıfı
```
📁 Kenar Bantlama Sınıfı
├── 📁 ROYAL 8 EXTRA
├── 📁 OF-KA TUANA 56 PLUS
├── 📁 OF-KA TUANA 56
├── 📁 OF TUANA 56
├── 📁 OF MZK 4 DOOR
├── 📁 OF MZK-4
├── 📁 MZK-4
├── 📁 ADVANTAGE-7
├── 📁 ADVANTAGE-6
├── 📁 ADVANTAGE-5
├── 📁 ADVANTAGE-4
├── 📁 ADVANTAGE-3
├── 📁 ADVANTAGE X SMALL
├── 📁 TUANA 56 X PLUS
└── 📁 OF-KA MZK 4 WIND
```

### 3. Çizgili Yatar Daire Sınıfı
```
📁 Çizgili Yatar Daire Sınıfı
├── 📁 MZK 3200 CONCORD
├── 📁 MZK 3800 CONCORD
├── 📁 MZK 3200 DIAMOND SX
├── 📁 MZK 3200 DIAMOND S
├── 📁 MZK 3800 DIAMOND S
├── 📁 MZK 3800 DIAMOND
├── 📁 MZK 3200 DIAMOND
├── 📁 MZK 2800 DIAMOND
├── 📁 MZK 2800 PRESTU
├── 📁 MZK 3800 SPECIAL
├── 📁 MZK 3200 SPECIAL
├── 📁 MZK 3800 PRESU
├── 📁 MZK 3200 PRESTU
├── 📁 MZK 2200 PRESTU
├── 📁 MZK 1500 PRESTU
└── 📁 MZK 3800 DIAMOND SX
```

### 4. Kapı Üretim Makineleri Sınıfı
```
📁 Kapı Üretim Makineleri Sınıfı
├── 📁 MZK CNC RIPPER DOUBLE
├── 📁 MZK NC RIPPER DOUBLE PLC CONTROL
├── 📁 MZK NC RIPPER KK
├── 📁 MZK MANUEL KAPI EBATLAMA
├── 📁 MZK NC RIPPER
├── 📁 MZK NC RIPPER KS
├── 📁 MZK KAPI KİLİT PLUS
├── 📁 MZK KAPI KİLİT-MENTEŞE
├── 📁 RIPPER CNC KKM
├── 📁 MZK RIPPER KKM
├── 📁 KALINLIK MAKİNASI
└── 📁 FR-532
```

### 5. CNC Freze Sınıfı
```
📁 CNC Freze Sınıfı
├── 📁 LINA 2136 PLUS X
├── 📁 LINA 2136 ED
├── 📁 LINA 2128 PLUS X
├── 📁 LINA 2136
├── 📁 LINA 2136 LINE
└── 📁 LINA 2136 EVO
```

## Teknik Plan

### 1. Veritabanı Yapısı

**Mevcut Tabloların Kullanımı:**
- `makinalar` - Ürün makineleri tablosu kullanılacak
- `boms` - BOM grupları tablosu kullanılacak (gurup bilgileri burada tutuluyor)
- `parcalar` - Parçalar tablosu kullanılacak
- `stok_kartlari` - Stok kartları tablosu kullanılacak

**Yeni Tablo:**
```sql
-- makina_siniflari (yeni)
- id (PK, INTEGER, AUTO_INCREMENT)
- ad (VARCHAR, NOT NULL) - "Panel Ebatlama Sınıfı", "Kenar Bantlama Sınıfı" vb.
- aciklama (TEXT, NULLABLE)
- aktif (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Tablo İlişkileri:**
1. `makinalar` tablosuna `makina_sinifi_id` (FK -> makina_siniflari.id) eklenecek
2. `makinalar` ↔ `boms` ilişkisi kurulacak (makina-gurup çok-çok ilişkisi için)
3. `boms` tablosu gurup bilgilerini tutar (name, bom_aciklamasi, bom_kodu)
4. Mevcut `boms` ↔ `parcalar` ilişkisi kullanılacak (gurup-parça ilişkisi)
5. Mevcut `parcalar` ↔ `stok_kartlari` ilişkisi kullanılacak

### 2. Backend API Yapısı

**Endpoint'ler:**
```
GET /api/makindex/siniflar - Makina sınıfları listesi
GET /api/makindex/makinalar/:sinifId - Sınıfa ait makinalar
GET /api/makindex/boms/:makinaId - Makinanın BOM gurupları
GET /api/makindex/parcalar/:bomId - BOM'a ait parçalar
GET /api/makindex/ara?q={query}&type={type} - Global arama
  - type: 'sinif', 'makina', 'bom', 'parca' (opsiyonel)
POST /api/makindex/seed - Başlangıç verilerini yükle
```

**Controller ve Route'lar:**
- `backend/src/controllers/makindexController.js`
- `backend/src/routes/makindexRoutes.js`

### 3. Frontend Mimarisi

**Component Yapısı:**
```
frontend/src/pages/MakindexPage.jsx (Ana sayfa)
├── frontend/src/components/makindex/
│   ├── MakindexTreeView.jsx (Ağaç yapısı component)
│   ├── MakindexSearch.jsx (Arama componenti)
│   ├── MakindexNode.jsx (Genel node component)
│   ├── MakinaSinifiNode.jsx (Makina sınıfı node)
│   ├── MakinaNode.jsx (Makina node)
│   ├── BomNode.jsx (BOM gurup node)
│   └── ParcaNode.jsx (Parça node)
└── frontend/src/pages/mobile/MakindexPage.jsx (Mobile versiyon)
```

**State Management:**
```javascript
// frontend/src/store/slices/makindexSlice.js
{
  siniflar: [],
  makinalar: {},
  boms: {},
  parcalar: {},
  expandedNodes: Set(),
  selectedNode: null,
  searchResults: [],
  loading: false,
  error: null
}
```

### 4. Kullanıcı Akış Implementasyonu

**Örnek Senaryo:**
1. Kullanıcı Makindex modülüne girer
2. Makina sınıfları listelenir (Panel Ebatlama, Kenar Bantlama vb.)
3. "Panel Ebatlama Sınıfı" seçilir
4. Bu sınıftaki makinalar listelenir (DRAGON PE 420-5, DRAGON PE 383 vb.)
5. "DRAGON PE 420-5" makinası seçilir
6. Bu makinanın bağlı olduğu BOM gurupları listelenir (boms tablosundan)
7. BOM gurup seçildiğinde o guruba ait parçalar listelenir
8. Parça seçildiğinde mevcut parça detayı sayfasına yönlendirilir

### 5. Arama Özellikleri

**Arama Kapasitesi:**
- Real-time arama (debounce ile)
- Hiyerarşik arama (alt seviyelerde de arama)
- Filtreleme seçenekleri:
  - Sadece stokta olan parçalar
  - Sadece kritik stoktaki parçalar
  - Makina sınıfına göre filtreleme
  - BOM guruplarına göre filtreleme
- Son aramaları saklama (localStorage)

**Arama Sonuçları:**
- Node tipine göre ikon ve renk farklılığı
- Hiyerarşik yolu gösterme
- Tıklama ile doğrudan ilgili node'a gitme

### 6. Responsive Tasarım

**Desktop (1024px+):**
- Sol panelde ağaç yapısı (300px width)
- Sağ panelde detaylar
- Hover efektleri ve animasyonlar

**Tablet (768px-1024px):**
- Collapsible sol panel
- Bottom sheet for actions
- Touch-friendly node sizes

**Mobile (<768px):**
- Tam ekran ağaç yapısı
- Swipe gestures için destek
- Mobile-specific search UI
- Bottom navigation

### 7. Performans Optimizasyonu

**Lazy Loading:**
- Sadece expand edilen node'ların verileri çekilir
- Cache mekanizması (veritabanı sorgularını azaltmak için)
- Virtual scrolling (çok sayıda node olduğunda)

**Memory Management:**
- Expanded olmayan node'ların verileri memory'de tutulmaz
- Component unmount olduğunda cache temizleme

### 8. Implementasyon Sırası

1. **Veritabanı Migration:**
   - `makina_siniflari` tablosu oluşturma
   - `makinalar` tablosuna `makina_sinifi_id` ekleme
   - `makinalar` ↔ `boms` ilişkisi için ara tablo oluşturma (makina_bom)
   - Mevcut ilişkileri güncelleme

2. **Seed Data:**
   - Makindex.md'deki makina sınıfları ve makinaları ekleme
   - Mevcut makinaları uygun sınıflara atama
   - Makina-BOM ilişkilerini kurma

3. **Backend:**
   - Model ilişkilerini güncelleme (Makina, Bom, Parca)
   - Controller ve route'ları oluşturma
   - API endpoint'lerini implementasyon

4. **Frontend:**
   - Redux slice oluşturma
   - Ağaç component'i geliştirme
   - Arama özelliği ekleme

5. **Mobile Responsive:**
   - Mobile component'leri oluşturma
   - Touch optimizasyonu
   - Performance testing

### 9. Integration Noktaları

**Mevcut Parça Detayı Entegrasyonu:**
- Parça node'una tıklandığında `/parcalar/:parcaKodu` route'una yönlendirme
- Mevcut parça detayı component'i kullanılacak
- Stok bilgisi, iş emri oluşturma gibi mevcut özellikler korunacak

**Real-time Updates:**
- Socket.IO ile stok değişikliklerinde anlık güncelleme
- Yeni parça eklendiğinde ağaç yapısının güncellenmesi
- Makina/BOM bilgileri değiştiğinde güncelleme

### 10. Veritabanı Schema Detayları

**makina_siniflari Tablosu:**
```sql
CREATE TABLE makina_siniflari (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ad VARCHAR(255) NOT NULL UNIQUE,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**makinalar Tablosu Güncellemesi:**
```sql
ALTER TABLE makinalar
ADD COLUMN makina_sinifi_id INT,
ADD FOREIGN KEY (makina_sinifi_id) REFERENCES makina_siniflari(id);
```

**makina_bom Ara Tablosu:**
```sql
CREATE TABLE makina_bom (
  id INT PRIMARY KEY AUTO_INCREMENT,
  makina_id VARCHAR(36) NOT NULL,
  bom_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (makina_id) REFERENCES makinalar(makina_id) ON DELETE CASCADE,
  FOREIGN KEY (bom_id) REFERENCES boms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_makina_bom (makina_id, bom_id)
);
```

**BOM-Parça İlişkisi (Mevcut):**
BOM tablosu ve parcalar tablosu arasındaki mevcut ilişki kullanılacak
