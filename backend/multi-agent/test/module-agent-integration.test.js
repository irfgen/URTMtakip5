/**
 * module-agent-integration.test.js
 * Integration test: module agent reads DB, calls API, consults master
 */

const { ModuleAgent } = require('../module-agent');
const db = require('../db-access');

async function runTests() {
  console.log('========================================');
  console.log('   Module Agent Integration Test Suite');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: ModuleAgent instantiation
  try {
    console.log('Test 1: ModuleAgent instantiation');
    const agent = new ModuleAgent('test_module', 'Test Module');
    if (agent.moduleId === 'test_module' && agent.moduleName === 'Test Module') {
      console.log('  PASS: ModuleAgent created with correct properties');
      passed++;
    } else {
      throw new Error('ModuleAgent properties incorrect');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 2: ModuleAgent has db access
  try {
    console.log('Test 2: ModuleAgent.db - findAll tezgahlar');
    const agent = new ModuleAgent('test_db', 'Test DB');
    const results = await agent.findAll('tezgahlar', {}, 5);
    if (Array.isArray(results)) {
      console.log('  PASS: ModuleAgent.db.findAll returned', results.length, 'records');
      passed++;
    } else {
      throw new Error('Expected array');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 3: ModuleAgent has api access (GET)
  try {
    console.log('Test 3: ModuleAgent.apiGet - call backend API');
    const agent = new ModuleAgent('test_api', 'Test API');
    const response = await agent.apiGet('/api/is-emirleri');
    if (response && response.status === 200) {
      console.log('  PASS: apiGet returned status', response.status);
      passed++;
    } else {
      throw new Error('apiGet failed, status: ' + (response?.status || 'no response'));
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 4: Full flow - read from DB, write via API
  try {
    console.log('Test 4: Full flow - read DB, then API call');
    const agent = new ModuleAgent('test_flow', 'Test Flow');

    // Step 1: Read from DB
    const dbResults = await agent.findAll('tezgahlar', {}, 2);
    console.log('    DB read returned', dbResults.length, 'tezgahlar');

    // Step 2: Call API with that data context
    const apiResponse = await agent.apiGet('/api/tezgahlar');
    if (apiResponse.status === 200) {
      console.log('  PASS: Full flow completed');
      passed++;
    } else {
      throw new Error('API call in flow failed');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 5: ModuleAgent CRUD operations
  try {
    console.log('Test 5: ModuleAgent CRUD - insert, read, delete in notlar');
    const agent = new ModuleAgent('test_crud', 'Test CRUD');

    // Insert
    const inserted = await agent.insert('notlar', {
      baslik: 'CRUD Test ' + Date.now(),
      icerik: 'CRUD test content',
      kategori_id: 1,
      olusturma_tarihi: new Date().toISOString()
    });
    console.log('    Inserted with id:', inserted.id);

    // Read
    const found = await agent.findOne('notlar', { id: inserted.id });
    if (found && found.id === inserted.id) {
      console.log('    Found inserted record');
    }

    // Delete
    const deleted = await agent.remove('notlar', { id: inserted.id });
    if (deleted > 0) {
      console.log('  PASS: Full CRUD cycle completed');
      passed++;
    } else {
      throw new Error('Delete did not remove record');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 6: Verify autonomous action check works
  try {
    console.log('Test 6: executeAutonomous() action validation');
    const agent = new ModuleAgent('test_action', 'Test Action');

    // Test with non-existent action - should throw
    try {
      await agent.executeAutonomous('non_existent_action_xyz');
      throw new Error('Should have thrown for unknown action');
    } catch (err) {
      if (err.message.includes('Bilinmeyan aksiyon')) {
        console.log('  PASS: executeAutonomous correctly rejects unknown actions');
        passed++;
      } else {
        throw err;
      }
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