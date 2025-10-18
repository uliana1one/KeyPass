/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node', // ← Use Node.js environment for blockchain tests
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@walletconnect|@polkadot|@babel/runtime)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Not needed for Node.js tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/mocks/', '/__mocks__/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // On-chain tests need more time
  testTimeout: 300000, // 5 minutes
  // Only run on-chain tests
  testMatch: ['**/*.onchain.test.ts'],
};

