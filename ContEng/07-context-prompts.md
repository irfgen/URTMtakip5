# AI Assistant Context Prompts - ÜRTM Takip

## Overview

This document provides structured context prompts for AI assistants working on the ÜRTM Takip manufacturing tracking system. These prompts are designed to give AI assistants the necessary context to understand the project structure, business domain, and development patterns.

## General System Context Prompt

```
You are working on ÜRTM Takip, a comprehensive manufacturing production tracking system built with Node.js/Express backend and React frontend. This is an industrial ERP system specifically designed for manufacturing environments.

## Project Summary:
- **Domain**: Manufacturing production tracking and management
- **Backend**: Node.js + Express.js + SQLite + Sequelize ORM + Socket.IO
- **Frontend**: React 18 + Material-UI + Redux Toolkit + Vite
- **Architecture**: Dual-layout system (desktop + mobile responsive)
- **Database**: SQLite with comprehensive manufacturing schema
- **Real-time**: Socket.IO for live production updates
- **Version**: v11.3.6 (actively developed)

## Key Business Modules:
1. **İş Emirleri (Work Orders)** - Core production tracking
2. **Tezgahlar (Workstations)** - Machine management and monitoring  
3. **Parçalar (Parts)** - Parts catalog with technical specifications
4. **Üretim Planı (Production Planning)** - Excel-based planning with BOM
5. **Stok Kartları (Inventory)** - Raw material inventory management
6. **Fason İşler (Subcontractor Work)** - External production management
7. **Sevkiyat (Shipping)** - Delivery tracking with documentation
8. **Arıza-Bakım (Maintenance)** - Equipment maintenance tracking
9. **Notlar (Notes)** - Note system with image support
10. **Raporlar (Reports)** - Production analytics and reporting

## Technical Architecture:
- **Mobile-First**: Dual layout with automatic device detection
- **Real-time**: Socket.IO for live production floor updates
- **File Management**: Comprehensive upload system for technical drawings, photos, Excel files
- **Turkish Language**: All UI and business logic in Turkish
- **Manufacturing Focus**: Designed specifically for production floor operations

## Development Commands:
- `npm run dev` - Start both backend and frontend
- `npm run install:all` - Install all dependencies
- Backend: `cd backend && npm run dev` (port 3001)
- Frontend: `cd frontend && npm run dev` (port 3000)

When working on this project, consider manufacturing workflows, mobile usability for shop floor workers, real-time data needs, and Turkish language requirements.
```

## Backend Development Context

```
You are working on the backend of ÜRTM Takip, a manufacturing ERP system built with Node.js and Express.js.

## Backend Architecture:
- **Framework**: Express.js with comprehensive middleware stack
- **Database**: SQLite with Sequelize ORM
- **Real-time**: Socket.IO server for live updates
- **File Upload**: Multer with 100MB limit, multiple destinations
- **Validation**: Joi schemas for input validation
- **Logging**: Winston for error and activity logging
- **Security**: Helmet, CORS, rate limiting

## Project Structure:
```
backend/src/
├── index.js           # Application entry point
├── config/            # Database and app configuration
├── models/            # Sequelize models (28+ models)
├── controllers/       # Business logic layer
├── routes/            # API endpoint definitions
├── middleware/        # Custom middleware
├── services/          # External service integrations
├── utils/             # Shared utilities
└── migrations/        # Database migrations
```

## Key Models:
- **is_emirleri** - Work orders (primary production entity)
- **tezgahlar** - Workstations/machines
- **parcalar** - Parts catalog
- **stok_kartlari** - Inventory/stock cards
- **uretim_plani** - Production plans
- **fason_is_emirleri** - Subcontractor work orders
- **boms** - Bill of Materials
- **notlar** - Notes system

## API Patterns:
- RESTful endpoints under `/api/`
- Consistent JSON response format: `{success, data, error}`
- Socket.IO events for real-time updates
- File upload endpoints with validation
- Comprehensive error handling and logging

## Database Patterns:
- UUID primary keys for major entities
- JSON fields for flexible data storage
- Soft delete with paranoid mode
- Comprehensive foreign key relationships
- Turkish field naming convention (snake_case)

## Development Guidelines:
- Use async/await for database operations
- Implement proper error handling with Winston logging
- Follow MVC pattern with clear separation
- Real-time updates via Socket.IO broadcasts
- Input validation with Joi schemas
- File upload security with type/size validation

When working on backend code, ensure proper database transactions, real-time event emission, comprehensive error handling, and manufacturing business logic compliance.
```

