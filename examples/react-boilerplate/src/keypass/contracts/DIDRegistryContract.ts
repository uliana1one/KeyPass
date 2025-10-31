/**
 * DID Registry Contract Interface
 * 
 * TypeScript interface for interacting with the deployed DID Registry smart contract
 */

import { ethers, Contract, ContractTransactionResponse, ContractTransactionReceipt } from 'ethers';

/**
 * DID Registry Contract ABI
 */
export const DIDRegistryABI = [
  // Events
  "event DIDRegistered(address indexed owner, string indexed did, string didDocument, uint256 timestamp)",
  "event DIDUpdated(address indexed owner, string indexed did, string newDidDocument, uint256 timestamp)",
  "event DIDDeactivated(address indexed owner, string indexed did, uint256 timestamp)",
  
  // Functions
  "function registerDID(string memory did, string memory didDocument) external",
  "function updateDID(string memory did, string memory newDidDocument) external",
  "function deactivateDID(string memory did) external",
  "function getDID(string memory did) external view returns (address owner, string memory didDocument, bool isActive, uint256 createdAt, uint256 updatedAt)",
  "function checkDID(string memory did) external view returns (bool exists, bool isActive)",
  "function getOwnerDIDs(address ownerAddress) external view returns (string[] memory dids)",
  "function getTotalDIDs() external view returns (uint256 count)",
  "function emergencyPause() external"
] as const;

/**
 * DID Registry Contract Address
 */
export type DIDRegistryAddress = `0x${string}`;

/**
 * DID Record structure
 */
export interface DIDRecord {
  owner: string;
  did: string;
  didDocument: string;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

/**
 * DID Registry Contract Interface
 */
export interface DIDRegistryContract {
  // Write functions
  registerDID(did: string, didDocument: string): Promise<ContractTransactionResponse>;
  updateDID(did: string, newDidDocument: string): Promise<ContractTransactionResponse>;
  deactivateDID(did: string): Promise<ContractTransactionResponse>;
  
  // Read functions
  getDID(did: string): Promise<DIDRecord>;
  checkDID(did: string): Promise<[boolean, boolean]>;
  getOwnerDIDs(ownerAddress: string): Promise<string[]>;
  getTotalDIDs(): Promise<bigint>;
  
  // Events
  on(event: 'DIDRegistered', listener: (owner: string, did: string, didDocument: string, timestamp: bigint) => void): Promise<this>;
  on(event: 'DIDUpdated', listener: (owner: string, did: string, newDidDocument: string, timestamp: bigint) => void): Promise<this>;
  on(event: 'DIDDeactivated', listener: (owner: string, did: string, timestamp: bigint) => void): Promise<this>;
  removeAllListeners(): void;
}

/**
 * DID Registry Service Class
 */
export class DIDRegistryService {
  private contract: DIDRegistryContract;
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(
    contractAddress: DIDRegistryAddress,
    provider: ethers.Provider,
    signer?: ethers.Signer
  ) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      contractAddress,
      DIDRegistryABI,
      signer || provider
    ) as unknown as DIDRegistryContract;
  }

  /**
   * Register a new DID
   */
  async registerDID(did: string, didDocument: string): Promise<ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for DID registration');
    }
    
    return await this.contract.registerDID(did, didDocument);
  }

  /**
   * Update an existing DID
   */
  async updateDID(did: string, newDidDocument: string): Promise<ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for DID update');
    }
    
    return await this.contract.updateDID(did, newDidDocument);
  }

  /**
   * Deactivate a DID
   */
  async deactivateDID(did: string): Promise<ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer required for DID deactivation');
    }
    
    return await this.contract.deactivateDID(did);
  }

  /**
   * Get DID information
   */
  async getDID(did: string): Promise<DIDRecord> {
    return await this.contract.getDID(did);
  }

  /**
   * Check if DID exists and is active
   */
  async checkDID(did: string): Promise<{ exists: boolean; isActive: boolean }> {
    const [exists, isActive] = await this.contract.checkDID(did);
    return { exists, isActive };
  }

  /**
   * Get all DIDs owned by an address
   */
  async getOwnerDIDs(ownerAddress: string): Promise<string[]> {
    return await this.contract.getOwnerDIDs(ownerAddress);
  }

  /**
   * Get total number of DIDs
   */
  async getTotalDIDs(): Promise<bigint> {
    return await this.contract.getTotalDIDs();
  }

  /**
   * Listen to DID events
   */
  onDIDRegistered(callback: (owner: string, did: string, didDocument: string, timestamp: bigint) => void): void {
    this.contract.on('DIDRegistered', callback);
  }

  onDIDUpdated(callback: (owner: string, did: string, newDidDocument: string, timestamp: bigint) => void): void {
    this.contract.on('DIDUpdated', callback);
  }

  onDIDDeactivated(callback: (owner: string, did: string, timestamp: bigint) => void): void {
    this.contract.on('DIDDeactivated', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }
}
