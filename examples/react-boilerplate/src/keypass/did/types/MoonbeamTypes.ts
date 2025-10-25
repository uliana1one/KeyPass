import { DIDDocument, Service } from './types';

/**
 * Enumeration of Moonbeam-specific cryptographic key types.
 * These represent the authentication methods supported by Moonbeam (EVM-compatible).
 */
export enum MoonbeamKeyType {
  /** ECDSA signature scheme - Ethereum's primary signature algorithm */
  ECDSA = 'ecdsa',
  
  /** Ed25519 signature scheme - alternative signature algorithm */
  ED25519 = 'ed25519',
  
  /** Secp256k1 signature scheme - Bitcoin/Ethereum standard */
  SECP256K1 = 'secp256k1',
  
  /** Moonbeam-specific aggregate signature for multi-sig scenarios */
  MOONBEAM_AGGREGATE = 'moonbeam-aggregate',
}

/**
 * Extended DID document specifically for Moonbeam DIDs.
 * Includes Moonbeam-specific services and verification methods.
 */
export interface MoonbeamDIDDocument extends DIDDocument {
  /** Base DID context + Moonbeam-specific context */
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/secp256k1-2019/v1',
    'https://w3id.org/security/suites/moonbeam-2023/v1',
    ...string[]
  ];
  
  /** Moonbeam-specific verification methods */
  verificationMethod: MoonbeamVerificationMethod[];
  
  /** Moonbeam service endpoints (extends base Service with Moonbeam-specific details) */
  service?: (Service | MoonbeamService)[];
  
  /** Moonbeam-specific extensions */
  moonbeamExtensions?: MoonbeamDIDExtensions;
}

/**
 * Moonbeam-specific verification method interface.
 * Extends the base verification method with Moonbeam capabilities.
 */
export interface MoonbeamVerificationMethod {
  /** Verification method identifier */
  id: string;
  
  /** Moonbeam-specific verification method type */
  type: MoonbeamVerificationMethodType;
  
  /** Controller DID */
  controller: string;
  
  /** Public key in multibase format */
  publicKeyMultibase: string;
  
  /** Ethereum address for Moonbeam interaction */
  ethereumAddress?: string;
  
  /** Key type specification */
  keyType: MoonbeamKeyType;
  
  /** Additional metadata for Moonbeam verification */
  metadata?: MoonbeamVerificationMetadata;
}

/**
 * Enumeration of Moonbeam verification method types.
 */
export enum MoonbeamVerificationMethodType {
  /** ECDSA verification key 2019 */
  ECDSA_2019 = 'EcdsaSecp256k1VerificationKey2019',
  
  /** Ed25519 verification key 2020 */
  ED25519_2020 = 'Ed25519VerificationKey2020',
  
  /** Secp256k1 verification key 2019 */
  SECP256K1_2019 = 'Secp256k1VerificationKey2019',
  
  /** Moonbeam verification method */
  MOONBEAM_2023 = 'MoonbeamVerificationMethod2023',
}

/**
 * Metadata for Moonbeam verification methods.
 */
export interface MoonbeamVerificationMetadata {
  /** Account index on Moonbeam */
  accountIndex?: number;
  
  /** Whether the key is derived from the main account */
  isDerived?: boolean;
  
  /** Key derivation path */
  derivationPath?: string;
  
  /** Timestamp when the verification method was created */
  createdAt?: string;
  
  /** Whether the verification method is active */
  isActive: boolean;
}

/**
 * Moonbeam service endpoints within a DID document.
 */
export interface MoonbeamService {
  /** Service identifier */
  id: string;
  
  /** Moonbeam-specific service types */
  type: MoonbeamServiceType;
  
  /** Service endpoint configuration (string for base compatibility) */
  serviceEndpoint: string;
  
  /** Extended service endpoint configuration */
  endpointConfig?: MoonbeamServiceEndpoint;
  
  /** Service metadata */
  metadata?: MoonbeamServiceMetadata;
}

/**
 * Enumeration of Moonbeam service types.
 */
export enum MoonbeamServiceType {
  /** Moonbeam RPC endpoint */
  MOONBEAM_RPC = 'MoonbeamRPCService',
  
