---
name: STACK.md
description: Technology stack, languages, frameworks, and dependencies
type: codebase
---

# Technology Stack

## Languages & Runtime

- **Node.js**: 18+ runtime
- **JavaScript**: ES6+ throughout
- **React**: 18.2.0 (frontend)

## Backend Stack

### Core Framework
- **Express.js**: 4.18.2 - Web framework
- **Socket.IO**: 4.7.2 - Real-time communication
- **Helmet**: 7.1.0 - Security headers

### Database
- **Sequelize**: 6.37.5 - ORM
- **SQLite3**: 5.1.7 - Database driver
- **umzug**: 3.8.2 - Migration management

### Authentication & Security
- **bcryptjs**: 2.4.3 - Password hashing
- **jsonwebtoken**: 9.0.2 - JWT tokens
- **express-rate-limit**: 6.11.2 - Rate limiting

### File & Media
- **multer**: 2.0.1 - File uploads
- **sharp**: 0.32.6 - Image processing
- **xlsx**: 0.18.5 - Excel processing
- **tesseract.js**: 4.1.4 - OCR for technical drawings

### Validation & Logging
- **joi**: 17.11.0 - Input validation
- **winston**: 3.11.0 - Logging

### Additional
- **axios**: 1.10.0 - HTTP client
- **exceljs**: 4.4.0 - Excel generation
- **qrcode**: 1.5.4 - QR code generation
- **node-cron**: 4.2.1 - Scheduled tasks

## Frontend Stack

### Core
- **React**: 18.2.0
- **React Router DOM**: 6.20.1
- **Redux Toolkit**: 2.0.1

### UI Framework
- **Material-UI (MUI)**: 5.17.1
- **@mui/x-data-grid**: 6.18.4 - Data tables
- **@mui/x-date-pickers**: 7.29.4 - Date pickers

### Charts & Visualization
- **chart.js**: 4.4.9
- **react-chartjs-2**: 5.2.0
- **recharts**: 3.2.1

### Forms & Validation
- **formik**: 2.4.6
- **yup**: 1.6.1

### Additional
- **socket.io-client**: 4.7.2
- **react-dropzone**: 14.3.8
- **@hello-pangea/dnd**: 18.0.1 - Drag and drop

## Build & Dev Tools

### Build
- **Vite**: 5.0.6 (frontend)
- **nodemon**: 3.0.2 (backend)

### Testing
- **Jest**: 29.7.0 (backend)
- **Vitest**: 1.0.2 (frontend)
- **Supertest**: 6.3.3 (API testing)

## Project Structure

```
URTMtakip/
├── backend/           # Express.js API (port 3000)
├── frontend/        # React + Vite (port 5173)
├── CNC_panel/       # ESP32 hardware
├── STEP_BOM_Analyzer/  # Python CAD tool
├── CAD_Import_Client/  # Python CAD tool
└── docs/           # Documentation
```

## Key Files

- `backend/src/index.js` - Express entry point
- `frontend/src/App.jsx` - React entry point
- `backend/database.sqlite` - SQLite database