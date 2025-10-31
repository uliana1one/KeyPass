import { ethers } from 'ethers';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { BlockchainError, MoonbeamBlockchainError, MoonbeamErrorCode } from '../../errors/BlockchainErrors';
import { TransactionMonitoringResult } from '../../types';

/**
 * Interface for Moonbeam DID operations
 */
export interface MoonbeamDIDOperations {
  registerDID(didDocument: string): Promise<string>;
  updateDID(did: string, newDidDocument: string): Promise<void>;
  addVerificationMethod(
    did: string,
    verificationMethodId: string,
    verificationMethodType: string,
    publicKeyMultibase: string
  ): Promise<void>;
  removeVerificationMethod(did: string, verificationMethodId: string): Promise<void>;
  addServiceEndpoint(
    did: string,
    serviceEndpointId: string,
    serviceType: string,
    serviceEndpointUrl: string
  ): Promise<void>;
  removeServiceEndpoint(did: string, serviceEndpointId: string): Promise<void>;
  deactivateDID(did: string): Promise<void>;
  getDIDDocument(did: string): Promise<DIDDocument>;
  getVerificationMethod(verificationMethodId: string): Promise<VerificationMethod>;
  getServiceEndpoint(serviceEndpointId: string): Promise<ServiceEndpoint>;
  getDIDForAddress(address: string): Promise<string>;
  didExists(did: string): Promise<boolean>;
  getTotalDIDCount(): Promise<number>;
}

/**
 * DID Document structure
 */
export interface DIDDocument {
  did: string;
  context: string;
  verificationMethods: string[];
  serviceEndpoints: string[];
  createdAt: number;
  updatedAt: number;
  active: boolean;
}

/**
 * Verification Method structure
 */
export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
  active: boolean;
}

/**
 * Service Endpoint structure
 */
export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
  active: boolean;
}

/**
 * Moonbeam DID Service
 * Handles all DID operations on Moonbeam blockchain
 */
export class MoonbeamDIDService implements MoonbeamDIDOperations {
  private adapter: MoonbeamAdapter;
  private contract: ethers.Contract;
  private contractAddress: string;

  constructor(adapter: MoonbeamAdapter, contractAddress: string) {
    this.adapter = adapter;
    this.contractAddress = contractAddress;
    this.contract = this.createContract();
  }

  /**
   * Create ethers contract instance
   */
  private createContract(): ethers.Contract {
    const abi = [
      'function registerDID(string memory didDocument) external returns (string memory)',
      'function updateDID(string memory did, string memory newDidDocument) external',
      'function addVerificationMethod(string memory did, string memory verificationMethodId, string memory verificationMethodType, string memory publicKeyMultibase) external',
      'function removeVerificationMethod(string memory did, string memory verificationMethodId) external',
      'function addServiceEndpoint(string memory did, string memory serviceEndpointId, string memory serviceType, string memory serviceEndpointUrl) external',
      'function removeServiceEndpoint(string memory did, string memory serviceEndpointId) external',
      'function deactivateDID(string memory did) external',
      'function getDIDDocument(string memory did) external view returns (tuple(string did, string context, string[] verificationMethods, string[] serviceEndpoints, uint256 createdAt, uint256 updatedAt, bool active))',
      'function getVerificationMethod(string memory verificationMethodId) external view returns (tuple(string id, string type, string controller, string publicKeyMultibase, bool active))',
      'function getServiceEndpoint(string memory serviceEndpointId) external view returns (tuple(string id, string type, string serviceEndpoint, bool active))',
      'function getDIDForAddress(address addr) external view returns (string memory)',
      'function didExists(string memory did) external view returns (bool)',
      'function getTotalDIDCount() external view returns (uint256)',
      'event DIDRegistered(address indexed owner, string did, string didDocument)',
      'event DIDUpdated(address indexed owner, string did, string newDidDocument)',
      'event VerificationMethodAdded(string indexed did, string verificationMethodId)',
      'event VerificationMethodRemoved(string indexed did, string verificationMethodId)',
      'event ServiceEndpointAdded(string indexed did, string serviceEndpointId)',
      'event ServiceEndpointRemoved(string indexed did, string serviceEndpointId)',
      'event DIDDeactivated(string indexed did)'
    ];

    const provider = this.adapter.getProvider();
    if (!provider) {
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONNECTION_FAILED,
        'Moonbeam provider not available',
        'CONNECTION'
      );
    }

