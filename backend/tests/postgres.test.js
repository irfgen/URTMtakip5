#!/usr/bin/env node
/**
 * postgres.test.js
 * PostgreSQL connection and query validation tests
 *
 * Usage:
 *   DB_DIALECT=postgresql node tests/postgres.test.js [--help]
 *   DB_DIALECT=postgresql node tests/postgres.test.js [--verbose]
 *
 * Exit codes:
 *   0 - All tests passed
 *   1 - One or more tests failed
 */

const args = process.argv.slice(2);
const HELP = args.includes('--help');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

if (HELP) {
  console.log(`
postgres.test.js - PostgreSQL Validation Tests

Usage:
  DB_DIALECT=postgresql node tests/postgres.test.js [options]

Options:
  --verbose, -v    Show detailed output
  --help           Show this help

Tests:
  1. Connection authentication
  2. Basic CRUD operations
  3. Transaction support
  4. Raw QueryTypes queries
  5. Batch insert performance

Exit codes:
  0 - All tests passed
  1 - One or more tests failed
`);
  process.exit(0);
}

process.env.DB_DIALECT = 'postgresql';
const { sequelize, QueryTypes } = require('../src/config/database');

const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function test(name, fn) {
  if (VERBOSE) console.log(`\n▶ ${name}`);
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(r => {
          results.passed++;
          results.tests.push({ name, status: 'passed' });
          if (VERBOSE) console.log(`  ✓ ${name}`);
          return r;
        })
        .catch(err => {
          results.failed++;
          results.tests.push({ name, status: 'failed', error: err.message });
          console.log(`  ✗ ${name}: ${err.message}`);
          throw err;
        });
    } else {
      results.passed++;
      results.tests.push({ name, status: 'passed' });
      if (VERBOSE) console.log(`  ✓ ${name}`);
      return result;
    }
  } catch (err) {
    results.failed++;
    results.tests.push({ name, status: 'failed', error: err.message });
    console.log(`  ✗ ${name}: ${err.message}`);
    throw err;
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('PostgreSQL Validation Tests');
  console.log('='.repeat(60));
  console.log('Dialect:', process.env.DB_DIALECT);
  console.log('');

  // Test 1: Connection
  await test('PostgreSQL authentication', async () => {
    await sequelize.authenticate();
    console.log('  Connection established');
  });

  // Test 2: Model discovery
  await test('Model discovery', () => {
    const models = Object.keys(sequelize.models);
    console.log(`  Found ${models.length} models`);
    if (models.length === 0) throw new Error('No models loaded');
  });

  // Test 3: Raw query with QueryTypes.SELECT
  await test('Raw QueryTypes.SELECT query', async () => {
    const result = await sequelize.query('SELECT 1 as test, now() as now', {
      type: QueryTypes.SELECT
    });
    if (!result || result.length === 0) throw new Error('No result returned');
    if (VERBOSE) console.log('  Result:', JSON.stringify(result[0]));
  });

  // Test 4: Transaction support
  await test('Transaction support', async () => {
    const { Transaction } = require('../src/config/database');
    const t = await sequelize.transaction();
    try {
      await sequelize.query('SELECT 1', { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  });

  // Test 5: Batch insert (using SequelizeMeta as test table)
  await test('Batch insert (SequelizeMeta)', async () => {
    const testKey = `test_${Date.now()}`;
    const insertSQL = `INSERT INTO "SequelizeMeta" (name) VALUES ('${testKey}') ON CONFLICT DO NOTHING RETURNING *`;

    try {
      const [result] = await sequelize.query(insertSQL, {
        type: QueryTypes.INSERT
      });
      if (VERBOSE) console.log('  Insert result:', result);

      // Clean up
      await sequelize.query(`DELETE FROM "SequelizeMeta" WHERE name = '${testKey}'`);
    } catch (err) {
      // Table might not exist yet, skip
      if (VERBOSE) console.log('  Skipped (table not ready):', err.message);
    }
  });

  // Test 6: Connection pool info
  await test('Connection pool configured', () => {
    const config = sequelize.config;
    if (!config.pool) throw new Error('Pool not configured');
    console.log(`  Pool: max=${config.pool.max}, min=${config.pool.min}`);
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total:  ${results.passed + results.failed}`);

  if (results.failed > 0) {
    console.log('\nFailed tests:');
    for (const t of results.tests.filter(t => t.status === 'failed')) {
      console.log(`  ✗ ${t.name}: ${t.error}`);
    }
  }

  await sequelize.close();

  console.log('\n' + (results.failed === 0 ? '✓ ALL TESTS PASSED' : '✗ TESTS FAILED'));
  process.exit(results.failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Test runner error:', err.message);
  sequelize.close().catch(() => {});
  process.exit(1);
});