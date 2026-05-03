#!/usr/bin/env node
/**
 * rollback-migration.js
 * Rollback PostgreSQL migration and revert to SQLite
 *
 * Usage:
 *   node rollback-migration.js [--help]
 *   node rollback-migration.js [--dry-run] [--force]
 *
 * Options:
 *   --dry-run   Show what would be dropped without dropping
 *   --force     Skip confirmation prompt
 *   --help      Show help
 *
 * Exit codes:
 *   0 - Success or dry-run
 *   1 - Error
 */

const path = require('path');
const fs = require('fs');

// CLI args
const args = process.argv.slice(2);
const HELP = args.includes('--help');
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

if (HELP) {
  console.log(`
rollback-migration.js - PostgreSQL Migration Rollback

Usage:
  node rollback-migration.js [options]

Options:
  --dry-run     Show what would be dropped (no changes)
  --force       Skip confirmation prompt
  --help        Show this help

Description:
  This script drops all tables from PostgreSQL and can optionally
  revert the DB_DIALECT environment variable back to SQLite.

  WARNING: This will delete ALL data in PostgreSQL!

Prerequisites:
  - PostgreSQL must be running and accessible
  - DB_DIALECT must be set to 'postgresql'
`);
  process.exit(0);
}

// Load database.js to get sequelize
process.env.DB_DIALECT = 'postgresql';
const { sequelize, QueryTypes } = require('../src/config/database');

const EXCLUDED_TABLES = ['sqlite_sequence', 'sqlite_stat1'];

async function rollback() {
  console.log('='.repeat(60));
  console.log('PostgreSQL Migration Rollback');
  console.log('='.repeat(60));
  console.log('Mode:', DRY_RUN ? 'DRY-RUN (no changes)' : 'LIVE');
  console.log('');

  if (!DRY_RUN && !FORCE) {
    console.log('⚠️  WARNING: This will DELETE ALL data in PostgreSQL!');
    console.log('');
  }

  try {
    // Connect to PostgreSQL
    console.log('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✓ PostgreSQL connected\n');

    // Get list of tables
    const tables = await sequelize.query(`
      SELECT tablename FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
    `, { type: QueryTypes.SELECT });

    const tableNames = tables
      .map(t => t.tablename)
      .filter(t => !EXCLUDED_TABLES.includes(t));

    if (tableNames.length === 0) {
      console.log('No tables found in PostgreSQL. Nothing to rollback.');
      await sequelize.close();
      return;
    }

    console.log(`Found ${tableNames.length} tables to drop:`);
    tableNames.forEach(t => console.log(`  - ${t}`));
    console.log('');

    if (DRY_RUN) {
      console.log('[DRY-RUN] Would drop all tables and reset PostgreSQL');
      await sequelize.close();
      process.exit(0);
    }

    if (!FORCE) {
      // In a real script, you'd prompt here. For now, we require --force.
      console.log('Use --force to confirm dropping all tables:');
      console.log('  node rollback-migration.js --force');
      await sequelize.close();
      process.exit(1);
    }

    // Disable FK checks and drop all tables
    console.log('\nDropping tables...');
    await sequelize.query('SET session_replication_role = replica');

    for (const tableName of tableNames) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        console.log(`  ✓ Dropped: ${tableName}`);
      } catch (err) {
        console.log(`  ✗ Failed: ${tableName}: ${err.message}`);
      }
    }

    await sequelize.query('SET session_replication_role = DEFAULT');

    // Optionally update .env to revert to SQLite
    const envPath = path.join(__dirname, '../.env');
    const envExamplePath = path.join(__dirname, '../.env.example');

    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('DB_DIALECT=postgresql')) {
        envContent = envContent.replace(/DB_DIALECT=postgresql/g, 'DB_DIALECT=sqlite');
        fs.writeFileSync(envPath, envContent);
        console.log('\n✓ Reverted DB_DIALECT to sqlite in .env');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('ROLLBACK COMPLETE');
    console.log('='.repeat(60));
    console.log('PostgreSQL is now empty. The system will use SQLite on next restart.');
    console.log('To switch back to PostgreSQL, run:');
    console.log('  export DB_DIALECT=postgresql');
    console.log('');

    await sequelize.close();
    process.exit(0);

  } catch (err) {
    console.error('Rollback failed:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

rollback();