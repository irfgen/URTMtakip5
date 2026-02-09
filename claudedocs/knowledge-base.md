# ÜRTM Takip Knowledge Base

## Proje Hakkında

**ÜRTM Takip** (Üretim Takip Sistemi), imalat sanayi için kapsamlı bir üretim takip ve yönetim sistemidir. Sistem, üretim emirlerini, stok takibini, makine/tezgah yönetimini, tedarikçi ilişkilerini ve sevkıyat süreçlerini tek bir platformda birleştirir.

### Temel Özellikler
- İş emri yönetimi ve takibi
- Parça/BOM yönetimi
- Tezgah/makine monitoring
- İrsaliye ve fatura eşleştirme
- Stok kartları ve envanter
- Fason iş takibi
- Personel ve vardiya yönetimi
- Gerçek zamanlı güncellemeler (Socket.IO)
- Mobil uyumlu arayüz

---

## Proje Yapısı

```
URTMtakip/
├── backend/              # Node.js backend (Express + SQLite)
│   ├── src/
│   │   ├── controllers/  # İş mantığı
│   │   ├── models/       # Veritabanı modelleri (Sequelize)
│   │   ├── routes/       # API endpoint'leri
│   │   ├── middleware/   # Custom middleware
│   │   ├── config/       # Konfigürasyon
│   │   └── utils/        # Yardımcı fonksiyonlar
│   ├── uploads/          # Dosya yüklemeleri
│   ├── importlar/        # Excel importları
│   └── database.sqlite   # SQLite veritabanı
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # UI bileşenleri
│   │   │   ├── mobile/   # Mobil bileşenler
│   │   │   └── ...
│   │   ├── pages/        # Sayfa bileşenleri
│   │   │   ├── mobile/   # Mobil sayfalar
│   │   │   └── ...
│   │   ├── store/        # Redux store
│   │   ├── services/     # API client
│   │   ├── utils/        # Yardımcı fonksiyonlar
│   │   ├── hooks/        # Custom hooks
│   │   └── App.jsx       # Ana uygulama
│   └── public/
│       └── uploads/      # Frontend upload klasörü
│
├── CNC_panel/            # ESP32 firmware
│   ├── src/              # PlatformIO proje
│   ├── include/          # Header dosyaları
│   └── platformio.ini    # Build config
│
├── STEP_BOM_Analyzer/    # Python CAD aracı
│   ├── main.py           # GUI uygulaması
│   └── requirements.txt   # Python bağımlılıkları
│
└── CAD_Import_Client/    # Python SolidWorks client
    ├── main.py           # GUI uygulaması
    └── requirements.txt   # Python bağımlılıkları
```

---

## Hızlı Başlangıç

### Geliştirme Ortamı Kurulumu

```bash
# 1. Tüm bağımlılıkları yükle
npm run install:all

# 2. Geliştirme sunucularını başlat
npm run dev
```

### Port Yapılandırması
- **Backend**: `http://localhost:3000`
- **Frontend**: `http://localhost:5173`

> ⚠️ **Önemli**: Port 5173 kullanılıyorsa otomatik olarak öldürülür ve yeniden başlatılır.

---

## Temel Kavramlar

### İş Emri (Work Order)
Üretimde yapılacak bir işi temsil eder. Her iş emri:
- Bir parça üretimini
- Belirli bir tezgahda
- Belirli bir miktarda
- Belirli bir termin tarihinde
tanımlar.

**Durumlar**: `planlandi` → `uretime_hazir` → `uretimde` → `tamamlandi`

### İrsaliye
Tedarikçilerden gelen veya müşterilere giden malzemelerin belgelendirilmesi. İrsaliyeler:
- **Geliş irsaliyesi**: Tedarikçiden gelen malzemeler
- **Çıkış irsaliyesi**: Müşteriye gönderilen mallar

**Kalem Eşleştirme**: İrsaliye kalemleri fatura kalemleriyle eşleştirilebilir (stok_kodu OR mal_hizmet_adi).

