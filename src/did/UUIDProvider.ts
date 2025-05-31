import { decodeAddress, encodeAddress, base58Encode, base58Decode } from '@polkadot/util-crypto';
import { DIDDocument, DIDProvider, DIDResolver, Service, VerificationMethod } from './types';
import { MULTIBASE_PREFIXES, VERIFICATION_METHOD_TYPES } from './verification';
import { validatePolkadotAddress } from '../adapters/types';
import { AddressValidationError } from '../errors/WalletErrors';

/**
 * Provider for creating and managing Polkadot DIDs.
 * Implements the did:key method for Polkadot addresses.
 * @see https://w3c-ccg.github.io/did-method-key/
 */
export class PolkadotDIDProvider implements DIDProvider, DIDResolver {
  private static readonly DID_CONTEXT = [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://w3id.org/security/suites/sr25519-2020/v1'
  ];

  /**
   * Validates a Polkadot address.
   * @param address - The address to validate
   * @throws {AddressValidationError} If the address is invalid
   * @private
   */
  private validateAddress(address: string): void {
    validatePolkadotAddress(address);
  }

  /**
   * Creates a DID for the given address.
   * @param address - The Polkadot address to create the DID for
   * @returns A promise that resolves to the DID in the format did:key:<multibase-encoded-public-key>
   * @throws {AddressValidationError} If the address is invalid
   */
  public async createDid(address: string): Promise<string> {
    this.validateAddress(address);
    
    try {
      // Decode the address to get the public key
      const publicKey = decodeAddress(address);
      
      // Encode the public key in base58
      const base58Key = base58Encode(publicKey);
      
      // Create the did:key identifier with multibase prefix
      return `did:key:${MULTIBASE_PREFIXES.BASE58BTC}${base58Key}`;
    } catch (error) {
      throw new AddressValidationError('Invalid Polkadot address');
    }
  }

  /**
   * Creates a DID document for the given address.
   * @param address - The Polkadot address to create the DID document for
   * @returns A promise that resolves to the DID document
   * @throws {AddressValidationError} If the address is invalid
   */
  public async createDIDDocument(address: string): Promise<DIDDocument> {
    const did = await this.createDid(address);
    const verificationMethod = await this.createVerificationMethod(did, address);

    return {
      '@context': PolkadotDIDProvider.DID_CONTEXT,
      id: did,
      controller: did,
      verificationMethod: [verificationMethod],
      authentication: [verificationMethod.id],
      assertionMethod: [verificationMethod.id],
      keyAgreement: [],
      capabilityInvocation: [verificationMethod.id],
      capabilityDelegation: [verificationMethod.id],
      service: []
    };
  }

  /**
   * Resolves a DID to its DID document.
   * @param did - The DID to resolve
   * @returns The DID document
   * @throws {Error} If the DID cannot be resolved
   */
  public async resolve(did: string): Promise<DIDDocument> {
    if (!did.startsWith('did:key:')) {
      throw new Error('Invalid DID format');
    }

    const address = await this.extractAddress(did);
    return this.createDIDDocument(address);
  }

  /**
   * Extracts the Polkadot address from a DID.
   * @param did - The DID to extract the address from
   * @returns The Polkadot address
   * @throws {Error} If the address cannot be extracted
   */
  public async extractAddress(did: string): Promise<string> {
    if (!did.startsWith('did:key:')) {
      throw new Error('Invalid DID format');
    }

    // Extract the multibase-encoded public key
    const multibaseKey = did.slice(8); // Remove 'did:key:'
    console.log('multibaseKey:', multibaseKey);
    
    // Validate that there's content after 'did:key:'
    if (!multibaseKey || multibaseKey.length === 0) {
      throw new Error('Invalid DID format');
    }

    // Validate that the multibase key has enough characters
    if (multibaseKey.length < 2) {
      throw new Error('Invalid DID format');
    }

    // Validate the multibase prefix
    if (!multibaseKey.startsWith(MULTIBASE_PREFIXES.BASE58BTC)) {
      throw new Error('Invalid public key in DID');
    }
    
    try {
      // Decode the base58 key
      const keyToDecode = multibaseKey.slice(1); // Remove multibase prefix
      console.log('keyToDecode:', keyToDecode);
      const publicKey = base58Decode(keyToDecode);
      console.log('publicKey:', publicKey);
      
      try {
        // Encode as a Polkadot address
        const address = encodeAddress(publicKey);
        console.log('encoded address:', address);
        return address;
      } catch (error) {
        if (error instanceof Error && error.message === 'Address encoding failed') {
          throw new Error('Failed to encode address');
        }
        throw error; // Re-throw other errors
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid public key in DID') {
        throw error;
      }
      if (error instanceof Error && error.message === 'Failed to encode address') {
        throw error;
      }
      throw new Error('Invalid public key in DID');
    }
  }

  /**
   * Creates a verification method for the given DID and address.
   * @param did - The DID to create the verification method for
   * @param address - The Polkadot address
   * @returns The verification method
   * @private
   */
  private async createVerificationMethod(did: string, address: string): Promise<VerificationMethod> {
    const publicKey = decodeAddress(address);
    const base58Key = base58Encode(publicKey);
    const multibaseKey = MULTIBASE_PREFIXES.BASE58BTC + base58Key;

    return {
      id: `${did}#${multibaseKey.slice(0, 8)}`,
      type: VERIFICATION_METHOD_TYPES.SR25519_2020,
      controller: did,
      publicKeyMultibase: multibaseKey
    };
  }
}
