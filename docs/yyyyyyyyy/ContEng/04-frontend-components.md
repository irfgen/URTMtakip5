# Frontend Components Documentation - ÜRTM Takip

## Overview

The ÜRTM Takip frontend is a sophisticated React 18 application featuring dual-layout architecture with automatic mobile/desktop adaptation, comprehensive state management, and Material-UI integration. The application provides a complete production tracking interface optimized for both desktop operators and mobile shop floor workers.

## Architecture Philosophy

### Dual-Layout Strategy
The application implements a unique dual-layout architecture that provides optimal user experience across device types:

- **Desktop Layout**: Full-featured interface with sidebar navigation, dense data tables, and multi-column layouts
- **Mobile Layout**: Touch-optimized interface with bottom navigation, single-column layouts, and gesture-friendly interactions
- **Automatic Detection**: Seamless switching based on device type, screen size, and user preference
- **URL-based Routing**: Separate route structures for mobile (`/mobile/*`) and desktop (`/*`) interfaces

## Core Application Structure

### 1. Application Entry Point

**File**: `frontend/src/App.jsx`

The main App component orchestrates the entire application:

```jsx
function App() {
  const { isMobile, isTablet } = useDeviceDetect();
  const theme = isMobile ? mobileTheme : desktopTheme;
  
  return (
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <Router>
          {isMobile ? <MobileRoutes /> : <DesktopRoutes />}
        </Router>
      </Provider>
    </ThemeProvider>
  );
}
```

**Key Features:**
- **Device Detection**: Uses `useDeviceDetect()` hook for responsive behavior
- **Theme Switching**: Applies device-appropriate Material-UI themes
- **State Management**: Redux Toolkit provider for global state
- **Routing Strategy**: Conditional routing based on device type

### 2. Device Detection System

**Hook**: `frontend/src/hooks/useDeviceDetect.js`

Advanced device detection with user preference override:

```javascript
export const useDeviceDetect = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });
  
  // Priority: User Override → URL Detection → Screen Size
  useEffect(() => {
    const userPreference = localStorage.getItem('deviceOverride');
    const isUrlMobile = window.location.pathname.startsWith('/mobile');
    const screenWidth = window.innerWidth;
    
    const finalIsMobile = userPreference === 'mobile' || 
                         isUrlMobile || 
                         (userPreference === null && screenWidth <= 768);
    
    setDeviceInfo({
      isMobile: finalIsMobile,
      isTablet: screenWidth > 768 && screenWidth <= 1024,
      isDesktop: !finalIsMobile
    });
  }, []);
  
  return deviceInfo;
};
```

**Manual Override Hook**: `frontend/src/hooks/useDeviceOverride.js`
- Allows users to manually switch between mobile/desktop views
- Persists user preference in localStorage
- Provides confirmation dialogs for layout switching

## Layout Components

### 3. Desktop Layout

**File**: `frontend/src/components/Layout.jsx`

**Structure:**
```jsx
const Layout = ({ children }) => (
  <Box sx={{ display: 'flex' }}>
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6">ÜRTM Takip</Typography>
        <ViewSwitcher />
      </Toolbar>
    </AppBar>
    
    <Drawer variant="permanent" sx={{ width: 180 }}>
      <List>
        {menuItems.map((item) => (
          <ListItemButton key={item.path} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
    
    <Box component="main" sx={{ flexGrow: 1, ml: '180px', mt: 8 }}>
      {children}
    </Box>
  </Box>
);
```

**Navigation Items:**
- Tezgahlar (Workstations) - `FactoryIcon`
- İş Emirleri (Work Orders) - `AssignmentIcon`
- Parçalar (Parts) - `CategoryIcon`
- Üretim Planı (Production Planning) - `ScheduleIcon`
- BOM Yönetimi (BOM Management) - `AccountTreeIcon`
- Stok Kartları (Stock Cards) - `InventoryIcon`
- Sevkiyat (Shipping) - `LocalShippingIcon`
- Fason (Subcontractor) - `BusinessIcon`
- Arıza-Bakım (Maintenance) - `BuildIcon`
- Raporlar (Reports) - `BarChartIcon`
- Notlar (Notes) - `NoteIcon`
- Yönetimsel (Administrative) - `SettingsIcon`

### 4. Mobile Layout

**File**: `frontend/src/components/MobileLayout.jsx`

