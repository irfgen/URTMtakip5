# STOK KARTLARI MODÜLÜ - Teknik Dokümantasyon

## Genel Bakış

Stok Kartları modülü, üretimde kullanılan ham malzemelerin merkezi olarak yönetildiği kritik bir sistemdir. Bu modül, malzeme envanteri, kritik stok takibi, akıllı malzeme eşleştirme ve Parçalar modülü ile entegre ham malzeme yönetimi sağlar.

## Mimari Yapı

### Backend Bileşenleri

#### Ana Model: `StokKarti.js` (341 satır)
- **Temel Veri Yapısı**: Ham malzeme envanter kartları
- **Kritik Özellikler**:
  - `kesit`: Malzeme boyut bilgisi (50 karakter)
  - `boy`: Uzunluk bilgisi (decimal, mm)
  - `malzeme_cinsi`: Malzeme tipi (100 karakter) 
  - `malzeme_adi`: Detaylı açıklama (200 karakter)
  - `adet`: Mevcut stok miktarı
  - `kritik_stok_miktari`: Minimum stok seviyesi
  - `lokasyon`: Depo konumu (50 karakter)
  - `firma`: Tedarikçi firma adı (100 karakter)
  - `aktif_mi`: Soft delete için durum

#### Instance Metodları
```javascript
// Kritik stok kontrolü
isKritikStok(): boolean

// Stok durumu hesaplama  
getStokDurumu(): {
  durum: 'stokta_yok' | 'kritik' | 'normal' | 'yuksek',
  kritik: boolean,
  yuzde: number,
  kalan_adet: number,
  kritik_seviye: number
}

// Formatlanmış boyut gösterimi
getFormattedBoyut(): string
```

#### Class Metodları
```javascript
// Kritik stok listesi
static async findKritikStoklar(): Promise<StokKarti[]>

// Malzeme cinsi araması
static async searchByMalzeme(malzeme): Promise<StokKarti[]>

// Gelişmiş sayfalı arama
static async searchWithPagination(options): Promise<object>

// Firma listesi 
static async getFirmaList(): Promise<string[]>

// Malzeme cinsi listesi
static async getMalzemeCinsiList(): Promise<string[]>
```

#### Ana Controller: `stokKartlariController.js` (436 satır)

**Temel CRUD Endpoint'leri:**
- `listStokKartlari`: Sayfalı listeleme + filtreleme
- `getStokKartiDetay`: ID ile detay getirme
- `createStokKarti`: Yeni kayıt oluşturma
- `updateStokKarti`: Kayıt güncelleme
- `deleteStokKarti`: Soft delete

**Özel Endpoint'ler:**
- `getKritikStoklar`: Kritik seviyedeki stoklar
- `searchStokKartlari`: Gelişmiş arama
- `getFirmalar`: Tedarikçi firma listesi
- `getMalzemeCinsleri`: Malzeme tipi listesi
- `getStokIstatistikleri`: Dashboard istatistikleri

**İstatistik Hesaplama:**
```javascript
{
  toplam_kart: number,
  kritik_stok_sayisi: number, 
  stokta_yok_sayisi: number,
  toplam_stok_miktari: number,
  kritik_stok_orani: number (%)
}
```

#### Ham Malzeme Controller: `stokKartiController.js` (282 satır)

**Akıllı Ham Malzeme Arama:**
- `hamMalzemeOlcuAra`: Ölçü bazlı akıllı eşleştirme
- **Parse Algoritması**: Ham malzeme ölçülerini standardize etme

**Desteklenen Ölçü Formatları:**
```javascript
// Çap ölçüleri
"ø25", "Çap30", "DIA40" → { tip: 'cap', cap: 25 }

// Dikdörtgen ölçüler  
"10x20", "15X25", "30*40" → { tip: 'dikdörtgen', genislik: 10, yukseklik: 20 }

// Eşleştirme Tipleri
- exact: Tam eşleşme
- reverse: Ters boyut eşleşmesi  
- diameter: Çap bazlı eşleşme
- partial: Kısmi eşleşme
```

#### Route Yapısı: `stokKartlariRoutes.js` (101 satır)

**Ana Endpoint'ler:**
```
GET    /api/stok-kartlari                 - Liste (sayfalama + filtre)
GET    /api/stok-kartlari/kritik-stok     - Kritik stoklar
GET    /api/stok-kartlari/istatistikler   - Dashboard stats
GET    /api/stok-kartlari/firmalar        - Firma dropdown
GET    /api/stok-kartlari/malzeme-cinsleri - Malzeme dropdown  
GET    /api/stok-kartlari/search          - Gelişmiş arama
GET    /api/stok-kartlari/:id             - Detay
POST   /api/stok-kartlari                 - Yeni kayıt
PUT    /api/stok-kartlari/:id             - Güncelleme
DELETE /api/stok-kartlari/:id             - Silme
```

