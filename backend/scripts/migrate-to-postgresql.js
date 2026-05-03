#!/usr/bin/env node
/**
 * migrate-to-postgresql.js
 * Migrates data from SQLite (read-only) to PostgreSQL
 *
 * Usage:
 *   node migrate-to-postgresql.js [--dry-run] [--batch-size=1000]
 *
 * Environment:
 *   DB_DIALECT=postgresql  - must be set to use PostgreSQL
 *   DATABASE_URL          - PostgreSQL connection string
 */

const Database = require('better-sqlite3');
const path = require('path');

// CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const BATCH_SIZE = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '1000', 10);

// Config
const SQLITE_PATH = path.join(__dirname, '../database.sqlite');
const EXCLUDED_TABLES = ['sqlite_sequence', 'sqlite_stat1'];

console.log('='.repeat(60));
console.log('SQLite → PostgreSQL Migration Script');
console.log('='.repeat(60));
console.log('Mode:', DRY_RUN ? 'DRY-RUN (no changes)' : 'LIVE');
console.log('SQLite:', SQLITE_PATH);
console.log('Batch size:', BATCH_SIZE);
console.log('');

// Load database.js to get sequelize with correct dialect
process.env.DB_DIALECT = 'postgresql';
const { sequelize, QueryTypes } = require('../src/config/database');

// Type mapping from SQLite to PostgreSQL
const typeMap = {
  INTEGER: 'INTEGER',
  BIGINT: 'BIGINT',
  REAL: 'DOUBLE PRECISION',
  TEXT: 'TEXT',
  BLOB: 'BYTEA',
  NUMERIC: 'NUMERIC',
  VARCHAR: 'VARCHAR(255)',
  DATETIME: 'TIMESTAMP',
  BOOLEAN: 'BOOLEAN',
};

// Determine SQL type from SQLite type info
function mapType(sqliteType) {
  const upper = sqliteType.toUpperCase();
  if (upper.includes('INT')) return typeMap.INTEGER;
  if (upper.includes('REAL') || upper.includes('FLOAT') || upper.includes('DOUBLE')) return typeMap.REAL;
  if (upper.includes('TEXT') || upper.includes('CHAR') || upper.includes('CLOB')) return typeMap.TEXT;
  if (upper.includes('BLOB')) return typeMap.BLOB;
  if (upper.includes('NUMERIC') || upper.includes('DECIMAL')) return typeMap.NUMERIC;
  if (upper.includes('VARCHAR')) return typeMap.VARCHAR;
  if (upper.includes('DATETIME') || upper.includes('DATE') || upper.includes('TIME')) return typeMap.DATETIME;
  if (upper.includes('BOOL')) return typeMap.BOOLEAN;
  return typeMap.TEXT; // default
}

// Open SQLite (read-only)
const sqliteDb = new Database(SQLITE_PATH, { readonly: true });
sqliteDb.pragma('journal_mode = WAL');

// Discover tables
const tables = sqliteDb
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map(r => r.name)
  .filter(t => !EXCLUDED_TABLES.includes(t));

console.log(`Found ${tables.length} tables to migrate\n`);

// Get schema for a table
function getTableSchema(tableName) {
  const columns = sqliteDb.prepare(`PRAGMA table_info("${tableName}")`).all();
  const rows = sqliteDb.prepare(`SELECT COUNT(*) as cnt FROM "${tableName}"`).get();
  return { columns, rowCount: rows.cnt };
}