### Tezgah (Workstation)
Üretim yapılan fiziksel makine/tezgah. Her tezgah:
- Gerçek zamanlı durum takibi (idle, calisiyor, arizali, bakimda)
- Planlanan iş emirleri listesi
- Durum değişikliği logları

### BOM (Bill of Materials)
Bir parçanın hangi alt parçalardan oluştuğunu tanımlar. Hiyerarşik yapı:
- Ana BOM → Alt BOM'lar
- Malzeme adedi ve kayıp oranı
- Multi-level BOM desteği

### Stok Kartı
Envanter takibi için kullanılan kart. Her kart:
- Mevcut stok miktarı
- Min/max stok seviyeleri
- Stok hareketleri (giriş/çıkış)
- Kritik stok uyarıları

---

## API Kullanım Örnekleri

### Login

```javascript
const response = await axios.post('/api/auth/login', {
  kullanici_adi: 'admin',
  sifre: 'password123'
});
const { token } = response.data;
```

### İrsaliye Listesi

```javascript
const response = await axios.get('/api/irsaliyeler', {
  params: {
    page: 1,
    limit: 20,
    durum: 'bekliyor',
    tedarikci_id: 10
  }
});
```

### İrsaliye Oluşturma

```javascript
const response = await axios.post('/api/irsaliyeler', {
  irsaliye_no: '2024-001',
  tedarikci_id: 10,
  belge_tarih: '2024-01-20',
  belge_tipi: 'gelis',
  aciklama: 'Açıklama',
  kalemler: [
    {
      mal_hizmet_adi: 'Parça A',
      stok_kodu: 'PA-001',
      miktar: 100,
      birim: 'Adet',
      birim_fiyat: 25.50
    }
  ]
});
```

---

## Frontend State Management

### Redux Store Yapısı

```javascript
{
  auth: {
    user: {...},
    token: '...',
    authenticated: true
  },
  isEmirleri: {
    list: [...],
    loading: false,
    error: null
  },
  irsaliyeler: {
    list: [...],
    loading: false,
    error: null
  },
  tezgahlar: {
    list: [...],
    durumlar: {...},
    socketConnected: false
  }
}
```

### Custom Hooks

```javascript
// API çağrıları
const { data, loading, error } = useApi('/api/irsaliyeler');

// Cihaz algılama
const { isMobile, isTablet, isDesktop } = useDeviceDetect();

// Lock state
const { lockState, acquireLock, releaseLock } = useLock(irsaliyeId);

// Socket.IO
const { connected, emit, on } = useSocket();
```

---

## Socket.IO Events

### Client → Server

```javascript
// Odaya katılma
socket.emit('join_room', 'production');

// Lock al
socket.emit('acquire_lock', { irsaliye_id: 1 });

// Lock bırak
socket.emit('release_lock', { irsaliye_id: 1 });
```

### Server → Client

```javascript
// İş emri güncellendi
socket.on('is_emri_updated', (data) => {
  console.log('İş emri güncellendi:', data);
});

// Tezgah durumu değişti
socket.on('tezgah_durum_changed', (data) => {
  console.log('Tezgah durumu:', data);
});

// Bildirim
socket.on('bildirim', (data) => {
  showNotification(data.mesaj, data.tip);
});
```

---

## Veritabanı Sorgu Örnekleri

### Sequelize ORM

```javascript
// İrsaliye ve kalemlerini getir
const irsaliye = await Irsaliye.findByPk(id, {
  include: [
    { association: 'tedarikci', attributes: ['id', 'firma_adi'] },
    { association: 'kalemler' }
  ]
});

// Eşleşmemiş kalemleri bul
const kalemler = await IrsaliyeKalem.findAll({
  where: { eslesme_durumu: 0 }
});

// Stok kodu veya mal/hizmet adına göre kalem bul
const kalem = await IrsaliyeKalem.findOne({
  where: {
    [Op.or]: [
      { stok_kodu: stokKodu },
      { mal_hizmet_adi: malHizmetAdi }
    ]
  }
});
```

