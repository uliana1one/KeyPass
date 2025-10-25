/**
 * Real Moonbeam DID Provider with blockchain integration
 */

import { ethers } from 'ethers';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { MoonbeamNetwork, MoonbeamErrorCode } from '../../config/moonbeamConfig';
import { DIDRegistryService, DIDRegistryAddress } from '../../contracts/DIDRegistryContract';

export interface DIDCreationResult {
  did: string;
  txHash: string;
}

export interface DIDResolutionResult {
  did: string;
  didDocument: any;
}

export class MoonbeamDIDProvider {
  private adapter: MoonbeamAdapter;
  private contractAddress: DIDRegistryAddress;
  private didRegistryService: DIDRegistryService;
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(adapter: MoonbeamAdapter, contractAddress: DIDRegistryAddress) {
    this.adapter = adapter;
    this.contractAddress = contractAddress;
    this.provider = adapter.getProvider()!;
    this.signer = undefined; // Signer will be provided when needed
    this.didRegistryService = new DIDRegistryService(
      contractAddress,
      this.provider,
      this.signer
    );
  }

  /**
   * Create a DID for the given address
   */
  async createDID(address: string): Promise<DIDCreationResult> {
    try {
      if (!this.signer) {
        throw new Error('Signer required for DID creation');
      }

      // Generate DID in format: did:moonbeam:0x...
      const did = `did:moonbeam:${address.slice(2)}`;
      
      // Create DID document
      const didDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: did,
        verificationMethod: [{
          id: `${did}#key-1`,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
          controller: did,
          blockchainAccountId: `${address}@eip155:1287`
        }],
        authentication: [`${did}#key-1`],
        assertionMethod: [`${did}#key-1`]
      };

      // Register DID on blockchain
      const tx = await this.didRegistryService.registerDID(did, JSON.stringify(didDocument));
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      return {
        did,
        txHash: receipt.hash
      };
    } catch (error) {
      throw new Error(`Failed to create DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolve a DID
   */
  async resolveDid(did: string): Promise<DIDResolutionResult | null> {
    try {
      const didRecord = await this.didRegistryService.getDID(did);
      
      if (!didRecord.isActive) {
        return null;
      }

      return {
        did,
        didDocument: JSON.parse(didRecord.didDocument)
      };
    } catch (error) {
      console.error('Failed to resolve DID:', error);
      return null;
    }
  }

  /**
   * Update a DID document
   */
  async updateDid(did: string, didDocument: any): Promise<void> {
    try {
      if (!this.signer) {
        throw new Error('Signer required for DID update');
      }

      const tx = await this.didRegistryService.updateDID(did, JSON.stringify(didDocument));
      await tx.wait();
    } catch (error) {
      throw new Error(`Failed to update DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate a DID
   */
  async deactivateDid(did: string): Promise<void> {
    try {
      if (!this.signer) {
        throw new Error('Signer required for DID deactivation');
      }

      const tx = await this.didRegistryService.deactivateDID(did);
      await tx.wait();
    } catch (error) {
      throw new Error(`Failed to deactivate DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get DID for an address
   */
  async getDID(address: string): Promise<string | null> {
    try {
      const did = `did:moonbeam:${address.slice(2)}`;
      const { exists, isActive } = await this.didRegistryService.checkDID(did);
      
      if (exists && isActive) {
        return did;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get DID:', error);
      return null;
    }
  }

  /**
   * Check if DID exists for an address
   */
  async didExists(address: string): Promise<boolean> {
    try {
      const did = `did:moonbeam:${address.slice(2)}`;
      const { exists, isActive } = await this.didRegistryService.checkDID(did);
      return exists && isActive;
    } catch (error) {
      console.error('Failed to check DID existence:', error);
      return false;
    }
  }

  /**
   * Get DID document for an address
   */
  async getDIDDocument(address: string): Promise<any | null> {
    try {
      const did = await this.getDID(address);
      if (!did) return null;

      const result = await this.resolveDid(did);
      return result?.didDocument || null;
    } catch (error) {
      console.error('Failed to get DID document:', error);
      return null;
    }
  }
}