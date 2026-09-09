/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    'src/domain/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 20000,
};
