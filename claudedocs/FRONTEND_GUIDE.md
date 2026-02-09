# ÜRTM Takip System - Frontend Guide

## Overview

The ÜRTM Takip frontend is a React-based web application built with Vite, featuring Material-UI components, Redux Toolkit for state management, and responsive design with dedicated mobile layouts.

**Technology Stack:**
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.6
- **UI Library**: Material-UI (MUI) 5.17.1
- **State Management**: Redux Toolkit 2.0.1
- **Routing**: React Router DOM 6.20.1
- **HTTP Client**: Axios 1.9.0
- **Real-time**: Socket.IO Client 4.7.2
- **Data Visualization**: Chart.js 4.4.9
- **Forms**: Formik 2.4.6 + Yup 1.6.1
- **PDF**: React PDF 7.7.2
- **Date Handling**: date-fns 2.30.0, dayjs 1.11.13

**Development Server**: Port 5173 (fixed, auto-kills existing process)

---

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # API client functions
│   ├── components/             # React components
│   │   ├── IsEmirleri/         # Work order components
│   │   ├── Tezgahlar/          # Workstation components
│   │   ├── Parcalar/           # Parts catalog components
│   │   ├── UretimPlani/        # Production planning components
│   │   ├── StokKartlari/       # Inventory components
│   │   ├── Sevkiyat/           # Shipping components
│   │   ├── Fason/              # Subcontracting components
│   │   ├── ArizaBakim/         # Maintenance components
│   │   ├── Notlar/             # Notes components
│   │   ├── Raporlar/           # Reporting components
│   │   ├── Vardiya/            # Shift management components
│   │   ├── Dashboard/          # Dashboard components
│   │   ├── mobile/             # Mobile-specific components
│   │   └── shared/             # Shared/reusable components
│   ├── hooks/                  # Custom React hooks
│   ├── pages/                  # Page-level components
│   │   └── mobile/             # Mobile-specific pages
│   ├── services/               # Service layer
│   ├── store/                  # Redux store
│   │   └── slices/             # Redux slices
│   ├── styles/                 # Global styles
│   ├── tests/                  # Frontend tests (Vitest)
│   ├── utils/                  # Utility functions
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # React entry point
│   ├── theme.js                # Desktop MUI theme
│   └── theme.mobile.js         # Mobile MUI theme
├── public/
│   └── uploads/                # Static uploaded files
├── package.json
├── vite.config.js
└── index.html
```

---

## Component Architecture

### Component Types

#### 1. Page Components
Located in `src/pages/`, these are route-level components that compose multiple feature components.

**Example**: `IsEmirleriPage.jsx`
```jsx
function IsEmirleriPage() {
  return (
    <Box>
      <IsEmirleriList />
      <IsEmirleriDialog />
      <IsEmirleriFilters />
    </Box>
  );
}
```

#### 2. Feature Components
Located in `src/components/[module]/`, these are reusable components for specific features.

**Example**: `IsEmirleriList.jsx`
```jsx
function IsEmirleriList({ filters }) {
  const { data, loading } = useIsEmirleri(filters);
  return <DataGrid rows={data} loading={loading} />;
}
```

#### 3. Shared Components
Located in `src/components/shared/`, these are common UI components used across the app.

**Examples**:
- `ConfirmDialog.jsx`
- `LoadingSpinner.jsx`
- `ErrorBoundary.jsx`
- `DataTable.jsx`

#### 4. Mobile Components
Located in `src/components/mobile/`, these are optimized for mobile devices.

**Examples**:
- `MobileIsEmirleriCard.jsx`
- `MobileTezgahStatus.jsx`
- `TouchOptimizedButton.jsx`

---

## Routing Architecture

### Route Configuration

Routes are defined in `src/App.jsx` with automatic mobile/desktop detection.

**Desktop Routes**:
```jsx
<Routes>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/is-emirleri" element={<IsEmirleriPage />} />
  <Route path="/tezgahlar" element={<TezgahlarPage />} />
  <Route path="/parcalar" element={<ParcalarPage />} />
  {/* ... more routes */}
</Routes>
```

**Mobile Routes** (prefixed with `/mobile/`):
```jsx
<Routes>
  <Route path="/mobile/is-emirleri" element={<MobileIsEmirleriPage />} />
  <Route path="/mobile/tezgahlar" element={<MobileTezgahlarPage />} />
  {/* ... more mobile routes */}
