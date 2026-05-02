# Development Guide - ÜRTM Takip Sistemi

## Table of Contents
- [Getting Started](#getting-started)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building and Deployment](#building-and-deployment)
- [Code Style and Conventions](#code-style-and-conventions)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

**Required Software:**
- Node.js v18+ and npm
- Git
- SQLite3 (comes with backend)
- VS Code or preferred IDE

**Optional but Recommended:**
- PlatformIO (for ESP32 development)
- Python 3.8+ (for CAD tools)
- FreeCAD (for STEP_BOM_Analyzer)

---

## Development Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd URTMtakip
npm run install:all
```

### 2. Environment Configuration

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-development-secret
CORS_ORIGIN=http://localhost:5173
UPLOAD_MAX_SIZE=100MB
```

### 3. Run Migrations

```bash
cd backend && npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

This starts:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

---

## Project Structure

```
URTMtakip/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── index.js    # Entry point
│   │   ├── routes/    # API routes
│   │   ├── controllers/ # Business logic
│   │   ├── models/    # Sequelize models
│   │   ├── migrations/ # DB migrations
│   │   ├── services/  # Business services
│   │   └── middleware/ # Express middleware
│   ├── database.sqlite
│   └── uploads/
├── frontend/           # React application
│   ├── src/
│   │   ├── App.jsx   # Main component
│   │   ├── pages/   # Page components
│   │   ├── components/ # UI components
│   │   ├── services/ # API client
│   │   ├── store/   # Redux store
│   │   └── hooks/   # Custom hooks
│   └── public/
├── CNC_panel/          # ESP32 hardware
├── STEP_BOM_Analyzer/  # Python CAD tool
├── CAD_Import_Client/ # Python CAD tool
└── docs/             # Documentation
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit files in `backend/` or `frontend/` directories.

### 3. Test Your Changes

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### 4. Commit Changes

```bash
git add .
git commit -m 'feat: your feature description'
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

---

## Testing

### Backend Tests (Jest)

```bash
cd backend
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --coverage # Coverage report
```

### Frontend Tests (Vitest)

```bash
cd frontend
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --ui     # UI interface
```

### ESP32 Tests (PlatformIO)

```bash
cd CNC_panel
pio test
```

---

## Building and Deployment

### Frontend Build

```bash
npm run build
```

Output: `frontend/dist/`

### PM2 Production

```bash
pm2 start pm2.config.json
```

### Nginx

See `nginx-config.conf` for reverse proxy setup.

---

## Code Style and Conventions

### RESTful API

All API routes follow REST conventions:
- `GET /api/resource` - List
- `GET /api/resource/:id` - Get single
- `POST /api/resource` - Create
- `PUT /api/resource/:id` - Update
- `DELETE /api/resource/:id` - Delete

### Naming Conventions

- **Files**: camelCase (isEmirleriRoutes.js)
- **Database tables**: snake_case (is_emirleri)
- **API endpoints**: kebab-case (/api/is-emirleri)

### Component Structure

```javascript
const ComponentName = () => {
  // Hooks first
  const [state, setState] = useState();

  // Effects
  useEffect(() => {}, []);

  // Handlers
  const handleClick = () => {};

  // Render
  return (<JSX />);
};
```

---

## Debugging

### Backend

```javascript
// Debug logging
console.log('Debug:', data);

// Winston logger
const logger = require('./src/config/logger');
logger.debug('Debug:', data);
```

### Frontend

```javascript
// React DevTools
// Browser console

// Redux DevTools
```

### API Testing

```bash
# Test API endpoints
node test-api-integration.js
```

---

## Common Tasks

### Adding New Routes

1. Create controller in `backend/src/controllers/`
2. Add route in `backend/src/routes/`
3. Register in `backend/src/index.js`

### Adding New Pages

1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`

### Database Changes

1. Create migration in `backend/src/migrations/`
2. Update model in `backend/src/models/`
3. Run migration

---

## Troubleshooting

### Port in Use

```bash
npm run restart
```

### Database Errors

```bash
cd backend && npm run migrate
```

### Module Errors

```bash
npm run clean:all
npm run install:all
```

### View Errors

Frontend terminal usually shows the error.

### API Errors

Check backend terminal for error messages.