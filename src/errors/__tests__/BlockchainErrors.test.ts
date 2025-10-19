/**
 * Tests for Blockchain Error Handling
 */

import {
  BlockchainError,
  KILTBlockchainError,
  MoonbeamBlockchainError,
  ErrorFactory,
  ErrorMessageFormatter,
  ErrorSeverity,
  ErrorCategory,
  KILTErrorCode,
  MoonbeamErrorCode,
  isRetryableError,
  getErrorSeverity,
} from '../BlockchainErrors';

describe('BlockchainErrors', () => {
  describe('BlockchainError Base Class', () => {
    test('should create basic blockchain error', () => {
      const error = new BlockchainError(
        'Test error',
        KILTErrorCode.CONNECTION_FAILED,
        ErrorCategory.NETWORK,
        ErrorSeverity.HIGH
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(KILTErrorCode.CONNECTION_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.name).toBe('BlockchainError');
    });

    test('should mark network errors as retryable by default', () => {
      const error = new BlockchainError(
        'Network error',
        KILTErrorCode.NETWORK_ERROR,
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM
      );

      expect(error.retryable).toBe(true);
    });

    test('should mark user errors as non-retryable by default', () => {
      const error = new BlockchainError(
        'Invalid input',
        KILTErrorCode.INVALID_ADDRESS,
        ErrorCategory.USER,
        ErrorSeverity.MEDIUM
      );

      expect(error.retryable).toBe(false);
    });

    test('should respect explicit retryable flag in context', () => {
      const error = new BlockchainError(
        'Custom error',
        KILTErrorCode.TRANSACTION_FAILED,
        ErrorCategory.TRANSACTION,
        ErrorSeverity.HIGH,
        { retryable: true }
      );

      expect(error.retryable).toBe(true);
    });

    test('should format error message with context', () => {
      const error = new BlockchainError(
        'Transaction failed',
        MoonbeamErrorCode.TRANSACTION_FAILED,
        ErrorCategory.TRANSACTION,
        ErrorSeverity.HIGH,
        {
          blockchain: 'moonbeam',
          operation: 'mint',
          transactionHash: '0x1234567890abcdef',
          blockNumber: 12345,
        }
      );

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('MOONBEAM_2200');
      expect(formatted).toContain('Transaction failed');
      expect(formatted).toContain('blockchain: moonbeam');
      expect(formatted).toContain('operation: mint');
      expect(formatted).toContain('tx: 0x12345678');
      expect(formatted).toContain('block: 12345');
    });

    test('should convert error to JSON', () => {
      const error = new BlockchainError(
        'Test error',
        KILTErrorCode.DID_NOT_FOUND,
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        { address: '0xtest' }
      );

      const json = error.toJSON();
      expect(json).toHaveProperty('name', 'BlockchainError');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('code', KILTErrorCode.DID_NOT_FOUND);
      expect(json).toHaveProperty('category', ErrorCategory.VALIDATION);
      expect(json).toHaveProperty('severity', ErrorSeverity.MEDIUM);
      expect(json).toHaveProperty('retryable');
      expect(json).toHaveProperty('context');
      expect(json).toHaveProperty('timestamp');
    });
  });

  describe('KILTBlockchainError', () => {
    test('should create KILT-specific error', () => {
      const error = new KILTBlockchainError(
        'KILT error',
        KILTErrorCode.DID_NOT_FOUND,
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM
      );

      expect(error.name).toBe('KILTBlockchainError');
      expect(error.context?.blockchain).toBe('kilt');
    });

    test('should preserve existing blockchain context', () => {
      const error = new KILTBlockchainError(
        'KILT error',
        KILTErrorCode.DID_NOT_FOUND,
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        { blockchain: 'moonbeam', operation: 'test' } // Should be overridden
      );

      expect(error.context?.blockchain).toBe('kilt');
      expect(error.context?.operation).toBe('test');
    });
  });

  describe('MoonbeamBlockchainError', () => {
    test('should create Moonbeam-specific error', () => {
      const error = new MoonbeamBlockchainError(
        'Moonbeam error',
        MoonbeamErrorCode.SBT_MINT_FAILED,
        ErrorCategory.CONTRACT,
        ErrorSeverity.HIGH
      );

      expect(error.name).toBe('MoonbeamBlockchainError');
      expect(error.context?.blockchain).toBe('moonbeam');
    });
  });

  describe('ErrorFactory - KILT Errors', () => {
    test('should create KILT connection error', () => {
      const error = ErrorFactory.kiltConnectionError('Connection lost');

      expect(error.code).toBe(KILTErrorCode.CONNECTION_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
    });

    test('should create KILT DID not found error', () => {
      const error = ErrorFactory.kiltDIDNotFound('did:kilt:4test');

      expect(error.code).toBe(KILTErrorCode.DID_NOT_FOUND);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.message).toContain('did:kilt:4test');
    });

    test('should create KILT transaction failed error', () => {
      const error = ErrorFactory.kiltTransactionFailed('Transaction rejected');

      expect(error.code).toBe(KILTErrorCode.TRANSACTION_FAILED);
      expect(error.category).toBe(ErrorCategory.TRANSACTION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    test('should create KILT insufficient balance error', () => {
      const error = ErrorFactory.kiltInsufficientBalance('4address123');

      expect(error.code).toBe(KILTErrorCode.INSUFFICIENT_BALANCE);
      expect(error.category).toBe(ErrorCategory.USER);
      expect(error.retryable).toBe(false);
      expect(error.context?.address).toBe('4address123');
    });

    test('should create KILT invalid address error', () => {
      const error = ErrorFactory.kiltInvalidAddress('invalid');

      expect(error.code).toBe(KILTErrorCode.INVALID_ADDRESS);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.retryable).toBe(false);
    });
  });

  describe('ErrorFactory - Moonbeam Errors', () => {
    test('should create Moonbeam connection error', () => {
      const error = ErrorFactory.moonbeamConnectionError('Provider unavailable');

      expect(error.code).toBe(MoonbeamErrorCode.CONNECTION_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
    });

    test('should create Moonbeam contract error', () => {
      const error = ErrorFactory.moonbeamContractError('Contract call failed');

      expect(error.code).toBe(MoonbeamErrorCode.CONTRACT_EXECUTION_FAILED);
      expect(error.category).toBe(ErrorCategory.CONTRACT);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    test('should create Moonbeam transaction failed error', () => {
      const error = ErrorFactory.moonbeamTransactionFailed('Transaction rejected');

      expect(error.code).toBe(MoonbeamErrorCode.TRANSACTION_FAILED);
      expect(error.category).toBe(ErrorCategory.TRANSACTION);
    });

    test('should create Moonbeam transaction reverted error', () => {
      const error = ErrorFactory.moonbeamTransactionReverted('Reverted with reason');

      expect(error.code).toBe(MoonbeamErrorCode.TRANSACTION_REVERTED);
      expect(error.retryable).toBe(false);
    });

    test('should create Moonbeam insufficient balance error', () => {
      const error = ErrorFactory.moonbeamInsufficientBalance('0x123');

      expect(error.code).toBe(MoonbeamErrorCode.INSUFFICIENT_BALANCE);
      expect(error.category).toBe(ErrorCategory.USER);
      expect(error.retryable).toBe(false);
    });

    test('should create Moonbeam SBT mint failed error', () => {
      const error = ErrorFactory.moonbeamSBTMintFailed('Max supply exceeded');

      expect(error.code).toBe(MoonbeamErrorCode.SBT_MINT_FAILED);
      expect(error.category).toBe(ErrorCategory.CONTRACT);
    });

    test('should create Moonbeam invalid address error', () => {
      const error = ErrorFactory.moonbeamInvalidAddress('0xinvalid');

      expect(error.code).toBe(MoonbeamErrorCode.INVALID_ADDRESS);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.retryable).toBe(false);
    });

    test('should create IPFS upload failed error', () => {
      const error = ErrorFactory.ipfsUploadFailed('Upload timeout');

      expect(error.code).toBe(MoonbeamErrorCode.IPFS_UPLOAD_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.retryable).toBe(true);
    });
  });

  describe('ErrorFactory - fromUnknown', () => {
    test('should parse KILT connection error from string', () => {
      const error = ErrorFactory.fromUnknown('WebSocket connection failed', 'kilt');

      expect(error.code).toBe(KILTErrorCode.CONNECTION_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
    });

    test('should parse KILT insufficient balance error', () => {
      const error = ErrorFactory.fromUnknown('Insufficient balance', 'kilt', { address: '4test' });

      expect(error.code).toBe(KILTErrorCode.INSUFFICIENT_BALANCE);
      expect(error.category).toBe(ErrorCategory.USER);
    });

    test('should parse KILT DID not found error', () => {
      const error = ErrorFactory.fromUnknown('DID not found', 'kilt');

      expect(error.code).toBe(KILTErrorCode.DID_NOT_FOUND);
    });

    test('should parse KILT invalid address error', () => {
      const error = ErrorFactory.fromUnknown('Invalid address format', 'kilt');

      expect(error.code).toBe(KILTErrorCode.INVALID_ADDRESS);
    });

    test('should parse Moonbeam connection error', () => {
      const error = ErrorFactory.fromUnknown('Provider connection timeout', 'moonbeam');

      expect(error.code).toBe(MoonbeamErrorCode.CONNECTION_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
    });

    test('should parse Moonbeam reverted error', () => {
      const error = ErrorFactory.fromUnknown('Transaction reverted', 'moonbeam');

      expect(error.code).toBe(MoonbeamErrorCode.TRANSACTION_REVERTED);
      expect(error.retryable).toBe(false);
    });

    test('should parse Moonbeam insufficient balance error', () => {
      const error = ErrorFactory.fromUnknown('Insufficient balance', 'moonbeam');

      expect(error.code).toBe(MoonbeamErrorCode.INSUFFICIENT_BALANCE);
    });

    test('should parse Moonbeam contract error', () => {
      const error = ErrorFactory.fromUnknown('Contract execution failed', 'moonbeam');

      expect(error.code).toBe(MoonbeamErrorCode.CONTRACT_EXECUTION_FAILED);
    });

    test('should parse IPFS error', () => {
      const error = ErrorFactory.fromUnknown('IPFS upload failed', 'moonbeam');

      expect(error.code).toBe(MoonbeamErrorCode.IPFS_UPLOAD_FAILED);
      expect(error.retryable).toBe(true);
    });

    test('should return existing BlockchainError unchanged', () => {
      const original = ErrorFactory.kiltConnectionError('Test');
      const parsed = ErrorFactory.fromUnknown(original, 'kilt');

      expect(parsed).toBe(original);
    });

    test('should handle Error objects', () => {
      const jsError = new Error('Connection timeout');
      const error = ErrorFactory.fromUnknown(jsError, 'kilt');

      expect(error.originalError).toBe(jsError);
      expect(error.message).toBe('Connection timeout');
    });

    test('should default to transaction error for unknown patterns', () => {
      const kiltError = ErrorFactory.fromUnknown('Unknown error', 'kilt');
      const moonbeamError = ErrorFactory.fromUnknown('Unknown error', 'moonbeam');

      expect(kiltError.code).toBe(KILTErrorCode.TRANSACTION_FAILED);
      expect(moonbeamError.code).toBe(MoonbeamErrorCode.TRANSACTION_FAILED);
    });
  });

  describe('ErrorMessageFormatter', () => {
    test('should format error for user (simplified)', () => {
      const error = ErrorFactory.moonbeamInsufficientBalance('0x123');
      const message = ErrorMessageFormatter.forUser(error);

      expect(message).toBe('Insufficient funds to complete this transaction');
    });

    test('should format invalid address error for user', () => {
      const error = ErrorFactory.kiltInvalidAddress('invalid');
      const message = ErrorMessageFormatter.forUser(error);

      expect(message).toBe('Invalid address format');
    });

    test('should format transaction reverted error for user', () => {
      const error = ErrorFactory.moonbeamTransactionReverted('Reverted');
      const message = ErrorMessageFormatter.forUser(error);

      expect(message).toBe('Transaction was rejected by the blockchain');
    });

    test('should format IPFS error for user', () => {
      const error = ErrorFactory.ipfsUploadFailed('Upload failed');
      const message = ErrorMessageFormatter.forUser(error);

      expect(message).toContain('Failed to upload metadata');
      expect(message).toContain('Please try again');
    });

    test('should add retry suggestion for retryable errors', () => {
      const error = ErrorFactory.kiltConnectionError('Connection lost');
      const message = ErrorMessageFormatter.forUser(error);

      expect(message).toContain('Please try again');
    });

    test('should format error for developer (detailed)', () => {
      const error = new BlockchainError(
        'Transaction failed',
        MoonbeamErrorCode.TRANSACTION_FAILED,
        ErrorCategory.TRANSACTION,
        ErrorSeverity.HIGH,
        {
          blockchain: 'moonbeam',
          transactionHash: '0x123abc',
          blockNumber: 12345,
        }
      );

      const message = ErrorMessageFormatter.forDeveloper(error);

      expect(message).toContain('MOONBEAM_2200');
      expect(message).toContain('Transaction failed');
      expect(message).toContain('blockchain: moonbeam');
    });

    test('should format error for logging', () => {
      const originalError = new Error('Network timeout');
      const error = ErrorFactory.kiltConnectionError('Connection failed', {}, originalError);

      const message = ErrorMessageFormatter.forLogging(error);

      expect(message).toContain('[HIGH]');
      expect(message).toContain('[NETWORK]');
      expect(message).toContain('Connection failed');
      expect(message).toContain('Original: Network timeout');
    });

    test('should include stack trace in logging format', () => {
      const originalError = new Error('Test error');
      const error = ErrorFactory.moonbeamContractError('Contract failed', {}, originalError);

      const message = ErrorMessageFormatter.forLogging(error);

      expect(message).toContain('Stack:');
    });
  });

  describe('Utility Functions', () => {
    test('isRetryableError should detect retryable BlockchainError', () => {
      const retryable = ErrorFactory.kiltConnectionError('Connection lost');
      const nonRetryable = ErrorFactory.kiltInvalidAddress('invalid');

      expect(isRetryableError(retryable)).toBe(true);
      expect(isRetryableError(nonRetryable)).toBe(false);
    });

    test('isRetryableError should detect retryable patterns in messages', () => {
      expect(isRetryableError(new Error('Network timeout'))).toBe(true);
      expect(isRetryableError(new Error('Connection error'))).toBe(true);
      expect(isRetryableError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isRetryableError(new Error('Nonce too low'))).toBe(true);
      expect(isRetryableError(new Error('Transaction underpriced'))).toBe(true);
    });

    test('isRetryableError should detect non-retryable errors', () => {
      expect(isRetryableError(new Error('Invalid signature'))).toBe(false);
      expect(isRetryableError(new Error('Reverted'))).toBe(false);
    });

    test('getErrorSeverity should return severity from BlockchainError', () => {
      const critical = new BlockchainError(
        'Critical',
        KILTErrorCode.CONNECTION_FAILED,
        ErrorCategory.NETWORK,
        ErrorSeverity.CRITICAL
      );

      expect(getErrorSeverity(critical)).toBe(ErrorSeverity.CRITICAL);
    });

    test('getErrorSeverity should infer severity from message', () => {
      expect(getErrorSeverity(new Error('CRITICAL failure'))).toBe(ErrorSeverity.CRITICAL);
      expect(getErrorSeverity(new Error('Fatal error'))).toBe(ErrorSeverity.CRITICAL);
      expect(getErrorSeverity(new Error('Transaction failed'))).toBe(ErrorSeverity.HIGH);
      expect(getErrorSeverity(new Error('Warning: invalid'))).toBe(ErrorSeverity.MEDIUM);
      expect(getErrorSeverity(new Error('Info message'))).toBe(ErrorSeverity.LOW);
    });

    test('getErrorSeverity should default to LOW for unknown errors', () => {
      expect(getErrorSeverity(new Error('Unknown'))).toBe(ErrorSeverity.LOW);
      expect(getErrorSeverity('String error')).toBe(ErrorSeverity.LOW);
    });
  });

  describe('Error Code Enums', () => {
    test('should have unique KILT error codes', () => {
      const codes = Object.values(KILTErrorCode);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    test('should have unique Moonbeam error codes', () => {
      const codes = Object.values(MoonbeamErrorCode);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    test('KILT error codes should start with KILT_', () => {
      Object.values(KILTErrorCode).forEach(code => {
        expect(code).toMatch(/^KILT_\d+$/);
      });
    });

    test('Moonbeam error codes should start with MOONBEAM_', () => {
      Object.values(MoonbeamErrorCode).forEach(code => {
        expect(code).toMatch(/^MOONBEAM_\d+$/);
      });
    });
  });

  describe('Error Context', () => {
    test('should preserve all context fields', () => {
      const context = {
        operation: 'mint',
        blockchain: 'moonbeam' as const,
        transactionHash: '0x123',
        blockNumber: 12345,
        address: '0xabc',
        contractAddress: '0xdef',
        tokenId: '1',
        gasUsed: '100000',
        timestamp: Date.now(),
        retryable: true,
        retryAttempt: 2,
        metadata: { custom: 'data' },
      };

      const error = new BlockchainError(
        'Test',
        MoonbeamErrorCode.SBT_MINT_FAILED,
        ErrorCategory.CONTRACT,
        ErrorSeverity.HIGH,
        context
      );

      expect(error.context).toMatchObject(context);
    });
  });
});

