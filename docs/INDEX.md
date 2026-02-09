# ÜRTM Takip Sistemi - Documentation Index

## English Documentation (New - Comprehensive)

### Core Documentation

| File | Description | Size |
|------|-------------|------|
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Complete system overview, architecture, and modules | 21KB |
| [API_REFERENCE.md](API_REFERENCE.md) | Complete API endpoint documentation with examples | 19KB |
| [COMPONENTS.md](COMPONENTS.md) | Frontend component hierarchy and props reference | 18KB |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Development workflow, setup, and procedures | 18KB |

### What's Covered

#### PROJECT_OVERVIEW.md
- Purpose and scope
- Key features and modules (40+ modules documented)
- Technology stack (Backend, Frontend, CNC Panel, Python Tools)
- Architecture overview with diagrams
- Project structure
- System modules and relationships
- Development environment setup
- Related documentation cross-references

#### API_REFERENCE.md
- All API endpoints organized by module
- Request/response formats
- Socket.IO events (3 namespaces)
- Error handling
- Rate limiting
- CORS configuration
- Pagination
- Authentication notes

#### COMPONENTS.md
- Component directory structure
- Page components (desktop and mobile)
- Reusable components with props
- Module-specific components
- Custom hooks
- State management (Redux)
- Routing structure
- Theming (desktop/mobile)

#### DEVELOPMENT.md
- Getting started guide
- Environment setup (backend, frontend, ESP32, Python tools)
- Development workflow
- Git workflow and branching
- Testing procedures
- Building and deployment
- Code style conventions
- Debugging techniques
- Common tasks
- Troubleshooting

---

## Turkish Documentation (Existing)

### Quick Reference

| File | Description |
|------|-------------|
| [README.md](README.md) | Documentation center (navigation hub) |
| [api-documentation.md](api-documentation.md) | API dokümantasyonu (Turkish) |
| [backend-documentation.md](backend-documentation.md) | Backend dokümantasyonu |
| [database-schema.md](database-schema.md) | Veritabanı şeması |
| [frontend-documentation.md](frontend-documentation.md) | Frontend dokümantasyonu |
| [development-guide.md](development-guide.md) | Geliştirme rehberi |
| [hardware-tools-documentation.md](hardware-tools-documentation.md) | Donanım araçları |

---

## Documentation Coverage

### Backend Coverage
- ✅ 60+ API routes documented
- ✅ 40+ database models explained
- ✅ Express.js architecture
- ✅ Socket.IO namespaces
- ✅ Middleware and services
- ✅ File upload handling

### Frontend Coverage
- ✅ 100+ components catalogued
- ✅ Page components (desktop + mobile)
- ✅ Reusable component library
- ✅ Props and interfaces
- ✅ Redux state management
- ✅ Routing structure
- ✅ Theming system

### Database Coverage
- ✅ 40+ tables documented
- ✅ Relationships and associations
- ✅ Key fields and indexes
- ✅ Migration system
- ✅ Entity relationships diagram

### Development Coverage
- ✅ Environment setup
- ✅ Development workflow
- ✅ Testing procedures
- ✅ Build and deployment
- ✅ Code conventions
- ✅ Debugging techniques
- ✅ Common tasks
- ✅ Troubleshooting

---

## How to Use This Documentation

### For New Developers

1. Start with [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) to understand the system
2. Follow [DEVELOPMENT.md](DEVELOPMENT.md) to set up your environment
3. Reference [API_REFERENCE.md](API_REFERENCE.md) for backend endpoints
4. Check [COMPONENTS.md](COMPONENTS.md) for frontend components

### For Backend Development

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Architecture section
- [API_REFERENCE.md](API_REFERENCE.md) - All endpoints
- [DEVELOPMENT.md](DEVELOPMENT.md) - Backend setup and workflow
- [database-schema.md](database-schema.md) - Database details (Turkish)

