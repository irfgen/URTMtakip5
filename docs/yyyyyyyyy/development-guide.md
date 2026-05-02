# ÜRTM Takip Geliştirme Rehberi

## Geliştirme Ortamı Kurulumu

### Gereksinimler

**Sistem Gereksinimleri:**
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: v18.0+ (LTS tavsiye edilir)
- **NPM**: v8.0+ veya Yarn 1.22+
- **Python**: 3.8+ (Python araçları için)
- **Git**: v2.30+
- **IDE**: VS Code (tavsiye edilen)

**Donanım Gereksinimleri:**
- **RAM**: Minimum 8GB, tavsiye 16GB+
- **Depolama**: En az 10GB boş alan
- **İşlemci**: Multi-core destekli

### Kurulum Adımları

#### 1. Proje Klonlama
```bash
# Git klonlama
git clone https://github.com/username/URTMtakip.git
cd URTMtakip

# Branch kontrolü
git checkout v13.dev15
git pull origin v13.dev15
```

#### 2. Node.js Kurulumu
```bash
# Node.js versiyon kontrolü
node --version  # v18.0.0+ olmalı
npm --version   # v8.0.0+ olmalı

# Gerekli değilse nvm kullanabilirsiniz
# nvm install 18
# nvm use 18
```

#### 3. Bağımlılık Yükleme
```bash
# Ana dizindeki tüm bağımlılıkları kur
npm run install:all

# Veya manuel olarak:
# Backend bağımlılıkları
cd backend && npm install

# Frontend bağımlılıkları
cd ../frontend && npm install
```

#### 4. Veritabanı Migrasyonları
```bash
cd backend
npm run migrate

# Migration kontrolü
npm run check-durum-status
```

#### 5. Ortam Değişkenleri
```bash
# Backend .env dosyası oluşturma
cd backend
cp .env.example .env

# .env dosyasını düzenleyin
nano .env
```

**.env Örnek:**
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
DB_PATH=./database.sqlite
UPLOAD_MAX_SIZE=100MB
CORS_ORIGIN=http://localhost:5173

# CNC Panel konfigürasyonu
CNC_SERVER_HOST=192.168.1.206
CNC_SERVER_PORT=3000

# Email konfigürasyonu (opsiyonel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Development Workflow

### Proje Yapısı Anlaşımı

```
URTMtakip/
├── backend/          # Node.js API sunucusu
│   ├── src/
│   │   ├── controllers/  # İş mantığı
│   │   ├── models/       # Veri modelleri
│   │   ├── routes/       # API route'ları
│   │   └── middleware/   # Custom middleware'lar
│   ├── database.sqlite   # SQLite veritabanı
│   └── uploads/         # Dosya yüklemeleri
├── frontend/         # React uygulaması
│   ├── src/
│   │   ├── components/  # React bileşenleri
│   │   ├── pages/       # Sayfa bileşenleri
│   │   ├── store/       # Redux store
│   │   └── services/    # API servisleri
└── CNC_panel/        # ESP32 donanım kodu
```

### Development Sunucusu Başlatma

#### 1. Ana Geliştirme Modu (Tavsiye Edilen)
```bash
# Proje ana dizininde
npm run dev
```
Bu komut hem backend (port 3000) hem de frontend (port 5173) sunucularını aynı anda başlatır.

#### 2. Ayrı Sunucular
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### 3. Port Sorunu Çözümü
```bash
# Mevcut süreçleri öldür
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# Süreci öldür
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux

# Veya quick-restart betiği kullan
npm run restart
```

### Development Kuralları

#### 1. Port Kullanımı
- **Frontend**: HER ZAMAN port 5173
- **Backend**: HER ZAMAN port 3000
- **Diğer portları KULLANMAYIN**

#### 2. Commit Kuralları
```bash
# Branch oluşturma
git checkout -b feature/yeni-ozellik

# Değişiklikleri ekleme
git add .
git commit -m "feat: yeni iş emri filtreleme özelliği eklendi"

# Push
git push origin feature/yeni-ozellik
```

**Commit Mesaj Formatı:**
```
<type>: <subject>

<body>

<footer>
```

**Type'lar:**
- `feat`: Yeni özellik
- `fix`: Bug fix
- `docs`: Dokümantasyon
- `style`: Formatlama
- `refactor`: Refactoring
- `test`: Test
- `chore`: Build/değişiklik

