---
name: ARCHITECTURE.md
description: System design patterns, layers, data flow, and entry points
type: codebase
---

# Architecture

## Pattern

**Layered MVC with Service Layer + Multi-Agent System**
- Routes → Controllers → Services → Models (standard MVC)
- Agent layer for autonomous decisions (v1.0+)

## Layers

### Layer 1: Routes (`backend/src/routes/`)
- API endpoint definitions
- Input validation via express-validator
- Request routing

### Layer 2: Controllers (`backend/src/controllers/`)
- Business logic
- Request/response handling
- Error handling

### Layer 3: Services (`backend/src/services/`)
- Complex business operations
- Cross-cutting concerns
- Automation logic

### Layer 4: Models (`backend/src/models/`)
- Sequelize ORM models
- Database schema
- Relationships

## Data Flow

```
HTTP Request
    ↓
Routes (validation)
    ↓
Controller (logic)
    ↓
Service (optional)
    ↓
Model (database)
    ↓
Response
```

## Multi-Agent Architecture (v1.0+)

```
┌─────────────────────────────────────────────────────────────┐
│                     MASTER AGENT                            │
│                  (Koordinasyon, Onay)                       │
│  - action-definitions.json okur                            │
│  - Kritik kararları onaylar                                 │
│  - Alternatif aksiyon önerir                                │
│  - Timeout yönetimi                                         │
└────────────────────────────┬────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   MODULE AGENT  │ │   MODULE AGENT  │ │   MODULE AGENT  │
│   (stok_kartlari)│ │   (is_emirleri) │ │   (tezgahlar)   │
│                 │ │                 │ │                 │
│ - Veritabanı    │ │ - Veritabanı    │ │ - Veritabanı    │
│ - API çağırma   │ │ - API çağırma   │ │ - API çağırma   │
│ - Otonom aksiyon│ │ - Otonom aksiyon│ │ - Otonom aksiyon│
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                  │                  │
         ↓                  ↓                  ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   DATABASE      │ │   API           │ │   IOT           │
│   (direct)       │ │   (internal)    │ │   (ESP32)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Agent Communication Flow

```
Module Agent → REST → /api/master/consult → Master Agent
Master Agent → WebSocket → Module Agent (anlık yanıt)
Module Agent → Database → Direct Sequelize queries
```

### Action Decision Flow

```
Aksiyon tetiklenir
    ↓
action-definitions.json kontrol edilir
    ↓
requires_approval = true?
    ├── Evet → Master'a danış → Onay/alternatif/bekleme
    └── Hayır → Otonom çalıştır
```

### Agent Modules (backend/multi-agent/)

| File | Role | Responsibility |
|------|------|----------------|
| `master-agent.js` | Coordinator | Kritik kararlar, onay yönetimi, alternatif öneri |
| `module-agent.js` | Base class | db-access + api-client + consultMaster birleşimi |
| `db-access.js` | Data layer | Sequelize query, CRUD operations |
| `api-client.js` | HTTP layer | Internal API calls |
| `action-loader.js` | Config loader | action-definitions.json okuma ve validasyon |
| `consult-master.js` | Communication | Module→Master REST, Master→Module WebSocket |
| `websocket-handler.js` | Real-time | Anlık mesajlaşma |

## Entry Points

### Backend
- `backend/src/index.js` - Express app initialization (Port 3000)

### Agent API
- `backend/multi-agent/api-server.js` - Agent API server (Port 3001)

### Frontend
- `frontend/src/App.jsx` - React app root (Port 5173)

### Hardware
- `CNC_panel/src/main.cpp` - ESP32 firmware

## Key Abstractions

### Route Structure
```javascript
// routes/moduleRoutes.js
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', validation, controller.create);
router.put('/:id', validation, controller.update);
router.delete('/:id', controller.delete);
```

### Model Structure
```javascript
// models/moduleModel.js
sequelize.define('table_name', {
  field: { type: DataTypes.STRING }
}, {
  tableName: 'table_name'
});
```

### Module Agent Structure (v1.0+)
```javascript
// module-agent.js
class ModuleAgent {
  constructor(moduleId, moduleName) {
    this.db = require('./db-access');
    this.api = require('./api-client');
  }

  async executeAutonomous(action, params) {
    // check action-definitions.json
    // if requires_approval, consult master
    // else execute directly
  }
}
```

## Real-time Events

### Socket.IO Events
- `tezgah-durum`: Workstation status changes
- `is-emri-guncelleme`: Work order updates
- `stok-uyari`: Stock alerts

### Agent Events
- `agent:consult`: Module requesting master decision
- `agent:response`: Master responding to module
- `agent:action`: Autonomous action executed

## Port Configuration

- **Backend API**: 3000 (fixed, mandatory)
- **Agent API**: 3001 (fixed, mandatory)
- **Frontend**: 5173 (fixed, mandatory)

## Security

### Standard Layer
- CORS middleware via `backend/src/cors.js`
- JWT authentication
- Rate limiting
- Helmet security headers
- Input validation via Joi

### Agent Layer (v1.0+)
- X-Module-Agent header for agent identification
- requires_approval flag for critical actions
- SQL injection protection via parameterized queries
- 30s timeout on API requests

## Testing Architecture

```
backend/multi-agent/test/
├── test-runner.js          # Master test runner
├── db-access.test.js       # Database layer tests (6 tests)
├── api-client.test.js      # API client tests (6 tests)
└── module-agent-integration.test.js  # Integration tests (6 tests)
```

**Total: 18 tests, all passing**

## Agent Configuration

### action-definitions.json Structure
```json
{
  "actions": { /* kritik aksiyonlar - master onayı gerekli */ },
  "autonomous_actions": { /* otonom çalışan aksiyonlar */ },
  "agent_capabilities": {
    "database_access": { "enabled": true, "tables": [...] },
    "api_access": { "enabled": true, "endpoints": [...] },
    "autonomous_actions": { "enabled": true }
  },
  "communication": {
    "module_to_master": { "method": "REST", "endpoint": "/api/master/consult" },
    "master_to_module": { "method": "WebSocket", "timeout": 30000 }
  }
}
```