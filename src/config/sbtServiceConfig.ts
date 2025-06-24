/**
 * SBT Service Configuration
 * 
 * Default configuration for the SBT service with provider settings,
 * cache configuration, and other service options.
 */

import { SBTServiceConfig, BlockchainProviderConfig, CacheConfig } from '../services/SBTService';
import { SBTChainType } from '../types/sbt';

/**
 * Default blockchain provider configurations
 */
const defaultProviders: Record<SBTChainType, BlockchainProviderConfig> = {
  [SBTChainType.MOONBEAM]: {
    url: 'https://rpc.api.moonbeam.network',
    chainId: '1284',
    chainType: SBTChainType.MOONBEAM,
    timeout: 30000,
    maxRetries: 3,
  },
  [SBTChainType.ETHEREUM]: {
    url: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    chainId: '1',
    chainType: SBTChainType.ETHEREUM,
    timeout: 30000,
    maxRetries: 3,
  },
  [SBTChainType.POLKADOT]: {
    url: 'wss://rpc.polkadot.io',
    chainId: '0',
    chainType: SBTChainType.POLKADOT,
    timeout: 30000,
    maxRetries: 3,
  },
  [SBTChainType.KUSAMA]: {
    url: 'wss://kusama-rpc.polkadot.io',
    chainId: '2',
    chainType: SBTChainType.KUSAMA,
    timeout: 30000,
    maxRetries: 3,
  },
};

/**
 * Default cache configuration
 */
const defaultCache: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // Maximum 1000 items in cache
  enabled: true,
};

/**
 * Default SBT service configuration
 */
export const defaultSBTServiceConfig: SBTServiceConfig = {
  providers: defaultProviders,
  cache: defaultCache,
  defaultTimeout: 30000, // 30 seconds
  debug: false,
};

/**
 * Development configuration with debug enabled
 */
export const developmentSBTServiceConfig: SBTServiceConfig = {
  ...defaultSBTServiceConfig,
  debug: true,
  cache: {
    ...defaultCache,
    ttl: 1 * 60 * 1000, // 1 minute for faster testing
  },
};

/**
 * Production configuration with optimized settings
 */
export const productionSBTServiceConfig: SBTServiceConfig = {
  ...defaultSBTServiceConfig,
  debug: false,
  cache: {
    ...defaultCache,
    ttl: 15 * 60 * 1000, // 15 minutes for better performance
    maxSize: 5000, // More cache items for production
  },
};

/**
 * Test configuration with minimal settings
 */
export const testSBTServiceConfig: SBTServiceConfig = {
  ...defaultSBTServiceConfig,
  debug: false,
  cache: {
    ...defaultCache,
    enabled: false, // Disable cache for testing
  },
};

/**
 * Get configuration based on environment
 */
export function getSBTServiceConfig(): SBTServiceConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionSBTServiceConfig;
    case 'test':
      return testSBTServiceConfig;
    case 'development':
    default:
      return developmentSBTServiceConfig;
  }
}

/**
 * Create custom configuration with overrides
 */
export function createSBTServiceConfig(overrides: Partial<SBTServiceConfig>): SBTServiceConfig {
  return {
    ...defaultSBTServiceConfig,
    ...overrides,
    providers: {
      ...defaultProviders,
      ...overrides.providers,
    },
    cache: {
      ...defaultCache,
      ...overrides.cache,
    },
  };
} 