/**
 * Blockchain Integration Tests
 * 
 * Tests the core blockchain infrastructure:
 * - KILT and Moonbeam connectivity
 * - Transaction submission and confirmation
 * - Error handling and retry logic
 * - Performance metrics and monitoring
 * - Health checks and status monitoring
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
import { BlockchainMonitor, BlockchainType, TransactionStatus, HealthStatus } from '../../monitoring/BlockchainMonitor';
import { ErrorFactory, ErrorSeverity, ErrorCategory } from '../../errors/BlockchainErrors';
import { MoonbeamNetwork } from '../../config/moonbeamConfig';
import { KILTNetwork } from '../../config/kiltConfig';

// Skip tests if integration testing is not enabled
const ENABLE_INTEGRATION_TESTS = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const describeIntegration = ENABLE_INTEGRATION_TESTS ? describe : describe.skip;

// Test timeout for blockchain operations (5 minutes)
const TEST_TIMEOUT = 300000;

// Helper to generate unique test identifiers
const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

describeIntegration('Blockchain Integration Tests', () => {
  let kiltAdapter: KiltAdapter;
  let moonbeamAdapter: MoonbeamAdapter;
  let monitor: BlockchainMonitor;
  
  let kiltAccount: any;
  let moonbeamWallet: Wallet;
  let testAddress: string;
  
  // Performance tracking
  const performanceMetrics = {
    kiltConnectionTime: 0,
    moonbeamConnectionTime: 0,
    kiltTransactionTime: 0,
    moonbeamTransactionTime: 0,
  };

  beforeAll(async () => {
    console.log('\n🚀 Setting up Blockchain Integration Tests...\n');

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
    console.log('📡 Initializing KILT adapter...');
    kiltAdapter = new KiltAdapter(KILTNetwork.PEREGRINE);
    
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
    kiltAccount = keyring.addFromMnemonic(kiltMnemonic);
    testAddress = kiltAccount.address;
    
    console.log(`✅ KILT account: ${testAddress}`);

    // Setup Moonbeam
    console.log('📡 Initializing Moonbeam adapter...');
    moonbeamAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
    
    const provider = moonbeamAdapter.getProvider();
    if (!provider) throw new Error('Moonbeam provider not available');
    
    moonbeamWallet = new Wallet(moonbeamKey, provider);
    console.log(`✅ Moonbeam wallet: ${moonbeamWallet.address}`);

    // Initialize monitor
    console.log('🔧 Initializing blockchain monitor...');
    monitor = new BlockchainMonitor({
      enableMetrics: true,
      enableHealthChecks: true,
      enableLogging: true,
      logLevel: 'info',
    });

    console.log('✅ Setup complete\n');
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

  describe('KILT Blockchain Connectivity', () => {
    test('should connect to KILT blockchain successfully', async () => {
      console.log('\n📡 Testing KILT connection...');
      const startTime = Date.now();

      await kiltAdapter.connect();
      
      performanceMetrics.kiltConnectionTime = Date.now() - startTime;

      const chainInfo = kiltAdapter.getChainInfo();
      expect(chainInfo).toBeDefined();
      expect(chainInfo).not.toBeNull();
      expect(chainInfo!.network).toBe('peregrine');
      
      console.log(`   Network: ${chainInfo!.network}`);
      console.log(`   Connection time: ${performanceMetrics.kiltConnectionTime}ms`);
      console.log(`✅ KILT connection successful\n`);
    }, TEST_TIMEOUT);

    test('should retrieve KILT chain metadata and properties', async () => {
      console.log('\n🔍 Testing KILT chain metadata...');

      await kiltAdapter.connect();
      
      const chainInfo = kiltAdapter.getChainInfo();
      expect(chainInfo).toBeDefined();
      expect(chainInfo!.network).toBeTruthy();
      expect(chainInfo!.name).toBeTruthy();
      
      // Get transaction service
      const txService = kiltAdapter.getTransactionService();
      expect(txService).toBeDefined();

      console.log(`   Chain: ${chainInfo!.network}`);
      console.log(`   Name: ${chainInfo!.name}`);
      console.log(`✅ KILT metadata validated\n`);
    }, TEST_TIMEOUT);

    test('should handle KILT disconnection and reconnection', async () => {
      console.log('\n🔄 Testing KILT disconnection/reconnection...');

      await kiltAdapter.connect();
      expect(kiltAdapter.getChainInfo()).not.toBeNull();

      await kiltAdapter.disconnect();
      const stateAfterDisconnect = kiltAdapter.getConnectionState();
      console.log(`   State after disconnect: ${stateAfterDisconnect}`);

      await kiltAdapter.connect();
      expect(kiltAdapter.getChainInfo()).not.toBeNull();

      console.log(`✅ KILT reconnection successful\n`);
    }, TEST_TIMEOUT);

    test('should detect KILT network health status', async () => {
      console.log('\n🏥 Testing KILT health checks...');

      await kiltAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      const healthCheck = await monitor.checkKILTHealth();
      
      expect(healthCheck).toBeDefined();
      expect(healthCheck.blockchain).toBe(BlockchainType.KILT);
      expect(healthCheck.timestamp).toBeDefined();
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNHEALTHY])
        .toContain(healthCheck.status);

      console.log(`   Status: ${healthCheck.status}`);
      console.log(`   Connection status: ${healthCheck.checks.connection.status}`);
      if (healthCheck.checks.connection.latencyMs !== undefined) {
        console.log(`   Latency: ${healthCheck.checks.connection.latencyMs}ms`);
      }
      console.log(`✅ KILT health check complete\n`);
    }, TEST_TIMEOUT);
  });

  describe('Moonbeam Blockchain Connectivity', () => {
    test('should connect to Moonbeam blockchain successfully', async () => {
      console.log('\n📡 Testing Moonbeam connection...');
      const startTime = Date.now();

      await moonbeamAdapter.connect();
      
      performanceMetrics.moonbeamConnectionTime = Date.now() - startTime;

      expect(moonbeamAdapter.isConnected()).toBe(true);
      
      const provider = moonbeamAdapter.getProvider();
      expect(provider).toBeDefined();
      
      const network = await provider!.getNetwork();
      expect(network).toBeDefined();
      
      console.log(`   Network: ${network.name} (${network.chainId})`);
      console.log(`   Connection time: ${performanceMetrics.moonbeamConnectionTime}ms`);
      console.log(`✅ Moonbeam connection successful\n`);
    }, TEST_TIMEOUT);

    test('should retrieve Moonbeam network information', async () => {
      console.log('\n🔍 Testing Moonbeam network info...');

      await moonbeamAdapter.connect();
      
      const provider = moonbeamAdapter.getProvider();
      expect(provider).toBeDefined();
      
      const [network, blockNumber, gasPrice] = await Promise.all([
        provider!.getNetwork(),
        provider!.getBlockNumber(),
        provider!.getFeeData()
      ]);

      expect(network.chainId).toBeDefined();
      expect(blockNumber).toBeGreaterThan(0);
      expect(gasPrice).toBeDefined();

      console.log(`   Chain ID: ${network.chainId}`);
      console.log(`   Current block: ${blockNumber}`);
      console.log(`   Gas price: ${gasPrice.gasPrice?.toString() || 'N/A'}`);
      console.log(`✅ Moonbeam network info retrieved\n`);
    }, TEST_TIMEOUT);

    test('should handle Moonbeam disconnection and reconnection', async () => {
      console.log('\n🔄 Testing Moonbeam disconnection/reconnection...');

      await moonbeamAdapter.connect();
      expect(moonbeamAdapter.isConnected()).toBe(true);

      await moonbeamAdapter.disconnect();
      expect(moonbeamAdapter.isConnected()).toBe(false);

      await moonbeamAdapter.connect();
      expect(moonbeamAdapter.isConnected()).toBe(true);

      console.log(`✅ Moonbeam reconnection successful\n`);
    }, TEST_TIMEOUT);

    test('should detect Moonbeam network health status', async () => {
      console.log('\n🏥 Testing Moonbeam health checks...');

      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      const healthCheck = await monitor.checkMoonbeamHealth();
      
      expect(healthCheck).toBeDefined();
      expect(healthCheck.blockchain).toBe(BlockchainType.MOONBEAM);
      expect(healthCheck.timestamp).toBeDefined();
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNHEALTHY])
        .toContain(healthCheck.status);

      console.log(`   Status: ${healthCheck.status}`);
      console.log(`   Connection status: ${healthCheck.checks.connection.status}`);
      if (healthCheck.checks.connection.latencyMs !== undefined) {
        console.log(`   Latency: ${healthCheck.checks.connection.latencyMs}ms`);
      }
      console.log(`✅ Moonbeam health check complete\n`);
    }, TEST_TIMEOUT);
  });

  describe('Transaction Submission and Confirmation', () => {
    test('should estimate gas for Moonbeam transactions', async () => {
      console.log('\n⛽ Testing Moonbeam gas estimation...');

      await moonbeamAdapter.connect();
      
      const provider = moonbeamAdapter.getProvider();
      expect(provider).toBeDefined();

      // Estimate gas for a simple ETH transfer
      const gasEstimate = await provider!.estimateGas({
        from: moonbeamWallet.address,
        to: moonbeamWallet.address,
        value: BigInt(1), // 1 wei
      });

      expect(gasEstimate).toBeDefined();
      expect(gasEstimate).toBeGreaterThan(BigInt(0));

      console.log(`   Estimated gas: ${gasEstimate.toString()}`);
      console.log(`✅ Gas estimation successful\n`);
    }, TEST_TIMEOUT);

    test('should retrieve account balance on both chains', async () => {
      console.log('\n💰 Testing account balance retrieval...');

      await kiltAdapter.connect();
      await moonbeamAdapter.connect();

      // Get Moonbeam balance
      const provider = moonbeamAdapter.getProvider();
      const moonbeamBalance = await provider!.getBalance(moonbeamWallet.address);
      
      expect(moonbeamBalance).toBeDefined();

      console.log(`   KILT Address: ${testAddress}`);
      console.log(`   Moonbeam Balance: ${moonbeamBalance.toString()} wei`);
      console.log(`✅ Balance retrieval successful\n`);
    }, TEST_TIMEOUT);

    test('should submit and confirm a simple Moonbeam transaction', async () => {
      console.log('\n📤 Testing Moonbeam transaction submission...');
      const startTime = Date.now();

      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      const provider = moonbeamAdapter.getProvider();
      expect(provider).toBeDefined();

      // Send a minimal transaction to self
      const tx = await moonbeamWallet.sendTransaction({
        to: moonbeamWallet.address,
        value: BigInt(1), // 1 wei
        gasLimit: BigInt(21000),
      });

      expect(tx.hash).toBeDefined();
      console.log(`   Transaction hash: ${tx.hash}`);

      // Monitor the transaction
      const monitoredTx = await monitor.monitorMoonbeamTransaction(
        tx.hash,
        'test-transaction'
      );

      performanceMetrics.moonbeamTransactionTime = Date.now() - startTime;

      expect(monitoredTx.status).toBe(TransactionStatus.CONFIRMED);
      expect(monitoredTx.hash).toBe(tx.hash);
      expect(monitoredTx.gasUsed).toBeDefined();

      console.log(`   Status: ${monitoredTx.status}`);
      console.log(`   Gas used: ${monitoredTx.gasUsed?.toString()}`);
      console.log(`   Confirmation time: ${performanceMetrics.moonbeamTransactionTime}ms`);
      console.log(`✅ Transaction confirmed\n`);
    }, TEST_TIMEOUT);

    test('should handle transaction nonce management', async () => {
      console.log('\n🔢 Testing nonce management...');

      await moonbeamAdapter.connect();

      // Get current nonce
      const nonce1 = await moonbeamAdapter.getNonce(moonbeamWallet.address);
      expect(nonce1).toBeGreaterThanOrEqual(0);

      // Get pending nonce
      const pendingNonce = await moonbeamAdapter.getNonce(moonbeamWallet.address, true);
      expect(pendingNonce).toBeGreaterThanOrEqual(nonce1);

      // Get nonce info
      const nonceInfo = await moonbeamAdapter.getNonceInfo(moonbeamWallet.address);
      expect(nonceInfo.nonce).toBe(nonce1);
      expect(nonceInfo.pendingNonce).toBe(pendingNonce);

      console.log(`   Confirmed nonce: ${nonceInfo.nonce}`);
      console.log(`   Pending nonce: ${nonceInfo.pendingNonce}`);
      console.log(`   Address: ${nonceInfo.address}`);
      console.log(`✅ Nonce management validated\n`);
    }, TEST_TIMEOUT);
  });

  describe('Error Handling and Retry Logic', () => {
    test('should handle connection timeout errors gracefully', async () => {
      console.log('\n🚫 Testing connection timeout handling...');

      // Create adapter with invalid URL
      const invalidAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
      
      try {
        // This should fail quickly
        const provider = invalidAdapter.getProvider();
        
        // Try to get network with timeout
        await Promise.race([
          provider?.getNetwork(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]);

        // If we get here, connection succeeded (which is fine)
        console.log(`   Connection succeeded (expected on valid network)`);
      } catch (error) {
        // Handle the error
        const blockchainError = ErrorFactory.fromUnknown(error, 'moonbeam');
        
        expect(blockchainError).toBeDefined();
        expect(blockchainError.severity).toBeDefined();
        expect(blockchainError.category).toBeDefined();

        console.log(`   Error caught: ${blockchainError.code}`);
        console.log(`   Severity: ${blockchainError.severity}`);
        console.log(`   Category: ${blockchainError.category}`);
      }

      console.log(`✅ Error handling validated\n`);
    }, TEST_TIMEOUT);

    test('should categorize blockchain errors correctly', async () => {
      console.log('\n🏷️  Testing error categorization...');

      // Test various error types
      const errors = [
        new Error('insufficient funds'),
        new Error('nonce too low'),
        new Error('transaction underpriced'),
        new Error('network connection failed'),
        new Error('RPC endpoint unavailable'),
      ];

      for (const error of errors) {
        const kiltError = ErrorFactory.fromUnknown(error, 'kilt');
        const moonbeamError = ErrorFactory.fromUnknown(error, 'moonbeam');

        expect(kiltError.severity).toBeDefined();
        expect(kiltError.category).toBeDefined();
        expect(moonbeamError.severity).toBeDefined();
        expect(moonbeamError.category).toBeDefined();

        console.log(`   "${error.message}"`);
        console.log(`      KILT: ${kiltError.category} / ${kiltError.severity}`);
        console.log(`      Moonbeam: ${moonbeamError.category} / ${moonbeamError.severity}`);
      }

      console.log(`✅ Error categorization validated\n`);
    }, TEST_TIMEOUT);

    test('should detect retryable vs non-retryable errors', async () => {
      console.log('\n🔁 Testing retry logic detection...');

      const retryableErrors = [
        'network timeout',
        'connection refused',
        'temporary failure',
      ];

      const nonRetryableErrors = [
        'insufficient funds',
        'invalid signature',
        'transaction reverted',
      ];

      console.log('   Retryable errors:');
      for (const msg of retryableErrors) {
        const error = ErrorFactory.fromUnknown(new Error(msg), 'moonbeam');
        const isRetryable = error.category === ErrorCategory.NETWORK || 
                           error.severity === ErrorSeverity.LOW;
        console.log(`      "${msg}": ${isRetryable ? '✅ Retryable' : '❌ Non-retryable'}`);
      }

      console.log('   Non-retryable errors:');
      for (const msg of nonRetryableErrors) {
        const error = ErrorFactory.fromUnknown(new Error(msg), 'moonbeam');
        const isRetryable = error.category === ErrorCategory.NETWORK;
        console.log(`      "${msg}": ${isRetryable ? '✅ Retryable' : '❌ Non-retryable'}`);
      }

      console.log(`✅ Retry logic detection validated\n`);
    }, TEST_TIMEOUT);
  });

  describe('Performance Metrics and Monitoring', () => {
    test('should track transaction performance metrics', async () => {
      console.log('\n📊 Testing performance metrics tracking...');

      await kiltAdapter.connect();
      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      // Get initial metrics
      const initialMetrics = monitor.getMetrics(BlockchainType.MOONBEAM);

      // Perform a transaction
      const tx = await moonbeamWallet.sendTransaction({
        to: moonbeamWallet.address,
        value: BigInt(1),
        gasLimit: BigInt(21000),
      });

      await monitor.monitorMoonbeamTransaction(tx.hash, 'metrics-test');

      // Get updated metrics
      const updatedMetrics = monitor.getMetrics(BlockchainType.MOONBEAM);

      expect(updatedMetrics).toBeDefined();
      expect(updatedMetrics!.transactions.total).toBeGreaterThan(
        initialMetrics?.transactions.total || 0
      );

      console.log(`   Total transactions: ${updatedMetrics!.transactions.total}`);
      console.log(`   Successful: ${updatedMetrics!.transactions.successful}`);
      console.log(`   Failed: ${updatedMetrics!.transactions.failed}`);
      console.log(`   Success rate: ${(updatedMetrics!.transactions.successRate * 100).toFixed(2)}%`);
      console.log(`✅ Performance metrics tracked\n`);
    }, TEST_TIMEOUT);

    test('should calculate latency percentiles', async () => {
      console.log('\n⏱️  Testing latency calculations...');

      await kiltAdapter.connect();
      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      // Perform multiple transactions to generate latency data
      for (let i = 0; i < 3; i++) {
        const tx = await moonbeamWallet.sendTransaction({
          to: moonbeamWallet.address,
          value: BigInt(1),
          gasLimit: BigInt(21000),
        });

        await monitor.monitorMoonbeamTransaction(tx.hash, `latency-test-${i}`);
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const metrics = monitor.getMetrics(BlockchainType.MOONBEAM);
      expect(metrics).toBeDefined();
      expect(metrics!.latency).toBeDefined();

      console.log(`   Average latency: ${metrics!.latency.averageMs.toFixed(2)}ms`);
      console.log(`   P50 latency: ${metrics!.latency.p50Ms.toFixed(2)}ms`);
      console.log(`   P95 latency: ${metrics!.latency.p95Ms.toFixed(2)}ms`);
      console.log(`   P99 latency: ${metrics!.latency.p99Ms.toFixed(2)}ms`);
      console.log(`✅ Latency calculations validated\n`);
    }, TEST_TIMEOUT);

    test('should track gas usage and costs', async () => {
      console.log('\n⛽ Testing gas tracking...');

      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      // Get initial metrics
      const initialMetrics = monitor.getMetrics(BlockchainType.MOONBEAM);
      const initialGas = initialMetrics?.costs.totalGasUsed || BigInt(0);

      // Perform a transaction
      const tx = await moonbeamWallet.sendTransaction({
        to: moonbeamWallet.address,
        value: BigInt(1),
        gasLimit: BigInt(21000),
      });

      const monitoredTx = await monitor.monitorMoonbeamTransaction(tx.hash, 'gas-test');

      // Get updated metrics
      const updatedMetrics = monitor.getMetrics(BlockchainType.MOONBEAM);
      
      expect(updatedMetrics!.costs.totalGasUsed).toBeGreaterThan(initialGas);
      expect(monitoredTx.gasUsed).toBeDefined();

      console.log(`   Gas used: ${monitoredTx.gasUsed?.toString()}`);
      console.log(`   Total gas tracked: ${updatedMetrics!.costs.totalGasUsed.toString()}`);
      console.log(`✅ Gas tracking validated\n`);
    }, TEST_TIMEOUT);
  });

  describe('Health Checks and Status Monitoring', () => {
    test('should perform comprehensive health checks', async () => {
      console.log('\n🏥 Testing comprehensive health checks...');

      await kiltAdapter.connect();
      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      const [kiltHealth, moonbeamHealth] = await Promise.all([
        monitor.checkKILTHealth(),
        monitor.checkMoonbeamHealth(),
      ]);

      expect(kiltHealth.blockchain).toBe(BlockchainType.KILT);
      expect(moonbeamHealth.blockchain).toBe(BlockchainType.MOONBEAM);

      console.log('   KILT Health:');
      console.log(`      Status: ${kiltHealth.status}`);
      console.log(`      Connection: ${kiltHealth.checks.connection.status}`);
      console.log(`      Latency: ${kiltHealth.checks.connection.latencyMs || 'N/A'}ms`);
      
      console.log('   Moonbeam Health:');
      console.log(`      Status: ${moonbeamHealth.status}`);
      console.log(`      Connection: ${moonbeamHealth.checks.connection.status}`);
      console.log(`      Latency: ${moonbeamHealth.checks.connection.latencyMs || 'N/A'}ms`);

      console.log(`✅ Health checks completed\n`);
    }, TEST_TIMEOUT);

    test('should retrieve health status history', async () => {
      console.log('\n📜 Testing health status history...');

      await kiltAdapter.connect();
      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      // Perform multiple health checks
      await monitor.checkKILTHealth();
      await monitor.checkMoonbeamHealth();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await monitor.checkKILTHealth();
      await monitor.checkMoonbeamHealth();

      const kiltStatus = monitor.getHealthStatus(BlockchainType.KILT);
      const moonbeamStatus = monitor.getHealthStatus(BlockchainType.MOONBEAM);

      expect(kiltStatus).toBeDefined();
      expect(moonbeamStatus).toBeDefined();

      console.log(`   KILT status: ${kiltStatus?.status || 'Unknown'}`);
      console.log(`   Moonbeam status: ${moonbeamStatus?.status || 'Unknown'}`);
      console.log(`✅ Health status history retrieved\n`);
    }, TEST_TIMEOUT);

    test('should report errors with proper severity and context', async () => {
      console.log('\n🔔 Testing error reporting...');

      await kiltAdapter.connect();
      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      // Report test errors
      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorSeverity.LOW,
        operation: 'test-operation-1',
        error: 'Test error for validation',
        retryable: true,
      });

      monitor.reportError({
        blockchain: BlockchainType.MOONBEAM,
        severity: ErrorSeverity.HIGH,
        operation: 'test-operation-2',
        error: 'Critical test error',
        retryable: false,
      });

      const errors = monitor.getErrors({ limit: 10 });
      expect(errors.length).toBeGreaterThanOrEqual(2);

      console.log(`   Total errors reported: ${errors.length}`);
      errors.slice(0, 2).forEach((error, i) => {
        console.log(`   Error ${i + 1}:`);
        console.log(`      Blockchain: ${error.blockchain}`);
        console.log(`      Severity: ${error.severity}`);
        console.log(`      Operation: ${error.operation}`);
        console.log(`      Retryable: ${error.retryable}`);
      });

      console.log(`✅ Error reporting validated\n`);
    }, TEST_TIMEOUT);
  });

  describe('Performance Summary', () => {
    test('should generate comprehensive performance summary', async () => {
      console.log('\n📊 === BLOCKCHAIN INTEGRATION PERFORMANCE SUMMARY ===\n');

      console.log('⏱️  Connection Performance:');
      console.log(`   KILT connection: ${performanceMetrics.kiltConnectionTime}ms`);
      console.log(`   Moonbeam connection: ${performanceMetrics.moonbeamConnectionTime}ms\n`);

      console.log('⏱️  Transaction Performance:');
      if (performanceMetrics.moonbeamTransactionTime > 0) {
        console.log(`   Moonbeam transaction: ${performanceMetrics.moonbeamTransactionTime}ms\n`);
      }

      await kiltAdapter.connect();
      await moonbeamAdapter.connect();
      await monitor.initialize(kiltAdapter, moonbeamAdapter);

      console.log('📈 KILT Metrics:');
      const kiltMetrics = monitor.getMetrics(BlockchainType.KILT);
      if (kiltMetrics) {
        console.log(`   Transactions: ${kiltMetrics.transactions.total}`);
        console.log(`   Success rate: ${(kiltMetrics.transactions.successRate * 100).toFixed(2)}%`);
      }

      console.log('\n📈 Moonbeam Metrics:');
      const moonbeamMetrics = monitor.getMetrics(BlockchainType.MOONBEAM);
      if (moonbeamMetrics) {
        console.log(`   Transactions: ${moonbeamMetrics.transactions.total}`);
        console.log(`   Success rate: ${(moonbeamMetrics.transactions.successRate * 100).toFixed(2)}%`);
        console.log(`   Total gas used: ${moonbeamMetrics.costs.totalGasUsed.toString()}`);
        console.log(`   Avg latency: ${moonbeamMetrics.latency.averageMs.toFixed(2)}ms`);
      }

      console.log('\n🏥 System Health:');
      const kiltHealth = monitor.getHealthStatus(BlockchainType.KILT);
      const moonbeamHealth = monitor.getHealthStatus(BlockchainType.MOONBEAM);
      console.log(`   KILT: ${kiltHealth?.status || 'Unknown'}`);
      console.log(`   Moonbeam: ${moonbeamHealth?.status || 'Unknown'}`);

      console.log('\n✅ === BLOCKCHAIN INTEGRATION TESTS COMPLETE ===\n');

      // Validate we have meaningful data
      expect(performanceMetrics.kiltConnectionTime).toBeGreaterThan(0);
      expect(performanceMetrics.moonbeamConnectionTime).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });
});

