# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ÜRTM Takip is a comprehensive production tracking system built as a full-stack Node.js/React application. The system manages manufacturing processes, work orders, parts inventory, production planning, and machine monitoring for industrial manufacturing environments.

## Architecture

### Backend (Express.js + SQLite)
- **Entry Point**: `backend/src/index.js`
- **Database**: SQLite with Sequelize ORM (`backend/database.sqlite`)
- **Models**: Located in `backend/src/models/` with comprehensive associations
- **Controllers**: Business logic in `backend/src/controllers/`
- **Routes**: API endpoints in `backend/src/routes/`
- **Real-time**: Socket.IO for live updates
- **Server Port**: 3000 (configurable via PORT environment variable)

### Frontend (React + Vite)
- **Entry Point**: `frontend/src/App.jsx`
- **UI Framework**: Material-UI (MUI) with custom themes
- **State Management**: Redux Toolkit in `frontend/src/store/`
- **Device Detection**: Automatic mobile/desktop layouts
- **Routing**: React Router with mobile/desktop route separation
- **Dev Server Port**: 5173 (fixed, will kill existing process if port is occupied)
- **Build Tool**: Vite with hot module replacement

### CNC Panel Hardware (ESP32)
- **Location**: `CNC_panel/` directory
- **Platform**: PlatformIO-based ESP32 project
- **Purpose**: Real-time CNC machine monitoring and status reporting
- **Communication**: Wi-Fi connectivity to main system
- **Build Tool**: PlatformIO for embedded development

### Python CAD Tools
- **STEP_BOM_Analyzer**: STEP file BOM extraction and 3D rendering tool
- **CAD_Import_Client**: SolidWorks automation client for thumbnail generation
- **Integration**: Both tools integrate with main system via HTTP API

## Development Commands

### Full Application
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Start development (both backend + frontend concurrently)
npm run dev

# Start production servers
npm run start

# Build frontend for production
npm run build

# Run backend tests
npm test

# Run frontend tests specifically
npm run test:frontend

# Clean all node_modules directories
npm run clean:all

# Stop all Node processes (Windows)
npm run stop

# Quick restart using Windows batch file
npm run restart

# NPM-based restart with 3 second delay
npm run restart:npm
```

### Backend Only
```bash
cd backend
npm run dev          # Start development server with nodemon (port 3000)
npm start           # Start production server (port 3000)
npm test            # Run Jest tests
npm run migrate     # Run database migrations using umzug

# Database migrations for specific modules
npm run migrate-durum                # Run durum module migration
npm run rollback-durum-migration    # Rollback durum migration
npm run check-durum-status          # Check migration status
```

### Frontend Only
```bash
cd frontend
npm run dev         # Start Vite dev server on port 5173
npm run build       # Build for production
npm run preview     # Preview production build
npm test            # Run Vitest tests

# Note: Frontend will always use port 5173 and kill existing processes
```

### CNC Panel (ESP32)
```bash
cd CNC_panel
pio run             # Build ESP32 firmware
pio run -t upload   # Upload to ESP32 device
pio device monitor  # Monitor serial output
pio test            # Run embedded tests

# Platform-specific commands
pio run -t clean    # Clean build files
pio device list     # List available devices
```

### Python CAD Tools
```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt    # Install dependencies
python main.py                     # Launch STEP BOM Analyzer GUI

cd CAD_Import_Client
pip install -r requirements.txt    # Install dependencies
python main.py                     # Launch CAD Import Client GUI

