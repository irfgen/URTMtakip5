// Test script to verify API caching improvements
// Run this in browser console on http://localhost:5174/

async function testParcaCaching() {
  console.log('🧪 Testing Parça Bilgileri Caching...');

  // Test 1: Multiple calls to same search term
  console.log('\n📝 Test 1: Multiple calls to same search term');
  const searchTerm = 'TESTPARCA';

  console.time('First API call');
  try {
    const response1 = await fetch(`/api/parcalar?aramaMetni=${searchTerm}&limit=5`);
    const data1 = await response1.json();
    console.timeEnd('First API call');
    console.log('First call results:', data1.length || 0, 'items');
  } catch (error) {
    console.timeEnd('First API call');
    console.log('First call error:', error.message);
  }

  console.time('Second API call (should use cache)');
  try {
    const response2 = await fetch(`/api/parcalar?aramaMetni=${searchTerm}&limit=5`);
    const data2 = await response2.json();
    console.timeEnd('Second API call (should use cache)');
    console.log('Second call results:', data2.length || 0, 'items');
  } catch (error) {
    console.timeEnd('Second API call (should use cache)');
    console.log('Second call error:', error.message);
  }

  // Test 2: Different search terms
  console.log('\n📝 Test 2: Different search terms');
  const differentTerms = ['PARCA1', 'PARCA2', 'PARCA3'];

  for (const term of differentTerms) {
    console.time(`API call for ${term}`);
    try {
      const response = await fetch(`/api/parcalar?aramaMetni=${term}&limit=5`);
      const data = await response.json();
      console.timeEnd(`API call for ${term}`);
      console.log(`${term} results:`, data.length || 0, 'items');
    } catch (error) {
      console.timeEnd(`API call for ${term}`);
      console.log(`${term} error:`, error.message);
    }
  }

  // Test 3: Simulate heavy load (multiple concurrent requests)
  console.log('\n📝 Test 3: Simulating heavy load');
  console.time('Concurrent requests');

  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch(`/api/parcalar?aramaMetni=CONCURRENT_TEST_${i % 3}&limit=5`)
        .then(res => res.json())
        .then(data => ({ index: i, count: data.length || 0 }))
        .catch(error => ({ index: i, error: error.message }))
    );
  }

  const results = await Promise.all(promises);
  console.timeEnd('Concurrent requests');
  console.log('Concurrent results:', results);

  console.log('\n✅ Parça caching test completed!');
  console.log('💡 Check the Network tab in DevTools to see actual HTTP requests');
  console.log('💡 Check the console for any ERR_INSUFFICIENT_RESOURCES errors');
}

// Function to test Tezgah İş Planı page specifically
async function testTezgahIsPlani() {
  console.log('🏭 Testing Tezgah İş Planı page performance...');

  // Navigate to Tezgah İş Planı
  window.location.href = '/tezgah-is-plani';

  // Wait for page to load and monitor API calls
  setTimeout(() => {
    console.log('📊 Page loaded. Check Network tab for API calls pattern.');
    console.log('💡 With caching enabled, you should see significantly fewer /api/parcalar calls');
    console.log('💡 Each unique parça should only trigger one API call, with subsequent calls using cache');

    // Monitor console for ERR_INSUFFICIENT_RESOURCES
    const originalError = console.error;
    console.error = function(...args) {
      if (args[0] && args[0].includes && args[0].includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.error('🚨 ERR_INSUFFICIENT_RESOURCES detected!', args);
      }
      originalError.apply(console, args);
    };

    console.log('🔍 Monitoring for ERR_INSUFFICIENT_RESOURCES errors...');
  }, 2000);
}

// Auto-run tests when script is loaded
console.log('🚀 Performance test script loaded!');
console.log('💻 Available commands:');
console.log('  - testParcaCaching(): Test parça API caching directly');
console.log('  - testTezgahIsPlani(): Test Tezgah İş Planı page performance');
console.log('\n🔧 To run tests, paste one of the above commands in console and press Enter');

// Make functions available globally
window.testParcaCaching = testParcaCaching;
window.testTezgahIsPlani = testTezgahIsPlani;