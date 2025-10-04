#!/usr/bin/env node

/**
 * SBT Contract Deployment Script (JavaScript)
 * 
 * JavaScript version of the deployment script for environments that don't support TypeScript.
 * 
 * Usage:
 *   node scripts/deploySBT.js
 *   npm run deploy:sbt
 * 
 * Environment Variables:
 *   PRIVATE_KEY - Private key for deployment (required)
 *   MOONSCAN_API_KEY - API key for contract verification (optional)
 *   NETWORK - Target network (default: moonbase-alpha)
 *   GAS_LIMIT - Custom gas limit (optional)
 *   GAS_PRICE - Custom gas price (optional)
 *   MAX_FEE_PER_GAS - EIP-1559 max fee per gas (optional)
 *   MAX_PRIORITY_FEE_PER_GAS - EIP-1559 priority fee (optional)
 */

const { ethers } = require('ethers');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join, dirname } = require('path');

// Import local modules (assuming they're compiled to JavaScript)
const { MoonbeamAdapter } = require('../dist/adapters/MoonbeamAdapter.js');
const { SBTContractFactory } = require('../dist/contracts/SBTContractFactory.js');

/**
 * Load environment variables
 */
function loadEnvironmentVariables() {
  const config = {};

  // Required environment variables
  config.privateKey = process.env.PRIVATE_KEY;
  if (!config.privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Optional environment variables
  config.network = process.env.NETWORK || 'moonbase-alpha';
  config.moonScanApiKey = process.env.MOONSCAN_API_KEY;
  config.gasLimit = process.env.GAS_LIMIT;
  config.gasPrice = process.env.GAS_PRICE;
  config.maxFeePerGas = process.env.MAX_FEE_PER_GAS;
  config.maxPriorityFeePerGas = process.env.MAX_PRIORITY_FEE_PER_GAS;

  return config;
}

/**
 * Load configuration from file
 */
function loadConfigFile() {
  const configPath = join(__dirname, '../config/deployments.json');
  
  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Warning: Failed to load existing config file, creating new one');
    }
  }

  // Return default config structure
  return {
    deployments: {},
    metadata: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      description: 'SBT Contract Deployment Configuration'
    }
  };
}

/**
 * Save configuration to file
 */
function saveConfigFile(config) {
  const configPath = join(__dirname, '../config/deployments.json');
  const configDir = dirname(configPath);
  
  // Ensure config directory exists
  if (!existsSync(configDir)) {
    require('fs').mkdirSync(configDir, { recursive: true });
  }

  // Update metadata
  config.metadata.lastUpdated = new Date().toISOString();

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Configuration saved to: ${configPath}`);
  } catch (error) {
    console.error(`❌ Failed to save configuration: ${error}`);
  }
}

/**
 * Create wallet from private key
 */
function createWallet(privateKey, network) {
  try {
    // Validate private key format
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    // Create provider (simplified for JavaScript)
    const rpcUrl = network === 'moonbase-alpha' 
      ? 'https://rpc.api.moonbase.moonbeam.network'
      : network === 'moonbeam'
      ? 'https://rpc.api.moonbeam.network'
      : 'https://rpc.api.moonriver.moonbeam.network';
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Create wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`🔑 Wallet created: ${wallet.address}`);
    return wallet;
  } catch (error) {
    throw new Error(`Failed to create wallet: ${error.message}`);
  }
}

/**
 * Check wallet balance
 */
async function checkWalletBalance(wallet, network) {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const symbol = network === 'moonbase-alpha' ? 'DEV' : network === 'moonbeam' ? 'GLMR' : 'MOVR';
    
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ${symbol}`);
    
    // Check if balance is sufficient for deployment
    const minBalance = ethers.parseEther('0.01'); // Minimum 0.01 tokens
    if (balance < minBalance) {
      throw new Error(`Insufficient balance. Need at least 0.01 ${symbol} for deployment.`);
    }
  } catch (error) {
    throw new Error(`Failed to check wallet balance: ${error.message}`);
  }
}

/**
 * Deploy SBT contract
 */
