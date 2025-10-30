import { ethers } from 'ethers';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { MoonbeamDIDService, MoonbeamDIDDocument, VerificationMethod, ServiceEndpoint } from '../services/MoonbeamDIDService';
import { BlockchainError, MoonbeamBlockchainError, MoonbeamErrorCode, ErrorCategory } from '../../errors/BlockchainErrors';

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
    // Simplified: Return a placeholder - in production this should come from the connected wallet
    return '0x0000000000000000000000000000000000000000';
  }

  /**
   * Create a new DID for the current wallet
   */
  async createDID(address?: string): Promise<string> {
    try {
      const addr = address || (await this.getCurrentAddress());
      const existingDID = await this.didService.getDIDForAddress(addr);
      if (existingDID && existingDID.length > 0) {
        return existingDID;
      }

      const didDocument = JSON.stringify({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:moonbeam:${addr}`,
        verificationMethod: [],
        service: []
      });

      const did = await this.didService.registerDID(didDocument);
      return did;
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Failed to create DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCategory.TRANSACTION
      );
    }
  }

  /**
   * Get DID for the current wallet
   */
  async getDID(address?: string): Promise<string | null> {
    try {
      const addr = address || (await this.getCurrentAddress());
      const did = await this.didService.getDIDForAddress(addr);
      return did && did.length > 0 ? did : null;
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCategory.CONTRACT
      );
    }
  }

  /**
   * Get DID document
   */
  async getDIDDocument(did: string): Promise<MoonbeamDIDDocument> {
    try {
      return await this.didService.getDIDDocument(did);
    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get DID document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCategory.CONTRACT
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
        ErrorCategory.TRANSACTION
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
        ErrorCategory.TRANSACTION
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
        ErrorCategory.TRANSACTION
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
        ErrorCategory.CONTRACT
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
        ErrorCategory.TRANSACTION
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
        ErrorCategory.TRANSACTION
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
        ErrorCategory.CONTRACT
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
        ErrorCategory.TRANSACTION
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
        ErrorCategory.CONTRACT
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
        ErrorCategory.CONTRACT
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