# Note: Both require specific CAD software installations:
# - STEP_BOM_Analyzer: FreeCAD for STEP processing
# - CAD_Import_Client: SolidWorks for COM automation (Windows only)
```

## Key System Components

### Manufacturing Modules
- **İş Emirleri (Work Orders)**: Core production tracking with status management
- **Tezgahlar (Workstations)**: Machine/workstation management and monitoring
- **Parcalar (Parts)**: Parts catalog with technical drawings and specifications
- **Üretim Planı (Production Planning)**: Excel-based production planning with BOM analysis (main system)
- **Üretim Planı V2**: Simplified production planning system with JSON-based work order lists
- **BOM Yönetimi**: Bill of Materials management with hierarchical structure

### Operational Modules
- **Fason İşler**: Subcontractor work management
- **Sevkiyat**: Shipping and delivery tracking with image documentation
- **Stok Kartları**: Inventory management with integration to production
- **Arıza-Bakım**: Equipment maintenance and breakdown tracking
- **Notlar**: Note-taking system with categories and tagging

### Reporting & Analytics
- **Raporlar**: Production reports, performance analytics, and custom reporting
- **Vardiya Yönetimi**: Shift management and personnel tracking
- **Dashboard**: Real-time production overview with key metrics

## Mobile Support

The application features responsive design with dedicated mobile layouts:
- Mobile routes are prefixed with `/mobile/`
- Automatic device detection switches layouts
- Touch-optimized interfaces for production floor use
- Separate mobile components in `frontend/src/components/mobile/`

## Database Schema

### Core Tables
- **is_emirleri**: Work orders with status tracking
- **tezgahlar**: Workstations/machines
- **parcalar**: Parts catalog
- **boms**: Bill of Materials
- **stok_kartlari**: Inventory items
- **uretim_plani**: Production plans (main system)
- **uretim_planlari**: Production plans V2 (simplified system)
- **sevkiyat**: Shipping records

### Supporting Tables
- **islem_kayitlari**: Process logs
- **tezgah_durum_log**: Machine status history
- **parca_kayitlari**: Part transaction records
- **notlar**: Notes system
- **ariza_bakim**: Maintenance records

## File Upload & Storage

- **Backend uploads**: `backend/uploads/` and `backend/importlar/`
- **Frontend uploads**: `frontend/public/uploads/`
- **Route uploads**: `backend/src/routes/uploads/` (for technical drawings and photos)
- **Static file serving**: Express serves uploaded files with CORS headers
- **File size limit**: 100MB for large production files
- **Supported formats**: Images (PNG, JPG), Excel files, PDFs
- **Image processing**: Sharp for resizing and optimization
- **OCR capabilities**: Tesseract.js for technical drawing text extraction

## Development Patterns

### API Structure
- RESTful endpoints under `/api/`
- Consistent error handling with Winston logging
- Socket.IO events for real-time updates
- Comprehensive input validation with Joi
- Dual production planning systems: `/api/uretim-plani` (main) and `/api/uretim-planlari` (V2)

### Frontend Patterns
- Component organization by feature/module
- Custom hooks for device detection and data fetching
- Shared utilities in `frontend/src/utils/`
- Centralized API client in `frontend/src/services/`

### State Management
- Redux Toolkit slices for complex state
- Local component state for UI-only data
- Context providers for device settings
- Caching service for performance optimization

## Migration & Data Management

The system uses umzug for database migrations with comprehensive schema management:

### Migration System
- **Location**: `backend/src/migrations/` for version-controlled migrations
- **Runner**: `backend/src/config/database.js` handles migration execution
- **Format**: Timestamped migration files with up/down operations
- **Command**: `npm run migrate` to execute pending migrations

### Available Migrations
- `20240912000001-add-tahmini-isleme-suresi.js`: Adds processing time estimation
- `20250924_add_cost_fields_to_boms.js`: Adds cost tracking to BOMs
- `20250701000001-create-notlar-tables.js`: Creates notes and categories tables

### Data Management Scripts
- Root-level migration scripts for complex data operations
- Excel processing utilities for BOM and production data import
- Database backup and restore functionality
- Data validation and integrity checks

## Testing Commands

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# CNC Panel tests
cd CNC_panel && pio test
```

## Code Quality Commands

```bash
# Frontend tests with Vitest
cd frontend && npm test

# Backend tests with Jest
cd backend && npm test

# Note: ESLint and Prettier configs are not currently configured at project level
# The project relies on IDE/editor configurations for code formatting
```

