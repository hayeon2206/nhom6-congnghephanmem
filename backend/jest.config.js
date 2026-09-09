/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['dotenv/config'],
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    'src/domain/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 20000,
};