**Örnekler:**
```bash
git commit -m "feat: iş emri durum güncelleme API'i eklendi"
git commit -m "fix: parça stok hesaplama hatası düzeltildi"
git commit -m "docs: API dokümantasyonu güncellendi"
```

#### 3. Kod Standartları

**JavaScript/JSX:**
- ES6+ syntax kullanın
- Arrow functions tercih edin
- Destructuring kullanın
- Template literals kullanın

**Örnek:**
```javascript
// ✅ İyi
const getIsEmriDetails = async (id) => {
  const { data } = await apiClient.get(`/is-emirleri/${id}`);
  return data;
};

const { siparisNo, parcaAdi, miktar } = isEmri;

// ❌ Kötü
function getIsEmriDetails(id) {
  return apiClient.get('/api/is-emirleri/' + id)
    .then(function(response) {
      return response.data;
    });
}

var siparisNo = isEmri.siparisNo;
var parcaAdi = isEmri.parcaAdi;
var miktar = isEmri.miktar;
```

**React Bileşenleri:**
```javascript
// ✅ Functional component with hooks
const IsEmriListesi = ({ isEmirleri, onSelect }) => {
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    onSelect?.(id);
  }, [onSelect]);

  return (
    <div>
      {isEmirleri.map((item) => (
        <IsEmriKarti
          key={item.id}
          data={item}
          selected={selectedId === item.id}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};

export default memo(IsEmriListesi);
```

#### 4. Dosya İsimlendirme

**Component'ler:**
- `PascalCase`: `IsEmriListesi.jsx`, `ParcaKarti.jsx`
- Alt dizin: `components/mobile/MobileIsEmriListesi.jsx`

**Dosyalar:**
- `camelCase`: `apiClient.js`, `userService.js`
- Test dosyaları: `IsEmriListesi.test.jsx`

**CSS Modules:**
- `PascalCase.module.css`: `IsEmriListesi.module.css`

## Debugging

### Backend Debugging

#### 1. Console Debugging
```javascript
// Basic logging
console.log('İş emri ID:', isEmriId);
console.error('API hatası:', error);

// Structured logging
winston.info('İş emri oluşturuldu', {
  isEmriId,
  userId,
  ip: req.ip
});
```

#### 2. VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/src/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    }
  ]
}
```

#### 3. Database Debugging
```javascript
// Sequelize logging
const sequelize = new Sequelize(database, user, password, {
  logging: (msg) => console.log('SQL:', msg),
  benchmark: true
});

// Transaction debugging
const transaction = await sequelize.transaction();
try {
  // operations
  await transaction.commit();
} catch (error) {
  console.error('Transaction rollback:', error);
  await transaction.rollback();
}
```

### Frontend Debugging

#### 1. React DevTools
- Chrome Extension kurun
- Component state ve props'ları inceleyin
- Redux store'ı takip edin

#### 2. Network Debugging
```javascript
// API response debugging
apiClient.get('/is-emirleri')
  .then(response => {
    console.log('API Response:', response.data);
    return response.data;
  })
  .catch(error => {
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else if (error.request) {
      console.error('Request Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  });
```

#### 3. Redux DevTools
```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { composeWithDevTools } from 'redux-devtools-extension';

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
});
```

## Testing

### Test Structure

```
__tests__/
├── unit/           # Unit test'ler
├── integration/    # Integration test'leri
└── e2e/           # End-to-end test'ler
```

### Backend Testing (Jest)

#### 1. Test Setup
```javascript
// backend/src/test/setup.js
const { sequelize } = require('../config/database');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate();
});
```

#### 2. Unit Test Örneği
```javascript
// backend/src/controllers/__tests__/isEmirleri.test.js
const request = require('supertest');
const app = require('../../app');

describe('İş Emirleri API', () => {
  test('GET /api/is-emirleri should return 200', async () => {
    const response = await request(app)
      .get('/api/is-emirleri')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/is-emirleri should create new work order', async () => {
    const workOrder = {
      siparisNo: 'TEST-001',
      parcaId: 'test-parca-uuid',
      tezgahId: 1,
      miktar: 100,
      terminTarihi: '2024-12-30'
    };

    const response = await request(app)
      .post('/api/is-emirleri')
      .send(workOrder)
      .expect(201);

    expect(response.body.data.siparisNo).toBe(workOrder.siparisNo);
  });
});
```

#### 3. Test Komutları
```bash
# Tüm testleri çalıştır
cd backend && npm test

# Coverage raporu
npm run test:coverage

