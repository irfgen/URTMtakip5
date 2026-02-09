# ÜRTM Takip Sistemi - Frontend Component Dokümantasyonu

## 🎨 Frontend Genel Bakış

ÜRTM Takip Sistemi frontend'i **React 18.2.0** ve **Material-UI 5.17.1** kullanılarak geliştirilmiştir. Sistem responsive tasarıma sahiptir ve mobil/masaüstü ayrımı yapabilmektedir.

### 🔧 Teknoloji Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.6
- **UI Library**: Material-UI (MUI) 5.17.1
- **State Management**: Redux Toolkit 2.0.1
- **Routing**: React Router DOM 6.20.1
- **Styling**: Material-UI + Custom Themes
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

### 📊 Component İstatistikleri

- **Toplam Component**: 255+ dosya
- **Page Components**: 50+ sayfa
- **Reusable Components**: 150+ bileşen
- **Mobile Components**: 30+ mobil özel bileşen
- **Custom Hooks**: 10+ hook
- **Code Lines**: ~88,000 satır

---

## 🗂️ Proje Yapısı

```
frontend/src/
├── components/          # Reusable bileşenler
│   ├── Layout.jsx      # Ana layout
│   ├── MobileLayout.jsx # Mobil layout
│   ├── Notlar/         # Not modülü bileşenleri
│   ├── UretimPlani/    # Üretim planı bileşenleri
│   ├── makindex/       # Makindex modülü
│   ├── WorkstationScheduler/ # Tezgah planlama
│   └── ...
├── pages/              # Sayfa bileşenleri
│   ├── Dashboard.jsx
│   ├── Tezgahlar.jsx
│   ├── IsEmirleri.jsx
│   ├── mobile/         # Mobil sayfalar
│   └── ...
├── hooks/              # Custom React hooks
├── store/              # Redux store
├── services/           # API servisleri
├── utils/              # Utility fonksiyonları
└── styles/             # Stil dosyaları
```

---

## 🏗️ Core Components

### 1. Layout Components

#### Layout.jsx
**Açıklama**: Ana desktop layout bileşeni
**Özellikler**:
- Material-UI AppBar ve Drawer
- Navigasyon menüsü
- Responsive tasarım
- Route-based active state

**Props**: `children`

**Kullanım**:
```jsx
<Layout>
  <App />
</Layout>
```

#### MobileLayout.jsx
**Açıklama**: Mobil layout bileşeni
**Özellikler**:
- Bottom navigation
- Touch-optimized interface
- Swipe gestures
- Compact menu

**Props**: `children`

---

### 2. Navigation Components

#### ViewSwitcher.jsx
**Açıklama**: Desktop/Mobil görünüm değiştirici
**Özellikler**:
- Device detection
- Theme switching
- View mode toggle

#### Navigation Menu
**Ana Menü Öğeleri**:
- Tezgahlar (`/tezgahlar`)
- İş Emirleri (`/is-emirleri`)
- Parçalar & Stok (`/parcalar`)
- Stok Kartları (`/stok-kartlari`)
- Import-Export (`/import-export`)
- Ürün Ağaçları (BOM) (`/boms`)
- Makinalar (`/makinalar`)
- Üretim Planı (`/uretim-plani`)
- Tezgah İş Planı (`/tezgah-is-plani`)
- Arıza ve Bakım (`/ariza-bakim`)
- Sevkiyat (`/sevkiyat`)
- Notlar (`/notlar`)
- Raporlar (`/raporlar`)
- MAKINDEX (`/makindex`)
- Dizin Tarama (`/dizin-tarama`)
- Yönetim (`/yonetimsel`)

---

## 📱 Page Components

### 1. Dashboard Pages

#### Dashboard.jsx
**Açıklama**: Ana dashboard sayfası
**Features**:
- Key metrics display
- Quick actions
- Recent activities
- Performance charts

#### DashboardMobile.jsx
**Açıklama**: Mobil dashboard
**Features**:
- Compact layout
- Touch-optimized cards
- Swipe navigation

### 2. Tezgahlar (Workstations)

#### Tezgahlar.jsx / TezgahlarMobile.jsx
**Açıklama**: Tezgah yönetimi sayfası
**State Management**:
```jsx
// Redux slice example
const tezgahlarSlice = createSlice({
  name: 'tezgahlar',
  initialState: {
    tezgahlar: [],
    loading: false,
    error: null
  },
  reducers: {
    setTezgahlar: (state, action) => {
      state.tezgahlar = action.payload;
    }
  }
});
```

**Features**:
- Tezgah listesi
- Durum göstergeleri
- Real-time updates
- Filtreleme ve arama

### 3. İş Emirleri (Work Orders)

#### IsEmirleri.jsx / IsEmirleriMobileYeni.jsx
**Açıklama**: İş emri yönetimi
**Features**:
- İş emri listesi
- Drag & drop sıralama
- Status management
- Batch operations
- Filter by status/workstation

