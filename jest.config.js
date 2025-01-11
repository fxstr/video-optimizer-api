const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    // jest needs imports without a file ending to work (via ts-jest); at build time, we need
    // a .js file ending for node to work. Use .js when importing files, it will be removed by
    // jest when running tests.
    '^(\\./.*)\\.js$': '$1',
  },
  globals: {
    tsconfig: 'tsconfig.json',
  },
};

export default config;
