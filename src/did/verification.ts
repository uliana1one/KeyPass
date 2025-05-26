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
 * Constants for verification method types.
 */
export const VERIFICATION_METHOD_TYPES = {
  /**
   * Ed25519 verification key 2020
   * @see https://w3c-ccg.github.io/lds-ed25519-2020/
   */
  ED25519_2020: 'Ed25519VerificationKey2020',
  
  /**
   * Sr25519 verification key 2020
   * Used for Polkadot/Substrate keys
   */
  SR25519_2020: 'Sr25519VerificationKey2020',
  
  /**
   * EcdsaSecp256k1 verification key 2019
   * @see https://w3c-ccg.github.io/lds-ecdsa-secp256k1-2019/
   */
  ECDSA_SECP256K1_2019: 'EcdsaSecp256k1VerificationKey2019'
} as const;

/**
 * Constants for multibase encoding prefixes.
 * @see https://github.com/multiformats/multibase
 */
export const MULTIBASE_PREFIXES = {
  /**
   * Base58btc encoding
   */
  BASE58BTC: 'z',
  
  /**
   * Base64url encoding
   */
  BASE64URL: 'u'
} as const; 