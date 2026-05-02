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

## Multi-Agent Stack (v1.0+)

### Agent Framework
- **@anthropic-ai/claude-agent-sdk**: Claude Agent SDK for AI orchestration

### Agent Modules (backend/multi-agent/)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `master-agent.js` | Master agent - coordination, approval, critical decisions | `MasterAgent` class |
| `module-agent.js` | Base module agent - autonomous actions | `ModuleAgent` class |
| `db-access.js` | Database access layer - Sequelize queries | `query`, `findAll`, `findOne`, `insert`, `update`, `remove`, `transaction` |
| `api-client.js` | Internal API client - HTTP requests | `get`, `post`, `put`, `delete` |
| `action-loader.js` | Action definitions loader | `ActionLoader` class |
| `consult-master.js` | Module-to-master communication | `consultMaster`, `connect`, `disconnect` |
| `websocket-handler.js` | Master-to-module WebSocket | WebSocket event handling |

### Action Definitions
- **action-definitions.json**: Central action registry
  - `actions`: Defined actions with approval requirements
  - `autonomous_actions`: Direct-execute actions (no approval needed)
  - `agent_capabilities`: Database/API access permissions
  - `communication`: Master↔Module communication settings

## Build & Dev Tools

### Build
- **Vite**: 5.0.6 (frontend)
- **nodemon**: 3.0.2 (backend)

### Testing
- **Jest**: 29.7.0 (backend)
- **Vitest**: 1.0.2 (frontend)
- **Supertest**: 6.3.3 (API testing)

### Agent Testing
- **Test suites**: `backend/multi-agent/test/`
  - `db-access.test.js`: 6 tests
  - `api-client.test.js`: 6 tests
  - `module-agent-integration.test.js`: 6 tests
  - `test-runner.js`: Master test runner

## Project Structure

```
URTMtakip/
├── backend/
│   ├── src/              # Express API (port 3000)
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   └── ...
│   └── multi-agent/      # Agentic AI modules (v1.0+)
│       ├── master-agent.js
│       ├── module-agent.js
│       ├── db-access.js
│       ├── api-client.js
│       ├── action-loader.js
│       ├── consult-master.js
│       ├── websocket-handler.js
│       ├── action-definitions.json
│       └── test/              # Test suites (18 tests)
├── frontend/            # React + Vite (port 5173)
├── CNC_panel/           # ESP32 hardware
├── STEP_BOM_Analyzer/  # Python CAD tool
├── CAD_Import_Client/  # Python CAD tool
└── docs/               # Documentation
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/index.js` | Express entry point |
| `backend/multi-agent/master-agent.js` | Master agent (v1.0+) |
| `backend/multi-agent/module-agent.js` | Module agent base class (v1.0+) |
| `backend/multi-agent/db-access.js` | Database access layer (v1.0+) |
| `backend/multi-agent/api-client.js` | API client (v1.0+) |
| `backend/multi-agent/action-definitions.json` | Action registry (v1.0+) |
| `frontend/src/App.jsx` | React entry point |
| `backend/database.sqlite` | SQLite database |