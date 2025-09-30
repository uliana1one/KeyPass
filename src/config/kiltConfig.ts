/**
 * KILT Configuration
 * 
 * Centralized configuration for KILT parachain integration including:
 * - Network endpoints and connection settings
 * - Transaction parameters and gas limits
 * - Key management settings
 * - Error codes and messages
 * - DID registration settings
 */

/**
 * KILT network types
 */
export enum KILTNetwork {
  SPIRITNET = 'spiritnet',
  MAINNET = 'mainnet',
  PEREGRINE = 'peregrine',
  DEVNET = 'devnet',
}

/**
 * KILT network configuration
 */
export interface KILTNetworkConfig {
  /** Network identifier */
  network: KILTNetwork;
  /** Primary WebSocket endpoint */
  wsEndpoint: string;
  /** Alternative WebSocket endpoints for redundancy */
  altWsEndpoints?: string[];
  /** HTTP RPC endpoint (if available) */
  httpEndpoint?: string;
  /** SS58 format used by this network */
  ss58Format: number;
  /** Chain name */
  chainName: string;
  /** Network display name */
  displayName: string;
  /** Whether this is a test network */
  isTestnet: boolean;
  /** Genesis hash */
  genesisHash: string;
  /** Default token symbol */
  tokenSymbol: string;
  /** Token decimals */
  tokenDecimals: number;
  /** Block time in milliseconds */
  blockTime: number;
}

/**
 * Transaction configuration
 */
export interface KILTTransactionConfig {
  /** Default gas limit for transactions */
  defaultGasLimit: string;
  /** Maximum gas limit */
  maxGasLimit: string;
  /** Gas multiplier for estimation */
  gasMultiplier: number;
  /** Default transaction tip */
  defaultTip: string;
  /** Maximum transaction tip */
  maxTip: string;
  /** Transaction confirmation timeout in milliseconds */
  confirmationTimeout: number;
  /** Maximum retry attempts for failed transactions */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
  /** Exponential backoff multiplier for retries */
  retryBackoffMultiplier: number;
  /** Maximum retry delay in milliseconds */
  maxRetryDelay: number;
  /** Transaction priority */
  priority: number;
  /** Transaction era length in blocks */
  eraLength: number;
}

/**
 * Key management configuration
 */
export interface KILTKeyConfig {
  /** Supported key types */
  supportedKeyTypes: string[];
  /** Default key type for new keys */
  defaultKeyType: string;
  /** Key derivation path template */
  derivationPathTemplate: string;
  /** Maximum key derivation depth */
  maxDerivationDepth: number;
  /** Key cache timeout in milliseconds */
  keyCacheTimeout: number;
  /** Maximum number of cached keys */
  maxCachedKeys: number;
  /** Key generation entropy source */
  entropySource: 'crypto' | 'custom';
  /** Whether to use hardware security modules */
  useHSM: boolean;
}

/**
 * DID configuration
 */
export interface KILTDIDConfig {
  /** Default DID context URLs */
  defaultContext: string[];
  /** Supported verification method types */
  supportedVerificationMethods: string[];
  /** Default verification method type */
  defaultVerificationMethod: string;
  /** Maximum number of verification methods per DID */
  maxVerificationMethods: number;
  /** Maximum number of services per DID */
  maxServices: number;
  /** DID document cache timeout in milliseconds */
  didDocumentCacheTimeout: number;
  /** Whether to validate DID documents on creation */
  validateDidDocuments: boolean;
  /** Supported service types */
  supportedServiceTypes: string[];
}

/**
 * Error configuration
 */
export interface KILTErrorConfig {
  /** Default error messages */
  messages: Record<string, string>;
  /** Error codes mapping */
  codes: Record<string, string>;
  /** Whether to include stack traces in errors */
  includeStackTrace: boolean;
  /** Maximum error message length */
  maxErrorMessageLength: number;
  /** Error logging configuration */
  logging: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
    includeContext: boolean;
  };
}

