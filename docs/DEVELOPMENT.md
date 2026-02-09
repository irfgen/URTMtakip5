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
- SolidWorks (for CAD_Import_Client, Windows only)

### Quick Start

1. **Clone Repository**
```bash
git clone <repository-url>
cd URTMtakip
```

2. **Install Dependencies**
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

3. **Start Development Servers**
```bash
# Start both backend and frontend
npm run dev

# Backend runs on: http://localhost:3000
# Frontend runs on: http://localhost:5173
```

4. **Run Database Migrations**
```bash
cd backend
npm run migrate
```

---

## Development Environment Setup

### Backend Setup

**Location:** `backend/`

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Variables**
```bash
# Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=3000
# JWT_SECRET=your-secret-key-here
EOF
```

3. **Run Migrations**
```bash
npm run migrate
```

4. **Start Development Server**
```bash
npm run dev    # Uses nodemon for auto-restart
# or
npm start      # Production mode
```

**Backend URL:** http://localhost:3000

### Frontend Setup

**Location:** `frontend/`

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

**Frontend URL:** http://localhost:5173

**Important:** Frontend always uses port 5173. If occupied, it will kill the existing process.

### CNC Panel (ESP32) Setup

**Location:** `CNC_panel/`

1. **Install PlatformIO**
```bash
# Install PlatformIO CLI
pip install platformio

# or use VS Code extension
# Install "PlatformIO IDE" extension
```

2. **Configure Wi-Fi**
```cpp
// Edit include/config.h
#define WIFI_SSID "your-ssid"
#define WIFI_PASSWORD "your-password"
#define SERVER_URL "http://10.255.255.254:3000"
```

3. **Build and Upload**
```bash
cd CNC_panel
pio run              # Build
pio run -t upload    # Upload to ESP32
pio device monitor   # Monitor serial output
```

### Python CAD Tools Setup

**STEP_BOM_Analyzer:**
```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt
python main.py       # Launch GUI
```

**CAD_Import_Client (Windows only):**
```bash
cd CAD_Import_Client
pip install -r requirements.txt
python main.py       # Launch GUI
```

---

## Project Structure

### Directory Layout

```
URTMtakip/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API routes
│   │   ├── models/          # Sequelize models
│   │   ├── middleware/      # Custom middleware
│   │   ├── migrations/      # DB migrations
│   │   ├── services/        # Background services
│   │   ├── socket/          # Socket.IO namespaces
│   │   ├── modules/         # Modular features
│   │   └── index.js         # Entry point
│   ├── uploads/             # File upload storage
│   ├── importlar/           # Import file storage
│   ├── database.sqlite*     # SQLite database
│   └── package.json
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API clients
│   │   ├── utils/           # Utilities
│   │   ├── theme.js         # Desktop theme
│   │   ├── theme.mobile.js  # Mobile theme
│   │   └── App.jsx          # Main app
│   ├── public/
│   │   └── uploads/         # Public files
│   └── package.json
├── CNC_panel/               # ESP32 firmware
│   ├── include/             # C headers
│   ├── src/                 # C source
│   └── platformio.ini       # Build config
├── STEP_BOM_Analyzer/       # Python CAD tool
├── CAD_Import_Client/       # Python SolidWorks tool
├── docs/                    # Documentation
├── package.json             # Root scripts
├── pm2.config.json          # PM2 config
└── nginx-config.conf        # Nginx config
```

---

## Development Workflow

### Typical Development Flow

1. **Feature Development**
   - Create feature branch from `v13` or `v14.dev1`
   - Make changes in relevant modules
   - Test locally
   - Commit with descriptive message

2. **Testing**
   - Run unit tests: `npm test`
   - Run frontend tests: `npm run test:frontend`
   - Manual testing in browser

3. **Code Review**
   - Push to remote repository
   - Create pull request
   - Address review comments

4. **Merge**
   - Merge to main branch after approval
   - Delete feature branch

### Git Workflow

**Branching:**
- `v13` - Main stable branch
- `v14.dev1` - Development branch
- Feature branches - `feature/feature-name`

**Commit Message Format:**
```
v14.dev1.{increment}: Brief description

Detailed explanation of changes.

- Change 1
- Change 2
```

