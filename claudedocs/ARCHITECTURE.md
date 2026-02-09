# ÜRTM Takip Sistemi - Architecture Overview

> System architecture, component integration, and data flow documentation

## Table of Contents
- [System Architecture](#system-architecture)
- [Component Communication](#component-communication)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ÜRTM TAKIP SISTEMI                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │   FRONTEND       │         │   BACKEND        │                          │
│  │   (React + Vite) │◄────────┤   (Express.js)   │                          │
│  │   Port: 5173     │  HTTP   │   Port: 3000     │                          │
│  └──────────────────┘         └──────────────────┘                          │
│         ▲                            │         │                             │
│         │                            │         │                             │
│         │ Socket.IO                  │         │ Sequelize ORM              │
│         │                            ▼         ▼                             │
│         │                   ┌──────────────────┐                            │
│         │                   │   SQLite DB      │                            │
│         │                   │ database.sqlite  │                            │
│         │                   └──────────────────┘                            │
│         │                                                                  │
│         │                                                                  │
│         └───────────────────┬──────────────────┐                            │
│                             │                  │                            │
│                    ┌────────▼────────┐  ┌─────▼──────────┐                  │
│                    │  CNC Panel      │  │  Python CAD    │                  │
│                    │  (ESP32)        │  │  Tools         │                  │
│                    │  Wi-Fi + HTTP   │  │  STEP BOM      │                  │
│                    │  Status Report  │  │  SolidWorks    │                  │
│                    └─────────────────┘  └────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Frontend Application (React)
```
frontend/src/
├── components/           # Reusable UI components
│   ├── Layout/          # Main layout components
│   ├── MobileLayout/    # Mobile-specific layout
│   ├── makindex/        # Hierarchical BOM components
│   ├── WorkstationScheduler/  # Workstation scheduling
│   └── [module components]
├── pages/               # Route-based page components
│   ├── mobile/          # Mobile-specific pages
│   └── yonetimsel/      # Administrative pages
├── store/               # Redux state management
│   └── slices/          # Redux slices
├── services/            # External service integrations
│   ├── api.js          # Axios HTTP client
│   └── socket.js       # Socket.IO client
├── hooks/               # Custom React hooks
│   └── useDeviceDetect.js  # Device detection
├── utils/               # Utility functions
├── App.jsx              # Root component with routing
└── main.jsx             # Application entry point
```

#### 2. Backend Application (Express.js)
```
backend/src/
├── config/              # Configuration files
│   └── database.js      # Sequelize configuration
├── controllers/         # Business logic layer
│   ├── isEmirleriController.js
│   ├── tezgahController.js
│   └── [40+ controllers]
├── models/              # Data models (Sequelize)
│   ├── IsEmri.js
│   ├── Tezgah.js
│   └── [50+ models]
├── routes/              # API endpoints
│   ├── isEmirleriRoutes.js
│   ├── tezgahRoutes.js
│   └── [60+ routes]
├── services/            # Business services
│   └── shipmentAutomationService.js
├── middleware/          # Express middleware
│   └── socket.js        # Socket.IO middleware
├── socket/              # Socket.IO namespaces
│   └── namespaces/      # Namespace definitions
└── index.js             # Application entry point
```

#### 3. Hardware Components
```
CNC_panel/               # ESP32 Firmware
├── src/                 # Source code
├── include/             # Headers
│   └── config.h         # Wi-Fi configuration
└── platformio.ini       # Build configuration

STEP_BOM_Analyzer/       # Python STEP Processor
├── core/                # BOM extraction
├── gui/                 # PyQt interface
└── api/                 # API integration

CAD_Import_Client/       # Python SolidWorks Client
├── core/                # COM automation
├── gui/                 # PyQt interface
└── utils/               # Configuration
```

---

## Component Communication

### HTTP Communication

**Frontend → Backend**
```javascript
// Example: API Call from frontend
import api from '../services/api';

const fetchData = async () => {
  const response = await api.get('/api/is-emirleri');
  return response.data;
};
```

**Backend → Frontend**
```javascript
// Example: Response from backend
router.get('/', async (req, res) => {
  try {
    const data = await IsEmri.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Real-time Communication (Socket.IO)

**Namespaces**
- **Default Namespace (`/`)**: General updates, Makindex events
- **CAD Import Namespace (`/cad-import`)**: CAD file processing
- **Fatura Eşleştirme Namespace**: Invoice/waybill matching

**Event Flow**
```
┌─────────────┐     emit      ┌─────────────┐
│  Frontend   │ ──────────────► │   Backend   │
│  (Client)   │                 │  (Server)   │
└─────────────┘                 └─────────────┘
      ▲                               │
      │                               │ broadcast
      │                               ▼
      │                         ┌─────────────┐
      │                         │  Frontend   │
      └─────────────────────────│  (Other)    │
                                └─────────────┘
```

**Key Events**
```javascript
// Frontend: Join Makindex room
socket.emit('makindex-join');

// Frontend: Stock change notification
socket.emit('stok-degisti', {
  parcaKodu: 'P001',
  yeniStok: 100,
  oncekiStok: 95
});

// Backend: Broadcast to Makindex room
socket.to('makindex-room').emit('makindex-stok-guncellemesi', data);
```

### Hardware Communication

**CNC Panel → Backend**
```
┌─────────────┐      HTTP POST     ┌─────────────┐
│   ESP32     │ ──────────────────► │   Backend   │
│  CNC Panel  │  /api/cnc_link      │  (Express)  │
└─────────────┘                     └─────────────┘
      │                                   │
      │ Status: 0=idle, 1=running,       │
      │         2=error                   │
      ▼                                   ▼
   Update                         Database Update
   Database                    & Socket Broadcast
```

**Python Tools → Backend**
```
┌──────────────┐   HTTP/WebSocket   ┌─────────────┐
│ STEP BOM     │ ──────────────────► │   Backend   │
│ Analyzer     │  /api/cad-import    │  (Express)  │
└──────────────┘                    └─────────────┘
      │                                    │
      │ BOM Data                          │
      │ Thumbnail                          │
      ▼                                    ▼
   API Response                      Database Update
```

---

## Data Flow

### Typical Request Flow

```
1. User Action (Frontend)
   │
   ├─→ HTTP Request to Backend
   │   │
   │   ├─→ Route Handler (routes/*.js)
   │   │   │
   │   │   ├─→ Controller (controllers/*.js)
   │   │   │   │
   │   │   │   ├─→ Model Operations (Sequelize)
   │   │   │   │   │
   │   │   │   │   ├─→ Database Query
   │   │   │   │   │
   │   │   │   │   └─→ Result Return
   │   │   │   │
   │   │   │   ├─→ Business Logic
   │   │   │   │
   │   │   │   └─→ Response
   │   │   │
   │   │   └─→ JSON Response
   │   │
   │   └─→ Frontend Update (State/UI)
   │
   └─→ Optional: Socket.IO Broadcast
       │
       └─→ Other Clients Notified
```

### Real-time Update Flow

```
1. Data Change Event
   │
   ├─→ Backend Detects Change
   │   │
   │   ├─→ Socket.IO Broadcast
   │   │   │
   │   │   ├─→ All Connected Clients
   │   │   │   │
   │   │   │   ├─→ State Update (Redux)
   │   │   │   │
   │   │   │   └─→ UI Re-render
   │   │   │
   │   │   └─→ Specific Room (if applicable)
   │
   └─→ Database Update
```

---

## Technology Stack

### Frontend Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.2.0 |
| Vite | Build Tool | 5.0.6 |
| Material-UI | Component Library | 5.17.1 |
| Redux Toolkit | State Management | 2.0.1 |
| React Router | Routing | 6.20.1 |
| Socket.IO Client | Real-time | 4.7.2 |
| Axios | HTTP Client | 1.9.0 |
| Formik | Form Management | 2.4.6 |
| Yup | Validation | 1.6.1 |
| Chart.js | Charts | 4.4.9 |

### Backend Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 18+ |
| Express.js | Web Framework | 4.18.2 |
| Sequelize | ORM | 6.37.5 |
| SQLite | Database | 3 |
| Socket.IO | Real-time | 4.7.2 |
| Winston | Logging | 3.11.0 |
| JWT | Authentication | 9.0.2 |
| Multer | File Upload | 2.0.1 |
| Sharp | Image Processing | 0.32.6 |
| Tesseract.js | OCR | 4.1.4 |
| Umzug | Migrations | 3.8.2 |

### Hardware & Tools Stack

| Technology | Purpose |
|------------|---------|
| ESP32 | Microcontroller |
| PlatformIO | Build System |
| Python 3.8+ | Scripting |
| PyQt5 | GUI |
| FreeCAD | STEP Processing |
| SolidWorks COM | CAD Automation |

---

## Deployment Architecture

### Development Environment
```
┌─────────────────────────────────────────────────┐
│               Development                       │
├─────────────────────────────────────────────────┤
│  ┌────────────────┐         ┌────────────────┐ │
│  │  Vite Dev      │◄────────┤  Nodemon       │ │
│  │  Server (5173) │  Proxy  │  Server (3000) │ │
│  └────────────────┘         └────────────────┘ │
│         │                          │           │
│         └──────────┬───────────────┘           │
│                    │                           │
│                    ▼                           │
│            ┌──────────────┐                    │
│            │  SQLite DB   │                    │
│            │  (local)     │                    │
│            └──────────────┘                    │
└─────────────────────────────────────────────────┘
```

### Production Environment
```
┌─────────────────────────────────────────────────┐
│               Production                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────┐         ┌────────────────┐ │
│  │  Nginx Proxy   │────────►│  PM2           │ │
│  │  (Port 80/443) │         │  (Node.js)     │ │
│  └────────────────┘         │  (Port 3000)   │ │
│                            └────────────────┘ │
│                                   │            │
│                            ┌──────▼──────┐    │
│                            │  SQLite DB  │    │
│                            │  (persistent)│   │
│                            └─────────────┘    │
│                                                 │
│  ┌────────────────┐                            │
│  │  ESP32 CNC     │◄─── Wi-Fi ────────────────┤
│  │  Panels        │                            │
│  └────────────────┘                            │
└─────────────────────────────────────────────────┘
```

### Port Configuration

| Service | Port | Notes |
|---------|------|-------|
| Frontend (Vite Dev) | 5173 | Fixed, kills existing process |
| Frontend (Production) | Static files served by Nginx |
| Backend API | 3000 | Default, configurable via PORT env |
| Socket.IO | 3000 | Same as backend |
| Database | File-based | `backend/database.sqlite` |

---

## Security Considerations

### Current Implementation
- Helmet.js for HTTP headers
- CORS configuration (development: all origins)
- Rate limiting (express-rate-limit)
- JWT authentication (where implemented)
- File upload size limits (100MB)
- Input validation (Joi, express-validator)

### Production Recommendations
- Restrict CORS to specific origins
- Enable HTTPS with SSL certificates
- Implement proper authentication/authorization
- Add request validation for all endpoints
- Enable foreign key constraints in SQLite
- Regular database backups
- Monitor logging for suspicious activity

---

## Performance Optimizations

### Database
- WAL mode for better concurrency
- Connection pooling
- Query optimization with proper indexes
- Periodic WAL checkpoints

### Frontend
- Code splitting with React lazy loading
- Material-UI tree shaking
- Image lazy loading
- Redux state normalization
- Service worker for caching

### Backend
- Response compression
- Static file caching
- Image optimization with Sharp
- Efficient query patterns with Sequelize

---

## Cross-References

- [Backend Documentation](BACKEND.md) - Detailed backend architecture
- [Frontend Documentation](FRONTEND.md) - Detailed frontend architecture
- [Database Schema](DATABASE.md) - Complete database structure
- [API Reference](API_REFERENCE.md) - All API endpoints
- [Hardware Integration](HARDWARE.md) - Hardware communication
- [Development Guide](DEVELOPMENT.md) - Setup and deployment