**Middleware Stack:**
- Input validation (zorunlu alanlar, sayısal kontroller)
- ID validation 
- Request logging
- Error handling

### Frontend Bileşenleri

#### Ana Sayfa: `StokKartlari.jsx` (534 satır)

**Temel Özellikler:**
- DataGrid tabanlı liste görünümü
- Server-side pagination (10/20/50/100)
- Real-time filtreleme ve arama
- Detaylı stok durumu gösterimi
- İstatistik kartları (toplam/kritik/stokta yok/oran)

**DataGrid Kolonları:**
- `formatted_boyut`: Kesit x Boy formatı
- `malzeme_cinsi`: Ana malzeme tipi
- `malzeme_adi`: Detaylı açıklama
- `adet`: Mevcut stok (renk kodlu)
- `kritik_stok_miktari`: Kritik seviye
- `stok_durumu`: Chip ile durum gösterimi
- `lokasyon` & `firma`: Konum bilgileri
- `actions`: Düzenle/Sil butonları

**Stok Durumu Chip Sistemi:**
```javascript
'stokta_yok': { label: 'Stokta Yok', color: 'error', icon: <WarningIcon /> }
'kritik': { label: 'Kritik', color: 'warning', icon: <TrendingDownIcon /> }
'normal': { label: 'Normal', color: 'success' }  
'yuksek': { label: 'Yüksek', color: 'info', icon: <TrendingUpIcon /> }
```

**Filtre Sistemi:**
- Genel arama (kesit, malzeme, firma, lokasyon)
- Malzeme cinsi dropdown
- Firma dropdown  
- "Sadece Kritik Stok" checkbox
- Filtre temizleme

#### Custom Hook: `useStokKartlari.js` (229 satır)

**State Management:**
```javascript
// Ana veri state'leri
const [stokKartlari, setStokKartlari] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

// Pagination state
const [pagination, setPagination] = useState({
  page: 0, pageSize: 20, total: 0
})

// Filter state  
const [filters, setFilters] = useState({
  q: '', malzeme_cinsi: '', firma: '', kritik_stok: false
})

// Dropdown data
const [dropdownData, setDropdownData] = useState({
  firmalar: [], malzemeCinsleri: [], loading: false  
})

// İstatistikler
const [istatistikler, setIstatistikler] = useState(null)
```

