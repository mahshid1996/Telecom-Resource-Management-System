module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/src/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  forceExit: true,
  detectOpenHandles: true
};