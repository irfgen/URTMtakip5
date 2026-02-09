/**
 * Jest Setup File
 *
 * Global test configuration and utilities
 * Runs before all test suites
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Use in-memory SQLite for tests
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

// Suppress console logs during tests (optional)
// Comment out to see logs during test runs
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

console.log('Jest setup complete - Test environment ready');
