/**
 * Blockchain-Specific Error Handling
 * 
 * Comprehensive error types, codes, and utilities for Moonbeam blockchain operations.
 * Provides structured error handling with categorization, severity levels, and factory functions.
 */

import { WalletError } from './WalletErrors';

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
  CONTRACT_CALL_FAILED = 'MOONBEAM_2107',
  
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
  TRANSACTION_NOT_FOUND = 'MOONBEAM_2211',
  
  // SBT errors (2300-2399)
  SBT_MINT_FAILED = 'MOONBEAM_2300',
  SBT_BURN_FAILED = 'MOONBEAM_2301',
  SBT_TRANSFER_BLOCKED = 'MOONBEAM_2302',
  SBT_TOKEN_NOT_FOUND = 'MOONBEAM_2303',
  SBT_METADATA_INVALID = 'MOONBEAM_2304',
  SBT_VERIFICATION_FAILED = 'MOONBEAM_2305',
  
  // DID errors (2400-2499)
  DID_NOT_FOUND = 'MOONBEAM_2400',
  DID_ALREADY_EXISTS = 'MOONBEAM_2401',
  DID_CREATION_FAILED = 'MOONBEAM_2402',
  DID_UPDATE_FAILED = 'MOONBEAM_2403',
  DID_DELETION_FAILED = 'MOONBEAM_2404',
  DID_VERIFICATION_FAILED = 'MOONBEAM_2405',
  DID_DOCUMENT_INVALID = 'MOONBEAM_2406',
  DID_CONTROLLER_INVALID = 'MOONBEAM_2407',
  
  // Gas errors (2500-2599)
  GAS_PRICE_TOO_LOW = 'MOONBEAM_2500',
  GAS_LIMIT_TOO_LOW = 'MOONBEAM_2501',
  GAS_ESTIMATION_FAILED = 'MOONBEAM_2502',
  GAS_PRICE_FETCH_FAILED = 'MOONBEAM_2503',
  
  // Account errors (2600-2699)
  ACCOUNT_NOT_FOUND = 'MOONBEAM_2600',
  ACCOUNT_BALANCE_INSUFFICIENT = 'MOONBEAM_2601',
  ACCOUNT_LOCKED = 'MOONBEAM_2602',
  ACCOUNT_INVALID = 'MOONBEAM_2603',
  PRIVATE_KEY_INVALID = 'MOONBEAM_2604',
  MNEMONIC_INVALID = 'MOONBEAM_2605',
  
  // Validation errors (2700-2799)
  INVALID_ADDRESS = 'MOONBEAM_2700',
  INVALID_HASH = 'MOONBEAM_2701',
  INVALID_SIGNATURE = 'MOONBEAM_2702',
  INVALID_PARAMETERS = 'MOONBEAM_2703',
  INVALID_NETWORK = 'MOONBEAM_2704',
  INVALID_CHAIN_ID = 'MOONBEAM_2705',
  INVALID_BLOCK_NUMBER = 'MOONBEAM_2706',
  
  // Network errors (2800-2899)
  NETWORK_ERROR = 'MOONBEAM_2800',
  NETWORK_TIMEOUT = 'MOONBEAM_2801',
  NETWORK_UNREACHABLE = 'MOONBEAM_2802',
  NETWORK_CONGESTION = 'MOONBEAM_2803',
  NETWORK_FORK_DETECTED = 'MOONBEAM_2804',
  
  // Configuration errors (2900-2999)
  CONFIG_INVALID = 'MOONBEAM_2900',
  CONFIG_MISSING = 'MOONBEAM_2901',
  CONFIG_NETWORK_MISMATCH = 'MOONBEAM_2902',
  CONFIG_RPC_URL_INVALID = 'MOONBEAM_2903',
  CONFIG_PRIVATE_KEY_MISSING = 'MOONBEAM_2904',
  CONFIG_CONTRACT_ADDRESS_INVALID = 'MOONBEAM_2905',
  
  // Dependency errors (3000-3099)
  DEPENDENCY_ERROR = 'MOONBEAM_3000',
  DEPENDENCY_MISSING = 'MOONBEAM_3001',
  DEPENDENCY_VERSION_MISMATCH = 'MOONBEAM_3002',
  DEPENDENCY_LOAD_FAILED = 'MOONBEAM_3003',
}

