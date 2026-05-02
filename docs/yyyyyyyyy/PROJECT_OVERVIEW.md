# ÜRTM Takip Sistemi - Project Overview

## Table of Contents
- [Introduction](#introduction)
- [Purpose and Scope](#purpose-and-scope)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [System Modules](#system-modules)
- [Development Environment](#development-environment)

---

## Introduction

ÜRTM Takip Sistemi is a comprehensive production tracking and management system designed for industrial manufacturing environments. It provides real-time monitoring, work order management, inventory tracking, and production planning capabilities for modern manufacturing facilities.

**Current Version:** v14.dev1
**License:** Private
**Language:** Turkish (interface), English (codebase)

---

## Purpose and Scope

### Primary Objectives

1. **Production Tracking**: Monitor and track work orders (İş Emirleri) throughout the manufacturing process
2. **Machine Management**: Real-time monitoring of workstations/machines (Tezgahlar) with status updates
3. **Inventory Management**: Track parts (Parçalar), stock cards (Stok Kartları), and materials
4. **Production Planning**: Create and manage production plans with BOM analysis
5. **Quality Control**: Track maintenance and breakdown events (Arıza-Bakım)
6. **Shipping Management**: Manage shipments (Sevkiyat) and delivery tracking

### Target Users

- Production managers
- Machine operators
- Inventory controllers
- Quality assurance personnel
- Management and reporting staff

### Scope

The system covers the complete production lifecycle from:
- **Planning**: Work order creation, production scheduling, BOM management
- **Execution**: Machine assignment, progress tracking, status updates
- **Quality**: Maintenance tracking, breakdown recording
- **Delivery**: Shipping management, documentation, reporting

---

## Key Features

### Manufacturing Modules

#### İş Emirleri (Work Orders)
- Create, manage, and track production work orders
- Assign work orders to machines/workstations
- Real-time status updates (waiting, in-progress, completed)
- Priority management (low, normal, high, urgent)
- Delivery date tracking and alerts

#### Tezgahlar (Workstations/Machines)
- Real-time machine status monitoring
- Workstation capacity planning
- Historical performance tracking
- ESP32-based hardware integration for live status
- Mobile-optimized interface for shop floor

#### Parçalar (Parts Catalog)
- Comprehensive parts database
- Technical drawing management (OCR text extraction)
- Photo documentation with fallback handling
- Cost tracking (procurement, internal manufacturing)
- Stock level management with critical alerts

#### Üretim Planı (Production Planning)
Two planning systems available:

**Main System (Complex)**
- BOM-based production planning
- Machine capacity integration
- Critical stock analysis
- Excel import with smart material matching
- Multiple planning modes: machine-based, custom list, mixed

**V2 System (Simplified)**
- JSON-based work order lists
- Lightweight planning interface
- Direct work order management

#### BOM Yönetimi (Bill of Materials)
- Hierarchical BOM structure
- Cost calculation per BOM level
- Material requirement planning
- Integration with stock management

### Operational Modules

#### Fason İşler (Subcontracting)
- Subcontractor work management
- Quote comparison and approval
- Delivery tracking
- Cost analysis

#### Sevkiyat (Shipping)
- Shipping order management
- Image documentation
- Delivery tracking
- QR code support

#### Stok Kartları (Inventory Cards)
- Raw material inventory
- Stock level monitoring
- Critical stock alerts
- Supplier information

#### Arıza-Bakım (Maintenance & Breakdown)
- Equipment breakdown tracking
- Maintenance scheduling
- Repair history
- Downtime analysis

#### Notlar (Notes System)
- Categorized notes
- Tag-based organization
- Rich text content
- User assignments

### Reporting & Analytics

#### Raporlar (Reports)
- Production statistics
- Machine performance reports
- Part-based work order reports
- Custom report generation
- Export to Excel/PDF

#### Vardiya Yönetimi (Shift Management)
- Shift scheduling
- Personnel assignment
- Performance tracking per shift

#### Dashboard
- Real-time production overview
- Key performance indicators (KPIs)
- Visual charts and graphs
- Mobile-optimized views

---

## Technology Stack

### Backend

**Core Framework**
- **Node.js** v18+ - JavaScript runtime
- **Express.js** v4.18 - Web framework
- **SQLite** with **Sequelize ORM** - Database

**Key Dependencies**
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.37.5",
  "socket.io": "^4.7.2",
  "helmet": "^7.1.0",
  "compression": "^1.7.4",
  "multer": "^2.0.1",
  "xlsx": "^0.18.5",
  "joi": "^17.11.0",
  "winston": "^3.11.0",
  "sharp": "^0.32.6",
  "tesseract.js": "^4.1.4",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "umzug": "^3.8.2"
}
```

**Features**
- RESTful API endpoints
- Real-time updates via Socket.IO
- File upload handling (100MB limit)
- Image processing with Sharp
- OCR for technical drawings
- Winston logging
- Database migrations with Umzug

### Frontend

**Core Framework**
- **React** v18.2 - UI library
- **Vite** v5.0 - Build tool
- **Material-UI** (MUI) v5.17 - Component library

**State Management & Routing**
```json
{
  "@reduxjs/toolkit": "^2.0.1",
  "react-redux": "^9.0.2",
  "react-router-dom": "^6.20.1"
}
```

**Key Dependencies**
```json
{
  "@mui/material": "^5.17.1",
  "@mui/icons-material": "^5.17.1",
  "@mui/x-data-grid": "^6.18.4",
  "@hello-pangea/dnd": "^18.0.1",
  "axios": "^1.9.0",
  "socket.io-client": "^4.7.2",
  "chart.js": "^4.4.9",
  "react-chartjs-2": "^5.2.0",
  "react-pdf": "^7.7.2",
  "formik": "^2.4.6",
  "yup": "^1.6.1",
  "xlsx": "^0.18.5"
}
```

**Features**
- Responsive design (mobile/desktop)
- Material-UI theming
- Drag-and-drop functionality
- Real-time data updates
- PDF viewing
- Chart visualizations
- Form validation

### CNC Panel Hardware (ESP32)

**Platform**
- **ESP32** microcontroller
- **PlatformIO** build system

**Dependencies**
```cpp
WiFi - Wireless connectivity
HTTPClient - HTTP communication
ArduinoJson - JSON parsing
```

**Purpose**
- Real-time CNC machine monitoring
- Status reporting via Wi-Fi
- Integration with workstation module

### Python CAD Tools

#### STEP_BOM_Analyzer
- FreeCAD integration
- STEP file BOM extraction
- 3D rendering and thumbnail generation
- Export: JSON, Excel, CSV, XML

#### CAD_Import_Client
- SolidWorks COM automation
- Batch thumbnail generation
- Real-time server communication
- Windows-only (requires SolidWorks)

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Desktop (React)              Mobile (React)               │
│  - Material-UI                - Touch-optimized            │
│  - Full features              - Shop floor focus           │
│  - Data tables                - QR scanner                 │
│  - Complex forms              - Camera capture             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ HTTP/WebSocket
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                     BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Express.js Server (Port 3000)                              │
│  ├── REST API Routes                                        │
│  ├── Socket.IO Real-time Updates                            │
│  ├── File Upload/Download                                   │
│  ├── Winston Logging                                        │
│  └── Middleware (CORS, Helmet, Compression)                 │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Controllers                                 │
│  ├── Work Orders                                            │
│  ├── Machines/Workstations                                  │
│  ├── Parts & Inventory                                      │
│  ├── Production Planning                                    │
│  ├── Shipping                                              │
│  └── Reporting                                             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ Sequelize ORM
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                    DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  SQLite Database (database.sqlite)                          │
│  ├── 40+ Tables                                             │
│  ├── Relations & Associations                              │
│  └── Migrations (Umzug)                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                        │
├─────────────────────────────────────────────────────────────┤
│  CNC Panel (ESP32)          CAD Tools (Python)              │
│  ├── Wi-Fi Status           ├── STEP_BOM_Analyzer           │
│  └── Real-time updates      └── CAD_Import_Client           │
└─────────────────────────────────────────────────────────────┘
```

### Communication Flow

**Real-time Updates**
```
Client Action → Socket.IO Emit → Server Broadcast → All Clients Update
```

**API Requests**
```
Client → HTTP Request → Express Route → Controller → Sequelize → Database
                                                              ↓
Response ← JSON Serialize ← Controller ← Query Result ← Database
```

**File Uploads**
```
Client → Multer Middleware → Sharp Processing → File Storage → DB Path
```

---

## Project Structure

### Root Directory
```
URTMtakip/
├── backend/              # Express.js backend server
├── frontend/             # React Vite frontend
├── CNC_panel/            # ESP32 firmware
├── STEP_BOM_Analyzer/    # Python CAD tool
├── CAD_Import_Client/    # Python SolidWorks tool
├── docs/                 # Documentation (this directory)
├── backend.sqlite*       # SQLite database files
├── package.json          # Root package scripts
├── pm2.config.json       # PM2 production config
├── nginx-config.conf     # Nginx reverse proxy config
└── CLAUDE.md            # Project instructions for AI
```

### Backend Structure
```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Sequelize connection
│   │   └── *.js          # Other configs
│   ├── controllers/      # Business logic (40+ files)
│   │   ├── isEmirleriController.js
│   │   ├── tezgahController.js
│   │   └── ...
│   ├── routes/           # API routes (60+ files)
│   │   ├── isEmirleriRoutes.js
│   │   ├── tezgahRoutes.js
│   │   └── ...
│   ├── models/           # Sequelize models (40+ files)
│   │   ├── IsEmri.js
│   │   ├── Parca.js
│   │   ├── Tezgah.js
│   │   └── index.js      # Model registry
│   ├── middleware/       # Custom middleware
│   │   ├── socket.js
│   │   └── teknikResimUpload.js
│   ├── migrations/       # DB migrations
│   │   ├── 20240912000001-*.js
│   │   └── ...
│   ├── services/         # Business services
│   │   └── shipmentAutomationService.js
│   ├── socket/           # Socket.IO namespaces
│   │   └── namespaces/
│   ├── modules/          # Modular architecture
│   │   └── makinalar/    # New machine module
│   ├── uploads/          # File upload storage
│   ├── importlar/        # Import file storage
│   └── index.js          # Entry point
├── database.sqlite*      # SQLite database files
├── error.log            # Error logs
├── combined.log         # Combined logs
└── package.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── api/              # API client modules
│   ├── components/       # Reusable components (100+ files)
│   │   ├── mobile/       # Mobile-specific components
│   │   ├── Notlar/       # Notes module
│   │   ├── ParcaTakipListeleri/
│   │   ├── StokTakipListeleri/
│   │   ├── UretimPlani/  # Production planning components
│   │   ├── VardiyaYonetimi/
│   │   ├── Raporlar/
│   │   └── *.jsx         # Other components
│   ├── pages/            # Page components (50+ files)
│   │   ├── mobile/       # Mobile pages
│   │   ├── Raporlar/
│   │   ├── ArizaBakim/
│   │   ├── yonetimsel/
│   │   └── *.jsx         # Other pages
│   ├── store/            # Redux store
│   │   └── *.js          # Redux slices
│   ├── hooks/            # Custom React hooks
│   │   └── useDeviceDetect.js
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── theme.js          # Desktop MUI theme
│   ├── theme.mobile.js   # Mobile MUI theme
│   └── App.jsx           # Main app component
├── public/
│   └── uploads/          # Public file storage
└── package.json
```

### CNC Panel Structure
```
CNC_panel/
├── include/              # C header files
│   └── config.h          # WiFi configuration
├── src/                  # C source files
├── lib/                  # PlatformIO libraries
├── platformio.ini        # Build configuration
└── README.md
```

---

## System Modules

### Core Manufacturing Modules

| Module | Turkish Name | Description | Database Tables |
|--------|--------------|-------------|-----------------|
| Work Orders | İş Emirleri | Production order tracking | is_emirleri, is_emri_ozet |
| Workstations | Tezgahlar | Machine management | tezgahlar, tezgah_durum_log |
| Parts | Parçalar | Parts catalog | parcalar, parca_kayitlari |
| Production Planning | Üretim Planı | Production planning | uretim_plani, uretim_planlari |
| BOM | BOM Yönetimi | Bill of materials | boms |
| Inventory | Stok Kartları | Stock management | stok_kartlari |

### Operational Modules

| Module | Turkish Name | Description | Database Tables |
|--------|--------------|-------------|-----------------|
| Subcontracting | Fason İşler | Subcontractor work | fason, fason_grup, fason_is_emri |
| Shipping | Sevkiyat | Shipping management | sevkiyat, sevkiyat_detay |
| Maintenance | Arıza-Bakım | Maintenance tracking | ariza_bakim |
| Notes | Notlar | Notes system | notlar, not_kategorileri |
| Shifts | Vardiya | Shift management | vardiya, personel, vardiya_atama |

### Supporting Modules

| Module | Turkish Name | Description | Database Tables |
|--------|--------------|-------------|-----------------|
| Groups | Gruplar | Part grouping | gruplar |
| Invoices | Faturalar | Invoice management | faturalar, fatura_kalemleri |
| Delivery Notes | İrsaliyeler | Delivery notes | irsaliyeler, irsaliye_kalemleri |
| Suppliers | Tedarik | Supplier management | tedarik_talebi, tedarik_detay, firmalar |
| Reports | Raporlar | Reporting | Multiple views |

---

## Development Environment

### Required Tools

**Core Development**
- Node.js v18+ and npm
- Git
- SQLite3

**IDE/Editor**
- VS Code (recommended)
- WebStorm (alternative)

**Backend Development**
- nodemon (auto-restart)
- Jest (testing)

**Frontend Development**
- Vite (dev server)
- Vitest (testing)

**Embedded Development (ESP32)**
- PlatformIO
- ESP32 development board
- USB programming cable

**Python CAD Tools**
- Python 3.8+
- FreeCAD (STEP_BOM_Analyzer)
- SolidWorks (CAD_Import_Client, Windows only)

### Environment Setup

**1. Clone Repository**
```bash
git clone <repository-url>
cd URTMtakip
```

**2. Install Dependencies**
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

**3. Start Development Servers**
```bash
# Start both backend and frontend concurrently
npm run dev

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

**4. Database Setup**
```bash
cd backend
npm run migrate  # Run database migrations
```

### Port Configuration

**IMPORTANT:** The project uses fixed ports for development:

| Service | Port | Notes |
|---------|------|-------|
| Backend | 3000 | Default, configurable via PORT env var |
| Frontend | 5173 | Fixed, kills existing process if occupied |

**Port Policy:**
- Always use port 5173 for frontend
- Always use port 3000 for backend
- If port is occupied, the system will kill the process and use the port

### Development Scripts

**Root Level**
```bash
npm run dev              # Start both backend + frontend
npm run start            # Start production servers
npm run build            # Build frontend for production
npm test                 # Run backend tests
npm run test:frontend    # Run frontend tests
npm run clean:all        # Clean all node_modules
npm run stop             # Stop all Node processes (Windows)
npm run restart          # Quick restart
npm run restart:npm      # NPM-based restart with delay
```

**Backend Only**
```bash
cd backend
npm run dev              # Development with nodemon
npm start                # Production server
npm test                 # Run Jest tests
npm run migrate          # Run migrations
```

**Frontend Only**
```bash
cd frontend
npm run dev              # Vite dev server on port 5173
npm run build            # Build for production
npm test                 # Run Vitest tests
```

### Environment Variables

Create `.env` file in backend directory:

```env
NODE_ENV=development
PORT=3000
# JWT_SECRET=your-secret-key
# DB_PATH=./database.sqlite
```

---

## Related Documentation

- [API Documentation](./API.md) - Complete API endpoint reference
- [Database Schema](./DATABASE.md) - Database tables and relationships
- [Component Structure](./COMPONENTS.md) - Frontend component hierarchy
- [Development Guide](./DEVELOPMENT.md) - Development workflows and procedures

---

## License

This project is proprietary software. All rights reserved.

## Support

For technical support, contact the development team.
