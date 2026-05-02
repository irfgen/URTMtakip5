---
name: INTEGRATIONS.md
description: External services, APIs, databases, and third-party integrations
type: codebase
---

# External Integrations

## Database

### SQLite
- **Driver**: sqlite3 5.1.7
- **ORM**: Sequelize 6.37.5
- **Location**: `backend/database.sqlite`
- **Migrations**: umzug 3.8.2

## Hardware Integration

### ESP32 CNC Panel
- **Location**: `CNC_panel/`
- **Platform**: PlatformIO
- **Communication**: HTTP client to backend API
- **Status endpoint**: `/api/cnc-link/durum`

## Excel/File Processing

### xlsx Library
- **Purpose**: Excel import/export
- **Used in**: BOM import, production planning

### ExcelJS
- **Purpose**: Excel file generation
- **Used in**: Reports, exports

### Sharp
- **Purpose**: Image processing/resizing
- **Used in**: Uploaded image optimization

### Tesseract.js
- **Purpose**: OCR for technical drawings
- **Used in**: CAD file text extraction

## Python CAD Tools

### STEP_BOM_Analyzer
- **Location**: `STEP_BOM_Analyzer/`
- **Dependencies**: FreeCAD, numpy, matplotlib
- **Purpose**: STEP file parsing and BOM extraction

### CAD_Import_Client
- **Location**: `CAD_Import_Client/`
- **Dependencies**: SolidWorks COM automation (Windows only)
- **Purpose**: Thumbnail generation from CAD files

## Real-time Communication

### Socket.IO
- **Backend**: socket.io 4.7.2
- **Frontend**: socket.io-client 4.7.2
- **Events**: tezgah-durum, is-emri-guncelleme, stok-uyari

## No External APIs

This project currently does NOT integrate with:
- Cloud services (AWS, Azure, GCP)
- Payment processors
- Email services
- SMS services
- External authentication providers (OAuth, Auth0)

## Configuration

Environment variables in `backend/.env`:
- NODE_ENV
- PORT
- JWT_SECRET
- CORS_ORIGIN
- UPLOAD_MAX_SIZE