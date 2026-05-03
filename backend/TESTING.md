# PostgreSQL Migration Testing Guide

## Overview

This guide covers testing the SQLite → PostgreSQL migration for the ÜRTM Takip system.

## Prerequisites

1. **PostgreSQL running** at `localhost:5432`
2. **Migration completed** (see [MIGRATION.md](./MIGRATION.md))
3. **Dependencies installed:** `pg`, `better-sqlite3`

## Test Scripts

| Script | Purpose |
|--------|---------|
| `tests/postgres.test.js` | PostgreSQL validation tests |
| `scripts/test-feature-flag.js` | DB_DIALECT switching validation |
| `scripts/test-migration.js` | Post-migration data integrity |

## Running Tests

### 1. PostgreSQL Connection Test

```bash
DB_DIALECT=postgresql node tests/postgres.test.js --verbose
```

Expected output:
```
============================================================
PostgreSQL Validation Tests
============================================================
Dialect: postgresql

▶ Authentication
  ✓ Authentication successful

▶ Model discovery
  ✓ Found 56 models

▶ Query test
  ✓ Query successful

============================================================
TEST SUMMARY
============================================================
Passed: 6
Failed: 0
Total:  6

✓ ALL TESTS PASSED
```

### 2. Feature Flag (DB_DIALECT) Test

```bash
node scripts/test-feature-flag.js
```

Tests:
- DB_DIALECT=sqlite connectivity
- DB_DIALECT=postgresql connectivity
- Dialect switching behavior

Expected output:
```
============================================================
Feature Flag (DB_DIALECT) Validation
============================================================

--- Testing DB_DIALECT=sqlite ---
  ✓ sqlite: Authentication successful

--- Testing DB_DIALECT=postgresql ---
  ✓ postgresql: Authentication successful

FEATURE FLAG SUMMARY
============================================================
SQLite:       ✓ PASS
PostgreSQL:   ✓ PASS
```

### 3. Migration Integrity Test

```bash
node scripts/test-migration.js --verbose
```

Validates:
- Row counts match between SQLite and PostgreSQL
- Primary keys preserved
- Data types correct

Expected output:
```
============================================================
Migration Integrity Validation
============================================================
Tables to verify: 82

Verifying: parcalar
  ✓ parcalar: 14604 rows verified

Verifying: is_emirleri
  ✓ is_emirleri: 1968 rows verified

============================================================
VALIDATION SUMMARY
============================================================
Tables checked: 82
Passed: 82
Failed: 0

✓ ALL CHECKS PASSED
```

## Troubleshooting

### PostgreSQL Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps
# or
ps aux | grep postgres

# Test connection manually
psql postgresql://urfuser:urfpass@localhost:5432/urtmtakip -c "SELECT 1"
```

### Models Not Loading

```bash
# Verify DB_DIALECT is set
echo $DB_DIALECT

# Should output: postgresql
```

### Row Count Mismatch

If `test-migration.js` shows row count mismatches:

1. Re-run migration: `node scripts/migrate-to-postgresql.js`
2. Check for duplicate primary keys
3. Verify no data was written to PostgreSQL during migration

### Authentication Failures

Check `DATABASE_URL` environment variable:
```bash
export DATABASE_URL=postgresql://urfuser:urfpass@localhost:5432/urtmtakip
```

## Rollback Testing

To test rollback mechanism:

```bash
# 1. Create a backup point (dry run first)
node scripts/rollback-migration.js --dry-run

# 2. Run actual rollback (requires --force)
node scripts/rollback-migration.js --force

# 3. Verify SQLite still works
node scripts/test-feature-flag.js
```

## Success Criteria

All tests pass when:
- [ ] `postgres.test.js` exits with code 0
- [ ] `test-feature-flag.js` shows both SQLite and PostgreSQL passing
- [ ] `test-migration.js` shows 0 failures
- [ ] Application starts with `DB_DIALECT=postgresql`

## CI/CD Integration

Run tests in sequence:

```bash
# Exit on first failure
set -e

# Test PostgreSQL
DB_DIALECT=postgresql node tests/postgres.test.js

# Test feature flag
node scripts/test-feature-flag.js

# Test migration integrity
node scripts/test-migration.js
```

---

*Generated for ÜRTM Takip v2.0 PostgreSQL Migration*