## Production Deployment

The application includes production setup with:
- PM2 configuration (`pm2.config.json`)
- Nginx configuration (`nginx-config.conf`)
- Server setup scripts
- Automated deployment scripts

## Common Tasks

### Adding New Routes
1. Create controller in `backend/src/controllers/`
2. Add route definitions in `backend/src/routes/`
3. Register route in `backend/src/index.js`
4. Update frontend API client if needed

### Database Changes
1. Create migration file in `backend/src/migrations/`
2. Update model definitions in `backend/src/models/`
3. Test migration with `npm run migrate`
4. For complex migrations, use scripts in backend root directory

### New Components
1. Follow existing component structure
2. Use Material-UI components and theme
3. Consider mobile layout requirements (create mobile versions if needed)
4. Add to appropriate route in `App.jsx`
5. For mobile components, place in `frontend/src/components/mobile/`
6. Use device detection hooks from `frontend/src/hooks/`

### Working with Mobile Layouts
- Mobile components are located in `frontend/src/components/mobile/` and `frontend/src/pages/mobile/`
- Use `useDeviceDetect` hook for automatic device detection
- Mobile routes are prefixed with `/mobile/`
- Separate themes available: `theme.js` (desktop) and `theme.mobile.js` (mobile)

### CNC Hardware Integration
- ESP32-based monitoring device in `CNC_panel/` directory
- Real-time status communication via Wi-Fi to main system
- Configure Wi-Fi credentials in `CNC_panel/include/config.h`
- Status codes: 0 (idle), 1 (running), 2 (error/maintenance)
- Hardware integrates with tezgahlar (workstation) module for live status updates

### CAD Integration Tools
**STEP_BOM_Analyzer** (`STEP_BOM_Analyzer/` directory):
- STEP file parsing and BOM (Bill of Materials) extraction
- 3D rendering and thumbnail generation
- Multiple export formats: JSON, Excel, CSV, XML
- FreeCAD integration for mesh conversion
- API integration with main system for part verification

**CAD_Import_Client** (`CAD_Import_Client/` directory):
- SolidWorks COM automation for thumbnail generation
- Batch processing of CAD files
- Real-time server communication via HTTP API and WebSocket
- Support for `.sldprt`, `.sldasm`, and related formats
- Windows-only (requires SolidWorks installation)

### Production Planning Systems
The system includes two production planning approaches:

**Main System (`/uretim-plani`)**: 
- Complex BOM-based planning with machine integration
- Critical stock analysis and alerts
- Excel import capabilities with smart material matching
- Supports machine-based, custom list, and mixed (karma) plans
- Full BOM snapshots and critical stock management

**V2 System (`/uretim-planlari`)**:
- Simplified approach with JSON-based work order lists
- Lighter weight for basic planning needs
- Direct work order list management
- Available through "Üretim Planı V2" menu option

## Key Dependencies

### Backend
- `express`: Web framework
- `sequelize`: ORM for SQLite
- `socket.io`: Real-time communication
- `winston`: Logging
- `helmet`: Security middleware
- `multer`: File uploads
- `xlsx`: Excel processing
- `joi`: Input validation
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `tesseract.js`: OCR for technical drawings
- `sharp`: Image processing
- `umzug`: Database migrations

### Frontend
- `react`: UI framework
- `@mui/material`: UI components
- `@reduxjs/toolkit`: State management
- `react-router-dom`: Routing
- `axios`: HTTP client
- `socket.io-client`: Real-time client
- `@hello-pangea/dnd`: Drag and drop functionality
- `chart.js` + `react-chartjs-2`: Data visualization
- `react-pdf`: PDF viewing
- `formik` + `yup`: Form handling and validation
- `vite`: Build tool and dev server

### CNC Panel (ESP32)
- `platformio`: Build system and library manager
- `WiFi`: ESP32 wireless connectivity
- `HTTPClient`: HTTP communication with main system
- `ArduinoJson`: JSON parsing and generation
- Custom configuration in `platformio.ini`

