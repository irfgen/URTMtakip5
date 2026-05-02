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
├── frontend/        # React application
├── CNC_panel/       # ESP32 hardware project
├── STEP_BOM_Analyzer/ # Python STEP tool
├── CAD_Import_Client/ # Python CAD client
├── docs/            # Documentation
├── .planning/       # GSD planning files
└── package.json    # Root scripts
```

## Backend Structure (`backend/src/`)

```
backend/src/
├── index.js         # Entry point
├── cors.js         # CORS configuration
├── config/         # Database config, logger
├── controllers/   # Business logic (30+ files)
├── routes/        # API route definitions (35+ files)
├── models/        # Sequelize models (25+ files)
├── migrations/    # DB migrations
├── services/      # Business services
├── middleware/   # Express middleware
├── socket/       # Socket.IO handlers
├── queries/      # Query utilities
├── modules/      # Feature modules
└── scripts/      # Utility scripts
```

## Frontend Structure (`frontend/src/`)

```
frontend/src/
├── App.jsx         # Root component
├── main.jsx       # Entry point
├── pages/         # Page components
├── components/   # UI components
├── services/     # API client
├── store/        # Redux store
├── hooks/        # Custom hooks
├── utils/        # Utilities
└── api/          # API functions
```

## Key Naming Conventions

### Backend Files
- Routes: `moduleRoutes.js` (kebab-case)
- Controllers: `moduleController.js` (kebab-case)
- Models: `moduleModel.js` (kebab-case)

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
| `frontend/src/App.jsx` | React root |
| `frontend/src/pages/*` | Page components |
| `backend/database.sqlite` | SQLite database |

## Ports (Fixed)

- Backend: 3000
- Frontend: 5173