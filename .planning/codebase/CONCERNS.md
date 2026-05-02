---
name: CONCERNS.md
description: Technical debt, known issues, security concerns, and fragile areas
type: codebase
---

# Concerns & Issues

## Technical Debt

### Routes & Modularization
- 69 route files (backend) - high count indicates need for consolidation
- Many route files could benefit from modularization

### Tests
- Minimal test coverage (pre-v1.0)
- No test automation in CI/CD

### Documentation
- Some docs are outdated
- No automated doc generation

## Agent System Concerns (v1.0+)

### Multi-Agent Complexity
- **New**: Module agent'lerin doğru sırayla başlatılması gerekiyor
- **New**: Master agent crash durumunda modül ajanların davranışı belirsiz
- **New**: Action definitions json yapısı büyüyor, yönetimi zorlaşabilir

### Database Access Layer
- **New**: db-access.js tüm modüllere direct DB erişimi veriyor — permission kontrolü kritik
- **New**: SQL injection koruması için parameterized queries zorunlu
- **Risk**: Yanlış query'ler tüm veritabanını etkileyebilir

### API Client
- **New**: api-client.js internal API'leri çağırıyor — recursion riski var
- **New**: 30s timeout var ama network hatalarında retry logic yok

### Action Definitions
- **New**: action-definitions.json büyüyor — merge conflict riski
- **New**: Yeni autonomous_actions eklenirken requires_approval dikkatli set edilmeli

### Master-Agent Coordination
- **New**: WebSocket bağlantısı kesilirse modül ajan ne yapacak?
- **New**: Master onay beklerken timeout — kullanıcı müdahalesi gerekiyor
- **New**: Alternatif aksiyon önerisi yetersiz kalabilir

## Known Issues

### Port Configuration
- Ports are hardcoded (3000, 5173, 3001 for agents)
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

### Agent Security (v1.0+)
- **New**: X-Module-Agent header spoofing riski — ajan kimlik doğrulaması yetersiz
- **New**: db-access.js ile direct DB erişimi — sadece belirli tablelere limit gerekli
- **New**: api-client.js ile internal API call'ları — rate limiting yok

## Fragile Areas

### Production Planning
- Dual systems (V1, V2) - maintenance overhead
- Excel import logic complex

### CAD Integration
- External dependencies (FreeCAD, SolidWorks)
- Platform-specific code

### Hardware
- ESP32 Wi-Fi reliability depends on network

### Agent Integration (v1.0+)
- **New**: IOT data → module agent pipeline'ı test edilmemiş
- **New**: Real-time karar verme için latency sorunu olabilir
- **New**: Module agent'ler arası communication yok — hepsi master üzerinden

## Recommendations

### Immediate (v1.0)
1. db-access.js için table-level permission kontrolü ekle
2. api-client.js için retry logic ekle
3. WebSocket disconnect handling ekle (module-agent.js)
4. Action definitions için schema validation ekle

### Short Term (v2.0)
1. Add automated tests (mevcut 18 test var ama CI/CD yok)
2. Consolidate route files by feature
3. Add production-ready database (PostgreSQL)
4. Implement CI/CD pipeline
5. Add monitoring/observability for agent decisions

### Long Term
1. Module agent'ler arası direct communication (şu an sadece master üzerinden)
2. Distributed agent coordination
3. Real-time streaming analytics
4. Predictive maintenance AI