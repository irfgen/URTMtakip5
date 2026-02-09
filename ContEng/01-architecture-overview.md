# Architecture Overview - ÜRTM Takip

## System Architecture

ÜRTM Takip follows a traditional three-tier architecture with modern enhancements for real-time capabilities and mobile support.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (Desktop)    │    React Frontend (Mobile)   │
│  - Material-UI Components    │    - Touch-optimized UI      │
│  - Redux State Management    │    - Mobile-specific routes  │
│  - Desktop-optimized layouts │    - Gesture-friendly design │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTP/REST API
                         Socket.IO (WebSocket)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│              Express.js Backend Server                      │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Controllers │   Routes    │ Middleware  │  Services   │  │
│  │             │             │             │             │  │
│  │ - Business  │ - API       │ - Auth      │ - Image     │  │
│  │   Logic     │   Endpoints │ - CORS      │   Processing│  │
│  │ - Validation│ - Parameter │ - Rate      │ - OCR       │  │
│  │ - Response  │   Handling  │   Limiting  │ - File      │  │
│  │   Formatting│             │ - Error     │   Upload    │  │
│  │             │             │   Handling  │             │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Sequelize ORM Layer                   │    │
│  │  - Model Definitions  - Associations              │    │
│  │  - Migrations        - Validations                │    │
│  │  - Transactions      - Hooks                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                          SQL Queries
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│                    SQLite Database                          │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Production  │ Inventory   │ Machine     │ Reporting   │  │
│  │ Tables      │ Tables      │ Tables      │ Tables      │  │
│  │             │             │             │             │  │
│  │ - is_emirleri│ - stok_    │ - tezgahlar │ - islem_    │  │
│  │ - boms      │   kartlari  │ - makina    │   kayitlari │  │
│  │ - parcalar  │ - uretim_   │ - vardiya   │ - tezgah_   │  │
│  │ - fason     │   plani     │ - personel  │   durum_log │  │
│  │ - sevkiyat  │             │             │ - raporlar  │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                             │
│  File System Storage:                                       │
│  - uploads/ (technical drawings, photos)                   │
│  - importlar/ (Excel files, BOM data)                      │
│  - logs/ (application logs)                                │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Backend Architecture

#### Core Application Structure
```
backend/src/
├── index.js                 # Application entry point
├── config/
│   ├── database.js         # Database connection configuration
│   └── config.js           # Application configuration
├── models/
│   ├── index.js            # Model registry and associations
│   ├── IsEmri.js           # Work order model
│   ├── Parca.js            # Parts model
│   ├── Tezgah.js           # Workstation model
│   ├── Bom.js              # Bill of materials model
│   ├── StokKarti.js        # Inventory model
│   └── [other models...]   # Additional domain models
├── controllers/
│   ├── isEmirleriController.js    # Work orders business logic
│   ├── parcaController.js         # Parts management logic
│   ├── tezgahController.js        # Workstation management
│   ├── bomController.js           # BOM operations
│   └── [other controllers...]     # Additional controllers
├── routes/
│   ├── isEmirleriRoutes.js       # Work orders API routes
│   ├── parcaRoutes.js            # Parts API routes
│   ├── tezgahRoutes.js           # Workstation API routes
│   └── [other routes...]         # Additional route definitions
├── middleware/
│   ├── errorHandler.js           # Global error handling
│   ├── rateLimiter.js            # API rate limiting
│   └── teknikResimUpload.js      # File upload middleware
├── services/
│   ├── imageProcessor.js         # Image processing service
│   ├── ocrService.js             # OCR text extraction
│   └── textAnalyzer.js           # Text analysis service
└── utils/
    ├── responseFormatter.js      # Consistent API responses
    ├── statusUtils.js            # Status management utilities
    └── dbReset.js                # Database reset utilities
```

#### Model Layer Design
All models follow Sequelize ORM patterns with:
- **Standardized Timestamps**: createdAt, updatedAt
- **Soft Delete Support**: deletedAt field where applicable
- **Association Definitions**: Clear foreign key relationships
- **Validation Rules**: Data integrity constraints
- **Custom Methods**: Business logic helpers

#### API Layer Design
RESTful API design with:
- **Consistent URL Structure**: `/api/module/action`
- **HTTP Method Conventions**: GET, POST, PUT, DELETE
- **Response Format**: Standardized JSON responses
- **Error Handling**: Centralized error processing
- **Input Validation**: Joi schema validation

### Frontend Architecture

#### Component Hierarchy
```
frontend/src/
├── App.jsx                    # Root application component
├── components/
│   ├── Layout.jsx            # Main desktop layout
│   ├── MobileLayout.jsx      # Mobile-specific layout
│   ├── IsEmri*/              # Work order components
│   ├── Parca*/               # Parts management components
│   ├── Tezgah*/              # Workstation components
│   ├── UretimPlani*/         # Production planning components
│   ├── Sevkiyat*/            # Shipping components
│   ├── Raporlar*/            # Reporting components
│   ├── Notlar*/              # Notes system components
│   └── mobile/               # Mobile-specific components
├── pages/
│   ├── Dashboard.jsx         # Main dashboard
│   ├── IsEmirleri.jsx        # Work orders page
│   ├── Parcalar.jsx          # Parts management page
│   ├── Tezgahlar.jsx         # Workstations page
│   ├── UretimPlani.jsx       # Production planning page
│   ├── Sevkiyat.jsx          # Shipping page
│   ├── Raporlar.jsx          # Reports page
│   └── mobile/               # Mobile page variants
├── hooks/
│   ├── useDeviceDetect.js    # Device type detection
│   ├── useDeviceOverride.js  # Manual device override
│   └── useStokKartlari.js    # Inventory data hook
├── services/
│   ├── api.js                # Main API client
│   ├── cacheService.js       # Data caching service
│   ├── notlarService.js      # Notes service API
│   └── teknikResimService.js # Technical drawing service
├── store/
│   ├── index.js              # Redux store configuration
│   └── slices/
│       ├── isEmirleriSlice.js    # Work orders state
│       ├── uretimPlaniSlice.js   # Production planning state
│       └── arizaBakimSlice.js    # Maintenance state
└── utils/
    ├── apiClient.js          # HTTP client configuration
    ├── imageUtils.js         # Image handling utilities
    ├── statusUtils.js        # Status management utilities
    └── portDiscovery.js      # Development port discovery
```

