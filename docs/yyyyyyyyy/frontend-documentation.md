# ÜRTM Takip Frontend Dokümantasyonu

## Frontend Mimarisi

ÜRTM Takip frontend sistemi, React ve Vite tabanlı, responsive tasarım özellikli modern bir web uygulamasıdır.

### Teknik Altyapı

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.6
- **UI Library**: Material-UI (MUI) 5.17.1
- **State Management**: Redux Toolkit 2.0.1
- **Routing**: React Router 6.20.1
- **HTTP Client**: Axios 1.6.2
- **Real-time**: Socket.IO Client
- **Development Port**: 5173 (sabit)
- **Production Port**: 3000 (backend ile aynı)

### Proje Yapısı

```
frontend/
├── src/
│   ├── components/           # Reusable components
│   │   ├── common/          # Genel bileşenler
│   │   ├── forms/           # Form bileşenleri
│   │   ├── tables/          # Tablo bileşenleri
│   │   ├── charts/          # Grafik bileşenleri
│   │   └── mobile/          # Mobil bileşenler
│   ├── pages/               # Sayfa bileşenleri
│   │   ├── dashboard/       # Dashboard sayfaları
│   │   ├── modules/         # Modül sayfaları
│   │   └── mobile/          # Mobil sayfalar (32+)
│   ├── store/               # Redux store
│   │   ├── slices/          # Redux slices
│   │   └── api/             # RTK Query API
│   ├── services/            # API servisleri
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Yardımcı fonksiyonlar
│   ├── styles/              # Stil dosyaları
│   ├── contexts/            # React contexts
│   └── App.jsx              # Ana uygulama
├── public/
│   └── uploads/             # Statik dosyalar
├── package.json
└── vite.config.js
```

## Ana Bileşenler

### 1. Ana Layout ve Navigation

**App.jsx**
- Ana routing yapılandırması
- Theme provider (MUI)
- Socket.IO client bağlantısı
- Device detection

**Navigation Components**
- `AppBarComponent` - Üst navigasyon bar
- `SidebarComponent` - Yan menü
- `MobileNavigation` - Mobil navigasyon

### 2. Dashboard Components

**MainDashboard.jsx**
- Ana kontrol paneli
- Real-time veri widget'ları
- KPI göstergeleri
- Quick action butonları

**Dashboard Features**
- İş emri durumları
- Tezgah durumu göstergeleri
- Üretim istatistikleri
- Kritik stok uyarıları

### 3. İş Emri Yönetimi

**IsEmirleriListesi.jsx**
- İş emri listeleme ve filtreleme
- Durum bazlı renklendirme
- Toplu işlem desteği
- Excel export

**IsEmriDetay.jsx**
- İş emri detay görüntüleme
- Operasyon takibi
- Belge yönetimi
- Durum güncelleme

### 4. Üretim Planlama

**UretimPlaniV2.jsx**
- Basitleştirilmiş üretim planı
- Sürükle-bırak iş emri yönetimi
- JSON tabanlı veri yapısı

**UretimPlaniV2Detay.jsx**
- Plan detayları
- İş emri atama
- BOM analizi
- Kritik stok kontrolü

### 5. Parça ve BOM Yönetimi

**ParcalarPage.jsx**
- Parça katalog görüntüleme
- Teknik çizim yönetimi
- Arama ve filtreleme
- Stok durumu entegrasyonu

**BomYonetimi.jsx**
- BOM hiyerarşi yönetimi
- Malzeme listesi düzenleme
- Maliyet hesaplamaları
- Versiyon kontrolü

### 6. Tezgah ve Operasyon

**MakinalarPage.jsx**
- Tezgah/makine yönetimi
- Durum takibi
- ESP32 entegrasyonu
- Performans grafikleri

**TezgahDetay.jsx**
- Tezgah detay bilgileri
- İşlem geçmişi
- Bakım kayıtları
- Real-time durum

### 7. Mobil Bileşenler

**Mobile Specific Components**
- `mobile/Dashboard.jsx` - Mobil ana ekran
- `mobile/IsEmirleriListesi.jsx` - Mobil iş emirleri
- `mobile/Makinalar.jsx` - Mobil makine durumu
- `mobile/SevkiyatOnay.jsx` - Mobil sevkiyat onayı

**Mobile Features**
- Touch-optimized UI
- Swipe gestures
- Offline mod desteği
- Push notifications

## State Management

### Redux Toolkit Store

```javascript
// store/index.js
export const store = configureStore({
  reducer: {
    // UI State
    ui: uiSlice,
    theme: themeSlice,
    navigation: navigationSlice,

    // Business Logic
    isEmirleri: isEmirleriSlice,
    parcalar: parcalarSlice,
    tezgahlar: tezgahlarSlice,
    uretimPlanlari: uretimPlanlariSlice,

    // RTK Query
    api: apiSlice,

    // Real-time
    socket: socketSlice,
    notifications: notificationsSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware)
});
```

### Ana Slices

