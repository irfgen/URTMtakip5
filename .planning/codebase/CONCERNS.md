---
name: CONCERNS.md
description: Technical debt, known issues, security concerns, and fragile areas
type: codebase
---

# Concerns & Issues

## Technical Debt

### Routes Count
- 69 route files (backend) - high count indicates need for consolidation
- Many route files could benefit from modularization

### Tests
- Minimal test coverage
- No test automation in CI/CD

### Documentation
- Some docs are outdated
- No automated doc generation

## Known Issues

### Port Configuration
- Ports are hardcoded (3000, 5173)
- No environment override for production

### Database
- SQLite (file-based) - not suitable for production scale
- No connection pooling optimization

### Error Handling
- Inconsistent error handling across routes
- Some routes lack proper validation

## Security Concerns

### Credentials
- JWT secrets in `.env` - ensure production uses strong keys
- No HTTPS enforcement

### File Uploads
- Large file support (100MB) - potential DoS vector
- Consider adding upload quotas

### CORS
- Development origin hardcoded - review for production

## Fragile Areas

### Production Planning
- Dual systems (V1, V2) - maintenance overhead
- Excel import logic complex

### CAD Integration
- External dependencies (FreeCAD, SolidWorks)
- Platform-specific code

### Hardware
- ESP32 Wi-Fi reliability depends on network

## Recommendations

1. Add automated tests
2. Consolidate route files by feature
3. Add production-ready database (PostgreSQL)
4. Implement CI/CD pipeline
5. Add monitoring/observability