    return new ethers.Contract(this.contractAddress, abi, provider);
  }

  /**
   * Register a new DID
   */
  async registerDID(didDocument: string): Promise<string> {
    try {
      const signer = this.adapter.getSigner();
      if (!signer) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Moonbeam signer not available',
          'CONNECTION'
        );
      }

      const contractWithSigner = this.contract.connect(signer);
      
      // Estimate gas
      const gasEstimate = await contractWithSigner.estimateGas.registerDID(didDocument);
      const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Submit transaction
      const tx = await contractWithSigner.registerDID(didDocument, {
        gasLimit: gasLimit
      });

      // Monitor transaction
      const monitoringResult = await this.monitorTransaction(tx.hash);
      
      if (!monitoringResult.success) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_FAILED,
          `DID registration failed: ${monitoringResult.error}`,
          'TRANSACTION'
        );
      }

      // Get the DID from the transaction receipt
      const receipt = await this.adapter.getProvider()!.getTransactionReceipt(tx.hash);
      if (!receipt) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_NOT_FOUND,
          'Transaction receipt not found',
          'TRANSACTION'
        );
      }

      // Parse events to get the DID
      const didRegisteredEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'DIDRegistered';
        } catch {
          return false;
        }
      });

      if (!didRegisteredEvent) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_FAILED,
          'DID registration event not found',
          'TRANSACTION'
        );
      }

      const parsedEvent = this.contract.interface.parseLog(didRegisteredEvent);
      return parsedEvent.args.did;

    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `DID registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Update an existing DID
   */
  async updateDID(did: string, newDidDocument: string): Promise<void> {
    try {
      const signer = this.adapter.getSigner();
      if (!signer) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Moonbeam signer not available',
          'CONNECTION'
        );
      }

      const contractWithSigner = this.contract.connect(signer);
      
      // Estimate gas
      const gasEstimate = await contractWithSigner.estimateGas.updateDID(did, newDidDocument);
      const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Submit transaction
      const tx = await contractWithSigner.updateDID(did, newDidDocument, {
        gasLimit: gasLimit
      });

      // Monitor transaction
      const monitoringResult = await this.monitorTransaction(tx.hash);
      
      if (!monitoringResult.success) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_FAILED,
          `DID update failed: ${monitoringResult.error}`,
          'TRANSACTION'
        );
      }

    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `DID update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const signer = this.adapter.getSigner();
      if (!signer) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Moonbeam signer not available',
          'CONNECTION'
        );
      }

      const contractWithSigner = this.contract.connect(signer);
      
      // Estimate gas
      const gasEstimate = await contractWithSigner.estimateGas.addVerificationMethod(
        did,
        verificationMethodId,
        verificationMethodType,
        publicKeyMultibase
      );
      const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Submit transaction
      const tx = await contractWithSigner.addVerificationMethod(
        did,
        verificationMethodId,
        verificationMethodType,
        publicKeyMultibase,
        {
          gasLimit: gasLimit
        }
      );

      // Monitor transaction
      const monitoringResult = await this.monitorTransaction(tx.hash);
      
      if (!monitoringResult.success) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_FAILED,
          `Verification method addition failed: ${monitoringResult.error}`,
          'TRANSACTION'
        );
      }

    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Verification method addition failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Remove a verification method from a DID
   */
  async removeVerificationMethod(did: string, verificationMethodId: string): Promise<void> {
    try {
      const signer = this.adapter.getSigner();
      if (!signer) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Moonbeam signer not available',
          'CONNECTION'
        );
      }

      const contractWithSigner = this.contract.connect(signer);
      
      // Estimate gas
      const gasEstimate = await contractWithSigner.estimateGas.removeVerificationMethod(did, verificationMethodId);
      const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Submit transaction
      const tx = await contractWithSigner.removeVerificationMethod(did, verificationMethodId, {
        gasLimit: gasLimit
      });

      // Monitor transaction
      const monitoringResult = await this.monitorTransaction(tx.hash);
      
      if (!monitoringResult.success) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_FAILED,
          `Verification method removal failed: ${monitoringResult.error}`,
          'TRANSACTION'
        );
      }

    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Verification method removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
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
      const signer = this.adapter.getSigner();
      if (!signer) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Moonbeam signer not available',
          'CONNECTION'
        );
      }

      const contractWithSigner = this.contract.connect(signer);
      
      // Estimate gas
      const gasEstimate = await contractWithSigner.estimateGas.addServiceEndpoint(
        did,
        serviceEndpointId,
        serviceType,
        serviceEndpointUrl
      );
      const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Submit transaction
      const tx = await contractWithSigner.addServiceEndpoint(
        did,
        serviceEndpointId,
        serviceType,
        serviceEndpointUrl,
        {
          gasLimit: gasLimit
        }
      );

      // Monitor transaction
      const monitoringResult = await this.monitorTransaction(tx.hash);
      
      if (!monitoringResult.success) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_FAILED,
          `Service endpoint addition failed: ${monitoringResult.error}`,
          'TRANSACTION'
        );
      }

    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Service endpoint addition failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Remove a service endpoint from a DID
   */
  async removeServiceEndpoint(did: string, serviceEndpointId: string): Promise<void> {
    try {
      const signer = this.adapter.getSigner();
      if (!signer) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Moonbeam signer not available',
          'CONNECTION'
        );
      }

      const contractWithSigner = this.contract.connect(signer);
      
      // Estimate gas
      const gasEstimate = await contractWithSigner.estimateGas.removeServiceEndpoint(did, serviceEndpointId);
      const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Submit transaction
      const tx = await contractWithSigner.removeServiceEndpoint(did, serviceEndpointId, {
        gasLimit: gasLimit
      });

      // Monitor transaction
      const monitoringResult = await this.monitorTransaction(tx.hash);
      
      if (!monitoringResult.success) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_FAILED,
          `Service endpoint removal failed: ${monitoringResult.error}`,
          'TRANSACTION'
        );
      }

    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `Service endpoint removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Deactivate a DID
   */
  async deactivateDID(did: string): Promise<void> {
    try {
      const signer = this.adapter.getSigner();
      if (!signer) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Moonbeam signer not available',
          'CONNECTION'
        );
      }

      const contractWithSigner = this.contract.connect(signer);
      
      // Estimate gas
      const gasEstimate = await contractWithSigner.estimateGas.deactivateDID(did);
      const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

      // Submit transaction
      const tx = await contractWithSigner.deactivateDID(did, {
        gasLimit: gasLimit
      });

      // Monitor transaction
      const monitoringResult = await this.monitorTransaction(tx.hash);
      
      if (!monitoringResult.success) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.TRANSACTION_FAILED,
          `DID deactivation failed: ${monitoringResult.error}`,
          'TRANSACTION'
        );
      }

    } catch (error) {
      if (error instanceof MoonbeamBlockchainError) {
        throw error;
      }
      
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.TRANSACTION_FAILED,
        `DID deactivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION'
      );
    }
  }

  /**
   * Get DID document
   */
  async getDIDDocument(did: string): Promise<DIDDocument> {
    try {
      const result = await this.contract.getDIDDocument(did);
      return {
        did: result.did,
        context: result.context,
        verificationMethods: result.verificationMethods,
        serviceEndpoints: result.serviceEndpoints,
        createdAt: result.createdAt.toNumber(),
        updatedAt: result.updatedAt.toNumber(),
        active: result.active
      };
    } catch (error) {
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get DID document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Get verification method
   */
  async getVerificationMethod(verificationMethodId: string): Promise<VerificationMethod> {
    try {
      const result = await this.contract.getVerificationMethod(verificationMethodId);
      return {
        id: result.id,
        type: result.type,
        controller: result.controller,
        publicKeyMultibase: result.publicKeyMultibase,
        active: result.active
      };
    } catch (error) {
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get verification method: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Get service endpoint
   */
  async getServiceEndpoint(serviceEndpointId: string): Promise<ServiceEndpoint> {
    try {
      const result = await this.contract.getServiceEndpoint(serviceEndpointId);
      return {
        id: result.id,
        type: result.type,
        serviceEndpoint: result.serviceEndpoint,
        active: result.active
      };
    } catch (error) {
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get service endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Get DID for address
   */
  async getDIDForAddress(address: string): Promise<string> {
    try {
      return await this.contract.getDIDForAddress(address);
    } catch (error) {
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get DID for address: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Check if DID exists
   */
  async didExists(did: string): Promise<boolean> {
    try {
      return await this.contract.didExists(did);
    } catch (error) {
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to check DID existence: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Get total DID count
   */
  async getTotalDIDCount(): Promise<number> {
    try {
      const result = await this.contract.getTotalDIDCount();
      return result.toNumber();
    } catch (error) {
      throw new MoonbeamBlockchainError(
        MoonbeamErrorCode.CONTRACT_CALL_FAILED,
        `Failed to get total DID count: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTRACT'
      );
    }
  }

  /**
   * Monitor transaction status
   */
  private async monitorTransaction(txHash: string): Promise<TransactionMonitoringResult> {
    try {
      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new MoonbeamBlockchainError(
          MoonbeamErrorCode.CONNECTION_FAILED,
          'Provider not available for transaction monitoring',
          'CONNECTION'
        );
      }

      const receipt = await provider.waitForTransaction(txHash, 1, 30000); // 30 second timeout
      
      if (!receipt) {
        return {
          success: false,
          error: 'Transaction receipt not found',
          txHash,
          blockNumber: 0,
          gasUsed: 0
        };
      }

      if (receipt.status === 0) {
        return {
          success: false,
          error: 'Transaction reverted',
          txHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toNumber()
        };
      }

      return {
        success: true,
        txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toNumber()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash,
        blockNumber: 0,
        gasUsed: 0
      };
    }
  }
}
