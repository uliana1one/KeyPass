/**
 * SBT Minting Types
 * 
 * TypeScript interfaces and types for SBT (Soulbound Token) minting operations,
 * including request/response structures, metadata definitions, transaction status,
 * and error handling.
 */

/**
 * SBT Mint Request Interface
 */
export interface SBTMintRequest {
  /** Contract address where the SBT will be minted */
  contractAddress: string;
  /** Recipient address for the SBT */
  recipient: string;
  /** Metadata for the SBT (optional if tokenURI is provided) */
  metadata?: SBTMetadata;
  /** Token URI for metadata (optional if metadata object is provided) */
  tokenURI?: string;
  /** Gas limit for the transaction (optional) */
  gasLimit?: string;
  /** Gas price for the transaction in wei (optional) */
  gasPrice?: string;
  /** Maximum fee per gas (EIP-1559, optional) */
  maxFeePerGas?: string;
  /** Maximum priority fee per gas (EIP-1559, optional) */
  maxPriorityFeePerGas?: string;
  /** Transaction value in wei (optional) */
  value?: string;
  /** Number of confirmations to wait for (optional) */
  confirmations?: number;
  /** Timeout for the transaction in milliseconds (optional) */
  timeout?: number;
  /** Whether to pin metadata to IPFS (optional) */
  pinToIPFS?: boolean;
  /** Custom transaction options (optional) */
  transactionOptions?: Record<string, any>;
}

/**
 * SBT Mint Response Interface
 */
export interface SBTMintResponse {
  /** Success status of the minting operation */
  success: boolean;
  /** Generated token ID */
  tokenId?: string;
  /** Transaction hash */
  transactionHash?: string;
  /** Block number where transaction was mined */
  blockNumber?: number;
  /** Gas used for the transaction */
  gasUsed?: string;
  /** Transaction fee in wei */
  transactionFee?: string;
  /** Metadata URI (IPFS or HTTP) */
  metadataUri?: string;
  /** Contract address */
  contractAddress: string;
  /** Recipient address */
  recipient: string;
  /** Timestamp when minting was initiated */
  initiatedAt: string;
  /** Timestamp when minting was completed */
  completedAt?: string;
  /** Transaction status */
  status: TransactionStatus;
  /** Error information if minting failed */
  error?: MintingError;
  /** Additional metadata about the operation */
  metadata?: {
    /** IPFS CID if metadata was uploaded to IPFS */
    ipfsCid?: string;
    /** Size of metadata in bytes */
    metadataSize?: number;
    /** Gas estimation that was used */
    gasEstimation?: {
      gasLimit: string;
      gasPrice: string;
      estimatedCost: string;
    };
    /** Retry attempts if any */
    retryAttempts?: number;
    /** Network information */
    network?: {
      chainId: number;
      name: string;
    };
  };
}

/**
 * SBT Metadata Interface
 */
export interface SBTMetadata {
  /** Token name */
  name: string;
  /** Token description */
  description: string;
  /** Token image URI (IPFS, HTTP, or HTTPS) */
  image: string;
  /** External URL for additional information (optional) */
  external_url?: string;
  /** Token attributes (optional) */
  attributes?: SBTAttribute[];
  /** Additional properties (optional) */
  [key: string]: any;
}

/**
 * SBT Attribute Interface
 */
export interface SBTAttribute {
  /** Attribute trait type */
  trait_type: string;
  /** Attribute value */
  value: string | number | boolean;
  /** Display type for the attribute (optional) */
  display_type?: 'string' | 'number' | 'boost_number' | 'boost_percentage' | 'date';
  /** Maximum value for numeric attributes (optional) */
  max_value?: number;
}

/**
 * Transaction Status Enum
 */
export enum TransactionStatus {
  /** Transaction is pending */
  PENDING = 'pending',
  /** Transaction is being processed */
  PROCESSING = 'processing',
  /** Transaction has been submitted to the network */
  SUBMITTED = 'submitted',
  /** Transaction is confirmed on the blockchain */
  CONFIRMED = 'confirmed',
  /** Transaction failed */
  FAILED = 'failed',
  /** Transaction was cancelled */
  CANCELLED = 'cancelled',
  /** Transaction timed out */
  TIMEOUT = 'timeout',
  /** Transaction is being retried */
  RETRYING = 'retrying',
}