## Frontend Development Context

```
You are working on the frontend of ÜRTM Takip, a React-based manufacturing tracking interface with sophisticated mobile-responsive design.

## Frontend Architecture:
- **Framework**: React 18 with hooks and functional components
- **UI Library**: Material-UI (MUI) v5 with custom themes
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router with device-aware routing
- **Build Tool**: Vite for fast development and building
- **Real-time**: Socket.IO client for live updates

## Dual-Layout System:
- **Desktop Layout**: Sidebar navigation, dense data tables, multi-column layouts
- **Mobile Layout**: Bottom navigation, touch-optimized, single-column design
- **Device Detection**: Automatic switching based on screen size and user preference
- **Route Separation**: `/mobile/*` routes for mobile, standard routes for desktop
- **Theme Switching**: Separate themes optimized for each device type

## Project Structure:
```
frontend/src/
├── App.jsx                 # Main app with device detection
├── components/             # Shared components
│   ├── mobile/            # Mobile-specific components
│   ├── [Feature]/         # Feature-specific components
│   └── Layout.jsx         # Desktop layout
├── pages/                 # Route-level components
│   ├── mobile/            # Mobile page variants
│   └── [Feature].jsx      # Desktop pages
├── hooks/                 # Custom React hooks
├── services/              # API communication layer
├── store/                 # Redux Toolkit store and slices
├── utils/                 # Utility functions
└── styles/                # Global styles
```

## Key Components:
- **Layout/MobileLayout** - Main layout components
- **ViewSwitcher** - Manual device layout switching
- **Work Order Components** - Core production tracking UI
- **Workstation Components** - Machine management interface
- **Parts Components** - Parts catalog and management
- **Mobile Components** - Touch-optimized alternatives

## State Management:
- Redux Toolkit slices for complex application state
- Local component state for UI-only data
- Custom hooks for data fetching and device detection
- Caching service for performance optimization

## Mobile Patterns:
- Touch-friendly button sizes (min 44px)
- Bottom navigation for primary actions
- Simplified forms with larger inputs
- Gesture-friendly interactions
- Optimized typography for mobile reading

## Development Guidelines:
- Use functional components with hooks
- Implement proper error boundaries
- Follow Material-UI design patterns
- Ensure mobile responsiveness
- Use React.memo for performance optimization
- Implement proper loading and error states

When working on frontend code, prioritize mobile usability, maintain consistency across device types, implement proper accessibility, and ensure real-time data synchronization.
```

## Database Development Context

```
You are working with the database layer of ÜRTM Takip, a comprehensive manufacturing ERP system using SQLite with Sequelize ORM.

## Database Overview:
- **Engine**: SQLite with WAL mode for concurrent access
- **ORM**: Sequelize with comprehensive model associations
- **Schema**: 28+ tables covering complete manufacturing workflow
- **Data Integrity**: Foreign key constraints, validation rules, audit trails
- **Performance**: Strategic indexes, optimized queries

## Core Table Categories:

### Production Tables:
- **is_emirleri** - Work orders (primary production tracking)
- **tezgahlar** - Workstations and machines
- **parcalar** - Parts catalog with specifications
- **uretim_plani** - Production planning and scheduling
- **islem_kayitlari** - Process records and tracking

### Inventory Tables:
- **stok_kartlari** - Raw material inventory
- **parca_kayitlari** - Part file and document records
- **boms** - Bill of Materials with JSON structure

### Subcontracting Tables:
- **fason_is_emirleri** - Subcontractor work orders
- **fason_gruplar** - Subcontractor groups
- **fason_teklifler** - Subcontractor quotes

### Support Tables:
- **notlar** - Notes system with categories
- **ariza_bakim** - Maintenance and breakdown records
- **vardiyalar** - Shift management
- **personeller** - Personnel management

## Key Relationships:
- Work orders link to workstations, parts, and production plans
- Parts connect to stock cards for raw material tracking
- Subcontractor jobs organized in groups with quote management
- Comprehensive audit trails for all critical operations

## Data Patterns:
- **UUID Primary Keys** for major business entities
- **JSON Fields** for flexible data storage (BOMs, configurations)
- **Soft Deletes** with paranoid mode for audit trails
- **Timestamps** for all records (createdAt, updatedAt)
- **Turkish Naming** following snake_case convention

## Business Rules:
- Work orders cannot be deleted once production starts
- Critical stock levels trigger automatic alerts
- All file uploads linked to appropriate entities
- Comprehensive validation at model level
- Real-time updates propagated via Socket.IO

## Performance Considerations:
- Strategic indexes on frequently queried fields
- Normalized schema with efficient joins
- JSON field usage for flexible requirements
- Connection pooling for concurrent access

When working with the database, ensure data integrity, follow established patterns, implement proper validation, and maintain audit trails for manufacturing compliance.
```

## API Development Context

```
You are working with the API layer of ÜRTM Takip, a RESTful API built with Express.js for manufacturing production tracking.

## API Architecture:
- **Base URL**: `http://localhost:3001/api`
- **Format**: RESTful endpoints with consistent JSON responses
- **Real-time**: Socket.IO WebSocket server for live updates
- **File Upload**: Multer-based upload system with validation
- **Security**: Helmet, CORS, rate limiting, input validation

## Response Format:
All API responses follow this structure:
```json
{
  "success": true|false,
  "data": <response_data>,
  "error": "<error_message>",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Core API Modules:

### Production APIs:
- `/api/is-emirleri` - Work orders management
- `/api/tezgahlar` - Workstation operations
- `/api/parcalar` - Parts catalog
- `/api/uretim-plani` - Production planning
- `/api/boms` - Bill of Materials

### Inventory APIs:
- `/api/stok-kartlari` - Stock/inventory management
- `/api/parca-kayitlari` - Part records and files

### Subcontracting APIs:
- `/api/fason/is-emirleri` - Subcontractor work orders
- `/api/fason/teklifler` - Subcontractor quotes
- `/api/fason-grup` - Subcontractor groups

### Support APIs:
- `/api/notlar` - Notes system with image upload
- `/api/sevkiyat` - Shipping management
- `/api/raporlar` - Reports and analytics
- `/api/upload` - File upload endpoints

## File Upload System:
- **Destinations**: Multiple upload paths for different file types
- **Validation**: File type and size restrictions
- **Security**: Turkish character sanitization, unique naming
- **Limits**: 100MB general limit, 10MB for images

## Real-time Events:
- `isEmriGuncellendi` - Work order updates
- `tezgahDurumDegisti` - Workstation status changes
- `stokUyarisi` - Stock level alerts

## Authentication & Security:
- Currently no authentication (can be extended)
- Input validation with Joi schemas
- CORS configuration for frontend access
- Rate limiting for API protection
- SQL injection prevention via Sequelize

## Error Handling:
- Global error handler with Winston logging
- Specific error types (validation, not found, server error)
- Detailed error messages in development
- Sanitized errors in production

## API Patterns:
- Use HTTP status codes appropriately (200, 201, 400, 404, 500)
- Include pagination for list endpoints
- Support filtering and searching via query parameters
- Emit Socket.IO events for real-time updates
- Log all operations for audit trails

When working with APIs, ensure proper validation, consistent response format, real-time event emission, comprehensive error handling, and manufacturing business logic compliance.
```

## Mobile Development Context

```
You are working on the mobile interface of ÜRTM Takip, a React-based mobile-responsive manufacturing tracking application designed for shop floor workers.

## Mobile-First Philosophy:
The mobile interface is not an afterthought but a primary interface for production floor workers who need quick, touch-friendly access to production data and operations.

## Mobile Architecture:
- **Layout**: Bottom navigation with 6 primary modules
- **Responsive Design**: Automatic detection with manual override capability
- **Touch Optimization**: Minimum 44px touch targets, gesture-friendly interactions
- **Offline Capability**: Caching service with sync on reconnection
- **Performance**: Optimized for slower mobile networks

## Mobile-Specific Routes:
All mobile routes are prefixed with `/mobile/`:
- `/mobile/tezgahlar` - Mobile workstation management
- `/mobile/is-emirleri` - Mobile work orders
- `/mobile/parcalar` - Mobile parts catalog
- `/mobile/uretim-plani` - Mobile production planning
- `/mobile/sevkiyat` - Mobile shipping
- `/mobile/raporlar` - Mobile reports

## Mobile Component Patterns:
- **Card-based UI**: Information organized in easily scannable cards
- **Simplified Forms**: Fewer fields per screen, larger inputs
- **Action Buttons**: Full-width buttons for primary actions
- **Navigation**: Bottom navigation bar for primary modules
- **Modals**: Full-screen modals for complex operations

## Mobile Components Directory:
```
components/mobile/
├── MobilParcaSecici.jsx      # Mobile part selector
├── SevkiyatFormMobile.jsx    # Mobile shipping form
├── IsEmriFiltreleMobile.jsx  # Mobile work order filtering
├── UretimPlaniKartiMobile.jsx # Mobile production plan cards
└── [Feature]Mobile.jsx       # Mobile variants of desktop components
```

## Touch Interaction Guidelines:
- **Minimum Touch Size**: 44px x 44px for all interactive elements
- **Spacing**: Adequate spacing between touch targets (8px minimum)
- **Feedback**: Visual feedback for all touch interactions
- **Gestures**: Support for swipe, pinch, and long-press where appropriate
- **Accessibility**: Proper ARIA labels and roles

## Mobile Theme Adaptations:
- **Typography**: Larger font sizes for mobile readability
- **Colors**: High contrast for outdoor/industrial environments
- **Spacing**: Increased padding and margins for touch interaction
- **Icons**: Larger icons with clear visual hierarchy

## Performance Considerations:
- **Lazy Loading**: Component-level code splitting
- **Image Optimization**: Progressive loading with fallbacks
- **Caching**: Aggressive caching of static data
- **Network**: Optimized for intermittent connectivity

## Manufacturing Floor Requirements:
- **Durability**: Works with gloved hands and in industrial environments
- **Speed**: Quick access to critical information
- **Simplicity**: Streamlined workflows for shop floor operations
- **Reliability**: Offline capability for network interruptions

## Mobile Development Guidelines:
- Test on actual mobile devices, not just browser dev tools
- Consider varying screen sizes (phones, tablets, industrial displays)
- Implement proper loading states for slower connections
- Use touch-friendly Material-UI components
- Ensure readable text in bright/dim lighting conditions
- Support both portrait and landscape orientations

When developing mobile features, prioritize usability in manufacturing environments, ensure touch accessibility, maintain performance on lower-end devices, and design for real-world production floor conditions.
```

## Task-Specific Context Prompts

### Bug Fixing Context
```
You are debugging an issue in ÜRTM Takip. When analyzing problems:

1. **Check Real-time Events**: Many issues are related to Socket.IO event handling
2. **Mobile vs Desktop**: Issues may be device-specific due to dual-layout system
3. **Database Relationships**: Manufacturing data has complex associations
4. **File Upload Issues**: Common problems with 100MB limit and Turkish characters
5. **Validation Errors**: Joi schemas enforce strict manufacturing business rules
6. **Browser Compatibility**: Ensure compatibility with industrial/embedded browsers
7. **Network Issues**: Consider intermittent connectivity in manufacturing environments

Common Problem Areas:
- Socket.IO disconnections affecting real-time updates
- Mobile touch interactions not working properly
- File upload failures due to size or type restrictions
- Database constraint violations in manufacturing workflows
- Redux state management issues with complex data structures
- Device detection false positives/negatives
- Turkish character encoding in filenames and data

Always check browser console, server logs, and network tab when debugging.
```

### Feature Development Context
```
You are adding a new feature to ÜRTM Takip. Consider these manufacturing requirements:

1. **Mobile-First**: Design for touch interaction and shop floor use
2. **Real-time Updates**: Emit Socket.IO events for live data changes
3. **Audit Trail**: Log all operations for manufacturing compliance
4. **Turkish Language**: All UI text and field names in Turkish
5. **Manufacturing Workflow**: Ensure feature fits production processes
6. **File Support**: Consider if feature needs document/image upload
7. **Validation**: Implement strict validation for data integrity

Development Checklist:
- [ ] Database model with proper relationships
- [ ] Backend API with validation and error handling
- [ ] Frontend desktop component with Material-UI
- [ ] Mobile-optimized component variant
- [ ] Real-time Socket.IO events
- [ ] Redux state management if needed
- [ ] Proper error handling and loading states
- [ ] Turkish language support
- [ ] Manufacturing business rule compliance
- [ ] File upload support if required

Always consider how the feature affects production workflows and shop floor workers.
```

### Database Migration Context
```
You are working with database migrations in ÜRTM Takip. Important considerations:

1. **Production Safety**: Migrations must be reversible and non-destructive
2. **Data Integrity**: Maintain referential integrity during schema changes
3. **Manufacturing Continuity**: Minimize downtime during production hours
4. **Backup Strategy**: Always backup before major schema changes
5. **Turkish Naming**: Follow snake_case Turkish field naming convention
6. **Indexes**: Add appropriate indexes for performance
7. **Audit Trail**: Maintain audit capabilities through changes

Migration Patterns:
- Use Sequelize migration format with up/down functions
- Add proper foreign key constraints
- Include data migration scripts when needed
- Test migrations on development database first
- Document breaking changes and required application updates
- Consider impact on real-time Socket.IO events
- Ensure mobile and desktop interfaces handle schema changes

Migration files should be named with timestamp and descriptive name following the pattern: `YYYYMMDDHHMMSS-descriptive-migration-name.js`
```

## Integration Context Prompts

### Excel Integration Context
```
ÜRTM Takip heavily uses Excel integration for manufacturing data. When working with Excel features:

1. **BOM Imports**: Excel files contain complex Bill of Materials structures
2. **Production Planning**: Excel-based production planning with multiple sheets
3. **Quote Processing**: Subcontractor quotes uploaded via Excel
4. **Data Validation**: Strict validation for manufacturing compliance
5. **Turkish Characters**: Proper handling of Turkish text in Excel files
6. **Large Files**: Support for large manufacturing data files
7. **Error Reporting**: Detailed error reporting for data issues

Excel Processing Patterns:
- Use `xlsx` library for reading/writing Excel files
- Validate data structure before processing
- Provide detailed error messages for invalid data
- Support multiple sheet processing
- Handle Turkish character encoding properly
- Implement progress indicators for large files
- Generate summary reports of import operations

Common Excel operations include BOM imports, production plan uploads, quote processing, and manufacturing data exports.
```

### Real-time Integration Context
```
ÜRTM Takip is a real-time manufacturing system. When working with real-time features:

1. **Socket.IO Events**: Core real-time communication mechanism
2. **Production Updates**: Live work order and workstation status updates
3. **Mobile Synchronization**: Keep mobile devices synchronized with production data
4. **Connection Management**: Handle disconnections gracefully
5. **Event Broadcasting**: Selective broadcasting to relevant clients
6. **Performance**: Optimize for frequent updates without overwhelming clients

Real-time Event Patterns:
- `isEmriGuncellendi` - Work order status changes
- `tezgahDurumDegisti` - Workstation status updates
- `stokUyarisi` - Critical stock level alerts
- `uretimPlaniDegisti` - Production plan changes
- `fasonDurumDegisti` - Subcontractor job updates

Always emit appropriate Socket.IO events when data changes, especially for production-critical information that affects shop floor operations.
```

These context prompts provide AI assistants with the necessary background to understand the ÜRTM Takip system's complexity, manufacturing focus, dual-layout architecture, and development patterns, enabling more effective assistance with development tasks.