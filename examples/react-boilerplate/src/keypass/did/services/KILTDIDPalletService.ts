import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { 
  KILTDIDDocument, 
  KILTVerificationMethod, 
  KILTService, 
  KILTTransactionResult,
  KILTError,
  KILTErrorType,
  KILTKeyType,
  KILTVerificationMethodType
} from '../types/KILTTypes';
import { KILTTransactionService } from './KILTTransactionService';
import { KILTConfigManager } from '../../config/kiltConfig';

/**
 * Interface for creating a new KILT DID.
 */
export interface KILTCreateDIDRequest {
  /** The DID identifier */
  did: string;
  /** Initial verification methods */
  verificationMethods?: KILTVerificationMethod[];
  /** Initial service endpoints */
  services?: KILTService[];
  /** DID controller address */
  controller?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for updating a KILT DID.
 */
export interface KILTUpdateDIDRequest {
  /** The DID identifier to update */
  did: string;
  /** Verification methods to add */
  addVerificationMethods?: KILTVerificationMethod[];
  /** Verification methods to remove */
  removeVerificationMethods?: string[];
  /** Services to add */
  addServices?: KILTService[];
  /** Services to remove */
  removeServices?: string[];
  /** New controller address */
  controller?: string;
  /** Updated metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for verification method operations.
 */
export interface KILTVerificationMethodOperation {
  /** The DID identifier */
  did: string;
  /** Verification method to add/remove */
  verificationMethod: KILTVerificationMethod;
  /** Operation type */
  operation: 'add' | 'remove';
}

/**
 * Interface for service endpoint operations.
 */
export interface KILTServiceOperation {
  /** The DID identifier */
  did: string;
  /** Service to add/remove */
  service: KILTService;
  /** Operation type */
  operation: 'add' | 'remove';
}

/**
 * Interface for DID query operations.
 */
export interface KILTDIDQueryResult {
  /** The DID document */
  document: KILTDIDDocument | null;
  /** Whether the DID exists */
  exists: boolean;
  /** Block number when last updated */
  blockNumber?: number;
  /** Transaction hash of last update */
  lastUpdateHash?: string;
}

/**
 * Interface for batch DID operations.
 */
export interface KILTBatchDIDOperation {
  /** Array of operations to batch together */
  operations: Array<{
    type: 'create' | 'update' | 'addVerificationMethod' | 'removeVerificationMethod' | 'addService' | 'removeService' | 'setController' | 'updateMetadata';
    data: any;
  }>;
}

/**
 * Service for interacting with KILT DID pallet operations.
 * Handles all KILT-specific DID blockchain operations.
 */
class KILTDIDPalletService {
  private api: ApiPromise;
  private transactionService: KILTTransactionService;
  private configManager: KILTConfigManager;

  constructor(api: ApiPromise, transactionService?: KILTTransactionService, configManager?: KILTConfigManager) {
    this.api = api;
    this.transactionService = transactionService || new KILTTransactionService(api);
    this.configManager = configManager || new KILTConfigManager();
  }

