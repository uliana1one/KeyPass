#!/usr/bin/env node

/**
 * SBT Contract Deployment Script
 * 
 * Deploys SBT (Soulbound Token) contract to Moonbeam testnet with verification,
 * configuration saving, error handling, and environment variable support.
 * 
 * Usage:
 *   npm run deploy:sbt
 *   node scripts/deploySBT.js
 *   ts-node scripts/deploySBT.ts
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

import { ethers } from 'ethers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import local modules
import { MoonbeamAdapter } from '../src/adapters/MoonbeamAdapter.js';
import { SBTContractFactory } from '../src/contracts/SBTContractFactory.js';
import { 
  deploymentConfigs, 
  getNetworkConfig, 
  getDefaultConstructorArgs,
  getDefaultDeploymentConfig,
  getDefaultVerificationConfig,
  validateNetwork,
  isTestnet,
  getExplorerUrl,
  ArtifactUtils
} from '../src/contracts/artifacts/index.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Deployment configuration interface
 */
interface DeploymentConfig {
  network: string;
  privateKey: string;
  moonScanApiKey?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  contractName: string;
  constructorArgs: {
    name: string;
    symbol: string;
    baseURI: string;
  };
  enableVerification: boolean;
  saveConfig: boolean;
  verbose: boolean;
}

/**
 * Deployment result interface
 */
interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  deploymentCost?: string;
  verificationResult?: any;
  error?: string;
  network: string;
  deployedAt: string;
}

/**
 * Configuration file interface
 */
interface ConfigFile {
  deployments: {
    [network: string]: {
      [contractName: string]: {
        address: string;
        deployedAt: string;
        transactionHash: string;
        blockNumber: number;
        verified: boolean;
        verificationId?: string;
        constructorArgs: any;
        gasUsed: string;
        deploymentCost: string;
      };
    };
  };
  metadata: {
    version: string;
    lastUpdated: string;
    description: string;
  };
}

/**
 * Load environment variables
 */
function loadEnvironmentVariables(): Partial<DeploymentConfig> {
  const config: Partial<DeploymentConfig> = {};

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

  // Validation
  if (!validateNetwork(config.network!)) {
    throw new Error(`Unsupported network: ${config.network}`);
  }

  return config;
}

/**
 * Load configuration from file
 */
function loadConfigFile(): ConfigFile {
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
function saveConfigFile(config: ConfigFile): void {
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
function createWallet(privateKey: string, network: string): ethers.Wallet {
  try {
    // Validate private key format
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    // Get network configuration
    const networkConfig = getNetworkConfig(network);
    if (!networkConfig) {
      throw new Error(`Network configuration not found: ${network}`);
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    
    // Create wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`🔑 Wallet created: ${wallet.address}`);
    return wallet;
  } catch (error) {
    throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check wallet balance
 */
async function checkWalletBalance(wallet: ethers.Wallet, network: string): Promise<void> {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const networkConfig = getNetworkConfig(network);
    const symbol = networkConfig?.nativeCurrency.symbol || 'ETH';
    
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ${symbol}`);
    
    // Check if balance is sufficient for deployment
    const minBalance = ethers.parseEther('0.01'); // Minimum 0.01 tokens
    if (balance < minBalance) {
      throw new Error(`Insufficient balance. Need at least 0.01 ${symbol} for deployment.`);
    }
  } catch (error) {
    throw new Error(`Failed to check wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deploy SBT contract
 */
async function deploySBTContract(config: DeploymentConfig): Promise<DeploymentResult> {
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
    const networkConfig = getNetworkConfig(config.network);
    const symbol = networkConfig?.nativeCurrency.symbol || 'ETH';
    
    console.log(`✅ Contract deployed successfully!`);
    console.log(`📍 Contract address: ${deploymentResult.contractAddress}`);
    console.log(`🔗 Transaction hash: ${deploymentResult.transactionHash}`);
    console.log(`📦 Block number: ${deploymentResult.blockNumber}`);
    console.log(`⛽ Gas used: ${deploymentResult.gasUsed.toString()}`);
    console.log(`💰 Deployment cost: ${deploymentCost} ${symbol}`);
    
    // Show explorer link
    const explorerUrl = getExplorerUrl(config.network, deploymentResult.contractAddress);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Deployment failed: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
      network: config.network,
      deployedAt: new Date().toISOString(),
    };
  }
}

/**
 * Main deployment function
 */
async function main(): Promise<void> {
  console.log('🎯 SBT Contract Deployment Script');
  console.log('=====================================');
  
  try {
    // Load environment variables
    const envConfig = loadEnvironmentVariables();
    
    // Create deployment configuration
    const config: DeploymentConfig = {
      network: envConfig.network!,
      privateKey: envConfig.privateKey!,
      moonScanApiKey: envConfig.moonScanApiKey,
      gasLimit: envConfig.gasLimit,
      gasPrice: envConfig.gasPrice,
      maxFeePerGas: envConfig.maxFeePerGas,
      maxPriorityFeePerGas: envConfig.maxPriorityFeePerGas,
      contractName: 'SBTSimple',
      constructorArgs: getDefaultConstructorArgs(),
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
    
    // Validate network
    if (!validateNetwork(config.network)) {
      throw new Error(`Unsupported network: ${config.network}`);
    }
    
    // Check if testnet
    if (!isTestnet(config.network)) {
      console.warn('⚠️  Warning: Deploying to mainnet. Make sure you have sufficient funds and have tested on testnet first.');
      
      // In production, you might want to add a confirmation prompt here
      // const readline = require('readline');
      // const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      // const answer = await new Promise(resolve => rl.question('Continue with mainnet deployment? (yes/no): ', resolve));
      // rl.close();
      // if (answer.toLowerCase() !== 'yes') {
      //   console.log('Deployment cancelled.');
      //   process.exit(0);
      // }
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
    console.error('💥 Fatal error:', error instanceof Error ? error.message : 'Unknown error');
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
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
}

export { deploySBTContract, DeploymentConfig, DeploymentResult };
