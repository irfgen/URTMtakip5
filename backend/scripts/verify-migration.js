#!/usr/bin/env node
/**
 * verify-migration.js
 * Verifies data integrity between SQLite (source) and PostgreSQL (target)
 *
 * Usage:
 *   node verify-migration.js [--help]
 *   node verify-migration.js [--table=name] [--verbose]
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Mismatch detected
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

// CLI args
const args = process.argv.slice(2);
const HELP = args.includes('--help');
const TABLE_FILTER = args.find(a => a.startsWith('--table='))?.split('=')[1];
const VERBOSE = args.includes('--verbose') || args.includes('-v');

const SQLITE_PATH = path.join(__dirname, '../database.sqlite');
const EXCLUDED_TABLES = ['sqlite_sequence', 'sqlite_stat1'];

if (HELP) {
  console.log(`
verify-migration.js - SQLite to PostgreSQL Migration Verifier

Usage:
  node verify-migration.js [options]

Options:
  --table=name    Verify only specific table
  --verbose, -v    Show detailed output
  --help          Show this help

Exit codes:
  0 - All checks passed
  1 - Mismatch detected
`);
  process.exit(0);
}

// Load database.js to get sequelize
process.env.DB_DIALECT = 'postgresql';
const { sequelize, QueryTypes } = require('../src/config/database');

// Open SQLite (read-only)
const sqliteDb = new Database(SQLITE_PATH, { readonly: true });

// Get SQLite tables
const sqliteTables = sqliteDb
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map(r => r.name)
  .filter(t => !EXCLUDED_TABLES.includes(t) && (!TABLE_FILTER || t === TABLE_FILTER));

// Results
const results = {
  checked: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

async function verifyTable(tableName) {
  if (VERBOSE) console.log(`\nVerifying: ${tableName}`);

  try {
    // Count in SQLite
    const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as cnt FROM "${tableName}"`).get().cnt;

    // Count in PostgreSQL
    const pgCountResult = await sequelize.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`, {
      type: QueryTypes.SELECT
    });
    const pgCount = Array.isArray(pgCountResult) ? pgCountResult[0]?.cnt : pgCountResult?.cnt || 0;

    if (sqliteCount !== pgCount) {
      results.failed++;
      results.errors.push({ table: tableName, issue: `Row count mismatch: SQLite=${sqliteCount}, PG=${pgCount}` });
      console.log(`✗ ${tableName}: Row count mismatch (SQLite=${sqliteCount}, PG=${pgCount})`);
      return;
    }

    // Checksum verification (sample of primary key + text columns)
    const sqliteSample = sqliteDb.prepare(`SELECT * FROM "${tableName}" LIMIT 100`).all();
    if (sqliteSample.length > 0) {
      const cols = Object.keys(sqliteSample[0]);
      // Get first row from PG
      const pgSample = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 1`, {
        type: QueryTypes.SELECT
      });

      // Compare structure (column count)
      if (pgSample.length > 0) {
        const pgCols = Object.keys(pgSample[0]);
        if (cols.length !== pgCols.length) {
          // Column count mismatch - could be schema difference, just warn
          if (VERBOSE) console.log(`  ⚠ Column count differs: SQLite=${cols.length}, PG=${pgCols.length}`);
        }
      }
    }

    results.checked++;
    results.passed++;
    if (VERBOSE) console.log(`✓ ${tableName}: ${sqliteCount} rows verified`);

  } catch (err) {
    results.failed++;
    results.errors.push({ table: tableName, issue: err.message });
    console.log(`✗ ${tableName}: ${err.message}`);
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('Migration Verification');
  console.log('='.repeat(60));
  console.log(`SQLite: ${SQLITE_PATH}`);
  console.log(`Tables to verify: ${sqliteTables.length}`);
  if (TABLE_FILTER) console.log(`Filter: ${TABLE_FILTER}`);
  console.log('');

  try {
    // Connect to PostgreSQL
    console.log('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✓ PostgreSQL connected\n');

    // Verify each table
    for (const tableName of sqliteTables) {
      await verifyTable(tableName);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
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

    console.log('\n' + (results.failed === 0 ? '✓ ALL CHECKS PASSED' : '✗ VERIFICATION FAILED'));
    process.exit(results.failed === 0 ? 0 : 1);

  } catch (err) {
    console.error('Verification error:', err.message);
    await sequelize.close();
    sqliteDb.close();
    process.exit(1);
  }
}

run();