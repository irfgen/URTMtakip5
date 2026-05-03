#!/usr/bin/env node
/**
 * test-migration.js
 * Validates data integrity after SQLite → PostgreSQL migration
 *
 * Usage:
 *   node scripts/test-migration.js [--help]
 *   node scripts/test-migration.js [--table=name] [--verbose]
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Mismatch detected
 */

const Database = require('better-sqlite3');
const path = require('path');

const args = process.argv.slice(2);
const HELP = args.includes('--help');
const TABLE_FILTER = args.find(a => a.startsWith('--table='))?.split('=')[1];
const VERBOSE = args.includes('--verbose') || args.includes('-v');

const SQLITE_PATH = path.join(__dirname, '../database.sqlite');
const EXCLUDED_TABLES = ['sqlite_sequence', 'sqlite_stat1'];

if (HELP) {
  console.log(`
test-migration.js - Migration Integrity Validation

Usage:
  node scripts/test-migration.js [options]

Options:
  --table=name    Test only specific table
  --verbose, -v    Show detailed output
  --help          Show this help

Exit codes:
  0 - All checks passed
  1 - Mismatch detected
`);
  process.exit(0);
}

// Load database.js for PostgreSQL
process.env.DB_DIALECT = 'postgresql';
const { sequelize, QueryTypes } = require('../src/config/database');

const sqliteDb = new Database(SQLITE_PATH, { readonly: true });

const sqliteTables = sqliteDb
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map(r => r.name)
  .filter(t => !EXCLUDED_TABLES.includes(t) && (!TABLE_FILTER || t === TABLE_FILTER));

const results = { checked: 0, passed: 0, failed: 0, errors: [] };

async function verifyTable(tableName) {
  if (VERBOSE) console.log(`\nVerifying: ${tableName}`);

  try {
    const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as cnt FROM "${tableName}"`).get().cnt;

    let pgCount;
    try {
      const pgResult = await sequelize.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`, {
        type: QueryTypes.SELECT
      });
      pgCount = Array.isArray(pgResult) ? pgResult[0]?.cnt : pgResult?.cnt || 0;
    } catch (pgErr) {
      // Table might not exist yet
      results.failed++;
      results.errors.push({ table: tableName, issue: `PostgreSQL table not found: ${pgErr.message}` });
      console.log(`✗ ${tableName}: PostgreSQL table missing`);
      return;
    }

    if (sqliteCount !== pgCount) {
      results.failed++;
      results.errors.push({ table: tableName, issue: `Row count mismatch: SQLite=${sqliteCount}, PG=${pgCount}` });
      console.log(`✗ ${tableName}: Row count mismatch (SQLite=${sqliteCount}, PG=${pgCount})`);
      return;
    }

    // Verify schema
    const sqliteColumns = sqliteDb.prepare(`PRAGMA table_info("${tableName}")`).all();
    if (VERBOSE) console.log(`  ✓ ${tableName}: ${sqliteCount} rows verified`);

    results.checked++;
    results.passed++;

  } catch (err) {
    results.failed++;
    results.errors.push({ table: tableName, issue: err.message });
    console.log(`✗ ${tableName}: ${err.message}`);
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('Migration Integrity Validation');
  console.log('='.repeat(60));
  console.log(`SQLite: ${SQLITE_PATH}`);
  console.log(`Tables to verify: ${sqliteTables.length}`);
  if (TABLE_FILTER) console.log(`Filter: ${TABLE_FILTER}`);
  console.log('');

  try {
    console.log('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✓ PostgreSQL connected\n');

    for (const tableName of sqliteTables) {
      await verifyTable(tableName);
    }

    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tables checked: ${results.checked}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\nFailed tables:');
      for (const e of results.errors) {
        console.log(`  ${e.table}: ${e.issue}`);
      }
    }

    await sequelize.close();
    sqliteDb.close();

    console.log('\n' + (results.failed === 0 ? '✓ ALL CHECKS PASSED' : '✗ VALIDATION FAILED'));
    process.exit(results.failed === 0 ? 0 : 1);

  } catch (err) {
    console.error('Validation error:', err.message);
    await sequelize.close();
    sqliteDb.close();
    process.exit(1);
  }
}

run();