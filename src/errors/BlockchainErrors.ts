/**
 * Blockchain-Specific Error Handling
 * 
 * Comprehensive error types, codes, and utilities for KILT and Moonbeam blockchain operations.
 * Provides structured error handling with categorization, severity levels, and factory functions.
 */

import { WalletError } from './WalletErrors.js';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  NETWORK = 'network',
  CONTRACT = 'contract',
  USER = 'user',
  TRANSACTION = 'transaction',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown',
}

/**
 * KILT-specific error codes
 */
export enum KILTErrorCode {
  // Connection errors (1000-1099)
  CONNECTION_FAILED = 'KILT_1000',
  CONNECTION_TIMEOUT = 'KILT_1001',
  CONNECTION_LOST = 'KILT_1002',
  RPC_ERROR = 'KILT_1003',
  WEBSOCKET_ERROR = 'KILT_1004',
  
  // DID errors (1100-1199)
  DID_NOT_FOUND = 'KILT_1100',
  DID_ALREADY_EXISTS = 'KILT_1101',
  DID_CREATION_FAILED = 'KILT_1102',
  DID_UPDATE_FAILED = 'KILT_1103',
  DID_DELETION_FAILED = 'KILT_1104',
  DID_INVALID_FORMAT = 'KILT_1105',
  DID_RESOLUTION_FAILED = 'KILT_1106',
  
  // Transaction errors (1200-1299)
  TRANSACTION_FAILED = 'KILT_1200',
  TRANSACTION_TIMEOUT = 'KILT_1201',
  TRANSACTION_REVERTED = 'KILT_1202',
  TRANSACTION_REJECTED = 'KILT_1203',
  INSUFFICIENT_BALANCE = 'KILT_1204',
  NONCE_TOO_LOW = 'KILT_1205',
  NONCE_TOO_HIGH = 'KILT_1206',
  GAS_LIMIT_EXCEEDED = 'KILT_1207',
  TRANSACTION_ALREADY_IMPORTED = 'KILT_1208',
  
  // Pallet errors (1300-1399)
  PALLET_DID_ERROR = 'KILT_1300',
  PALLET_ATTESTATION_ERROR = 'KILT_1301',
  PALLET_DELEGATION_ERROR = 'KILT_1302',
  PALLET_CTYPE_ERROR = 'KILT_1303',
  
  // Validation errors (1400-1499)
  INVALID_ADDRESS = 'KILT_1400',
  INVALID_SIGNATURE = 'KILT_1401',
  INVALID_EXTRINSIC = 'KILT_1402',
  INVALID_METADATA = 'KILT_1403',
  INVALID_KEY_TYPE = 'KILT_1404',
  
  // Account errors (1500-1599)
  ACCOUNT_NOT_FOUND = 'KILT_1500',
  ACCOUNT_LOCKED = 'KILT_1501',
  INSUFFICIENT_FUNDS = 'KILT_1502',
  
  // Network errors (1600-1699)
  NETWORK_ERROR = 'KILT_1600',
  NETWORK_CONGESTION = 'KILT_1601',
  BLOCK_NOT_FOUND = 'KILT_1602',
  CHAIN_SYNCING = 'KILT_1603',
}

/**
 * Moonbeam-specific error codes
 */
export enum MoonbeamErrorCode {
  // Connection errors (2000-2099)
  CONNECTION_FAILED = 'MOONBEAM_2000',
  CONNECTION_TIMEOUT = 'MOONBEAM_2001',
  CONNECTION_LOST = 'MOONBEAM_2002',
  RPC_ERROR = 'MOONBEAM_2003',
  PROVIDER_ERROR = 'MOONBEAM_2004',
  
  // Contract errors (2100-2199)
  CONTRACT_NOT_FOUND = 'MOONBEAM_2100',
  CONTRACT_EXECUTION_FAILED = 'MOONBEAM_2101',
  CONTRACT_DEPLOYMENT_FAILED = 'MOONBEAM_2102',
  CONTRACT_CALL_REVERTED = 'MOONBEAM_2103',
  CONTRACT_INVALID_ABI = 'MOONBEAM_2104',
  CONTRACT_INVALID_BYTECODE = 'MOONBEAM_2105',
  CONTRACT_INSUFFICIENT_GAS = 'MOONBEAM_2106',
  