#### Responsive Design Strategy
The application implements a dual-layout strategy:

**Desktop Layout (`Layout.jsx`)**:
- Full sidebar navigation
- Multi-column layouts
- Hover interactions
- Keyboard shortcuts
- Dense data tables

**Mobile Layout (`MobileLayout.jsx`)**:
- Bottom navigation bar
- Single-column layouts
- Touch-friendly buttons
- Swipe gestures
- Simplified forms

#### State Management Architecture
```
Redux Store
├── isEmirleri/           # Work orders state
│   ├── entities         # Normalized work order data
│   ├── loading          # Loading states
│   ├── filters          # Filter criteria
│   └── pagination       # Pagination info
├── uretimPlani/         # Production planning state
│   ├── plans            # Production plans
│   ├── schedules        # Schedule data
│   └── resources        # Resource allocation
└── arizaBakim/          # Maintenance state
    ├── reports          # Maintenance reports
    ├── equipment        # Equipment status
    └── schedules        # Maintenance schedules
```

## Data Flow Architecture

### Request Flow
1. **Client Request**: React component triggers action
2. **API Service**: Service layer makes HTTP request
3. **Backend Route**: Express route receives request
4. **Controller**: Business logic processes request
5. **Model Layer**: Sequelize interacts with database
6. **Response**: Data flows back through layers
7. **State Update**: Redux store updated with response
8. **UI Update**: React components re-render

### Real-time Flow (Socket.IO)
1. **Event Trigger**: Backend operation completes
2. **Socket Emission**: Server emits event to connected clients
3. **Client Listener**: Frontend receives real-time event
4. **State Update**: Redux store updated with real-time data
5. **UI Update**: Components automatically re-render

### File Upload Flow
1. **File Selection**: User selects file in UI
2. **Client Processing**: Frontend validates file type/size
3. **Multipart Upload**: FormData sent to backend
4. **Middleware Processing**: Multer handles file upload
5. **File Storage**: File saved to organized directory structure
6. **Database Record**: File metadata stored in database
7. **Response**: File URL returned to client

## Security Architecture

### Authentication & Authorization
- **Session Management**: Express sessions (extensible to JWT)
- **Route Protection**: Middleware for protected endpoints
- **Role-Based Access**: User roles for different permissions
- **API Security**: Rate limiting and CORS protection

### Data Security
- **Input Validation**: Joi schemas for all inputs
- **SQL Injection Prevention**: Sequelize parameterized queries
- **File Upload Security**: Type and size validation
- **Error Handling**: Sanitized error messages

### Infrastructure Security
- **HTTPS**: SSL/TLS encryption in production
- **Helmet**: Security headers middleware
- **CORS**: Properly configured cross-origin policies
- **Rate Limiting**: API endpoint protection

## Performance Architecture

### Database Performance
- **Indexing Strategy**: Critical fields indexed
- **Query Optimization**: Efficient Sequelize queries
- **Connection Pooling**: Optimized connection management
- **WAL Mode**: SQLite Write-Ahead Logging

### Caching Strategy
- **Frontend Caching**: React Query for data caching
- **Static File Caching**: Express static file serving
- **Browser Caching**: Proper cache headers
- **Memory Management**: Efficient state management

### Real-time Performance
- **Connection Management**: Socket.IO connection pooling
- **Event Optimization**: Selective event emission
- **Bandwidth Optimization**: Minimal data transmission
- **Reconnection Strategy**: Automatic reconnection handling

## Deployment Architecture

### Development Environment
```
Local Development
├── Backend (Port 3001)
│   ├── Express Server
│   ├── Socket.IO Server
│   └── SQLite Database
├── Frontend (Port 3000)
│   ├── Vite Dev Server
│   ├── Hot Module Replacement
│   └── Proxy to Backend
└── File Storage
    ├── uploads/
    ├── importlar/
    └── logs/
```

### Production Environment
```
Production Server
├── Nginx (Port 80/443)
│   ├── SSL Termination
│   ├── Static File Serving
│   └── Reverse Proxy
├── PM2 Process Manager
│   ├── Backend Process
│   ├── Auto-restart
│   └── Log Management
├── SQLite Database
│   ├── WAL Mode
│   ├── Backup Strategy
│   └── Optimization
└── File System
    ├── Organized Storage
    ├── Backup Strategy
    └── Access Control
```

This architecture supports the manufacturing domain requirements while maintaining scalability, security, and maintainability for the ÜRTM Takip production tracking system.