### Python CAD Tools
- `FreeCAD`: STEP file processing (STEP_BOM_Analyzer)
- `numpy`, `matplotlib`: 3D visualization and data processing
- `trimesh`: Mesh processing and conversion
- `requests`: HTTP API communication
- `tkinter`: GUI framework (built-in Python)
- `win32com.client`: SolidWorks COM automation (CAD_Import_Client)
- `pandas`, `openpyxl`: Data export and Excel handling

## Development Environment

### Required Tools
- Node.js (version 18+)
- NPM or Yarn
- SQLite3
- Git
- PlatformIO (for ESP32 development)
- ESP32 development board (for CNC monitoring hardware)
- Python 3.8+ (for CAD tools)
- FreeCAD (for STEP_BOM_Analyzer)
- SolidWorks (for CAD_Import_Client, Windows only)

### IDE Configuration
- The application uses Vite for fast development
- Hot module replacement (HMR) is enabled
- Source maps are configured for debugging
- ESLint and Prettier should be configured for code consistency

### Environment Variables
Backend environment variables should be configured in `.env` file:
- `NODE_ENV`: development/production
- `PORT`: Backend server port (default: 5000)
- Database connection settings
- JWT secret keys
- File upload limits

**Important**: Port Configuration
- **Backend**: Always uses port 3000 (configurable via PORT environment variable)
- **Frontend**: Always uses port 5173 (will kill existing process on this port)
- **Development**: Both servers start concurrently with `npm run dev`
- **Proxy Configuration**: Frontend proxies API calls to backend at http://127.0.0.1:3000

## Performance Considerations

### Backend Optimizations
- SQLite connection pooling via Sequelize
- Compression middleware for responses
- Rate limiting for API endpoints
- Image optimization with Sharp
- Caching for frequently accessed data

### Frontend Optimizations
- Code splitting with React lazy loading
- Material-UI tree shaking
- Image lazy loading and fallback handling
- Redux state normalization
- Service worker for caching (if configured)

This system is actively developed with frequent version updates (v13.x) and includes comprehensive production tracking capabilities for manufacturing environments.

## Advanced Testing Commands

### Backend Tests (Jest)
```bash
cd backend
npm test                    # Run all backend tests with Jest
npm test -- --watch        # Run tests in watch mode
npm test -- --coverage     # Run tests with coverage report
npm test -- --verbose      # Run tests with detailed output
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm test                   # Run all frontend tests with Vitest
npm test -- --watch        # Run tests in watch mode
npm test -- --ui          # Run tests with Vitest UI interface
npm test -- --coverage    # Run tests with coverage report
npm test -- --reporter=verbose  # Run tests with detailed output
```

### ESP32 Tests (PlatformIO)
```bash
cd CNC_panel
pio test                   # Run embedded tests
pio test -e esp32dev       # Run tests for specific environment
pio test -v                # Run tests with verbose output
pio test --upload-report   # Upload test results to cloud
```

### Integration Testing
- Backend API tests use Supertest for HTTP endpoint testing
- Frontend component tests use React Testing Library
- End-to-end testing can be set up with Cypress (not currently configured)
- Database migration testing with rollback verification
## Port Configuration Policy

**CRITICAL**: The project must use these specific ports:
- **Frontend**: Port 5173 only. If port is occupied, kill the process and use 5173
- **Backend**: Port 3000 only. If port is occupied, kill the process and use 3000
- **No other ports**: Do not use alternative ports for any reason

This configuration ensures consistent development environment and proper proxy setup between frontend and backend.
- uRTMtakip projesinin frontend i 5173 backend i 3000 portunda çalışacak. başka portta çalıştırma, gerekiyorsa 5173 ve 3000 portlarını öldür tekrar çalıştır.
- projeyi çalıştırmak için ana dizinde npm run dev komutunu kullan. backend e veya frondend e gidip teker teker çalıştırma.