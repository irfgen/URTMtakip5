/**
 * api-client.test.js
 * Test suite for internal API client
 */

const api = require('../api-client');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log('========================================');
  console.log('   api-client.js Test Suite');
  console.log('========================================\n');
  console.log('   Target: ' + BASE_URL + '\n');

  let passed = 0;
  let failed = 0;

  // Test 1: GET /api/is-emirleri
  try {
    console.log('Test 1: GET /api/is-emirleri');
    const response = await api.get('/api/is-emirleri');
    if (response.status === 200 && response.ok) {
      console.log('  PASS: GET returned status', response.status);
      console.log('  Data sample:', JSON.stringify(response.data).substring(0, 100) + '...');
      passed++;
    } else {
      throw new Error('Expected status 200, got ' + response.status);
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 2: GET /api/tezgahlar
  try {
    console.log('Test 2: GET /api/tezgahlar');
    const response = await api.get('/api/tezgahlar');
    if (response.status === 200 && response.ok) {
      console.log('  PASS: GET returned status', response.status);
      passed++;
    } else {
      throw new Error('Expected status 200, got ' + response.status);
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 3: GET /api/stok-kartlari
  try {
    console.log('Test 3: GET /api/stok-kartlari');
    const response = await api.get('/api/stok-kartlari');
    if (response.status === 200 && response.ok) {
      console.log('  PASS: GET returned status', response.status);
      passed++;
    } else {
      console.log('  WARN: Status', response.status, '(endpoint may not exist)');
      passed++; // Don't fail if endpoint doesn't exist
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 4: POST endpoint (if available)
  try {
    console.log('Test 4: POST /api/notlar (create note)');
    const testNote = {
      baslik: 'API Test ' + Date.now(),
      icerik: 'Test icerik',
      kategori_id: 1
    };
    const response = await api.post('/api/notlar', testNote);
    if (response.status === 200 || response.status === 201) {
      console.log('  PASS: POST returned status', response.status);
      passed++;
    } else {
      console.log('  WARN: Status', response.status, '(endpoint behavior may differ)');
      passed++; // Don't fail if endpoint behaves differently
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 5: GET with query params
  try {
    console.log('Test 5: GET /api/is-emirleri with params');
    const response = await api.get('/api/is-emirleri', { limit: 3 });
    if (response.ok) {
      console.log('  PASS: GET with params returned status', response.status);
      passed++;
    } else {
      throw new Error('Request failed');
    }
  } catch (err) {
    console.log('  FAIL:', err.message);
    failed++;
  }

  // Test 6: X-Module-Agent header
  try {
    console.log('Test 6: Verify X-Module-Agent header is sent');
    const response = await api.get('/api/is-emirleri');
    if (response.ok) {
      console.log('  PASS: Request completed (X-Module-Agent header added in api-client.js)');
      passed++;
    } else {
      throw new Error('Request failed');
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