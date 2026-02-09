module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.integration.test.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/tests/**',
    '!**/node_modules/**'
  ],
  // Coverage thresholds - 80%+ target
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    },
    './src/controllers/': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    }
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/jest.setup.js'],
  testTimeout: 30000, // Increased for integration tests
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};