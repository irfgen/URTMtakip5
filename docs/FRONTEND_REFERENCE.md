# ÜRTM Takip - Frontend Referans Dokümantasyonu

## Frontend Mimarisi

Bu dokümantasyon, ÜRTM Takip sisteminin frontend yapısını, bileşenlerini ve navigasyon yapısını açıklar.

### Temel Bilgiler

- **Framework**: React 18+ with Vite
- **UI Kütüphanesi**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Real-time**: Socket.IO Client
- **Dev Server Port**: 5173
- **HTTP Client**: Axios

---

## Teknoloji Yığını

### Core Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.0.0",
  "@mui/material": "^5.0.0",
  "@reduxjs/toolkit": "^1.9.0",
  "axios": "^1.0.0",
  "socket.io-client": "^4.0.0",
  "vite": "^4.0.0"
}
```

### Ana Kütüphaneler

- **@hello-pangea/dnd**: Drag & Drop işlevselliği
- **chart.js + react-chartjs-2**: Grafikler ve görselleştirme
- **react-pdf**: PDF görüntüleme
- **formik + yup**: Form yönetimi ve validasyon
- **date-fns**: Tarih işlemleri

---

## Proje Yapısı

```
frontend/src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── Layout/         # Ana layout bileşenleri
│   ├── Mobile/         # Mobil özel bileşenler
│   ├── UretimPlani/    # Üretim planı bileşenleri
│   ├── WorkstationScheduler/  # Tezgah iş planı
│   ├── makindex/       # Makindex modülü
│   └── tedarik/        # Tedarik modülü
├── pages/              # Sayfa bileşenleri
│   ├── mobile/         # Mobil sayfalar
│   ├── ArizaBakim/     # Arıza/bakım sayfaları
│   └── Raporlar/       # Rapor sayfaları
├── store/              # Redux store
│   └── slices/         # Redux slice'ları
├── hooks/              # Custom hooks
├── services/           # API servisleri
├── utils/              # Yardımcı fonksiyonlar
├── theme.js            # Desktop tema
├── theme.mobile.js     # Mobil tema
└── App.jsx             # Ana uygulama bileşeni
```

---

## Redux Store Yapısı

### Slice'lar

| Slice | Açıklama | State |
|-------|----------|-------|
| `isEmirleriSlice` | İş emri yönetimi | işEmirleri, loading, error |
| `tezgahlarSlice` | Tezgah durumları | tezgahlar, durumlar |
| `parcalarSlice` | Parça verileri | parcalar, seciliParca |
| `stokSlice` | Stok takibi | stokKartlari, hareketler |
| `uretimPlaniSlice` | Üretim planları | planlar, seciliPlan |
| `arizaBakimSlice` | Arıza/bakım kayıtları | kayitlar, filtreler |
| `schedulerSlice` | Tezgah iş planı | planlananIsler, kaynaklar |
| `makindexSlice` | Makindex sistemi | bomHierarchy, seciliBom |
| `timelineSlice` | Timeline verileri | olaylar, filtreler |

### Store Kullanımı

```javascript
// Slice'tan veri okuma
import { useSelector } from 'react-redux';
const isEmirleri = useSelector(state => state.isEmirleri.isEmirleri);

