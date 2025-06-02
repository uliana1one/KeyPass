/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env'],
      },
    ],
  },
  transformIgnorePatterns: [
    // Transform all ESM modules and specific packages
    'node_modules/(?!(@walletconnect|@polkadot|preact|@babel/runtime|@walletconnect/web3-provider|@walletconnect/types|@walletconnect/qrcode-modal)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle ESM imports
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Handle specific ESM packages
    '^@walletconnect/(.*)$': '<rootDir>/node_modules/@walletconnect/$1',
    '^preact/(.*)$': '<rootDir>/node_modules/preact/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  // Add this to handle ESM modules
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
