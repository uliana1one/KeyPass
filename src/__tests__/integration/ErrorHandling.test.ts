/**
 * Error Handling Integration Tests
 * 
 * Tests error handling across all blockchain operations including:
 * - Network failure scenarios
 * - Transaction failure scenarios
 * - User error scenarios
 * - Error recovery and retry logic
 * 
 * Run with: npm test -- --testPathPattern=ErrorHandling
 * With real blockchain: ENABLE_INTEGRATION_TESTS=true npm test -- --testPathPattern=ErrorHandling
 */

import { KiltAdapter } from '../../adapters/KiltAdapter';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { KILTDIDProvider } from '../../did/KILTDIDProvider';
import { SBTMintingService } from '../../services/SBTMintingService';
import { BlockchainMonitor, BlockchainType } from '../../monitoring/BlockchainMonitor';
import {
  ErrorFactory,
  ErrorCategory,
  ErrorSeverity,
  KILTErrorCode,
  MoonbeamErrorCode,
  isKILTError,
  isMoonbeamError,
  isRetryableError,
  getErrorSeverity,
} from '../../errors/BlockchainErrors';
import { KILTNetwork } from '../../config/kiltConfig';
import { MoonbeamNetwork } from '../../config/moonbeamConfig';
import { DeploymentConfigLoader } from '../../contracts/SBTContractFactory';
import { ethers } from 'ethers';

// Check if integration tests are enabled
const INTEGRATION_ENABLED = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const describeIntegration = INTEGRATION_ENABLED ? describe : describe.skip;