</Routes>
```

### Device Detection

The `useDeviceDetect` hook automatically switches between mobile and desktop layouts.

**Custom Hook**: `src/hooks/useDeviceDetect.js`
```jsx
function useDeviceDetect() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod/i.test(userAgent);
    setIsMobile(mobile);
  }, []);
  
  return { isMobile, isDesktop: !isMobile };
}
```

**Usage**:
```jsx
const { isMobile } = useDeviceDetect();
return isMobile ? <MobileLayout /> : <DesktopLayout />;
```

---

## State Management (Redux Toolkit)

### Store Configuration

**File**: `src/store/index.js`
```jsx
import { configureStore } from '@reduxjs/toolkit';
import isEmirleriReducer from './slices/isEmirleriSlice';
import tezgahlarReducer from './slices/tezgahlarSlice';

export const store = configureStore({
  reducer: {
    isEmirleri: isEmirleriReducer,
    tezgahlar: tezgahlarReducer,
    // ... more slices
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // For Socket.IO and non-serializable data
    }),
});
```

### Redux Slices

**Example**: `src/store/slices/isEmirleriSlice.js`
```jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/isEmirleri';

export const fetchIsEmirleri = createAsyncThunk(
  'isEmirleri/fetch',
  async (params) => {
    const response = await api.getAll(params);
    return response.data;
  }
);

const isEmirleriSlice = createSlice({
  name: 'isEmirleri',
  initialState: {
    data: [],
    loading: false,
    error: null,
    filters: {},
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIsEmirleri.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIsEmirleri.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchIsEmirleri.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setFilters } = isEmirleriSlice.actions;
export default isEmirleriSlice.reducer;
```

### Using Redux in Components

```jsx
import { useSelector, useDispatch } from 'react-redux';
import { fetchIsEmirleri, setFilters } from '../store/slices/isEmirleriSlice';

function IsEmirleriList() {
  const dispatch = useDispatch();
  const { data, loading, filters } = useSelector((state) => state.isEmirleri);
  
  useEffect(() => {
    dispatch(fetchIsEmirleri(filters));
  }, [dispatch, filters]);
  
  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };
  
  return <DataGrid rows={data} loading={loading} />;
}
```

---

## API Integration

### Axios Configuration

**File**: `src/api/axios.js`
```jsx
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
    // Add auth token if available
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
    // Handle common errors
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API Functions

**Example**: `src/api/isEmirleri.js`
```jsx
import api from './axios';

export const isEmirleriAPI = {
  getAll: (params) => api.get('/is-emirleri', { params }),
  getById: (id) => api.get(`/is-emirleri/${id}`),
  create: (data) => api.post('/is-emirleri', data),
  update: (id, data) => api.put(`/is-emirleri/${id}`, data),
  delete: (id) => api.delete(`/is-emirleri/${id}`),
  updateStatus: (id, status) => api.post(`/is-emirleri/${id}/status`, { status }),
};

export default isEmirleriAPI;
```

### Custom Hooks for Data Fetching

**Example**: `src/hooks/useIsEmirleri.js`
```jsx
import { useQuery } from '@tanstack/react-query'; // or useEffect
import { isEmirleriAPI } from '../api/isEmirleri';

export function useIsEmirleri(filters = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['isEmirleri', filters],
    queryFn: () => isEmirleriAPI.getAll(filters),
  });
  
  return { data, loading: isLoading, error, refetch };
}
```

---

## Real-time Communication (Socket.IO)

### Socket Configuration

**File**: `src/services/socket.js`
```jsx
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }
  
  connect() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
  
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners[event] = callback;
    }
  }
  
  off(event) {
    if (this.socket && this.listeners[event]) {
      this.socket.off(event, this.listeners[event]);
      delete this.listeners[event];
    }
  }
  
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();
```

### Using Socket Events

```jsx
import socket from '../services/socket';
import { useEffect } from 'react';

function TezgahStatus({ tezgahId }) {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    // Listen for status updates
    socket.on('tezgah:status:update', (data) => {
      if (data.tezgahId === tezgahId) {
        setStatus(data.durum);
      }
    });
    
    return () => {
      socket.off('tezgah:status:update');
    };
  }, [tezgahId]);
  
  return <div>Status: {status}</div>;
}
```

---

## Material-UI Theme Configuration

### Desktop Theme

**File**: `src/theme.js`
```jsx
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
    h4: {
      fontSize: '2rem',
    },
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

### Mobile Theme

**File**: `src/theme.mobile.js`
```jsx
import { createTheme } from '@mui/material/styles';

const mobileTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  typography: {
    fontSize: 14, // Smaller base font for mobile
    h4: {
      fontSize: '1.5rem', // Smaller headings
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48, // Larger touch targets
        },
      },
    },
  },
});

export default mobileTheme;
```

### Theme Application

**File**: `src/main.jsx`
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';
import mobileTheme from './theme.mobile';

// Determine theme based on device
const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
const selectedTheme = isMobile ? mobileTheme : theme;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={selectedTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

---

## Form Handling (Formik + Yup)

### Form Example

```jsx
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  parcaKodu: Yup.string().required('Parça kodu gerekli'),
  adet: Yup.number().required('Adet gerekli').min(1, 'En az 1'),
  tezgahId: Yup.number().required('Tezgah seçilmeli'),
});

