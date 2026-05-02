---
name: STRUCTURE.md
description: Directory layout, key locations, and naming conventions
type: codebase
---

# Directory Structure

## Root Level

```
URTMtakip/
├── backend/           # Express.js API server
├── frontend/         # React application
├── CNC_panel/        # ESP32 hardware project
├── STEP_BOM_Analyzer/ # Python STEP tool
├── CAD_Import_Client/ # Python CAD client
├── docs/             # Documentation
├── .planning/        # GSD planning files
└── package.json     # Root scripts
```

## Backend Structure (`backend/src/`)

```
backend/src/
├── index.js         # Entry point
├── cors.js         # CORS configuration
├── config/         # Database config, logger
├── controllers/    # Business logic (30+ files)
├── routes/         # API route definitions (35+ files)
├── models/         # Sequelize models (25+ files)
├── migrations/     # DB migrations
├── services/       # Business services
├── middleware/     # Express middleware
├── socket/         # Socket.IO handlers
├── queries/        # Query utilities
├── modules/        # Feature modules
└── scripts/        # Utility scripts
```

## Multi-Agent Structure (`backend/multi-agent/`)

```
backend/multi-agent/
├── master-agent.js         # Master agent - coordination & approval
├── module-agent.js         # Base module agent class (v1.0+)
├── db-access.js            # Database access layer (v1.0+)
├── api-client.js           # Internal HTTP API client (v1.0+)
├── action-loader.js        # Action definitions loader
├── consult-master.js       # Module-to-master communication
├── websocket-handler.js    # Master-to-module WebSocket handler
├── api-server.js           # Agent API server entry
├── task-executor.js        # Task execution logic
├── websocket-client.js     # Client WebSocket implementation
├── cli.js                  # CLI interface
├── client.js               # Client module
├── demo.js                 # Demo scripts
├── action-definitions.json  # Action registry & capabilities
├── COMMUNICATION.md         # Communication protocol docs
└── test/                   # Test suites
    ├── test-runner.js           # Master test runner
    ├── db-access.test.js         # 6 tests
    ├── api-client.test.js        # 6 tests
    └── module-agent-integration.test.js  # 6 tests
```

## Frontend Structure (`frontend/src/`)

```
frontend/src/
├── App.jsx         # Root component
├── main.jsx       # Entry point
├── pages/         # Page components
├── components/    # UI components
├── services/      # API client
├── store/         # Redux store
├── hooks/         # Custom hooks
├── utils/         # Utilities
└── api/           # API functions
```

## Key Naming Conventions

### Backend Files
- Routes: `moduleRoutes.js` (kebab-case)
- Controllers: `moduleController.js` (kebab-case)
- Models: `moduleModel.js` (kebab-case)

### Agent Files (v1.0+)
- Agent classes: `*-agent.js` (kebab-case)
- Access layers: `*-access.js`, `*-client.js` (kebab-case)
- Config: `action-definitions.json` (kebab-case)

### Database Tables
- Snake_case: `is_emirleri`, `tezgahlar`, `parcalar`

### API Endpoints
- kebab-case: `/api/is-emirleri`, `/api/tezgahlar`

### Frontend Components
- PascalCase: `IsEmirleri.jsx`, `Tezgahlar.jsx`

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/index.js` | Express app entry |
| `backend/src/routes/*` | API endpoints |
| `backend/src/models/*` | Database models |
| `backend/multi-agent/master-agent.js` | Master agent (v1.0+) |
| `backend/multi-agent/module-agent.js` | Module agent base (v1.0+) |
| `backend/multi-agent/db-access.js` | DB access layer (v1.0+) |
| `backend/multi-agent/api-client.js` | API client (v1.0+) |
| `backend/multi-agent/action-definitions.json` | Action registry (v1.0+) |
| `backend/multi-agent/test/test-runner.js` | Test runner (v1.0+) |
| `frontend/src/App.jsx` | React root |
| `frontend/src/pages/*` | Page components |
| `backend/database.sqlite` | SQLite database |

## Ports (Fixed)

- Backend API: 3000
- Agent API: 3001
- Frontend: 5173

## Phase Directories (.planning/phases/)

```
.planning/
├── phases/
│   ├── 01-agentic-temel/
│   │   ├── 01-01-PLAN.md
│   │   └── 01-01-SUMMARY.md
│   ├── 02-master-onay/
│   │   ├── 02-01-PLAN.md
│   │   └── 02-01-SUMMARY.md
│   ├── 03-modul-yetki/
│   │   ├── 03-01-PLAN.md
│   │   └── 03-01-SUMMARY.md
│   └── 04-test-entegrasyon/
│       ├── 04-01-PLAN.md
│       └── 04-01-SUMMARY.md
├── milestones/
│   └── v1.0-ROADMAP.md
├── PROJECT.md
├── ROADMAP.md
└── MILESTONES.md
```