**Structure:**
```jsx
const MobileLayout = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
    <AppBar position="fixed">
      <Toolbar variant="dense">
        <Typography variant="h6">ÜRTM Takip</Typography>
        <ViewSwitcher />
      </Toolbar>
    </AppBar>
    
    <Box sx={{ flexGrow: 1, mt: 7, mb: 7, overflow: 'auto' }}>
      {children}
    </Box>
    
    <BottomNavigation position="fixed" sx={{ bottom: 0 }}>
      {mobileMenuItems.map((item) => (
        <BottomNavigationAction
          key={item.path}
          label={item.text}
          icon={item.icon}
          component={Link}
          to={item.path}
        />
      ))}
    </BottomNavigation>
  </Box>
);
```

**Bottom Navigation Items:**
- Tezgahlar (Workstations)
- İş Emirleri (Work Orders)
- Parçalar (Parts)
- Üretim Planı (Production Planning)
- Sevkiyat (Shipping)
- Raporlar (Reports)

## Theme System

### 5. Desktop Theme

**File**: `frontend/src/theme.js`

```javascript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h6: { fontSize: '1.25rem' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' }
      }
    }
  }
});
```

### 6. Mobile Theme

**File**: `frontend/src/theme.mobile.js`

```javascript
const mobileTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h6: { fontSize: '1.1rem' }, // Smaller for mobile
    body1: { fontSize: '0.95rem' }, // Optimized for mobile reading
    button: { fontSize: '0.9rem' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Touch-friendly minimum
          textTransform: 'none'
        }
      }
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 56,
          borderTop: '1px solid #e0e0e0'
        }
      }
    }
  }
});
```

## Component Organization

### 7. Directory Structure

```
frontend/src/components/
├── Layout.jsx                    # Desktop layout
├── MobileLayout.jsx             # Mobile layout  
├── ViewSwitcher.jsx             # Layout switching component
├── ImageWithFallback.jsx        # Image loading with fallbacks
├── CameraCapture.jsx            # Camera integration
├── mobile/                      # Mobile-specific components
│   ├── FasonEkleMobile.jsx
│   ├── IsEmriFiltreleMobile.jsx
│   ├── MobilParcaSecici.jsx
│   ├── SevkiyatFormMobile.jsx
│   └── UretimPlaniKartiMobile.jsx
├── Notlar/                      # Notes module
│   ├── NotlarPage.jsx
│   ├── NotlarListesi.jsx
│   ├── FiltrePaneli.jsx
│   ├── NotKarti.jsx
│   ├── NotEkleme.jsx
│   ├── NotDuzenle.jsx
│   └── KategoriYonetimi.jsx
├── UretimPlani/                 # Production planning
│   ├── UretimPlaniListesi.jsx
│   ├── UretimPlaniForm.jsx
│   ├── UretimPlaniDetay.jsx
│   ├── ExcelUretimPlaniModal.jsx
│   ├── BomAnalyzeForm.jsx
│   ├── MakinaGroupPartsList.jsx
│   └── ParcaDetayModal.jsx
├── StokKartlari/               # Stock cards
│   └── StokKartiForm.jsx
├── VardiyaYonetimi/            # Shift management
│   ├── VardiyaYonetimiAna.jsx
│   ├── VardiyaListesi.jsx
│   ├── PersonelListesi.jsx
│   ├── VardiyaTakvimi.jsx
│   └── VardiyaRaporlari.jsx
└── Raporlar/                   # Reports
    ├── TezgahCalismaTablosu.jsx
    └── VardiyaTezgahRaporu.jsx
```

### 8. Core Component Patterns

#### Work Order Components
- `IsEmriListesi.jsx` - Work order list with filtering
- `IsEmriKarti.jsx` - Individual work order card (desktop)
- `IsEmriKartiMobile.jsx` - Mobile work order card
- `IsEmriDuzenleForm.jsx` - Work order editing form
- `IsEmriKanbanBoard.jsx` - Kanban-style work order board

#### Part Management Components
- `ParcaListesi.jsx` - Parts catalog with search/filter
- `ParcaKarti.jsx` - Part information card
- `ParcaDuzenleForm.jsx` - Part editing form
- `ParcaSecici.jsx` - Part selection modal
- `ParcaPerformansDashboard.jsx` - Part performance analytics

#### Workstation Components
- `TezgahListesi.jsx` - Workstation grid layout
- `TezgahKarti.jsx` - Individual workstation card
- `TezgahDuzenleForm.jsx` - Workstation configuration
- `TezgahPerformansDashboard.jsx` - Workstation analytics

## State Management

### 9. Redux Toolkit Store

**File**: `frontend/src/store/index.js`

