import type { Config } from 'jest';

const transformPattern = '^.+[.](ts|mjs|js|html)$';
const stringifyContentPathRegex = '[.](html|svg)$';
const transformIgnorePattern = 'node_modules/(?!.*[.]mjs$)';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    [transformPattern]: [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex,
      },
    ],
  },
  transformIgnorePatterns: [transformIgnorePattern],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  collectCoverage: false,
  coverageReporters: ['html', 'lcov', 'text'],
  coverageDirectory: 'coverage',
};

export default config;
