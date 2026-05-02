/**
 * test-runner.js
 * Master test runner for multi-agent system
 *
 * Runs all test suites in sequence:
 * 1. db-access.test.js
 * 2. api-client.test.js
 * 3. module-agent-integration.test.js
 *
 * Usage: node test-runner.js
 */

const { spawn } = require('child_process');
const path = require('path');

const TEST_DIR = path.join(__dirname);

const testSuites = [
  { name: 'db-access', file: 'db-access.test.js', requireBackend: false },
  { name: 'api-client', file: 'api-client.test.js', requireBackend: true },
  { name: 'module-agent-integration', file: 'module-agent-integration.test.js', requireBackend: true }
];

function runTest(suite) {
  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(50));
    console.log('   Running: ' + suite.name);
    console.log('='.repeat(50) + '\n');

    const startTime = Date.now();
    const proc = spawn('node', [path.join(TEST_DIR, suite.file)], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      if (code === 0) {
        console.log('\n[OK] ' + suite.name + ' PASSED (' + duration + 's)');
        resolve({ suite: suite.name, status: 'PASS', duration });
      } else {
        console.log('\n[FAIL] ' + suite.name + ' FAILED with code ' + code + ' (' + duration + 's)');
        resolve({ suite: suite.name, status: 'FAIL', duration, code });
      }
    });

    proc.on('error', (err) => {
      console.error('\n[ERROR] ' + suite.name + ':', err.message);
      resolve({ suite: suite.name, status: 'ERROR', error: err.message });
    });
  });
}

async function main() {
  console.log('========================================');
  console.log('   Multi-Agent System Test Runner');
  console.log('========================================');
  console.log('   Target: Backend port 3000');
  console.log('   Tests: ' + testSuites.length + ' suites\n');

  const results = [];

  for (const suite of testSuites) {
    const result = await runTest(suite);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('   TEST SUMMARY');
  console.log('='.repeat(50));

  for (const r of results) {
    const icon = r.status === 'PASS' ? '[OK]' : '[FAIL]';
    console.log(icon + ' ' + r.suite + ' - ' + r.status + (r.duration ? ' (' + r.duration + 's)' : ''));
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;

  console.log('\nTotal: ' + passed + ' passed, ' + failed + ' failed');
  console.log('='.repeat(50) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});