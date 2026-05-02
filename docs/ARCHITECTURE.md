# System Architecture

## Overview

ÜRTM Takip is a full-stack manufacturing production tracking system built with Node.js/Express.js backend and React frontend.

## Architecture Layers

### Layer 1: Frontend (React + Vite + Material-UI)

**Entry Point**: `frontend/src/App.jsx`
**Port**: 5173 (fixed)

```
frontend/
├── src/
│   ├── App.jsx              # Main application component
│   ├── main.jsx            # Entry point
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   ├── services/           # API client
│   ├── store/              # Redux state management
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   └── api/               # API client functions
├── public/                  # Static assets
└── index.html              # HTML template
```

### Layer 2: Backend API (Express.js + SQLite)

**Entry Point**: `backend/src/index.js`
**Port**: 3000 (fixed)

```
backend/
├── src/
│   ├── index.js           # Express app entry point
│   ├── routes/           # API route definitions
│   ├── controllers/      # Business logic
│   ├── models/          # Sequelize models
│   ├── migrations/      # Database migrations
│   ├── services/        # Business services
│   ├── middleware/      # Express middleware
│   └── config/         # Configuration
├── database.sqlite      # SQLite database
└── uploads/            # File uploads
```

### Layer 3: Hardware Integration

**Location**: `CNC_panel/`
**Platform**: PlatformIO + ESP32

### Layer 4: Python CAD Tools

- `STEP_BOM_Analyzer/` - FreeCAD-based STEP parsing
- `CAD_Import_Client/` - SolidWorks COM automation

## API Structure

The API follows RESTful patterns under `/api/` routes:

| Route | Description |
|-------|-------------|
| `/api/is-emirleri` | Work order management |
| `/api/tezgahlar` | Workstation management |
| `/api/parcalar` | Parts catalog |
| `/api/boms` | Bill of Materials |
| `/api/stok-kartlari` | Inventory management |
| `/api/uretim-plani` | Production planning (V1) |
| `/api/uretim-planlari` | Production planning (V2) |
| `/api/sevkiyat` | Shipping |
| `/api/fason` | Subcontractor work |
| `/api/ariza-bakim` | Maintenance |

## Real-time Communication

**Technology**: Socket.IO

Events:
- `tezgah-durum`: Workstation status updates
- `is-emri-guncelleme`: Work order updates
- `stok-uyari`: Stock alerts

## Database Schema

### Core Models

- **is_emirleri**: Work orders
- **tezgahlar**: Workstations
- **parcalar**: Parts catalog
- **boms**: Bill of Materials
- **stok_kartlari**: Inventory items
- **uretim_plani**: Production plans (V1)
- **uretim_planlari**: Production plans (V2)
- **sevkiyat**: Shipping records

### Relationships

```
is_emirleri 1:N islem_kayitlari
parcalar 1:N parca_kayitlari
tezgahlar 1:N tezgah_durum_log
boms belongsTo parcalar
is_emirleri belongsTo tezgahlar
is_emirleri hasMany boms (through is_emri_bom)
```

## Frontend Architecture

### State Management

- **Redux Toolkit**: Complex state (is_emirleri, tezgahlar, stok)
- **Component State**: UI-only data
- **Context**: Device settings (mobile/desktop)

### Device Detection

- Automatic mobile/desktop layout switching
- Mobile routes prefixed with `/mobile/`
- Theme switching (theme.js / theme.mobile.js)

## Security

- JWT authentication
- Password hashing (bcryptjs)
- Input validation (Joi)
- CORS configuration
- Rate limiting
- Helmet security headers

## Deployment

- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy)
- **Database**: SQLite file

## Environment Requirements

- **Backend Port**: 3000 (mandatory)
- **Frontend Port**: 5173 (mandatory)
- Environment variables in `backend/.env`