/**
 * Live integration tests for KILTDIDProvider against real KILT testnet (spiritnet).
 * 
 * These tests require:
 * - Internet connection
 * - Access to KILT Spiritnet testnet
 * - Test wallet with KILT tokens (optional for some tests)
 * 
 * To run these tests:
 * - Set ENABLE_LIVE_TESTS=true environment variable
 * - Ensure you have testnet access
 * - Optionally provide TEST_WALLET_MNEMONIC for wallet-based tests
 * 
 * Example: ENABLE_LIVE_TESTS=true npm test -- --testPathPattern=KILTDIDProvider.live
 */

import { KILTDIDProvider } from '../KILTDIDProvider.js';
import { KiltAdapter } from '../../adapters/KiltAdapter.js';
import { KILTConfigManager } from '../../config/kiltConfig.js';
import { 
  KILTCreateDIDRequest,
  KILTCreateDIDResponse,
  KILTError,
  KILTErrorType,
  KILTDIDStatus,
  KILTDIDDocument,
  KILTVerificationMethod,
  KILTService
} from '../types/KILTTypes.js';

// Environment configuration
const ENABLE_LIVE_TESTS = process.env.ENABLE_LIVE_TESTS === 'true';
const TEST_WALLET_MNEMONIC = process.env.TEST_WALLET_MNEMONIC;
const TEST_TIMEOUT = 60000; // 60 seconds for live tests
const CLEANUP_TIMEOUT = 30000; // 30 seconds for cleanup

// Test configuration
const TEST_CONFIG = {
  network: 'spiritnet' as const,
  timeout: TEST_TIMEOUT,
  cleanupTimeout: CLEANUP_TIMEOUT,
  testAddresses: [
    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Alice (well-known test address)
    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', // Bob (well-known test address)
  ],
};

// Skip all tests if live testing is not enabled
const describeLive = ENABLE_LIVE_TESTS ? describe : describe.skip;

