#!/usr/bin/env node

/**
 * E2E Test Setup Validation Script
 * 
 * This script validates the E2E test environment without running the actual tests.
 * It checks:
 * - Environment variables
 * - Network connectivity
 * - Wallet configuration
 * - Test dependencies
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';

const REQUIRED_ENV_VARS = ['TEST_PRIVATE_KEY'];
const OPTIONAL_ENV_VARS = ['TEST_RECIPIENT', 'TEST_TIMEOUT', 'TEST_RPC_URL', 'TEST_CHAIN_ID'];
const MOONBASE_ALPHA_RPC = 'https://rpc.api.moonbase.moonbeam.network';
const MOONBASE_ALPHA_CHAIN_ID = 1287;
const MIN_BALANCE = ethers.parseEther('0.1');

async function validateE2ESetup() {
  console.log('=== E2E Test Setup Validation ===\n');
  
  let hasErrors = false;
  
  try {
    // 1. Check environment file
    console.log('1. 📋 Checking environment configuration...');
    await validateEnvironmentFile();
    console.log('   ✅ Environment file found and loaded\n');
    
    // 2. Validate environment variables
    console.log('2. 🔍 Validating environment variables...');
    await validateEnvironmentVariables();
    console.log('   ✅ Environment variables validated\n');
    
    // 3. Test network connectivity
    console.log('3. 🌐 Testing network connectivity...');
    await validateNetworkConnectivity();
    console.log('   ✅ Network connectivity verified\n');
    
    // 4. Validate wallet configuration
    console.log('4. 💼 Validating wallet configuration...');
    await validateWalletConfiguration();
    console.log('   ✅ Wallet configuration validated\n');
    
    // 5. Check test dependencies
    console.log('5. 📦 Checking test dependencies...');
    await validateTestDependencies();
    console.log('   ✅ Test dependencies verified\n');
    
    // 6. Summary
    console.log('=== Validation Summary ===');
    console.log('✅ All validations passed!');
    console.log('🚀 Ready to run E2E tests');
    console.log('\nNext steps:');
    console.log('  npm run test:sbt:e2e');
    console.log('  # or');
    console.log('  ./scripts/run-e2e-tests.sh');
    
  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    hasErrors = true;
  }
  
  if (hasErrors) {
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Check src/__tests__/integration/README.md for setup instructions');
    console.log('  2. Ensure .env.e2e file is properly configured');
    console.log('  3. Verify wallet has sufficient testnet DEV tokens');
    console.log('  4. Check network connectivity to Moonbase Alpha');
    process.exit(1);
  }
}

async function validateEnvironmentFile() {
  try {
    const envPath = join(process.cwd(), '.env.e2e');
    const envContent = readFileSync(envPath, 'utf8');
    
    // Check for required variables in file
    const missingVars = REQUIRED_ENV_VARS.filter(varName => 
      !envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)
    );
    
    if (missingVars.length > 0) {
      throw new Error(`Missing or unconfigured variables: ${missingVars.join(', ')}`);
    }
    
    // Load environment variables
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('.env.e2e file not found. Please copy env.e2e.template to .env.e2e');
    }
    throw error;
  }
}

async function validateEnvironmentVariables() {
  // Check required variables
  const missingRequired = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  if (missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }
  
  // Check optional variables and set defaults
  if (!process.env.TEST_RPC_URL) {
    process.env.TEST_RPC_URL = MOONBASE_ALPHA_RPC;
  }
  if (!process.env.TEST_CHAIN_ID) {
    process.env.TEST_CHAIN_ID = MOONBASE_ALPHA_CHAIN_ID.toString();
  }
  if (!process.env.TEST_TIMEOUT) {
    process.env.TEST_TIMEOUT = '300000';
  }
  
  console.log(`   • TEST_PRIVATE_KEY: ${process.env.TEST_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   • TEST_RECIPIENT: ${process.env.TEST_RECIPIENT ? '✅ Set' : '⚠️  Will use wallet address'}`);
  console.log(`   • TEST_RPC_URL: ${process.env.TEST_RPC_URL}`);
  console.log(`   • TEST_CHAIN_ID: ${process.env.TEST_CHAIN_ID}`);
  console.log(`   • TEST_TIMEOUT: ${process.env.TEST_TIMEOUT}ms`);
}

async function validateNetworkConnectivity() {
  const provider = new ethers.JsonRpcProvider(process.env.TEST_RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    const expectedChainId = parseInt(process.env.TEST_CHAIN_ID);
    
    if (Number(network.chainId) !== expectedChainId) {
      throw new Error(`Expected chain ID ${expectedChainId}, got ${network.chainId}`);
    }
    
    console.log(`   • Network: ${network.name} (${network.chainId})`);
    console.log(`   • RPC URL: ${process.env.TEST_RPC_URL}`);
    
  } catch (error) {
    throw new Error(`Network connectivity failed: ${error.message}`);
  }
}

async function validateWalletConfiguration() {
  const provider = new ethers.JsonRpcProvider(process.env.TEST_RPC_URL);
  
  try {
    const wallet = new ethers.Wallet(process.env.TEST_PRIVATE_KEY, provider);
    const address = await wallet.getAddress();
    const balance = await provider.getBalance(address);
    
    console.log(`   • Wallet Address: ${address}`);
    console.log(`   • Balance: ${ethers.formatEther(balance)} DEV`);
    
    if (balance < MIN_BALANCE) {
      throw new Error(`Insufficient balance. Need at least ${ethers.formatEther(MIN_BALANCE)} DEV, have ${ethers.formatEther(balance)} DEV`);
    }
    
    // Set default recipient if not provided
    if (!process.env.TEST_RECIPIENT) {
      process.env.TEST_RECIPIENT = address;
      console.log(`   • Default recipient set to wallet address`);
    }
    
  } catch (error) {
    if (error.message.includes('invalid private key')) {
      throw new Error('Invalid TEST_PRIVATE_KEY format');
    }
    throw error;
  }
}

async function validateTestDependencies() {
  try {
    // Check if build exists
    const { existsSync } = await import('fs');
    const distPath = join(process.cwd(), 'dist');
    
    if (!existsSync(distPath)) {
      throw new Error('Build directory not found. Run "npm run build" first');
    }
    
    // Check for required compiled files
    const requiredFiles = [
      'dist/services/SBTMintingService.js',
      'dist/contracts/SBTContractFactory.js',
      'dist/adapters/MoonbeamAdapter.js'
    ];
    
    const missingFiles = requiredFiles.filter(file => !existsSync(join(process.cwd(), file)));
    if (missingFiles.length > 0) {
      throw new Error(`Missing compiled files: ${missingFiles.join(', ')}`);
    }
    
    console.log(`   • Build directory: ✅ Found`);
    console.log(`   • Required files: ✅ All present`);
    
  } catch (error) {
    throw error;
  }
}

// Run validation
validateE2ESetup().catch(console.error);