/**
 * Base blockchain error class
 */
export class BlockchainError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly blockchain?: 'moonbeam';
  public readonly timestamp: number;
  public readonly context?: Record<string, any>;
  public readonly transactionHash?: string;
  public readonly blockNumber?: number;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    blockchain?: 'moonbeam',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BlockchainError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.blockchain = blockchain;
    this.timestamp = Date.now();
    this.context = context;
    this.transactionHash = context?.transactionHash;
    this.blockNumber = context?.blockNumber;
  }

  /**
   * Convert error to user-friendly message
   */
  public toUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      case ErrorCategory.CONTRACT:
        return 'Smart contract error. Please try again or contact support.';
      case ErrorCategory.USER:
        return this.message;
      case ErrorCategory.TRANSACTION:
        return 'Transaction failed. Please check your balance and try again.';
      case ErrorCategory.VALIDATION:
        return 'Invalid input. Please check your data and try again.';
      case ErrorCategory.CONFIGURATION:
        return 'Configuration error. Please contact support.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Convert error to developer-friendly message
   */
  public toDeveloperMessage(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }

  /**
   * Convert error to log message
   */
  public toLogMessage(): string {
    return `${this.name} [${this.code}] [${this.severity}] [${this.category}]: ${this.message}`;
  }
}

/**
 * Moonbeam-specific error class
 */
export class MoonbeamBlockchainError extends BlockchainError {
  constructor(
    code: MoonbeamErrorCode,
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ) {
    super(message, code, category, severity, 'moonbeam', context);
    this.name = 'MoonbeamBlockchainError';
  }
}

/**
 * Error factory for creating blockchain errors
 */
