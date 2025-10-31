/**
 * Basic DID types for React environment
 */

export interface DIDDocument {
  '@context': string | string[];
  id: string;
  verificationMethod?: VerificationMethod[];
  service?: Service[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  blockchainAccountId?: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string | ServiceEndpoint;
}

export interface ServiceEndpoint {
  url: string;
  [key: string]: any;
}


