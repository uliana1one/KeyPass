import { ethers } from 'ethers';

/**
 * E2E Test Setup
 * 
 * This file contains setup and teardown logic for end-to-end tests.
 * It handles environment validation, test data preparation, and cleanup.
 */

// Global test timeout for E2E tests
jest.setTimeout(300000); // 5 minutes

// Test environment validation
beforeAll(async () => {
  console.log('=== E2E Test Environment Setup ===');
  
  // Validate required environment variables
  const requiredEnvVars = ['TEST_PRIVATE_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate network connectivity
  try {
    const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
  } catch (error) {
    throw new Error(`Failed to connect to Moonbase Alpha: ${error}`);
  }
  
  console.log('E2E test environment validated successfully');
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in test environment
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in test environment
});

// Test cleanup after each test
afterEach(() => {
  // Clear any pending timeouts
  jest.clearAllTimers();
});

// Global test cleanup
afterAll(() => {
  console.log('=== E2E Test Environment Cleanup ===');
  // Additional cleanup can be added here if needed
});
