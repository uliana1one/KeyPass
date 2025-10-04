module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.e2e.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/e2e-setup.ts'],
  testTimeout: 300000, // 5 minutes for E2E tests
  maxWorkers: 1, // Run E2E tests sequentially to avoid conflicts
  
  // Coverage configuration
  collectCoverage: false, // Disable coverage for E2E tests
  coverageDirectory: 'coverage/e2e',
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
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
    }],
  },
  
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
    ['jest-junit', {
      outputDirectory: 'test-results/e2e',
      outputName: 'junit.xml',
    }],
  ],
  
  // Test result processor
  testResultsProcessor: '<rootDir>/src/__tests__/setup/test-results-processor.ts',
};
