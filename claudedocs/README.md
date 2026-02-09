# ÜRTM Takip System - Documentation Index

Comprehensive documentation for the ÜRTM Takip Production Tracking System.

## Quick Start

**New to the project?** Start here:
1. Read [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for system introduction
2. Review [STRUCTURE.md](./STRUCTURE.md) for project organization
3. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for setup instructions

---

## Documentation Files

### Core Documentation

| File | Description | Language |
|------|-------------|----------|
| **PROJECT_OVERVIEW.md** | Executive summary, architecture, technology stack, and features | English |
| **STRUCTURE.md** | Complete project structure with directory descriptions | English |
| **API_DOCUMENTATION.md** | Backend API reference with all endpoints | Turkish |
| **DATABASE_SCHEMA.md** | Database models, relationships, and migrations | Turkish |
| **FRONTEND_GUIDE.md** | React application architecture and patterns | English |
| **DEPLOYMENT.md** | Production deployment guide (PM2, Nginx, build) | English |

### Specialized Documentation

| File | Description | Language |
|------|-------------|----------|
| **API_REFERENCE.md** | Detailed API endpoint documentation | Turkish |
| **FRONTEND_COMPONENTS.md** | Frontend component catalog | Turkish |
| **MODULE_DOCUMENTATION.md** | Module-specific documentation | Turkish |
| **SOCKET_EVENTS.md** | WebSocket events and real-time updates | Turkish |
| **NAVIGATION_INDEX.md** | Site navigation and routing | Turkish |

### Analysis & Reports

| File | Description |
|------|-------------|
| **fatura-modulu-raporu.md** | Invoice module analysis |
| **makindex_vs_parcalar_parca_detay_karsilastirmasi.md** | Makindex vs Parcalar comparison |

### Knowledge Base

| File | Description |
|------|-------------|
| **KNOWLEDGE_BASE_INDEX.md** | Knowledge base index |
| **knowledge-base.md** | General knowledge base |

---

## Documentation by Topic

### For Backend Developers

1. **API Integration**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. **Database**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
3. **Models**: Backend models in `backend/src/models/`
4. **Routes**: API routes in `backend/src/routes/`
5. **Controllers**: Business logic in `backend/src/controllers/`

### For Frontend Developers

1. **Frontend Guide**: [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)
2. **Components**: [FRONTEND_COMPONENTS.md](./FRONTEND_COMPONENTS.md)
3. **State Management**: Redux Toolkit in `frontend/src/store/`
4. **Routing**: React Router in `frontend/src/App.jsx`
5. **API Client**: Axios configuration in `frontend/src/api/`

### For DevOps Engineers

1. **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Environment Setup**: See DEPLOYMENT.md prerequisites
3. **PM2 Configuration**: `pm2.config.json` in project root
4. **Nginx Config**: `nginx-config.conf` in project root
5. **Monitoring**: PM2 and Nginx logs in DEPLOYMENT.md

### For System Architects

1. **System Overview**: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
2. **Architecture**: PROJECT_OVERVIEW.md architecture section
3. **Data Flow**: PROJECT_OVERVIEW.md integration points
4. **Technology Stack**: PROJECT_OVERVIEW.md technology section
5. **Scalability**: DEPLOYMENT.md scaling considerations

---

## Quick Reference

### Project Commands

```bash
# Development
npm run dev              # Start both backend (3000) and frontend (5173)

# Backend
cd backend
npm run dev             # Start backend on port 3000
npm test                # Run backend tests
npm run migrate         # Run database migrations

# Frontend
cd frontend
npm run dev             # Start frontend on port 5173
npm run build           # Build for production
npm test                # Run frontend tests

# Production
npm run start           # Start production servers
pm2 start pm2.config.js # Start with PM2
```

### Key Locations

| Component | Location |
|-----------|----------|
| Backend Entry | `backend/src/index.js` |
| Frontend Entry | `frontend/src/main.jsx` |
| Database | `backend/database.sqlite` |
| Models | `backend/src/models/` |
| Routes | `backend/src/routes/` |
| Controllers | `backend/src/controllers/` |
| Components | `frontend/src/components/` |
| Redux Store | `frontend/src/store/` |
| API Client | `frontend/src/api/` |

### Port Configuration

| Service | Port | Protocol |
|---------|------|----------|
| Frontend (Dev) | 5173 | HTTP |
| Backend | 3000 | HTTP |
| Socket.IO | 3000 | WebSocket |
| Nginx | 80, 443 | HTTP/HTTPS |

### Technology Stack

**Backend**:
- Node.js 18+
- Express.js 4.18
- SQLite + Sequelize
- Socket.IO
- Winston (logging)

**Frontend**:
- React 18
- Vite 5
- Material-UI 5
- Redux Toolkit
- React Router 6

**Tools**:
- PM2 (process management)
- Nginx (reverse proxy)
- ESLint/Prettier (code quality)

---

## Module Overview

### Manufacturing Modules

- **İş Emirleri** (Work Orders): Core production tracking
- **Tezgahlar** (Workstations): Machine management and monitoring
- **Parcalar** (Parts): Parts catalog with technical drawings
- **Üretim Planı**: Production planning (main and V2 systems)
- **BOM**: Bill of Materials management

### Operational Modules

- **Fason İşler**: Subcontracting management
- **Sevkiyat**: Shipping and delivery tracking
- **Stok Kartları**: Inventory management
- **Arıza-Bakım**: Maintenance tracking
- **Notlar**: Note-taking system

### Supporting Modules

- **Personel**: Personnel management
- **Vardiya**: Shift management
- **Raporlar**: Production reports and analytics
- **Dashboard**: Real-time overview

---

## External Integrations

### CAD Tools
- **STEP_BOM_Analyzer**: STEP file BOM extraction
- **CAD_Import_Client**: SolidWorks automation (Windows)

### Hardware
- **ESP32 CNC Panels**: Real-time machine status monitoring

### File Processing
- **Excel Import/Export**: Production planning and data exchange
- **PDF Generation**: Report generation
- **OCR**: Technical drawing text extraction

---

## Development Workflow

### 1. Setup
```bash
git clone <repository>
cd urtmtakip
npm run install:all
```

### 2. Development
```bash
npm run dev
# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### 3. Testing
```bash
cd backend && npm test
cd frontend && npm test
```

### 4. Build
```bash
cd frontend && npm run build
```

### 5. Deploy
```bash
pm2 start pm2.config.js
sudo systemctl reload nginx
```

---

## Troubleshooting

### Common Issues

1. **Port 5173 in use**: Frontend auto-kills existing process
2. **Port 3000 in use**: `sudo lsof -i :3000` then `kill -9 <PID>`
3. **Database locked**: Remove `.sqlite-shm` and `.sqlite-wal` files
4. **PM2 not starting**: Check logs with `pm2 logs --err`
5. **Nginx 502**: Verify backend is running on port 3000

### Getting Help

1. Check logs in `backend/logs/` and PM2 logs
2. Review Nginx logs: `/var/log/nginx/`
3. Check database: `backend/database.sqlite`
4. Verify environment variables in `.env`
5. Consult relevant documentation file

---

## Version Information

- **Current Branch**: v14.dev1
- **Main Branch**: v13
- **Documentation Version**: 1.0
- **Last Updated**: 2025-01-07

---

## Contributing to Documentation

When adding new features or modules:

1. Update relevant documentation file
2. Add API endpoints to API_DOCUMENTATION.md
3. Update database schema in DATABASE_SCHEMA.md
4. Add components to FRONTEND_COMPONENTS.md
5. Update this README.md index

---

## File Naming Conventions

- Use `.md` extension for all documentation
- Use lowercase with hyphens for multi-word files
- Use English for main documentation files
- Use Turkish for user-facing API documentation

---

## Documentation Standards

- **Language**: English for technical docs, Turkish for API reference
- **Format**: Markdown with proper headings and code blocks
- **Code Examples**: Include working examples
- **Diagrams**: Use ASCII art or mermaid diagrams
- **Versioning**: Update version number and date on changes
- **Links**: Use relative links for cross-references

---

## Search Tips

Looking for something specific?

- **API endpoint**: Check API_DOCUMENTATION.md
- **Database table**: Check DATABASE_SCHEMA.md
- **Component**: Check FRONTEND_COMPONENTS.md or FRONTEND_GUIDE.md
- **Deployment**: Check DEPLOYMENT.md
- **Module**: Check MODULE_DOCUMENTATION.md
- **Error message**: Check relevant module documentation or logs

---

## Additional Resources

### Existing Documentation
- `/ContEng/`: Existing English technical documentation
- `/docs/`: Additional project documentation
- `/openspec/`: OpenSpec change proposals

### Configuration Files
- `CLAUDE.md`: Project instructions for Claude Code
- `package.json`: Dependencies and scripts
- `pm2.config.json`: PM2 configuration
- `nginx-config.conf`: Nginx configuration
- `vite.config.js`: Vite build configuration

### External Links
- React Documentation: https://react.dev
- Material-UI: https://mui.com
- Express.js: https://expressjs.com
- Sequelize: https://sequelize.org
- Socket.IO: https://socket.io

---

**Documentation Maintained By**: Development Team  
**Last Review**: 2025-01-07  
**Next Review**: 2025-02-01

For questions or contributions, contact the development team or create an issue in the project repository.