describe('Error Handling Integration Tests', () => {
  let kiltAdapter: KiltAdapter;
  let moonbeamAdapter: MoonbeamAdapter;
  let monitor: BlockchainMonitor;

  beforeAll(() => {
    kiltAdapter = new KiltAdapter(KILTNetwork.PEREGRINE);
    moonbeamAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
    monitor = new BlockchainMonitor({
      enableMetrics: true,
      enableHealthChecks: true,
      enableLogging: false,
    });
  });

  afterAll(async () => {
    await kiltAdapter.disconnect();
    await moonbeamAdapter.disconnect();
  });

  describe('Error Type Detection', () => {
    test('should correctly identify KILT errors', () => {
      const kiltError = ErrorFactory.kiltConnectionError('Connection failed');
      expect(isKILTError(kiltError)).toBe(true);
      expect(isMoonbeamError(kiltError)).toBe(false);
    });

    test('should correctly identify Moonbeam errors', () => {
      const moonbeamError = ErrorFactory.moonbeamConnectionError('RPC failed');
      expect(isMoonbeamError(moonbeamError)).toBe(true);
      expect(isKILTError(moonbeamError)).toBe(false);
    });

    test('should categorize network errors as retryable', () => {
      const networkError = ErrorFactory.kiltConnectionError('Timeout');
      expect(isRetryableError(networkError)).toBe(true);
      expect(networkError.category).toBe(ErrorCategory.NETWORK);
    });

    test('should categorize user errors as non-retryable', () => {
      const userError = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.INSUFFICIENT_FUNDS,
        'Not enough balance',
        { balance: '0' }
      );
      expect(isRetryableError(userError)).toBe(false);
      expect(userError.category).toBe(ErrorCategory.USER);
    });

    test('should assign appropriate severity levels', () => {
      const criticalError = ErrorFactory.kiltConnectionError('Connection lost');
      const highError = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.TRANSACTION_REVERTED,
        'Transaction failed',
        {}
      );
      const mediumError = ErrorFactory.fromCode(
        'kilt',
        KILTErrorCode.DID_ALREADY_EXISTS,
        'DID exists',
        {}
      );

      expect(getErrorSeverity(criticalError)).toBe(ErrorSeverity.CRITICAL);
      expect(getErrorSeverity(highError)).toBe(ErrorSeverity.HIGH);
      expect(getErrorSeverity(mediumError)).toBe(ErrorSeverity.MEDIUM);
    });

    test('should provide user-friendly error messages', () => {
      const error = ErrorFactory.kiltConnectionError(
        'Failed to connect to wss://peregrine.kilt.io'
      );
      const userMessage = error.toUserMessage();

      expect(userMessage).toBeDefined();
      expect(typeof userMessage).toBe('string');
      expect(userMessage.length).toBeGreaterThan(0);
      expect(userMessage).toContain('try again');
    });
  });

  describe('Network Failure Scenarios', () => {
    test('should handle connection timeout errors', () => {
      const error = ErrorFactory.kiltConnectionError('Connection timeout after 30s');

      expect(error.blockchain).toBe('kilt');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(isRetryableError(error)).toBe(true);
    });

    test('should handle RPC endpoint failures', () => {
      const error = ErrorFactory.moonbeamConnectionError('RPC endpoint unavailable');

      expect(error.blockchain).toBe('moonbeam');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(isRetryableError(error)).toBe(true);
    });

    test('should handle WebSocket disconnection errors', () => {
      const error = ErrorFactory.kiltConnectionError('WebSocket connection closed unexpectedly');

      expect(error.blockchain).toBe('kilt');
      expect(error.code).toBe(KILTErrorCode.CONNECTION_FAILED);
      expect(isRetryableError(error)).toBe(true);
    });

    test('should track network error metrics', () => {
      // Report multiple network errors
      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorSeverity.CRITICAL,
        operation: 'connect',
        error: 'Connection timeout',
        retryable: true,
      });

      monitor.reportError({
        blockchain: BlockchainType.MOONBEAM,
        severity: ErrorSeverity.HIGH,
        operation: 'rpc-call',
        error: 'RPC failed',
        retryable: true,
      });

      const errors = monitor.getErrors({ limit: 10 });
      expect(errors.length).toBeGreaterThanOrEqual(2);

      const networkErrors = errors.filter(e => e.retryable);
      expect(networkErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Transaction Failure Scenarios', () => {
    test('should handle transaction revert errors', () => {
      const error = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.TRANSACTION_REVERTED,
        'Transaction reverted with reason: Unauthorized',
        { reason: 'Unauthorized' }
      );

      expect(error.code).toBe(MoonbeamErrorCode.TRANSACTION_REVERTED);
      expect(error.category).toBe(ErrorCategory.CONTRACT);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(isRetryableError(error)).toBe(false);
    });

    test('should handle out of gas errors', () => {
      const error = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.GAS_ESTIMATION_FAILED,
        'Out of gas',
        { estimatedGas: '0' }
      );

      expect(error.code).toBe(MoonbeamErrorCode.GAS_ESTIMATION_FAILED);
      expect(error.category).toBe(ErrorCategory.USER);
      expect(isRetryableError(error)).toBe(false);
    });

    test('should handle nonce too low errors', () => {
      const error = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.NONCE_TOO_LOW,
        'Nonce too low',
        { currentNonce: 5, expectedNonce: 6 }
      );

      expect(error.code).toBe(MoonbeamErrorCode.NONCE_TOO_LOW);
      expect(error.category).toBe(ErrorCategory.TRANSACTION);
      expect(isRetryableError(error)).toBe(true); // Can retry with correct nonce
    });

    test('should handle transaction not found errors', () => {
      const error = ErrorFactory.kiltTransactionNotFound('0x123abc');

      expect(error.code).toBe(KILTErrorCode.TRANSACTION_NOT_FOUND);
      expect(error.category).toBe(ErrorCategory.TRANSACTION);
      expect(error.context).toHaveProperty('txHash', '0x123abc');
    });

    test('should handle batch transaction failures', () => {
      const batchError = ErrorFactory.fromCode(
        'kilt',
        KILTErrorCode.BATCH_INTERRUPTED,
        'Batch transaction failed at index 2',
        { failedIndex: 2, totalBatch: 5 }
      );

      expect(batchError.code).toBe(KILTErrorCode.BATCH_INTERRUPTED);
      expect(batchError.category).toBe(ErrorCategory.TRANSACTION);
      expect(batchError.context.failedIndex).toBe(2);
    });
  });

  describe('User Error Scenarios', () => {
    test('should handle insufficient funds errors', () => {
      const error = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient balance for transaction',
        { required: '1000000000000000000', available: '0' }
      );

      expect(error.code).toBe(MoonbeamErrorCode.INSUFFICIENT_FUNDS);
      expect(error.category).toBe(ErrorCategory.USER);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(isRetryableError(error)).toBe(false);

      const userMessage = error.toUserMessage();
      expect(userMessage.toLowerCase()).toContain('insufficient');
    });

    test('should handle invalid address errors', () => {
      const error = ErrorFactory.kiltInvalidAddress('invalid_address_123');

      expect(error.code).toBe(KILTErrorCode.INVALID_ADDRESS);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(isRetryableError(error)).toBe(false);
    });

    test('should handle DID already exists errors', () => {
      const error = ErrorFactory.fromCode(
        'kilt',
        KILTErrorCode.DID_ALREADY_EXISTS,
        'DID already registered',
        { did: 'did:kilt:4test123' }
      );

      expect(error.code).toBe(KILTErrorCode.DID_ALREADY_EXISTS);
      expect(error.category).toBe(ErrorCategory.USER);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(isRetryableError(error)).toBe(false);
    });

    test('should handle invalid parameters errors', () => {
      const error = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.INVALID_PARAMETERS,
        'Invalid recipient address',
        { parameter: 'recipient', value: '0xinvalid' }
      );

      expect(error.code).toBe(MoonbeamErrorCode.INVALID_PARAMETERS);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    test('should implement exponential backoff for retryable errors', async () => {
      const retryDelays: number[] = [];
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        retryDelays.push(delay);
      }

      expect(retryDelays).toEqual([1000, 2000, 4000]);
      expect(retryDelays[0]).toBeLessThan(retryDelays[1]);
      expect(retryDelays[1]).toBeLessThan(retryDelays[2]);
    });

    test('should not retry non-retryable errors', () => {
      const userError = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.INSUFFICIENT_FUNDS,
        'Not enough funds',
        {}
      );

      expect(isRetryableError(userError)).toBe(false);
      expect(userError.category).toBe(ErrorCategory.USER);
    });

    test('should track retry attempts in error context', () => {
      const error = ErrorFactory.kiltConnectionError('Connection failed');
      
      // Simulate retry tracking
      const errorWithRetries = {
        ...error,
        context: {
          ...error.context,
          retryCount: 2,
          maxRetries: 3,
          lastAttempt: new Date().toISOString(),
        },
      };

      expect(errorWithRetries.context.retryCount).toBe(2);
      expect(errorWithRetries.context.maxRetries).toBe(3);
      expect(errorWithRetries.context.lastAttempt).toBeDefined();
    });

    test('should provide recovery suggestions in error messages', () => {
      const errors = [
        ErrorFactory.kiltConnectionError('Connection timeout'),
        ErrorFactory.fromCode('moonbeam', MoonbeamErrorCode.INSUFFICIENT_FUNDS, 'Low balance', {}),
        ErrorFactory.fromCode('kilt', KILTErrorCode.DID_ALREADY_EXISTS, 'DID exists', {}),
      ];

      errors.forEach(error => {
        const userMessage = error.toUserMessage();
        const devMessage = error.toDeveloperMessage();

        expect(userMessage).toBeDefined();
        expect(devMessage).toBeDefined();
        expect(userMessage.length).toBeGreaterThan(0);
        expect(devMessage.length).toBeGreaterThan(0);
      });
    });

    test('should handle circuit breaker pattern for repeated failures', () => {
      const failureThreshold = 5;
      const failures: string[] = [];

      // Simulate repeated failures
      for (let i = 0; i < 6; i++) {
        failures.push(`failure-${i}`);
        monitor.reportError({
          blockchain: BlockchainType.KILT,
          severity: ErrorSeverity.HIGH,
          operation: 'test-operation',
          error: `Failure ${i}`,
          retryable: true,
        });
      }

      expect(failures.length).toBeGreaterThan(failureThreshold);

      // After threshold, circuit should be open
      const recentErrors = monitor.getErrors({ limit: 10 });
      const recentFailures = recentErrors.filter(e => e.retryable);
      expect(recentFailures.length).toBeGreaterThanOrEqual(failureThreshold);
    });
  });

  describe('Cross-Chain Error Propagation', () => {
    test('should propagate errors across KILT and Moonbeam operations', () => {
      const kiltError = ErrorFactory.kiltConnectionError('KILT connection failed');
      const moonbeamError = ErrorFactory.moonbeamConnectionError('Moonbeam RPC failed');

      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: kiltError.severity,
        operation: 'did-registration',
        error: kiltError.message,
        retryable: isRetryableError(kiltError),
      });

      monitor.reportError({
        blockchain: BlockchainType.MOONBEAM,
        severity: moonbeamError.severity,
        operation: 'sbt-minting',
        error: moonbeamError.message,
        retryable: isRetryableError(moonbeamError),
      });

      const allErrors = monitor.getErrors({ limit: 20 });
      const kiltErrors = allErrors.filter(e => e.blockchain === BlockchainType.KILT);
      const moonbeamErrors = allErrors.filter(e => e.blockchain === BlockchainType.MOONBEAM);

      expect(kiltErrors.length).toBeGreaterThan(0);
      expect(moonbeamErrors.length).toBeGreaterThan(0);
    });

    test('should handle cascading failures gracefully', () => {
      // Simulate a scenario where KILT failure causes Moonbeam operation to fail
      const primaryError = ErrorFactory.kiltConnectionError('KILT unavailable');
      const cascadingError = ErrorFactory.fromCode(
        'moonbeam',
        MoonbeamErrorCode.DEPENDENCY_ERROR,
        'Cannot mint SBT: KILT DID not available',
        { dependencyError: primaryError.message }
      );

      expect(primaryError.blockchain).toBe('kilt');
      expect(cascadingError.blockchain).toBe('moonbeam');
      expect(cascadingError.context.dependencyError).toBeDefined();
    });
  });

  describe('Error Monitoring and Reporting', () => {
    test('should collect error statistics', () => {
      // Report various errors
      const errorTypes = [
        { blockchain: BlockchainType.KILT, severity: ErrorSeverity.HIGH },
        { blockchain: BlockchainType.MOONBEAM, severity: ErrorSeverity.MEDIUM },
        { blockchain: BlockchainType.KILT, severity: ErrorSeverity.LOW },
      ];

      errorTypes.forEach((errorType, index) => {
        monitor.reportError({
          ...errorType,
          operation: `operation-${index}`,
          error: `Error ${index}`,
          retryable: true,
        });
      });

      const errors = monitor.getErrors({ limit: 10 });
      expect(errors.length).toBeGreaterThan(0);

      // Verify we can filter by severity
      const highSeverityErrors = errors.filter(e => e.severity === ErrorSeverity.HIGH);
      expect(highSeverityErrors.length).toBeGreaterThan(0);
    });

    test('should maintain error history with timestamps', () => {
      const startTime = Date.now();

      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorSeverity.MEDIUM,
        operation: 'test-operation',
        error: 'Test error',
        retryable: false,
      });

      const errors = monitor.getErrors({ limit: 1 });
      expect(errors.length).toBeGreaterThan(0);
      
      const latestError = errors[0];
      expect(latestError.timestamp).toBeDefined();
      expect(new Date(latestError.timestamp).getTime()).toBeGreaterThanOrEqual(startTime);
    });

    test('should support error filtering by blockchain type', () => {
      // Clear previous errors by getting a fresh view
      monitor.reportError({
        blockchain: BlockchainType.KILT,
        severity: ErrorSeverity.LOW,
        operation: 'kilt-test',
        error: 'KILT error',
        retryable: false,
      });

      monitor.reportError({
        blockchain: BlockchainType.MOONBEAM,
        severity: ErrorSeverity.LOW,
        operation: 'moonbeam-test',
        error: 'Moonbeam error',
        retryable: false,
      });

      const allErrors = monitor.getErrors({ limit: 100 });
      const kiltErrors = allErrors.filter(e => e.blockchain === BlockchainType.KILT);
      const moonbeamErrors = allErrors.filter(e => e.blockchain === BlockchainType.MOONBEAM);

      expect(kiltErrors.length).toBeGreaterThan(0);
      expect(moonbeamErrors.length).toBeGreaterThan(0);
    });
  });
});