/**
 * Minting Error Types
 */
export interface MintingError {
  /** Error code */
  code: MintingErrorCode;
  /** Error message */
  message: string;
  /** Error details */
  details?: any;
  /** Operation that failed */
  operation?: string;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Suggested retry delay in milliseconds */
  retryDelay?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * Minting Error Code Enum
 */
export enum MintingErrorCode {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  RPC_ERROR = 'RPC_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',

  // Contract Errors
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  CONTRACT_NOT_DEPLOYED = 'CONTRACT_NOT_DEPLOYED',
  INVALID_CONTRACT_ADDRESS = 'INVALID_CONTRACT_ADDRESS',
  CONTRACT_METHOD_FAILED = 'CONTRACT_METHOD_FAILED',

  // Transaction Errors
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NONCE_TOO_LOW = 'NONCE_TOO_LOW',
  GAS_PRICE_TOO_LOW = 'GAS_PRICE_TOO_LOW',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_RECIPIENT_ADDRESS = 'INVALID_RECIPIENT_ADDRESS',
  INVALID_METADATA = 'INVALID_METADATA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_ATTRIBUTE = 'INVALID_ATTRIBUTE',

  // IPFS Errors
  IPFS_ERROR = 'IPFS_ERROR',
  IPFS_UPLOAD_FAILED = 'IPFS_UPLOAD_FAILED',
  IPFS_RETRIEVAL_FAILED = 'IPFS_RETRIEVAL_FAILED',
  IPFS_CONNECTION_FAILED = 'IPFS_CONNECTION_FAILED',

  // Token Errors
  TOKEN_ERROR = 'TOKEN_ERROR',
  TOKEN_ALREADY_EXISTS = 'TOKEN_ALREADY_EXISTS',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  INVALID_TOKEN_ID = 'INVALID_TOKEN_ID',
  TOKEN_METADATA_ERROR = 'TOKEN_METADATA_ERROR',

  // Configuration Errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  MISSING_CONFIGURATION = 'MISSING_CONFIGURATION',