### Raw SQL

```sql
-- Kritik stok seviyesindeki parçalar
SELECT p.*, sk.mevcut_stok, sk.min_stok
FROM parcalar p
JOIN stok_kartlari sk ON sk.stok_kodu = p.stok_kodu
WHERE sk.mevcut_stok <= sk.min_stok;

-- Tezgah kullanım oranı (bugün)
SELECT
  t.tezgah_adi,
  COUNT(*) as toplam_is,
  SUM(CASE WHEN ie.durum = 'tamamlandi' THEN 1 ELSE 0 END) as tamamlanan_is
FROM tezgahlar t
LEFT JOIN is_emirleri ie ON ie.tezgah_id = t.id
WHERE DATE(ie.created_at) = DATE('now')
GROUP BY t.id;
```

---

## Hata Ayıklama (Debugging)

### Backend Hataları

```bash
# Backend logları
cd backend
npm run dev

# Winston logları
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### Frontend Hataları

```bash
# Frontend logları
cd frontend
npm run dev

# Browser console
# F12 → Console tab
```

### Veritabanı Hataları

```bash
# SQLite konsol
sqlite3 backend/database.sqlite

# Tablo yapısını kontrol et
.schema irsaliyeler

# Sorgu çalıştır
SELECT * FROM irsaliyeler LIMIT 10;
```

---

## Yaygın Sorunlar ve Çözümleri

### Port 5173 Kullanımda Hatası

**Sorun**: `Error: listen EADDRINUSE: address already in use :::5173`

**Çözüm**:
```bash
# Otomatik olarak proje bunu halleder
npm run dev
```

### Lock State Hatası

**Sorun**: İrsaliye düzenlerken "LOCKED_BY_OTHER" hatası

**Çözüm**:
```javascript
// Lock state kontrol et
if (lockState?.state === 'LOCKED_BY_OTHER') {
  // Kilitli olduğunu göster
  return;
}

// Lock al
await acquireLock();
```

### İrsaliye Kalemleri Görünmüyor

**Sorun**: Detay sayfasında kalemler listesi boş

**Çözüm**:
```javascript
// Backend'den gelen veriyi kontrol et
const irsaliye = {
  ...data,
  kalemler: data.kalemler || [] // Explicitly map kalemler
};
```

### CORS Hatası

**Sorun**: `Access-Control-Allow-Origin` hatası

**Çözüm**:
```javascript
// backend/src/index.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## Performans İpuçları

### Backend Optimizasyonu

1. **Sorgu Optimizasyonu**:
   - `SELECT *` yerine gerekli alanları seçin
   - `include` ile ilişkili verileri çekin (N+1 problemi)
   - Index'leri kullanın

2. **Pagination**:
   - Büyük listelerde pagination kullanın
   - `limit` ve `offset` parametreleri

3. **Caching**:
   - Sık kullanılan verileri cache'leyin
   - Redis kullanabilir (opsiyonel)

### Frontend Optimizasyonu

1. **Code Splitting**:
   ```javascript
   const IrsaliyeDetay = lazy(() => import('./pages/IrsaliyeDetay'));
   ```

2. **Debounce**:
   ```javascript
   const debouncedSearch = debounce(handleSearch, 300);
   ```

3. **Virtual Scrolling**:
   - Büyük listeler için `react-window` kullanın

---

## Güvenlik Best Practices

### Authentication

```javascript
// JWT token kontrolü
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Input Validation

```javascript
// Joi validation
const schema = Joi.object({
  irsaliye_no: Joi.string().required(),
  tedarikci_id: Joi.number().required(),
  belge_tarih: Joi.date().required(),
  kalemler: Joi.array().items(Joi.object({...}))
});

