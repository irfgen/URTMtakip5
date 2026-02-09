# Frontend Component Documentation

## Table of Contents
- [Overview](#overview)
- [Component Structure](#component-structure)
- [Page Components](#page-components)
- [Reusable Components](#reusable-components)
- [Mobile Components](#mobile-components)
- [Component Props](#component-props)
- [State Management](#state-management)
- [Routing](#routing)
- [Theming](#theming)

---

## Overview

### Frontend Architecture

The ÜRTM Takip frontend is built with:
- **React 18.2** - UI library
- **Vite 5.0** - Build tool and dev server
- **Material-UI 5.17** - Component library
- **React Router 6.20** - Routing
- **Redux Toolkit 2.0** - State management
- **Axios 1.9** - HTTP client
- **Socket.IO Client 4.7** - Real-time updates

### Development Server
- **Port:** 5173 (fixed, kills existing process if occupied)
- **Hot Module Replacement:** Enabled
- **Build Output:** `frontend/dist/`

---

## Component Structure

### Directory Organization

```
frontend/src/
├── components/              # Reusable components (100+ files)
│   ├── mobile/             # Mobile-specific components
│   ├── Notlar/             # Notes module components
│   ├── ParcaTakipListeleri/ # Part tracking lists
│   ├── StokTakipListeleri/  # Stock tracking lists
│   ├── UretimPlani/        # Production planning
│   ├── VardiyaYonetimi/    # Shift management
│   ├── Raporlar/           # Reports
│   ├── tedarik/            # Supply management
│   └── *.jsx               # Other components
├── pages/                  # Page components (50+ files)
│   ├── mobile/             # Mobile pages (30+ files)
│   ├── Raporlar/           # Report pages
│   ├── ArizaBakim/         # Maintenance pages
│   ├── yonetimsel/         # Admin pages
│   └── *.jsx               # Other pages
├── hooks/                  # Custom React hooks
├── services/               # API services
├── store/                  # Redux store
├── utils/                  # Utility functions
├── theme.js                # Desktop MUI theme
├── theme.mobile.js         # Mobile MUI theme
└── App.jsx                 # Main app component
```

---

## Page Components

### Desktop Pages

#### Dashboard.jsx
**Location:** `frontend/src/pages/Dashboard.jsx`

**Purpose:** Main production dashboard with KPIs and charts

**Key Features:**
- Real-time production overview
- Machine status cards
- Work order statistics
- Performance charts
- Quick actions

**Props:** None (page component)

---

#### Tezgahlar.jsx (Workstations)
**Location:** `frontend/src/pages/Tezgahlar.jsx`

**Purpose:** Workstation management and monitoring

**Key Features:**
- Workstation list
- Status indicators
- Workstation creation/editing
- Job assignments
- Performance metrics

**Components Used:**
- `TezgahKarti` - Workstation card
- `TezgahEkleForm` - Add workstation form
- `TezgahDuzenleForm` - Edit workstation form

---

#### IsEmirleri.jsx (Work Orders)
**Location:** `frontend/src/pages/IsEmirleri.jsx`

**Purpose:** Work order management

**Key Features:**
- Work order list with filtering
- Status management
- Priority sorting
- Workstation assignment
- Progress tracking

**Components Used:**
- `IsEmriListesi` - Work order list
- `IsEmriKartiMobile` - Work order card
- `IsEmriDurumYonetimi` - Status management

**Query Parameters:**
- `durum` - Filter by status
- `tezgah_id` - Filter by workstation

---

#### Parcalar.jsx (Parts)
**Location:** `frontend/src/pages/Parcalar.jsx`

**Purpose:** Parts catalog management

**Key Features:**
- Parts list with search
- Technical drawing viewer
- Stock level indicators
- Part creation/editing
- Cost tracking

**Components Used:**
- `ParcaSecici` - Part selector
- `ParcaKartiDuzenleForm` - Edit part form
- `TeknikResimViewer` - Drawing viewer
- `ParcaUretimGecmisiModal` - Production history

---

#### UretimPlani.jsx (Production Planning)
**Location:** `frontend/src/pages/UretimPlani.jsx`

**Purpose:** Complex production planning with BOM integration

**Key Features:**
- Production plan list
- BOM analysis
- Machine capacity planning
- Critical stock alerts
- Excel import

**Components Used:**
- `UretimPlaniListesi` - Plan list
- `UretimPlaniForm` - Plan form
- `BomAnalyzeForm` - BOM analysis
- `ExcelUretimPlaniModal` - Excel import
- `KarmaUretimPlaniForm` - Mixed plan form

---

#### Boms.jsx (Bill of Materials)
**Location:** `frontend/src/pages/Boms.jsx`

**Purpose:** BOM management and hierarchy

**Key Features:**
- BOM tree view
- Cost calculation
- Material requirements
- BOM import/export
- Print support

**Components Used:**
- `BomListesi` - BOM list
- `BomForm` - BOM form
- `BomPrintModal` - Print modal

---

#### ArizaBakim Pages
**Location:** `frontend/src/pages/ArizaBakim/`

**Files:**
- `ArizaBakimListesi.jsx` - Maintenance list
- `ArizaBakimEkle.jsx` - Add maintenance record
- `ArizaBakimDetay.jsx` - Maintenance details

**Purpose:** Equipment maintenance tracking

**Key Features:**
- Breakdown recording
- Maintenance scheduling
- Repair history
- Downtime analysis

---

#### Fason.jsx (Subcontracting)
**Location:** `frontend/src/pages/Fason.jsx`

**Purpose:** Subcontractor management

**Key Features:**
- Subcontractor list
- Quote comparison
- Work order assignment
- Delivery tracking

**Components Used:**
- `FasonConfirmDialog` - Quote confirmation
- `FasonTeslimDialog` - Delivery confirmation

---

#### Sevkiyat.jsx (Shipping)
**Location:** `frontend/src/pages/Sevkiyat.jsx`

**Purpose:** Shipping management

**Key Features:**
- Shipment list
- Image documentation
- Delivery tracking
- QR code support

**Components Used:**
- `HamMalzemeGonderimDialog` - Material shipment
- `HamMalzemeTeslimDialog` - Material delivery

---

#### Raporlar.jsx (Reports)
**Location:** `frontend/src/pages/Raporlar.jsx`

**Purpose:** Report generation and viewing

**Key Features:**
- Production reports
- Performance reports
- Custom reports
- Export to Excel/PDF

**Sub-pages:**
- `OzelRaporlar.jsx` - Custom reports
- `UretimRaporlari.jsx` - Production reports
- `ParcaPerformansRaporu.jsx` - Part performance

---

### Mobile Pages

**Location:** `frontend/src/pages/mobile/`

#### DashboardMobile.jsx
- Simplified dashboard for mobile
- Touch-optimized cards
- Quick status view

#### TezgahlarMobile.jsx
- Workstation overview
- Quick status updates
- Job assignment

#### IsEmirleriMobileYeni.jsx
- Work order list optimized for touch
- Swipe actions
- Camera capture for photos

#### UretimPlaniMobile.jsx
- Simplified production planning
- Mobile-optimized forms
- Quick plan creation

#### ParcalarMobile.jsx
- Parts catalog with photos
- QR code scanner
- Quick search

---

## Reusable Components

### Core Components

#### Layout.jsx & MobileLayout.jsx
**Location:** `frontend/src/components/Layout.jsx`, `frontend/src/components/MobileLayout.jsx`

**Purpose:** Main application layout wrapper

**Props (Layout):**
- `children` - Page content

**Features:**
- Navigation menu
- Header with user info
- Sidebar (desktop)
- Bottom navigation (mobile)

---

#### IsEmriListesi.jsx
**Location:** `frontend/src/components/IsEmriListesi.jsx`

**Purpose:** Display work orders in table/list format

**Props:**
```jsx
{
  isEmirleri: Array,           // Work orders array
  onDurumChange: Function,     // Status change handler
  onTezgahChange: Function,    // Workstation change handler
  yukleniyor: Boolean,         // Loading state
  filtre: Object               // Filter object
}
```

**Features:**
- Sorting
- Filtering
- Pagination
- Row selection

---

#### TezgahKarti.jsx
**Location:** `frontend/src/components/TezgahKarti.jsx`

**Purpose:** Display workstation card

**Props:**
```jsx
{
  tezgah: Object,              // Workstation object
  onUpdate: Function,          // Update handler
  onClick: Function            // Click handler
}
```

**Features:**
- Status indicator
- Job list preview
- Quick actions

---

#### BomForm.jsx
**Location:** `frontend/src/components/BomForm.jsx`

**Purpose:** Create/edit BOM form

**Props:**
```jsx
{
  bom?: Object,                // BOM object (edit mode)
  onSubmit: Function,          // Submit handler
  onCancel: Function           // Cancel handler
}
```

**Features:**
- Hierarchical tree input
- Cost calculation
- Material selection
- Validation

---

#### ParcaSecici.jsx
**Location:** `frontend/src/components/ParcaSecici.jsx`

**Purpose:** Part selection component

**Props:**
```jsx
{
  onSelect: Function,          // Selection handler
  filtre?: Object,             // Filter options
  cokluSecim?: Boolean         // Multiple selection
}
```

**Features:**
- Search
- Filter by category
- QR code scan (mobile)
- Favorites

---

#### StokKartiSecici.jsx
**Location:** `frontend/src/components/StokKartiSecici.jsx`

**Purpose:** Stock card selection for raw materials

**Props:**
```jsx
{
  onSelect: Function,          // Selection handler
  filtre?: Object              // Filter options
}
```

**Features:**
- Material type filter
- Dimensions filter
- Stock level display
- Critical stock warning

---

#### TeknikResimViewer.jsx
**Location:** `frontend/src/components/TeknikResimViewer.jsx`

**Purpose:** Display technical drawings

**Props:**
```jsx
{
  resimPath: String,           // Image path
  parcaKodu: String,           // Part code
  zoomEnabled?: Boolean        // Enable zoom
}
```

**Features:**
- Pan and zoom
- Rotate
- OCR text extraction
- Print

---

### Mobile Components

**Location:** `frontend/src/components/mobile/`

#### MobilParcaSecici.jsx
- Touch-optimized part selection
- Camera integration
- Voice search

#### IsEmriDurumYonetimiMobile.jsx
- Mobile status management
- Swipe actions
- Quick updates

#### MobilStokKartiSecici.jsx
- Stock card selection for mobile
- Simplified UI
- Touch-friendly

---

### Module Components

#### Notes Module (`components/Notlar/`)

**Files:**
- `NotlarPage.jsx` - Main notes page
- `NotlarListesi.jsx` - Notes list
- `NotEkleme.jsx` - Add note form
- `NotKarti.jsx` - Note card
- `FiltrePaneli.jsx` - Filter panel
- `KategoriYonetimi.jsx` - Category management

**Features:**
- Rich text content
- Tag-based filtering
- Categories
- User assignments
- Priority levels

---

#### Production Planning (`components/UretimPlani/`)

**Files:**
- `UretimPlaniForm.jsx` - Plan form
- `UretimPlaniListesi.jsx` - Plan list
- `BomAnalyzeForm.jsx` - BOM analysis
- `ExcelUretimPlaniModal.jsx` - Excel import
- `KarmaUretimPlaniForm.jsx` - Mixed plan
- `MakinaGroupPartsPage.jsx` - Machine analysis
- `ParcaDetayModal.jsx` - Part details
- `ExcelIsEmriParametreleriForm.jsx` - Excel parameters

**Features:**
- BOM integration
- Machine capacity planning
- Critical stock analysis
- Excel import with smart matching

---

#### Shift Management (`components/VardiyaYonetimi/`)

**Files:**
- `VardiyaYonetimiAna.jsx` - Main management
- `VardiyaYonetimi.jsx` - Shift CRUD
- `VardiyaTakvimi.jsx` - Calendar view
- `PersonelYonetimi.jsx` - Personnel CRUD
- `PersonelListesi.jsx` - Personnel list
- `VardiyaRaporlari.jsx` - Shift reports

**Features:**
- Shift scheduling
- Calendar view
- Personnel assignment
- Performance tracking per shift

---

#### Supply Management (`components/tedarik/`)

**Files:**
- `TedarikTalepListesi.jsx` - Supply requests
- `FirmaYonetimPage.jsx` - Company management

**Features:**
- Supply request tracking
- Company information
- Price tracking
- Delivery status

---

#### Reports (`components/Raporlar/`)

**Files:**
- `TezgahCalismaTablosu.jsx` - Workstation table
- `UretimIstatistikleri.jsx` - Production statistics

**Features:**
- Data visualization
- Charts (Chart.js)
- Export capabilities
- Custom date ranges

---

### Specialized Components

#### ImageWithFallback.jsx
**Location:** `frontend/src/components/ImageWithFallback.jsx`

**Purpose:** Display images with fallback handling

**Props:**
```jsx
{
  src: String,                 // Image source
  alt: String,                 // Alt text
  fallback?: String,           // Fallback image path
  className?: String           // CSS class
}
```

**Features:**
- Automatic fallback on error
- Loading indicator
- Lazy loading

---

#### CameraCapture.jsx
**Location:** `frontend/src/components/CameraCapture.jsx`

**Purpose:** Camera integration for photos

**Props:**
```jsx
{
  onCapture: Function,         // Capture handler
  onCancel: Function           // Cancel handler
}
```

**Features:**
- Camera access
- Photo capture
- Preview
- Upload

---

#### IsEmriKanbanBoard.jsx
**Location:** `frontend/src/components/IsEmriKanbanBoard.jsx`

**Purpose:** Kanban board for work orders

**Props:**
```jsx
{
  isEmirleri: Array,           // Work orders
  onStatusChange: Function,    // Status update
  groupBy?: String             // Group by field
}
```

**Features:**
- Drag and drop (Hello Pangea DnD)
- Column-based view
- Quick status updates
- Filtering

---

#### Timeline/TimelineGanttChart.jsx
**Location:** `frontend/src/components/Timeline/TimelineGanttChart.jsx`

**Purpose:** Gantt chart for scheduling

**Props:**
```jsx
{
  events: Array,               // Timeline events
  onStartChange: Function,     // Start time change
  onEndChange: Function        // End time change
}
```

**Features:**
- Gantt chart visualization
- Drag to resize
- Dependencies
- Milestones

---

## Component Props

### Common Props Patterns

#### Form Components
```jsx
{
  initialData?: Object,        // Initial form data
  onSubmit: Function,          // Submit callback
  onCancel: Function,          // Cancel callback
  validation?: Object          // Validation schema
}
```

#### List Components
```jsx
{
  data: Array,                 // Data array
  loading?: Boolean,           // Loading state
  onSelect?: Function,         // Selection handler
  multiSelect?: Boolean,       // Multi-selection
  filterable?: Boolean         // Enable filtering
}
```

#### Modal Components
```jsx
{
  open: Boolean,               // Open state
  onClose: Function,           // Close handler
  title: String,               // Modal title
  children: Node               // Content
}
```

---

## State Management

### Redux Slices

**Location:** `frontend/src/store/`

#### Available Slices
- Work orders slice
- Parts slice
- Workstations slice
- UI slice

#### Usage Example
```jsx
import { useDispatch, useSelector } from 'react-redux';

function MyComponent() {
  const dispatch = useDispatch();
  const { isEmirleri, yukleniyor } = useSelector(state => state.isEmirleri);

  const handleClick = () => {
    dispatch(fetchIsEmirleri());
  };

  return <div>...</div>;
}
```

---

## Routing

### Route Structure

**Desktop Routes:**
```jsx
/                           → Redirects to /tezgahlar
/tezgahlar                  → Workstations page
/is-emirleri                → Work orders page
/parcalar                   → Parts page
/uretim-plani               → Production planning
/boms                       → BOM management
/fason                      → Subcontracting
/sevkiyat                   → Shipping
/ariza-bakim                → Maintenance
/raporlar                   → Reports
/notlar                     → Notes
/faturalar                  → Invoices
/irsaliyeler                → Delivery notes
/makindex                   → Makindex module
```

**Mobile Routes:**
```jsx
/mobile/tezgahlar           → Mobile workstations
/mobile/is-emirleri         → Mobile work orders
/mobile/parcalar            → Mobile parts
/mobile/uretim-plani        → Mobile production planning
/mobile/notlar              → Mobile notes
/mobile/sevkiyat            → Mobile shipping
/mobile/faturalar           → Mobile invoices
/mobile/irsaliyeler         → Mobile delivery notes
/mobile/makindex            → Mobile Makindex
```

### Route Guards

Device detection is automatic via `useDeviceDetect` hook:

```jsx
const { isMobile } = useDeviceDetect();

// Desktop users accessing /mobile/* are redirected to /*
// Mobile users accessing /* are redirected to /mobile/*
```

---

## Theming

### Desktop Theme (`theme.js`)

**Key Colors:**
- Primary: `#1976d2` (blue)
- Secondary: `#dc004e` (pink)
- Background: `#f5f5f5`
- Paper: `#ffffff`

**Typography:**
- Font family: Roboto
- H1: 6rem (96px)
- H2: 3.75rem (60px)
- H3: 3rem (48px)
- Body1: 1rem (16px)

**Spacing:** 8px base unit

### Mobile Theme (`theme.mobile.js`)

**Differences from Desktop:**
- Larger touch targets (min 44px)
- Simplified typography
- Bottom navigation
- Optimized cards

**Key Colors:**
- Same as desktop

**Typography:**
- Slightly larger for readability
- H1: 3rem (48px)
- Body1: 1.125rem (18px)

**Spacing:** 8px base unit, more padding

---

## Custom Hooks

### useDeviceDetect
**Location:** `frontend/src/hooks/useDeviceDetect.js`

**Purpose:** Detect mobile vs desktop

**Usage:**
```jsx
const { isMobile, isDesktop } = useDeviceDetect();
```

---

## API Services

**Location:** `frontend/src/services/`

### API Client

Base configuration:
```jsx
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Service Modules

- `tezgahAPI.js` - Workstation API
- `isEmriAPI.js` - Work order API
- `parcaAPI.js` - Part API
- `stokKartiAPI.js` - Stock card API
- `uretimPlaniAPI.js` - Production plan API
- `fasonAPI.js` - Subcontracting API
- `sevkiyatAPI.js` - Shipping API

---

## Real-time Updates

### Socket.IO Client

**Location:** Integrated via `socket.io-client`

**Connection:**
```jsx
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Events
socket.on('isEmriGuncellendi', (data) => {
  // Handle update
});

socket.on('makindex-stok-guncellemesi', (data) => {
  // Handle stock update
});
```

---

## Related Documentation

- [Project Overview](./PROJECT_OVERVIEW.md) - System architecture
- [API Reference](./API_REFERENCE.md) - Backend API endpoints
- [Database Schema](./DATABASE.md) - Data models
- [Development Guide](./DEVELOPMENT.md) - Development procedures
