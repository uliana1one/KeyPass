/**
 * Error Handling Module
 * 
 * Exports all error types and utilities
 */

// Base wallet errors
export * from './WalletErrors.js';

// Blockchain-specific errors
export {
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
} from './BlockchainErrors.js';

export type {
  BlockchainErrorCode,
  ErrorContext,
} from './BlockchainErrors.js';