function IsEmriForm() {
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await isEmirleriAPI.create(values);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Formik
      initialValues={{
        parcaKodu: '',
        adet: 1,
        tezgahId: '',
        aciklama: '',
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form>
          <Field name="parcaKodu" placeholder="Parça Kodu" />
          <ErrorMessage name="parcaKodu" component="div" />
          
          <Field name="adet" type="number" placeholder="Adet" />
          <ErrorMessage name="adet" component="div" />
          
          <Field name="tezgahId" as="select">
            <option value="">Tezgah Seçin</option>
            <option value="1">CNC-01</option>
            <option value="2">CNC-02</option>
          </Field>
          
          <Field name="aciklama" as="textarea" placeholder="Açıklama" />
          
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

---

## Data Visualization (Chart.js)

### Chart Example

```jsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function UretimChart({ data }) {
  const chartData = {
    labels: data.map((d) => d.tarih),
    datasets: [
      {
        label: 'Üretilen Adet',
        data: data.map((d) => d.adet),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Üretim Grafiği',
      },
    },
  };
  
  return <Line data={chartData} options={options} />;
}
```

---

## Performance Optimization

### Code Splitting

```jsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/shared';

const IsEmirleriPage = lazy(() => import('./pages/IsEmirleriPage'));
const TezgahlarPage = lazy(() => import('./pages/TezgahlarPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/is-emirleri" element={<IsEmirleriPage />} />
        <Route path="/tezgahlar" element={<TezgahlarPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```jsx
import { memo } from 'react';

const IsEmriCard = memo(({ isEmri }) => {
  return (
    <Card>
      <Typography>{isEmri.parcaKodu}</Typography>
      <Typography>{isEmri.adet}</Typography>
    </Card>
  );
});

export default IsEmriCard;
```

### Debouncing

```jsx
import { debounce } from 'lodash.debounce';
import { useCallback } from 'react';

function SearchInput({ onSearch }) {
  const debouncedSearch = useCallback(
    debounce((value) => onSearch(value), 500),
    [onSearch]
  );
  
  const handleChange = (e) => {
    debouncedSearch(e.target.value);
  };
  
  return <input onChange={handleChange} placeholder="Ara..." />;
}
```

---

## Testing (Vitest)

### Component Test Example

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IsEmriForm from './IsEmriForm';

describe('IsEmriForm', () => {
  it('renders form fields', () => {
    render(<IsEmriForm />);
    expect(screen.getByPlaceholderText('Parça Kodu')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Adet')).toBeInTheDocument();
  });
  
  it('submits form with valid data', async () => {
    const mockSubmit = vi.fn();
    render(<IsEmriForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Parça Kodu'), {
      target: { value: 'P001' },
    });
    fireEvent.change(screen.getByPlaceholderText('Adet'), {
      target: { value: '100' },
    });
    
    fireEvent.click(screen.getByText('Kaydet'));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      parcaKodu: 'P001',
      adet: 100,
    });
  });
});
```

---

## Build & Deployment

### Development

```bash
cd frontend
npm run dev
# Starts on http://localhost:5173
# Auto-kills existing process on port 5173
```

### Production Build

```bash
npm run build
# Creates dist/ directory
# Optimized and minified
```

### Preview Production Build

```bash
npm run preview
# Serves dist/ directory
# Tests production build locally
```

---

## Environment Variables

Create `.env` file in frontend directory:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_TITLE=ÜRTM Takip
VITE_APP_VERSION=14.0.0
```

Usage in code:

```jsx
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## Common Patterns

### Data Fetching Pattern

```jsx
function useData(apiFunction, params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await apiFunction(params);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [apiFunction, JSON.stringify(params)]);
  
  return { data, loading, error };
}
```

### Error Boundary

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Bir hata oluştu.</h1>;
    }
    return this.props.children;
  }
}
```

---

## Best Practices

1. **Component Organization**: Keep components small and focused
2. **State Management**: Use Redux for global state, local state for UI-only data
3. **API Calls**: Use custom hooks for reusable data fetching logic
4. **Error Handling**: Implement error boundaries and error handling
5. **Performance**: Use memoization and code splitting
6. **Testing**: Write tests for critical components
7. **Accessibility**: Follow WCAG guidelines, use semantic HTML
8. **Mobile Optimization**: Test on real devices, use touch-friendly UI
9. **Code Quality**: Use ESLint and Prettier
10. **Documentation**: Document complex components and hooks

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-07  
**Related Files**: API_DOCUMENTATION.md, DATABASE_SCHEMA.md, DEPLOYMENT.md
