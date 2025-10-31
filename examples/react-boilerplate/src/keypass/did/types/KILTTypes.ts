import { DIDDocument, Service } from '../types';

/**
 * Enumeration of KILT-specific cryptographic key types.
 * These represent the authentication methods supported by the KILT parachain.
 */
export enum KILTKeyType {
  /** SR25519 signature scheme - KILT's primary signature algorithm */
  SR25519 = 'sr25519',
  
  /** Ed25519 signature scheme - alternative signature algorithm */
  ED25519 = 'ed25519',
  
  /** X25519 key agreement - for encrypted communication */
  X25519 = 'x25519',
  
  /** KILT-specific aggregate signature for multi-sig scenarios */
  KILT_AGGREGATE = 'kilt-aggregate',
}

/**
 * Extended DID document specifically for KILT DIDs.
 * Includes KILT parachain-specific services and verification methods.
 */
export interface KILTDIDDocument extends DIDDocument {
  /** Base DID context + KILT-specific context */
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/sr25519-2020/v1',
    'https://w3id.org/security/suites/kilt-2023/v1',
    ...string[]
  ];
  
  /** KILT-specific verification methods */
  verificationMethod: KILTVerificationMethod[];
  
  /** KILT parachain service endpoints (extends base Service with KILT-specific details) */
  service?: (Service | KILTService)[];
  
  /** KILT-specific extensions */
  kiltExtensions?: KILTDIDExtensions;
}

/**
 * KILT-specific verification method interface.
 * Extends the base verification method with KILT parachain capabilities.
 */
export interface KILTVerificationMethod {
  /** Verification method identifier */
  id: string;
  
  /** KILT-specific verification method type */
  type: KILTVerificationMethodType;
  
  /** Controller DID */
  controller: string;
  
  /** Public key in multibase format */
  publicKeyMultibase: string;
  
  /** SS58 encoded address for KILT parachain interaction */
  ss58Address?: string;
  
  /** Key type specification */
  keyType: KILTKeyType;
  
  /** Additional metadata for KILT verification */
  metadata?: KILTVerificationMetadata;
}

/**
 * Enumeration of KILT verification method types.
 */
export enum KILTVerificationMethodType {
  /** SR25519 verification key 2020 */
  SR25519_2020 = 'Sr25519VerificationKey2020',
  
  /** Ed25519 verification key 2020 */
  ED25519_2020 = 'Ed25519VerificationKey2020',
  
  /** X25519 key agreement 2020 */
  X25519_2020 = 'X25519KeyAgreementKey2020',
  
  /** KILT parachain verification method */
  KILT_PARACHAIN_2023 = 'KiltParachainVerificationMethod2023',
}

/**
 * Metadata for KILT verification methods.
 */
export interface KILTVerificationMetadata {
  /** Account index on the KILT parachain */
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
 * KILT parachain service endpoints within a DID document.
 */
export interface KILTService {
  /** Service identifier */
  id: string;
  
  /** KILT-specific service types */
  type: KILTServiceType;
  
  /** Service endpoint configuration (string for base compatibility) */
  serviceEndpoint: string;
  
  /** Extended service endpoint configuration */
  endpointConfig?: KILTServiceEndpoint;
  
  /** Service metadata */
  metadata?: KILTServiceMetadata;
}

/**
 * Enumeration of KILT service types.
 */
export enum KILTServiceType {
  /** KILT parachain RPC endpoint */
  KILT_PARACHAIN = 'KiltParachainService',
  
  /** KILT DID registry service */
  KILT_DID_REGISTRY = 'KiltDIDRegistry',
  
  /** KILT credential registry */
  KILT_CREDENTIAL_REGISTRY = 'KiltCredentialRegistry',
  
  /** KILT attestation service */
  KILT_ATTESTATION_SERVICE = 'KiltAttestationService',
  
  /** KILT delegation service */
  KILT_DELEGATION_SERVICE = 'KiltDelegationService',
}

/**
 * KILT service endpoint configuration.
 */
export interface KILTServiceEndpoint {
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
 * Metadata for KILT services.
 */
export interface KILTServiceMetadata {
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
 * KILT-specific DID document extensions.
 */
export interface KILTDIDExtensions {
  /** KILT parachain chain information */
  parachainInfo?: KILTParachainInfo;
  
  /** DID creation transaction hash */
  creationTransaction?: string;
  
  /** DID block number when created */
  createdAtBlock?: number;
  
  /** Most recent update transaction hash */
  lastUpdateTransaction?: string;
  
  /** Most recent update block number */
  lastUpdateBlock?: number;
  
  /** KILT account funds balance (for transaction fees) */
  accountBalance?: string;
  
  /** Associated credential collections */
  credentialCollections?: KILTCredentialCollection[];
}

/**
 * KILT parachain chain information.
 */
export interface KILTParachainInfo {
  /** Chain name */
  chainName: string;
  
  /** Network identifier */
  network: 'spiritnet' | 'peregrine' | 'devnet';
  
  /** Chain version */
  version: string;
  
  /** Runtime version */
  runtimeVersion: string;
  
