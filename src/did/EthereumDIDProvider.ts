import { DIDDocument, DIDProvider, DIDResolver, VerificationMethod } from './types';
import { MULTIBASE_PREFIXES, VERIFICATION_METHOD_TYPES } from './verification';
import { AddressValidationError } from '../errors/WalletErrors';

// Simple Ethereum address validation
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Provider for creating and managing Ethereum DIDs.
 * Creates DIDs from Ethereum addresses using a simplified approach.
 */
export class EthereumDIDProvider implements DIDProvider, DIDResolver {
  private static readonly DID_CONTEXT = [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/secp256k1-2019/v1',
  ];

  /**
   * Validates an Ethereum address.
   */
  private validateAddress(address: string): void {
    if (!isValidEthereumAddress(address)) {
      throw new AddressValidationError('Invalid Ethereum address format');
    }
  }

  /**
   * Creates a DID for the given Ethereum address.
   * Uses a simple format: did:key:<address-based-identifier>
   */
  public async createDid(address: string): Promise<string> {
    this.validateAddress(address);
    
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Create a deterministic identifier from the address
    // Using the address itself as the key material
    const addressBytes = Buffer.from(normalizedAddress.slice(2), 'hex'); // Remove 0x prefix
    const base58Key = addressBytes.toString('base64').replace(/[/+=]/g, ''); // Simple base64 encoding, cleaned
    
    return `did:key:${MULTIBASE_PREFIXES.BASE58BTC}${base58Key}`;
  }

  /**
   * Creates a DID document for the given Ethereum address.
   */
  public async createDIDDocument(address: string): Promise<DIDDocument> {
    this.validateAddress(address);
    
    const did = await this.createDid(address);
    const verificationMethod = await this.createVerificationMethod(did, address);

    return {
      '@context': EthereumDIDProvider.DID_CONTEXT,
      id: did,
      controller: did,
      verificationMethod: [verificationMethod],
      authentication: [verificationMethod.id],
      assertionMethod: [verificationMethod.id],
      keyAgreement: [],
      capabilityInvocation: [verificationMethod.id],
      capabilityDelegation: [verificationMethod.id],
      service: [],
    };
  }

  /**
   * Resolves a DID to its DID document.
   */
  public async resolve(did: string): Promise<DIDDocument> {
    if (!did.startsWith('did:key:')) {
      throw new Error('Invalid DID format');
    }

    const address = await this.extractAddress(did);
    return this.createDIDDocument(address);
  }

  /**
   * Extracts the Ethereum address from a DID.
   */
  public async extractAddress(did: string): Promise<string> {
    if (!did.startsWith('did:key:')) {
      throw new Error('Invalid DID format');
    }

    const multibaseKey = did.slice(8); // Remove 'did:key:'
    if (!multibaseKey.startsWith(MULTIBASE_PREFIXES.BASE58BTC)) {
      throw new Error('Invalid DID format');
    }

    try {
      const encodedAddress = multibaseKey.slice(1); // Remove multibase prefix
      // Add padding if necessary for base64 decoding
      const paddedAddress = encodedAddress + '='.repeat((4 - encodedAddress.length % 4) % 4);
      const addressBytes = Buffer.from(paddedAddress, 'base64');
      const address = '0x' + addressBytes.toString('hex');
      
      if (!isValidEthereumAddress(address)) {
        throw new Error('Invalid address in DID');
      }
      
      return address.toLowerCase(); // Normalize to lowercase
    } catch (error) {
      throw new Error('Invalid DID format');
    }
  }

  /**
   * Creates a verification method for the given DID and address.
   */
  private async createVerificationMethod(did: string, address: string): Promise<VerificationMethod> {
    const addressBytes = Buffer.from(address.slice(2), 'hex');
    const base58Key = addressBytes.toString('base64').replace(/[/+=]/g, '');
    const multibaseKey = MULTIBASE_PREFIXES.BASE58BTC + base58Key;

    return {
      id: `${did}#${multibaseKey.slice(0, 8)}`,
      type: 'EcdsaSecp256k1VerificationKey2019',
      controller: did,
      publicKeyMultibase: multibaseKey,
    };
  }
} 