  // Transaction errors (2200-2299)
  TRANSACTION_FAILED = 'MOONBEAM_2200',
  TRANSACTION_TIMEOUT = 'MOONBEAM_2201',
  TRANSACTION_REVERTED = 'MOONBEAM_2202',
  TRANSACTION_REJECTED = 'MOONBEAM_2203',
  TRANSACTION_UNDERPRICED = 'MOONBEAM_2204',
  REPLACEMENT_UNDERPRICED = 'MOONBEAM_2205',
  INSUFFICIENT_BALANCE = 'MOONBEAM_2206',
  NONCE_TOO_LOW = 'MOONBEAM_2207',
  NONCE_TOO_HIGH = 'MOONBEAM_2208',
  GAS_LIMIT_EXCEEDED = 'MOONBEAM_2209',
  INTRINSIC_GAS_TOO_LOW = 'MOONBEAM_2210',
  
  // SBT errors (2300-2399)
  SBT_MINT_FAILED = 'MOONBEAM_2300',
  SBT_BURN_FAILED = 'MOONBEAM_2301',
  SBT_TRANSFER_BLOCKED = 'MOONBEAM_2302',
  SBT_TOKEN_NOT_FOUND = 'MOONBEAM_2303',
  SBT_MAX_SUPPLY_EXCEEDED = 'MOONBEAM_2304',
  SBT_ALREADY_REVOKED = 'MOONBEAM_2305',
  SBT_NOT_OWNER = 'MOONBEAM_2306',
  
  // Validation errors (2400-2499)
  INVALID_ADDRESS = 'MOONBEAM_2400',
  INVALID_SIGNATURE = 'MOONBEAM_2401',
  INVALID_TRANSACTION = 'MOONBEAM_2402',
  INVALID_GAS_PRICE = 'MOONBEAM_2403',
  INVALID_CHAIN_ID = 'MOONBEAM_2404',
  
  // Account errors (2500-2599)
  ACCOUNT_NOT_FOUND = 'MOONBEAM_2500',
  INSUFFICIENT_FUNDS = 'MOONBEAM_2501',
  
  // Network errors (2600-2699)
  NETWORK_ERROR = 'MOONBEAM_2600',
  NETWORK_CONGESTION = 'MOONBEAM_2601',
  BLOCK_NOT_FOUND = 'MOONBEAM_2602',
  
  // IPFS/Metadata errors (2700-2799)
  IPFS_UPLOAD_FAILED = 'MOONBEAM_2700',
  IPFS_RETRIEVAL_FAILED = 'MOONBEAM_2701',
  METADATA_INVALID = 'MOONBEAM_2702',
}

/**
 * Error code type union
 */
export type BlockchainErrorCode = KILTErrorCode | MoonbeamErrorCode;

/**
 * Error context for detailed error information
 */
export interface ErrorContext {
  operation?: string;
  blockchain?: 'kilt' | 'moonbeam';
  transactionHash?: string;
  blockNumber?: number;
  address?: string;
  contractAddress?: string;
  tokenId?: string;
  gasUsed?: string;
  timestamp?: number;
  retryable?: boolean;
  retryAttempt?: number;
  metadata?: Record<string, any>;
}

/**
 * Base blockchain error class
 */
