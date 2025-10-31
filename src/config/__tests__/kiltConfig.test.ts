import {
  KILTConfigManager,
  KILT_NETWORKS,
  KILTNetwork,
  DEFAULT_KILT_CONFIG,
  DEFAULT_TRANSACTION_CONFIG,
  DEFAULT_KEY_CONFIG,
  DEFAULT_DID_CONFIG,
  DEFAULT_ERROR_CONFIG,
  KILTConfigUtils,
} from '../kiltConfig.js';

describe('KILT Configuration', () => {
  let configManager: KILTConfigManager;

  beforeEach(() => {
    configManager = new KILTConfigManager();
  });

  describe('Network Configuration', () => {
    it('should have all required networks defined', () => {
      expect(KILT_NETWORKS[KILTNetwork.SPIRITNET]).toBeDefined();
      expect(KILT_NETWORKS[KILTNetwork.MAINNET]).toBeDefined();
      expect(KILT_NETWORKS[KILTNetwork.PEREGRINE]).toBeDefined();
      expect(KILT_NETWORKS[KILTNetwork.DEVNET]).toBeDefined();
    });

    it('should have correct network properties for spiritnet', () => {
      const spiritnet = KILT_NETWORKS[KILTNetwork.SPIRITNET];
      
      expect(spiritnet.network).toBe(KILTNetwork.SPIRITNET);
      expect(spiritnet.wsEndpoint).toBe('wss://spiritnet.kilt.io');
      expect(spiritnet.ss58Format).toBe(38);
      expect(spiritnet.chainName).toBe('KILT Spiritnet');
      expect(spiritnet.isTestnet).toBe(true);
      expect(spiritnet.tokenSymbol).toBe('KILT');
      expect(spiritnet.tokenDecimals).toBe(15);
      expect(spiritnet.blockTime).toBe(6000);
    });

    it('should have correct network properties for mainnet', () => {
      const mainnet = KILT_NETWORKS[KILTNetwork.MAINNET];
      
      expect(mainnet.network).toBe(KILTNetwork.MAINNET);
      expect(mainnet.wsEndpoint).toBe('wss://kilt-rpc.dwellir.com');
      expect(mainnet.ss58Format).toBe(38);
      expect(mainnet.chainName).toBe('KILT');
      expect(mainnet.isTestnet).toBe(false);
      expect(mainnet.tokenSymbol).toBe('KILT');
      expect(mainnet.tokenDecimals).toBe(15);
      expect(mainnet.blockTime).toBe(6000);
    });

    it('should have alternative endpoints for main networks', () => {
      expect(KILT_NETWORKS[KILTNetwork.SPIRITNET].altWsEndpoints).toBeDefined();
      expect(KILT_NETWORKS[KILTNetwork.SPIRITNET].altWsEndpoints?.length).toBeGreaterThan(0);
      expect(KILT_NETWORKS[KILTNetwork.MAINNET].altWsEndpoints).toBeDefined();
      expect(KILT_NETWORKS[KILTNetwork.MAINNET].altWsEndpoints?.length).toBeGreaterThan(0);
    });
  });

  describe('Default Configurations', () => {
    it('should have valid default transaction configuration', () => {
      expect(DEFAULT_TRANSACTION_CONFIG.defaultGasLimit).toBe('200000000000');
      expect(DEFAULT_TRANSACTION_CONFIG.maxGasLimit).toBe('1000000000000');
      expect(DEFAULT_TRANSACTION_CONFIG.gasMultiplier).toBe(1.2);
      expect(DEFAULT_TRANSACTION_CONFIG.confirmationTimeout).toBe(30000);
      expect(DEFAULT_TRANSACTION_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_TRANSACTION_CONFIG.retryDelay).toBe(2000);
      expect(DEFAULT_TRANSACTION_CONFIG.retryBackoffMultiplier).toBe(2);
    });

    it('should have valid default key configuration', () => {
      expect(DEFAULT_KEY_CONFIG.supportedKeyTypes).toContain('sr25519');
      expect(DEFAULT_KEY_CONFIG.supportedKeyTypes).toContain('ed25519');
      expect(DEFAULT_KEY_CONFIG.defaultKeyType).toBe('sr25519');
      expect(DEFAULT_KEY_CONFIG.derivationPathTemplate).toContain('38');
      expect(DEFAULT_KEY_CONFIG.maxDerivationDepth).toBe(5);
      expect(DEFAULT_KEY_CONFIG.keyCacheTimeout).toBe(300000);
      expect(DEFAULT_KEY_CONFIG.entropySource).toBe('crypto');
      expect(DEFAULT_KEY_CONFIG.useHSM).toBe(false);
    });

    it('should have valid default DID configuration', () => {
      expect(DEFAULT_DID_CONFIG.defaultContext).toContain('https://www.w3.org/ns/did/v1');
      expect(DEFAULT_DID_CONFIG.defaultContext).toContain('https://w3id.org/security/suites/sr25519-2020/v1');
      expect(DEFAULT_DID_CONFIG.supportedVerificationMethods).toContain('Sr25519VerificationKey2020');
      expect(DEFAULT_DID_CONFIG.defaultVerificationMethod).toBe('Sr25519VerificationKey2020');
      expect(DEFAULT_DID_CONFIG.maxVerificationMethods).toBe(10);
      expect(DEFAULT_DID_CONFIG.maxServices).toBe(20);
      expect(DEFAULT_DID_CONFIG.validateDidDocuments).toBe(true);
    });

    it('should have valid default error configuration', () => {
      expect(DEFAULT_ERROR_CONFIG.messages.NETWORK_ERROR).toBe('Network connection failed');
      expect(DEFAULT_ERROR_CONFIG.messages.INVALID_KILT_ADDRESS).toBe('Invalid KILT address format');
      expect(DEFAULT_ERROR_CONFIG.codes.NETWORK_ERROR).toBe('KILT_NETWORK_ERROR');
      expect(DEFAULT_ERROR_CONFIG.includeStackTrace).toBe(false);
      expect(DEFAULT_ERROR_CONFIG.maxErrorMessageLength).toBe(1000);
      expect(DEFAULT_ERROR_CONFIG.logging.enabled).toBe(true);
      expect(DEFAULT_ERROR_CONFIG.logging.level).toBe('error');
    });

    it('should have valid default global configuration', () => {
      expect(DEFAULT_KILT_CONFIG.global.defaultNetwork).toBe(KILTNetwork.SPIRITNET);
      expect(DEFAULT_KILT_CONFIG.global.apiVersion).toBe('1.0.0');
      expect(DEFAULT_KILT_CONFIG.global.sdkVersion).toBe('1.0.0');
      expect(DEFAULT_KILT_CONFIG.global.debug).toBe(false);
      expect(DEFAULT_KILT_CONFIG.global.logLevel).toBe('info');
    });
  });

  describe('KILTConfigManager', () => {
    it('should create with default configuration', () => {
      const config = configManager.getConfig();
      
      expect(config.network.network).toBe(KILTNetwork.SPIRITNET);
      expect(config.transaction).toEqual(DEFAULT_TRANSACTION_CONFIG);
      expect(config.keyManagement).toEqual(DEFAULT_KEY_CONFIG);
      expect(config.did).toEqual(DEFAULT_DID_CONFIG);
      expect(config.error).toEqual(DEFAULT_ERROR_CONFIG);
    });

    it('should create with custom configuration', () => {
      const customConfig = {
        transaction: {
          maxRetries: 5,
          confirmationTimeout: 60000,
        },
        global: {
          debug: true,
          logLevel: 'debug' as const,
        },
      };

      const customManager = new KILTConfigManager(customConfig);
      const config = customManager.getConfig();

      expect(config.transaction.maxRetries).toBe(5);
      expect(config.transaction.confirmationTimeout).toBe(60000);
      expect(config.global.debug).toBe(true);
      expect(config.global.logLevel).toBe('debug');
    });

    it('should update configuration', () => {
      configManager.updateConfig({
        transaction: {
          maxRetries: 10,
        },
        global: {
          debug: true,
        },
      });

      const config = configManager.getConfig();
      expect(config.transaction.maxRetries).toBe(10);
      expect(config.global.debug).toBe(true);
    });

    it('should get network configuration for specific network', () => {
      const mainnetConfig = configManager.getNetworkConfig(KILTNetwork.MAINNET);
      
      expect(mainnetConfig.network).toBe(KILTNetwork.MAINNET);
      expect(mainnetConfig.wsEndpoint).toBe('wss://kilt-rpc.dwellir.com');
      expect(mainnetConfig.isTestnet).toBe(false);
    });

    it('should set and get current network', () => {
      configManager.setNetwork(KILTNetwork.MAINNET);
      
      expect(configManager.getCurrentNetwork()).toBe(KILTNetwork.MAINNET);
      
      const config = configManager.getConfig();
      expect(config.network.network).toBe(KILTNetwork.MAINNET);
      expect(config.global.defaultNetwork).toBe(KILTNetwork.MAINNET);
    });

    it('should get and update transaction configuration', () => {
      const txConfig = configManager.getTransactionConfig();
      expect(txConfig.maxRetries).toBe(3);

      configManager.updateTransactionConfig({ maxRetries: 7 });
      
      const updatedTxConfig = configManager.getTransactionConfig();
      expect(updatedTxConfig.maxRetries).toBe(7);
    });

    it('should get and update key configuration', () => {
      const keyConfig = configManager.getKeyConfig();
      expect(keyConfig.defaultKeyType).toBe('sr25519');

      configManager.updateKeyConfig({ defaultKeyType: 'ed25519' });
      
      const updatedKeyConfig = configManager.getKeyConfig();
      expect(updatedKeyConfig.defaultKeyType).toBe('ed25519');
    });

    it('should get and update DID configuration', () => {
      const didConfig = configManager.getDIDConfig();
      expect(didConfig.maxVerificationMethods).toBe(10);

      configManager.updateDIDConfig({ maxVerificationMethods: 15 });
      
      const updatedDidConfig = configManager.getDIDConfig();
      expect(updatedDidConfig.maxVerificationMethods).toBe(15);
    });

    it('should get and update error configuration', () => {
      const errorConfig = configManager.getErrorConfig();
      expect(errorConfig.logging.enabled).toBe(true);

      configManager.updateErrorConfig({
        logging: { enabled: false, level: 'debug', includeContext: false },
      });
      
      const updatedErrorConfig = configManager.getErrorConfig();
      expect(updatedErrorConfig.logging.enabled).toBe(false);
      expect(updatedErrorConfig.logging.level).toBe('debug');
    });

    it('should get error message by key', () => {
      const message = configManager.getErrorMessage('NETWORK_ERROR');
      expect(message).toBe('Network connection failed');

      const unknownMessage = configManager.getErrorMessage('UNKNOWN_KEY');
      expect(unknownMessage).toBe('An unknown error occurred');
    });

    it('should get error code by key', () => {
      const code = configManager.getErrorCode('NETWORK_ERROR');
      expect(code).toBe('KILT_NETWORK_ERROR');

      const unknownCode = configManager.getErrorCode('UNKNOWN_KEY');
      expect(unknownCode).toBe('KILT_UNKNOWN_ERROR');
    });

    it('should check and set debug mode', () => {
      expect(configManager.isDebugEnabled()).toBe(false);
      
      configManager.setDebugEnabled(true);
      expect(configManager.isDebugEnabled()).toBe(true);
      
      configManager.setDebugEnabled(false);
      expect(configManager.isDebugEnabled()).toBe(false);
    });

    it('should get and set log level', () => {
      expect(configManager.getLogLevel()).toBe('info');
      
      configManager.setLogLevel('debug');
      expect(configManager.getLogLevel()).toBe('debug');
      
      configManager.setLogLevel('error');
      expect(configManager.getLogLevel()).toBe('error');
    });

    it('should validate configuration', () => {
      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const invalidManager = new KILTConfigManager({
        transaction: {
          maxRetries: -1,
          confirmationTimeout: 0,
        },
        keyManagement: {
          supportedKeyTypes: ['sr25519'],
          defaultKeyType: 'ed25519', // Not in supported types
        },
      });

      const validation = invalidManager.validateConfig();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Maximum retries must be non-negative');
      expect(validation.errors).toContain('Confirmation timeout must be positive');
      expect(validation.errors).toContain('Default key type must be in supported key types');
    });

    it('should create network-specific configuration', () => {
      const mainnetConfig = KILTConfigManager.createNetworkConfig(KILTNetwork.MAINNET);
      
      expect(mainnetConfig.network.network).toBe(KILTNetwork.MAINNET);
      expect(mainnetConfig.global.defaultNetwork).toBe(KILTNetwork.MAINNET);
      expect(mainnetConfig.network.isTestnet).toBe(false);
    });

    it('should create network configuration with overrides', () => {
      const customConfig = KILTConfigManager.createNetworkConfig(
        KILTNetwork.MAINNET,
        {
          transaction: { maxRetries: 10 },
          global: { debug: true },
        }
      );
      
      expect(customConfig.network.network).toBe(KILTNetwork.MAINNET);
      expect(customConfig.transaction.maxRetries).toBe(10);
      expect(customConfig.global.debug).toBe(true);
    });
  });

  describe('KILTConfigUtils', () => {
    it('should create configuration manager for specific network', () => {
      const manager = KILTConfigUtils.createConfigForNetwork(KILTNetwork.MAINNET);
      
      expect(manager.getCurrentNetwork()).toBe(KILTNetwork.MAINNET);
      expect(manager.getConfig().network.isTestnet).toBe(false);
    });

    it('should create configuration manager with overrides', () => {
      const manager = KILTConfigUtils.createConfigForNetwork(
        KILTNetwork.MAINNET,
        { global: { debug: true } }
      );
      
      expect(manager.getCurrentNetwork()).toBe(KILTNetwork.MAINNET);
      expect(manager.isDebugEnabled()).toBe(true);
    });

    it('should get network endpoint for specific network', () => {
      const spiritnetEndpoint = KILTConfigUtils.getNetworkEndpoint(KILTNetwork.SPIRITNET);
      expect(spiritnetEndpoint).toBe('wss://spiritnet.kilt.io');

      const mainnetEndpoint = KILTConfigUtils.getNetworkEndpoint(KILTNetwork.MAINNET);
      expect(mainnetEndpoint).toBe('wss://kilt-rpc.dwellir.com');
    });

    it('should return default endpoint for invalid network', () => {
      const defaultEndpoint = KILTConfigUtils.getNetworkEndpoint('invalid' as KILTNetwork);
      expect(defaultEndpoint).toBe('wss://spiritnet.kilt.io');
    });

    it('should check if network is testnet', () => {
      expect(KILTConfigUtils.isTestnet(KILTNetwork.SPIRITNET)).toBe(true);
      expect(KILTConfigUtils.isTestnet(KILTNetwork.MAINNET)).toBe(false);
      expect(KILTConfigUtils.isTestnet(KILTNetwork.PEREGRINE)).toBe(true);
      expect(KILTConfigUtils.isTestnet(KILTNetwork.DEVNET)).toBe(true);
    });

    it('should get supported networks', () => {
      const networks = KILTConfigUtils.getSupportedNetworks();
      
      expect(networks).toContain(KILTNetwork.SPIRITNET);
      expect(networks).toContain(KILTNetwork.MAINNET);
      expect(networks).toContain(KILTNetwork.PEREGRINE);
      expect(networks).toContain(KILTNetwork.DEVNET);
      expect(networks).toHaveLength(4);
    });

    it('should validate network identifier', () => {
      expect(KILTConfigUtils.isValidNetwork('spiritnet')).toBe(true);
      expect(KILTConfigUtils.isValidNetwork('mainnet')).toBe(true);
      expect(KILTConfigUtils.isValidNetwork('peregrine')).toBe(true);
      expect(KILTConfigUtils.isValidNetwork('devnet')).toBe(true);
      expect(KILTConfigUtils.isValidNetwork('invalid')).toBe(false);
      expect(KILTConfigUtils.isValidNetwork('')).toBe(false);
    });
  });

  describe('Configuration Merging', () => {
    it('should merge configurations deeply', () => {
      const baseConfig = {
        a: { b: 1, c: 2 },
        d: 3,
      };

      const overrideConfig = {
        a: { c: 4 },
        e: 5,
      };

      const merged = KILTConfigManager['mergeConfig'](baseConfig, overrideConfig);
      
      expect(merged.a.b).toBe(1); // Should preserve base value
      expect(merged.a.c).toBe(4); // Should override
      expect(merged.d).toBe(3); // Should preserve base value
      expect(merged.e).toBe(5); // Should add new value
    });

    it('should handle array overrides', () => {
      const baseConfig = {
        items: [1, 2, 3],
      };

      const overrideConfig = {
        items: [4, 5],
      };

      const merged = KILTConfigManager['mergeConfig'](baseConfig, overrideConfig);
      expect(merged.items).toEqual([4, 5]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty configuration', () => {
      const emptyManager = new KILTConfigManager({});
      const config = emptyManager.getConfig();
      
      expect(config.network.network).toBe(KILTNetwork.SPIRITNET);
      expect(config.transaction.maxRetries).toBe(3);
    });

    it('should handle null and undefined values', () => {
      const manager = new KILTConfigManager({
        transaction: {
          maxRetries: undefined as any,
          confirmationTimeout: null as any,
        },
      });

      const config = manager.getConfig();
      expect(config.transaction.maxRetries).toBeUndefined();
      expect(config.transaction.confirmationTimeout).toBeNull();
    });

    it('should handle network switching multiple times', () => {
      configManager.setNetwork(KILTNetwork.MAINNET);
      expect(configManager.getCurrentNetwork()).toBe(KILTNetwork.MAINNET);

      configManager.setNetwork(KILTNetwork.SPIRITNET);
      expect(configManager.getCurrentNetwork()).toBe(KILTNetwork.SPIRITNET);

      configManager.setNetwork(KILTNetwork.PEREGRINE);
      expect(configManager.getCurrentNetwork()).toBe(KILTNetwork.PEREGRINE);
    });

    it('should maintain configuration immutability', () => {
      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();
      
      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same content
      
      // Modifying returned config should not affect internal state
      config1.transaction.maxRetries = 999;
      const config3 = configManager.getConfig();
      expect(config3.transaction.maxRetries).toBe(3); // Should be unchanged
    });
  });
});