### For Frontend Development

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Frontend architecture
- [COMPONENTS.md](COMPONENTS.md) - Component library
- [DEVELOPMENT.md](DEVELOPMENT.md) - Frontend setup
- [frontend-documentation.md](frontend-documentation.md) - Additional details (Turkish)

### For Database Operations

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Database overview
- [API_REFERENCE.md](API_REFERENCE.md) - Model-related endpoints
- [database-schema.md](database-schema.md) - Complete schema (Turkish)

### For Operations/DevOps

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - System architecture
- [DEVELOPMENT.md](DEVELOPMENT.md) - Deployment section
- [development-guide.md](development-guide.md) - Additional ops info (Turkish)

---

## Module-Specific Documentation

### Manufacturing Modules
- İş Emirleri (Work Orders) - See API Reference
- Tezgahlar (Workstations) - See API Reference
- Parçalar (Parts) - See API Reference
- Üretim Planı (Production Planning) - See API Reference
- BOM Yönetimi - See API Reference

### Operational Modules
- Fason İşler (Subcontracting) - See API Reference
- Sevkiyat (Shipping) - See API Reference
- Stok Kartları (Inventory) - See API Reference
- Arıza-Bakım (Maintenance) - See API Reference
- Notlar (Notes) - See API Reference

### Supporting Modules
- Raporlar (Reports) - See API Reference
- Vardiya Yönetimi (Shift Management) - See API Reference
- Faturalar (Invoices) - See API Reference
- İrsaliyeler (Delivery Notes) - See API Reference

---

## External Integrations

### CNC Panel (ESP32)
- Location: `CNC_panel/`
- Documentation: [hardware-tools-documentation.md](hardware-tools-documentation.md)
- Purpose: Real-time machine status monitoring

### STEP_BOM_Analyzer (Python)
- Location: `STEP_BOM_Analyzer/`
- Documentation: [hardware-tools-documentation.md](hardware-tools-documentation.md)
- Purpose: STEP file BOM extraction and 3D rendering

### CAD_Import_Client (Python)
- Location: `CAD_Import_Client/`
- Documentation: [hardware-tools-documentation.md](hardware-tools-documentation.md)
- Purpose: SolidWorks automation for thumbnails

---

## Quick Links

### Getting Started
```bash
# Install dependencies
npm run install:all

# Start development
npm run dev

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### Key Ports
- Backend: 3000 (fixed)
- Frontend: 5173 (fixed, kills existing process)

### Database
- File: `backend/database.sqlite`
- ORM: Sequelize 6.37.5
- Migrations: `npm run migrate` (in backend directory)

---

## Documentation Maintenance

### Adding New Documentation

1. Create markdown file in `docs/` directory
2. Follow naming convention: `UPPERCASE.md` for English docs
3. Update this INDEX.md with link and description
4. Cross-reference related documentation

### Updating Existing Documentation

1. Edit the relevant markdown file
2. Update timestamps if applicable
3. Check for broken internal links
4. Update related documentation sections

---

## Contributing

When adding features to the ÜRTM Takip system:

1. Update relevant API documentation in [API_REFERENCE.md](API_REFERENCE.md)
2. Document new components in [COMPONENTS.md](COMPONENTS.md)
3. Add database changes to [DATABASE.md](DATABASE.md)
4. Update [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for major features
5. Update [DEVELOPMENT.md](DEVELOPMENT.md) for new procedures

---

## Version Information

- **Documentation Version**: 1.0
- **Last Updated**: 2025-12-30
- **System Version**: v14.dev1
- **Compatible with**: v13 and later

---

## Support

For questions about documentation:
1. Check existing docs first
2. Review code examples
3. Check Git history for context
4. Refer to Turkish docs for additional details

---

**Documentation Status**: ✅ Complete

All core documentation has been generated covering:
- ✅ System architecture and modules
- ✅ Complete API reference
- ✅ Frontend component structure
- ✅ Development procedures
- ✅ Database schema (supplements existing Turkish docs)
