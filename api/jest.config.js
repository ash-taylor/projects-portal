module.exports = {
  notify: false,
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.build/'],
  testRegex: '.*\\.(spec|test)\\.ts$',
  collectCoverageFrom: [
    './src/**/*.ts',
    '!**/*.test.ts',
    '!**/index.ts',
    '!**/main.ts',
    '!**/*.config.ts',
    '!**/__fixtures__/**',
    '!/dist/',
    '!/.build/',
  ],
  coverageThreshold: {
    global: {
      lines: 1,
    },
  },
  coverageDirectory: '<rootDir>/.test/coverage/',
  preset: 'ts-jest',
};
