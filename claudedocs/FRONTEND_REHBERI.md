# ÜRTM Takip Sistemi - Frontend Rehberi

## Genel Bakış

Frontend, React 18.2+ ve Vite 5.0+ ile geliştirilmiş modern bir SPA (Single Page Application) uygulamasıdır. Material-UI (MUI) kütüphanesi kullanılarak tutarlı ve profesyonel bir arayüz sağlanır.

## Teknoloji Yığını

### Core Frameworks
- **React**: 18.2+ (UI kütüphanesi)
- **Vite**: 5.0+ (Build tool ve dev server)
- **React Router DOM**: 6.20+ (Client-side routing)

### UI Kütüphaneleri
- **Material-UI (MUI)**: 5.17+ (Ana UI bileşen kütüphanesi)
- **MUI X DataGrid**: 6.18+ (Tablo bileşeni)
- **MUI X Date Pickers**: 7.29+ (Tarih seçiciler)
- **Bootstrap**: 5.3.7+ (Ekstra UI bileşenleri)
- **React Bootstrap**: 2.10.10+ (React Bootstrap bileşenleri)

### State Management
- **Redux Toolkit**: 2.0+ (Global state yönetimi)
- **React Redux**: 9.0+ (Redux React bindings)

### Data Fetching
- **Axios**: 1.9+ (HTTP client)
- **Socket.IO Client**: 4.7+ (Real-time iletişim)

### Form Yönetimi
- **Formik**: 2.4+ (Form yönetimi)
- **Yup**: 1.6+ (Form validasyonu)

### Grafik ve Görselleştirme
- **Chart.js**: 4.4+ (Grafik kütüphanesi)
- **React Chart.js-2**: 5.2+ (React wrapper)
- **Recharts**: 3.2+ (Alternatif grafik kütüphanesi)
- **React Gauge Chart**: 0.5.1 (Ölçek göstergeleri)

### Drag & Drop
- **@hello-pangea/dnd**: 18.0+ (React beautiful dnd fork)
- **React Draggable**: 4.4.6+ (Sürüklenebilir bileşenler)

### Diğer Kütüphaneler
- **react-pdf**: 7.7+ (PDF görüntüleme)
- **qrcode.react**: 4.2.0+ (QR kod oluşturma)
- **@yudiel/react-qr-scanner**: 2.3.1+ (QR kod tarama)
- **react-dropzone**: 14.3.8+ (Dosya yükleme)
- **dayjs**: 1.11.13+ (Tarih manipülasyonu)
- **date-fns**: 2.30.0+ (Tarih utility fonksiyonları)
- **XLSX**: 0.18.5+ (Excel işleme)

### Testing
- **Vitest**: 1.0+ (Unit test framework)
- **React Testing Library**: 14.1.2+ (Component testing)
- **jsdom**: 27.0.0+ (DOM simulation)

## Proje Yapısı

### Dizin Organizasyonu

```
frontend/src/
├── components/          # Yeniden kullanılabilir bileşenler
├── pages/              # Sayfa seviyesinde bileşenler
├── pages/mobile/       # Mobil özgü sayfalar
├── hooks/              # Custom React hooks
├── store/              # Redux store
├── services/           # API client ve servisler
├── utils/              # Yardımcı fonksiyonlar
├── modules/            # Modüler yapı
├── theme.js            # Masaüstü tema
├── theme.mobile.js     # Mobil tema
└── App.jsx             # Ana uygulama bileşeni
```

## Bileşen Yapısı

### 1. Layout Bileşenleri

**Layout.jsx** (Masaüstü):
```jsx
<Layout>
  <Sidebar />          {/* Sol navigasyon */}
  <Header />           {/* Üst header */}
  <MainContent />      {/* Ana içerik */}
  <Footer />           {/* Alt bilgi */}
</Layout>
```

**MobileLayout.jsx** (Mobil):
```jsx
<MobileLayout>
  <MobileHeader />     {/* Mobil header */}
  <MobileNav />        {/* Alt navigasyon */}
  <PageContent />      {/* Sayfa içeriği */}
</MobileLayout>
```

### 2. Sayfa Bileşenleri

Her sayfa, `/pages/` dizininde ayrı bir bileşen olarak tanımlanır:

```jsx
// pages/IsEmirleri.jsx
function IsEmirleri() {
  return (
    <div className="is-emirleri-page">
      <IsEmriListesi />
      <IsEmriFiltreleri />
      <IsEmriIslemleri />
    </div>
  );
}
```

### 3. Yeniden Kullanılabilir Bileşenler

`/components/` dizini, birden fazla sayfada kullanılan ortak bileşenleri içerir:

