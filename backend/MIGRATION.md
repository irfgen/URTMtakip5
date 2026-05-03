# SQLite to PostgreSQL Migration Guide

## Overview

This guide covers migrating the ÜRTM Takip system from SQLite (328MB) to PostgreSQL.

**Tables:** 82 tables
**Total rows:** ~2.1M+ (including 1.7M in `tezgah_durum_logs`)
**Estimated time:** 15-30 minutes depending on hardware

## Prerequisites

1. **PostgreSQL running** (via Docker Compose or native installation)
   ```bash
   cd backend
   docker-compose up -d  # if using Docker
   ```

2. **Environment variables set:**
   ```bash
   export DB_DIALECT=postgresql
   export DATABASE_URL=postgresql://urfuser:urfpass@localhost:5432/urtmtakip
   ```

3. **Dependencies installed:**
   ```bash
   cd backend
   npm install pg better-sqlite3
   ```

## Migration Steps

### Step 1: Dry Run (Recommended First)

Verify the migration script can see your tables:

```bash
node scripts/migrate-to-postgresql.js --dry-run
```

This will list all tables and row counts without making any changes.

### Step 2: Run Live Migration

```bash
node scripts/migrate-to-postgresql.js
```

Options:
- `--batch-size=1000` : Rows per transaction (default: 1000)
- Progress shown as percentage

### Step 3: Verify Migration

After migration completes, verify data integrity:

```bash
# Full verification
node scripts/verify-migration.js

# Single table
node scripts/verify-migration.js --table=parcalar

# Verbose output
node scripts/verify-migration.js --verbose
```

### Step 4: Switch Application to PostgreSQL

The application automatically uses `DB_DIALECT` environment variable:

```bash
export DB_DIALECT=postgresql
# Restart your application
```

## Rollback

If something goes wrong, rollback to SQLite:

```bash
# Dry run to see what would happen
node scripts/rollback-migration.js --dry-run

# Actual rollback (requires --force)
node scripts/rollback-migration.js --force
```

Note: Rollback drops ALL PostgreSQL data. Use only if migration fails critically.

## Known Limitations

1. **Large tables:** `tezgah_durum_logs` (1.7M rows) and `parca_isleme_kayitlari` (257K rows) will take longer to migrate
2. **BIGSERIAL vs UUID:** Primary keys use BIGSERIAL (auto-increment) rather than UUID for compatibility
3. **No FK checks during migration:** Foreign key constraints are not validated during copy (they exist in the schema)
4. **BLOB fields:** Mapped to BYTEA in PostgreSQL

## Troubleshooting

### PostgreSQL Connection Failed

```bash
# Test connection
psql postgresql://urfuser:urfpass@localhost:5432/urtmtakip -c "SELECT 1"

# Check Docker
docker-compose ps
docker-compose logs postgres
```

### Memory Issues with Large Tables

The migration uses 1000-row batches. For very large tables, reduce batch size:

```bash
node scripts/migrate-to-postgresql.js --batch-size=500
```

### Migration Script Hangs

Check PostgreSQL is not in recovery mode:
```sql
SELECT pg_is_in_recovery();
```

## Script Reference

| Script | Purpose |
|--------|---------|
| `migrate-to-postgresql.js` | Main migration (SQLite → PostgreSQL) |
| `verify-migration.js` | Data integrity verification |
| `rollback-migration.js` | Drop PostgreSQL tables, revert to SQLite |

## Verification Checklist

- [ ] `migrate-to-postgresql.js --dry-run` shows correct table list
- [ ] Migration completes without errors
- [ ] `verify-migration.js` passes all checks
- [ ] Application starts with `DB_DIALECT=postgresql`
- [ ] API endpoints respond correctly

---

*Generated for ÜRTM Takip v2.0 PostgreSQL Migration*