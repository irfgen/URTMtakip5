const { sequelize } = require('../src/config/database');

// Test database setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Connect to test database (in-memory for testing)
  if (process.env.NODE_ENV === 'test') {
    // Use in-memory SQLite for tests
    await sequelize.authenticate();
  }
});

afterAll(async () => {
  // Clean up database connections
  if (sequelize) {
    await sequelize.close();
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};