/**
 * Complete KILT configuration
 */
export interface KILTConfig {
  /** Network configuration */
  network: KILTNetworkConfig;
  /** Transaction configuration */
  transaction: KILTTransactionConfig;
  /** Key management configuration */
  keyManagement: KILTKeyConfig;
  /** DID configuration */
  did: KILTDIDConfig;
  /** Error configuration */
  error: KILTErrorConfig;
  /** Global settings */
  global: {
    /** Default network to use */
    defaultNetwork: KILTNetwork;
    /** API version */
    apiVersion: string;
    /** SDK version */
    sdkVersion: string;
    /** Debug mode */
    debug: boolean;
    /** Logging level */
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

/**
 * Predefined network configurations
 */
export const KILT_NETWORKS: Record<KILTNetwork, KILTNetworkConfig> = {
  [KILTNetwork.SPIRITNET]: {
    network: KILTNetwork.SPIRITNET,
    wsEndpoint: 'wss://spiritnet.kilt.io',
    altWsEndpoints: [
      'wss://spiritnet.kilt.io:443',
      'wss://kilt-spiritnet.dwellir.com',
    ],
    httpEndpoint: 'https://spiritnet.kilt.io',
    ss58Format: 38,
    chainName: 'KILT Spiritnet',
    displayName: 'KILT Spiritnet (Testnet)',
    isTestnet: true,
    genesisHash: '0x411f057b9107718c9824bdbfaeb4852fd7308a01522519044155e7a3696e6c45',
    tokenSymbol: 'KILT',
    tokenDecimals: 15,
    blockTime: 6000,
  },

  [KILTNetwork.MAINNET]: {
    network: KILTNetwork.MAINNET,
    wsEndpoint: 'wss://kilt-rpc.dwellir.com',
    altWsEndpoints: [
      'wss://mainnet.kilt.io',
      'wss://kilt-rpc.dwellir.com:443',
    ],
    httpEndpoint: 'https://kilt-rpc.dwellir.com',
    ss58Format: 38,
    chainName: 'KILT',
    displayName: 'KILT Mainnet',
    isTestnet: false,
    genesisHash: '0x411f057b9107718c9824bdbfaeb4852fd7308a01522519044155e7a3696e6c45',
    tokenSymbol: 'KILT',
    tokenDecimals: 15,
    blockTime: 6000,
  },

  [KILTNetwork.PEREGRINE]: {
    network: KILTNetwork.PEREGRINE,
    wsEndpoint: 'wss://peregrine.kilt.io',
    altWsEndpoints: [
      'wss://peregrine.kilt.io:443',
    ],
    httpEndpoint: 'https://peregrine.kilt.io',
    ss58Format: 38,
    chainName: 'KILT Peregrine',
    displayName: 'KILT Peregrine (Testnet)',
    isTestnet: true,
    genesisHash: '0x686a1b49d3ba46e5b9c906c4e1c9a3a3b9f3b3b3b3b3b3b3b3b3b3b3b3b3b3b',
    tokenSymbol: 'PILT',
    tokenDecimals: 15,
    blockTime: 6000,
  },

  [KILTNetwork.DEVNET]: {
    network: KILTNetwork.DEVNET,
    wsEndpoint: 'wss://devnet.kilt.io',
    altWsEndpoints: [],
    httpEndpoint: 'https://devnet.kilt.io',
    ss58Format: 38,
    chainName: 'KILT Devnet',
    displayName: 'KILT Devnet (Development)',
    isTestnet: true,
    genesisHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
    tokenSymbol: 'DILT',
    tokenDecimals: 15,
    blockTime: 6000,
  },
};

/**
 * Default transaction configuration
 */
export const DEFAULT_TRANSACTION_CONFIG: KILTTransactionConfig = {
  defaultGasLimit: '200000000000', // 200 G
  maxGasLimit: '1000000000000', // 1T
  gasMultiplier: 1.2,
  defaultTip: '1000000000000000', // 0.001 KILT
  maxTip: '1000000000000000000', // 1 KILT
  confirmationTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  retryBackoffMultiplier: 2,
  maxRetryDelay: 30000, // 30 seconds
  priority: 1,
  eraLength: 64,
};

/**
 * Default key management configuration
 */
export const DEFAULT_KEY_CONFIG: KILTKeyConfig = {
  supportedKeyTypes: ['sr25519', 'ed25519', 'ecdsa'],
  defaultKeyType: 'sr25519',
  derivationPathTemplate: "m/44'/38'/{index}'/0'/0'",
  maxDerivationDepth: 5,
  keyCacheTimeout: 300000, // 5 minutes
  maxCachedKeys: 100,
  entropySource: 'crypto',
  useHSM: false,
};

/**
 * Default DID configuration
 */
export const DEFAULT_DID_CONFIG: KILTDIDConfig = {
  defaultContext: [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/sr25519-2020/v1',
    'https://w3id.org/security/suites/kilt-2023/v1',
  ],
  supportedVerificationMethods: [
    'Sr25519VerificationKey2020',
    'Ed25519VerificationKey2020',
    'X25519KeyAgreementKey2020',
    'KiltParachainVerificationMethod2023',
  ],
  defaultVerificationMethod: 'Sr25519VerificationKey2020',
  maxVerificationMethods: 10,
  maxServices: 20,
  didDocumentCacheTimeout: 600000, // 10 minutes
  validateDidDocuments: true,
  supportedServiceTypes: [
    'KiltParachainService',
    'KiltDIDRegistry',
    'KiltCredentialRegistry',
    'KiltAttestationService',
    'KiltDelegationService',
  ],
};

/**
 * Default error configuration
 */
export const DEFAULT_ERROR_CONFIG: KILTErrorConfig = {
  messages: {
    NETWORK_ERROR: 'Network connection failed',
    PARACHAIN_CONNECTION_ERROR: 'Failed to connect to KILT parachain',
    INVALID_KILT_ADDRESS: 'Invalid KILT address format',
    KILT_DID_NOT_FOUND: 'KILT DID not found on chain',
    INSUFFICIENT_BALANCE: 'Insufficient balance for transaction',
    TRANSACTION_EXECUTION_ERROR: 'Transaction execution failed',
    DID_REGISTRATION_ERROR: 'KILT DID registration failed',
    CREDENTIAL_VERIFICATION_ERROR: 'Credential verification failed',
    GOVERNANCE_ERROR: 'Governance operation failed',
    DELEGATION_ERROR: 'Delegation operation failed',
    INVALID_SIGNATURE: 'Invalid signature provided',
    TIMEOUT_ERROR: 'Operation timed out',
    VALIDATION_ERROR: 'Input validation failed',
    UNKNOWN_ERROR: 'An unknown error occurred',
  },
  codes: {
    NETWORK_ERROR: 'KILT_NETWORK_ERROR',
    PARACHAIN_CONNECTION_ERROR: 'KILT_PARACHAIN_CONNECTION_ERROR',
    INVALID_KILT_ADDRESS: 'KILT_INVALID_ADDRESS',
    KILT_DID_NOT_FOUND: 'KILT_DID_NOT_FOUND',
    INSUFFICIENT_BALANCE: 'KILT_INSUFFICIENT_BALANCE',
    TRANSACTION_EXECUTION_ERROR: 'KILT_TRANSACTION_EXECUTION_ERROR',
    DID_REGISTRATION_ERROR: 'KILT_DID_REGISTRATION_ERROR',
    CREDENTIAL_VERIFICATION_ERROR: 'KILT_CREDENTIAL_VERIFICATION_ERROR',
    GOVERNANCE_ERROR: 'KILT_GOVERNANCE_ERROR',
    DELEGATION_ERROR: 'KILT_DELEGATION_ERROR',
    INVALID_SIGNATURE: 'KILT_INVALID_SIGNATURE',
    TIMEOUT_ERROR: 'KILT_TIMEOUT_ERROR',
    VALIDATION_ERROR: 'KILT_VALIDATION_ERROR',
    UNKNOWN_ERROR: 'KILT_UNKNOWN_ERROR',
  },
  includeStackTrace: false,
  maxErrorMessageLength: 1000,
  logging: {
    enabled: true,
    level: 'error',
    includeContext: true,
  },
};

/**
 * Default global configuration
 */
export const DEFAULT_GLOBAL_CONFIG = {
  defaultNetwork: KILTNetwork.SPIRITNET,
  apiVersion: '1.0.0',
  sdkVersion: '1.0.0',
  debug: false,
  logLevel: 'info' as const,
};

/**
 * Default complete KILT configuration
 */
export const DEFAULT_KILT_CONFIG: KILTConfig = {
  network: KILT_NETWORKS[KILTNetwork.SPIRITNET],
  transaction: DEFAULT_TRANSACTION_CONFIG,
  keyManagement: DEFAULT_KEY_CONFIG,
  did: DEFAULT_DID_CONFIG,
  error: DEFAULT_ERROR_CONFIG,
  global: DEFAULT_GLOBAL_CONFIG,
};

/**
 * Configuration manager for KILT settings
 */
export class KILTConfigManager {
  private config: KILTConfig;

  constructor(config?: Partial<KILTConfig>) {
    this.config = KILTConfigManager.mergeConfig(DEFAULT_KILT_CONFIG, config || {});
  }

  /**
   * Gets the current configuration
   */
  public getConfig(): KILTConfig {
    return KILTConfigManager.mergeConfig({}, this.config);
  }

  /**
   * Updates the configuration
   */
  public updateConfig(updates: Partial<KILTConfig>): void {
    this.config = KILTConfigManager.mergeConfig(this.config, updates);
  }

  /**
   * Gets network configuration for a specific network
   */
  public getNetworkConfig(network: KILTNetwork): KILTNetworkConfig {
    return KILT_NETWORKS[network] || KILT_NETWORKS[KILTNetwork.SPIRITNET];
  }

  /**
   * Sets the active network
   */
  public setNetwork(network: KILTNetwork): void {
    this.config.network = this.getNetworkConfig(network);
    this.config.global.defaultNetwork = network;
  }

  /**
   * Gets the current network
   */
  public getCurrentNetwork(): KILTNetwork {
    return this.config.network.network;
  }

  /**
   * Gets transaction configuration
   */
  public getTransactionConfig(): KILTTransactionConfig {
    return { ...this.config.transaction };
  }

  /**
   * Updates transaction configuration
   */
  public updateTransactionConfig(updates: Partial<KILTTransactionConfig>): void {
    this.config.transaction = { ...this.config.transaction, ...updates };
  }

  /**
   * Gets key management configuration
   */
  public getKeyConfig(): KILTKeyConfig {
    return { ...this.config.keyManagement };
  }

  /**
   * Updates key management configuration
   */
  public updateKeyConfig(updates: Partial<KILTKeyConfig>): void {
    this.config.keyManagement = { ...this.config.keyManagement, ...updates };
  }

  /**
   * Gets DID configuration
   */
  public getDIDConfig(): KILTDIDConfig {
    return { ...this.config.did };
  }

  /**
   * Updates DID configuration
   */
  public updateDIDConfig(updates: Partial<KILTDIDConfig>): void {
    this.config.did = { ...this.config.did, ...updates };
  }

  /**
   * Gets error configuration
   */
  public getErrorConfig(): KILTErrorConfig {
    return { ...this.config.error };
  }

  /**
   * Updates error configuration
   */
  public updateErrorConfig(updates: Partial<KILTErrorConfig>): void {
    this.config.error = { ...this.config.error, ...updates };
  }

  /**
   * Gets an error message by key
   */
  public getErrorMessage(key: string): string {
    return this.config.error.messages[key] || this.config.error.messages.UNKNOWN_ERROR;
  }

  /**
   * Gets an error code by key
   */
  public getErrorCode(key: string): string {
    return this.config.error.codes[key] || this.config.error.codes.UNKNOWN_ERROR;
  }

  /**
   * Checks if debug mode is enabled
   */
  public isDebugEnabled(): boolean {
    return this.config.global.debug;
  }

  /**
   * Sets debug mode
   */
  public setDebugEnabled(enabled: boolean): void {
    this.config.global.debug = enabled;
  }

  /**
   * Gets the log level
   */
  public getLogLevel(): string {
    return this.config.global.logLevel;
  }

  /**
   * Sets the log level
   */
  public setLogLevel(level: 'error' | 'warn' | 'info' | 'debug'): void {
    this.config.global.logLevel = level;
  }

  /**
   * Validates the current configuration
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate network configuration
    if (!this.config.network.wsEndpoint) {
      errors.push('Network WebSocket endpoint is required');
    }

    if (!this.config.network.ss58Format || this.config.network.ss58Format !== 38) {
      errors.push('KILT networks must use SS58 format 38');
    }

    // Validate transaction configuration
    if (this.config.transaction.maxRetries < 0) {
      errors.push('Maximum retries must be non-negative');
    }

    if (this.config.transaction.confirmationTimeout <= 0) {
      errors.push('Confirmation timeout must be positive');
    }

    // Validate key management configuration
    if (!this.config.keyManagement.supportedKeyTypes.includes(this.config.keyManagement.defaultKeyType)) {
      errors.push('Default key type must be in supported key types');
    }

    // Validate DID configuration
    if (this.config.did.maxVerificationMethods <= 0) {
      errors.push('Maximum verification methods must be positive');
    }

    if (this.config.did.maxServices <= 0) {
      errors.push('Maximum services must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates a configuration for a specific network
   */
  public static createNetworkConfig(network: KILTNetwork, overrides?: Partial<KILTConfig>): KILTConfig {
    const baseConfig = { ...DEFAULT_KILT_CONFIG };
    baseConfig.network = KILT_NETWORKS[network];
    baseConfig.global.defaultNetwork = network;

    if (overrides) {
      return this.mergeConfig(baseConfig, overrides);
    }

    return baseConfig;
  }

  /**
   * Merges configuration objects deeply
   */
  private static mergeConfig(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeConfig(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

/**
 * Default configuration manager instance
 */
export const defaultKiltConfig = new KILTConfigManager();

/**
 * Utility functions for configuration
 */
export const KILTConfigUtils = {
  /**
   * Creates a configuration manager for a specific network
   */
  createConfigForNetwork: (network: KILTNetwork, overrides?: Partial<KILTConfig>) => {
    return new KILTConfigManager(KILTConfigManager.createNetworkConfig(network, overrides));
  },

  /**
   * Gets network endpoint for a specific network
   */
  getNetworkEndpoint: (network: KILTNetwork): string => {
    return KILT_NETWORKS[network]?.wsEndpoint || KILT_NETWORKS[KILTNetwork.SPIRITNET].wsEndpoint;
  },

  /**
   * Checks if a network is a testnet
   */
  isTestnet: (network: KILTNetwork): boolean => {
    return KILT_NETWORKS[network]?.isTestnet || false;
  },

  /**
   * Gets supported networks
   */
  getSupportedNetworks: (): KILTNetwork[] => {
    return Object.values(KILTNetwork);
  },

  /**
   * Validates a network identifier
   */
  isValidNetwork: (network: string): network is KILTNetwork => {
    return Object.values(KILTNetwork).includes(network as KILTNetwork);
  },
};
