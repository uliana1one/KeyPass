/**
 * Tests for Blockchain Error Handling - Moonbeam Only
 */

import {
  BlockchainError,
  MoonbeamBlockchainError,
  BlockchainErrorFactory,
  ErrorUtils,
  ErrorSeverity,
  ErrorCategory,
  MoonbeamErrorCode,
} from '../BlockchainErrors';

describe('BlockchainErrors - Moonbeam Only', () => {
  describe('BlockchainError Base Class', () => {
    test('should create basic blockchain error', () => {
      const error = new BlockchainError(
        'Test error',
        MoonbeamErrorCode.CONNECTION_FAILED,
        ErrorCategory.NETWORK,
        ErrorSeverity.HIGH,
        'moonbeam'
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(MoonbeamErrorCode.CONNECTION_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.name).toBe('BlockchainError');
      expect(error.blockchain).toBe('moonbeam');
    });

    test('should mark network errors as retryable by default', () => {
      const error = new BlockchainError(
        'Network error',
        MoonbeamErrorCode.CONNECTION_FAILED,
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM
      );

      expect(ErrorUtils.isRetryableError(error)).toBe(true);
    });

    test('should mark user errors as non-retryable by default', () => {
      const error = new BlockchainError(
        'Invalid input',
        MoonbeamErrorCode.INVALID_ADDRESS,
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM
      );

      expect(ErrorUtils.isRetryableError(error)).toBe(false);
    });

    test('should include transaction context', () => {
      const error = new BlockchainError(
        'Transaction failed',
        MoonbeamErrorCode.TRANSACTION_FAILED,
        ErrorCategory.TRANSACTION,
        ErrorSeverity.HIGH,
        'moonbeam',
        {
          transactionHash: '0x123...',
          blockNumber: 12345,
          gasLimit: '21000'
        }
      );

      expect(error.transactionHash).toBe('0x123...');
      expect(error.blockNumber).toBe(12345);
      expect(error.context?.gasLimit).toBe('21000');
    });
  });

  describe('MoonbeamBlockchainError', () => {
    test('should create Moonbeam-specific error', () => {
      const error = new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONNECTION_FAILED,
        'Moonbeam connection failed',
        ErrorCategory.NETWORK,
        ErrorSeverity.CRITICAL
      );

      expect(error.message).toBe('Moonbeam connection failed');
      expect(error.code).toBe(MoonbeamErrorCode.CONNECTION_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.name).toBe('MoonbeamBlockchainError');
      expect(error.blockchain).toBe('moonbeam');
    });

    test('should handle DID-specific errors', () => {
      const error = new MoonbeamBlockchainError(
        MoonbeamErrorCode.DID_CREATION_FAILED,
        'DID creation failed',
        ErrorCategory.CONTRACT,
        ErrorSeverity.HIGH
      );

      expect(error.code).toBe(MoonbeamErrorCode.DID_CREATION_FAILED);
      expect(error.category).toBe(ErrorCategory.CONTRACT);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    test('should handle SBT-specific errors', () => {
      const error = new MoonbeamBlockchainError(
        MoonbeamErrorCode.SBT_MINT_FAILED,
        'SBT minting failed',
        ErrorCategory.CONTRACT,
        ErrorSeverity.HIGH
      );

      expect(error.code).toBe(MoonbeamErrorCode.SBT_MINT_FAILED);
      expect(error.category).toBe(ErrorCategory.CONTRACT);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('ErrorFactory', () => {
    test('should create Moonbeam connection error', () => {
      const error = BlockchainErrorFactory.moonbeamConnectionError(
        'Connection failed',
        MoonbeamErrorCode.CONNECTION_FAILED
      );

      expect(error).toBeInstanceOf(MoonbeamBlockchainError);
      expect(error.code).toBe(MoonbeamErrorCode.CONNECTION_FAILED);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });

    test('should create Moonbeam transaction error', () => {
      const error = BlockchainErrorFactory.moonbeamTransactionError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        'Transaction failed',
        { transactionHash: '0x123...' }
      );

      expect(error).toBeInstanceOf(MoonbeamBlockchainError);
      expect(error.code).toBe(MoonbeamErrorCode.TRANSACTION_FAILED);
      expect(error.category).toBe(ErrorCategory.TRANSACTION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.transactionHash).toBe('0x123...');
    });

    test('should create Moonbeam DID error', () => {
      const error = BlockchainErrorFactory.moonbeamDIDError(
        MoonbeamErrorCode.DID_CREATION_FAILED,
        'DID creation failed'
      );

      expect(error).toBeInstanceOf(MoonbeamBlockchainError);
      expect(error.code).toBe(MoonbeamErrorCode.DID_CREATION_FAILED);
      expect(error.category).toBe(ErrorCategory.CONTRACT);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    test('should create Moonbeam SBT error', () => {
      const error = BlockchainErrorFactory.moonbeamSBTError(
        MoonbeamErrorCode.SBT_MINT_FAILED,
        'SBT minting failed'
      );

      expect(error).toBeInstanceOf(MoonbeamBlockchainError);
      expect(error.code).toBe(MoonbeamErrorCode.SBT_MINT_FAILED);
      expect(error.category).toBe(ErrorCategory.CONTRACT);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    test('should create error from code', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.CONNECTION_FAILED,
        'Connection failed'
      );

      expect(error).toBeInstanceOf(MoonbeamBlockchainError);
      expect(error.code).toBe(MoonbeamErrorCode.CONNECTION_FAILED);
      expect(error.message).toBe('Connection failed');
    });
  });

  describe('Error Categorization', () => {
    test('should categorize connection errors correctly', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.CONNECTION_FAILED,
        'Connection failed'
      );

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });

    test('should categorize transaction errors correctly', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        'Transaction failed'
      );

      expect(error.category).toBe(ErrorCategory.TRANSACTION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    test('should categorize contract errors correctly', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        'Contract call failed'
      );

      expect(error.category).toBe(ErrorCategory.CONTRACT);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('should categorize validation errors correctly', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.INVALID_ADDRESS,
        'Invalid address'
      );

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('should categorize user errors correctly', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.ACCOUNT_BALANCE_INSUFFICIENT,
        'Insufficient balance'
      );

      expect(error.category).toBe(ErrorCategory.USER);
      expect(error.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('Retry Logic', () => {
    test('should identify retryable errors', () => {
      const retryableErrors = [
        MoonbeamErrorCode.CONNECTION_FAILED,
        MoonbeamErrorCode.CONNECTION_TIMEOUT,
        MoonbeamErrorCode.RPC_ERROR,
        MoonbeamErrorCode.TRANSACTION_TIMEOUT,
        MoonbeamErrorCode.NETWORK_ERROR,
      ];

      retryableErrors.forEach(errorCode => {
        const error = BlockchainErrorFactory.fromCode(errorCode, 'Test error');
        expect(ErrorUtils.isRetryableError(error)).toBe(true);
      });
    });

    test('should identify non-retryable errors', () => {
      const nonRetryableErrors = [
        MoonbeamErrorCode.INVALID_ADDRESS,
        MoonbeamErrorCode.INSUFFICIENT_BALANCE,
        MoonbeamErrorCode.INVALID_PARAMETERS,
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        MoonbeamErrorCode.SBT_MINT_FAILED,
        MoonbeamErrorCode.DID_CREATION_FAILED,
      ];

      nonRetryableErrors.forEach(errorCode => {
        const error = BlockchainErrorFactory.fromCode(errorCode, 'Test error');
        expect(ErrorUtils.isRetryableError(error)).toBe(false);
      });
    });
  });

  describe('Error Message Formatting', () => {
    test('should format user-friendly messages', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.CONNECTION_FAILED,
        'Connection failed'
      );

      const userMessage = error.toUserMessage();
      expect(userMessage).toContain('Network connection issue');
      expect(userMessage).toContain('check your internet connection');
    });

    test('should format developer-friendly messages', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        'Transaction failed'
      );

      const devMessage = error.toDeveloperMessage();
      expect(devMessage).toContain('MoonbeamBlockchainError');
      expect(devMessage).toContain('MOONBEAM_2200');
      expect(devMessage).toContain('Transaction failed');
    });

    test('should format log-friendly messages', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        'Contract call failed'
      );

      const logMessage = error.toLogMessage();
      expect(logMessage).toContain('MoonbeamBlockchainError');
      expect(logMessage).toContain('MOONBEAM_2107');
      expect(logMessage).toContain('medium');
      expect(logMessage).toContain('contract');
    });
  });

  describe('Error Severity', () => {
    test('should assign correct severity levels', () => {
      const criticalError = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.CONNECTION_FAILED,
        'Connection failed'
      );
      expect(criticalError.severity).toBe(ErrorSeverity.CRITICAL);

      const highError = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        'Transaction failed'
      );
      expect(highError.severity).toBe(ErrorSeverity.HIGH);

      const mediumError = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.INVALID_ADDRESS,
        'Invalid address'
      );
      expect(mediumError.severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('should get error severity from code', () => {
      const criticalError = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.CONNECTION_FAILED,
        'Connection failed'
      );
      expect(criticalError.severity).toBe(ErrorSeverity.CRITICAL);

      const highError = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        'Transaction failed'
      );
      expect(highError.severity).toBe(ErrorSeverity.HIGH);

      const mediumError = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.INVALID_ADDRESS,
        'Invalid address'
      );
      expect(mediumError.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Error Context', () => {
    test('should preserve error context', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        'Transaction failed',
        {
          transactionHash: '0x123...',
          blockNumber: 12345,
          gasLimit: '21000',
          gasUsed: '25000'
        }
      );

      expect(error.transactionHash).toBe('0x123...');
      expect(error.blockNumber).toBe(12345);
      expect(error.context?.gasLimit).toBe('21000');
      expect(error.context?.gasUsed).toBe('25000');
    });

    test('should handle missing context gracefully', () => {
      const error = BlockchainErrorFactory.fromCode(
        MoonbeamErrorCode.CONNECTION_FAILED,
        'Connection failed'
      );

      expect(error.transactionHash).toBeUndefined();
      expect(error.blockNumber).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
  });
});