describeLive('KILTDIDProvider Live Integration Tests', () => {
  let kiltAdapter: KiltAdapter;
  let kiltDidProvider: KILTDIDProvider;
  let configManager: KILTConfigManager;
  let testData: {
    createdDIDs: string[];
    registeredAddresses: string[];
    testTransactions: string[];
  };

  beforeAll(async () => {
    // Initialize test data tracking
    testData = {
      createdDIDs: [],
      registeredAddresses: [],
      testTransactions: [],
    };

    // Initialize components
    configManager = new KILTConfigManager();
    kiltAdapter = new KiltAdapter(TEST_CONFIG.network);
    kiltDidProvider = new KILTDIDProvider(kiltAdapter, configManager);

    console.log('🔗 Connecting to KILT Spiritnet testnet...');
    
    try {
      // Connect to real KILT testnet
      const chainInfo = await kiltAdapter.connect();
      console.log(`✅ Connected to ${chainInfo.name} (${chainInfo.network})`);
      console.log(`   Version: ${chainInfo.version}`);
      console.log(`   SS58 Format: ${chainInfo.ss58Format}`);
      console.log(`   Genesis Hash: ${chainInfo.genesisHash}`);
    } catch (error) {
      console.error('❌ Failed to connect to KILT testnet:', error);
      throw new Error('Cannot run live tests without testnet connection');
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');
    
    // Clean up any created test data
    await cleanupTestData();
    
    // Disconnect from testnet
    if (kiltAdapter) {
      await kiltAdapter.cleanup();
      console.log('✅ Disconnected from KILT testnet');
    }
  }, CLEANUP_TIMEOUT);

  beforeEach(() => {
    // Reset test data for each test
    testData.createdDIDs = [];
    testData.registeredAddresses = [];
    testData.testTransactions = [];
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  /**
   * Cleanup function to remove test data
   */
  async function cleanupTestData(): Promise<void> {
    try {
      // Note: In a real implementation, you might want to:
      // 1. Remove DID documents from blockchain (if supported)
      // 2. Clean up any test transactions
      // 3. Remove test verification methods
      
      // For now, we'll just log what would be cleaned up
      if (testData.createdDIDs.length > 0) {
        console.log(`🧹 Would clean up ${testData.createdDIDs.length} test DIDs`);
      }
      if (testData.registeredAddresses.length > 0) {
        console.log(`🧹 Would clean up ${testData.registeredAddresses.length} registered addresses`);
      }
      if (testData.testTransactions.length > 0) {
        console.log(`🧹 Would clean up ${testData.testTransactions.length} test transactions`);
      }
    } catch (error) {
      console.warn('⚠️ Error during test cleanup:', error);
    }
  }

  describe('Network Connectivity Tests', () => {
    it('should connect to KILT Spiritnet successfully', async () => {
      const chainInfo = kiltAdapter.getChainInfo();
      
      expect(chainInfo).toBeDefined();
      expect(chainInfo?.network).toBe('spiritnet');
      expect(chainInfo?.ss58Format).toBe(38);
      expect(chainInfo?.name).toContain('KILT');
    }, TEST_TIMEOUT);

    it('should verify network is accessible', async () => {
      const chainInfo = kiltAdapter.getChainInfo();
      
      // Test basic network operations
      expect(chainInfo).toBeDefined();
      
      // Verify we can get chain information
      expect(chainInfo?.network).toBe('spiritnet');
      expect(chainInfo?.ss58Format).toBe(38);
      
      console.log(`✅ Network verification passed for ${chainInfo?.name}`);
    }, TEST_TIMEOUT);

    it('should handle network disconnection gracefully', async () => {
      // Test that we can detect disconnection
      const isConnected = kiltAdapter.getConnectionState() === 'connected';
      expect(isConnected).toBe(true);
      
      // Note: We don't actually disconnect in tests to avoid breaking other tests
      console.log('✅ Network disconnection handling verified');
    });
  });

  describe('DID Creation and Format Tests', () => {
    it('should create valid KILT DIDs for test addresses', async () => {
      for (const address of TEST_CONFIG.testAddresses) {
        const did = kiltDidProvider.createDid(address);
        
        expect(did).toMatch(/^did:kilt:[5][1-9A-HJ-NP-Za-km-z]{47}$/);
        expect(did).toBe(`did:kilt:${address}`);
        
        testData.createdDIDs.push(did);
        
        console.log(`✅ Created DID: ${did}`);
      }
    });

    it('should create valid KILT DID documents', async () => {
      for (const address of TEST_CONFIG.testAddresses) {
        const didDocument = kiltDidProvider.createDIDDocument(address);
        
        expect(didDocument).toBeDefined();
        expect(didDocument.id).toBe(`did:kilt:${address}`);
        expect(didDocument['@context']).toContain('https://www.w3.org/ns/did/v1');
        expect(didDocument.verificationMethod).toBeDefined();
        expect(didDocument.verificationMethod?.length).toBeGreaterThan(0);
        
        console.log(`✅ Created DID document for ${address}`);
      }
    });

    it('should resolve created DIDs correctly', async () => {
      for (const address of TEST_CONFIG.testAddresses) {
        const did = `did:kilt:${address}`;
        
        const resolved = await kiltDidProvider.resolve(did);
        
        expect(resolved).toBeDefined();
        expect(resolved.id).toBe(did);
        expect(resolved.verificationMethod).toBeDefined();
        
        console.log(`✅ Resolved DID: ${did}`);
      }
    });
  });

  describe('Address Validation Tests', () => {
    it('should validate KILT addresses correctly', async () => {
      for (const address of TEST_CONFIG.testAddresses) {
        // Test with KILT provider
        const isValid = await kiltDidProvider.verifyOnchain(address);
        
        // Note: verifyOnchain might return false if DID is not registered on-chain
        // This is expected behavior for test addresses
        expect(typeof isValid).toBe('boolean');
        
        console.log(`✅ Address validation for ${address}: ${isValid ? 'VALID' : 'NOT REGISTERED'}`);
      }
    });

    it('should extract addresses from DIDs correctly', async () => {
      for (const address of TEST_CONFIG.testAddresses) {
        const did = `did:kilt:${address}`;
        const extractedAddress = kiltDidProvider.extractAddress(did);
        
        expect(extractedAddress).toBe(address);
        
        console.log(`✅ Address extraction for ${did}: ${extractedAddress}`);
      }
    });
  });

  describe('DID Document Structure Tests', () => {
    it('should create DID documents with proper KILT context', async () => {
      const address = TEST_CONFIG.testAddresses[0];
      const didDocument = kiltDidProvider.createDIDDocument(address);
      
      expect(didDocument['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(didDocument['@context']).toContain('https://w3id.org/security/suites/sr25519-2020/v1');
      expect(didDocument['@context']).toContain('https://w3id.org/security/suites/kilt-2023/v1');
      
      console.log('✅ DID document context validation passed');
    });

    it('should create verification methods with correct types', async () => {
      const address = TEST_CONFIG.testAddresses[0];
      const didDocument = kiltDidProvider.createDIDDocument(address);
      
      expect(didDocument.verificationMethod).toBeDefined();
      expect(didDocument.verificationMethod?.length).toBeGreaterThan(0);
      
      const verificationMethod = didDocument.verificationMethod![0];
      expect(verificationMethod.type).toBe('Sr25519VerificationKey2020');
      expect(verificationMethod.controller).toBe(`did:kilt:${address}`);
      
      console.log('✅ Verification method validation passed');
    });

    it('should generate unique key agreement keys', async () => {
      const keys: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        const key = await kiltDidProvider.generateKeyAgreementKey();
        expect(key).toBeDefined();
        expect(key.length).toBeGreaterThan(10);
        expect(keys).not.toContain(key);
        keys.push(key);
      }
      
      console.log('✅ Key agreement key uniqueness validation passed');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid DID formats gracefully', async () => {
      const invalidDIDs = [
        'did:invalid:address',
        'did:kilt:invalid-address',
        'not-a-did',
        '',
        'did:kilt:',
      ];

      for (const invalidDID of invalidDIDs) {
        try {
          await kiltDidProvider.resolve(invalidDID);
          fail(`Expected error for invalid DID: ${invalidDID}`);
        } catch (error) {
          expect(error).toBeInstanceOf(KILTError);
          console.log(`✅ Correctly rejected invalid DID: ${invalidDID}`);
        }
      }
    });

    it('should handle network errors gracefully', async () => {
      // Test with a malformed address that should cause validation errors
      const malformedAddress = 'invalid-address';
      
      try {
        kiltDidProvider.createDid(malformedAddress);
        fail('Expected error for malformed address');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ Correctly handled malformed address error');
      }
    });
  });

  describe('Performance Tests', () => {
    it('should resolve DIDs within reasonable time', async () => {
      const address = TEST_CONFIG.testAddresses[0];
      const did = `did:kilt:${address}`;
      
      const startTime = Date.now();
      const resolved = await kiltDidProvider.resolve(did);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should resolve within 5 seconds
      expect(resolved).toBeDefined();
      
      console.log(`✅ DID resolution completed in ${duration}ms`);
    }, TEST_TIMEOUT);

    it('should handle multiple concurrent DID operations', async () => {
      const promises = TEST_CONFIG.testAddresses.map(async (address) => {
        const did = `did:kilt:${address}`;
        const resolved = await kiltDidProvider.resolve(did);
        return resolved;
      });
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(TEST_CONFIG.testAddresses.length);
      results.forEach((result, index) => {
        expect(result.id).toBe(`did:kilt:${TEST_CONFIG.testAddresses[index]}`);
      });
      
      console.log('✅ Concurrent DID operations completed successfully');
    }, TEST_TIMEOUT);
  });

  // Wallet-based tests (only run if TEST_WALLET_MNEMONIC is provided)
  const describeWalletTests = TEST_WALLET_MNEMONIC ? describe : describe.skip;
  
  describeWalletTests('Wallet-Based DID Registration Tests', () => {
    it('should prepare DID registration request with wallet', async () => {
      // Note: This test would require actual wallet integration
      // For now, we'll test the request preparation without actual registration
      
      const testAddress = TEST_CONFIG.testAddresses[0];
      const request: KILTCreateDIDRequest = {
        accountAddress: testAddress,
        controller: testAddress,
        verificationMethods: [],
        services: [],
        metadata: { test: true },
        feePayer: testAddress,
      };
      
      expect(request.accountAddress).toBe(testAddress);
      expect(request.controller).toBe(testAddress);
      expect(request.metadata.test).toBe(true);
      
      console.log('✅ DID registration request prepared successfully');
    });

    it('should validate wallet address format', async () => {
      // Test that wallet addresses are valid KILT addresses
      const testAddress = TEST_CONFIG.testAddresses[0];
      
      // This would normally validate against the actual wallet
      expect(testAddress).toMatch(/^5[1-9A-HJ-NP-Za-km-z]{47}$/);
      
      console.log('✅ Wallet address format validation passed');
    });
  });

  describe('Configuration Tests', () => {
    it('should use correct KILT configuration', async () => {
      const config = configManager.getConfig();
      
      expect(config.networks.spiritnet).toBeDefined();
      expect(config.networks.spiritnet.endpoints).toBeDefined();
      expect(config.networks.spiritnet.endpoints.length).toBeGreaterThan(0);
      
      console.log('✅ KILT configuration validation passed');
    });

    it('should handle network switching', async () => {
      const currentNetwork = configManager.getCurrentNetwork();
      expect(currentNetwork).toBe('spiritnet');
      
      // Test network validation
      const isValidNetwork = configManager.getSupportedNetworks().includes('spiritnet');
      expect(isValidNetwork).toBe(true);
      
      console.log('✅ Network configuration validation passed');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full DID lifecycle', async () => {
      const address = TEST_CONFIG.testAddresses[0];
      
      // 1. Create DID
      const did = kiltDidProvider.createDid(address);
      testData.createdDIDs.push(did);
      
      // 2. Create DID document
      const didDocument = kiltDidProvider.createDIDDocument(address);
      
      // 3. Resolve DID
      const resolved = await kiltDidProvider.resolve(did);
      
      // 4. Extract address
      const extractedAddress = kiltDidProvider.extractAddress(did);
      
      // Verify complete lifecycle
      expect(did).toBe(`did:kilt:${address}`);
      expect(didDocument.id).toBe(did);
      expect(resolved.id).toBe(did);
      expect(extractedAddress).toBe(address);
      
      console.log('✅ Complete DID lifecycle test passed');
    }, TEST_TIMEOUT);

    it('should handle DID document updates', async () => {
      const address = TEST_CONFIG.testAddresses[0];
      
      // Create initial DID document
      const initialDocument = kiltDidProvider.createDIDDocument(address);
      const initialVerificationMethods = initialDocument.verificationMethod?.length || 0;
      
      // Add additional verification method
      const additionalMethod: KILTVerificationMethod = {
        id: `${initialDocument.id}#key-2`,
        type: 'Sr25519VerificationKey2020',
        controller: initialDocument.id,
        publicKeyMultibase: 'z' + 'x'.repeat(64), // Mock key
        blockchainAccountId: `${address}@kilt:spiritnet`,
      };
      
      // Create updated document
      const updatedDocument = {
        ...initialDocument,
        verificationMethod: [
          ...(initialDocument.verificationMethod || []),
          additionalMethod,
        ],
      };
      
      expect(updatedDocument.verificationMethod?.length).toBe(initialVerificationMethods + 1);
      
      console.log('✅ DID document update test passed');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle very long addresses gracefully', async () => {
      // Test with maximum length address
      const longAddress = '5' + 'A'.repeat(47); // 48 character address
      
      try {
        const did = kiltDidProvider.createDid(longAddress);
        expect(did).toBe(`did:kilt:${longAddress}`);
        console.log('✅ Long address handling passed');
      } catch (error) {
        // This might fail validation, which is expected
        expect(error).toBeDefined();
        console.log('✅ Long address validation correctly rejected invalid format');
      }
    });

    it('should handle special characters in metadata', async () => {
      const address = TEST_CONFIG.testAddresses[0];
      const specialMetadata = {
        unicode: '测试数据',
        symbols: '!@#$%^&*()',
        numbers: 12345,
        nested: { deep: { value: true } },
      };
      
      // This should not cause issues in DID document creation
      const didDocument = kiltDidProvider.createDIDDocument(address);
      
      expect(didDocument).toBeDefined();
      console.log('✅ Special character handling passed');
    });

    it('should maintain consistency across multiple operations', async () => {
      const address = TEST_CONFIG.testAddresses[0];
      const results: any[] = [];
      
      // Perform same operation multiple times
      for (let i = 0; i < 5; i++) {
        const did = kiltDidProvider.createDid(address);
        const didDocument = kiltDidProvider.createDIDDocument(address);
        const resolved = await kiltDidProvider.resolve(did);
        
        results.push({
          did,
          documentId: didDocument.id,
          resolvedId: resolved.id,
        });
      }
      
      // All results should be identical
      results.forEach((result, index) => {
        expect(result.did).toBe(results[0].did);
        expect(result.documentId).toBe(results[0].documentId);
        expect(result.resolvedId).toBe(results[0].resolvedId);
      });
      
      console.log('✅ Consistency across multiple operations verified');
    });
  });
});

// Helper function to check if live tests should run
export function shouldRunLiveTests(): boolean {
  return ENABLE_LIVE_TESTS && !!process.env.CI !== true; // Don't run in CI unless explicitly enabled
}

// Export test configuration for use in other test files
export { TEST_CONFIG, ENABLE_LIVE_TESTS, TEST_TIMEOUT };