**Example:**
```
v14.dev1.15: Add BOM cost tracking

- Add maliyet field to boms table
- Update BOM form to include cost input
- Add cost calculation to reports
```

### Adding New Features

#### Backend API Endpoint

1. **Create Controller**
```javascript
// backend/src/controllers/myFeatureController.js
const { MyModel } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const data = await MyModel.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

2. **Create Routes**
```javascript
// backend/src/routes/myFeatureRoutes.js
const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/myFeatureController');

router.get('/', getAll);

module.exports = router;
```

3. **Register Routes**
```javascript
// backend/src/index.js
const myFeatureRoutes = require('./routes/myFeatureRoutes');
app.use('/api/my-feature', myFeatureRoutes);
```

#### Frontend Component

1. **Create Component**
```jsx
// frontend/src/components/MyComponent.jsx
import React, { useState, useEffect } from 'react';
import { fetchData } from '../services/myFeatureAPI';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData()
      .then(response => setData(response.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}

export default MyComponent;
```

2. **Add Route**
```jsx
// frontend/src/App.jsx
import MyComponent from './components/MyComponent';

<Route path="/my-feature" element={<MyComponent />} />
```

3. **Add Navigation Item**
```jsx
// frontend/src/components/Layout.jsx
<MenuItem component={Link} to="/my-feature">
  My Feature
</MenuItem>
```

---

## Testing

### Backend Tests (Jest)

**Location:** `backend/`

**Run Tests:**
```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

**Test Structure:**
```
backend/
├── tests/               # Test files (create if not exists)
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── fixtures/       # Test data
```

**Example Test:**
```javascript
// backend/tests/unit/isEmri.test.js
const request = require('supertest');
const app = require('../src/index');

describe('Work Orders API', () => {
  test('GET /api/is-emirleri should return 200', async () => {
    const response = await request(app)
      .get('/api/is-emirleri')
      .expect(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

### Frontend Tests (Vitest)

**Location:** `frontend/`

**Run Tests:**
```bash
cd frontend
npm test                # Run all tests
npm run test:ui         # Vitest UI
npm run test:coverage   # With coverage
```

**Test Structure:**
```
frontend/
├── src/
│   └── __tests__/      # Test files
```

**Example Test:**
```jsx
// frontend/src/components/__tests__/MyComponent.test.jsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('renders loading state', () => {
    render(<MyComponent />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### ESP32 Tests (PlatformIO)

**Location:** `CNC_panel/`

**Run Tests:**
```bash
cd CNC_panel
pio test               # Run embedded tests
pio test -e esp32dev    # Specific environment
pio test -v            # Verbose output
```

---

## Building and Deployment

### Build Frontend

```bash
cd frontend
npm run build           # Production build
npm run preview         # Preview production build
```

**Output:** `frontend/dist/`

### Production Deployment

**Using PM2:**
```bash
# Build frontend
cd frontend && npm run build

# Start with PM2
cd ..
pm2 start pm2.config.json

# View logs
pm2 logs

# Restart
pm2 restart all

# Stop
pm2 stop all
```

**PM2 Configuration (`pm2.config.json`):**
```json
{
  "apps": [
    {
      "name": "urtmtakip-backend",
      "script": "./backend/src/index.js",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      }
    }
  ]
}
```

### Nginx Configuration

**Location:** Root `nginx-config.conf`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/URTMtakip/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## Code Style and Conventions

### JavaScript/React Conventions

**Component Structure:**
```jsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { TextField, Button } from '@mui/material';

// 2. Component declaration
function MyComponent({ prop1, prop2 }) {
  // 3. Hooks
  const [state, setState] = useState(null);
  const dispatch = useDispatch();

  // 4. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 5. Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// 7. Exports
export default MyComponent;
```

**Naming Conventions:**
- Components: PascalCase (`MyComponent.jsx`)
- Functions: camelCase (`handleClick`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Files:
  - Components: PascalCase
  - Utilities: camelCase
  - Styles: kebab-case

**File Organization:**
```
MyComponent.jsx
MyComponent.module.css  // Component-specific styles
```

### Backend Conventions

**Controller Structure:**
```javascript
// 1. Dependencies
const { Model } = require('../models');

// 2. Controller functions
exports.getAll = async (req, res) => {
  try {
    // Logic
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Export
exports.create = async (req, res) => {
  // Implementation
};
```

**Route Structure:**
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/myController');

// CRUD routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
```

**Model Structure:**
```javascript
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class MyModel extends Model {
  static associate(models) {
    // Associations
  }
}

MyModel.init({
  // Fields
}, {
  sequelize,
  modelName: 'MyModel',
  tableName: 'my_table',
  timestamps: true
});

module.exports = MyModel;
```

---

## Debugging

### Backend Debugging

**Using VS Code:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/src/index.js",
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

**Using Chrome DevTools:**
```bash
node --inspect-brk backend/src/index.js
# Open chrome://inspect in Chrome
```

### Frontend Debugging

**React DevTools:**
- Install React DevTools browser extension
- Inspect component tree
- View props and state
- Profile performance

**Console Logging:**
```jsx
console.log('Variable:', variable);
console.error('Error:', error);
console.warn('Warning:', warning);
```

**Network Debugging:**
- Browser DevTools Network tab
- Axios interceptors for logging:
```jsx
api.interceptors.request.use(config => {
  console.log('Request:', config);
  return config;
});
```

### Database Debugging

**View Database:**
```bash
# Use SQLite CLI
sqlite3 backend/database.sqlite

# Commands
.tables              # List tables
.schema is_emirleri  # Show table schema
SELECT * FROM is_emirleri LIMIT 10;
```

**Sequelize Logging:**
```javascript
// backend/src/config/database.js
const sequelize = new Sequelize({
  // ...
  logging: console.log, // Enable query logging
  logging: false,       // Disable query logging
});
```

---

## Common Tasks

### Adding New Database Migration

```bash
cd backend/src/migrations

# Create migration file
# Format: YYYYMMDDHHMMSS-description.js
touch 20251230000001-add-my-field.js
```

**Migration Template:**
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.addColumn('my_table', 'my_field', {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('my_table', 'my_field');
  }
};
```

**Run Migration:**
```bash
cd backend
npm run migrate
```

### Adding New API Endpoint

1. Create controller function
2. Add route
3. Test with Postman/curl
4. Add frontend API service
5. Create/update frontend component

### Adding New Frontend Route

1. Create page component in `frontend/src/pages/`
2. Add route in `App.jsx`
3. Add navigation item in `Layout.jsx`
4. Handle mobile version if needed

### Updating Database Schema

1. Create migration
2. Update model definition
3. Test migration locally
4. Run migration in development
5. Update related controllers/routes

### Adding Material-UI Component

```jsx
import { Button, TextField } from '@mui/material';

<Button
  variant="contained"
  color="primary"
  onClick={handleClick}
>
  Click Me
</Button>
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# or use npm script
npm run stop    # Windows
```

#### Database Locked

**Problem:** `SQLITE_CANTOPEN: database is locked`

**Solution:**
```bash
# Check for multiple processes
ps aux | grep node

# Restart database connection
# Close all connections and restart backend
```

#### Frontend Build Errors

**Problem:** Build fails with module not found errors

**Solution:**
```bash
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

#### Socket.IO Connection Issues

**Problem:** Client can't connect to Socket.IO

**Solution:**
1. Check CORS configuration in backend
2. Verify frontend Socket.IO client URL
3. Check network tab for connection errors
4. Ensure Socket.IO namespace matches

#### ESP32 Not Connecting

**Problem:** CNC Panel can't connect to Wi-Fi

**Solution:**
1. Check Wi-Fi credentials in `CNC_panel/include/config.h`
2. Verify ESP32 is within range
3. Check router firewall settings
4. Monitor serial output for errors

### Getting Help

1. Check existing documentation in `docs/`
2. Review similar code in the codebase
3. Check Git commit history for changes
4. Review error messages carefully
5. Enable debug logging

---

## Related Documentation

- [Project Overview](./PROJECT_OVERVIEW.md) - System architecture
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Component Structure](./COMPONENTS.md) - Frontend components
- [Database Schema](./DATABASE.md) - Database tables
