# Phase 7 Context: Veri Migrasyonu

## Source Data

- **SQLite database:** `/home/irfan/Belgeler/URTMtakip5/backend/database.sqlite` (328MB)
- **Tables:** Unknown count, discovered dynamically
- **Schema:** Serial primary keys (INTEGER PRIMARY KEY) need conversion to UUID/BIGSERIAL

## Target Infrastructure

- **PostgreSQL:** Docker Compose at `localhost:5432`
- **Database name:** `urtmtakip`
- **User:** `urfuser` / `urfpass`
- **Connection:** Already configured in `backend/src/config/database.js` via `DB_DIALECT=postgresql`

## Schema Conversion Requirements

| SQLite Type | PostgreSQL Type |
|-------------|-----------------|
| INTEGER PRIMARY KEY | BIGSERIAL (auto-increment) or UUID |
| INTEGER | INTEGER or BIGINT |
| TEXT | VARCHAR or TEXT |
| REAL | DOUBLE PRECISION |
| BLOB | BYTEA |

## Requirements

| ID | Description |
|----|-------------|
| DB-15 | SQLite → PostgreSQL veri aktarım scripti |
| DB-16 | Tablo şeması dönüştürme (serial → UUID, vb.) |
| DB-17 | Veri bütünlüğü doğrulaması (row count, checksums) |
| DB-18 | rollback planı (sorun durumunda geri dönüş) |

## Decisions

- **Migration strategy:** Direct copy with schema mapping, not export/import files
- **Primary key handling:** BIGSERIAL for existing integer PKs (maintain compatibility)
- **Batch size:** 1000 rows per transaction for memory efficiency
- **Verification:** Row count + checksum comparison pre/post migration

## Blockers

- Docker not available on this system (Phase 5 verification blocked)
- Cannot test PostgreSQL connectivity locally

## Edge Cases

- Large BLOB fields (potentially images/documents)
- NULL values in non-nullable fields
- Foreign key references between tables
- Tables with no primary key