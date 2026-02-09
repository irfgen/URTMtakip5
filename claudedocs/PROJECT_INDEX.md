# ÜRTM Takip Sistemi - Project Documentation Index

> Comprehensive Production Tracking System for Manufacturing Environments
> Version: v16.3 | Last Updated: 2025-02-04

## Quick Navigation

| Document | Description | Link |
|----------|-------------|------|
| **Architecture Overview** | System architecture and component integration | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Backend Documentation** | Express.js + SQLite backend API and services | [BACKEND.md](BACKEND.md) |
| **Frontend Documentation** | React + Vite frontend with Material-UI | [FRONTEND.md](FRONTEND.md) |
| **Database Schema** | Complete database models and relationships | [DATABASE.md](DATABASE.md) |
| **API Reference** | All API endpoints with examples | [API_REFERENCE.md](API_REFERENCE.md) |
| **Hardware Integration** | ESP32 CNC Panel and CAD tools | [HARDWARE.md](HARDWARE.md) |
| **Development Guide** | Setup, development, and deployment | [DEVELOPMENT.md](DEVELOPMENT.md) |
| **🆕 İrsaliye Analizi** | Hybrid AI-powered invoice analysis system | [IRSALIYE_ANALIZ.md](IRSALIYE_ANALIZ.md) |

## Project Structure

```
URTMtakip/
├── backend/                    # Express.js + SQLite Backend
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Business logic (40+ controllers)
│   │   ├── models/            # Sequelize models (50+ models)
│   │   ├── routes/            # API endpoints (60+ routes)
│   │   ├── services/          # Business services
│   │   │   └── irsaliye/       # 🆕 Hybrid invoice analysis services
│   │   ├── middleware/        # Express middleware
│   │   ├── socket/            # Socket.IO namespaces
│   │   └── index.js           # Application entry point
│   ├── uploads/               # File upload storage
│   ├── importlar/             # Import files
│   └── database.sqlite        # SQLite database
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   │   ├── mobile/        # Mobile-specific pages
│   │   │   └── yonetimsel/    # Administrative pages
│   │   ├── store/             # Redux store
│   │   ├── services/          # API and socket services
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Application entry
│   ├── public/
│   │   └── uploads/           # Static file serving
│   └── vite.config.js         # Vite configuration
│
├── CNC_panel/                  # ESP32 Hardware Project
│   ├── src/                   # ESP32 firmware
│   ├── include/               # Header files
│   ├── lib/                   # PlatformIO libraries
│   └── platformio.ini         # PlatformIO configuration
│
├── STEP_BOM_Analyzer/          # Python CAD Tool
│   ├── core/                  # BOM extraction logic
│   ├── gui/                   # PyQt interface
│   ├── api/                   # API integration
│   └── utils/                 # Utilities
│
├── CAD_Import_Client/          # Python SolidWorks Client
│   ├── core/                  # SolidWorks COM API
│   ├── gui/                   # PyQt interface
│   └── utils/                 # Configuration
│
├── DizinTarama_Client/         # C# Directory Scanner
│   └── DZNTRM_cs/             # Source code
│
└── claudedocs/                 # This documentation
```

## System Components

### 1. Backend (Port 3000)
- **Framework**: Express.js 4.18.2
- **Database**: SQLite with Sequelize ORM
- **Real-time**: Socket.IO 4.7.2
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer with 100MB limit
- **Logging**: Winston
- **Security**: Helmet, compression, rate limiting

### 2. Frontend (Port 5173)
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.6
- **UI Library**: Material-UI 5.17.1
- **State**: Redux Toolkit 2.0.1
- **Routing**: React Router 6.20.1
- **Real-time**: Socket.IO Client 4.7.2
- **Charts**: Chart.js + React Chart.js 2
- **Forms**: Formik + Yup

### 3. CNC Panel (ESP32)
- **Platform**: ESP32 with PlatformIO
- **Communication**: Wi-Fi + HTTP
- **Libraries**: WiFi, HTTPClient, ArduinoJson
- **Status Codes**: 0 (idle), 1 (running), 2 (error)

