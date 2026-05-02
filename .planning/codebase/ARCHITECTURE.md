---
name: ARCHITECTURE.md
description: System design patterns, layers, data flow, and entry points
type: codebase
---

# Architecture

## Pattern

**Layered MVC with Service Layer**
- Routes → Controllers → Services → Models
- Real-time layer via Socket.IO

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

## Entry Points

### Backend
- `backend/src/index.js` - Express app initialization
- Port: 3000

### Frontend
- `frontend/src/App.jsx` - React app root
- Port: 5173

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

## Real-time Events

### Socket.IO Events
- `tezgah-durum`: Workstation status changes
- `is-emri-guncelleme`: Work order updates
- `stok-uyari`: Stock alerts

## Port Configuration

- **Backend**: 3000 (fixed, mandatory)
- **Frontend**: 5173 (fixed, mandatory)

## Security

- CORS middleware via `backend/src/cors.js`
- JWT authentication
- Rate limiting
- Helmet security headers
- Input validation via Joi