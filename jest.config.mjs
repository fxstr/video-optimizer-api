// Friggin' jest does not yet support ts and esm, see
// https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
import { createJsWithTsEsmPreset } from 'ts-jest';

export default {
  ...createJsWithTsEsmPreset(),
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest', // Transform TypeScript files using ts-jest
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'ts'],
  moduleNameMapper: {
    // jest needs imports without a file ending to work (via ts-jest); at build time, we need
    // a .js file ending for node to work. Use .js when importing files, it will be removed by
    // jest when running tests.
    '^(\\./.*)\\.js$': '$1',
  },
};