**Örnek Bileşenler**:
- `ParcaKarti.jsx`: Parça bilgileri kartı
- `TezgahKarti.jsx`: Tezgah bilgileri kartı
- `IsEmriRaporKarti.jsx`: İş emri rapor kartı
- `DataTable.jsx`: Genel tablo bileşeni
- `FormModal.jsx`: Genel form modalı
- `SearchBar.jsx`: Arama çubuğu

### 4. Mobil Bileşenler

`/pages/mobile/` dizini, mobil özgü sayfa bileşenlerini içerir:

```jsx
// pages/mobile/IsEmirleriMobileYeni.jsx
function IsEmirleriMobileYeni() {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="mobile-page">
      <MobileFilterModal open={filterOpen} />
      <SwipeableList />
      <FloatingActionButton />
    </div>
  );
}
```

## State Yönetimi

### Redux Toolkit

**Store Yapısı**:
```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './slices';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(),
  devTools: process.env.NODE_ENV !== 'production',
});
```

**Slice Örneği**:
```javascript
// store/slices/isEmirleriSlice.js
import { createSlice } from '@reduxjs/toolkit';

const isEmirleriSlice = createSlice({
  name: 'isEmirleri',
  initialState: {
    list: [],
    loading: false,
    error: null,
    filters: {},
  },
  reducers: {
    setIsEmirleri: (state, action) => {
      state.list = action.payload;
    },
    addIsEmri: (state, action) => {
      state.list.push(action.payload);
    },
    updateIsEmri: (state, action) => {
      const index = state.list.findIndex(ie => ie.is_emri_id === action.payload.is_emri_id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    deleteIsEmri: (state, action) => {
      state.list = state.list.filter(ie => ie.is_emri_id !== action.payload);
    },
  },
});

export const { setIsEmirleri, addIsEmri, updateIsEmri, deleteIsEmri } = isEmirleriSlice.actions;
export default isEmirleriSlice.reducer;
```

**Redux Kullanımı**:
```jsx
import { useSelector, useDispatch } from 'react-redux';
import { setIsEmirleri } from '../store/slices/isEmirleriSlice';

function IsEmirleriListesi() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(state => state.isEmirleri);

  useEffect(() => {
    fetchIsEmirleri().then(data => {
      dispatch(setIsEmirleri(data));
    });
  }, [dispatch]);

  if (loading) return <Loading />;

  return (
    <ul>
      {list.map(isEmri => (
        <IsEmriItem key={isEmri.is_emri_id} isEmri={isEmri} />
      ))}
    </ul>
  );
}
```

## Routing

### React Router DOM Konfigürasyonu

**App.jsx**:
```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDeviceDetect } from './hooks/useDeviceDetect';

function App() {
  const { isMobile } = useDeviceDetect();

  return (
    <ThemeProvider theme={isMobile ? mobileTheme : theme}>
      <CssBaseline />
      {isMobile ? (
        <MobileLayout>
          <Routes>
            <Route path="/mobile/dashboard" element={<DashboardMobile />} />
            <Route path="/mobile/is-emirleri" element={<IsEmirleriMobileYeni />} />
            {/* ... mobil routes */}
          </Routes>
        </MobileLayout>
      ) : (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/is-emirleri" element={<IsEmirleri />} />
            {/* ... desktop routes */}
          </Routes>
        </Layout>
      )}
    </ThemeProvider>
  );
}
```

### Route Yapısı

**Masaüstü Routes**:
- `/dashboard` - Ana dashboard
- `/is-emirleri` - İş emirleri listesi
- `/tezgahlar` - Tezgahlar sayfası
- `/parcalar` - Parçalar sayfası
- `/uretim-plani` - Üretim planlama
- `/raporlar` - Raporlar sayfası
- `/sevkiyat` - Sevkiyat yönetimi
- `/faturalar` - Fatura yönetimi
- `/irsaliyeler` - İrsaliye yönetimi
- `/eslestirme` - Fatura-irsaliye eşleştirme

**Mobil Routes** (`/mobile/*` öneki):
- `/mobile/dashboard` - Mobil dashboard
- `/mobile/is-emirleri` - Mobil iş emirleri
- `/mobile/tezgahlar` - Mobil tezgahlar
- `/mobile/uretim-plani` - Mobil üretim planı
- `/mobile/parcalar` - Mobil parçalar
- `/mobile/irsaliyeler` - Mobil irsaliyeler

## Mobil/Masaüstü Düzeni

### Cihaz Algılama

**useDeviceDetect Hook**:
```jsx
// hooks/useDeviceDetect.js
import { useState, useEffect } from 'react';

export function useDeviceDetect() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768); // Tablet breakpoint
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile };
}
```

### Mobil Özgü Özellikler

**Dokunmatik Optimize**:
- Büyük butonlar (min 44px x 44px)
- Swipe gestures
- Pull-to-refresh
- Bottom navigation
- Floating action buttons
- Modal bottom sheets