export class BlockchainError extends WalletError {
  public readonly code: BlockchainErrorCode;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: BlockchainErrorCode,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message, code as string);
    this.name = 'BlockchainError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.originalError = originalError;
    this.retryable = context?.retryable ?? this.isRetryableByDefault();
  }

  /**
   * Determine if error is retryable by default based on category
   */
  private isRetryableByDefault(): boolean {
    // Network errors are typically retryable
    if (this.category === ErrorCategory.NETWORK) {
      return true;
    }

    // Some transaction errors are retryable
    if (this.category === ErrorCategory.TRANSACTION) {
      const retryableCodes = [
        KILTErrorCode.TRANSACTION_TIMEOUT,
        KILTErrorCode.NONCE_TOO_LOW,
        MoonbeamErrorCode.TRANSACTION_TIMEOUT,
        MoonbeamErrorCode.TRANSACTION_UNDERPRICED,
        MoonbeamErrorCode.REPLACEMENT_UNDERPRICED,
        MoonbeamErrorCode.NONCE_TOO_LOW,
      ];
      return retryableCodes.includes(this.code as any);
    }

    // User and validation errors are not retryable
    if (this.category === ErrorCategory.USER || this.category === ErrorCategory.VALIDATION) {
      return false;
    }

    return false;
  }

  /**
   * Get formatted error message
   */
  public getFormattedMessage(): string {
    let formatted = `[${this.code}] ${this.message}`;

    if (this.context) {
      const contextParts: string[] = [];

      if (this.context.blockchain) {
        contextParts.push(`blockchain: ${this.context.blockchain}`);
      }
      if (this.context.operation) {
        contextParts.push(`operation: ${this.context.operation}`);
      }
      if (this.context.transactionHash) {
        contextParts.push(`tx: ${this.context.transactionHash.substring(0, 10)}...`);
      }
      if (this.context.blockNumber) {
        contextParts.push(`block: ${this.context.blockNumber}`);
      }
      if (this.context.address) {
        contextParts.push(`address: ${this.context.address.substring(0, 10)}...`);
      }

      if (contextParts.length > 0) {
        formatted += ` (${contextParts.join(', ')})`;
      }
    }

    return formatted;
  }

  /**
   * Get error details as JSON
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      retryable: this.retryable,
      context: this.context,
      timestamp: Date.now(),
    };
  }
}

/**
 * KILT-specific error class
 */
export class KILTBlockchainError extends BlockchainError {
  constructor(
    message: string,
    code: KILTErrorCode,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message, code, category, severity, { ...context, blockchain: 'kilt' }, originalError);
    this.name = 'KILTBlockchainError';
  }
}

/**
 * Moonbeam-specific error class
 */
export class MoonbeamBlockchainError extends BlockchainError {
  constructor(
    message: string,
    code: MoonbeamErrorCode,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message, code, category, severity, { ...context, blockchain: 'moonbeam' }, originalError);
    this.name = 'MoonbeamBlockchainError';
  }
}

/**
 * Error factory functions
 */
export class BlockchainErrorFactory {
  /**
   * Create KILT connection error
   */
  static kiltConnectionError(message: string, context?: ErrorContext, originalError?: Error): KILTBlockchainError {
    return new KILTBlockchainError(
      message,
      KILTErrorCode.CONNECTION_FAILED,
      ErrorCategory.NETWORK,
      ErrorSeverity.HIGH,
      context,
      originalError
    );
  }

  /**
   * Create KILT DID not found error
   */
  static kiltDIDNotFound(did: string, context?: ErrorContext): KILTBlockchainError {
    return new KILTBlockchainError(
      `DID not found: ${did}`,
      KILTErrorCode.DID_NOT_FOUND,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  /**
   * Create KILT transaction failed error
   */
  static kiltTransactionFailed(message: string, context?: ErrorContext, originalError?: Error): KILTBlockchainError {
    return new KILTBlockchainError(
      message,
      KILTErrorCode.TRANSACTION_FAILED,
      ErrorCategory.TRANSACTION,
      ErrorSeverity.HIGH,
      context,
      originalError
    );
  }

  /**
   * Create KILT insufficient balance error
   */
  static kiltInsufficientBalance(address: string, context?: ErrorContext): KILTBlockchainError {
    return new KILTBlockchainError(
      `Insufficient balance for address: ${address}`,
      KILTErrorCode.INSUFFICIENT_BALANCE,
      ErrorCategory.USER,
      ErrorSeverity.MEDIUM,
      { ...context, address, retryable: false }
    );
  }

  /**
   * Create KILT invalid address error
   */
  static kiltInvalidAddress(address: string, context?: ErrorContext): KILTBlockchainError {
    return new KILTBlockchainError(
      `Invalid KILT address: ${address}`,
      KILTErrorCode.INVALID_ADDRESS,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      { ...context, address, retryable: false }
    );
  }

  /**
   * Create Moonbeam connection error
   */
  static moonbeamConnectionError(message: string, context?: ErrorContext, originalError?: Error): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      message,
      MoonbeamErrorCode.CONNECTION_FAILED,
      ErrorCategory.NETWORK,
      ErrorSeverity.HIGH,
      context,
      originalError
    );
  }

