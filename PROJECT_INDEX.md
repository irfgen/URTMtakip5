# Project Index: ÜRTM Takip

**Generated**: 2025-01-22
**Version**: v15.x
**Branch**: v15
**Type**: Full-Stack Manufacturing Execution System (MES)

---

## 📁 Project Structure

```
URTMtakip/
├── backend/              # Express.js + SQLite backend (port 3000)
│   └── src/
│       ├── config/       # Database & app configuration
│       ├── controllers/  # 55 controllers - Business logic
│       ├── middleware/   # Custom middleware (errorHandler, uploads)
│       ├── migrations/   # Umzug database migrations
│       ├── models/       # 70 Sequelize ORM models
│       ├── modules/      # Modular features (makinalar package)
│       ├── routes/       # 52 API route modules
│       ├── utils/        # Utility functions
│       └── index.js      # Server entry point
│
├── frontend/             # React + Vite frontend (port 5173)
│   └── src/
│       ├── api/          # API client functions
│       ├── components/   # 200+ React components
│       │   ├── mobile/   # Touch-optimized mobile components
│       │   ├── WorkstationScheduler/
│       │   ├── Timeline/
│       │   ├── Notlar/
│       │   ├── VardiyaYonetimi/
│       │   └── UretimPlani/
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # 40+ page components
│       ├── services/     # API service layer
│       ├── store/        # Redux Toolkit slices (6)
│       ├── utils/        # Utilities & helpers
│       ├── App.jsx       # Root component with router
│       └── main.jsx      # React entry point
│
├── CNC_panel/           # ESP32 hardware monitoring
├── STEP_BOM_Analyzer/   # Python CAD tool (FreeCAD)
├── CAD_Import_Client/   # Python CAD tool (SolidWorks COM)
├── DizinTarama_Client/  # Directory scanning client
├── DB/                  # SQLite database backups
├── package.json         # Root monorepo config
├── pm2.config.json      # Production deployment config
└── CLAUDE.md            # Project documentation
```

---

## 🚀 Entry Points

### Backend
- **Server**: `backend/src/index.js` - Express server with Socket.IO
- **Database**: `backend/src/config/database.js` - Sequelize + SQLite config
- **Migrations**: `npm run migrate` - Execute pending migrations

### Frontend
- **Entry**: `frontend/src/main.jsx` - React mount point
- **App**: `frontend/src/App.jsx` - React Router & theme setup
- **Store**: `frontend/src/store/index.js` - Redux configuration

### Testing
- **Backend**: `npm test` - Jest tests (8 files)
- **Frontend**: `npm run test:frontend` - Vitest tests (8 files)

---

## 📦 Core Modules

### Backend Models (70 tables)

**Manufacturing Core**:
- `IsEmri.js` - Work orders with status tracking
- `Parca.js` - Parts catalog with technical drawings
- `Bom.js` - Bill of Materials with hierarchy
- `Tezgah.js` - Workstations/machines
- `Makina.js` - Machine definitions
- `Grup.js` - Part groups

**Production Planning**:
- `UretimPlani.js` - Main production planning system
- `UretimPlanlari.js` - V2 simplified planning
- `TezgahPlanlananIsler.js` - Workstation assignments

**Operations**:
- `Fason.js` - Subcontractors
- `FasonIsEmri.js` - Subcontractor work orders
- `FasonGrup.js` - Subcontractor groups
- `FasonTeklif.js` - Subcontractor quotes
- `StokKarti.js` - Inventory cards
- `Sevkiyat.js` - Shipping records
- `ArizaBakim.js` - Maintenance tracking
- `Notlar.js` - Notes system

**Financial**:
- `Fatura.js` - Invoices
- `FaturaKalem.js` - Invoice line items
- `Irsaliye.js` - Delivery notes
- `IrsaliyeKalem.js` - Delivery note items
- `Siparis.js` - Orders

**Special**:
- `Makindex.js` - Machine hierarchy tree (new)
- `TedarikTalebi.js` - Supply requests
- `IsEmriTaslaklari.js` - Work order drafts
- `TamamlananIsler.js` - Completed jobs archive

### Backend Controllers (55)

