/**
 * Production Configuration for KeyPass React Boilerplate
 * 
 * This file contains production-ready configuration settings
 * for real blockchain operations.
 */

export interface ProductionConfig {
  // Blockchain Configuration
  blockchain: {
    enabled: boolean;
    defaultNetwork: 'moonbase-alpha' | 'moonbeam' | 'moonriver';
    supportedNetworks: string[];
    requireDIDVerification: boolean;
    minConfirmations: number;
  };
  
  // IPFS Configuration
  ipfs: {
    enabled: boolean;
    pinningService: 'pinata' | 'web3storage' | 'nftstorage';
    gatewayUrl: string;
  };
  
  // Security Configuration
  security: {
    enableSecurityChecks: boolean;
    requireBalanceCheck: boolean;
    maxRetries: number;
    retryDelay: number;
    confirmationTimeout: number;
  };
  
  // Performance Configuration
  performance: {
    enableMonitoring: boolean;
    debugMode: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  
  // Contract Configuration
  contracts: {
    version: string;
    deploymentEnvironment: 'testnet' | 'mainnet';
    didContractAddress?: string;
    sbtContractAddress?: string;
  };
}

/**
 * Get production configuration from environment variables
 */
export function getProductionConfig(): ProductionConfig {
  return {
    blockchain: {
      enabled: process.env.REACT_APP_ENABLE_REAL_BLOCKCHAIN === 'true',
      defaultNetwork: (process.env.REACT_APP_DEFAULT_NETWORK as any) || 'moonbase-alpha',
      supportedNetworks: process.env.REACT_APP_SUPPORTED_NETWORKS?.split(',') || ['moonbase-alpha'],
      requireDIDVerification: process.env.REACT_APP_REQUIRE_DID_VERIFICATION === 'true',
      minConfirmations: parseInt(process.env.REACT_APP_MIN_CONFIRMATIONS || '1'),
    },
    
    ipfs: {
      enabled: process.env.REACT_APP_ENABLE_REAL_IPFS === 'true',
      pinningService: (process.env.REACT_APP_IPFS_PINNING_SERVICE as any) || 'pinata',
      gatewayUrl: process.env.REACT_APP_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs',
    },
    
    security: {
      enableSecurityChecks: process.env.REACT_APP_ENABLE_SECURITY_CHECKS === 'true',
      requireBalanceCheck: true,
      maxRetries: parseInt(process.env.REACT_APP_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.REACT_APP_RETRY_DELAY || '2000'),
      confirmationTimeout: parseInt(process.env.REACT_APP_CONFIRMATION_TIMEOUT || '300000'),
    },
    
    performance: {
      enableMonitoring: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
      debugMode: process.env.REACT_APP_DEBUG_MODE === 'true',
      logLevel: (process.env.REACT_APP_LOG_LEVEL as any) || 'info',
    },
    
    contracts: {
      version: process.env.REACT_APP_CONTRACT_VERSION || '1.0.0',
      deploymentEnvironment: (process.env.REACT_APP_DEPLOYMENT_ENVIRONMENT as any) || 'testnet',
      didContractAddress: process.env.REACT_APP_DID_CONTRACT_ADDRESS,
      sbtContractAddress: process.env.REACT_APP_SBT_CONTRACT_ADDRESS,
    },
  };
}

/**
 * Validate production configuration
 */
export function validateProductionConfig(config: ProductionConfig): string[] {
  const errors: string[] = [];
  
  if (config.blockchain.enabled) {
    if (!config.contracts.didContractAddress) {
      errors.push('DID contract address is required for blockchain operations');
    }
    
    if (!config.contracts.sbtContractAddress) {
      errors.push('SBT contract address is required for blockchain operations');
    }
  }
  
  if (config.ipfs.enabled) {
    if (!process.env.REACT_APP_PINATA_API_KEY) {
      errors.push('Pinata API key is required for IPFS operations');
    }
    
    if (!process.env.REACT_APP_PINATA_SECRET_KEY) {
      errors.push('Pinata secret key is required for IPFS operations');
    }
  }
  
  return errors;
}

/**
 * Get network-specific RPC URL
 */
export function getNetworkRPCUrl(network: string): string {
  switch (network) {
    case 'moonbase-alpha':
      return 'https://rpc.api.moonbase.moonbeam.network';
    case 'moonbeam':
      return 'https://rpc.api.moonbeam.network';
    case 'moonriver':
      return 'https://rpc.api.moonriver.moonbeam.network';
    default:
      return 'https://rpc.api.moonbase.moonbeam.network';
  }
}

/**
 * Get network-specific chain ID
 */
export function getNetworkChainId(network: string): number {
  switch (network) {
    case 'moonbase-alpha':
      return 1287;
    case 'moonbeam':
      return 1284;
    case 'moonriver':
      return 1285;
    default:
      return 1287;
  }
}

/**
 * Get network-specific block explorer URL
 */
export function getNetworkExplorerUrl(network: string): string {
  switch (network) {
    case 'moonbase-alpha':
      return 'https://moonbase.moonscan.io';
    case 'moonbeam':
      return 'https://moonscan.io';
    case 'moonriver':
      return 'https://moonriver.moonscan.io';
    default:
      return 'https://moonbase.moonscan.io';
  }
}
