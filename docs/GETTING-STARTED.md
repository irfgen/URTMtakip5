# Getting Started

## Prerequisites

- Node.js 18 or higher
- NPM 8 or higher
- Git
- Text editor (VS Code recommended)

### Optional Tools

- Python 3.8+ (for CAD tools)
- PlatformIO (for ESP32 development)
- ESP32 board (for CNC monitoring)

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd URTMtakip
```

### Step 2: Install Dependencies

```bash
npm run install:all
```

This installs:
- Root dependencies
- Backend dependencies (`cd backend && npm install`)
- Frontend dependencies (`cd frontend && npm install`)

### Step 3: Configure Environment

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Step 4: Run Migrations

```bash
cd backend && npm run migrate
```

### Step 5: Start Development Server

From project root:

```bash
npm run dev
```

This starts:
- Backend on http://localhost:3000
- Frontend on http://localhost:5173

## Verify Installation

### Backend Health

```bash
curl http://localhost:3000/api/health
```

### Frontend

Open http://localhost:5173 in your browser.

## First Time Setup

1. Open http://localhost:5173
2. Navigate to "Tezgahlar" to add workstations
3. Navigate to "Parcalar" to add parts
4. Navigate to "İş Emirleri" to create work orders

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers |
| `npm run start` | Start production servers |
| `npm run build` | Build frontend |
| `npm test` | Run all tests |

## Common Issues

### Port Already in Use

```bash
npm run restart
```

### Database Errors

```bash
cd backend && npm run migrate
```

### Clear Cache

```bash
npm run clean:all
npm run install:all
```

## Next Steps

- Review [Development Guide](./DEVELOPMENT.md)
- Review [API Reference](./docs/API_REFERENCE.md)
- Explore [Module Documentation](./docs/moduller/)