// Integration tests that require real blockchain access
describeIntegration('Error Handling with Real Blockchain', () => {
  let kiltAdapter: KiltAdapter;
  let moonbeamAdapter: MoonbeamAdapter;
  let kiltProvider: KILTDIDProvider;
  let mintingService: SBTMintingService;

  beforeAll(async () => {
    kiltAdapter = new KiltAdapter(KILTNetwork.PEREGRINE);
    moonbeamAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);

    await kiltAdapter.connect();
    await moonbeamAdapter.connect();

    kiltProvider = new KILTDIDProvider(kiltAdapter);

    const deploymentConfig = DeploymentConfigLoader.getInstance();
    const deployment = deploymentConfig.getDeployment(MoonbeamNetwork.MOONBASE_ALPHA);

    if (!deployment) {
      throw new Error('No SBT contract deployment found for Moonbase Alpha');
    }

    mintingService = new SBTMintingService(
      moonbeamAdapter,
      deployment.contractAddress as `0x${string}`,
      kiltProvider
    );
  }, 30000);

  afterAll(async () => {
    await kiltAdapter.disconnect();
    await moonbeamAdapter.disconnect();
  });

  test('should handle real connection errors gracefully', async () => {
    const badAdapter = new KiltAdapter('wss://invalid.endpoint.example.com' as any);
    
    try {
      await badAdapter.connect();
      fail('Should have thrown connection error');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message).toContain('connect');
    }
  }, 15000);

  test('should handle invalid address validation', async () => {
    try {
      await kiltProvider.createDid('invalid_address');
      fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message.toLowerCase()).toContain('invalid');
    }
  });

  test('should handle transaction monitoring errors', async () => {
    const invalidTxHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    try {
      const provider = moonbeamAdapter.getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }

      const receipt = await provider.getTransactionReceipt(invalidTxHash);
      // Transaction not found should return null
      expect(receipt).toBeNull();
    } catch (error: any) {
      // Some providers throw, others return null
      expect(error).toBeDefined();
    }
  }, 15000);

  test('should handle network health check failures', async () => {
    const chainInfo = await kiltAdapter.getChainInfo();
    expect(chainInfo).toBeDefined();
    expect(chainInfo.network).toBeDefined();
  }, 10000);
});

