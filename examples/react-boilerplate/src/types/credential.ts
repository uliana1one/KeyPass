// Verifiable Credential Types
export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
    logo?: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
    zkProof?: ZKProof;
  };
  status: CredentialStatus;
  metadata: {
    schema: string;
    privacy: PrivacyLevel;
    revocable: boolean;
    transferable: boolean;
  };
}

export interface ZKProof {
  type: 'semaphore' | 'plonk' | 'groth16';
  proof: string;
  publicSignals: string[];
  verificationKey: string;
  circuit: string;
}

export interface CredentialRequest {
  id: string;
  type: string[];
  requiredClaims: string[];
  purpose: string;
  requestedBy: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: string;
  expiresAt?: string;
  status: RequestStatus;
  privacyRequirements: {
    zkProofRequired: boolean;
    selectiveDisclosure: boolean;
    minimumDisclosure: string[];
  };
}

export interface CredentialOffer {
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
    logo?: string;
    trustScore: number;
  };
  credentialSubject: Record<string, any>;
  issuanceDate: string;
  expirationDate?: string;
  requirements: {
    verificationMethod: string;
    proofOfControl: boolean;
    additionalVerification?: string[];
  };
  status: OfferStatus;
}

export interface CredentialPresentation {
  id: string;
  type: string[];
  verifiableCredential: VerifiableCredential[];
  proof: {
    type: string;
    created: string;
    challenge: string;
    domain: string;
    proofPurpose: string;
    verificationMethod: string;
    jws?: string;
    zkProof?: ZKProof;
  };
  holder: string;
  verifier: string;
}

// Enums
export const CredentialStatus = {
  VALID: 'valid',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
} as const;

export type CredentialStatus = typeof CredentialStatus[keyof typeof CredentialStatus];

export const RequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  FULFILLED: 'fulfilled',
  EXPIRED: 'expired'
} as const;

export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];

export const OfferStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  ISSUED: 'issued',
  EXPIRED: 'expired'
} as const;

export type OfferStatus = typeof OfferStatus[keyof typeof OfferStatus];

export const PrivacyLevel = {
  PUBLIC: 'public',
  SELECTIVE: 'selective',
  ZERO_KNOWLEDGE: 'zero-knowledge',
  PRIVATE: 'private'
} as const;

export type PrivacyLevel = typeof PrivacyLevel[keyof typeof PrivacyLevel];

// Credential Schema Definitions
export interface CredentialSchema {
  id: string;
  name: string;
  description: string;
  type: string;
  version: string;
  properties: Record<string, SchemaProperty>;
  required: string[];
  issuerRestrictions?: string[];
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  description: string;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: any[];
  privacy: PrivacyLevel;
}

// ZK-Proof Circuit Definitions
export interface ZKCircuit {
  id: string;
  name: string;
  description: string;
  type: 'age-verification' | 'membership-proof' | 'range-proof' | 'equality-proof';
  verificationKey: string;
  constraints: Record<string, any>;
  publicInputs: string[];
  privateInputs: string[];
} 