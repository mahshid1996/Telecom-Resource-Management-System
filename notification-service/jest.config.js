module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: [
    '**/src/tests/**/*.test.js',           
    '**/src/tests/unit/**/*.test.js',      
    '**/src/tests/integration/**/*.test.js', 
    '**/tests/**/*.test.js',              
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',           
    '!src/**/*.test.js',
    '!src/queues/**'
  ],

  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'], 

  forceExit: true,
  detectOpenHandles: true,
  
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: '📊 Notification Service Test Report',
      outputPath: './reports/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      theme: 'lightTheme',
      failuresOnly: false,
      showConfiguration: false
    }]
  ],

  coverageReporters: ['text', 'lcov', 'json', 'html']
};