```javascript
import { configureStore } from '@reduxjs/toolkit';
import isEmirleriSlice from './slices/isEmirleriSlice';
import uretimPlaniSlice from './slices/uretimPlaniSlice';
import arizaBakimSlice from './slices/arizaBakimSlice';

export const store = configureStore({
  reducer: {
    isEmirleri: isEmirleriSlice,
    uretimPlani: uretimPlaniSlice,
    arizaBakim: arizaBakimSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
});
```

### 10. State Slices

#### Work Orders Slice
**File**: `frontend/src/store/slices/isEmirleriSlice.js`

```javascript
const isEmirleriSlice = createSlice({
  name: 'isEmirleri',
  initialState: {
    entities: {},
    loading: false,
    error: null,
    filters: {
      durum: 'all',
      tezgah: 'all',
      oncelik: 'all'
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateEntity: (state, action) => {
      const { id, updates } = action.payload;
      if (state.entities[id]) {
        state.entities[id] = { ...state.entities[id], ...updates };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIsEmirleri.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIsEmirleri.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload.entities;
        state.pagination.total = action.payload.total;
      });
  }
});
```

#### Production Planning Slice
**File**: `frontend/src/store/slices/uretimPlaniSlice.js`

```javascript
const uretimPlaniSlice = createSlice({
  name: 'uretimPlani',
  initialState: {
    plans: [],
    currentPlan: null,
    bomAnalysis: null,
    loading: false,
    error: null
  },
  reducers: {
    setCurrentPlan: (state, action) => {
      state.currentPlan = action.payload;
    },
    setBomAnalysis: (state, action) => {
      state.bomAnalysis = action.payload;
    },
    updatePlan: (state, action) => {
      const index = state.plans.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.plans[index] = action.payload;
      }
    }
  }
});
```

## API Integration

### 11. API Service Layer

**File**: `frontend/src/services/api.js`

```javascript
// Main API client configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 413) {
      console.error('File size too large');
    }
    return Promise.reject(error);
  }
);

// API modules
export const isEmirleriAPI = {
  getAll: (params) => apiClient.get('/is-emirleri', { params }),
  create: (data) => apiClient.post('/is-emirleri', data),
  update: (id, data) => apiClient.put(`/is-emirleri/${id}`, data),
  delete: (id) => apiClient.delete(`/is-emirleri/${id}`)
};

export const tezgahAPI = {
  getAll: () => apiClient.get('/tezgahlar'),
  assignWorkOrder: (tezgahId, isEmriId) => 
    apiClient.post(`/tezgahlar/${tezgahId}/is-emri-ata`, { is_emri_id: isEmriId })
};
```

### 12. Caching Service

**File**: `frontend/src/services/cacheService.js`

```javascript
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 2000; // 2 seconds
  }

  set(key, data, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getFallback(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }
}

export const cacheService = new CacheService();
```

## Mobile-Specific Components

### 13. Mobile Component Patterns

#### Mobile Part Selector
**File**: `frontend/src/components/mobile/MobilParcaSecici.jsx`

```jsx
const MobilParcaSecici = ({ onSelect, selectedParcaKodu }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredParts, setFilteredParts] = useState([]);

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        placeholder="Parça ara..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon />,
          sx: { fontSize: '1.1rem' } // Mobile-optimized
        }}
      />
      
      <List sx={{ mt: 2 }}>
        {filteredParts.map((parca) => (
          <ListItem
            key={parca.parca_kodu}
            button
            onClick={() => onSelect(parca)}
            sx={{ 
              minHeight: 64, // Touch-friendly
              borderRadius: 1,
              mb: 1,
              bgcolor: selectedParcaKodu === parca.parca_kodu ? 'primary.light' : 'background.paper'
            }}
          >
            <ListItemText
              primary={parca.parca_adi}
              secondary={parca.parca_kodu}
              primaryTypographyProps={{ fontSize: '1rem' }}
              secondaryTypographyProps={{ fontSize: '0.875rem' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
```

#### Mobile Work Order Card
**File**: `frontend/src/components/mobile/IsEmriKartiMobile.jsx`

```jsx
const IsEmriKartiMobile = ({ isEmri, onUpdate }) => (
  <Card sx={{ mb: 2, boxShadow: 2 }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          {isEmri.is_emri_no}
        </Typography>
        <Chip 
          label={isEmri.durum} 
          color={getDurumColor(isEmri.durum)}
          size="small"
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {isEmri.is_adi}
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2">
          Adet: {isEmri.adet}
        </Typography>
        <Typography variant="body2">
          Teslim: {formatDate(isEmri.teslim_tarihi)}
        </Typography>
      </Box>
      
      <Button
        fullWidth
        variant="contained"
        size="large"
        sx={{ minHeight: 48 }} // Touch-friendly
        onClick={() => onUpdate(isEmri)}
      >
        Düzenle
      </Button>
    </CardContent>
  </Card>
);
```

