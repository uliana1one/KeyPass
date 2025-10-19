/**
 * Tests for BlockchainMonitor
 */

import { 
  BlockchainMonitor, 
  BlockchainType,
  TransactionStatus,
  ErrorSeverity,
  HealthStatus,
} from '../BlockchainMonitor';
import { KiltAdapter } from '../../adapters/KiltAdapter';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';

// Mock adapters
jest.mock('../../adapters/KiltAdapter');
jest.mock('../../adapters/MoonbeamAdapter');

describe('BlockchainMonitor', () => {
  let monitor: BlockchainMonitor;
  let mockKiltAdapter: jest.Mocked<KiltAdapter>;
  let mockMoonbeamAdapter: jest.Mocked<MoonbeamAdapter>;

  beforeEach(() => {
    // Create mocks
    mockKiltAdapter = {
      connect: jest.fn().mockResolvedValue({}),
      getTransactionService: jest.fn().mockReturnValue({
        waitForConfirmation: jest.fn().mockResolvedValue(undefined),
        getTransactionStatus: jest.fn().mockReturnValue({
          hash: '0xtest',
          status: 'confirmed',
          blockNumber: 12345,
        }),
      }),
      getChainInfo: jest.fn().mockReturnValue({
        network: 'spiritnet',
        chainId: 'spirit',
      }),
      performHealthCheck: jest.fn().mockResolvedValue(true),
    } as any;

    mockMoonbeamAdapter = {
      connect: jest.fn().mockResolvedValue(undefined),
      getProvider: jest.fn().mockReturnValue({
        waitForTransaction: jest.fn().mockResolvedValue({
          status: 1,
          blockNumber: 12345,
          gasUsed: BigInt(100000),
          gasPrice: BigInt(1000000000),
        }),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1284 }),
        getBlockNumber: jest.fn().mockResolvedValue(12345),
        getBlock: jest.fn().mockResolvedValue({
          timestamp: Math.floor(Date.now() / 1000),
        }),
        getFeeData: jest.fn().mockResolvedValue({
          gasPrice: BigInt(1000000000),
        }),
      }),
    } as any;

    monitor = new BlockchainMonitor({
      enableMetrics: true,
      enableHealthChecks: false, // Disable automatic health checks for testing
      enableLogging: false,
    });
  });

  afterEach(() => {
    monitor.stop();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default config', () => {
      const defaultMonitor = new BlockchainMonitor();
      expect(defaultMonitor).toBeDefined();
    });

    test('should initialize with custom config', () => {
      const customMonitor = new BlockchainMonitor({
        metricsInterval: 30000,
        maxRetries: 5,
      });
      expect(customMonitor).toBeDefined();
    });

    test('should initialize with adapters', async () => {
      await monitor.initialize(mockKiltAdapter, mockMoonbeamAdapter);
      
      expect(mockKiltAdapter.connect).toHaveBeenCalled();
      expect(mockMoonbeamAdapter.connect).toHaveBeenCalled();
    });

    test('should handle adapter initialization errors gracefully', async () => {
      mockKiltAdapter.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(monitor.initialize(mockKiltAdapter)).resolves.not.toThrow();
    });
  });

  describe('Transaction Monitoring - KILT', () => {
    beforeEach(async () => {
      await monitor.initialize(mockKiltAdapter);
    });

    test('should monitor KILT transaction successfully', async () => {
      const txHash = '0x123';
      const result = await monitor.monitorKILTTransaction(txHash, 'test-operation');

      expect(result).toBeDefined();
      expect(result.blockchain).toBe(BlockchainType.KILT);
      expect(result.hash).toBe(txHash);
      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      expect(result.operation).toBe('test-operation');
    });

    test('should handle KILT transaction failure', async () => {
      const service = mockKiltAdapter.getTransactionService();
      service.waitForConfirmation = jest.fn().mockRejectedValueOnce(new Error('Transaction failed'));

      const txHash = '0x123';
      const result = await monitor.monitorKILTTransaction(txHash, 'test-operation', { maxRetries: 0 });

      expect(result.status).toBe(TransactionStatus.FAILED);
      expect(result.lastError).toContain('Transaction failed');
    });

    test('should emit events during transaction monitoring', async () => {
      const startedCallback = jest.fn();
      const confirmedCallback = jest.fn();
      
      monitor.on('transaction:started', startedCallback);
      monitor.on('transaction:confirmed', confirmedCallback);

      await monitor.monitorKILTTransaction('0x123', 'test-operation');

      expect(startedCallback).toHaveBeenCalled();
      expect(confirmedCallback).toHaveBeenCalled();
    });

    test('should track transaction in history', async () => {
      await monitor.monitorKILTTransaction('0x123', 'test-operation');

      const history = monitor.getTransactionHistory({
        blockchain: BlockchainType.KILT,
      });

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].hash).toBe('0x123');
    });
  });

  describe('Transaction Monitoring - Moonbeam', () => {
    beforeEach(async () => {
      await monitor.initialize(undefined, mockMoonbeamAdapter);
    });

    test('should monitor Moonbeam transaction successfully', async () => {
      const txHash = '0xabc';
      const result = await monitor.monitorMoonbeamTransaction(txHash, 'mint-operation');

      expect(result).toBeDefined();
      expect(result.blockchain).toBe(BlockchainType.MOONBEAM);
      expect(result.hash).toBe(txHash);
      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      expect(result.gasUsed).toBeDefined();
      expect(result.cost).toBeDefined();
    });

    test('should handle Moonbeam transaction failure', async () => {
      const provider = mockMoonbeamAdapter.getProvider();
      provider.waitForTransaction = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const txHash = '0xabc';
      const result = await monitor.monitorMoonbeamTransaction(txHash, 'mint-operation', { maxRetries: 0 });

      expect(result.status).toBe(TransactionStatus.FAILED);
    });

    test('should handle failed transaction (status 0)', async () => {
      const provider = mockMoonbeamAdapter.getProvider();
      provider.waitForTransaction = jest.fn().mockResolvedValueOnce({
        status: 0, // Failed
        blockNumber: 12345,
        gasUsed: BigInt(100000),
        gasPrice: BigInt(1000000000),
      });

      const txHash = '0xfailed';
      const result = await monitor.monitorMoonbeamTransaction(txHash, 'mint-operation', { maxRetries: 0 });

      expect(result.status).toBe(TransactionStatus.FAILED);
    });
  });

  describe('Retry Logic', () => {
    beforeEach(async () => {
      await monitor.initialize(undefined, mockMoonbeamAdapter);
    });

    test('should retry on retryable errors', async () => {
      const provider = mockMoonbeamAdapter.getProvider();
      
      // Fail twice, then succeed
      provider.waitForTransaction = jest.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce({
          status: 1,
          blockNumber: 12345,
          gasUsed: BigInt(100000),
          gasPrice: BigInt(1000000000),
        });

      const txHash = '0xretry';
      const result = await monitor.monitorMoonbeamTransaction(txHash, 'test-operation', { maxRetries: 3 });

      // Should eventually confirm after retries
      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      // waitForTransaction should have been called multiple times due to retries
      expect(provider.waitForTransaction).toHaveBeenCalledTimes(3);
    }, 30000); // 30 second timeout for retry test

    test('should not retry on non-retryable errors', async () => {
      const provider = mockMoonbeamAdapter.getProvider();
      provider.waitForTransaction = jest.fn().mockRejectedValueOnce(new Error('Invalid signature'));

      const txHash = '0xnoretry';
      const result = await monitor.monitorMoonbeamTransaction(txHash, 'test-operation', { maxRetries: 3 });

      expect(result.status).toBe(TransactionStatus.FAILED);
      expect(result.retryCount).toBe(0);
    });
  });

  describe('Health Checks', () => {
    test('should check KILT health', async () => {
      await monitor.initialize(mockKiltAdapter);
      
      const health = await monitor.checkKILTHealth();

      expect(health).toBeDefined();
      expect(health.blockchain).toBe(BlockchainType.KILT);
      expect(health.status).toBe(HealthStatus.HEALTHY);
      expect(health.checks.connection.status).toBe(HealthStatus.HEALTHY);
    });

    test('should detect unhealthy KILT connection', async () => {
      mockKiltAdapter.getChainInfo.mockReturnValue(null);
      await monitor.initialize(mockKiltAdapter);

      const health = await monitor.checkKILTHealth();

      expect(health.status).toBe(HealthStatus.UNHEALTHY);
    });

    test('should check Moonbeam health', async () => {
      await monitor.initialize(undefined, mockMoonbeamAdapter);

      const health = await monitor.checkMoonbeamHealth();

      expect(health).toBeDefined();
      expect(health.blockchain).toBe(BlockchainType.MOONBEAM);
      expect(health.status).toBe(HealthStatus.HEALTHY);
    });

    test('should detect high gas prices', async () => {
      const provider = mockMoonbeamAdapter.getProvider();
      provider.getFeeData = jest.fn().mockResolvedValue({
        gasPrice: BigInt(150000000000), // 150 Gwei - very high
      });

      await monitor.initialize(undefined, mockMoonbeamAdapter);
      const health = await monitor.checkMoonbeamHealth();

      expect(health.checks.gasPrice.status).toBe(HealthStatus.DEGRADED);
      expect(health.recommendations).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await monitor.initialize(mockKiltAdapter, mockMoonbeamAdapter);
    });

    test('should calculate metrics for KILT', async () => {
      // Add some transactions
      await monitor.monitorKILTTransaction('0x1', 'op1');
      await monitor.monitorKILTTransaction('0x2', 'op2');

      const metrics = monitor.calculateMetrics(BlockchainType.KILT);

      expect(metrics).toBeDefined();
      expect(metrics.transactions.total).toBeGreaterThan(0);
      expect(metrics.transactions.successful).toBeGreaterThan(0);
      expect(metrics.transactions.successRate).toBeGreaterThan(0);
    });

    test('should calculate latency percentiles', async () => {
      // Add multiple transactions
      for (let i = 0; i < 10; i++) {
        await monitor.monitorKILTTransaction(`0x${i}`, `op${i}`);
      }

      const metrics = monitor.calculateMetrics(BlockchainType.KILT);

      expect(metrics.latency.p50Ms).toBeGreaterThanOrEqual(0);
      expect(metrics.latency.p95Ms).toBeGreaterThanOrEqual(0);
      expect(metrics.latency.p99Ms).toBeGreaterThanOrEqual(0);
    });

    test('should track costs for Moonbeam', async () => {
      await monitor.monitorMoonbeamTransaction('0xa1', 'mint1');
      await monitor.monitorMoonbeamTransaction('0xa2', 'mint2');

      const metrics = monitor.calculateMetrics(BlockchainType.MOONBEAM);

      expect(metrics.costs.totalCost).toBeGreaterThan(BigInt(0));
      expect(metrics.costs.totalGasUsed).toBeGreaterThan(BigInt(0));
    });
  });

  describe('Error Reporting', () => {
    test('should report errors', () => {
      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorSeverity.HIGH,
        operation: 'test-operation',
        error: 'Test error message',
        retryable: true,
      });

      const errors = monitor.getErrors({ limit: 10 });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].error).toBe('Test error message');
      expect(errors[0].severity).toBe(ErrorSeverity.HIGH);
    });

    test('should filter errors by blockchain', () => {
      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorSeverity.MEDIUM,
        operation: 'kilt-op',
        error: 'KILT error',
        retryable: true,
      });

      monitor.reportError({
        blockchain: BlockchainType.MOONBEAM,
        severity: ErrorSeverity.LOW,
        operation: 'moonbeam-op',
        error: 'Moonbeam error',
        retryable: false,
      });

      const kiltErrors = monitor.getErrors({ blockchain: BlockchainType.KILT });
      const moonbeamErrors = monitor.getErrors({ blockchain: BlockchainType.MOONBEAM });

      expect(kiltErrors.length).toBe(1);
      expect(moonbeamErrors.length).toBe(1);
      expect(kiltErrors[0].blockchain).toBe(BlockchainType.KILT);
      expect(moonbeamErrors[0].blockchain).toBe(BlockchainType.MOONBEAM);
    });

    test('should filter errors by severity', () => {
      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorSeverity.CRITICAL,
        operation: 'critical-op',
        error: 'Critical error',
        retryable: false,
      });

      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorSeverity.LOW,
        operation: 'low-op',
        error: 'Low error',
        retryable: true,
      });

      const criticalErrors = monitor.getErrors({ severity: ErrorSeverity.CRITICAL });

      expect(criticalErrors.length).toBeGreaterThan(0);
      expect(criticalErrors[0].severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('Transaction History', () => {
    beforeEach(async () => {
      await monitor.initialize(mockKiltAdapter, mockMoonbeamAdapter);
    });

    test('should retrieve all transaction history', async () => {
      await monitor.monitorKILTTransaction('0x1', 'op1');
      await monitor.monitorMoonbeamTransaction('0xa', 'opA');

      const history = monitor.getTransactionHistory();

      expect(history.length).toBe(2);
    });

    test('should filter history by blockchain', async () => {
      await monitor.monitorKILTTransaction('0x1', 'op1');
      await monitor.monitorMoonbeamTransaction('0xa', 'opA');

      const kiltHistory = monitor.getTransactionHistory({ blockchain: BlockchainType.KILT });
      const moonbeamHistory = monitor.getTransactionHistory({ blockchain: BlockchainType.MOONBEAM });

      expect(kiltHistory.length).toBe(1);
      expect(moonbeamHistory.length).toBe(1);
    });

    test('should filter history by status', async () => {
      await monitor.monitorKILTTransaction('0x1', 'op1');

      const confirmed = monitor.getTransactionHistory({ status: TransactionStatus.CONFIRMED });
      const failed = monitor.getTransactionHistory({ status: TransactionStatus.FAILED });

      expect(confirmed.length).toBeGreaterThan(0);
      expect(failed.length).toBe(0);
    });

    test('should filter history by time', async () => {
      const since = Date.now();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await monitor.monitorKILTTransaction('0x1', 'op1');

      const recent = monitor.getTransactionHistory({ since });

      expect(recent.length).toBeGreaterThan(0);
    });
  });

  describe('Event Listeners', () => {
    beforeEach(async () => {
      await monitor.initialize(mockKiltAdapter);
    });

    test('should register and trigger event listeners', async () => {
      const listener = jest.fn();
      monitor.on('transaction:started', listener);

      await monitor.monitorKILTTransaction('0x1', 'test');

      expect(listener).toHaveBeenCalled();
    });

    test('should unregister event listeners', async () => {
      const listener = jest.fn();
      monitor.on('transaction:started', listener);
      monitor.off('transaction:started', listener);

      await monitor.monitorKILTTransaction('0x1', 'test');

      // Listener should not be called after being removed
      // (But transaction:started was already emitted, so this test checks future events)
      listener.mockClear();
      
      await monitor.monitorKILTTransaction('0x2', 'test2');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle Management', () => {
    test('should stop monitoring', () => {
      monitor.stop();
      // Should not throw
      expect(true).toBe(true);
    });

    test('should handle multiple stop calls', () => {
      monitor.stop();
      monitor.stop();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Data Access Methods', () => {
    beforeEach(async () => {
      await monitor.initialize(mockKiltAdapter, mockMoonbeamAdapter);
    });

    test('should get metrics for blockchain', async () => {
      await monitor.monitorKILTTransaction('0x1', 'op1');
      monitor.calculateMetrics(BlockchainType.KILT);

      const metrics = monitor.getMetrics(BlockchainType.KILT);

      expect(metrics).toBeDefined();
      expect(metrics?.blockchain).toBe(BlockchainType.KILT);
    });

    test('should get health status for blockchain', async () => {
      await monitor.checkKILTHealth();

      const health = monitor.getHealthStatus(BlockchainType.KILT);

      expect(health).toBeDefined();
      expect(health?.blockchain).toBe(BlockchainType.KILT);
    });

    test('should get all monitored transactions', async () => {
      await monitor.monitorKILTTransaction('0x1', 'op1');

      const transactions = monitor.getTransactions();

      expect(transactions.length).toBeGreaterThan(0);
    });
  });
});