// Build CREATE TABLE SQL
function buildCreateTableSQL(tableName, columns) {
  const colDefs = [];
  const primaryKeys = [];

  for (const col of columns) {
    let def = `"${col.name}" ${mapType(col.type)}`;
    if (col.notnull && !col.dflt_value) def += ' NOT NULL';
    if (col.dflt_value !== undefined && col.dflt_value !== null) {
      const val = typeof col.dflt_value === 'string' ? `'${col.dflt_value.replace(/'/g, "''")}'` : col.dflt_value;
      def += ` DEFAULT ${val}`;
    }
    colDefs.push(def);
    if (col.pk) primaryKeys.push(col.name);
  }

  if (primaryKeys.length > 0) {
    colDefs.push(`PRIMARY KEY (${primaryKeys.map(k => `"${k}"`).join(', ')})`);
  }

  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${colDefs.join(',\n  ')}\n)`;
}

// Migration summary
const summary = {
  tables: [],
  totalRows: 0,
  migratedRows: 0,
  errors: [],
};

async function migrateTable(tableName) {
  if (DRY_RUN) {
    const schema = getTableSchema(tableName);
    console.log(`[DRY-RUN] Would migrate: ${tableName} (${schema.rowCount} rows)`);
    summary.tables.push({ name: tableName, rowCount: schema.rowCount, status: 'dry-run' });
    return;
  }

  const schema = getTableSchema(tableName);
  console.log(`\nMigrating: ${tableName} (${schema.rowCount} rows)`);

  try {
    // Create table
    const createSQL = buildCreateTableSQL(tableName, schema.columns);
    await sequelize.query(createSQL);
    console.log(`  ✓ Table created`);

    // Copy data in batches
    const totalBatches = Math.ceil(schema.rowCount / BATCH_SIZE);
    let migrated = 0;
    let offset = 0;

    while (offset < schema.rowCount) {
      const rows = sqliteDb
        .prepare(`SELECT * FROM "${tableName}" LIMIT ${BATCH_SIZE} OFFSET ${offset}`)
        .all();

      if (rows.length === 0) break;

      // Build insert SQL
      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        const placeholders = cols.map(() => '?').join(', ');
        const colNames = cols.map(c => `"${c}"`).join(', ');

        // Use INSERT INTO ... ON CONFLICT DO NOTHING for idempotency
        const insertSQL = `INSERT INTO "${tableName}" (${colNames}) VALUES ${rows
          .map(() => `(${placeholders})`)
          .join(', ')} ON CONFLICT DO NOTHING`;

        const values = rows.flatMap(r => cols.map(c => {
          const v = r[c];
          if (v === undefined || v === null) return null;
          if (Buffer.isBuffer(v)) return v;
          return v;
        }));

        await sequelize.query(insertSQL, { replacements: values });
        migrated += rows.length;
      }

      offset += BATCH_SIZE;
      const progress = Math.min(100, Math.round((offset / schema.rowCount) * 100));
      process.stdout.write(`  \r  Progress: ${progress}% (${migrated}/${schema.rowCount})`);
    }

    console.log(`\n  ✓ Migrated ${migrated} rows`);
    summary.tables.push({ name: tableName, rowCount: schema.rowCount, migrated, status: 'success' });
    summary.migratedRows += migrated;

  } catch (err) {
    console.log(`\n  ✗ Error: ${err.message}`);
    summary.errors.push({ table: tableName, error: err.message });
    summary.tables.push({ name: tableName, rowCount: schema.rowCount, status: 'error', error: err.message });
  }
}

async function run() {
  if (DRY_RUN) {
    console.log('\n--- DRY RUN: Tables that would be migrated ---\n');
    for (const tableName of tables) {
      const schema = getTableSchema(tableName);
      console.log(`  ${tableName}: ${schema.rowCount} rows, ${schema.columns.length} columns`);
    }
    console.log('\n--- End Dry Run ---\n');
    process.exit(0);
  }

  try {
    // Authenticate PostgreSQL
    console.log('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✓ PostgreSQL connected\n');

    // Migrate each table
    for (const tableName of tables) {
      summary.totalRows += (await getTableSchema(tableName)).rowCount;
      await migrateTable(tableName);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tables processed: ${summary.tables.length}`);
    console.log(`Total source rows: ${summary.totalRows}`);
    console.log(`Total migrated rows: ${summary.migratedRows}`);
    console.log(`Errors: ${summary.errors.length}`);
    if (summary.errors.length > 0) {
      console.log('\nFailed tables:');
      for (const e of summary.errors) {
        console.log(`  ${e.table}: ${e.error}`);
      }
    }

    await sequelize.close();
    sqliteDb.close();

    process.exit(summary.errors.length > 0 ? 1 : 0);

  } catch (err) {
    console.error('Migration failed:', err.message);
    await sequelize.close();
    sqliteDb.close();
    process.exit(1);
  }
}

run();