// Action dispatch etme
import { useDispatch } from 'react-redux';
import { fetchIsEmirleri } from './store/slices/isEmirleriSlice';
const dispatch = useDispatch();
dispatch(fetchIsEmirleri());
```

---

## Sayfa Yapısı ve Rotalar

### Desktop Rotaları

| Route | Bileşen | Açıklama |
|-------|---------|----------|
| `/` | `Tezgahlar` (redirect) | Ana sayfa → Tezgahlar |
| `/tezgahlar` | `Tezgahlar` | Tezgah/makine yönetimi |
| `/is-emirleri` | `IsEmirleri` | İş emri yönetimi |
| `/is-emri-taslaklari/:oturumId` | `IsEmriTaslaklariYonetimi` | İş emri taslakları |
| `/parcalar` | `Parcalar` | Parça katalog |
| `/parcalar/:parcaKodu` | `ParcaDetay` | Parça detayları |
| `/stok-kartlari` | `StokKartlari` | Stok kartları |
| `/boms` | `Boms` | BOM yönetimi |
| `/gruplar` | `Gruplar` | Grup/Assembly yönetimi |
| `/uretim-plani` | `UretimPlani` | Ana üretim planı |
| `/uretim-plani/ekle` | `UretimPlani` | Yeni üretim planı |
| `/uretim-plani/karma` | `KarmaUretimPlaniForm` | Karma üretim planı |
| `/uretim-plani/duzenle/:id` | `UretimPlani` | Plan düzenleme |
| `/uretim-plani/makina-analiz` | `MakinaGroupPartsPage` | Makina analizi |
| `/tezgah-is-plani` | `TezgahIsPlanı` | Tezgah iş planı |
| `/uretim-panosu` | `UretimPanosu` | Üretim panosu (Kanban) |
| `/fason` | `Fason` | Fason yönetimi |
| `/fason-gruplar` | `FasonGruplar` | Fason grupları |
| `/teklifler` | `Teklifler` | Teklif yönetimi |
| `/makinalar` | `Makinalar` | Makina yönetimi |
| `/ariza-bakim` | `ArizaBakimListesi` | Arıza/bakım listesi |
| `/ariza-bakim/ekle` | `ArizaBakimEkle` | Yeni arıza/bakım kaydı |
| `/ariza-bakim/:id` | `ArizaBakimDetay` | Arıza/bakım detayı |
| `/sevkiyat` | `Sevkiyat` | Sevkiyat yönetimi |
| `/sevkiyat/toplu-yeni/:sevkiyatId` | `TopluSevkiyatForm` | Toplu sevkiyat |
| `/ic-sevkiyatlar` | `IcSevkiyatlar` | İç sevkiyatlar |
| `/tedarik` | `TedarikTalepListesi` | Tedarik talepleri |
| `/tedarik/firma-yonetimi` | `FirmaYonetimPage` | Firma yönetimi |
| `/notlar` | `NotlarPage` | Not yönetimi |
| `/raporlar/*` | `Raporlar` | Raporlar (nested routes) |
| `/makindex` | `MakindexPage` | Makindex sistemi |
| `/yonetimsel` | `Yonetimsel` | Yönetimsel işlemler |

### Mobil Rotaları

| Route | Bileşen | Açıklama |
|-------|---------|----------|
| `/mobile` | `TezgahlarMobile` (redirect) | Mobil ana sayfa |
| `/mobile/tezgahlar` | `TezgahlarMobile` | Mobil tezgahlar |
| `/mobile/is-emirleri` | `IsEmirleriMobileYeni` | Mobil iş emirleri |
| `/mobile/uretim-plani` | `UretimPlaniMobile` | Mobil üretim planı |
| `/mobile/uretim-plani/ekle` | `UretimPlaniEkleMobile` | Mobil plan ekleme |
| `/mobile/uretim-plani/duzenle/:id` | `UretimPlaniDuzenleMobile` | Mobil plan düzenleme |
| `/mobile/uretim-plani/detay/:id` | `UretimPlaniDetayMobile` | Mobil plan detay |
| `/mobile/parcalar` | `ParcalarMobile` | Mobil parçalar |
| `/mobile/parcalar/:parcaKodu` | `ParcaDetayMobile` | Mobil parça detay |
| `/mobile/stok-kartlari` | `StokKartlariMobile` | Mobil stok kartları |
| `/mobile/gruplar` | `GruplarMobile` | Mobil gruplar |
| `/mobile/gruplar/ekle` | `GrupFormMobile` | Mobil grup ekleme |
| `/mobile/gruplar/duzenle/:id` | `GrupFormMobile` | Mobil grup düzenleme |
| `/mobile/gruplar/:id` | `GrupDetayMobile` | Mobil grup detay |
| `/mobile/ariza-bakim` | `ArizaBakimMobile` | Mobil arıza/bakım |
| `/mobile/ariza-bakim/:id` | `ArizaBakimDetayMobile` | Mobil arıza/bakım detay |
| `/mobile/sevkiyat` | `SevkiyatListesiMobile` | Mobil sevkiyat |
| `/mobile/ic-sevkiyatlar` | `IcSevkiyatlarMobile` | Mobil iç sevkiyat |
| `/mobile/makindex` | `MakindexPageMobile` | Mobil Makindex |
| `/mobile/notlar` | `NotlarPage` | Mobil notlar |

---

## Temel Bileşenler

### Layout Bileşenleri

**Layout (Desktop)**
- Sidebar navigasyon
- Header ile kullanıcı bilgileri
- Main content area
- Responsive tasarım

**MobileLayout**
- Bottom navigation bar
- Touch-optimized arayüz
- Swipe gestures desteği
- Compact header

### Custom Hooks

| Hook | Açıklama |
|------|----------|
| `useDeviceDetect` | Cihaz algılama (mobile/desktop) |
| `useIsEmirleri` | İş emri verileri ve işlemleri |
| `useTezgahlar` | Tezgah verileri ve durumları |
| `useParcalar` | Parça verileri ve BOM |
| `useSocket` | Socket.IO bağlantısı yönetimi |
| `useLocalStorage` | LocalStorage persistence |
| `usePagination` | Sayfalama mantığı |
| `useFilter` | Filtreleme mantığı |

### Önemli Bileşenler

**DizinTarama**
- CAD dosya tarama ve analiz arayüzü
- Parça bazlı gruplandırma
- Toplu parça kaydetme
- İstatistik gösterge paneli
- Dizin tarayıcı (network drive desteği)

**WorkstationScheduler**
- Tezgah iş planı zaman çizelgesi
- Drag & Drop iş emri atama
- Kaynak kapasite görüntüleme
- Çakışma kontrolü

**MakindexPage**
- Hiyerarşik BOM görüntüleme
- Parça ağacı yapısı
- Malzeme listesi yönetimi
- Maliyet hesaplama

---

## API Servisleri

### Axios API Client

```javascript
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response.data,
  error => {
    // Hata yönetimi
    return Promise.reject(error);
  }
);
```

### Socket.IO Servisi

```javascript
// frontend/src/services/socketService.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Event listeners
socket.on('connect', () => {
  console.log('Socket bağlantısı kuruldu');
});

socket.on('is-emri-updated', (data) => {
  // İş emri güncellendi
});

socket.on('tezgah-durum-changed', (data) => {
  // Tezgah durumu değişti
});

export default socket;
```

---

## Tema Yapılandırması

### Desktop Tema

```javascript
// frontend/src/theme.js
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
```

### Mobil Tema

```javascript
// frontend/src/theme.mobile.js
import { createTheme } from '@mui/material/styles';

const mobileTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  typography: {
    fontSize: 14, // Daha küçük font
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48, // Dokunma alanı
        },
      },
    },
  },
});
```

---

## Responsive Tasarım

### Breakpoints

```javascript
{
  xs: 0,    // Mobil
  sm: 600,  // Tablet
  md: 900,  // Laptop
  lg: 1200, // Desktop
  xl: 1536  // Large Desktop
}
```

### Cihaz Algılama

```javascript
// frontend/src/hooks/useDeviceDetect.js
const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};
```

---

## Form Yönetimi

### Formik + Yup

```javascript
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  parca_kodu: Yup.string().required('Parça kodu gereklidir'),
  miktar: Yup.number().required('Miktar gereklidir').min(1),
});

const MyForm = () => (
  <Formik
    initialValues={{ parca_kodu: '', miktar: 1 }}
    validationSchema={validationSchema}
    onSubmit={(values) => {
      // Form submit
    }}
  >
    <Form>
      <Field name="parca_kodu" />
      <ErrorMessage name="parca_kodu" />
      <button type="submit">Kaydet</button>
    </Form>
  </Formik>
);
```

---

## State Management Patterns

### Redux Thunk (Async Actions)

```javascript
// Async thunk
export const fetchIsEmirleri = createAsyncThunk(
  'isEmirleri/fetchIsEmirleri',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/is-emirleri', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Slice
const isEmirleriSlice = createSlice({
  name: 'isEmirleri',
  initialState: { data: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIsEmirleri.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIsEmirleri.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchIsEmirleri.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});
```

---

## Performans Optimizasyonları

### Code Splitting

```javascript
import { lazy, Suspense } from 'react';

const Raporlar = lazy(() => import('./pages/Raporlar'));

function App() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <Raporlar />
    </Suspense>
  );
}
```

### Memoization

```javascript
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Pahalı render işlemi
  return <div>{/* ... */}</div>;
});
```

### Virtual Scrolling

Uzun listeler için virtual scrolling kullanılır:
- `react-window` veya `react-virtualized` kütüphaneleri
- Sadece görünür öğelerin render edilmesi

---

## Hata Yönetimi

### Error Boundaries

```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Bir hata oluştu.</h1>;
    }
    return this.props.children;
  }
}
```

### Global Error Handler

```javascript
// Axios interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Unauthorized - Login sayfasına yönlendir
    } else if (error.response?.status === 500) {
      // Sunucu hatası
    }
    return Promise.reject(error);
  }
);
```

---

## Testing

### Vitest Konfigürasyonu

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

### Component Test

```javascript
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import Tezgahlar from './pages/Tezgahlar';

test('tezgahlar sayfası render edilir', () => {
  render(
    <Provider store={store}>
      <Tezgahlar />
    </Provider>
  );
  expect(screen.getByText('Tezgahlar')).toBeInTheDocument();
});
```

---

## Build ve Deployment

### Geliştirme

```bash
cd frontend
npm run dev
# Server: http://localhost:5173
```

### Production Build

```bash
npm run build
# Çıktı: dist/
```

### Preview

```bash
npm run preview
# Production build önizleme
```

---

**Son Güncelleme**: 2026-01-07
**Versiyon**: v14.26