## Page Components

### 14. Main Page Structure

#### Desktop Pages
**Directory**: `frontend/src/pages/`

- `Dashboard.jsx` - Main dashboard with key metrics
- `IsEmirleri.jsx` - Work orders management page
- `Tezgahlar.jsx` - Workstations management page
- `Parcalar.jsx` - Parts catalog page
- `UretimPlani.jsx` - Production planning page
- `Sevkiyat.jsx` - Shipping management page
- `Raporlar.jsx` - Reports and analytics page

#### Mobile Pages
**Directory**: `frontend/src/pages/mobile/`

- `DashboardMobile.jsx` - Mobile dashboard
- `IsEmirleriMobileYeni.jsx` - Mobile work orders (enhanced)
- `TezgahlarMobile.jsx` - Mobile workstations
- `ParcalarMobile.jsx` - Mobile parts catalog
- `UretimPlaniMobile.jsx` - Mobile production planning
- `SevkiyatListesiMobile.jsx` - Mobile shipping

### 15. Routing Configuration

```jsx
// Desktop routes
const DesktopRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/tezgahlar" replace />} />
    <Route path="/tezgahlar" element={<Tezgahlar />} />
    <Route path="/is-emirleri" element={<IsEmirleri />} />
    <Route path="/parcalar" element={<Parcalar />} />
    <Route path="/uretim-plani" element={<UretimPlani />} />
    <Route path="/sevkiyat" element={<Sevkiyat />} />
    <Route path="/raporlar" element={<Raporlar />} />
  </Routes>
);

// Mobile routes
const MobileRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/mobile/tezgahlar" replace />} />
    <Route path="/mobile/tezgahlar" element={<TezgahlarMobile />} />
    <Route path="/mobile/is-emirleri" element={<IsEmirleriMobileYeni />} />
    <Route path="/mobile/parcalar" element={<ParcalarMobile />} />
    <Route path="/mobile/uretim-plani" element={<UretimPlaniMobile />} />
    <Route path="/mobile/sevkiyat" element={<SevkiyatListesiMobile />} />
  </Routes>
);
```

## Utility Functions and Hooks

### 16. Custom Hooks

#### Stock Cards Hook
**File**: `frontend/src/hooks/useStokKartlari.js`

```javascript
export const useStokKartlari = () => {
  const [stokKartlari, setStokKartlari] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    malzeme_cinsi: '',
    firma: '',
    aktif_mi: true
  });

  const fetchStokKartlari = useCallback(async () => {
    setLoading(true);
    try {
      const response = await stokKartlariAPI.getAll(filters);
      setStokKartlari(response.data);
    } catch (error) {
      console.error('Error fetching stock cards:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStokKartlari();
  }, [fetchStokKartlari]);

  return {
    stokKartlari,
    loading,
    filters,
    setFilters,
    refresh: fetchStokKartlari
  };
};
```

### 17. Utility Functions

**File**: `frontend/src/utils/index.js`

```javascript
// Date formatting utilities
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('tr-TR');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('tr-TR');
};

// Status utilities
export const getDurumColor = (durum) => {
  const colorMap = {
    'beklemede': 'warning',
    'calisiyor': 'info',
    'tamamlandi': 'success',
    'iptal': 'error'
  };
  return colorMap[durum] || 'default';
};

// File utilities
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large');
  }
  
  return true;
};
```

## Performance Optimizations

### 18. Component Optimization Patterns

```jsx
// Memoized component for expensive renders
const ParcaKarti = React.memo(({ parca, onUpdate }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{parca.parca_adi}</Typography>
        <Typography variant="body2">{parca.parca_kodu}</Typography>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return prevProps.parca.updated_at === nextProps.parca.updated_at;
});

// Debounced search hook
const useDebouncedSearch = (searchTerm, delay = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return debouncedTerm;
};
```

### 19. Image Optimization

**File**: `frontend/src/components/ImageWithFallback.jsx`

```jsx
const ImageWithFallback = ({ src, fallbackSrc, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setImageSrc(fallbackSrc);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <Box position="relative">
      {loading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: loading ? 'none' : 'block' }}
        {...props}
      />
    </Box>
  );
};
```

This comprehensive frontend documentation provides developers with a complete understanding of the ÜRTM Takip React application's architecture, component organization, mobile responsiveness, state management, and optimization patterns. The dual-layout system represents a sophisticated approach to building truly responsive manufacturing applications that work equally well for desktop operators and mobile shop floor workers.