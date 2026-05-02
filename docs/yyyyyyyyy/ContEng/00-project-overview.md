# ÜRTM Takip - Context Engineering Documentation

## Project Overview

ÜRTM Takip is a comprehensive production tracking and management system designed for industrial manufacturing environments. This context engineering documentation provides a structured approach to understanding, maintaining, and developing the system.

## System Summary

- **Type**: Full-Stack Web Application
- **Backend**: Node.js + Express.js + SQLite
- **Frontend**: React + Vite + Material-UI
- **Architecture**: Monolithic with modular structure
- **Database**: SQLite with Sequelize ORM
- **Real-time**: Socket.IO for live updates
- **Deployment**: PM2, Nginx
- **Version**: v11.3.6 (actively developed)

## Core Business Domain

ÜRTM Takip manages the complete manufacturing lifecycle:

### Primary Modules
1. **İş Emirleri (Work Orders)** - Core production tracking
2. **Tezgahlar (Workstations)** - Machine management and monitoring
3. **Parcalar (Parts)** - Parts catalog with technical specifications
4. **Üretim Planı (Production Planning)** - Excel-based planning with BOM
5. **BOM Yönetimi (BOM Management)** - Bill of Materials hierarchy
6. **Stok Kartları (Inventory)** - Stock management integrated with production
7. **Fason İşler (Subcontractor Work)** - External work management
8. **Sevkiyat (Shipping)** - Delivery tracking with documentation
9. **Arıza-Bakım (Maintenance)** - Equipment maintenance tracking
10. **Raporlar (Reports)** - Production analytics and reporting

### Key Features
- **Mobile-First Design**: Responsive with dedicated mobile layouts
- **Real-time Updates**: Socket.IO for live production status
- **File Management**: Image uploads, Excel processing, PDF handling
- **Multi-format Support**: Excel imports, technical drawings, photos
- **Production Floor Integration**: Touch-optimized interfaces
- **Comprehensive Reporting**: Performance analytics and custom reports

## Technology Stack

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with WAL mode
- **ORM**: Sequelize
- **Real-time**: Socket.IO
- **Security**: Helmet, CORS, rate limiting
- **File Processing**: Multer, XLSX, Sharp
- **Logging**: Winston
- **Validation**: Joi

### Frontend Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **HTTP Client**: Axios
- **Real-time Client**: Socket.IO Client
- **Device Detection**: Custom hooks

### Development Tools
- **Package Manager**: npm
- **Process Manager**: PM2
- **Web Server**: Nginx
- **Version Control**: Git
- **Database Migrations**: Custom migration system
- **Testing**: Jest (configured)

## Project Structure Philosophy

The project follows a feature-based modular architecture:

### Backend Organization
```
backend/src/
├── models/          # Sequelize models with associations
├── controllers/     # Business logic handlers
├── routes/          # API endpoint definitions
├── middleware/      # Custom middleware
├── services/        # External service integrations
├── utils/          # Shared utilities
├── migrations/     # Database schema changes
└── config/         # Application configuration
```

### Frontend Organization
```
frontend/src/
├── components/     # Reusable UI components
├── pages/         # Route-level components
├── hooks/         # Custom React hooks
├── services/      # API communication layer
├── store/         # Redux state management
├── utils/         # Shared utilities
└── mobile/        # Mobile-specific components
```

## Development Patterns

### API Design
- RESTful endpoints under `/api/`
- Consistent response formatting
- Comprehensive error handling
- Input validation with Joi
- Socket.IO events for real-time features

### Database Design
- Normalized schema with clear relationships
- Soft delete patterns for audit trails
- Timestamp tracking (createdAt, updatedAt)
- Foreign key constraints for data integrity
- Indexed fields for performance

### Frontend Patterns
- Component composition over inheritance
- Custom hooks for business logic
- Material-UI theme consistency
- Mobile-first responsive design
- Centralized API client

### State Management
- Redux Toolkit for complex application state
- Local component state for UI-only data
- Context providers for device settings
- Caching service for performance optimization

## File and Documentation Structure

This ContEng folder contains:

```
ContEng/
├── 00-project-overview.md          # This file - high-level overview
├── 01-architecture-overview.md     # System architecture deep dive
├── 02-database-schema.md           # Complete database documentation
├── 03-api-endpoints.md             # Backend API reference
├── 04-frontend-components.md       # Frontend component documentation
├── 05-business-workflows.md        # Business process documentation
├── 06-development-patterns.md      # Code patterns and conventions
├── 07-deployment-guide.md          # Production deployment instructions
├── 08-troubleshooting-guide.md     # Common issues and solutions
├── 09-integration-points.md        # External integrations and APIs
└── 10-context-prompts.md           # AI assistant context prompts
```

## Key Business Rules

1. **Work Order Lifecycle**: Draft → Planned → In Progress → Completed → Shipped
2. **Part Tracking**: All parts must have unique codes and BOM relationships
3. **Machine Assignment**: Work orders assigned to specific workstations
4. **Mobile Accessibility**: All core functions must work on mobile devices
5. **Real-time Updates**: Status changes broadcast immediately
6. **Audit Trail**: All critical changes logged with timestamps
7. **File Management**: Technical drawings and photos linked to parts/orders
8. **Inventory Integration**: Stock movements tracked with production

## Security Considerations

- **Authentication**: Session-based (can be extended)
- **File Uploads**: Size limits and type validation
- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Properly configured for frontend access
- **Rate Limiting**: API endpoint protection
- **SQL Injection Prevention**: Sequelize ORM parameterized queries

## Performance Characteristics

- **Database**: SQLite with WAL mode for concurrent access
- **Caching**: Frontend caching service for frequently accessed data
- **File Storage**: Local filesystem with organized structure
- **Real-time**: Socket.IO for efficient live updates
- **Mobile Optimization**: Responsive design with touch optimization
- **Bundle Size**: Optimized with Vite code splitting

## Maintenance and Versioning

- **Version Format**: v{major}.{minor}.{patch} (e.g., v11.3.6)
- **Database Migrations**: Versioned migration files in backend/src/migrations/
- **Backup Strategy**: Automated database backups in backend/DB_YEDEKLER/
- **Update Process**: Migration scripts for schema and data updates
- **Testing**: Manual testing protocols for each module

This documentation serves as the foundation for understanding the ÜRTM Takip system architecture and provides context for AI assistants and developers working on the project.