**Key Components**:
```jsx
// İş emri kartı
<IsEmriKarti
  isEmri={isEmri}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
/>

// Sürükle-bırak
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="is-emirleri">
    {(provided) => (
      <div {...provided.droppableProps} ref={provided.innerRef}>
        {/* İş emirleri listesi */}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

### 4. Üretim Planı (Production Planning)

#### UretimPlani.jsx / UretimPlaniMobile.jsx
**Açıklama**: Üretim planlama arayüzü
**Features**:
- Excel import/export
- Plan oluşturma
- Makina atama
- Critical stock analysis
- Timeline view

**Sub-components**:
- `KarmaUretimPlaniForm.jsx`
- `MakinaGroupPartsPage.jsx`
- `UretimPlaniEkleMobile.jsx`
- `UretimPlaniDuzenleMobile.jsx`

### 5. Parçalar ve Stok (Parts & Inventory)

#### Parcalar.jsx / ParcalarMobile.jsx
**Açıklama**: Parça yönetimi
**Features**:
- Parça kartları
- Teknik resimler
- Stok durumu
- Filtreleme

#### ParcaDetay.jsx / ParcaDetayMobile.jsx
**Açıklama**: Parça detay sayfası
**Features**:
- Parça bilgileri
- BOM ilişkileri
- Stok geçmişi
- Teknik resim viewer

### 6. Stok Kartları (Inventory Cards)

#### StokKartlari.jsx / StokKartlariMobile.jsx
**Açıklama**: Stok kartı yönetimi
**Features**:
- Stok kartı listesi
- Stok hareketleri
- Minimum/maximum seviyeler
- Critical stock alerts

### 7. BOM Yönetimi (Bill of Materials)

#### Boms.jsx
**Açıklama**: BOM yönetimi arayüzü
**Features**:
- Hiyerarşik yapı
- Parça ilişkileri
- Cost analysis
- Export functionality

### 8. Arıza ve Bakım (Maintenance)

#### ArizaBakimListesi.jsx / ArizaBakimMobile.jsx
**Açıklama**: Arıza kayıtları listesi
**Features**:
- Arıza kayıtları
- Bakım planları
- Durum takibi
- Raporlama

**Sub-components**:
- `ArizaBakimEkle.jsx`
- `ArizaBakimDetay.jsx`
- `ArizaBakimDetayMobile.jsx`

### 9. Sevkiyat (Shipping)

#### Sevkiyat.jsx / SevkiyatListesiMobile.jsx
**Açıklama**: Sevkiyat yönetimi
**Features**:
- Sevkiyat listesi
- Resim ekleme
- Toplu sevkiyat
- İç sevkiyatlar

**Sub-components**:
- `TopluSevkiyatForm.jsx`
- `IcSevkiyatlar.jsx`
- `IcSevkiyatlarMobile.jsx`

### 10. Notlar (Notes)

#### NotlarPage.jsx
**Açıklama**: Not yönetimi sistemi
**Features**:
- Not ekleme/düzenleme
- Kategoriler
- Etiketleme
- Arama ve filtreleme

**Sub-components**:
- `NotKarti.jsx`
- `NotDuzenle.jsx`
- `NotlarListesi.jsx`
- `KategoriYonetimi.jsx`
- `FiltrePaneli.jsx`

---

## 🎯 Specialized Components

### 1. Makindex Module

#### MakindexPage.jsx / MakindexPageMobile.jsx
**Açıklama**: Hiyerarşik parça sistemi
**Location**: `frontend/src/components/makindex/`

**Features**:
- Sınıf yönetimi
- Hiyerarşik BOM
- Stok entegrasyonu
- Real-time updates

### 2. Workstation Scheduler

#### WorkstationScheduler.jsx
**Açıklama**: Tezgah iş planlama
**Location**: `frontend/src/components/WorkstationScheduler/`

**Features**:
- Gantt chart view
- Drag & drop scheduling
- Resource allocation
- Timeline management

### 3. Dizin Tarama (Directory Scanner)

#### DizinTarama.jsx
**Açıklama**: Dizin tarama arayüzü
**Features**:
- File scanning
- Import functionality
- Progress tracking
- Error handling

### 4. Import-Export

#### ImportExport.jsx
**Açıklama**: Veri içe/dışa aktarma
**Features**:
- Excel import/export
- Data validation
- Mapping configuration
- Bulk operations

---

## 🎨 Theming System

### Theme Configuration

#### theme.js (Desktop)
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
```

#### theme.mobile.js (Mobile)
```javascript
const mobileTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  typography: {
    fontSize: 14, // Smaller font for mobile
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48, // Touch-friendly
        },
      },
    },
  },
});
```

### Theme Provider Usage
```jsx
<ThemeProvider theme={isMobile ? mobileTheme : theme}>
  <CssBaseline />
  <App />
</ThemeProvider>
```

---

## 🔄 State Management

### Redux Toolkit Setup

#### Store Configuration
```javascript
import { configureStore } from '@reduxjs/toolkit';
import tezgahlarSlice from './slices/tezgahlarSlice';
import isEmirleriSlice from './slices/isEmirleriSlice';

export const store = configureStore({
  reducer: {
    tezgahlar: tezgahlarSlice,
    isEmirleri: isEmirleriSlice,
    // ... other slices
  },
});
```