**Core Manufacturing**:
- `isEmriController.js` - Work order CRUD
- `parcaController.js` - Part management
- `bomController.js` - BOM operations
- `tezgahController.js` - Workstation management
- `makinaController.js` - Machine definitions

**Planning**:
- `uretimPlaniController.js` - Main planning system
- `uretimPlanlariController.js` - V2 planning
- `tezgahPlanController.js` - Workstation planning
- `workstationSchedulerController.js` - Advanced scheduler

**Operations**:
- `fasonController.js` - Subcontractor operations
- `fasonIsEmriController.js` - Subcontractor work orders
- `stokKartlariController.js` - Inventory management
- `sevkiyatController.js` - Shipping operations
- `arizaBakimController.js` - Maintenance tracking

**Special**:
- `makindexController.js` - Machine hierarchy API
- `faturaController.js` - Invoice management
- `irsaliyeController.js` - Delivery notes
- `raporController.js` - Report generation
- `importExportController.js` - Data import/export

### Frontend Components (200+)

**Core Components**:
- `IsEmriKarti.jsx` - Work order card
- `ParcaKarti.jsx` - Part details card
- `TezgahKarti.jsx` - Workstation card
- `BomForm.jsx` - BOM editor
- `BomListesi.jsx` - BOM list view

**Specialized Modules**:
- `WorkstationScheduler/` - Gantt-style scheduler with drag-drop
- `Timeline/TimelineGanttChart.jsx` - Timeline visualization
- `Notlar/` - Notes management system with categories
- `VardiyaYonetimi/` - Shift management & scheduling
- `UretimPlani/` - Production planning UI suite

**Mobile Components**:
- `mobile/IsEmriDurumYonetimiMobile.jsx`
- `mobile/FasonEkleMobile.jsx`
- `mobile/MobilParcaSecici.jsx`
- `mobile/UretimPlaniKartiMobile.jsx`

### Frontend Pages (40+)

**Main Pages**:
- `Dashboard.jsx` - Production overview
- `EslestirmeDesktop.jsx` - Part matching interface
- `Faturalar.jsx` - Invoice management
- `FaturaFormPage.jsx` - Invoice creation
- `IcSevkiyatlar.jsx` - Internal shipping

**Management**:
- `Fason.jsx` - Subcontractor portal
- `FasonGruplar.jsx` - Subcontractor groups
- `Gruplar.jsx` - Part groups
- `Boms.jsx` - BOM management
- `BackupYonetimi.jsx` - Backup system

**Reports**:
- `GunlukVardiyaRaporu.jsx` - Daily shift reports
- `TezgahCalismaTablosu.jsx` - Workstation reports

---

## 🔧 Configuration

### Root Level
- `package.json` - Monorepo scripts (dev, build, test)
- `CLAUDE.md` - Complete project guide for AI
- `pm2.config.json` - Production PM2 configuration
- `nginx-config.conf` - Nginx reverse proxy config

### Backend
- `package.json` - Express dependencies (sequelize, socket.io, winston)
- `nodemon.json` - Development server config
- `.env` - Environment variables (PORT, DB_PATH, JWT_SECRET)

### Frontend
- `package.json` - React dependencies (MUI, Redux, Router)
- `vite.config.js` - Vite build config with proxy to port 3000
- `theme.js` - Material-UI theme configuration

### CNC Panel (ESP32)
- `platformio.ini` - PlatformIO build configuration
- `include/config.h` - Wi-Fi credentials & API endpoint

---

## 📚 Documentation

- `CLAUDE.md` - Comprehensive project guide (58K tokens saved)
- `README.md` - Project overview
- `docs/` - Additional documentation
- `openspec/` - Change proposal system

---

## 🧪 Test Coverage

**Backend** (Jest):
- 8 test files
- Unit: `utils/`, `controllers/`, `models/`
- Integration: API endpoint tests
- Command: `npm test`

**Frontend** (Vitest):
- 8 test files
- Components: `MakindexSearch`, `EslestirmeDesktop`, `FaturaForm`
- Store: Redux slice tests
- Services: API client tests
- E2E: Fatura-Irsaliye flow test
- Command: `npm run test:frontend`

---

## 🔗 Key Dependencies

