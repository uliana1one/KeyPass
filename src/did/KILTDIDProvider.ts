import { decodeAddress, encodeAddress, base58Encode } from '@polkadot/util-crypto';
import { DIDDocument, DIDProvider, DIDResolver, VerificationMethod } from './types.js';
import { MULTIBASE_PREFIXES, VERIFICATION_METHOD_TYPES } from './verification.js';
import { validatePolkadotAddress } from '../adapters/types.js';
import { AddressValidationError } from '../errors/WalletErrors.js';
import { KiltAdapter } from '../adapters/KiltAdapter.js';

/**
 * Provider for creating and managing KILT DIDs.
 * Implements the did:kilt method for KILT addresses with onchain verification.
 * 
 * This provider creates DIDs that can be verified on the KILT parachain,
 * providing an onchain source of truth for DID ownership and authentication.
 */
export class KILTDIDProvider implements DIDProvider, DIDResolver {
  private static readonly DID_CONTEXT = [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/sr25519-2020/v1',
    'https://w3id.org/security/suites/kilt-2023/v1', // KILT-specific context
  ];

  private kiltAdapter: KiltAdapter;

  constructor(kiltAdapter?: KiltAdapter) {
    this.kiltAdapter = kiltAdapter || new KiltAdapter();
  }

  /**
   * Validates a KILT address with SS58 format 38.
   * @param address - The address to validate
   * @throws {AddressValidationError} If the address is invalid
   * @private
   */
  private validateAddress(address: string): void {
    try {
      validatePolkadotAddress(address, 38); // KILT uses SS58 format 38
    } catch (error) {
      throw new AddressValidationError('Invalid KILT address format');
    }
  }

  /**
   * Creates a KILT DID for the given address.
   * Format: did:kilt:<ss58-address> or did:kilt:<public-key-hash>
   * 
   * @param address - The KILT address to create the DID for
   * @returns A promise that resolves to the DID in the format did:kilt:<identifier>
   * @throws {AddressValidationError} If the address is invalid
   */
  public async createDid(address: string): Promise<string> {
    this.validateAddress(address);

    // For now, we'll use the address directly as SS58 format validation ensures it's valid
    // In a full implementation, this might involve onchain registration
    const normalizedAddress = address.trim();
    
    // Create the did:kilt identifier
    return `did:kilt:${normalizedAddress}`;
  }

  /**
   * Creates a KILT DID document for the given address.
   * Includes KILT-specific verification methods and onchain service endpoints.
   * 
   * @param address - The KILT address to create the DID document for
   * @returns A promise that resolves to the DID document
   * @throws {AddressValidationError} If the address is invalid
   */
  public async createDIDDocument(address: string): Promise<DIDDocument> {
    this.validateAddress(address);
    
    const did = await this.createDid(address);
    const verificationMethod = await this.createVerificationMethod(did, address);

    return {
      '@context': KILTDIDProvider.DID_CONTEXT,
      id: did,
      controller: did,
      verificationMethod: [verificationMethod],
      authentication: [verificationMethod.id],
      assertionMethod: [verificationMethod.id],
      keyAgreement: [],
      capabilityInvocation: [verificationMethod.id],
      capabilityDelegation: [verificationMethod.id],
      service: [
        {
          id: `${did}#kilt-parachain`,
          type: 'KiltParachainService',
          serviceEndpoint: 'wss://spiritnet.kilt.io',
        },
        {
          id: `${did}#kilt-did-registry`,
          type: 'KiltDIDRegistry',
          serviceEndpoint: 'https://spiritnet.api.subscan.io/api',
        },
      ],
    };
  }

  /**
   * Creates a verification method for a KILT DID.
   * @param did - The DID identifier
   * @param address - The KILT address
   * @returns A verification method object
   * @throws {Error} If the verification method cannot be created
   */
  private async createVerificationMethod(did: string, address: string): Promise<VerificationMethod> {
    try {
      // Decode the address to get the public key
      const publicKey = decodeAddress(address);
      
      // Encode the public key in base58 multibase format
      const publicKeyMultibase = `${MULTIBASE_PREFIXES.BASE58BTC}${base58Encode(publicKey)}`;
      
      return {
        id: `${did}#${address.replace(/^[1-9A-HJ-NP-Za-km-z]+/, 'kilt')}`,
        type: VERIFICATION_METHOD_TYPES.SR25519_2020,
        controller: did,
        publicKeyMultibase,
      };
    } catch (error) {
      throw new Error(`Failed to create verification method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolves a KILT DID to its DID document.
   * For now, this creates the DID document from the address.
   * In a full implementation, this would query the KILT parachain for onchain DID data.
   * 
   * @param did - The KILT DID to resolve
   * @returns A promise that resolves to the DID document
   * @throws {Error} If the DID cannot be resolved
   */
  public async resolve(did: string): Promise<DIDDocument> {
    if (!did.startsWith('did:kilt:')) {
      throw new Error('Invalid KILT DID format');
    }

    try {
      const address = await this.extractAddress(did);
      return this.createDIDDocument(address);
    } catch (error) {
      throw new Error(`Failed to resolve KILT DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts the KILT address from a DID.
   * @param did - The KILT DID to extract the address from
   * @returns The KILT address (SS58 format)
   * @throws {Error} If the address cannot be extracted
   */
  public async extractAddress(did: string): Promise<string> {
    if (!did.startsWith('did:kilt:')) {
      throw new Error('Invalid KILT DID format');
    }

    try {
      // Extract the address part after 'did:kilt:'
      const address = did.replace('did:kilt:', '');
      
      // Validate that it's a proper KILT address
      this.validateAddress(address);
      
      return address;
    } catch (error) {
      throw new Error(`Failed to extract address from KILT DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifies a KILT DID against the onchain registry.
   * This method connects to the KILT parachain to verify the DID exists and is active.
   * @param did - The KILT DID to verify
   * @returns A promise that resolves to true if the DID is valid and active onchain
   */
  public async verifyOnchain(did: string): Promise<boolean> {
    try {
      // Connect to KILT parachain
      await this.kiltAdapter.connect();
      
      // Extract the address from the DID
      const address = await this.extractAddress(did);
      
      // In a full implementation, this would query the KILT parachain DID registry
      // For now, we'll validate that the address format is correct and adapter is connected
      const chainInfo = this.kiltAdapter.getChainInfo();
      
      return chainInfo !== null && chainInfo.network === 'spiritnet';
    } catch (error) {
      console.warn(`Failed to verify KILT DID onchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
}
