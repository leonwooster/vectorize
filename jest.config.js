module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'app.js',
    '!node_modules/**'
  ]
};