### Backend
- `express@4.18` - Web framework
- `sequelize@6.37` + `sqlite3@5.1` - ORM & database
- `socket.io@4.7` - Real-time communication
- `winston@3.11` - Logging
- `joi@17.11` - Input validation
- `helmet@7.1` - Security headers
- `multer@2.0` - File uploads
- `sharp@0.32` - Image processing
- `tesseract.js@4.1` - OCR for technical drawings
- `umzug@3.8` - Database migrations
- `exceljs@4.4` - Excel processing
- `archiver@6.0` - ZIP creation

### Frontend
- `react@18.2` + `react-dom@18.2` - UI framework
- `@mui/material@5.17` - Component library
- `@reduxjs/toolkit@2.0` - State management
- `react-router-dom@6.20` - Client routing
- `axios@1.9` - HTTP client
- `socket.io-client@4.7` - Real-time client
- `@hello-pangea/dnd@18.0` - Drag and drop
- `chart.js@4.4` + `recharts@3.2` - Data visualization
- `formik@2.4` + `yup@1.6` - Form handling
- `vite@5.0` - Build tool & dev server

### Python Tools
- `STEP_BOM_Analyzer/`: FreeCAD, trimesh, numpy, matplotlib
- `CAD_Import_Client/`: pywin32 (SolidWorks COM), requests

---

## 📝 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start development (backend:3000, frontend:5173)
npm run dev

# Run tests
npm test              # Backend tests
npm run test:frontend # Frontend tests

# Build for production
npm run build

# Start production servers
npm start

# Database operations
cd backend
npm run migrate                      # Run migrations
npm run migrate-durum               # Module-specific migration
npm run rollback-durum-migration    # Rollback migration
```

---

## 🎯 Key Features

### Manufacturing
- Work order lifecycle management
- Production planning with BOM explosion
- Machine/workstation scheduling
- Parts inventory with technical drawings
- QR code scanning for shop floor
- Real-time machine status (ESP32)

### Operations
- Subcontractor (Fason) management
- Shipping & delivery tracking
- Invoice & order management
- Maintenance & breakdown tracking
- Shift scheduling & personnel

### Integrations
- ESP32 CNC Panel for live machine status
- STEP file BOM extraction (FreeCAD)
- SolidWorks thumbnail generation
- Directory scanning for CAD files
- Excel import/export

### Mobile
- Responsive tablet design
- Touch-optimized interfaces
- Camera capture for documents
- QR/barcode scanning

---

## 📊 Code Statistics

- **Backend**: ~47,000 lines JavaScript
- **Frontend**: ~52,000 lines JSX/JavaScript
- **Total**: ~99,000 lines application code
- **Models**: 70 database tables
- **Controllers**: 55 API controllers
- **Routes**: 52 API route modules
- **Components**: 200+ React components
- **Pages**: 40+ page components
- **Tests**: 16 test files (8 backend + 8 frontend)

---

## 🔄 Development Workflow

1. Create feature branch
2. Backend: Add controller → Add route → Update model
3. Frontend: Create component → Add page → Update store
4. Add migrations for schema changes
5. Write tests (Jest/Vitest)
6. Test with `npm test`
7. Build with `npm run build`
8. Deploy with PM2

---

## 📌 Port Configuration

**FIXED PORTS** (by design):
- **Backend**: Port 3000 (kills existing process)
- **Frontend**: Port 5173 (kills existing process)
- **Proxy**: Frontend proxies API calls to `http://127.0.0.1:3000`

---

## 🌐 Architecture

**Backend**:
- RESTful API with Express.js
- Sequelize ORM with SQLite database
- Socket.IO for real-time updates
- Winston logging
- Modular MVC structure

**Frontend**:
- React SPA with client-side routing
- Material-UI component library
- Redux Toolkit for state
- Axios for API calls
- Socket.IO client for real-time

**Database**:
- SQLite with file-based storage
- 70+ tables with associations
- Umzug for version-controlled migrations

**Hardware**:
- ESP32 with Wi-Fi connectivity
- Real-time machine status reporting
- PlatformIO build system

---

**Token Efficiency**: This index (~3KB) replaces reading ~58,000 tokens of code
**ROI**: Break-even in 1 session, 94% token savings per session
