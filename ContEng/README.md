# ÜRTM Takip - Context Engineering Documentation

## Overview

This directory contains comprehensive context engineering documentation for the ÜRTM Takip manufacturing tracking system. These documents provide structured information for developers, AI assistants, and stakeholders to understand and work effectively with the system.

## Document Structure

### 📋 [00-project-overview.md](./00-project-overview.md)
**High-level system overview and introduction**
- Project summary and technology stack
- Core business domain and modules
- Key features and characteristics
- Development environment setup
- Security and performance overview

### 🏗️ [01-architecture-overview.md](./01-architecture-overview.md)
**Comprehensive system architecture documentation**
- Three-tier architecture with real-time capabilities
- Component architecture and interactions
- Frontend/backend structure and organization
- Data flow and request/response patterns
- Security architecture and performance characteristics
- Deployment architecture for development and production

### 🗄️ [02-database-schema.md](./02-database-schema.md)
**Complete database schema and data model documentation**
- Database overview and configuration
- All 28+ tables with detailed field descriptions
- Primary and foreign key relationships
- Business rules and constraints
- Performance indexes and optimization
- Data integrity and validation rules

### 🌐 [03-api-endpoints.md](./03-api-endpoints.md)
**Comprehensive REST API reference**
- All API endpoints with HTTP methods and parameters
- Request/response formats and examples
- File upload specifications
- Socket.IO real-time events
- Error handling and status codes
- Security features and validation

### ⚛️ [04-frontend-components.md](./04-frontend-components.md)
**React frontend architecture and component documentation**
- Dual-layout system (desktop/mobile)
- Component hierarchy and organization
- Device detection and responsive design
- State management with Redux Toolkit
- Custom hooks and utility functions
- Performance optimization patterns

### 📊 [05-business-workflows.md](./05-business-workflows.md)
**Manufacturing business processes and workflows**
- Production planning and execution workflows
- Work order lifecycle management
- Inventory and parts management processes
- Subcontracting and supplier management
- Quality control and maintenance workflows
- Reporting and analytics processes

### 💻 [06-development-patterns.md](./06-development-patterns.md)
**Development guidelines, patterns, and best practices**
- Project structure conventions
- Backend development patterns (models, controllers, routes)
- Frontend development patterns (components, hooks, state)
- Code style and naming conventions
- Testing patterns and guidelines
- Performance optimization strategies
- Security patterns and deployment guidelines

### 🤖 [07-context-prompts.md](./07-context-prompts.md)
**AI assistant context prompts and guidelines**
- General system context for AI assistants
- Specialized contexts for backend/frontend development
- Database and API development contexts
- Mobile development specific guidance
- Task-specific context prompts
- Integration and troubleshooting contexts

## Quick Reference

### For New Developers
1. Start with [00-project-overview.md](./00-project-overview.md) for system introduction
2. Review [01-architecture-overview.md](./01-architecture-overview.md) for technical architecture
3. Study [05-business-workflows.md](./05-business-workflows.md) for business understanding
4. Follow [06-development-patterns.md](./06-development-patterns.md) for coding standards

### For AI Assistants
1. Use [07-context-prompts.md](./07-context-prompts.md) for appropriate context selection
2. Reference [02-database-schema.md](./02-database-schema.md) for data model understanding
3. Consult [03-api-endpoints.md](./03-api-endpoints.md) for API integration
4. Review [04-frontend-components.md](./04-frontend-components.md) for UI development

### For System Integration
1. Review [03-api-endpoints.md](./03-api-endpoints.md) for API specifications
2. Study [02-database-schema.md](./02-database-schema.md) for data relationships
3. Understand [05-business-workflows.md](./05-business-workflows.md) for process integration
4. Follow [06-development-patterns.md](./06-development-patterns.md) for implementation

### For Business Analysis
1. Start with [00-project-overview.md](./00-project-overview.md) for system capabilities
2. Deep dive into [05-business-workflows.md](./05-business-workflows.md) for process details
3. Review [04-frontend-components.md](./04-frontend-components.md) for user interface understanding