  /** Moonbeam DID registry service */
  MOONBEAM_DID_REGISTRY = 'MoonbeamDIDRegistry',
  
  /** Moonbeam SBT service */
  MOONBEAM_SBT_SERVICE = 'MoonbeamSBTService',
  
  /** Moonbeam attestation service */
  MOONBEAM_ATTESTATION_SERVICE = 'MoonbeamAttestationService',
  
  /** Moonbeam delegation service */
  MOONBEAM_DELEGATION_SERVICE = 'MoonbeamDelegationService',
}

/**
 * Moonbeam service endpoint configuration.
 */
export interface MoonbeamServiceEndpoint {
  /** Primary service URL */
  url: string;
  
  /** Alternative endpoints for redundancy */
  alternatives?: string[];
  
  /** Connection timeout in milliseconds */
  timeout?: number;
  
  /** Authentication headers if required */
  headers?: Record<string, string>;
}

/**
 * Metadata for Moonbeam services.
 */
export interface MoonbeamServiceMetadata {
  /** Service version */
  version: string;
  
  /** Service provider information */
  provider: string;
  
  /** Last updated timestamp */
  lastUpdated: string;
  
  /** Service status */
  status: 'active' | 'maintenance' | 'deprecated';
  
  /** Rate limiting information */
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

/**
 * Moonbeam-specific DID document extensions.
 */
export interface MoonbeamDIDExtensions {
  /** Moonbeam chain information */
  chainInfo?: MoonbeamChainInfo;
  
  /** DID creation transaction hash */
  creationTransaction?: string;
  
  /** DID block number when created */
  createdAtBlock?: number;
  
  /** Most recent update transaction hash */
  lastUpdateTransaction?: string;
  
  /** Most recent update block number */
  lastUpdateBlock?: number;
  
  /** Moonbeam account funds balance (for transaction fees) */
  accountBalance?: string;
  
  /** Associated SBT collections */
  sbtCollections?: MoonbeamSBTCollection[];
}

/**
 * Moonbeam chain information.
 */
export interface MoonbeamChainInfo {
  /** Chain name */
  chainName: string;
  
  /** Network identifier */
  network: 'moonbeam' | 'moonriver' | 'moonbase' | 'devnet';
  
  /** Chain version */
  version: string;
  
  /** EVM version */
  evmVersion: string;
  
  /** Chain ID */
  chainId: number;
  
  /** Genesis hash */
  genesisHash: string;
  
  /** Latest finalized block number */
  latestBlockNumber?: number;
}

/**
 * Moonbeam SBT collection reference.
 */
export interface MoonbeamSBTCollection {
  /** Collection identifier */
  collectionId: string;
  
  /** Collection name */
  name: string;
  
  /** Collection description */
  description?: string;
  
  /** Issuer DID */
  issuer: string;
  
  /** Collection type */
  type: 'educational' | 'professional' | 'attestation' | 'custom';
  
  /** Number of SBTs in collection */
  sbtCount?: number;
  
  /** Collection status */
  status: 'active' | 'archived' | 'revoked';
}

/**
 * Result interface for Moonbeam blockchain transactions.
 */
export interface MoonbeamTransactionResult {
  /** Transaction success status */
  success: boolean;
  
  /** Transaction hash */
  transactionHash: string;
  
  /** Block number where transaction was included */
  blockNumber: number;
  
  /** Block hash where transaction was included */
  blockHash: string;
  
  /** Transaction events */
  events?: MoonbeamTransactionEvent[];
  
  /** Transaction gas information */
  gas: {
    /** Gas used */
    gasUsed: number;
    /** Gas limit */
    gasLimit: number;
    /** Gas price */
    gasPrice: string;
    /** Total cost in DEV */
    totalCost: string;
  };
  
  /** Transaction execution timestamp */
  timestamp?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Event emitted during Moonbeam transaction execution.
 */
export interface MoonbeamTransactionEvent {
  /** Event type */
  type: string;
  
  /** Event name */
  name: string;
  
  /** Event data */
  data: Record<string, unknown>;
  
