# Phase 6 Context: Sequelize & Model Uyumluluğu

## Phase Overview
PostgreSQL migration Phase 6 focuses on updating 56 model files and 26 migration files for PostgreSQL compatibility.

## User Decisions (from ROADMAP)
- DB_DIALECT=postgresql enables PostgreSQL mode (already implemented in database.js)
- Target: PostgreSQL compatibility for all Sequelize models and migrations

## Key Findings from Code Review

### database.js (Phase 5 output)
- Already has dual-dialect support via `DB_DIALECT` env var
- PostgreSQL config has proper dialectOptions with SSL configuration
- Connection pool configured (max: 20, min: 5)
- SQLite PRAGMAs isolated to `else` branch (DB_DIALECT !== 'postgresql')

### db-access.js
- Uses `QueryTypes` from database.js exports - compatible
- Raw SQL queries use standard syntax (no SQLite-specific)
- Transaction handling is dialect-agnostic

### api-client.js
- Pure HTTP client, no database dialect dependencies
- No changes needed (DB-13: N/A - just port reference)

### module-agent.js
- Uses db-access.js abstraction - no direct sequelize usage
- No changes needed (DB-14: N/A)

### Models (sample: ArizaBakim.js)
- Standard Sequelize init patterns
- Uses `DataTypes.ENUM` which works with PostgreSQL
- Timestamps and field mapping standard
- No SQLite-specific code detected

### Migrations (sample reviewed)
- Use `Sequelize.literal('CURRENT_TIMESTAMP')` - compatible with both
- Standard `queryInterface.createTable()` - compatible
- Index creation via `queryInterface.addIndex()` - compatible
- ENUM types are standard

## Potential Issues to Verify

1. **QueryTypes usage** - Need to scan all files for `QueryTypes.SELECT` etc
2. **Raw SQL with SQLite syntax** - Check for `PRAGMA`, `LIKE '%...'` patterns
3. **JSON handling** - PostgreSQL JSON vs SQLite storing as text
4. **Auto-increment behavior** - PostgreSQL uses SERIAL vs INTEGER + autoIncrement
5. **Foreign key constraint naming** - SQLite vs PostgreSQL conventions

## Requirements Mapping
| ID | Requirement | Approach |
|----|-------------|----------|
| DB-05 | 56 model dosyasi | Audit all models, fix SQLite-specific patterns |
| DB-06 | SQLite PRAGMA'larinin kaldirilmasi | Verify models don't contain PRAGMA queries |
| DB-07 | dialectOptions yapilandirmasi | Already done in database.js Phase 5 |
| DB-08 | QueryTypes kullaniminin dogrulanmasi | Scan for QueryTypes imports/usage |
| DB-09 | 26 migration dosyasi | Audit migrations for PostgreSQL compatibility |
| DB-10 | SQLite-specific sorgularin duzeltilmesi | Find and fix raw SQL queries |
| DB-11 | Migration siralama ve bagimlilik | Ensure migration order is correct |
| DB-12 | db-access.js uyumlulugu | Already compatible (uses abstraction) |
| DB-13 | api-client.js baglanti noktasi | N/A - no DB changes needed |
| DB-14 | module-agent.js sequelize | N/A - uses db-access abstraction |

## Next Steps
Proceed to create 06-NN-PLAN.md files with wave-based execution strategy.