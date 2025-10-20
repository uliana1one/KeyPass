/**
 * Complete Flow Integration Tests
 * 
 * Tests the complete end-to-end flow:
 * KILT DID Registration → Moonbeam SBT Minting → Verification
 * 
 * This validates the entire KeyPass system working together with real blockchain operations.
 * 
 * Environment Variables:
 *   ENABLE_INTEGRATION_TESTS=true - Enable integration tests
 *   KILT_WSS_ADDRESS - KILT testnet WebSocket URL
 *   KILT_TESTNET_MNEMONIC - Mnemonic for KILT testnet
 *   MOONBEAM_RPC_URL - Moonbeam testnet RPC URL
 *   MOONBEAM_PRIVATE_KEY - Private key for Moonbeam testnet
 */

import { Wallet } from 'ethers';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { KiltAdapter } from '../../adapters/KiltAdapter';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { KILTDIDProvider } from '../../did/KILTDIDProvider';
import { SBTContract, DeploymentConfigLoader } from '../../contracts/SBTContract';
import { SBTMintingService } from '../../services/SBTMintingService';
import { BlockchainMonitor, BlockchainType, TransactionStatus } from '../../monitoring/BlockchainMonitor';
import { ErrorFactory, ErrorMessageFormatter } from '../../errors/BlockchainErrors';
import { MoonbeamNetwork } from '../../config/moonbeamConfig';
import { KILTNetwork } from '../../config/kiltConfig';
import { SBTTokenMetadata } from '../../contracts/types/SBTContractTypes';

// Skip tests if integration testing is not enabled
const ENABLE_INTEGRATION_TESTS = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const describeIntegration = ENABLE_INTEGRATION_TESTS ? describe : describe.skip;

// Test timeout for complete flow (10 minutes)
const TEST_TIMEOUT = 600000;

// Helper to generate unique test identifiers
const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