  /** Event index */
  index: number;
}

/**
 * Moonbeam-specific error types.
 */
export enum MoonbeamErrorType {
  /** Network connectivity issues */
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  /** Moonbeam connection problems */
  MOONBEAM_CONNECTION_ERROR = 'MOONBEAM_CONNECTION_ERROR',
  
  /** Invalid Moonbeam address format */
  INVALID_MOONBEAM_ADDRESS = 'INVALID_MOONBEAM_ADDRESS',
  
  /** DID not found on Moonbeam */
  MOONBEAM_DID_NOT_FOUND = 'MOONBEAM_DID_NOT_FOUND',
  
  /** Insufficient balance for transaction fees */
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  /** Transaction execution failure */
  TRANSACTION_EXECUTION_ERROR = 'TRANSACTION_EXECUTION_ERROR',
  
  /** Moonbeam DID registration failure */
  DID_REGISTRATION_ERROR = 'DID_REGISTRATION_ERROR',
  
  /** Moonbeam SBT verification failure */
  SBT_VERIFICATION_ERROR = 'SBT_VERIFICATION_ERROR',
  
  /** Moonbeam governance proposal error */
  GOVERNANCE_ERROR = 'GOVERNANCE_ERROR',
  
  /** Moonbeam delegation service error */
  DELEGATION_ERROR = 'DELEGATION_ERROR',
}

/**
 * Moonbeam-specific error class.
 */
export class MoonbeamError extends Error {
  public readonly code: MoonbeamErrorType;
  public readonly transactionHash?: string;
  public readonly blockNumber?: number;
  public readonly chainInfo?: MoonbeamChainInfo;

  constructor(
    message: string,
    code: MoonbeamErrorType,
    details?: {
      transactionHash?: string;
      blockNumber?: number;
      chainInfo?: MoonbeamChainInfo;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'MoonbeamError';
    this.code = code;
    this.transactionHash = details?.transactionHash;
    this.blockNumber = details?.blockNumber;
    this.chainInfo = details?.chainInfo;

    // Preserve original error stack trace
    if (details?.cause) {
      this.stack = details.cause.stack;
    }
  }

  /**
   * Creates a formatted error message including Moonbeam-specific context.
   */
  public toDetailedMessage(): string {
    let message = `Moonbeam Error [${this.code}]: ${this.message}`;
    
    if (this.transactionHash) {
      message += `\nTransaction Hash: ${this.transactionHash}`;
    }
    
    if (this.blockNumber !== undefined) {
      message += `\nBlock Number: ${this.blockNumber}`;
    }
    
    if (this.chainInfo) {
      message += `\nNetwork: ${this.chainInfo.network} (${this.chainInfo.chainName})`;
      message += `\nChain Version: ${this.chainInfo.version}`;
    }
    
    return message;
  }
}

/**
 * Moonbeam DID operation status enumeration.
 */
export enum MoonbeamDIDStatus {
  /** DID is active and operational */
  ACTIVE = 'active',
  
  /** DID is in the process of being created */
  CREATING = 'creating',
  
  /** DID is being updated */
  UPDATING = 'updating',
  
  /** DID has been revoked */
  REVOKED = 'revoked',
  
  /** DID has expired */
  EXPIRED = 'expired',
  
  /** DID is in error state */
  ERROR = 'error',
}

/**
 * Request interface for creating Moonbeam DIDs.
 */
export interface MoonbeamCreateDIDRequest {
  /** DID identifier (optional - will be generated from address if not provided) */
  did?: string;
  
  /** DID controller */
  controller?: string;
  
  /** Initial verification methods to add */
  verificationMethods?: Partial<MoonbeamVerificationMethod>[];
  
  /** Initial services to add */
  services?: Partial<MoonbeamService>[];
  
  /** DID metadata */
  metadata?: Record<string, unknown>;
  
  /** Transaction fee payer */
  feePayer?: string;
}

/**
 * Response interface for Moonbeam DID creation.
 */
export interface MoonbeamCreateDIDResponse {
  /** Created Moonbeam DID */
  did: string;
  
  /** Created DID document */
  didDocument: MoonbeamDIDDocument;
  
  /** Transaction result */
  transactionResult: MoonbeamTransactionResult;
  
  /** Creation status */
  status: MoonbeamDIDStatus;
}
