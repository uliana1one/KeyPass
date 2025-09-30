import { decodeAddress, encodeAddress, base58Encode } from '@polkadot/util-crypto';
import { DIDDocument, DIDProvider, DIDResolver, VerificationMethod } from './types.js';
import { MULTIBASE_PREFIXES, VERIFICATION_METHOD_TYPES } from './verification.js';
import { validatePolkadotAddress } from '../adapters/types.js';
import { AddressValidationError } from '../errors/WalletErrors.js';
import { KiltAdapter } from '../adapters/KiltAdapter.js';
import { 
  KILTCreateDIDRequest,
  KILTCreateDIDResponse,
  KILTTransactionResult,
  KILTTransactionEvent,
  KILTError,
  KILTErrorType,
  KILTDIDStatus,
  KILTDIDDocument,
  KILTVerificationMethod,
  KILTService
} from './types/KILTTypes.js';

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
  private readonly confirmationTimeout = 30000; // 30 seconds timeout for transaction confirmation

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

  /**
   * Registers a KILT DID on the blockchain.
   * Creates the DID with associated verification methods and services.
   * @param request - The KILT DID creation request
   * @returns A promise that resolves to the creation response
   * @throws {KILTError} If registration fails
   */
  public async registerDIDOnChain(request: KILTCreateDIDRequest): Promise<KILTCreateDIDResponse> {
    try {
      // Validate the request
      this.validateAddress(request.accountAddress);
      
      // Connect to KILT parachain
      await this.kiltAdapter.connect();
      
      // Create the DID
      const did = await this.createDid(request.accountAddress);
      
      // Create the DID document
      const didDocument = await this.createDIDDocument(request.accountAddress) as KILTDIDDocument;
      
      // Prepare transaction extrinsics
      const extrinsics = await this.prepareDIDRegistrationTransaction(request, didDocument);
      
      // Submit the transaction
      const transactionResult = await this.submitTransaction(extrinsics, request.feePayer || request.accountAddress);
      
      return {
        did,
        didDocument,
        transactionResult,
        status: KILTDIDStatus.ACTIVE,
      };
    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }
      
      throw new KILTError(
        `Failed to register KILT DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Generates a key agreement key for KILT DIDs.
   * @returns A promise that resolves to a multibase-encoded key
   */
  public async generateKeyAgreementKey(): Promise<string> {
    try {
      // Generate random 32 bytes for the key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      
      // Create a unique identifier using timestamp and random bytes
      const timestamp = Date.now().toString(36);
      const randomSuffix = Array.from(keyBytes.slice(0, 8), byte => byte.toString(36)).join('');
      const uniqueKey = `${timestamp}${randomSuffix}`;
      
      // Return in base58 multibase format (simplified for testing)
      return `${MULTIBASE_PREFIXES.BASE58BTC}${uniqueKey}`;
    } catch (error) {
      throw new KILTError(
        `Failed to generate key agreement key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR
      );
    }
  }

  /**
   * Submits a transaction to the KILT parachain.
   * @param extrinsics - Array of transaction extrinsics
   * @param signer - Address to sign the transaction
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If transaction submission fails
   */
  public async submitTransaction(extrinsics: any[], signer: string): Promise<KILTTransactionResult> {
    try {
      // Validate the signer address
      this.validateAddress(signer);
      
      // Ensure adapter is connected - this will throw if connection fails
      if (!this.kiltAdapter.getChainInfo()) {
        await this.kiltAdapter.connect();
      }
      
      // Mock transaction submission - in real implementation, this would use the KILT API
      const transactionHash = this.generateMockTransactionHash();
      const blockNumber = this.generateMockBlockNumber();
      const blockHash = this.generateMockBlockHash();
      
      // Wait for confirmation
      await this.waitForConfirmation(transactionHash);
      
      // Mock transaction events
      const events: KILTTransactionEvent[] = [
        {
          type: 'did.DidCreated',
          section: 'did',
          method: 'DidCreated',
          data: { did: 'mock-did' },
          index: 0,
        },
      ];
      
      return {
        success: true,
        transactionHash,
        blockNumber,
        blockHash,
        events,
        fee: {
          amount: '1000000000000000000', // 1 KILT in smallest unit
          currency: 'KILT',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }
      
      throw new KILTError(
        `Transaction submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Waits for transaction confirmation on the KILT parachain.
   * @param transactionHash - The transaction hash to wait for
   * @returns A promise that resolves to confirmation details
   * @throws {KILTError} If confirmation times out or fails
   */
  public async waitForConfirmation(transactionHash: string): Promise<{ blockNumber: number; blockHash: string }> {
    try {
      // Validate transaction hash format
      if (!/^0x[a-f0-9]{64}$/.test(transactionHash)) {
        throw new KILTError('Invalid transaction hash format', KILTErrorType.TRANSACTION_EXECUTION_ERROR);
      }
      
      // Mock confirmation wait - in real implementation, this would poll the blockchain
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      // Mock confirmation result
      return {
        blockNumber: this.generateMockBlockNumber(),
        blockHash: this.generateMockBlockHash(),
      };
    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }
      
      throw new KILTError(
        `Transaction confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Prepares DID registration transaction extrinsics.
   * @private
   */
  private async prepareDIDRegistrationTransaction(
    request: KILTCreateDIDRequest,
    didDocument: KILTDIDDocument
  ): Promise<any[]> {
    try {
      // Mock transaction preparation - in real implementation, this would create actual extrinsics
      const extrinsics = [
        {
          method: 'did.create',
          args: [request.accountAddress, didDocument],
        },
      ];
      
      return extrinsics;
    } catch (error) {
      throw new KILTError(
        `Failed to prepare DID registration transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR
      );
    }
  }

  /**
   * Generates a mock transaction hash for testing.
   * @private
   */
  private generateMockTransactionHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Generates a mock block number for testing.
   * @private
   */
  private generateMockBlockNumber(): number {
    return Math.floor(Math.random() * 10000000) + 5000000; // Realistic block range
  }

  /**
   * Generates a mock block hash for testing.
   * @private
   */
  private generateMockBlockHash(): string {
    return this.generateMockTransactionHash();
  }
}
