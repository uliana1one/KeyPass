import { ethers } from 'ethers';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { MoonbeamDIDService, DIDDocument, VerificationMethod, ServiceEndpoint } from './MoonbeamDIDService';
import { BlockchainError, MoonbeamBlockchainError, MoonbeamErrorCode } from '../../errors/BlockchainErrors';

/**
 * Moonbeam DID Provider
 * Provides a high-level interface for DID operations on Moonbeam
 */
export class MoonbeamDIDProvider {
  private adapter: MoonbeamAdapter;
  private didService: MoonbeamDIDService;
  private contractAddress: string;

  constructor(adapter: MoonbeamAdapter, contractAddress: string) {
    this.adapter = adapter;
    this.contractAddress = contractAddress;
    this.didService = new MoonbeamDIDService(adapter, contractAddress);
  }

  /**
   * Check if the provider is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const provider = this.adapter.getProvider();
      return provider !== null && provider !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get the current wallet address
   */
  async getCurrentAddress(): Promise<string> {
    try {
      const signer = this.adapter.getSigner();
      if (!signer) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Signer not available',
          'CONNECTION'
        );
      }
      return await signer.getAddress();
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONNECTION_FAILED,
        `Failed to get current address: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION'
      );
    }
  }

  /**
   * Create a new DID for the current wallet
   */
  async createDID(): Promise<string> {
    try {
      const address = await this.getCurrentAddress();
      
      // Check if address already has a DID
      const existingDID = await this.didService.getDIDForAddress(address);
      if (existingDID && existingDID.length > 0) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.INVALID_PARAMETERS,
          'Address already has a DID',
          'USER'
        );
      }

      // Create basic DID document
      const didDocument = JSON.stringify({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:moonbeam:${address}`,
        verificationMethod: [],
        service: []
      });

      return await this.didService.registerDID(didDocument);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Failed to create DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Get DID for the current wallet
   */
  async getDID(): Promise<string | null> {
    try {
      const address = await this.getCurrentAddress();
      const did = await this.didService.getDIDForAddress(address);
      return did && did.length > 0 ? did : null;
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Get DID document
   */
  async getDIDDocument(did: string): Promise<DIDDocument> {
    try {
      return await this.didService.getDIDDocument(did);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get DID document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Update DID document
   */
  async updateDIDDocument(did: string, didDocument: object): Promise<void> {
    try {
      const didDocumentString = JSON.stringify(didDocument);
      await this.didService.updateDID(did, didDocumentString);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Failed to update DID document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Add a verification method to a DID
   */
  async addVerificationMethod(
    did: string,
    verificationMethodId: string,
    verificationMethodType: string,
    publicKeyMultibase: string
  ): Promise<void> {
    try {
      await this.didService.addVerificationMethod(
        did,
        verificationMethodId,
        verificationMethodType,
        publicKeyMultibase
      );
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Failed to add verification method: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Remove a verification method from a DID
   */
  async removeVerificationMethod(did: string, verificationMethodId: string): Promise<void> {
    try {
      await this.didService.removeVerificationMethod(did, verificationMethodId);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Failed to remove verification method: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Get verification method
   */
  async getVerificationMethod(verificationMethodId: string): Promise<VerificationMethod> {
    try {
      return await this.didService.getVerificationMethod(verificationMethodId);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get verification method: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Add a service endpoint to a DID
   */
  async addServiceEndpoint(
    did: string,
    serviceEndpointId: string,
    serviceType: string,
    serviceEndpointUrl: string
  ): Promise<void> {
    try {
      await this.didService.addServiceEndpoint(
        did,
        serviceEndpointId,
        serviceType,
        serviceEndpointUrl
      );
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Failed to add service endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Remove a service endpoint from a DID
   */
  async removeServiceEndpoint(did: string, serviceEndpointId: string): Promise<void> {
    try {
      await this.didService.removeServiceEndpoint(did, serviceEndpointId);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Failed to remove service endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Get service endpoint
   */
  async getServiceEndpoint(serviceEndpointId: string): Promise<ServiceEndpoint> {
    try {
      return await this.didService.getServiceEndpoint(serviceEndpointId);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get service endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Deactivate a DID
   */
  async deactivateDID(did: string): Promise<void> {
    try {
      await this.didService.deactivateDID(did);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Failed to deactivate DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Check if a DID exists
   */
  async didExists(did: string): Promise<boolean> {
    try {
      return await this.didService.didExists(did);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to check DID existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Get total number of registered DIDs
   */
  async getTotalDIDCount(): Promise<number> {
    try {
      return await this.didService.getTotalDIDCount();
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get total DID count: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Get the underlying DID service for advanced operations
   */
  getDIDService(): MoonbeamDIDService {
    return this.didService;
  }

  /**
   * Get the contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get the adapter
   */
  getAdapter(): MoonbeamAdapter {
    return this.adapter;
  }
}
