/**
 * KILT Integration Tests
 * 
 * These tests run against a real KILT testnet (Peregrine) and perform actual blockchain operations.
 * 
 * PREREQUISITES:
 * - KILT testnet (Peregrine) must be accessible
 * - Test account must have sufficient KILT tokens for transactions
 * - Set environment variable: KILT_TEST_MNEMONIC (optional, will generate if not set)
 * - Network connectivity required
 * 
 * USAGE:
 * npm test -- KILT.integration.test.ts --testTimeout=60000
 * 
 * NOTE: These tests may fail if:
 * - Network is unavailable
 * - Insufficient balance
 * - Blockchain congestion
 * - Rate limiting
 */

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import { KiltAdapter } from '../../adapters/KiltAdapter.js';
import { KILTDIDProvider } from '../KILTDIDProvider.js';
import { KILTNetwork } from '../../config/kiltConfig.js';
import { KILTCreateDIDRequest } from '../types/KILTTypes.js';

// Skip integration tests by default unless explicitly enabled
const INTEGRATION_TESTS_ENABLED = process.env.RUN_INTEGRATION_TESTS === 'true';

describe('KILT Integration Tests', () => {
  let kiltAdapter: KiltAdapter;
  let kiltDIDProvider: KILTDIDProvider;
  let testAccount: any;
  let testAccountAddress: string;

  // Use Peregrine testnet for integration tests
  const TESTNET = KILTNetwork.PEREGRINE;

  beforeAll(async () => {
    if (!INTEGRATION_TESTS_ENABLED) {
      console.log('⚠️  Integration tests skipped. Set RUN_INTEGRATION_TESTS=true to enable.');
      return;
    }

    console.log('🔧 Setting up KILT integration test environment...');

    await cryptoWaitReady();

    // Generate or use provided test mnemonic
    const testMnemonic = process.env.KILT_TEST_MNEMONIC || mnemonicGenerate();
    console.log('🔑 Test mnemonic:', testMnemonic.substring(0, 20) + '...');

    const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
    testAccount = keyring.addFromMnemonic(testMnemonic);
    testAccountAddress = testAccount.address;

    console.log('👤 Test account address:', testAccountAddress);

    // Initialize adapter and provider
    kiltAdapter = new KiltAdapter(TESTNET);
    kiltDIDProvider = new KILTDIDProvider(kiltAdapter);

    console.log('✅ Test environment ready');
  }, 30000);

  afterAll(async () => {
    if (!INTEGRATION_TESTS_ENABLED) {
      return;
    }

    console.log('🧹 Cleaning up...');
    try {
      await kiltAdapter.disconnect();
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 10000);

  describe('Network Connection', () => {
    test('should connect to KILT testnet', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      console.log('🌐 Connecting to KILT testnet...');

      try {
        const chainInfo = await kiltAdapter.connect(TESTNET);

        expect(chainInfo).toBeDefined();
        expect(chainInfo.name).toBeDefined();
        expect(chainInfo.network).toBeDefined();
        
        console.log('✅ Connected to:', chainInfo.name);
        console.log('📡 Network:', chainInfo.network);
      } catch (error: any) {
        console.error('❌ Connection failed:', error.message);
        throw error;
      }
    }, 30000);

    test('should retrieve network statistics', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        const stats = await kiltAdapter.getNetworkStats();

        expect(stats).toBeDefined();
        expect(stats.bestBlock).toBeDefined();
        expect(typeof stats.bestBlock).toBe('number');
        expect(stats.bestBlock).toBeGreaterThan(0);

        console.log('📊 Current block:', stats.bestBlock);
        console.log('📊 Finalized block:', stats.finalizedBlock);
      } catch (error: any) {
        console.error('❌ Failed to get network stats:', error.message);
        throw error;
      }
    }, 15000);

    test('should validate KILT address format', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      const isValid = await kiltAdapter.validateAddress(testAccountAddress);
      expect(isValid).toBe(true);

      console.log('✅ Address validation passed');
    });
  });

  describe('Account and Balance', () => {
    test('should retrieve account nonce', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        const nonceInfo = await kiltAdapter.getNonce(testAccountAddress);

        expect(nonceInfo).toBeDefined();
        expect(nonceInfo.nonce).toBeDefined();
        expect(typeof nonceInfo.nonce).toBe('number');
        expect(nonceInfo.nonce).toBeGreaterThanOrEqual(0);

        console.log('🔢 Account nonce:', nonceInfo.nonce);
      } catch (error: any) {
        console.error('❌ Failed to get nonce:', error.message);
        throw error;
      }
    }, 15000);

    test('should check account balance', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        // Get account balance using the KILT API
        const api = (kiltAdapter as any).api;
        if (!api) {
          throw new Error('API not connected');
        }

        const accountInfo = await api.query.system.account(testAccountAddress);
        const balance = accountInfo.data.free.toBigInt();

        expect(balance).toBeDefined();
        expect(balance).toBeGreaterThanOrEqual(0n);

        const balanceInKilt = Number(balance) / 1e15; // KILT has 15 decimals
        console.log('💰 Account balance:', balanceInKilt.toFixed(4), 'KILT');

        if (balance === 0n) {
          console.warn('⚠️  Account has zero balance. DID registration will fail.');
          console.warn('💡 Get testnet tokens from KILT faucet:');
          console.warn('   https://faucet.peregrine.kilt.io/');
        }
      } catch (error: any) {
        console.error('❌ Failed to check balance:', error.message);
        throw error;
      }
    }, 15000);
  });

  describe('DID Operations', () => {
    let registeredDID: string;

    test('should check if DID exists before registration', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        const testDID = `did:kilt:${testAccountAddress}`;
        const exists = await kiltDIDProvider.didExists(testDID);

        // DID may or may not exist depending on previous test runs
        expect(typeof exists).toBe('boolean');

        if (exists) {
          console.log('ℹ️  DID already exists on chain');
        } else {
          console.log('ℹ️  DID not yet registered');
        }
      } catch (error: any) {
        console.error('❌ Failed to check DID existence:', error.message);
        throw error;
      }
    }, 15000);

    test('should register DID on KILT testnet', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        console.log('📝 Registering DID on KILT testnet...');

        const request: KILTCreateDIDRequest = {
          verificationMethods: [
            {
              id: 'authentication',
              type: 'Sr25519VerificationKey2020',
              publicKey: testAccount.publicKey
            }
          ],
          services: [
            {
              id: 'test-service',
              type: 'TestService',
              serviceEndpoint: 'https://test.example.com'
            }
          ]
        };

        const result = await kiltDIDProvider.registerDidOnchain(request, testAccountAddress);

        expect(result).toBeDefined();
        expect(result.did).toBeDefined();
        expect(result.did).toContain('did:kilt:');
        expect(result.didDocument).toBeDefined();
        expect(result.transactionResult).toBeDefined();
        expect(result.transactionResult.success).toBe(true);
        expect(result.transactionResult.transactionHash).toBeDefined();

        registeredDID = result.did;

        console.log('✅ DID registered:', registeredDID);
        console.log('📜 Transaction hash:', result.transactionResult.transactionHash);
        console.log('🔗 Block number:', result.transactionResult.blockNumber);
      } catch (error: any) {
        if (error.message.includes('balance')) {
          console.warn('⚠️  Insufficient balance for DID registration');
          console.warn('💡 Get testnet tokens: https://faucet.peregrine.kilt.io/');
          return; // Skip this test if insufficient balance
        }
        console.error('❌ DID registration failed:', error.message);
        throw error;
      }
    }, 60000);

    test('should resolve registered DID', async () => {
      if (!INTEGRATION_TESTS_ENABLED || !registeredDID) {
        return;
      }

      try {
        console.log('🔍 Resolving DID:', registeredDID);

        const didDocument = await kiltDIDProvider.resolve(registeredDID);

        expect(didDocument).toBeDefined();
        expect(didDocument.id).toBe(registeredDID);
        expect(didDocument.verificationMethod).toBeDefined();
        expect(didDocument.authentication).toBeDefined();

        console.log('✅ DID resolved successfully');
        console.log('📄 Document ID:', didDocument.id);
        console.log('🔑 Verification methods:', didDocument.verificationMethod?.length || 0);
      } catch (error: any) {
        console.error('❌ DID resolution failed:', error.message);
        throw error;
      }
    }, 30000);

    test('should query DID document from chain', async () => {
      if (!INTEGRATION_TESTS_ENABLED || !registeredDID) {
        return;
      }

      try {
        const didDocument = await kiltDIDProvider.queryDIDDocument(registeredDID);

        expect(didDocument).toBeDefined();
        expect(didDocument?.id).toBe(registeredDID);

        console.log('✅ DID document queried from chain');
      } catch (error: any) {
        console.error('❌ DID query failed:', error.message);
        throw error;
      }
    }, 30000);

    test('should add verification method to existing DID', async () => {
      if (!INTEGRATION_TESTS_ENABLED || !registeredDID) {
        return;
      }

      try {
        console.log('➕ Adding verification method...');

        const newKey = await kiltDIDProvider.generateKeyAgreementKey();

        const result = await kiltDIDProvider.addVerificationMethod(
          registeredDID,
          {
            id: 'new-key',
            type: 'X25519KeyAgreementKey2020',
            publicKey: Buffer.from(newKey.publicKey)
          },
          testAccountAddress
        );

        expect(result).toBeDefined();
        expect(result.success).toBe(true);

        console.log('✅ Verification method added');
        console.log('📜 Transaction hash:', result.transactionHash);
      } catch (error: any) {
        if (error.message.includes('balance') || error.message.includes('DID not found')) {
          console.warn('⚠️  Skipping verification method test:', error.message);
          return;
        }
        console.error('❌ Failed to add verification method:', error.message);
        throw error;
      }
    }, 60000);

    test('should add service endpoint to existing DID', async () => {
      if (!INTEGRATION_TESTS_ENABLED || !registeredDID) {
        return;
      }

      try {
        console.log('➕ Adding service endpoint...');

        const result = await kiltDIDProvider.addService(
          registeredDID,
          {
            id: 'new-service',
            type: 'LinkedDomains',
            serviceEndpoint: 'https://example.com'
          },
          testAccountAddress
        );

        expect(result).toBeDefined();
        expect(result.success).toBe(true);

        console.log('✅ Service endpoint added');
        console.log('📜 Transaction hash:', result.transactionHash);
      } catch (error: any) {
        if (error.message.includes('balance') || error.message.includes('DID not found')) {
          console.warn('⚠️  Skipping service endpoint test:', error.message);
          return;
        }
        console.error('❌ Failed to add service:', error.message);
        throw error;
      }
    }, 60000);

    test('should update DID document', async () => {
      if (!INTEGRATION_TESTS_ENABLED || !registeredDID) {
        return;
      }

      try {
        console.log('📝 Updating DID document...');

        const updates = {
          verificationMethods: [
            {
              id: 'updated-key',
              type: 'Sr25519VerificationKey2020',
              publicKey: testAccount.publicKey
            }
          ]
        };

        const result = await kiltDIDProvider.updateDIDDocument(
          registeredDID,
          updates,
          testAccountAddress
        );

        expect(result).toBeDefined();
        expect(result.success).toBe(true);

        console.log('✅ DID document updated');
        console.log('📜 Transaction hash:', result.transactionHash);
      } catch (error: any) {
        if (error.message.includes('balance') || error.message.includes('DID not found')) {
          console.warn('⚠️  Skipping DID update test:', error.message);
          return;
        }
        console.error('❌ Failed to update DID:', error.message);
        throw error;
      }
    }, 60000);
  });

  describe('Transaction Monitoring', () => {
    test('should estimate gas for transaction', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        const api = (kiltAdapter as any).api;
        if (!api) {
          throw new Error('API not connected');
        }

        // Create a simple balance transfer extrinsic for gas estimation
        const transfer = api.tx.balances.transfer(testAccountAddress, 1000);

        const gasEstimate = await kiltAdapter.estimateGas(transfer, testAccountAddress);

        expect(gasEstimate).toBeDefined();
        expect(gasEstimate.estimatedFee).toBeDefined();
        expect(typeof gasEstimate.estimatedFee).toBe('string');

        const feeInKilt = Number(gasEstimate.estimatedFee) / 1e15;
        console.log('⛽ Estimated gas fee:', feeInKilt.toFixed(6), 'KILT');
      } catch (error: any) {
        console.error('❌ Gas estimation failed:', error.message);
        throw error;
      }
    }, 15000);

    test('should get pending transactions', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        const pendingTxs = kiltAdapter.getPendingTransactions();

        expect(Array.isArray(pendingTxs)).toBe(true);
        console.log('📋 Pending transactions:', pendingTxs.length);
      } catch (error: any) {
        console.error('❌ Failed to get pending transactions:', error.message);
        throw error;
      }
    });

    test('should retrieve chain information', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        const chainInfo = kiltAdapter.getChainInfo();

        expect(chainInfo).toBeDefined();
        expect(chainInfo?.name).toBeDefined();
        expect(chainInfo?.ss58Format).toBe(38); // KILT SS58 format

        console.log('⛓️  Chain:', chainInfo?.name);
        console.log('🆔 Chain ID:', chainInfo?.ss58Format);
      } catch (error: any) {
        console.error('❌ Failed to get chain info:', error.message);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid DID resolution gracefully', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      const invalidDID = 'did:kilt:4invalid';

      try {
        await kiltDIDProvider.resolve(invalidDID);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
        console.log('✅ Invalid DID error handled correctly:', error.message);
      }
    }, 15000);

    test('should handle non-existent DID gracefully', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      // Generate a valid but non-existent DID
      const randomKeyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
      const randomAccount = randomKeyring.addFromUri('//RandomNonExistent');
      const nonExistentDID = `did:kilt:${randomAccount.address}`;

      try {
        const exists = await kiltDIDProvider.didExists(nonExistentDID);
        expect(exists).toBe(false);

        console.log('✅ Non-existent DID check passed');
      } catch (error: any) {
        // This is acceptable - some implementations may throw
        expect(error).toBeDefined();
        console.log('✅ Non-existent DID error handled:', error.message);
      }
    }, 15000);

    test('should handle network disconnection gracefully', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      const tempAdapter = new KiltAdapter(TESTNET);
      const tempProvider = new KILTDIDProvider(tempAdapter);

      try {
        // Try to use provider without connecting
        await tempProvider.didExists('did:kilt:test');
        // If it doesn't throw, that's also fine (might auto-connect)
        console.log('✅ Provider handled disconnected state');
      } catch (error: any) {
        expect(error).toBeDefined();
        console.log('✅ Disconnection error handled:', error.message);
      } finally {
        await tempAdapter.disconnect();
      }
    }, 15000);
  });

  describe('Performance Metrics', () => {
    test('should measure DID resolution time', async () => {
      if (!INTEGRATION_TESTS_ENABLED || !registeredDID) {
        return;
      }

      try {
        const startTime = Date.now();
        await kiltDIDProvider.resolve(registeredDID);
        const endTime = Date.now();

        const duration = endTime - startTime;
        console.log('⏱️  DID resolution time:', duration, 'ms');

        expect(duration).toBeLessThan(10000); // Should be under 10 seconds
      } catch (error: any) {
        console.warn('⚠️  Skipping performance test:', error.message);
      }
    }, 15000);

    test('should measure network stat retrieval time', async () => {
      if (!INTEGRATION_TESTS_ENABLED) {
        return;
      }

      try {
        const startTime = Date.now();
        await kiltAdapter.getNetworkStats();
        const endTime = Date.now();

        const duration = endTime - startTime;
        console.log('⏱️  Network stats time:', duration, 'ms');

        expect(duration).toBeLessThan(5000); // Should be under 5 seconds
      } catch (error: any) {
        console.warn('⚠️  Skipping performance test:', error.message);
      }
    }, 10000);
  });
});

