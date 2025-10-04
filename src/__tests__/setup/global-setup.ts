import { ethers } from 'ethers';

/**
 * Global Setup for E2E Tests
 * 
 * This runs once before all tests and handles:
 * - Environment validation
 * - Test data preparation
 * - Global configuration
 */

export default async function globalSetup() {
  console.log('=== Global E2E Test Setup ===');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Allow self-signed certificates in test
  
  // Validate test environment
  await validateTestEnvironment();
  
  // Prepare test data
  await prepareTestData();
  
  console.log('Global E2E test setup completed');
}

async function validateTestEnvironment(): Promise<void> {
  console.log('Validating test environment...');
  
  // Check required environment variables
  const requiredEnvVars = ['TEST_PRIVATE_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate Moonbase Alpha connectivity
  try {
    const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');
    const network = await provider.getNetwork();
    
    if (Number(network.chainId) !== 1287) {
      throw new Error(`Expected Moonbase Alpha (1287), got chain ID ${network.chainId}`);
    }
    
    console.log(`✅ Connected to Moonbase Alpha (${network.chainId})`);
  } catch (error) {
    throw new Error(`Failed to connect to Moonbase Alpha: ${error}`);
  }
  
  // Validate wallet configuration
  try {
    const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');
    const wallet = new ethers.Wallet(process.env.TEST_PRIVATE_KEY!, provider);
    
    const balance = await provider.getBalance(await wallet.getAddress());
    const minBalance = ethers.parseEther('0.1'); // 0.1 DEV minimum
    
    if (balance < minBalance) {
      console.warn(`⚠️  Low wallet balance: ${ethers.formatEther(balance)} DEV (minimum: 0.1 DEV)`);
    } else {
      console.log(`✅ Wallet balance: ${ethers.formatEther(balance)} DEV`);
    }
    
    console.log(`✅ Test wallet: ${await wallet.getAddress()}`);
  } catch (error) {
    throw new Error(`Invalid wallet configuration: ${error}`);
  }
  
  console.log('✅ Test environment validated');
}

async function prepareTestData(): Promise<void> {
  console.log('Preparing test data...');
  
  // Set default test recipient if not provided
  if (!process.env.TEST_RECIPIENT) {
    const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');
    const wallet = new ethers.Wallet(process.env.TEST_PRIVATE_KEY!, provider);
    process.env.TEST_RECIPIENT = await wallet.getAddress();
    console.log(`✅ Set default test recipient: ${process.env.TEST_RECIPIENT}`);
  }
  
  // Set test timeout
  process.env.TEST_TIMEOUT = '300000'; // 5 minutes
  
  console.log('✅ Test data prepared');
}
