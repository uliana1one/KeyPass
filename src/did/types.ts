import { VerificationMethod } from './verification';

/**
 * Represents a DID document following the W3C DID Core specification.
 * @see https://www.w3.org/TR/did-core/
 */
export interface DIDDocument {
  '@context': string[];
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: Service[];
}

/**
 * Represents a service endpoint in a DID document.
 */
export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

/**
 * Represents a verification method in a DID document.
 * @see https://www.w3.org/TR/did-core/#verification-methods
 */
export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
}

/**
 * Represents a DID resolver that can resolve DIDs to DID documents
 * and extract addresses from DIDs.
 */
export interface DIDResolver {
  /**
   * Resolves a DID to its DID document.
   * @param did - The DID to resolve
   * @returns The DID document
   * @throws {Error} If the DID cannot be resolved
   */
  resolve(did: string): Promise<DIDDocument>;

  /**
   * Extracts the Polkadot address from a DID.
   * @param did - The DID to extract the address from
   * @returns The Polkadot address
   * @throws {Error} If the address cannot be extracted
   */
  extractAddress(did: string): Promise<string>;
}

/**
 * Represents a DID provider that can create and manage DIDs.
 */
export interface DIDProvider {
  /**
   * Creates a DID for the given address.
   * @param address - The Polkadot address to create the DID for
   * @returns A promise that resolves to the DID
   * @throws {Error} If the DID cannot be created
   */
  createDid(address: string): Promise<string>;

  /**
   * Creates a DID document for the given address.
   * @param address - The Polkadot address to create the DID document for
   * @returns A promise that resolves to the DID document
   * @throws {Error} If the DID document cannot be created
   */
  createDIDDocument(address: string): Promise<DIDDocument>;
} 