**isEmirleriSlice.js**
```javascript
const isEmirleriSlice = createSlice({
  name: 'isEmirleri',
  initialState: {
    data: [],
    loading: false,
    error: null,
    filters: {
      durum: 'all',
      tezgahId: 'all',
      tarihAraligi: null
    }
  },
  reducers: {
    setIsEmirleri: (state, action) => {
      state.data = action.payload;
    },
    updateIsEmriDurum: (state, action) => {
      const { id, durum } = action.payload;
      const isEmri = state.data.find(item => item.id === id);
      if (isEmri) {
        isEmri.durum = durum;
      }
    }
  }
});
```

### RTK Query API

```javascript
// store/api/urunApi.js
export const urtmApi = createApi({
  reducerPath: 'urtmApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    }
  }),
  tagTypes: ['IsEmri', 'Parca', 'Tezgah', 'UretimPlani'],
  endpoints: (builder) => ({
    getIsEmirleri: builder.query({
      query: (params) => ({
        url: '/is-emirleri',
        params
      }),
      providesTags: ['IsEmri']
    }),
    createIsEmri: builder.mutation({
      query: (data) => ({
        url: '/is-emirleri',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['IsEmri']
    })
  })
});
```

## Custom Hooks

### useDeviceDetect
```javascript
// hooks/useDeviceDetect.js
export const useDeviceDetect = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
};
```

### useSocketIO
```javascript
// hooks/useSocketIO.js
export const useSocketIO = () => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const newSocket = io('http://localhost:3000');

    newSocket.on('tezgahDurumGuncelle', (data) => {
      dispatch(updateTezgahDurum(data));
    });

    newSocket.on('isEmriDurumGuncelle', (data) => {
      dispatch(updateIsEmriDurum(data));
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [dispatch]);

  return socket;
};
```

## Material-UI Theme

### Temel Theme (theme.js)
```javascript
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: {
      main: '#dc004e'
    },
    success: {
      main: '#2e7d32'
    },
    warning: {
      main: '#ed6c02'
    },
    error: {
      main: '#d32f2f'
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12
        }
      }
    }
  }
});
```

### Mobil Theme (theme.mobile.js)
```javascript
export const mobileTheme = createTheme(theme, {
  typography: {
    h1: {
      fontSize: '2rem'
    },
    h2: {
      fontSize: '1.75rem'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          padding: '12px 24px'
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          minHeight: 56
        }
      }
    }
  }
});
```

## Routing Yapısı

### Ana Router
```javascript
// App.jsx
function App() {
  const { isMobile } = useDeviceDetect();

  return (
    <ThemeProvider theme={isMobile ? mobileTheme : theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Desktop Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="is-emirleri" element={<IsEmirleriListesi />} />
            <Route path="is-emirleri/:id" element={<IsEmriDetay />} />
            <Route path="uretim-planlari" element={<UretimPlaniV2 />} />
            <Route path="uretim-planlari/:id" element={<UretimPlaniV2Detay />} />
            {/* ... diğer desktop rotalar */}
          </Route>

          {/* Mobile Routes */}
          <Route path="/mobile" element={<MobileLayout />}>
            <Route index element={<Navigate to="/mobile/dashboard" replace />} />
            <Route path="dashboard" element={<MobileDashboard />} />
            <Route path="is-emirleri" element={<MobileIsEmirleri />} />
            {/* ... diğer mobil rotalar */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

## API Servisleri

### ApiClient.js
```javascript
// services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Module Services
```javascript
// services/isEmirleriService.js
import apiClient from './apiClient';

export const isEmirleriService = {
  getAll: (params) => apiClient.get('/is-emirleri', { params }),
  getById: (id) => apiClient.get(`/is-emirleri/${id}`),
  create: (data) => apiClient.post('/is-emirleri', data),
  update: (id, data) => apiClient.put(`/is-emirleri/${id}`, data),
  delete: (id) => apiClient.delete(`/is-emirleri/${id}`),
  updateDurum: (id, durum) => apiClient.patch(`/is-emirleri/${id}/durum`, { durum }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/is-emirleri/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
```

## Component Patterns

### Reusable Data Table
```javascript
// components/tables/DataTable.jsx
const DataTable = ({
  data,
  columns,
  loading,
  pagination,
  onRowClick,
  actions
}) => {
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
              {actions && <TableCell>İşlemler</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                  <LinearProgress />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  hover
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align}>
                      {column.renderCell ? column.renderCell(row) : row[column.id]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.rowsPerPage}
          page={pagination.page}
          onPageChange={pagination.onPageChange}
          onRowsPerPageChange={pagination.onRowsPerPageChange}
        />
      )}
    </Paper>
  );
};
```