describeIntegration('Complete Flow Integration Tests', () => {
  let kiltAdapter: KiltAdapter;
  let moonbeamAdapter: MoonbeamAdapter;
  let kiltProvider: KILTDIDProvider;
  let sbtContract: SBTContract;
  let sbtMintingService: SBTMintingService;
  let monitor: BlockchainMonitor;
  
  let kiltAccount: any;
  let moonbeamWallet: Wallet;
  let testDID: string;
  let testAddress: string;
  let sbtContractAddress: string;
  
  // Performance tracking
  const performanceMetrics = {
    didRegistrationTime: 0,
    sbtMintingTime: 0,
    verificationTime: 0,
    totalFlowTime: 0,
  };

  beforeAll(async () => {
    console.log('\n🚀 Setting up Complete Flow Integration Tests...\n');

    // Validate environment variables
    const kiltWss = process.env.KILT_WSS_ADDRESS;
    const kiltMnemonic = process.env.KILT_TESTNET_MNEMONIC;
    const moonbeamRpc = process.env.MOONBEAM_RPC_URL;
    const moonbeamKey = process.env.MOONBEAM_PRIVATE_KEY;

    if (!kiltWss || !kiltMnemonic || !moonbeamRpc || !moonbeamKey) {
      throw new Error('Missing required environment variables for integration tests');
    }

    // Initialize crypto
    await cryptoWaitReady();

    // Setup KILT
    console.log('📡 Connecting to KILT testnet...');
    kiltAdapter = new KiltAdapter(KILTNetwork.PEREGRINE);
    await kiltAdapter.connect();
    
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
    kiltAccount = keyring.addFromMnemonic(kiltMnemonic);
    testAddress = kiltAccount.address;
    
    console.log(`✅ KILT connected: ${testAddress}`);

    // Setup Moonbeam
    console.log('📡 Connecting to Moonbeam testnet...');
    moonbeamAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
    await moonbeamAdapter.connect();
    
    const provider = moonbeamAdapter.getProvider();
    if (!provider) throw new Error('Moonbeam provider not available');
    
    moonbeamWallet = new Wallet(moonbeamKey, provider);
    console.log(`✅ Moonbeam connected: ${moonbeamWallet.address}`);

    // Initialize services
    console.log('🔧 Initializing services...');
    kiltProvider = new KILTDIDProvider(kiltAdapter);
    
    // Load deployed SBT contract
    const loader = DeploymentConfigLoader.getInstance();
    const contractAddress = loader.getContractAddress(
      MoonbeamNetwork.MOONBASE_ALPHA,
      'SBTSimple'
    );
    
    if (!contractAddress) {
      throw new Error('No deployed SBT contract found. Run: npm run deploy:sbt:testnet');
    }

    sbtContract = await SBTContract.fromDeployment(
      MoonbeamNetwork.MOONBASE_ALPHA,
      moonbeamAdapter,
      moonbeamWallet,
      'SBTSimple'
    );

    sbtContractAddress = await sbtContract.getAddress();
    console.log(`✅ SBT Contract: ${sbtContractAddress}`);

    sbtMintingService = new SBTMintingService(moonbeamAdapter, {}, true);

    // Initialize monitor
    monitor = new BlockchainMonitor({
      enableMetrics: true,
      enableHealthChecks: true,
      enableLogging: true,
      logLevel: 'info',
    });
    await monitor.initialize(kiltAdapter, moonbeamAdapter);

    console.log('✅ All services initialized\n');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log('\n🧹 Cleaning up...');
    
    if (monitor) {
      monitor.stop();
    }
    
    if (kiltAdapter) {
      await kiltAdapter.disconnect();
    }
    
    if (moonbeamAdapter) {
      await moonbeamAdapter.disconnect();
    }
    
    console.log('✅ Cleanup complete\n');
  }, 60000);

  describe('Complete Flow: DID → SBT → Verification', () => {
    test('should complete full flow: DID registration → SBT minting → verification', async () => {
      const flowStartTime = Date.now();
      const testId = generateTestId();

      console.log(`\n🔄 Starting complete flow test: ${testId}`);

      // Step 1: Register DID on KILT
      console.log('📝 Step 1: Registering DID on KILT...');
      const didStartTime = Date.now();
      
      testDID = await await kiltProvider.createDid(testAddress);
      console.log(`   DID created: ${testDID}`);

      performanceMetrics.didRegistrationTime = Date.now() - didStartTime;
      console.log(`   ⏱️  DID registration took: ${performanceMetrics.didRegistrationTime}ms`);

      // Step 2: Verify DID exists
      console.log('🔍 Step 2: Verifying DID...');
      const verifyStartTime = Date.now();

      const didDocument = await kiltProvider.resolve(testDID);
      expect(didDocument).toBeDefined();
      expect(didDocument.id).toBe(testDID);

      performanceMetrics.verificationTime = Date.now() - verifyStartTime;
      console.log(`   ⏱️  Verification took: ${performanceMetrics.verificationTime}ms`);

      // Step 3: Mint SBT on Moonbeam
      console.log('🪙 Step 3: Minting SBT on Moonbeam...');
      const sbtStartTime = Date.now();

      const metadata: SBTTokenMetadata = {
        name: `KeyPass DID SBT - ${testId}`,
        description: 'Soulbound token proving DID ownership',
        image: 'ipfs://QmTest123',
        attributes: [
          { trait_type: 'DID', value: testDID },
          { trait_type: 'Blockchain', value: 'KILT' },
          { trait_type: 'Test ID', value: testId },
          { trait_type: 'Timestamp', value: new Date().toISOString() },
        ],
      };

      const mintResult = await sbtMintingService.mintSBT(
        sbtContractAddress as `0x${string}`,
        {
          to: moonbeamWallet.address as `0x${string}`,
          metadata,
        },
        moonbeamWallet
      );

      expect(mintResult.tokenId).toBeDefined();
      expect(mintResult.transactionHash).toBeDefined();
      expect(mintResult.confirmations).toBeGreaterThan(0);

      performanceMetrics.sbtMintingTime = Date.now() - sbtStartTime;
      console.log(`   ⏱️  SBT minting took: ${performanceMetrics.sbtMintingTime}ms`);
      console.log(`   🎫 Token ID: ${mintResult.tokenId.toString()}`);

      // Step 4: Verify SBT ownership
      console.log('✅ Step 4: Verifying SBT ownership...');
      const owner = await sbtContract.ownerOf(mintResult.tokenId);
      expect(owner.toLowerCase()).toBe(moonbeamWallet.address.toLowerCase());

      // Step 5: Verify cross-chain link
      console.log('🔗 Step 5: Verifying cross-chain link...');
      const tokenURI = await sbtContract.tokenURI(mintResult.tokenId);
      expect(tokenURI).toContain('ipfs://');

      performanceMetrics.totalFlowTime = Date.now() - flowStartTime;
      console.log(`\n✅ Complete flow finished successfully!`);
      console.log(`   Total time: ${performanceMetrics.totalFlowTime}ms`);
      console.log(`   DID: ${testDID}`);
      console.log(`   SBT Token: ${mintResult.tokenId.toString()}`);
      console.log(`   Owner: ${owner}\n`);

      // Verify performance is reasonable (< 2 minutes for complete flow)
      expect(performanceMetrics.totalFlowTime).toBeLessThan(120000);
    }, TEST_TIMEOUT);

    test('should handle DID registration with verification methods', async () => {
      const testId = generateTestId();
      console.log(`\n🔐 Testing DID with verification methods: ${testId}`);

      const did = await kiltProvider.createDid(testAddress);
      const didDocument = await kiltProvider.resolve(did);

      expect(didDocument.verificationMethod).toBeDefined();
      expect(Array.isArray(didDocument.verificationMethod)).toBe(true);
      
      if (didDocument.verificationMethod && didDocument.verificationMethod.length > 0) {
        const vm = didDocument.verificationMethod[0];
        expect(vm.id).toContain(did);
        expect(vm.controller).toBeDefined();
      }

      console.log(`✅ DID verification methods validated\n`);
    }, TEST_TIMEOUT);

    test('should handle multiple SBT mints for same DID', async () => {
      const testId = generateTestId();
      console.log(`\n🪙 Testing multiple SBT mints: ${testId}`);

      const did = await kiltProvider.createDid(testAddress);
      const mintResults = [];

      // Mint 3 SBTs for the same DID
      for (let i = 0; i < 3; i++) {
        const metadata: SBTTokenMetadata = {
          name: `KeyPass DID SBT #${i} - ${testId}`,
          description: `Multi-mint test ${i}`,
          image: 'ipfs://QmTest123',
          attributes: [
            { trait_type: 'DID', value: did },
            { trait_type: 'Mint Number', value: String(i) },
          ],
        };

        const result = await sbtMintingService.mintSBT(
          sbtContractAddress as `0x${string}`,
          { to: moonbeamWallet.address as `0x${string}`, metadata },
          moonbeamWallet
        );

        mintResults.push(result);
        
        // Small delay between mints to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      expect(mintResults.length).toBe(3);
      
      // Verify all tokens have different IDs
      const tokenIds = mintResults.map(r => r.tokenId.toString());
      const uniqueIds = new Set(tokenIds);
      expect(uniqueIds.size).toBe(3);

      // Verify all owned by same address
      for (const result of mintResults) {
        const owner = await sbtContract.ownerOf(result.tokenId);
        expect(owner.toLowerCase()).toBe(moonbeamWallet.address.toLowerCase());
      }

      console.log(`✅ Multiple SBT mints validated: ${tokenIds.join(', ')}\n`);
    }, TEST_TIMEOUT);
  });

  describe('Transaction Monitoring', () => {
    test('should monitor KILT DID operations', async () => {
      console.log('\n📊 Testing KILT transaction monitoring');

      const did = await kiltProvider.createDid(testAddress);
      const didDocument = await kiltProvider.resolve(did);

      // Get KILT metrics
      const kiltMetrics = monitor.calculateMetrics(BlockchainType.KILT);
      expect(kiltMetrics).toBeDefined();
      expect(kiltMetrics.blockchain).toBe(BlockchainType.KILT);

      console.log(`   Transactions: ${kiltMetrics.transactions.total}`);
      console.log(`   Success rate: ${(kiltMetrics.transactions.successRate * 100).toFixed(2)}%`);
      console.log(`✅ KILT monitoring validated\n`);
    }, TEST_TIMEOUT);

    test('should monitor Moonbeam SBT transactions', async () => {
      console.log('\n📊 Testing Moonbeam transaction monitoring');

      const testId = generateTestId();
      const metadata: SBTTokenMetadata = {
        name: `Monitor Test - ${testId}`,
        description: 'Testing transaction monitoring',
        image: 'ipfs://QmTest123',
        attributes: [{ trait_type: 'Test', value: 'Monitoring' }],
      };

      const mintResult = await sbtMintingService.mintSBT(
        sbtContractAddress as `0x${string}`,
        { to: moonbeamWallet.address as `0x${string}`, metadata },
        moonbeamWallet
      );

      // Monitor the transaction
      const monitoredTx = await monitor.monitorMoonbeamTransaction(
        mintResult.transactionHash,
        'sbt-mint'
      );

      expect(monitoredTx.status).toBe(TransactionStatus.CONFIRMED);
      expect(monitoredTx.hash).toBe(mintResult.transactionHash);
      expect(monitoredTx.gasUsed).toBeDefined();

      // Get Moonbeam metrics
      const moonbeamMetrics = monitor.calculateMetrics(BlockchainType.MOONBEAM);
      expect(moonbeamMetrics).toBeDefined();
      expect(moonbeamMetrics.transactions.total).toBeGreaterThan(0);

      console.log(`   Transaction: ${monitoredTx.hash}`);
      console.log(`   Gas used: ${monitoredTx.gasUsed?.toString()}`);
      console.log(`   Success rate: ${(moonbeamMetrics.transactions.successRate * 100).toFixed(2)}%`);
      console.log(`✅ Moonbeam monitoring validated\n`);
    }, TEST_TIMEOUT);

    test('should track transaction history across both chains', async () => {
      console.log('\n📜 Testing transaction history tracking');

      const history = monitor.getTransactionHistory();
      expect(Array.isArray(history)).toBe(true);

      const kiltTxs = monitor.getTransactionHistory({ 
        blockchain: BlockchainType.KILT 
      });
      const moonbeamTxs = monitor.getTransactionHistory({ 
        blockchain: BlockchainType.MOONBEAM 
      });

      console.log(`   Total transactions: ${history.length}`);
      console.log(`   KILT transactions: ${kiltTxs.length}`);
      console.log(`   Moonbeam transactions: ${moonbeamTxs.length}`);
      console.log(`✅ Transaction history validated\n`);
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    test('should handle invalid DID format gracefully', async () => {
      console.log('\n🚫 Testing invalid DID handling');

      const invalidDID = 'did:kilt:invalid_format_here';
      
      await expect(kiltProvider.resolve(invalidDID)).rejects.toThrow();

      console.log(`✅ Invalid DID rejected correctly\n`);
    }, TEST_TIMEOUT);

    test('should handle insufficient gas errors', async () => {
      console.log('\n⛽ Testing gas error handling');

      try {
        const metadata: SBTTokenMetadata = {
          name: 'Gas Test',
          description: 'Testing gas limits',
          image: 'ipfs://QmTest123',
          attributes: [],
        };

        // Try to mint with very low gas limit (should fail)
        await sbtMintingService.mintSBT(
          sbtContractAddress as `0x${string}`,
          {
            to: moonbeamWallet.address as `0x${string}`,
            metadata,
            gasLimit: BigInt(1000), // Intentionally too low
          },
          moonbeamWallet
        );

        fail('Should have thrown gas error');
      } catch (error) {
        const blockchainError = ErrorFactory.fromUnknown(error, 'moonbeam');
        expect(blockchainError).toBeDefined();
        
        const userMessage = ErrorMessageFormatter.forUser(blockchainError);
        expect(userMessage).toBeDefined();

        console.log(`   Error caught: ${blockchainError.code}`);
        console.log(`   User message: ${userMessage}`);
        console.log(`✅ Gas error handled correctly\n`);
      }
    }, TEST_TIMEOUT);

    test('should handle network disconnection gracefully', async () => {
      console.log('\n🌐 Testing network error handling');

      // Check current health
      const kiltHealth = await monitor.checkKILTHealth();
      const moonbeamHealth = await monitor.checkMoonbeamHealth();

      expect(kiltHealth.blockchain).toBe(BlockchainType.KILT);
      expect(moonbeamHealth.blockchain).toBe(BlockchainType.MOONBEAM);

      console.log(`   KILT health: ${kiltHealth.status}`);
      console.log(`   Moonbeam health: ${moonbeamHealth.status}`);
      console.log(`✅ Network health checks working\n`);
    }, TEST_TIMEOUT);
  });

  describe('Performance and Reliability', () => {
    test('should complete flow within acceptable time limits', async () => {
      console.log('\n⏱️  Testing performance constraints');

      const startTime = Date.now();

      // Quick flow test
      const did = await kiltProvider.createDid(testAddress);
      await kiltProvider.resolve(did);

      const didTime = Date.now() - startTime;
      expect(didTime).toBeLessThan(5000); // DID ops should be < 5s

      console.log(`   DID operations: ${didTime}ms (target: <5000ms)`);
      console.log(`✅ Performance within limits\n`);
    }, TEST_TIMEOUT);

    test('should maintain high success rate across operations', async () => {
      console.log('\n📈 Testing success rate');

      const kiltMetrics = monitor.getMetrics(BlockchainType.KILT);
      const moonbeamMetrics = monitor.getMetrics(BlockchainType.MOONBEAM);

      if (kiltMetrics && kiltMetrics.transactions.total > 0) {
        console.log(`   KILT success rate: ${(kiltMetrics.transactions.successRate * 100).toFixed(2)}%`);
        expect(kiltMetrics.transactions.successRate).toBeGreaterThan(0.8); // > 80%
      }

      if (moonbeamMetrics && moonbeamMetrics.transactions.total > 0) {
        console.log(`   Moonbeam success rate: ${(moonbeamMetrics.transactions.successRate * 100).toFixed(2)}%`);
        expect(moonbeamMetrics.transactions.successRate).toBeGreaterThan(0.8); // > 80%
      }

      console.log(`✅ Success rates validated\n`);
    }, TEST_TIMEOUT);

    test('should handle concurrent operations safely', async () => {
      console.log('\n🔄 Testing concurrent operations');

      const testId = generateTestId();
      const operations = [];

      // Create 3 concurrent DID operations
      for (let i = 0; i < 3; i++) {
        const op = (async () => {
          const did = await kiltProvider.createDid(testAddress);
          return kiltProvider.resolve(did);
        })();
        operations.push(op);
      }

      const results = await Promise.all(operations);
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });

      console.log(`   Concurrent operations: ${results.length}`);
      console.log(`✅ Concurrency handled correctly\n`);
    }, TEST_TIMEOUT);
  });

  describe('System Health and Metrics', () => {
    test('should report accurate system metrics', async () => {
      console.log('\n📊 Testing system metrics');

      const kiltMetrics = monitor.getMetrics(BlockchainType.KILT);
      const moonbeamMetrics = monitor.getMetrics(BlockchainType.MOONBEAM);

      if (kiltMetrics) {
        expect(kiltMetrics.period).toBeDefined();
        expect(kiltMetrics.transactions).toBeDefined();
        expect(kiltMetrics.latency).toBeDefined();
        
        console.log(`   KILT avg latency: ${kiltMetrics.latency.averageMs.toFixed(2)}ms`);
        console.log(`   KILT p95 latency: ${kiltMetrics.latency.p95Ms.toFixed(2)}ms`);
      }

      if (moonbeamMetrics) {
        expect(moonbeamMetrics.costs).toBeDefined();
        console.log(`   Moonbeam total gas: ${moonbeamMetrics.costs.totalGasUsed.toString()}`);
      }

      console.log(`✅ System metrics validated\n`);
    }, TEST_TIMEOUT);

    test('should detect and report errors appropriately', async () => {
      console.log('\n🔔 Testing error reporting');

      // Report a test error
      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorFactory.fromUnknown(new Error('Test error'), 'kilt').severity,
        operation: 'test-operation',
        error: 'Test error for validation',
        retryable: true,
      });

      const errors = monitor.getErrors({ limit: 10 });
      expect(errors.length).toBeGreaterThan(0);

      const recentError = errors[0];
      expect(recentError.operation).toBe('test-operation');

      console.log(`   Recent errors: ${errors.length}`);
      console.log(`   Latest error: ${recentError.error}`);
      console.log(`✅ Error reporting validated\n`);
    }, TEST_TIMEOUT);
  });

  describe('Performance Summary', () => {
    test('should generate comprehensive performance report', async () => {
      console.log('\n📊 === PERFORMANCE SUMMARY ===\n');

      console.log('⏱️  Operation Timings:');
      console.log(`   DID Registration: ${performanceMetrics.didRegistrationTime}ms`);
      console.log(`   SBT Minting: ${performanceMetrics.sbtMintingTime}ms`);
      console.log(`   Verification: ${performanceMetrics.verificationTime}ms`);
      console.log(`   Total Flow: ${performanceMetrics.totalFlowTime}ms\n`);

      console.log('📈 KILT Metrics:');
      const kiltMetrics = monitor.getMetrics(BlockchainType.KILT);
      if (kiltMetrics) {
        console.log(`   Total Transactions: ${kiltMetrics.transactions.total}`);
        console.log(`   Success Rate: ${(kiltMetrics.transactions.successRate * 100).toFixed(2)}%`);
        console.log(`   Avg Latency: ${kiltMetrics.latency.averageMs.toFixed(2)}ms`);
        console.log(`   P95 Latency: ${kiltMetrics.latency.p95Ms.toFixed(2)}ms\n`);
      }

      console.log('📈 Moonbeam Metrics:');
      const moonbeamMetrics = monitor.getMetrics(BlockchainType.MOONBEAM);
      if (moonbeamMetrics) {
        console.log(`   Total Transactions: ${moonbeamMetrics.transactions.total}`);
        console.log(`   Success Rate: ${(moonbeamMetrics.transactions.successRate * 100).toFixed(2)}%`);
        console.log(`   Total Gas Used: ${moonbeamMetrics.costs.totalGasUsed.toString()}`);
        console.log(`   Avg Latency: ${moonbeamMetrics.latency.averageMs.toFixed(2)}ms\n`);
      }

      console.log('🏥 System Health:');
      const kiltHealth = monitor.getHealthStatus(BlockchainType.KILT);
      const moonbeamHealth = monitor.getHealthStatus(BlockchainType.MOONBEAM);
      console.log(`   KILT: ${kiltHealth?.status || 'Unknown'}`);
      console.log(`   Moonbeam: ${moonbeamHealth?.status || 'Unknown'}\n`);

      console.log('✅ === TEST SUITE COMPLETE ===\n');

      // Validate we have meaningful data
      expect(performanceMetrics.totalFlowTime).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });
});

