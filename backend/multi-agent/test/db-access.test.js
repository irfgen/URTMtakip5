/**
 * db-access.test.js
 * Test suite for database access layer
 */

const { query, findAll, findOne, insert, update, remove, QueryTypes } = require('../db-access');

async function runTests() {
  console.log('========================================');
  console.log('   db-access.js Test Suite');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: query - SELECT
  try {
    console.log('Test 1: query() - SELECT from is_emirleri');
    const results = await query('SELECT * FROM is_emirleri LIMIT 5', [], QueryTypes.SELECT);
    if (Array.isArray(results)) {
      console.log('  PASS: query returned array with', results.length, 'rows');
      passed++;
    } else {
      throw new Error('Expected array, got ' + typeof results);
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 2: findAll
  try {
    console.log('Test 2: findAll() - Get tezgahlar');
    const results = await findAll('tezgahlar', {}, 10);
    if (Array.isArray(results)) {
      console.log('  PASS: findAll returned', results.length, 'tezgahlar');
      passed++;
    } else {
      throw new Error('Expected array');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 3: findOne
  try {
    console.log('Test 3: findOne() - Get single record');
    const all = await findAll('tezgahlar', {}, 1);
    if (all.length > 0) {
      const id = all[0].tezgah_id;
      const result = await findOne('tezgahlar', { tezgah_id: id });
      if (result && result.tezgah_id === id) {
        console.log('  PASS: findOne found tezgah id', id);
        passed++;
      } else {
        throw new Error('Record mismatch');
      }
    } else {
      console.log('  SKIP: No tezgahlar in database');
      passed++;
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 4: insert
  try {
    console.log('Test 4: insert() - Create test record in notlar');
    const testData = {
      baslik: 'Test Baslik ' + Date.now(),
      icerik: 'Test icerik',
      kategori_id: 1,
      olusturma_tarihi: new Date().toISOString()
    };
    const inserted = await insert('notlar', testData);
    if (inserted.id) {
      console.log('  PASS: Inserted record with id', inserted.id);
      // Cleanup
      await remove('notlar', { id: inserted.id });
      console.log('  CLEANUP: Removed test record');
      passed++;
    } else {
      throw new Error('No id returned');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 5: update
  try {
    console.log('Test 5: update() - Update existing record');
    const testData = {
      baslik: 'Update Test ' + Date.now(),
      icerik: 'Original',
      kategori_id: 1,
      olusturma_tarihi: new Date().toISOString()
    };
    const inserted = await insert('notlar', testData);
    const updated = await update('notlar', { icerik: 'Updated' }, { id: inserted.id });
    if (updated > 0) {
      console.log('  PASS: Updated', updated, 'record(s)');
      // Cleanup
      await remove('notlar', { id: inserted.id });
      passed++;
    } else {
      throw new Error('No records updated');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 6: remove
  try {
    console.log('Test 6: remove() - Delete record');
    const testData = {
      baslik: 'Delete Test ' + Date.now(),
      icerik: 'To be deleted',
      kategori_id: 1,
      olusturma_tarihi: new Date().toISOString()
    };
    const inserted = await insert('notlar', testData);
    const deleted = await remove('notlar', { id: inserted.id });
    if (deleted > 0) {
      console.log('  PASS: Deleted', deleted, 'record(s)');
      passed++;
    } else {
      throw new Error('No records deleted');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  console.log('\n========================================');
  console.log('   Results: ' + passed + ' passed, ' + failed + ' failed');
  console.log('========================================\n');

  return { passed, failed };
}

runTests()
  .then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
  });