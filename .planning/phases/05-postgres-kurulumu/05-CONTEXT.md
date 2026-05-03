# Phase 5: PostgreSQL Kurulumu - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Source:** new-milestone workflow (sqltopos)

## Phase Boundary

Phase 5 focuses on establishing the PostgreSQL infrastructure: installing PostgreSQL, configuring Sequelize to connect to it, and setting up the connection pool. This is the foundation for all subsequent phases.

## Implementation Decisions

### DB-01: PostgreSQL Kurulumu
- **Option A: Docker Compose** — PostgreSQL container with volume mount for data persistence
- **Option B: Native PostgreSQL** — System-installed PostgreSQL
- **Decision:** Docker Compose recommended for consistency and easy cleanup

### DB-02: Sequelize PostgreSQL Configuration
- Current: `dialect: 'sqlite'`, `storage: dbPath`
- Target: `dialect: 'postgres'`, `host/port/database/username/password` from env
- No ORM schema changes needed at this stage

### DB-03: Connection Pool
- Sequelize pool config: `{ max: 20, min: 5, acquire: 30000, idle: 10000 }`
- PostgreSQL `max_connections` should be ≥ pool max × instance count

### DB-04: Environment Variables
```env
DATABASE_URL=postgresql://username:password@host:5432/database
# or individual:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urtmtakip
DB_USER=username
DB_PASS=password
```
- Keep SQLite connection as fallback during migration (DB_DIALECT=sqlite | postgresql)

## Technical Notes

### Key Files to Modify
- `backend/src/config/database.js` — main database config
- `.env` or `.env.example` — DATABASE_URL
- `docker-compose.yml` (if using Docker)

### What Phase 5 Does NOT Change
- No model file changes
- No migration file changes
- No data migration
- No test changes

### Docker Compose Reference
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: urtmtakip
      POSTGRES_USER: urfuser
      POSTGRES_PASSWORD: urfpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Verification Approach
- `psql -U urfuser -d urtmtakip -c '\dt'` — list tables (empty at this stage)
- `node -e "require('./backend/src/config/database').sequelize.authenticate().then(()=>console.log('OK')).catch(e=>console.error(e))"` — test connection
- `docker-compose up -d` → `psql` connection test

---
*Phase: 05-postgres-kurulumu*
*Context gathered: 2026-05-03 via new-milestone workflow*