**Responsive Breakpoints**:
```javascript
// theme.js
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};
```

## API Entegrasyonu

### Axios Client

**services/api.js**:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token ekle (gelecekte)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Hata yönetimi
    if (error.response?.status === 401) {
      // Unauthorized yönlendirme
    }
    return Promise.reject(error);
  }
);

export default api;
```

**API Kullanımı**:
```jsx
import api from '../services/api';

function IsEmirleriListesi() {
  const [isEmirleri, setIsEmirleri] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/is-emirleri');
        setIsEmirleri(response.data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  }, []);

  return <ul>{isEmirleri.map(ie => <li key={ie.is_emri_id}>{ie.is_adi}</li>)}</ul>;
}
```

## WebSocket Entegrasyonu

### Socket.IO Client

**socket.js**:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: false,
  withCredentials: true,
});

export default socket;
```

**Socket Kullanımı**:
```jsx
import { useEffect } from 'react';
import socket from '../socket';

function IsEmriCanliGuncelleme({ isEmriId }) {
  useEffect(() => {
    socket.connect();

    socket.on('isEmriGuncellendi', (data) => {
      if (data.is_emri_id === isEmriId) {
        // Güncelle
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isEmriId]);

  return <div>Canlı güncellemeler aktif</div>;
}
```

## Form Yönetimi

### Formik + Yup

**Form Örneği**:
```jsx
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  is_adi: Yup.string().required('İş adı gereklidir'),
  adet: Yup.number().required('Adet gereklidir').positive('Pozitif olmalı'),
  teslim_tarihi: Yup.date().required('Tarih gereklidir'),
});

function IsEmriForm({ onSubmit, initialValues }) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <Form>
          <Field name="is_adi" type="text" placeholder="İş Adı" />
          <ErrorMessage name="is_adi" component="div" />

          <Field name="adet" type="number" placeholder="Adet" />
          <ErrorMessage name="adet" component="div" />

          <Field name="teslim_tarihi" type="date" />
          <ErrorMessage name="teslim_tarihi" component="div" />

          <button type="submit" disabled={isSubmitting}>
            Kaydet
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

## Temalar

### Masaüstü Tema

**theme.js**:
```javascript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;
```

### Mobil Tema

**theme.mobile.js**:
```javascript
import { createTheme } from '@mui/material/styles';

const mobileTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14, // Daha büyük fontlar
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48, // Daha büyük butonlar
          textTransform: 'none',
        },
      },
    },
  },
});

export default mobileTheme;
```

## Custom Hooks

### useDeviceDetect

Cihaz algılama hook'u:
```jsx
import { useDeviceDetect } from '../hooks/useDeviceDetect';

function MyComponent() {
  const { isMobile } = useDeviceDetect();

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### useApi

API çağrıları hook'u:
```jsx
function useApi(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(endpoint)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [endpoint]);

  return { data, loading, error };
}
```

## Performans Optimizasyonu

### Code Splitting

```jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const IsEmirleri = lazy(() => import('./pages/IsEmirleri'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/is-emirleri" element={<IsEmirleri />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```jsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Pahalı hesaplamalar
  return <div>{/* ... */}</div>;
});
```

### Virtual Scrolling

```jsx
import { FixedSizeList } from 'react-window';

function LongList({ items }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

## Testing

### Vitest Test Örneği

```jsx
// IsEmriListesi.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IsEmriListesi from './IsEmriListesi';

describe('IsEmriListesi', () => {
  it('iş emirlerini listeler', () => {
    const mockData = [
      { is_emri_id: 1, is_adi: 'Test İş 1' },
      { is_emri_id: 2, is_adi: 'Test İş 2' },
    ];

    render(<IsEmriListesi isEmirleri={mockData} />);

    expect(screen.getByText('Test İş 1')).toBeInTheDocument();
    expect(screen.getByText('Test İş 2')).toBeInTheDocument();
  });
});
```

## Geliştirme İpuçları

### Hot Module Replacement (HMR)
Vite, HMR ile anlık güncellemeler sunar. Değişiklikleriniz tarayıcıda otomatik olarak yansır.

### Proxy Konfigürasyonu

**vite.config.js**:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

### Build Optimizasyonu

```bash
# Production build
npm run build

# Build analizi
npm run build -- --analyze
```

### Environment Variables

```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## Erişilebilirlik

### ARIA Özellikleri

```jsx
<Button aria-label="Yeni iş emri oluştur">
  <AddIcon />
</Button>
```

### Klavye Navigasyonu

Tüm etkileşimli elementler klavye ile erişilebilir olmalıdır:

```jsx
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Tıkla
</button>
```

## SEO (Gelecekte)

Single Page Application olduğu için, SSR (Server-Side Rendering) gerekebilir:

- Next.js geçişi
- Meta tag yönetimi
- Sitemap oluşturma
- Schema.org markup