  /**
   * Creates a new DID on the KILT parachain.
   * @param request - DID creation request
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If DID creation fails
   */
  public async createDID(
    request: KILTCreateDIDRequest,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateCreateDIDRequest(request);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID already exists
      const existingDID = await this.queryDID(request.did);
      if (existingDID.exists) {
        throw new KILTError(
          `DID ${request.did} already exists`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare the create extrinsic
      const createExtrinsic = this.api.tx.did.create(
        request.did,
        request.verificationMethods || [],
        request.services || [],
        request.controller || signer.address,
        request.metadata || {}
      );

      // Submit the transaction
      const result = await this.transactionService.submitTransaction(createExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`DID ${request.did} created successfully: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to create DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Updates an existing DID on the KILT parachain.
   * @param request - DID update request
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If DID update fails
   */
  public async updateDID(
    request: KILTUpdateDIDRequest,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateUpdateDIDRequest(request);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID exists
      const existingDID = await this.queryDID(request.did);
      if (!existingDID.exists) {
        throw new KILTError(
          `DID ${request.did} does not exist`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare batch of update operations
      const operations: any[] = [];

      // Add verification methods
      if (request.addVerificationMethods && request.addVerificationMethods.length > 0) {
        for (const vm of request.addVerificationMethods) {
          operations.push(this.api.tx.did.addVerificationMethod(request.did, vm));
        }
      }

      // Remove verification methods
      if (request.removeVerificationMethods && request.removeVerificationMethods.length > 0) {
        for (const vmId of request.removeVerificationMethods) {
          operations.push(this.api.tx.did.removeVerificationMethod(request.did, vmId));
        }
      }

      // Add services
      if (request.addServices && request.addServices.length > 0) {
        for (const service of request.addServices) {
          operations.push(this.api.tx.did.addService(request.did, service));
        }
      }

      // Remove services
      if (request.removeServices && request.removeServices.length > 0) {
        for (const serviceId of request.removeServices) {
          operations.push(this.api.tx.did.removeService(request.did, serviceId));
        }
      }

      // Set new controller
      if (request.controller) {
        operations.push(this.api.tx.did.setController(request.did, request.controller));
      }

      // Update metadata
      if (request.metadata) {
        operations.push(this.api.tx.did.updateMetadata(request.did, request.metadata));
      }

      if (operations.length === 0) {
        throw new KILTError(
          'No update operations specified',
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Submit batch transaction
      const batchExtrinsic = this.api.tx.utility.batchAll(operations);
      
      const result = await this.transactionService.submitTransaction(batchExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`DID ${request.did} updated successfully: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to update DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Deletes a DID from the KILT parachain.
   * @param did - The DID identifier to delete
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If DID deletion fails
   */
  public async deleteDID(
    did: string,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateDIDIdentifier(did);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID exists
      const existingDID = await this.queryDID(did);
      if (!existingDID.exists) {
        throw new KILTError(
          `DID ${did} does not exist`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare the delete extrinsic
      const deleteExtrinsic = this.api.tx.did.delete(did);

      // Submit the transaction
      const result = await this.transactionService.submitTransaction(deleteExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`DID ${did} deleted successfully: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to delete DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Adds a verification method to an existing DID.
   * @param operation - Verification method operation
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If operation fails
   */
  public async addVerificationMethod(
    operation: KILTVerificationMethodOperation,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateVerificationMethodOperation(operation);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID exists
      const existingDID = await this.queryDID(operation.did);
      if (!existingDID.exists) {
        throw new KILTError(
          `DID ${operation.did} does not exist`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare the add verification method extrinsic
      const addVmExtrinsic = this.api.tx.did.addVerificationMethod(
        operation.did,
        operation.verificationMethod
      );

      // Submit the transaction
      const result = await this.transactionService.submitTransaction(addVmExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`Verification method added to DID ${operation.did}: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to add verification method: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Removes a verification method from an existing DID.
   * @param operation - Verification method operation
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If operation fails
   */
  public async removeVerificationMethod(
    operation: KILTVerificationMethodOperation,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateVerificationMethodOperation(operation);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID exists
      const existingDID = await this.queryDID(operation.did);
      if (!existingDID.exists) {
        throw new KILTError(
          `DID ${operation.did} does not exist`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare the remove verification method extrinsic
      const removeVmExtrinsic = this.api.tx.did.removeVerificationMethod(
        operation.did,
        operation.verificationMethod.id
      );

      // Submit the transaction
      const result = await this.transactionService.submitTransaction(removeVmExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`Verification method removed from DID ${operation.did}: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to remove verification method: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Adds a service endpoint to an existing DID.
   * @param operation - Service operation
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If operation fails
   */
  public async addService(
    operation: KILTServiceOperation,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateServiceOperation(operation);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID exists
      const existingDID = await this.queryDID(operation.did);
      if (!existingDID.exists) {
        throw new KILTError(
          `DID ${operation.did} does not exist`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare the add service extrinsic
      const addServiceExtrinsic = this.api.tx.did.addService(
        operation.did,
        operation.service
      );

      // Submit the transaction
      const result = await this.transactionService.submitTransaction(addServiceExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`Service added to DID ${operation.did}: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to add service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Removes a service endpoint from an existing DID.
   * @param operation - Service operation
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If operation fails
   */
  public async removeService(
    operation: KILTServiceOperation,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateServiceOperation(operation);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID exists
      const existingDID = await this.queryDID(operation.did);
      if (!existingDID.exists) {
        throw new KILTError(
          `DID ${operation.did} does not exist`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare the remove service extrinsic
      const removeServiceExtrinsic = this.api.tx.did.removeService(
        operation.did,
        operation.service.id
      );

      // Submit the transaction
      const result = await this.transactionService.submitTransaction(removeServiceExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`Service removed from DID ${operation.did}: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to remove service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Sets the controller for an existing DID.
   * @param did - The DID identifier
   * @param controller - The new controller address
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If operation fails
   */
  public async setController(
    did: string,
    controller: string,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateDIDIdentifier(did);
      this.validateAddress(controller);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID exists
      const existingDID = await this.queryDID(did);
      if (!existingDID.exists) {
        throw new KILTError(
          `DID ${did} does not exist`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare the set controller extrinsic
      const setControllerExtrinsic = this.api.tx.did.setController(did, controller);

      // Submit the transaction
      const result = await this.transactionService.submitTransaction(setControllerExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`Controller set for DID ${did}: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to set controller: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Updates metadata for an existing DID.
   * @param did - The DID identifier
   * @param metadata - The new metadata
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If operation fails
   */
  public async updateMetadata(
    did: string,
    metadata: Record<string, unknown>,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateDIDIdentifier(did);

      if (!metadata || typeof metadata !== 'object') {
        throw new KILTError(
          'Invalid metadata provided',
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check if DID exists
      const existingDID = await this.queryDID(did);
      if (!existingDID.exists) {
        throw new KILTError(
          `DID ${did} does not exist`,
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Prepare the update metadata extrinsic
      const updateMetadataExtrinsic = this.api.tx.did.updateMetadata(did, metadata);

      // Submit the transaction
      const result = await this.transactionService.submitTransaction(updateMetadataExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`Metadata updated for DID ${did}: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to update metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Queries a DID from the KILT parachain.
   * @param did - The DID identifier to query
   * @returns A promise that resolves to the DID query result
   */
  public async queryDID(did: string): Promise<KILTDIDQueryResult> {
    try {
      // Validate inputs
      this.validateDIDIdentifier(did);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Query the DID from storage
      const didStorage = await this.api.query.did.didStorage(did);
      
      if (!didStorage || (didStorage as any).isNone) {
        return {
          document: null,
          exists: false,
        };
      }

      // Parse the DID document from storage
      const didData = (didStorage as any).unwrap();
      const document = this.parseDIDFromStorage(didData, did);

      return {
        document,
        exists: true,
        blockNumber: await this.getCurrentBlockNumber(),
      };

    } catch (error) {
      console.warn(`Failed to query DID ${did}:`, error);
      return {
        document: null,
        exists: false,
      };
    }
  }

  /**
   * Checks if a DID exists on the KILT parachain.
   * @param did - The DID identifier to check
   * @returns A promise that resolves to true if the DID exists
   */
  public async didExists(did: string): Promise<boolean> {
    const result = await this.queryDID(did);
    return result.exists;
  }

  /**
   * Executes a batch of DID operations in a single transaction.
   * @param batchOperation - The batch operation to execute
   * @param signer - Transaction signer
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If batch operation fails
   */
  public async executeBatchOperation(
    batchOperation: KILTBatchDIDOperation,
    signer: KeyringPair
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      if (!batchOperation.operations || batchOperation.operations.length === 0) {
        throw new KILTError(
          'No operations specified for batch execution',
          KILTErrorType.DID_REGISTRATION_ERROR
        );
      }

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Prepare batch of extrinsics
      const extrinsics: any[] = [];

      for (const op of batchOperation.operations) {
        switch (op.type) {
          case 'create':
            extrinsics.push(this.api.tx.did.create(
              op.data.did,
              op.data.verificationMethods || [],
              op.data.services || [],
              op.data.controller,
              op.data.metadata || {}
            ));
            break;

          case 'addVerificationMethod':
            extrinsics.push(this.api.tx.did.addVerificationMethod(
              op.data.did,
              op.data.verificationMethod
            ));
            break;

          case 'removeVerificationMethod':
            extrinsics.push(this.api.tx.did.removeVerificationMethod(
              op.data.did,
              op.data.verificationMethodId
            ));
            break;

          case 'addService':
            extrinsics.push(this.api.tx.did.addService(
              op.data.did,
              op.data.service
            ));
            break;

          case 'removeService':
            extrinsics.push(this.api.tx.did.removeService(
              op.data.did,
              op.data.serviceId
            ));
            break;

          case 'setController':
            extrinsics.push(this.api.tx.did.setController(
              op.data.did,
              op.data.controller
            ));
            break;

          case 'updateMetadata':
            extrinsics.push(this.api.tx.did.updateMetadata(
              op.data.did,
              op.data.metadata
            ));
            break;

          default:
            throw new KILTError(
              `Unknown operation type: ${op.type}`,
              KILTErrorType.DID_REGISTRATION_ERROR
            );
        }
      }

      // Submit batch transaction
      const batchExtrinsic = this.api.tx.utility.batchAll(extrinsics);
      
      const result = await this.transactionService.submitTransaction(batchExtrinsic, {
        signer,
        waitForConfirmation: true,
      });

      console.log(`Batch DID operation executed successfully: ${result.transactionHash}`);
      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Failed to execute batch operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.DID_REGISTRATION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Gets the current block number.
   * @returns The current block number
   * @private
   */
  private async getCurrentBlockNumber(): Promise<number> {
    try {
      const header = await this.api.rpc.chain.getHeader();
      return header.number.toNumber();
    } catch (error) {
      console.warn('Failed to get current block number:', error);
      return 0;
    }
  }

  /**
   * Parses DID data from KILT storage into a KILTDIDDocument.
   * @param didData - Raw DID data from storage
   * @param did - The DID identifier
   * @returns Parsed KILT DID document
   * @private
   */
  private parseDIDFromStorage(didData: any, did: string): KILTDIDDocument {
    const document: KILTDIDDocument = {
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/sr25519-2020/v1', 'https://w3id.org/security/suites/kilt-2023/v1'],
      id: did,
      controller: did, // Default controller to the DID itself
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };

    try {
      // Parse verification methods
      if (didData.verificationMethods) {
        const verificationMethods = didData.verificationMethods as any[];
        for (const vm of verificationMethods) {
          const verificationMethod: KILTVerificationMethod = {
            id: vm.id.toString(),
            type: KILTVerificationMethodType.SR25519_2020,
            controller: did,
            publicKeyMultibase: vm.publicKey.toString(),
            keyType: KILTKeyType.SR25519,
          };

          document.verificationMethod.push(verificationMethod);
          
          // Add to appropriate capability arrays
          if (vm.capabilities) {
            const capabilities = vm.capabilities as any[];
            capabilities.forEach((cap: any) => {
              const capability = cap.toString();
              if (capability === 'authentication' && !document.authentication.includes(verificationMethod.id)) {
                document.authentication.push(verificationMethod.id);
              } else if (capability === 'assertionMethod' && document.assertionMethod && !document.assertionMethod.includes(verificationMethod.id)) {
                document.assertionMethod.push(verificationMethod.id);
              } else if (capability === 'capabilityInvocation' && document.capabilityInvocation && !document.capabilityInvocation.includes(verificationMethod.id)) {
                document.capabilityInvocation.push(verificationMethod.id);
              } else if (capability === 'capabilityDelegation' && document.capabilityDelegation && !document.capabilityDelegation.includes(verificationMethod.id)) {
                document.capabilityDelegation.push(verificationMethod.id);
              }
            });
          }
        }
      }

      // Parse services
      if (didData.services && document.service) {
        const services = didData.services as any[];
        for (const service of services) {
          const kiltService: KILTService = {
            id: service.id.toString(),
            type: service.type.toString(),
            serviceEndpoint: service.endpoint.toString(),
          };
          document.service.push(kiltService);
        }
      }

      // Set controller
      if (didData.controller) {
        document.controller = didData.controller.toString();
      }

      // Set metadata (if supported by the interface)
      if (didData.metadata && (document as any).metadata !== undefined) {
        (document as any).metadata = didData.metadata.toJSON();
      }

    } catch (error) {
      console.warn('Error parsing DID from storage:', error);
    }

    return document;
  }

  /**
   * Validates a create DID request.
   * @param request - The create DID request
   * @throws {KILTError} If validation fails
   * @private
   */
  private validateCreateDIDRequest(request: KILTCreateDIDRequest): void {
    this.validateDIDIdentifier(request.did);

    if (request.verificationMethods) {
      for (const vm of request.verificationMethods) {
        this.validateVerificationMethod(vm);
      }
    }

    if (request.services) {
      for (const service of request.services) {
        this.validateService(service);
      }
    }

    if (request.controller) {
      this.validateAddress(request.controller);
    }
  }

  /**
   * Validates an update DID request.
   * @param request - The update DID request
   * @throws {KILTError} If validation fails
   * @private
   */
  private validateUpdateDIDRequest(request: KILTUpdateDIDRequest): void {
    this.validateDIDIdentifier(request.did);

    if (request.addVerificationMethods) {
      for (const vm of request.addVerificationMethods) {
        this.validateVerificationMethod(vm);
      }
    }

    if (request.addServices) {
      for (const service of request.addServices) {
        this.validateService(service);
      }
    }

    if (request.controller) {
      this.validateAddress(request.controller);
    }
  }

  /**
   * Validates a verification method operation.
   * @param operation - The verification method operation
   * @throws {KILTError} If validation fails
   * @private
   */
  private validateVerificationMethodOperation(operation: KILTVerificationMethodOperation): void {
    this.validateDIDIdentifier(operation.did);
    this.validateVerificationMethod(operation.verificationMethod);

    if (operation.operation !== 'add' && operation.operation !== 'remove') {
      throw new KILTError(
        'Invalid operation type. Must be "add" or "remove"',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }
  }

  /**
   * Validates a service operation.
   * @param operation - The service operation
   * @throws {KILTError} If validation fails
   * @private
   */
  private validateServiceOperation(operation: KILTServiceOperation): void {
    this.validateDIDIdentifier(operation.did);
    this.validateService(operation.service);

    if (operation.operation !== 'add' && operation.operation !== 'remove') {
      throw new KILTError(
        'Invalid operation type. Must be "add" or "remove"',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }
  }

  /**
   * Validates a DID identifier.
   * @param did - The DID identifier
   * @throws {KILTError} If validation fails
   * @private
   */
  private validateDIDIdentifier(did: string): void {
    if (!did || typeof did !== 'string') {
      throw new KILTError(
        'Invalid DID identifier',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }

    if (!did.startsWith('did:kilt:')) {
      throw new KILTError(
        'DID must start with "did:kilt:"',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }
  }

  /**
   * Validates a verification method.
   * @param verificationMethod - The verification method
   * @throws {KILTError} If validation fails
   * @private
   */
  private validateVerificationMethod(verificationMethod: KILTVerificationMethod): void {
    if (!verificationMethod.id || typeof verificationMethod.id !== 'string') {
      throw new KILTError(
        'Invalid verification method ID',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }

    if (!verificationMethod.type || typeof verificationMethod.type !== 'string') {
      throw new KILTError(
        'Invalid verification method type',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }

    if (!verificationMethod.publicKeyMultibase || typeof verificationMethod.publicKeyMultibase !== 'string') {
      throw new KILTError(
        'Invalid verification method public key',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }
  }

  /**
   * Validates a service.
   * @param service - The service
   * @throws {KILTError} If validation fails
   * @private
   */
  private validateService(service: KILTService): void {
    if (!service.id || typeof service.id !== 'string') {
      throw new KILTError(
        'Invalid service ID',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }

    if (!service.type || typeof service.type !== 'string') {
      throw new KILTError(
        'Invalid service type',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }

    if (!service.serviceEndpoint || typeof service.serviceEndpoint !== 'string') {
      throw new KILTError(
        'Invalid service endpoint',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }
  }

  /**
   * Validates an address.
   * @param address - The address
   * @throws {KILTError} If validation fails
   * @private
   */
  private validateAddress(address: string): void {
    if (!address || typeof address !== 'string') {
      throw new KILTError(
        'Invalid address',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }

    // Basic SS58 address validation for KILT (starts with 4 for mainnet, 3 for testnet)
    if (!/^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address)) {
      throw new KILTError(
        'Invalid KILT address format',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
    }
  }
}

// Export the main service class (interfaces are already exported above)
export { KILTDIDPalletService };