  /**
   * Create Moonbeam contract error
   */
  static moonbeamContractError(message: string, context?: ErrorContext, originalError?: Error): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      message,
      MoonbeamErrorCode.CONTRACT_EXECUTION_FAILED,
      ErrorCategory.CONTRACT,
      ErrorSeverity.HIGH,
      context,
      originalError
    );
  }

  /**
   * Create Moonbeam transaction failed error
   */
  static moonbeamTransactionFailed(message: string, context?: ErrorContext, originalError?: Error): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      message,
      MoonbeamErrorCode.TRANSACTION_FAILED,
      ErrorCategory.TRANSACTION,
      ErrorSeverity.HIGH,
      context,
      originalError
    );
  }

  /**
   * Create Moonbeam transaction reverted error
   */
  static moonbeamTransactionReverted(message: string, context?: ErrorContext, originalError?: Error): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      message,
      MoonbeamErrorCode.TRANSACTION_REVERTED,
      ErrorCategory.TRANSACTION,
      ErrorSeverity.HIGH,
      { ...context, retryable: false },
      originalError
    );
  }

  /**
   * Create Moonbeam insufficient balance error
   */
  static moonbeamInsufficientBalance(address: string, context?: ErrorContext): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      `Insufficient balance for address: ${address}`,
      MoonbeamErrorCode.INSUFFICIENT_BALANCE,
      ErrorCategory.USER,
      ErrorSeverity.MEDIUM,
      { ...context, address, retryable: false }
    );
  }

  /**
   * Create Moonbeam SBT mint failed error
   */
  static moonbeamSBTMintFailed(message: string, context?: ErrorContext, originalError?: Error): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      message,
      MoonbeamErrorCode.SBT_MINT_FAILED,
      ErrorCategory.CONTRACT,
      ErrorSeverity.HIGH,
      context,
      originalError
    );
  }

  /**
   * Create Moonbeam invalid address error
   */
  static moonbeamInvalidAddress(address: string, context?: ErrorContext): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      `Invalid Moonbeam address: ${address}`,
      MoonbeamErrorCode.INVALID_ADDRESS,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      { ...context, address, retryable: false }
    );
  }

  /**
   * Create IPFS upload failed error
   */
  static ipfsUploadFailed(message: string, context?: ErrorContext, originalError?: Error): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      message,
      MoonbeamErrorCode.IPFS_UPLOAD_FAILED,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      { ...context, retryable: true },
      originalError
    );
  }

  /**
   * Parse error from unknown source and create appropriate blockchain error
   */
  static fromUnknown(error: unknown, blockchain: 'kilt' | 'moonbeam', context?: ErrorContext): BlockchainError {
    if (error instanceof BlockchainError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const originalError = error instanceof Error ? error : undefined;

    // Try to infer error type from message
    const lowerMessage = errorMessage.toLowerCase();

    if (blockchain === 'kilt') {
      // KILT-specific error detection
      if (lowerMessage.includes('connection') || lowerMessage.includes('websocket')) {
        return BlockchainErrorFactory.kiltConnectionError(errorMessage, context, originalError);
      }
      if (lowerMessage.includes('insufficient') && lowerMessage.includes('balance')) {
        return BlockchainErrorFactory.kiltInsufficientBalance(context?.address || 'unknown', context);
      }
      if (lowerMessage.includes('did not found')) {
        return BlockchainErrorFactory.kiltDIDNotFound(context?.address || 'unknown', context);
      }
      if (lowerMessage.includes('invalid') && lowerMessage.includes('address')) {
        return BlockchainErrorFactory.kiltInvalidAddress(context?.address || 'unknown', context);
      }

      // Default KILT transaction error
      return BlockchainErrorFactory.kiltTransactionFailed(errorMessage, context, originalError);
    } else {
      // Moonbeam-specific error detection
      if (lowerMessage.includes('connection') || lowerMessage.includes('provider')) {
        return BlockchainErrorFactory.moonbeamConnectionError(errorMessage, context, originalError);
      }
      if (lowerMessage.includes('reverted')) {
        return BlockchainErrorFactory.moonbeamTransactionReverted(errorMessage, context, originalError);
      }
      if (lowerMessage.includes('insufficient') && lowerMessage.includes('balance')) {
        return BlockchainErrorFactory.moonbeamInsufficientBalance(context?.address || 'unknown', context);
      }
      if (lowerMessage.includes('invalid') && lowerMessage.includes('address')) {
        return BlockchainErrorFactory.moonbeamInvalidAddress(context?.address || 'unknown', context);
      }
      if (lowerMessage.includes('contract')) {
        return BlockchainErrorFactory.moonbeamContractError(errorMessage, context, originalError);
      }
      if (lowerMessage.includes('ipfs')) {
        return BlockchainErrorFactory.ipfsUploadFailed(errorMessage, context, originalError);
      }

      // Default Moonbeam transaction error
      return BlockchainErrorFactory.moonbeamTransactionFailed(errorMessage, context, originalError);
    }
  }
}