export class BlockchainErrorFactory {
  /**
   * Create a Moonbeam connection error
   */
  static moonbeamConnectionError(message: string, context?: Record<string, any>): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      MoonbeamErrorCode.CONNECTION_FAILED,
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.CRITICAL,
      context
    );
  }

  /**
   * Create a Moonbeam contract error
   */
  static moonbeamContractError(code: MoonbeamErrorCode, message: string, context?: Record<string, any>): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      code,
      message,
      ErrorCategory.CONTRACT,
      ErrorSeverity.HIGH,
      context
    );
  }

  /**
   * Create a Moonbeam transaction error
   */
  static moonbeamTransactionError(code: MoonbeamErrorCode, message: string, context?: Record<string, any>): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      code,
      message,
      ErrorCategory.TRANSACTION,
      ErrorSeverity.HIGH,
      context
    );
  }

  /**
   * Create a Moonbeam DID error
   */
  static moonbeamDIDError(code: MoonbeamErrorCode, message: string, context?: Record<string, any>): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      code,
      message,
      ErrorCategory.CONTRACT,
      ErrorSeverity.HIGH,
      context
    );
  }

  /**
   * Create a Moonbeam SBT error
   */
  static moonbeamSBTError(code: MoonbeamErrorCode, message: string, context?: Record<string, any>): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      code,
      message,
      ErrorCategory.CONTRACT,
      ErrorSeverity.HIGH,
      context
    );
  }

  /**
   * Create a Moonbeam validation error
   */
  static moonbeamValidationError(code: MoonbeamErrorCode, message: string, context?: Record<string, any>): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      code,
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  /**
   * Create a Moonbeam user error
   */
  static moonbeamUserError(code: MoonbeamErrorCode, message: string, context?: Record<string, any>): MoonbeamBlockchainError {
    return new MoonbeamBlockchainError(
      code,
      message,
      ErrorCategory.USER,
      ErrorSeverity.LOW,
      context
    );
  }

  /**
   * Create error from error code
   */
  static fromCode(code: string, message?: string, context?: Record<string, any>): BlockchainError {
    // Determine blockchain and error code
    if (code.startsWith('MOONBEAM_')) {
      const moonbeamCode = code as MoonbeamErrorCode;
      const errorMessage = message || this.getDefaultMessage(moonbeamCode);
      
      // Determine category based on error code range
      let category: ErrorCategory;
      const codeNum = parseInt(code.split('_')[1]);
      
      if (codeNum >= 2000 && codeNum < 2100) {
        category = ErrorCategory.NETWORK;
      } else if (codeNum >= 2100 && codeNum < 2200) {
        category = ErrorCategory.CONTRACT;
      } else if (codeNum >= 2200 && codeNum < 2300) {
        category = ErrorCategory.TRANSACTION;
      } else if (codeNum >= 2300 && codeNum < 2400) {
        category = ErrorCategory.CONTRACT;
      } else if (codeNum >= 2400 && codeNum < 2500) {
        category = ErrorCategory.CONTRACT;
      } else if (codeNum >= 2500 && codeNum < 2600) {
        category = ErrorCategory.TRANSACTION;
      } else if (codeNum >= 2600 && codeNum < 2700) {
        category = ErrorCategory.USER;
      } else if (codeNum >= 2700 && codeNum < 2800) {
        category = ErrorCategory.VALIDATION;
      } else if (codeNum >= 2800 && codeNum < 2900) {
        category = ErrorCategory.NETWORK;
      } else if (codeNum >= 2900 && codeNum < 3000) {
        category = ErrorCategory.CONFIGURATION;
      } else {
        category = ErrorCategory.UNKNOWN;
      }

      // Special case overrides
      if (code === MoonbeamErrorCode.TRANSACTION_REVERTED) {
        category = ErrorCategory.CONTRACT;
      }
      if (code === MoonbeamErrorCode.GAS_ESTIMATION_FAILED) {
        category = ErrorCategory.USER;
      }

      // Determine severity
      let severity: ErrorSeverity;
      if (codeNum >= 2000 && codeNum < 2100) {
        severity = ErrorSeverity.CRITICAL; // Connection errors
      } else if (codeNum >= 2200 && codeNum < 2300) {
        severity = ErrorSeverity.HIGH; // Transaction errors
      } else if (codeNum >= 2300 && codeNum < 2500) {
        severity = ErrorSeverity.HIGH; // Contract errors (including DID/SBT)
      } else if (codeNum >= 2600 && codeNum < 2700) {
        severity = ErrorSeverity.LOW; // User errors
      } else {
        severity = ErrorSeverity.MEDIUM;
      }

      return new MoonbeamBlockchainError(moonbeamCode, errorMessage, category, severity, context);
    }

    // Fallback for unknown codes
    return new BlockchainError(
      message || 'Unknown error',
      code,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.MEDIUM,
      undefined,
      context
    );
  }

  /**
   * Get default message for error code
   */
  private static getDefaultMessage(code: MoonbeamErrorCode): string {
    const messages: Record<MoonbeamErrorCode, string> = {
      [MoonbeamErrorCode.CONNECTION_FAILED]: 'Failed to connect to Moonbeam network',
      [MoonbeamErrorCode.CONNECTION_TIMEOUT]: 'Connection to Moonbeam network timed out',
      [MoonbeamErrorCode.CONNECTION_LOST]: 'Connection to Moonbeam network lost',
      [MoonbeamErrorCode.RPC_ERROR]: 'RPC error occurred',
      [MoonbeamErrorCode.PROVIDER_ERROR]: 'Provider error occurred',
      [MoonbeamErrorCode.CONTRACT_NOT_FOUND]: 'Contract not found',
      [MoonbeamErrorCode.CONTRACT_EXECUTION_FAILED]: 'Contract execution failed',
      [MoonbeamErrorCode.CONTRACT_DEPLOYMENT_FAILED]: 'Contract deployment failed',
      [MoonbeamErrorCode.CONTRACT_CALL_REVERTED]: 'Contract call reverted',
      [MoonbeamErrorCode.CONTRACT_INVALID_ABI]: 'Invalid contract ABI',
      [MoonbeamErrorCode.CONTRACT_INVALID_BYTECODE]: 'Invalid contract bytecode',
      [MoonbeamErrorCode.CONTRACT_INSUFFICIENT_GAS]: 'Insufficient gas for contract execution',
      [MoonbeamErrorCode.CONTRACT_CALL_FAILED]: 'Contract call failed',
      [MoonbeamErrorCode.TRANSACTION_FAILED]: 'Transaction failed',
      [MoonbeamErrorCode.TRANSACTION_TIMEOUT]: 'Transaction timed out',
      [MoonbeamErrorCode.TRANSACTION_REVERTED]: 'Transaction reverted',
      [MoonbeamErrorCode.TRANSACTION_REJECTED]: 'Transaction rejected',
      [MoonbeamErrorCode.TRANSACTION_UNDERPRICED]: 'Transaction underpaid',
      [MoonbeamErrorCode.REPLACEMENT_UNDERPRICED]: 'Replacement transaction underpaid',
      [MoonbeamErrorCode.INSUFFICIENT_BALANCE]: 'Insufficient balance',
      [MoonbeamErrorCode.NONCE_TOO_LOW]: 'Nonce too low',
      [MoonbeamErrorCode.NONCE_TOO_HIGH]: 'Nonce too high',
      [MoonbeamErrorCode.GAS_LIMIT_EXCEEDED]: 'Gas limit exceeded',
      [MoonbeamErrorCode.INTRINSIC_GAS_TOO_LOW]: 'Intrinsic gas too low',
      [MoonbeamErrorCode.TRANSACTION_NOT_FOUND]: 'Transaction not found',
      [MoonbeamErrorCode.SBT_MINT_FAILED]: 'SBT minting failed',
      [MoonbeamErrorCode.SBT_BURN_FAILED]: 'SBT burning failed',
      [MoonbeamErrorCode.SBT_TRANSFER_BLOCKED]: 'SBT transfer blocked',
      [MoonbeamErrorCode.SBT_TOKEN_NOT_FOUND]: 'SBT token not found',
      [MoonbeamErrorCode.SBT_METADATA_INVALID]: 'SBT metadata invalid',
      [MoonbeamErrorCode.SBT_VERIFICATION_FAILED]: 'SBT verification failed',
      [MoonbeamErrorCode.DID_NOT_FOUND]: 'DID not found',
      [MoonbeamErrorCode.DID_ALREADY_EXISTS]: 'DID already exists',
      [MoonbeamErrorCode.DID_CREATION_FAILED]: 'DID creation failed',
      [MoonbeamErrorCode.DID_UPDATE_FAILED]: 'DID update failed',
      [MoonbeamErrorCode.DID_DELETION_FAILED]: 'DID deletion failed',
      [MoonbeamErrorCode.DID_VERIFICATION_FAILED]: 'DID verification failed',
      [MoonbeamErrorCode.DID_DOCUMENT_INVALID]: 'DID document invalid',
      [MoonbeamErrorCode.DID_CONTROLLER_INVALID]: 'DID controller invalid',
      [MoonbeamErrorCode.GAS_PRICE_TOO_LOW]: 'Gas price too low',
      [MoonbeamErrorCode.GAS_LIMIT_TOO_LOW]: 'Gas limit too low',
      [MoonbeamErrorCode.GAS_ESTIMATION_FAILED]: 'Gas estimation failed',
      [MoonbeamErrorCode.GAS_PRICE_FETCH_FAILED]: 'Failed to fetch gas price',
      [MoonbeamErrorCode.ACCOUNT_NOT_FOUND]: 'Account not found',
      [MoonbeamErrorCode.ACCOUNT_BALANCE_INSUFFICIENT]: 'Account balance insufficient',
      [MoonbeamErrorCode.ACCOUNT_LOCKED]: 'Account locked',
      [MoonbeamErrorCode.ACCOUNT_INVALID]: 'Invalid account',
      [MoonbeamErrorCode.PRIVATE_KEY_INVALID]: 'Invalid private key',
      [MoonbeamErrorCode.MNEMONIC_INVALID]: 'Invalid mnemonic',
      [MoonbeamErrorCode.INVALID_ADDRESS]: 'Invalid address',
      [MoonbeamErrorCode.INVALID_HASH]: 'Invalid hash',
      [MoonbeamErrorCode.INVALID_SIGNATURE]: 'Invalid signature',
      [MoonbeamErrorCode.INVALID_PARAMETERS]: 'Invalid parameters',
      [MoonbeamErrorCode.INVALID_NETWORK]: 'Invalid network',
      [MoonbeamErrorCode.INVALID_CHAIN_ID]: 'Invalid chain ID',
      [MoonbeamErrorCode.INVALID_BLOCK_NUMBER]: 'Invalid block number',
      [MoonbeamErrorCode.NETWORK_ERROR]: 'Network error',
      [MoonbeamErrorCode.NETWORK_TIMEOUT]: 'Network timeout',
      [MoonbeamErrorCode.NETWORK_UNREACHABLE]: 'Network unreachable',
      [MoonbeamErrorCode.NETWORK_CONGESTION]: 'Network congestion',
      [MoonbeamErrorCode.NETWORK_FORK_DETECTED]: 'Network fork detected',
      [MoonbeamErrorCode.CONFIG_INVALID]: 'Invalid configuration',
      [MoonbeamErrorCode.CONFIG_MISSING]: 'Missing configuration',
      [MoonbeamErrorCode.CONFIG_NETWORK_MISMATCH]: 'Network configuration mismatch',
      [MoonbeamErrorCode.CONFIG_RPC_URL_INVALID]: 'Invalid RPC URL',
      [MoonbeamErrorCode.CONFIG_PRIVATE_KEY_MISSING]: 'Private key missing',
      [MoonbeamErrorCode.CONFIG_CONTRACT_ADDRESS_INVALID]: 'Invalid contract address',
      [MoonbeamErrorCode.DEPENDENCY_ERROR]: 'Dependency error',
      [MoonbeamErrorCode.DEPENDENCY_MISSING]: 'Dependency missing',
      [MoonbeamErrorCode.DEPENDENCY_VERSION_MISMATCH]: 'Dependency version mismatch',
      [MoonbeamErrorCode.DEPENDENCY_LOAD_FAILED]: 'Dependency load failed',
    };

    return messages[code] || 'Unknown error';
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Check if error is a Moonbeam error
   */
  static isMoonbeamError(error: any): error is MoonbeamBlockchainError {
    return error instanceof MoonbeamBlockchainError;
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: BlockchainError): boolean {
    const retryableCodes = [
      MoonbeamErrorCode.CONNECTION_FAILED,
      MoonbeamErrorCode.CONNECTION_TIMEOUT,
      MoonbeamErrorCode.CONNECTION_LOST,
      MoonbeamErrorCode.RPC_ERROR,
      MoonbeamErrorCode.NETWORK_ERROR,
      MoonbeamErrorCode.NETWORK_TIMEOUT,
      MoonbeamErrorCode.NETWORK_UNREACHABLE,
      MoonbeamErrorCode.TRANSACTION_TIMEOUT,
      MoonbeamErrorCode.GAS_PRICE_FETCH_FAILED,
    ];

    return retryableCodes.includes(error.code as MoonbeamErrorCode);
  }

  /**
   * Get retry delay for error
   */
  static getRetryDelay(error: BlockchainError, attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: Error): string {
    if (error instanceof BlockchainError) {
      return error.toLogMessage();
    }
    return `${error.name}: ${error.message}`;
  }

  /**
   * Format error for user display
   */
  static formatForUser(error: Error): string {
    if (error instanceof BlockchainError) {
      return error.toUserMessage();
    }
    return 'An unexpected error occurred. Please try again.';
  }
}