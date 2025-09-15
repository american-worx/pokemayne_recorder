module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true
};