/**
 * Error message formatter
 */
export class ErrorMessageFormatter {
  /**
   * Format error for user display (simplified, user-friendly)
   */
  static forUser(error: BlockchainError): string {
    const categoryMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]: 'Network connection issue',
      [ErrorCategory.CONTRACT]: 'Smart contract error',
      [ErrorCategory.USER]: 'Invalid input or insufficient funds',
      [ErrorCategory.TRANSACTION]: 'Transaction failed',
      [ErrorCategory.VALIDATION]: 'Validation error',
      [ErrorCategory.CONFIGURATION]: 'Configuration error',
      [ErrorCategory.UNKNOWN]: 'An error occurred',
    };

    let message = categoryMessages[error.category] || 'An error occurred';

    // Add specific details for common user errors
    if (error.code === KILTErrorCode.INSUFFICIENT_BALANCE || error.code === MoonbeamErrorCode.INSUFFICIENT_BALANCE) {
      message = 'Insufficient funds to complete this transaction';
    } else if (error.code === KILTErrorCode.INVALID_ADDRESS || error.code === MoonbeamErrorCode.INVALID_ADDRESS) {
      message = 'Invalid address format';
    } else if (error.code === MoonbeamErrorCode.TRANSACTION_REVERTED) {
      message = 'Transaction was rejected by the blockchain';
    } else if (error.code === MoonbeamErrorCode.IPFS_UPLOAD_FAILED) {
      message = 'Failed to upload metadata';
    }

    // Add retry suggestion if applicable (and not already included)
    if (error.retryable && !message.includes('try again')) {
      message += '. Please try again';
    }

    return message;
  }

  /**
   * Format error for developer/debug display (detailed)
   */
  static forDeveloper(error: BlockchainError): string {
    return error.getFormattedMessage();
  }

  /**
   * Format error for logging
   */
  static forLogging(error: BlockchainError): string {
    const parts = [
      `[${error.severity.toUpperCase()}]`,
      `[${error.category.toUpperCase()}]`,
      error.getFormattedMessage(),
    ];

    if (error.originalError) {
      parts.push(`Original: ${error.originalError.message}`);
      if (error.originalError.stack) {
        parts.push(`Stack: ${error.originalError.stack}`);
      }
    }

    return parts.join(' | ');
  }
}

/**
 * Utility function to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof BlockchainError) {
    return error.retryable;
  }

  // Check message for common retryable patterns
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const retryablePatterns = [
    'timeout',
    'network',
    'connection',
    'temporary',
    'busy',
    'rate limit',
    'too many requests',
    'nonce too low',
    'underpriced',
  ];

  return retryablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Utility function to get error severity
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (error instanceof BlockchainError) {
    return error.severity;
  }

  // Default severity based on message
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('critical') || message.includes('fatal')) {
    return ErrorSeverity.CRITICAL;
  }
  if (message.includes('failed')) {
    return ErrorSeverity.HIGH;
  }
  if (message.includes('warning') || message.includes('invalid')) {
    return ErrorSeverity.MEDIUM;
  }

  return ErrorSeverity.LOW;
}

/**
 * Export error factory with alias
 */
export { BlockchainErrorFactory as ErrorFactory };

