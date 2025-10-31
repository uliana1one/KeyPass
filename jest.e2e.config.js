export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.e2e.test.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/ipfs-mocks.ts',
    '<rootDir>/src/__tests__/setup/e2e-setup.ts'
  ],
  testTimeout: 300000, // 5 minutes for E2E tests
  maxWorkers: 1, // Run E2E tests sequentially to avoid conflicts
  
  // Coverage configuration
  collectCoverage: false, // Disable coverage for E2E tests
  coverageDirectory: 'coverage/e2e',
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^helia$': '<rootDir>/src/__tests__/setup/ipfs-mocks.ts',
    '^ipfs-unixfs$': '<rootDir>/src/__tests__/setup/ipfs-mocks.ts',
  },
  
  // Module directories
  moduleDirectories: ['node_modules', 'src', 'dist'],
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: false,
        outDir: './dist',
      },
      useESM: false,
    }],
  },
  
  // Extensions to treat as ES modules
  extensionsToTreatAsEsm: [],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(helia|ipfs-unixfs|@helia|@ipfs|multiformats|@multiformats)/)',
  ],
  
  // File extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/setup/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/setup/global-teardown.ts',
  
  // Verbose output for E2E tests
  verbose: true,
  
  // Reporter configuration
  reporters: [
    'default',
  ],
  
  // Test result processor (disabled for now)
  // testResultsProcessor: '<rootDir>/src/__tests__/setup/test-results-processor.ts',
};