const { error } = schema.validate(req.body);
if (error) {
  return res.status(422).json({ error: error.details[0].message });
}
```

### SQL Injection Önleme

```javascript
// ✅ DOĞRU: Sequelize ORM kullan
const user = await User.findOne({
  where: { username: req.body.username }
});

// ❌ YANLIŞ: Raw query kullan
const user = await sequelize.query(
  `SELECT * FROM users WHERE username = '${req.body.username}'`
);
```

---

## Testing

### Backend Tests (Jest)

```bash
cd backend
npm test
```

```javascript
// Örnek test
describe('Irsaliye API', () => {
  test('should create irsaliye', async () => {
    const response = await request(app)
      .post('/api/irsaliyeler')
      .send({
        irsaliye_no: 'TEST-001',
        tedarikci_id: 1,
        belge_tarih: '2024-01-20',
        belge_tipi: 'gelis',
        kalemler: [...]
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### Frontend Tests (Vitest)

```bash
cd frontend
npm test
```

```javascript
// Örnek test
describe('IrsaliyeList', () => {
  it('renders irsaliye list', () => {
    render(<IrsaliyeList />);
    expect(screen.getByText('İrsaliyeler')).toBeInTheDocument();
  });
});
```

---

## Deployment

### Production Build

```bash
# Frontend build
cd frontend
npm run build

# Backend start
cd backend
npm start
```

### PM2 Configuration

```javascript
// pm2.config.json
module.exports = {
  apps: [
    {
      name: 'urtm-backend',
      script: './backend/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## CNC Panel Entegrasyonu

### ESP32 Firmware

```cpp
// WiFi bağlantı
WiFi.begin(ssid, password);

// Sunucuya bağlan
if (client.connect(server, 3000)) {
  // Durum gönder
  client.print("GET /api/tezgahlar/");
  client.print(tezgah_id);
  client.println("/durum");
}
```

### Durum Kodları

| Kod | Açıklama |
|-----|----------|
| 0 | Idle (Boşta) |
| 1 | Running (Çalışıyor) |
| 2 | Error/Maintenance (Arıza/Bakım) |

---

## CAD Entegrasyonu

### STEP_BOM_Analyzer

```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt
python main.py
```

**Özellikler**:
- STEP dosyası BOM çıkarımı
- 3D rendering
- JSON/Excel/CSV/XML export
- FreeCAD entegrasyonu

### CAD_Import_Client

```bash
cd CAD_Import_Client
pip install -r requirements.txt
python main.py
```

**Özellikler**:
- SolidWorks COM automation
- Thumbnail generation
- Batch processing
- WebSocket güncellemeleri

---

## İleri Konular

### Real-time Updates

```javascript
// Socket.IO ile gerçek zamanlı güncellemeler
useEffect(() => {
  socket.on('is_emri_updated', handleUpdate);
  return () => {
    socket.off('is_emri_updated', handleUpdate);
  };
}, []);
```

### Mobile Responsive Design

```javascript
// Cihaz algılama
const { isMobile } = useDeviceDetect();

// Mobil bileşen
if (isMobile) {
  return <IrsaliyeListMobile />;
}
return <IrsaliyeListDesktop />;
```

### Excel Import

```javascript
// Backend: Excel parse et
const XLSX = require('xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[worksheet];
const data = XLSX.utils.sheet_to_json(sheet);
```

---

## Kaynaklar

### Dokümantasyon
- [API Documentation](/claudedocs/api-documentation.md)
- [Database Schema](/claudedocs/database-schema.md)
- [Project README](/README.md)

### Dış Kaynaklar
- [Sequelize Docs](https://sequelize.org/)
- [React Docs](https://react.dev/)
- [Material-UI](https://mui.com/)
- [Socket.IO](https://socket.io/)
- [PlatformIO](https://platformio.org/)

---

## İletişim ve Destek

### Bug Report
GitHub Issues: [Proje Repo]

### Feature Request
Proje yöneticisi ile iletişime geçin

### Destek
- Email: support@example.com
- Slack: #urtm-takip channel