  /** SS58 format used by KILT */
  ss58Format: number;
  
  /** Genesis hash */
  genesisHash: string;
  
  /** Latest finalized block number */
  latestBlockNumber?: number;
}

/**
 * KILT credential collection reference.
 */
export interface KILTCredentialCollection {
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
  
  /** Number of credentials in collection */
  credentialCount?: number;
  
  /** Collection status */
  status: 'active' | 'archived' | 'revoked';
}

/**
 * Result interface for KILT blockchain transactions.
 */
export interface KILTTransactionResult {
  /** Transaction success status */
  success: boolean;
  
  /** Transaction hash */
  transactionHash: string;
  
  /** Block number where transaction was included */
  blockNumber: number;
  
  /** Block hash where transaction was included */
  blockHash: string;
  
  /** Transaction events */
  events?: KILTTransactionEvent[];
  
  /** Transaction gas/fee information */
  fee: {
    /** Fee amount paid */
    amount: string;
    /** Fee currency (usually KILT) */
    currency: string;
  };
  
  /** Transaction execution timestamp */
  timestamp?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Event emitted during KILT transaction execution.
 */
export interface KILTTransactionEvent {
  /** Event type */
  type: string;
  
  /** Event section */
  section: string;
  
  /** Event method */
  method: string;
  
  /** Event data */
  data: Record<string, unknown>;
  
  /** Event index */
  index: number;
}

/**
 * KILT-specific error types.
 */
export enum KILTErrorType {
  /** Network connectivity issues */
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  /** KILT parachain connection problems */
  PARACHAIN_CONNECTION_ERROR = 'PARACHAIN_CONNECTION_ERROR',
  
  /** Invalid KILT address format */
  INVALID_KILT_ADDRESS = 'INVALID_KILT_ADDRESS',
  
  /** DID not found on KILT parachain */
  KILT_DID_NOT_FOUND = 'KILT_DID_NOT_FOUND',
  
  /** Insufficient balance for transaction fees */
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  /** Transaction execution failure */
  TRANSACTION_EXECUTION_ERROR = 'TRANSACTION_EXECUTION_ERROR',
  
  /** KILT DID registration failure */
  DID_REGISTRATION_ERROR = 'DID_REGISTRATION_ERROR',
  
  /** KILT credential verification failure */
  CREDENTIAL_VERIFICATION_ERROR = 'CREDENTIAL_VERIFICATION_ERROR',
  
  /** KILT governance proposal error */
  GOVERNANCE_ERROR = 'GOVERNANCE_ERROR',
  
  /** KILT delegation service error */
  DELEGATION_ERROR = 'DELEGATION_ERROR',
}

/**
 * KILT-specific error class.
 */
export class KILTError extends Error {
  public readonly code: KILTErrorType;
  public readonly transactionHash?: string;
  public readonly blockNumber?: number;
  public readonly parachainInfo?: KILTParachainInfo;

  constructor(
    message: string,
    code: KILTErrorType,
    details?: {
      transactionHash?: string;
      blockNumber?: number;
      parachainInfo?: KILTParachainInfo;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'KILTError';
    this.code = code;
    this.transactionHash = details?.transactionHash;
    this.blockNumber = details?.blockNumber;
    this.parachainInfo = details?.parachainInfo;

    // Preserve original error stack trace
    if (details?.cause) {
      this.stack = details.cause.stack;
    }
  }

  /**
   * Creates a formatted error message including KILT-specific context.
   */
  public toDetailedMessage(): string {
    let message = `KILT Error [${this.code}]: ${this.message}`;
    
    if (this.transactionHash) {
      message += `\nTransaction Hash: ${this.transactionHash}`;
    }
    
    if (this.blockNumber !== undefined) {
      message += `\nBlock Number: ${this.blockNumber}`;
    }
    
    if (this.parachainInfo) {
      message += `\nNetwork: ${this.parachainInfo.network} (${this.parachainInfo.chainName})`;
      message += `\nChain Version: ${this.parachainInfo.version}`;
    }
    
    return message;
  }
}

/**
 * KILT DID operation status enumeration.
 */
export enum KILTDIDStatus {
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
 * Request interface for creating KILT DIDs.
 */
export interface KILTCreateDIDRequest {
  /** DID identifier (optional - will be generated from address if not provided) */
  did?: string;
  
  /** DID controller */
  controller?: string;
  
  /** Initial verification methods to add */
  verificationMethods?: Partial<KILTVerificationMethod>[];
  
  /** Initial services to add */
  services?: Partial<KILTService>[];
  
  /** DID metadata */
  metadata?: Record<string, unknown>;
  
  /** Transaction fee payer */
  feePayer?: string;
}

/**
 * Response interface for KILT DID creation.
 */
export interface KILTCreateDIDResponse {
  /** Created KILT DID */
  did: string;
  
  /** Created DID document */
  didDocument: KILTDIDDocument;
  
  /** Transaction result */
  transactionResult: KILTTransactionResult;
  
  /** Creation status */
  status: KILTDIDStatus;
}