### Form Component
```javascript
// components/forms/IsEmriForm.jsx
const IsEmriForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState({});

  const validationSchema = Yup.object({
    siparisNo: Yup.string().required('Sipariş no gereklidir'),
    parcaId: Yup.string().required('Parça seçimi gereklidir'),
    tezgahId: Yup.number().required('Tezgah seçimi gereklidir'),
    miktar: Yup.number().min(1, 'Miktar en az 1 olmalı').required('Miktar gereklidir'),
    terminTarihi: Yup.date().required('Termin tarihi gereklidir')
  });

  const handleSubmit = async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
    }
  };

  return (
    <Formik
      initialValues={formData}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
        <Form>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sipariş No"
                name="siparisNo"
                value={values.siparisNo}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.siparisNo && Boolean(errors.siparisNo)}
                helperText={touched.siparisNo && errors.siparisNo}
              />
            </Grid>
            {/* ... diğer form alanları */}
          </Grid>

          <DialogActions sx={{ mt: 2 }}>
            <Button onClick={onCancel}>
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Form>
      )}
    </Formik>
  );
};
```

## Performance Optimizasyonları

### Code Splitting
```javascript
// Lazy loading for routes
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const IsEmirleriListesi = lazy(() => import('../pages/modules/IsEmirleriListesi'));
const UretimPlaniV2 = lazy(() => import('../pages/modules/UretimPlaniV2'));

// Usage with Suspense
<Suspense fallback={<CircularProgress />}>
  <Route path="dashboard" element={<Dashboard />} />
</Suspense>
```

### Memoization
```javascript
// Memoizing expensive calculations
const filteredData = useMemo(() => {
  return data.filter(item => {
    if (filters.durum !== 'all' && item.durum !== filters.durum) return false;
    if (filters.tezgahId !== 'all' && item.tezgahId !== filters.tezgahId) return false;
    if (filters.tarihAraligi && !isDateInRange(item.createdAt, filters.tarihAraligi)) return false;
    return true;
  });
}, [data, filters]);

// Memoizing event handlers
const handleRowClick = useCallback((row) => {
  navigate(`/is-emirleri/${row.id}`);
}, [navigate]);
```

### Virtual Scrolling
```javascript
// Using @mui/x-data-grid for large datasets
<DataGrid
  rows={data}
  columns={columns}
  pageSize={25}
  rowsPerPageOptions={[25, 50, 100]}
  checkboxSelection
  disableSelectionOnClick
  loading={loading}
  pagination
  sorting
  filtering
/>
```

## Testing

### Vitest Configuration
```javascript
// vite.config.js
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true
  }
});
```

### Component Test Example
```javascript
// components/IsEmirlerİListesi.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import IsEmirleriListesi from '../pages/modules/IsEmirleriListesi';

const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      isEmirleri: (state = initialState.isEmirleri) => state,
      ui: (state = initialState.ui) => state
    }
  });
};

describe('IsEmirleriListesi', () => {
  const mockStore = createMockStore({
    isEmirleri: {
      data: [
        { id: '1', siparisNo: 'SO-001', durum: 0 },
        { id: '2', siparisNo: 'SO-002', durum: 1 }
      ],
      loading: false
    },
    ui: {
      selectedItems: []
    }
  });

  test('renders iş emirleri listesi', () => {
    render(
      <Provider store={mockStore}>
        <IsEmirleriListesi />
      </Provider>
    );

    expect(screen.getByText('SO-001')).toBeInTheDocument();
    expect(screen.getByText('SO-002')).toBeInTheDocument();
  });

  test('handles row click', () => {
    render(
      <Provider store={mockStore}>
        <IsEmirleriListesi />
      </Provider>
    );

    const firstRow = screen.getByText('SO-001');
    fireEvent.click(firstRow);
  });
});
```

## Build ve Deployment

### Build Commands
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Build analysis
npm run build -- --analyze
```

### Vite Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          charts: ['chart.js', 'react-chartjs-2']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material']
  }
});
```

## Accessibility

### WCAG 2.1 Compliance

```javascript
// Semantic HTML and ARIA attributes
<button
  type="button"
  onClick={handleClick}
  aria-label="Düzenle"
  aria-describedby="edit-description"
>
  <EditIcon />
</button>

<div id="edit-description" className="sr-only">
  İş emrini düzenlemek için tıklayın
</div>

// Keyboard navigation
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
};
```

## Progressive Web App Features

### Service Worker Registration
```javascript
// service-worker-registration.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

## İleri Konular

### Internationalization (i18n)
```javascript
// i18n setup with react-i18next
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: {
        translation: {
          'isEmri': 'İş Emri',
          'parca': 'Parça',
          'tezgah': 'Tezgah'
        }
      },
      en: {
        translation: {
          'isEmri': 'Work Order',
          'parca': 'Part',
          'tezgah': 'Machine'
        }
      }
    },
    lng: 'tr',
    fallbackLng: 'en'
  });
```

### Offline Support
```javascript
// Using Workbox for offline caching
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Cache API responses
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        return `${request.url}?v=1`;
      }
    }]
  })
);
```

### Advanced State Management
```javascript
// Using Redux Persist for state persistence
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['ui', 'theme']
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer
});

export const persistor = persistStore(store);
```