### 4. Python CAD Tools
- **STEP_BOM_Analyzer**: FreeCAD-based STEP file processing
- **CAD_Import_Client**: SolidWorks COM automation
- **Dependencies**: PyQt5, requests, numpy, trimesh

## Key Modules

| Module | Description | Backend | Frontend |
|--------|-------------|---------|----------|
| İş Emirleri | Work order management | ✅ | ✅ |
| Tezgahlar | Workstation monitoring | ✅ | ✅ |
| Parcalar | Parts catalog with BOM | ✅ | ✅ |
| Üretim Planı | Production planning (dual system) | ✅ | ✅ |
| Stok Kartları | Inventory management | ✅ | ✅ |
| Fason İşler | Subcontractor work | ✅ | ✅ |
| Sevkiyat | Shipping management | ✅ | ✅ |
| Arıza-Bakım | Maintenance tracking | ✅ | ✅ |
| Makindex | Hierarchical BOM system | ✅ | ✅ |
| Fatura/İrsaliye | Invoice/waybill matching | ✅ | ✅ |
| **İrsaliye Analizi V2** | **Hybrid AI document analysis** | **✅** | **✅** |
| Uygunsuzluk | Non-conformance reports | ✅ | ✅ |
| Vardiya | Shift management | ✅ | ✅ |

## Development Commands

```bash
# Full application
npm run install:all          # Install all dependencies
npm run dev                  # Start development (backend + frontend)
npm run build                # Build frontend for production
npm run start                # Start production servers

# Backend only
cd backend
npm run dev                  # Start with nodemon (port 3000)
npm start                    # Start production server
npm test                     # Run Jest tests
npm run migrate              # Run database migrations

# Frontend only
cd frontend
npm run dev                  # Start Vite dev server (port 5173)
npm run build                # Build for production
npm test                     # Run Vitest tests

# CNC Panel (ESP32)
cd CNC_panel
pio run                      # Build firmware
pio run -t upload            # Upload to device
pio device monitor           # Monitor serial output

# Python Tools
cd STEP_BOM_Analyzer
python main.py               # Launch STEP BOM Analyzer

cd CAD_Import_Client
python main.py               # Launch CAD Import Client
```

## Technology Stack Summary

| Category | Technology | Version |
|----------|-----------|---------|
| Backend | Node.js, Express.js | 18+, 4.18.2 |
| Database | SQLite | 3 |
| ORM | Sequelize | 6.37.5 |
| Real-time | Socket.IO | 4.7.2 |
| Frontend | React, Vite | 18.2.0, 5.0.6 |
| UI Framework | Material-UI | 5.17.1 |
| State Management | Redux Toolkit | 2.0.1 |
| Hardware | ESP32, PlatformIO | - |
| Python | 3.8+ | - |
| CAD Tools | FreeCAD, SolidWorks | - |

## Key Features

1. **Dual Production Planning**: Main system (BOM-based) + V2 (JSON-based)
2. **Real-time Updates**: Socket.IO for live data synchronization
3. **Mobile Support**: Responsive design with dedicated mobile layouts
4. **CAD Integration**: STEP file processing and SolidWorks automation
5. **Hardware Monitoring**: ESP32-based CNC status reporting
6. **Comprehensive Reports**: Production, performance, and custom reports
7. **File Management**: Upload, processing, and OCR for technical drawings
8. **Multi-language Support**: Turkish interface (primary)
9. **🆕 Hybrid İrsaliye Analizi**: Rule-based OCR + AI-powered document analysis (n8n replacement)

## Documentation Standards

- **File References**: Use relative markdown links
- **Code Examples**: Provide functional examples
- **API Documentation**: Include request/response examples
- **Database Docs**: Show relationships and constraints
- **Cross-References**: Link between related modules

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v16.3 | 2025-02-04 | Current - Full system documentation |
| v16.x | 2024-2025 | Ongoing development and feature additions |
| v13.x | 2024 | Previous stable release |

## Support & Contribution

For issues, questions, or contributions:
- Main repository: /home/irgat11/URTMtakip
- Documentation: claudedocs/
- Issue tracking: See project management tools