  // Permission Errors
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Rate Limiting Errors
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Unknown Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Gas Estimation Interface
 */
export interface GasEstimation {
  /** Estimated gas limit */
  gasLimit: string;
  /** Gas price in wei */
  gasPrice: string;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
  /** Estimated transaction cost in wei */
  estimatedCost: string;
  /** Estimated transaction cost in ETH */
  estimatedCostInETH: string;
  /** Gas estimation confidence level */
  confidence: 'low' | 'medium' | 'high';
  /** Timestamp of gas estimation */
  estimatedAt: string;
}

/**
 * Transaction Receipt Interface
 */
export interface TransactionReceipt {
  /** Transaction hash */
  transactionHash: string;
  /** Block number */
  blockNumber: number;
  /** Block hash */
  blockHash: string;
  /** Transaction index in block */
  transactionIndex: number;
  /** Gas used */
  gasUsed: string;
  /** Effective gas price */
  effectiveGasPrice: string;
  /** Transaction status (0 = failed, 1 = success) */
  status: number;
  /** Contract address (for contract creation) */
  contractAddress?: string;
  /** Logs emitted by the transaction */
  logs: TransactionLog[];
  /** Timestamp when transaction was mined */
  timestamp?: string;
}

/**
 * Transaction Log Interface
 */
export interface TransactionLog {
  /** Log index */
  logIndex: number;
  /** Transaction index */
  transactionIndex: number;
  /** Transaction hash */
  transactionHash: string;
  /** Block number */
  blockNumber: number;
  /** Block hash */
  blockHash: string;
  /** Contract address */
  address: string;
  /** Log data */
  data: string;
  /** Log topics */
  topics: string[];
  /** Whether log was removed */
  removed: boolean;
}

/**
 * Minting Progress Interface
 */
export interface MintingProgress {
  /** Current step */
  step: MintingStep;
  /** Progress percentage (0-100) */
  progress: number;
  /** Step description */
  description: string;
  /** Whether step is completed */
  completed: boolean;
  /** Step start time */
  startedAt: string;
  /** Step completion time */
  completedAt?: string;
  /** Step error if any */
  error?: MintingError;
}

/**
 * Minting Step Enum
 */
export enum MintingStep {
  INITIALIZING = 'initializing',
  VALIDATING_INPUTS = 'validating_inputs',
  UPLOADING_METADATA = 'uploading_metadata',
  GENERATING_TOKEN_ID = 'generating_token_id',
  ESTIMATING_GAS = 'estimating_gas',
  SUBMITTING_TRANSACTION = 'submitting_transaction',
  WAITING_FOR_CONFIRMATION = 'waiting_for_confirmation',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Batch Minting Request Interface
 */
export interface SBTBatchMintRequest {
  /** Contract address */
  contractAddress: string;
  /** Array of mint requests */
  mintRequests: Array<{
    recipient: string;
    metadata?: SBTMetadata;
    tokenURI?: string;
  }>;
  /** Gas limit for the batch transaction */
  gasLimit?: string;
  /** Gas price for the batch transaction */
  gasPrice?: string;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
  /** Transaction value in wei */
  value?: string;
  /** Number of confirmations to wait for */
  confirmations?: number;
  /** Timeout for the transaction in milliseconds */
  timeout?: number;
  /** Whether to pin metadata to IPFS */
  pinToIPFS?: boolean;
}

/**
 * Batch Minting Response Interface
 */
export interface SBTBatchMintResponse {
  /** Success status of the batch operation */
  success: boolean;
  /** Array of individual mint responses */
  results: SBTMintResponse[];
  /** Total number of tokens minted */
  totalMinted: number;
  /** Number of successful mints */
  successfulMints: number;
  /** Number of failed mints */
  failedMints: number;
  /** Batch transaction hash */
  transactionHash?: string;
  /** Batch block number */
  blockNumber?: number;
  /** Total gas used for the batch */
  totalGasUsed?: string;
  /** Total transaction fee */
  totalTransactionFee?: string;
  /** Timestamp when batch minting was initiated */
  initiatedAt: string;
  /** Timestamp when batch minting was completed */
  completedAt?: string;
  /** Overall batch status */
  status: TransactionStatus;
  /** Batch error if any */
  error?: MintingError;
}

/**
 * Minting Service Configuration Interface
 */
export interface MintingServiceConfig {
  /** Default gas limit */
  defaultGasLimit: string;
  /** Default gas price */
  defaultGasPrice: string;
  /** Default confirmation count */
  defaultConfirmations: number;
  /** Default timeout in milliseconds */
  defaultTimeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Whether to enable debug logging */
  debugMode: boolean;
  /** IPFS configuration */
  ipfs: {
    /** IPFS gateway URL */
    gateway: string;
    /** Whether to pin metadata */
    pinMetadata: boolean;
    /** IPFS timeout in milliseconds */
    timeout: number;
  };
  /** Network configuration */
  network: {
    /** Chain ID */
    chainId: number;
    /** Network name */
    name: string;
    /** RPC URL */
    rpcUrl: string;
  };
}

/**
 * Minting Statistics Interface
 */
export interface MintingStatistics {
  /** Total number of minting attempts */
  totalAttempts: number;
  /** Number of successful mints */
  successfulMints: number;
  /** Number of failed mints */
  failedMints: number;
  /** Success rate percentage */
  successRate: number;
  /** Average gas used */
  averageGasUsed: string;
  /** Average transaction fee */
  averageTransactionFee: string;
  /** Total gas used */
  totalGasUsed: string;
  /** Total transaction fees paid */
  totalTransactionFees: string;
  /** Most common error codes */
  commonErrors: Array<{
    code: MintingErrorCode;
    count: number;
    percentage: number;
  }>;
  /** Time period for statistics */
  timePeriod: {
    start: string;
    end: string;
  };
}