## System Summary

**ÜRTM Takip** is a comprehensive manufacturing production tracking system featuring:

### Core Capabilities
- **Production Tracking**: Complete work order lifecycle management
- **Workstation Management**: Real-time machine monitoring and control
- **Inventory Control**: Raw material and parts inventory management
- **Subcontracting**: External supplier and quote management
- **Quality Control**: Integrated quality tracking and documentation
- **Mobile Support**: Full mobile-responsive interface for shop floor workers
- **Real-time Updates**: Live production data via Socket.IO
- **Comprehensive Reporting**: Production analytics and performance metrics

### Technical Highlights
- **Dual-Layout Architecture**: Separate optimized interfaces for desktop and mobile
- **Manufacturing-Focused**: Designed specifically for production environments
- **Real-time Operation**: Socket.IO for live production floor updates
- **Turkish Language**: Complete Turkish language support
- **File Management**: Comprehensive upload system for technical drawings and documentation
- **Excel Integration**: Advanced Excel import/export for manufacturing data

### Business Impact
- **Production Efficiency**: Streamlined production tracking and optimization
- **Quality Assurance**: Integrated quality control and documentation
- **Resource Optimization**: Workstation utilization and capacity planning
- **Supply Chain Integration**: Subcontractor and supplier management
- **Mobile Accessibility**: Shop floor workers can access and update data in real-time
- **Data-Driven Decisions**: Comprehensive reporting and analytics

## Development Environment

### Prerequisites
- Node.js 18.17.0+
- npm 9.x+
- SQLite 3
- Modern web browser

### Quick Start
```bash
# Clone and setup
git clone <repository>
cd URTMtakip

# Install dependencies
npm run install:all

# Start development
npm run dev
```

### Project Structure
```
URTMtakip/
├── backend/           # Node.js/Express backend
├── frontend/          # React frontend
├── ContEng/          # This documentation
├── docs/             # Additional documentation
├── CNC_panel/        # CNC integration panel
└── package.json      # Root package configuration
```

## Version Information

- **Current Version**: v11.3.6
- **Last Updated**: August 2024
- **Documentation Version**: 1.0
- **Node.js**: 18.17.0+
- **React**: 18.2.0
- **Material-UI**: 5.17.1
- **Database**: SQLite with Sequelize ORM

## Support and Contribution

### Development Guidelines
All development should follow the patterns and conventions outlined in [06-development-patterns.md](./06-development-patterns.md).

### Code Style
- **Backend**: Node.js with ES6+ features, Sequelize ORM patterns
- **Frontend**: React functional components with hooks, Material-UI design system
- **Database**: SQLite with comprehensive foreign key relationships
- **Language**: Turkish for all user-facing content

### Testing
- Backend unit tests with Jest
- Frontend component tests with React Testing Library
- Integration tests for API endpoints
- Manual testing protocols for manufacturing workflows

### Documentation Updates
When making significant changes to the system:
1. Update relevant documentation files in this directory
2. Maintain consistency across all documentation
3. Update version information and change logs
4. Ensure AI assistant context prompts remain accurate

## Related Files

### Configuration Files
- `package.json` - Root project configuration
- `backend/package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies
- `pm2.config.json` - Production process management
- `nginx-config.conf` - Web server configuration

### Documentation Files
- `CLAUDE.md` - Project instructions for AI assistants
- `SERVER-SETUP-GUIDE.md` - Production server setup
- Various module-specific documentation in `docs/`

### Database Files
- `backend/database.sqlite` - Main database file
- `backend/DB_YEDEKLER/` - Database backups
- `DB/` - Database schema and migration files

This context engineering documentation provides a comprehensive foundation for understanding, developing, and maintaining the ÜRTM Takip manufacturing tracking system. It serves as both technical reference and business process documentation for all stakeholders involved in the system's operation and evolution.