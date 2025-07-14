module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@semaphore-protocol|poseidon-lite|@iden3|snarkjs|ffjavascript|web-worker)/)',
  ],
  testTimeout: 30000,
  globals: {
    Worker: class {
      constructor(stringUrl) {
        this.url = stringUrl;
        this.onmessage = null;
      }
      
      postMessage(msg) {
        // Mock implementation
      }
      
      terminate() {
        // Mock implementation
      }
    },
    'ts-jest': {
      useESM: true,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/setupTests.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
}; 