# Watch mode
npm run test:watch

# Spesifik test dosyası
npm test -- --testNamePattern="İş Emirleri"
```

### Frontend Testing (Vitest + React Testing Library)

#### 1. Test Setup
```javascript
// frontend/src/test/setup.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock API calls
vi.mock('../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));
```

#### 2. Component Test Örneği
```javascript
// frontend/src/components/__tests__/IsEmriListesi.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import IsEmriListesi from '../IsEmriListesi';

const mockStore = configureStore({
  reducer: {
    isEmirleri: () => ({
      data: [
        { id: '1', siparisNo: 'SO-001', durum: 0 },
        { id: '2', siparisNo: 'SO-002', durum: 1 }
      ],
      loading: false
    })
  }
});

describe('IsEmriListesi', () => {
  test('renders work orders list', () => {
    render(
      <Provider store={mockStore}>
        <IsEmriListesi />
      </Provider>
    );

    expect(screen.getByText('SO-001')).toBeInTheDocument();
    expect(screen.getByText('SO-002')).toBeInTheDocument();
  });

  test('calls onSelect when work order clicked', () => {
    const onSelect = vi.fn();
    render(
      <Provider store={mockStore}>
        <IsEmriListesi onSelect={onSelect} />
      </Provider>
    );

    fireEvent.click(screen.getByText('SO-001'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

#### 3. Frontend Test Komutları
```bash
# Tüm testleri çalıştır
cd frontend && npm test

# UI arayüzü
npm run test:ui

# Coverage
npm run test:coverage
```

## Performance Optimizasyonu

### Backend Optimizasyonları

#### 1. Database Queries
```javascript
// ✅ İyi: Eager loading
const isEmirleri = await IsEmir.findAll({
  include: [
    { model: Parca, as: 'parca' },
    { model: Tezgah, as: 'tezgah' }
  ],
  where: { durum: 1 },
  order: [['terminTarihi', 'ASC']]
});

// ❌ Kötü: N+1 problem
const isEmirleri = await IsEmri.findAll({ where: { durum: 1 } });
for (const isEmri of isEmirleri) {
  isEmri.parca = await Parca.findByPk(isEmri.parcaId);
  isEmri.tezgah = await Tezgah.findByPk(isEmri.tezgahId);
}
```

#### 2. Caching
```javascript
// Simple memory cache
const cache = new Map();

const getParcalarWithCache = async () => {
  const cacheKey = 'parcalar_list';

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const parcalar = await Parca.findAll({
    where: { aktif: true },
    order: [['adi', 'ASC']]
  });

  cache.set(cacheKey, parcalar);

  // Cache'i 5 dakika sonra temizle
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

  return parcalar;
};
```

#### 3. Image Optimization
```javascript
// Sharp ile resim optimizasyonu
const optimizeImage = async (buffer) => {
  return await sharp(buffer)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
};
```

### Frontend Optimizasyonları

#### 1. Code Splitting
```javascript
// Lazy loading
const Dashboard = lazy(() => import('../pages/Dashboard'));
const IsEmirleriListesi = lazy(() => import('../pages/IsEmirleriListesi'));

// Suspense ile kullanım
<Suspense fallback={<CircularProgress />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/is-emirleri" element={<IsEmirleriListesi />} />
</Suspense>
```

#### 2. Memoization
```javascript
// useMemo ile pahalı hesaplamalar
const filteredIsEmirleri = useMemo(() => {
  return isEmirleri.filter(ie => {
    if (filters.durum !== 'all' && ie.durum !== filters.durum) return false;
    if (filters.tezgahId && ie.tezgahId !== filters.tezgahId) return false;
    return true;
  });
}, [isEmirleri, filters]);

// useCallback ile event handler'lar
const handleSelect = useCallback((id) => {
  navigate(`/is-emirleri/${id}`);
}, [navigate]);
```

#### 3. Virtual Scrolling
```jsx
// React Window ile büyük listeler
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <IsEmriKarti data={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={120}
    >
      {Row}
    </List>
  );
};
```

## Security Best Practices

### Backend Security

#### 1. Input Validation
```javascript
// Joi validation
const isEmriSchema = Joi.object({
  siparisNo: Joi.string().required().max(50),
  miktar: Joi.number().integer().min(1).required(),
  terminTarihi: Joi.date().min('now').required()
});

// Middleware kullanımı
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  };
};
```

#### 2. SQL Injection Prevention
```javascript
// ✅ İyi: Parameterized queries
const results = await sequelize.query(
  'SELECT * FROM is_emirleri WHERE durum = ? AND terminTarihi >= ?',
  { replacements: [durum, tarih], type: QueryTypes.SELECT }
);

// ❌ Kötü: String concatenation
const sql = `SELECT * FROM is_emirleri WHERE durum = ${durum}`;
```

#### 3. File Upload Security
```javascript
// Multer konfigürasyonu
const upload = multer({
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
```

### Frontend Security

#### 1. XSS Prevention
```jsx
// ✅ İyi: React otomatik olarak korur
<div>{userInput}</div>

// ❌ Kötü: dangerouslySetInnerHTML kullanımı
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Eğer zorunlu ise:
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userInput)
}} />
```

#### 2. Authentication Token Management
```javascript
// HttpOnly cookie ile token saklama
// Backend
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000 // 24 saat
});

// LocalStorage yerine kullanın
// ✅ İyi: Cookie (httpOnly)
// ❌ Kötü: localStorage (XSS'e açık)
```

## Deployment

### Production Build

#### 1. Frontend Build
```bash
cd frontend
npm run build

# Build kontrolü
npm run preview
```

#### 2. Production Environment
```bash
# Production .env dosyası
NODE_ENV=production
PORT=3000
DB_PATH=/var/www/urtm/database.sqlite
UPLOAD_MAX_SIZE=50MB

# PM2 ile production başlatma
pm2 start ecosystem.config.js --env production
```

#### 3. Nginx Konfigürasyonu
```nginx
# /etc/nginx/sites-available/urtm
server {
    listen 80;
    server_name your-domain.com;

    # Frontend statik dosyalar
    location / {
        root /var/www/urtm/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Hata Çözümü (Troubleshooting)

### Yaygın Sorunlar ve Çözümleri

#### 1. Port 5173 Kullanılıyor Hatası
```bash
# Çözüm: Mevcut işlemi sonlandır
lsof -ti:5173 | xargs kill -9

# Windows için
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Veya projenin quick-restart betiği
npm run restart
```

#### 2. Veritabanı Bağlantı Hatası
```bash
# SQLite dosyası kontrolü
ls -la backend/database.sqlite

# Migration kontrolü
cd backend
npm run check-durum-status

# Veritabanı reset
rm backend/database.sqlite
npm run migrate
```

#### 3. CORS Hatası
```javascript
// Backend CORS konfigürasyonu
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

#### 4. Memory Leak Debugging
```javascript
// Backend memory tracking
const memoryUsage = process.memoryUsage();
console.log('Memory Usage:', {
  rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
  heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
  heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
});

// React memory leak kontrolü
useEffect(() => {
  const subscription = someObservable.subscribe();

  return () => {
    subscription.unsubscribe(); // Cleanup!
  };
}, []);
```

## İleri Konular

### 1. Microservices Mimarisi
```javascript
// Servis ayrımı örneği
// API Gateway
const express = require('express');
const app = express();

// İstekleri ilgili servise yönlendirme
app.use('/api/production', require('./services/production'));
app.use('/api/inventory', require('./services/inventory'));
app.use('/api/quality', require('./services/quality'));
```

### 2. Advanced Caching
```javascript
// Redis cache implementation
const Redis = require('redis');
const client = redis.createClient();

const cachedQuery = async (key, queryFn, ttl = 300) => {
  const cached = await client.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await queryFn();
  await client.setex(key, ttl, JSON.stringify(result));

  return result;
};
```

### 3. WebSocket Scaling
```javascript
// Socket.IO cluster
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');

const io = new Server(httpServer, {
  adapter: createAdapter(redisClient.duplicate(), redisClient.duplicate())
});
```

### 4. CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

## Kaynaklar

### Dokümantasyonlar
- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)
- [Express.js Documentation](https://expressjs.com)
- [Material-UI Documentation](https://mui.com)
- [Sequelize Documentation](https://sequelize.org)
- [SQLite Documentation](https://sqlite.org/docs.html)

### Araçlar
- [Postman](https://www.postman.com) - API testing
- [DBeaver](https://dbeaver.io) - Database management
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

### Best Practices
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Topluluk
- [Stack Overflow](https://stackoverflow.com) - Soru/Cevap
- [Reddit r/NodeJS](https://reddit.com/r/nodejs) - Node.js topluluğu
- [Reddit r/reactjs](https://reddit.com/r/reactjs) - React topluluğu