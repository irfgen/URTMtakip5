# Configuration Guide

## Environment Variables

Create `backend/.env` file with the following configuration:

```env
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-production-secret-key-change-this
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload
UPLOAD_MAX_SIZE=100MB
UPLOAD_PATH=./uploads

# Database
DB_NAME=database
DB_STORAGE=.sqlite

# Logging
LOG_LEVEL=info
```

## Port Configuration

**CRITICAL**: Ports are fixed and cannot be changed:

- **Frontend**: 5173
- **Backend**: 3000

If ports are occupied, kill the process:

```bash
# Find process using port
# Linux/Mac
lsof -i :5173
lsof -i :3000

# Windows
netstat -ano | findstr :5173

# Kill process
kill -9 <PID>
```

Or use the restart script:

```bash
npm run restart
```

## Database Configuration

### SQLite

Database file: `backend/database.sqlite`

### Migrations

```bash
# Run all migrations
cd backend && npm run migrate

# Run specific module migration
npm run migrate-durum
```

## Frontend Configuration

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

### Proxy Configuration

Vite proxy configured in `vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true
  }
}
```

## Backend Configuration

### Key Files

- `backend/src/index.js` - Express app entry
- `backend/src/config/database.js` - DB configuration
- `backend/src/cors.js` - CORS settings

### Package.json Dependencies

```json
{
  "dependencies": {
    "express": "^4.x",
    "sequelize": "^6.x",
    "sqlite3": "^5.x",
    "socket.io": "^4.x",
    "winston": "^3.x",
    "helmet": "^7.x",
    "multer": "^1.x"
  }
}
```

## CNC Panel Configuration

Edit `CNC_panel/include/config.h`:

```c
#define WIFI_SSID "your-ssid"
#define WIFI_PASSWORD "your-password"
#define SERVER_URL "http://192.168.1.x:3000"
```

Build and upload:

```bash
cd CNC_panel
pio run -t upload
pio device monitor
```

## Python CAD Tools Configuration

### STEP_BOM_Analyzer

```bash
cd STEP_BOM_Analyzer
pip install -r requirements.txt
python main.py
```

### CAD_Import_Client

```bash
cd CAD_Import_Client
pip install -r requirements.txt
python main.py
```

Requires SolidWorks installation on Windows.

## PM2 Production Configuration

`pm2.config.json`:

```json
{
  "apps": [
    {
      "name": "backend",
      "script": "backend/src/index.js",
      "instances": 1,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      }
    }
  ]
}
```

Start production:

```bash
pm2 start pm2.config.json
```

## Nginx Configuration

Reverse proxy setup in `nginx-config.conf`:

```
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://localhost:5173;
  }

  location /api {
    proxy_pass http://localhost:3000;
  }
}
```

## Logging Configuration

Winston logger configured in backend:

- Log level: `info` (production)
- Log level: `debug` (development)
- Log files: `backend/logs/`

## Security Notes

- Change JWT_SECRET in production
- Use strong passwords
- Enable HTTPS in production
- Configure rate limiting
- Review CORS origins