async function deploySBTContract(config) {
  const startTime = Date.now();
  console.log(`🚀 Starting SBT contract deployment to ${config.network}...`);
  
  try {
    // Create wallet
    const wallet = createWallet(config.privateKey, config.network);
    
    // Check wallet balance
    await checkWalletBalance(wallet, config.network);
    
    // Create Moonbeam adapter
    const adapter = new MoonbeamAdapter();
    await adapter.connect(config.network);
    
    // Create SBT contract factory
    const factoryConfig = {
      enableVerification: config.enableVerification,
      verificationApiKey: config.moonScanApiKey,
      debugMode: config.verbose,
    };
    
    const factory = new SBTContractFactory(adapter, factoryConfig);
    
    // Prepare deployment configuration
    const deploymentConfig = {
      name: config.constructorArgs.name,
      symbol: config.constructorArgs.symbol,
      baseURI: config.constructorArgs.baseURI,
      owner: wallet.address,
      gasLimit: config.gasLimit ? BigInt(config.gasLimit) : undefined,
      gasPrice: config.gasPrice ? BigInt(config.gasPrice) : undefined,
      maxFeePerGas: config.maxFeePerGas ? BigInt(config.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: config.maxPriorityFeePerGas ? BigInt(config.maxPriorityFeePerGas) : undefined,
    };
    
    console.log(`📋 Deployment configuration:`, {
      name: deploymentConfig.name,
      symbol: deploymentConfig.symbol,
      baseURI: deploymentConfig.baseURI,
      owner: deploymentConfig.owner,
    });
    
    // Deploy contract
    console.log(`⏳ Deploying contract...`);
    const deploymentResult = await factory.deployContract(deploymentConfig, wallet);
    
    // Calculate deployment cost
    const deploymentCost = ethers.formatEther(deploymentResult.deploymentCost);
    const symbol = config.network === 'moonbase-alpha' ? 'DEV' : config.network === 'moonbeam' ? 'GLMR' : 'MOVR';
    
    console.log(`✅ Contract deployed successfully!`);
    console.log(`📍 Contract address: ${deploymentResult.contractAddress}`);
    console.log(`🔗 Transaction hash: ${deploymentResult.transactionHash}`);
    console.log(`📦 Block number: ${deploymentResult.blockNumber}`);
    console.log(`⛽ Gas used: ${deploymentResult.gasUsed.toString()}`);
    console.log(`💰 Deployment cost: ${deploymentCost} ${symbol}`);
    
    // Show explorer link
    const explorerUrl = config.network === 'moonbase-alpha' 
      ? `https://moonbase.moonscan.io/address/${deploymentResult.contractAddress}`
      : config.network === 'moonbeam'
      ? `https://moonscan.io/address/${deploymentResult.contractAddress}`
      : `https://moonriver.moonscan.io/address/${deploymentResult.contractAddress}`;
    console.log(`🔍 Explorer: ${explorerUrl}`);
    
    // Save to configuration if enabled
    if (config.saveConfig) {
      const configFile = loadConfigFile();
      
      if (!configFile.deployments[config.network]) {
        configFile.deployments[config.network] = {};
      }
      
      configFile.deployments[config.network][config.contractName] = {
        address: deploymentResult.contractAddress,
        deployedAt: new Date().toISOString(),
        transactionHash: deploymentResult.transactionHash,
        blockNumber: deploymentResult.blockNumber,
        verified: deploymentResult.verificationResult?.success || false,
        verificationId: deploymentResult.verificationResult?.verificationId,
        constructorArgs: config.constructorArgs,
        gasUsed: deploymentResult.gasUsed.toString(),
        deploymentCost: deploymentResult.deploymentCost.toString(),
      };
      
      saveConfigFile(configFile);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`⏱️  Deployment completed in ${duration.toFixed(2)} seconds`);
    
    return {
      success: true,
      contractAddress: deploymentResult.contractAddress,
      transactionHash: deploymentResult.transactionHash,
      blockNumber: deploymentResult.blockNumber,
      gasUsed: deploymentResult.gasUsed.toString(),
      deploymentCost: deploymentResult.deploymentCost.toString(),
      verificationResult: deploymentResult.verificationResult,
      network: config.network,
      deployedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      network: config.network,
      deployedAt: new Date().toISOString(),
    };
  }
}

/**
 * Main deployment function
 */
async function main() {
  console.log('🎯 SBT Contract Deployment Script');
  console.log('=====================================');
  
  try {
    // Load environment variables
    const envConfig = loadEnvironmentVariables();
    
    // Create deployment configuration
    const config = {
      network: envConfig.network,
      privateKey: envConfig.privateKey,
      moonScanApiKey: envConfig.moonScanApiKey,
      gasLimit: envConfig.gasLimit,
      gasPrice: envConfig.gasPrice,
      maxFeePerGas: envConfig.maxFeePerGas,
      maxPriorityFeePerGas: envConfig.maxPriorityFeePerGas,
      contractName: 'SBTSimple',
      constructorArgs: {
        name: 'KeyPass SBT',
        symbol: 'KPASS',
        baseURI: 'https://api.keypass.com/metadata/'
      },
      enableVerification: !!envConfig.moonScanApiKey,
      saveConfig: true,
      verbose: process.env.NODE_ENV !== 'production',
    };
    
    // Display configuration
    console.log(`🌐 Network: ${config.network}`);
    console.log(`📝 Contract: ${config.contractName}`);
    console.log(`🔧 Verification: ${config.enableVerification ? 'Enabled' : 'Disabled'}`);
    console.log(`💾 Save Config: ${config.saveConfig ? 'Yes' : 'No'}`);
    console.log(`🔍 Verbose: ${config.verbose ? 'Yes' : 'No'}`);
    console.log('');
    
    // Check if testnet
    if (config.network !== 'moonbase-alpha') {
      console.warn('⚠️  Warning: Deploying to mainnet. Make sure you have sufficient funds and have tested on testnet first.');
    }
    
    // Deploy contract
    const result = await deploySBTContract(config);
    
    if (result.success) {
      console.log('');
      console.log('🎉 Deployment completed successfully!');
      console.log(`📍 Contract: ${result.contractAddress}`);
      console.log(`🔗 Transaction: ${result.transactionHash}`);
      
      if (result.verificationResult?.success) {
        console.log(`✅ Contract verified: ${result.verificationResult.explorerUrl}`);
      } else if (config.enableVerification) {
        console.log('⚠️  Contract verification failed or is pending');
      }
      
      process.exit(0);
    } else {
      console.log('');
      console.log('💥 Deployment failed!');
      console.log(`❌ Error: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

/**
 * Handle process signals
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Deployment cancelled by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Deployment terminated');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Run main function if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { deploySBTContract };