**Ana Fonksiyonlar:**
- `fetchData`: Server-side veri yükleme
- `fetchDropdownData`: Dropdown verilerini paralel yükleme
- `fetchIstatistikler`: Dashboard istatistikleri
- `updateFilters`: Filtre değişimi (sayfa 0'a döndürme)
- `updatePagination`: Sayfa değişimi
- `resetFilters`: Tüm filtreleri temizleme
- CRUD operasyonları (create/update/delete)

#### Stok Kartı Formu: `StokKartiForm.jsx` (421 satır)

**Form Yapısı:**
```javascript
// Yup validation schema ile doğrulama
validationSchema = Yup.object({
  kesit: Yup.string().required().min(1).max(50),
  boy: Yup.number().nullable().min(0),
  malzeme_cinsi: Yup.string().required().min(1).max(100),
  malzeme_adi: Yup.string().nullable().max(200),
  adet: Yup.number().required().min(0).integer(),
  kritik_stok_miktari: Yup.number().required().min(0).integer(),
  lokasyon: Yup.string().nullable().max(50),
  adres: Yup.string().nullable(),
  firma: Yup.string().nullable().max(100)
})
```

**Özel Özellikler:**
- Real-time boyut preview (`kesit x boyMM`)
- Autocomplete ile malzeme cinsi ve firma seçimi
- Kritik stok uyarı sistemi (anlık hesaplama)
- Stok durumu göstergesi
- Formik ile form state yönetimi

**Form Bölümleri:**
1. **Boyut Bilgileri**: Kesit + Boy (visual preview)
2. **Malzeme Bilgileri**: Cinsi + Adı + Firma  
3. **Stok Bilgileri**: Adet + Kritik seviye (canlı uyarı)
4. **Lokasyon Bilgileri**: Konum + Detaylı adres

#### Stok Kartı Seçim Modalı: `StokKartiSecimModal.jsx` (356 satır)

**Kullanım Alanları:**
- İş emri oluştururken ham malzeme seçimi
- Parça düzenlerken stok kartı atama
- Sevkiyat kalemlerinde stok seçimi

**Temel Özellikler:**
- Real-time arama (malzeme, boyut, firma, lokasyon)
- Grid layout ile kart görünümü
- Stok durumu chip gösterimi
- "Yeni Ekle" butonu (hızlı oluşturma)
- Seçili stok kartı highlighting

**Modal İçeriği:**
```javascript
// Her stok kartı için gösterilen bilgiler
- Malzeme cinsi (başlık)
- Formatlanmış boyut (kesit x boy)  
- Mevcut stok / Kritik seviye
- Firma ve lokasyon bilgileri
- Stok durumu (renk kodlu chip)
```

#### Mobil Versiyon: `StokKartlariMobile.jsx` (548 satır)

**Mobil-Optimized Özellikler:**
- Card-based layout
- Swipe-to-edit/delete gestures  
- Pull-to-refresh
- Infinite scroll
- Sticky header with stats
- Touch-friendly FAB button

**Swipe Gesture Sistemi:**
```javascript
const createSwipeHandlers = useSwipeable({
  onSwipedLeft: () => handleDelete(item.id),   // Sol kaydırma → Sil
  onSwipedRight: () => handleEdit(item),       // Sağ kaydırma → Düzenle
  preventDefaultTouchmoveEvent: true,
  trackMouse: true
})
```

**Mobil Card Yapısı:**
- Avatar + Stok durumu chip
- Büyük stok rakamları
- Yan yana kritik seviye gösterimi  
- Firma ve lokasyon bilgileri
- Alt kısımda aksiyon butonları
- Swipe indicator bar

### Service Layer

#### API Service: `stokKartlariService.js` (107 satır)

**HTTP Client Yapısı:**
```javascript
const API_BASE_URL = 'http://192.168.1.206:3000/api'

// Ana CRUD fonksiyonları
getStokKartlari(params): Promise     // Filtreleme + sayfalama
getStokKarti(id): Promise           // Detay getirme  
createStokKarti(data): Promise      // Yeni oluşturma
updateStokKarti(id, data): Promise  // Güncelleme
deleteStokKarti(id): Promise        // Silme

// Özel fonksiyonlar
getKritikStoklar(): Promise         // Kritik stok listesi
getIstatistikler(): Promise         // Dashboard stats
getFirmalar(): Promise              // Dropdown data
getMalzemeCinsleri(): Promise       // Dropdown data  
searchStokKartlari(params): Promise // Gelişmiş arama
```

## İleri Seviye Özellikler

### 1. Akıllı Ham Malzeme Eşleştirme

**Parse Algoritması:**
```javascript
function parseHamMalzemeOlculeri(olculer) {
  // Çap tespiti
  const capRegex = /(?:ø|Ø|CAP|ÇAP|DIA|DIAMETER|O)\s*(\d+(?:[.,]\d+)?)/i
  
  // Dikdörtgen ölçü tespiti  
  const dikdortgenRegex = /(\d+(?:[.,]\d+)?)\s*[xX×*]\s*(\d+(?:[.,]\d+)?)/
  
  return { basarili, tip, genislik, yukseklik, cap, formatlanmis }
}
```

**Eşleştirme Stratejileri:**
1. **Exact Match**: Tam boyut eşleşmesi
2. **Reverse Match**: Ters boyut eşleşmesi (30x20 ↔ 20x30)
3. **Diameter Match**: Çap bazlı eşleştirme
4. **Partial Match**: Kısmi boyut eşleşmesi

### 2. Kritik Stok Yönetimi

**Otomatik Kritik Stok Hesaplama:**
```javascript
// Model seviyesinde hesaplama
isKritikStok() {
  return this.adet <= this.kritik_stok_miktari
}

getStokDurumu() {
  const kritik = this.isKritikStok()
  const yuzde = Math.round((this.adet / this.kritik_stok_miktari) * 100)
  
  let durum = 'normal'
  if (this.adet === 0) durum = 'stokta_yok'
  else if (kritik) durum = 'kritik'  
  else if (yuzde > 200) durum = 'yuksek'
  
  return { durum, kritik, yuzde, kalan_adet, kritik_seviye }
}
```

**Dashboard İstatistikleri:**
```javascript
const istatistikler = {
  toplam_kart: 1250,           // Toplam aktif stok kartı
  kritik_stok_sayisi: 45,      // Kritik seviyedeki kartlar
  stokta_yok_sayisi: 12,       // Stokta olmayan kartlar  
  toplam_stok_miktari: 15420,  // Toplam malzeme adedi
  kritik_stok_orani: 3.6       // Kritik oran yüzdesi
}
```

### 3. Cross-Module Integration

**Parçalar Modülü ile Entegrasyon:**
```javascript
// Parça modelinde stok kartı referansı
Parca.belongsTo(StokKarti, {
  foreignKey: 'stok_karti_id',
  as: 'stokKarti'
})

// Stok kartından parça listesi
StokKarti.hasMany(Parca, {
  foreignKey: 'stok_karti_id', 
  as: 'parcalar'
})
```

**İş Emirleri Entegrasyonu:**
- İş emri oluştururken stok kartı seçimi
- Ham malzeme maliyeti hesaplama
- Malzeme teminini tracking

**Sevkiyat Modülü Entegrasyonu:**
- Sevkiyat kalemlerinde stok kartı seçimi
- Stok düşme işlemleri
- Tedarikçi bazlı sevkiyat gruplandırma

### 4. Real-Time Event System

**Custom Event Dispatching:**
```javascript
// Stok kartı güncellendiğinde
const updateEvent = new CustomEvent('stokKartiUpdated', {
  detail: {
    updatedStokKarti: response.data,
    action: isEditMode ? 'update' : 'create',
    stokKartiId: stokKarti.id
  }
})
window.dispatchEvent(updateEvent)

// Diğer modüllerde dinleme
window.addEventListener('stokKartiUpdated', handleStokKartiUpdate)
```

**Cross-Component Communication:**
- Parça düzenleme → Stok kartı yenileme
- İş emri oluşturma → Stok durumu güncelleme
- Sevkiyat işlemleri → İstatistik hesaplama

## Performans Optimizasyonları

### 1. Database Optimizasyonları

**İndeksler:**
```sql
CREATE INDEX idx_stok_kartlari_malzeme_cinsi ON stok_kartlari(malzeme_cinsi)
CREATE INDEX idx_stok_kartlari_firma ON stok_kartlari(firma)  
CREATE INDEX idx_stok_kartlari_aktif ON stok_kartlari(aktif_mi)
CREATE INDEX idx_stok_kartlari_stok_durumu ON stok_kartlari(adet, kritik_stok_miktari)
CREATE INDEX idx_stok_kartlari_kesit ON stok_kartlari(kesit)
```

**Query Optimizasyonu:**
- Server-side pagination (LIMIT/OFFSET)
- Selective field loading
- Lazy loading für relations
- Kritik stok hesaplaması database seviyesinde

### 2. Frontend Optimizasyonları

**Memoization:**
```javascript
// Computed değerlerin cache'lenmesi
const hasFilters = useMemo(() => {
  return Object.values(filters).some(value => 
    value !== '' && value !== false && value !== 0
  )
}, [filters])

const isEmpty = useMemo(() => {
  return !loading && stokKartlari.length === 0
}, [loading, stokKartlari.length])
```

**Debounced Search:**
- Arama inputlarında gecikme
- API call optimizasyonu
- Real-time filtering

### 3. Caching Strategy

**Dropdown Data Caching:**
```javascript
// Firma ve malzeme listelerini paralel yükleme
const [firmaResponse, malzemeResponse] = await Promise.all([
  stokKartlariService.getFirmalar(),
  stokKartlariService.getMalzemeCinsleri()
])
```

**State Persistence:**
- Filter state'lerinin korunması
- Pagination state management
- Modal state handling

## Güvenlik ve Validasyon

### 1. Backend Validasyon

**Model Level Validation:**
```javascript
// Sequelize model validasyonu
kesit: {
  type: DataTypes.STRING(50),
  allowNull: false,
  validate: {
    notEmpty: { msg: 'Kesit bilgisi boş olamaz' },
    len: { args: [1, 50], msg: 'Kesit 1-50 karakter arasında olmalı' }
  }
}
```

**Controller Level Validation:**
```javascript
// Middleware ile input kontrolü
const validateStokKarti = (req, res, next) => {
  const { kesit, malzeme_cinsi, adet, kritik_stok_miktari } = req.body
  
  if (!kesit || !malzeme_cinsi) {
    return res.status(400).json({
      success: false,
      message: 'Kesit ve Malzeme Cinsi alanları zorunludur'
    })
  }
  
  if (adet !== undefined && (isNaN(adet) || adet < 0)) {
    return res.status(400).json({
      success: false, 
      message: 'Adet 0 veya pozitif bir sayı olmalı'
    })
  }
  
  next()
}
```

### 2. Frontend Validasyon

**Yup Schema Validation:**
```javascript
const validationSchema = Yup.object({
  kesit: Yup.string()
    .required('Kesit bilgisi zorunludur')
    .min(1, 'En az 1 karakter olmalı')
    .max(50, 'Maksimum 50 karakter olabilir'),
    
  adet: Yup.number()
    .required('Adet zorunludur')
    .min(0, 'Adet 0\'dan küçük olamaz')
    .integer('Adet tam sayı olmalı'),
    
  kritik_stok_miktari: Yup.number()
    .required('Kritik stok miktarı zorunludur')  
    .min(0, 'Kritik stok miktarı 0\'dan küçük olamaz')
    .integer('Kritik stok miktarı tam sayı olmalı')
})
```

## Migration ve Veri Yönetimi

### 1. Veritabanı Migration'ları

**Ana Tablo Oluşturma:**
```javascript
// 20250629_create_stok_kartlari_table.js
await queryInterface.createTable('stok_kartlari', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  kesit: { type: Sequelize.STRING(50), allowNull: false },
  boy: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
  malzeme_cinsi: { type: Sequelize.STRING(100), allowNull: false },
  // ... diğer alanlar
})
```

**Parça İlişkilendirme:**
```javascript  
// 20250706_add_stok_karti_id_to_parcalar.js
await queryInterface.addColumn('parcalar', 'stok_karti_id', {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: { model: 'stok_kartlari', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'SET NULL'
})
```

### 2. Veri Import/Export

**Bulk Import İşlemleri:**
```javascript
// bulk-stok-kartlari-import.js
async function importStokKartlari() {
  await StokKarti.sync()
  
  for (const veri of stokVerileri) {
    const existing = await StokKarti.findOne({
      where: { kesit: veri.kesit, malzeme_cinsi: veri.malzeme_cinsi }
    })
    
    if (!existing) {
      await StokKarti.create({
        kesit: veri.kesit,
        boy: veri.boy,  
        malzeme_cinsi: veri.malzeme_cinsi,
        adet: veri.adet || 0,
        kritik_stok_miktari: veri.kritik_stok_miktari || 0
      })
    }
  }
}
```

### 3. Ham Malzeme Migration

**Parça → Stok Kartı Dönüşümü:**
```javascript
// migrate-ham-malzeme-to-stok-karti.js
async function migrateHamMalzemeToStokKarti() {
  const parcalar = await Parca.findAll({
    where: { stok_karti_id: null, hamMalzemeOlculeri: { [Op.ne]: null } }
  })
  
  for (const parca of parcalar) {
    const parsedOlcu = parseHamMalzemeOlculeri(parca.hamMalzemeOlculeri)
    let stokKarti = await findMatchingStokKarti(parsedOlcu, parca.hamMalzemeCinsi)
    
    if (!stokKarti) {
      stokKarti = await createDefaultStokKarti(parsedOlcu, parca.hamMalzemeCinsi)
    }
    
    await parca.update({ stok_karti_id: stokKarti.id })
  }
}
```

## Troubleshooting ve Debug

### 1. Yaygın Problemler

**Stok Kartı Eşleştirme Sorunları:**
```javascript
// Debug için parse sonuçlarını loglama
console.log('Parse Results:', {
  aramaMetni: olcu,
  parseResults,
  bulunanKartlar: uniqueStokKartlari.length
})
```

**Performance İssues:**
- Pagination parametrelerini kontrol et
- Index kullanımını verify et  
- Query execution time monitoring

### 2. Monitoring

**API Response Logging:**
```javascript
const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  })
  next()
}
```

**Frontend Error Handling:**
```javascript
try {
  const response = await stokKartlariService.getStokKartlari(params)
  // ...
} catch (err) {
  console.error('Data fetch error:', err)
  setError(err.message || 'Stok kartları yüklenirken hata oluştu')
}
```

## Sonuç

Stok Kartları modülü, ÜRTM Takip sisteminin ham malzeme yönetim omurgasını oluşturan kritik bir bileşendir. Akıllı eşleştirme algoritmaları, gerçek zamanlı stok takibi, kapsamlı filtreleme ve mobil optimizasyonu ile endüstriyel üretim ortamlarının karmaşık stok yönetimi ihtiyaçlarını karşılar.

Modül, diğer sistem bileşenleriyle (Parçalar, İş Emirleri, Sevkiyat) güçlü entegrasyonu sayesinde merkezi bir veri kaynağı olarak işlev görür ve üretim süreçlerinin verimli yönetimini sağlar.