#### Example Slice
```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTezgahlar = createAsyncThunk(
  'tezgahlar/fetchTezgahlar',
  async () => {
    const response = await api.get('/api/tezgahlar');
    return response.data;
  }
);

const tezgahlarSlice = createSlice({
  name: 'tezgahlar',
  initialState: {
    tezgahlar: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTezgahlar.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTezgahlar.fulfilled, (state, action) => {
        state.loading = false;
        state.tezgahlar = action.payload;
      })
      .addCase(fetchTezgahlar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});
```

---

## 📱 Mobile Optimization

### Device Detection Hook

#### useDeviceDetect.js
```javascript
import { useState, useEffect } from 'react';

const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile };
};

export default useDeviceDetect;
```

### Mobile Route Configuration
```jsx
// App.jsx mobile routes
{isMobile ? (
  <MobileLayout>
    <Routes>
      <Route path="/mobile/tezgahlar" element={<TezgahlarMobile />} />
      <Route path="/mobile/is-emirleri" element={<IsEmirleriMobileYeni />} />
      <Route path="/mobile/uretim-plani" element={<UretimPlaniMobile />} />
      {/* ... other mobile routes */}
    </Routes>
  </MobileLayout>
) : (
  <Layout>
    {/* Desktop routes */}
  </Layout>
)}
```

---

## 🔧 Custom Hooks

### Common Custom Hooks

#### useDeviceDetect
Device detection ve responsive design

#### useApi
API çağrıları için custom hook
```javascript
const useApi = (url, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(url);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};
```

#### useSocket
Socket.IO connection management
```javascript
const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return { socket, connected };
};
```

---

## 🎯 Component Patterns

### 1. Data Fetching Pattern
```jsx
const Component = () => {
  const { data, loading, error } = useApi('/api/resource');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

### 2. Form Pattern
```jsx
const FormComponent = () => {
  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/resource', formData);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### 3. Real-time Update Pattern
```jsx
const RealTimeComponent = () => {
  const { socket } = useSocket();
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (socket) {
      socket.on('data-updated', (newData) => {
        setData(newData);
      });
    }
  }, [socket]);

  return (
    <div>
      {/* Real-time updated content */}
    </div>
  );
};
```

---

## 📊 Performance Optimization

### 1. Code Splitting
```jsx
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComponent />
  </Suspense>
);
```

### 2. Memoization
```jsx
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item));
  }, [data]);

  const handleUpdate = useCallback((id) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <div>
      {/* Component content */}
    </div>
  );
});
```

### 3. Virtual Scrolling
```jsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index]}
      </div>
    )}
  </List>
);
```

---

## 🔄 Real-time Features

### Socket.IO Integration
```javascript
// Socket context
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Usage in component
const Component = () => {
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (socket) {
      socket.on('is-emri-updated', handleUpdate);
      return () => socket.off('is-emri-updated', handleUpdate);
    }
  }, [socket]);

  // Component logic
};
```

---

## 📱 Responsive Design

### Breakpoints
```javascript
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

// Usage in components
<Grid container spacing={2}>
  <Grid item xs={12} md={6} lg={4}>
    {/* Responsive content */}
  </Grid>
</Grid>
```

### Mobile-First Design
```jsx
const ResponsiveComponent = () => {
  return (
    <Box>
      <Typography variant="h6" sx={{
        fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
      }}>
        Responsive Typography
      </Typography>

      <Button
        fullWidth
        sx={{
          display: { xs: 'block', md: 'none' }
        }}
      >
        Mobile Button
      </Button>
    </Box>
  );
};
```

---

## 🎯 Best Practices

### 1. Component Organization
- Keep components small and focused
- Use descriptive naming
- Separate concerns (UI vs logic)
- Reusable component design

### 2. State Management
- Use local state for UI-specific data
- Use Redux for global/shared state
- Implement proper loading and error states
- Use React Query for server state

### 3. Performance
- Implement lazy loading
- Use React.memo for expensive components
- Optimize re-renders with useMemo/useCallback
- Monitor bundle size

### 4. Accessibility
- Use semantic HTML
- Implement ARIA labels
- Keyboard navigation support
- Screen reader compatibility

### 5. Error Handling
- Implement error boundaries
- Show user-friendly error messages
- Log errors for debugging
- Provide retry mechanisms

---

## 🔧 Development Tools

### 1. Environment Variables
```javascript
// .env file
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

### 2. Build Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
});
```

### 3. Testing Setup
```javascript
// test setup
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';

const AllTheProviders = ({ children }) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });
```

---

## 📚 Useful Resources

### Documentation Links
- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Router Documentation](https://reactrouter.com/)

### Component Libraries
- Material-UI Icons
- React Hook Form
- React DnD
- Chart.js with react-chartjs-2

### Development Tools
- React Developer Tools
- Redux DevTools
- Vite DevTools
- ESLint + Prettier

---

*Bu dokümantasyon ÜRTM Takip Sistemi frontend'inin güncel durumunu yansıtmaktadır. Son güncelleme: 2024-11-02*