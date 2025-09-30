/**
 * SBT (Soulbound Token) Contract Interface
 * 
 * This module provides TypeScript interfaces and utilities for interacting with
 * ERC-721 based Soulbound Token contracts on Moonbeam and other EVM-compatible chains.
 */

import { ethers, Contract, ContractTransactionResponse, EventLog } from 'ethers';
import { MoonbeamAdapter, MoonbeamNetworkInfo } from '../adapters/MoonbeamAdapter.js';

/**
 * SBT Contract ABI - ERC-721 based with soulbound modifications
 */
export const SBT_CONTRACT_ABI = [
  // ERC-721 Standard Methods
  {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
    name: 'safeMint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'string', name: 'uri', type: 'string' },
    ],
    name: 'mint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // SBT-Specific Methods
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'revoke',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'isRevoked',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'tokensOfOwner',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'approved', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
    ],
    name: 'TokenRevoked',
    type: 'event',
  },
];

/**
 * SBT Contract Interface
 */
export interface SBTContractInterface {
  // Contract Information
  address: string;
  name: string;
  symbol: string;
  totalSupply: () => Promise<bigint>;
  
  // Token Operations
  mint: (to: string, tokenURI?: string) => Promise<ContractTransactionResponse>;
  safeMint: (to: string) => Promise<ContractTransactionResponse>;
  burn: (tokenId: bigint) => Promise<ContractTransactionResponse>;
  revoke: (tokenId: bigint) => Promise<ContractTransactionResponse>;
  
  // Token Queries
  ownerOf: (tokenId: bigint) => Promise<string>;
  tokenURI: (tokenId: bigint) => Promise<string>;
  balanceOf: (owner: string) => Promise<bigint>;
  tokensOfOwner: (owner: string) => Promise<bigint[]>;
  isRevoked: (tokenId: bigint) => Promise<boolean>;
  
  // Approval Operations
  approve: (to: string, tokenId: bigint) => Promise<ContractTransactionResponse>;
  getApproved: (tokenId: bigint) => Promise<string>;
  setApprovalForAll: (operator: string, approved: boolean) => Promise<ContractTransactionResponse>;
  isApprovedForAll: (owner: string, operator: string) => Promise<boolean>;
  
  // Transfer Operations (limited for SBTs)
  transferFrom: (from: string, to: string, tokenId: bigint) => Promise<ContractTransactionResponse>;
}

/**
 * SBT Contract Event Types
 */
export interface SBTTransferEvent {
  from: string;
  to: string;
  tokenId: bigint;
  blockNumber: number;
  transactionHash: string;
}

export interface SBTApprovalEvent {
  owner: string;
  approved: string;
  tokenId: bigint;
  blockNumber: number;
  transactionHash: string;
}

export interface SBTRevocationEvent {
  tokenId: bigint;
  reason: string;
  blockNumber: number;
  transactionHash: string;
}

export type SBTContractEvent = SBTTransferEvent | SBTApprovalEvent | SBTRevocationEvent;

/**
 * SBT Contract Deployment Configuration
 */
export interface SBTContractDeploymentConfig {
  name: string;
  symbol: string;
  baseURI?: string;
  maxSupply?: bigint;
  owner: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
}

/**
 * SBT Contract Deployment Result
 */
export interface SBTContractDeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  deploymentCost: bigint;
}

/**
 * Custom error for SBT contract operations
 */
export class SBTContractError extends Error {
  public readonly code: string;
  public readonly contractAddress?: string;
  public readonly method?: string;

  constructor(
    message: string,
    code: string,
    contractAddress?: string,
    method?: string
  ) {
    super(message);
    this.name = 'SBTContractError';
    this.code = code;
    this.contractAddress = contractAddress;
    this.method = method;
  }
}

/**
 * SBT Contract Class
 */
export class SBTContract {
  private contract: Contract;
  private adapter: MoonbeamAdapter;
  private address: string;

  constructor(
    contractAddress: string,
    adapter: MoonbeamAdapter,
    signer?: ethers.Signer
  ) {
    this.address = contractAddress;
    this.adapter = adapter;
    
    const provider = adapter.getProvider();
    if (!provider) {
      throw new SBTContractError(
        'Moonbeam adapter not connected',
        'ADAPTER_NOT_CONNECTED'
      );
    }

    const contractSigner = signer || provider;
    this.contract = new Contract(
      contractAddress,
      SBT_CONTRACT_ABI,
      contractSigner
    );
  }

  /**
   * Get contract address
   */
  public getAddress(): string {
    return this.address;
  }

  /**
   * Get contract name
   */
  public async name(): Promise<string> {
    try {
      return await this.contract.name();
    } catch (error) {
      throw new SBTContractError(
        `Failed to get contract name: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NAME_QUERY_ERROR',
        this.address,
        'name'
      );
    }
  }

  /**
   * Get contract symbol
   */
  public async symbol(): Promise<string> {
    try {
      return await this.contract.symbol();
    } catch (error) {
      throw new SBTContractError(
        `Failed to get contract symbol: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SYMBOL_QUERY_ERROR',
        this.address,
        'symbol'
      );
    }
  }

  /**
   * Get total supply
   */
  public async totalSupply(): Promise<bigint> {
    try {
      return await this.contract.totalSupply();
    } catch (error) {
      throw new SBTContractError(
        `Failed to get total supply: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOTAL_SUPPLY_ERROR',
        this.address,
        'totalSupply'
      );
    }
  }

  /**
   * Mint a new SBT token
   */
  public async mint(to: string, tokenURI?: string): Promise<ContractTransactionResponse> {
    try {
      if (tokenURI) {
        return await this.contract.mint(to, tokenURI);
      } else {
        return await this.contract.safeMint(to);
      }
    } catch (error) {
      throw new SBTContractError(
        `Failed to mint token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MINT_ERROR',
        this.address,
        'mint'
      );
    }
  }

  /**
   * Burn an SBT token
   */
  public async burn(tokenId: bigint): Promise<ContractTransactionResponse> {
    try {
      return await this.contract.burn(tokenId);
    } catch (error) {
      throw new SBTContractError(
        `Failed to burn token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BURN_ERROR',
        this.address,
        'burn'
      );
    }
  }

  /**
   * Get token owner
   */
  public async ownerOf(tokenId: bigint): Promise<string> {
    try {
      return await this.contract.ownerOf(tokenId);
    } catch (error) {
      throw new SBTContractError(
        `Failed to get owner of token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OWNER_OF_ERROR',
        this.address,
        'ownerOf'
      );
    }
  }

  /**
   * Get token URI
   */
  public async tokenURI(tokenId: bigint): Promise<string> {
    try {
      return await this.contract.tokenURI(tokenId);
    } catch (error) {
      throw new SBTContractError(
        `Failed to get token URI for ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOKEN_URI_ERROR',
        this.address,
        'tokenURI'
      );
    }
  }

  /**
   * Get balance of address
   */
  public async balanceOf(owner: string): Promise<bigint> {
    try {
      return await this.contract.balanceOf(owner);
    } catch (error) {
      throw new SBTContractError(
        `Failed to get balance of ${owner}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BALANCE_OF_ERROR',
        this.address,
        'balanceOf'
      );
    }
  }

  /**
   * Get all tokens owned by address
   */
  public async tokensOfOwner(owner: string): Promise<bigint[]> {
    try {
      return await this.contract.tokensOfOwner(owner);
    } catch (error) {
      throw new SBTContractError(
        `Failed to get tokens of ${owner}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOKENS_OF_OWNER_ERROR',
        this.address,
        'tokensOfOwner'
      );
    }
  }

  /**
   * Revoke an SBT token
   */
  public async revoke(tokenId: bigint): Promise<ContractTransactionResponse> {
    try {
      return await this.contract.revoke(tokenId);
    } catch (error) {
      throw new SBTContractError(
        `Failed to revoke token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REVOKE_ERROR',
        this.address,
        'revoke'
      );
    }
  }

  /**
   * Check if token is revoked
   */
  public async isRevoked(tokenId: bigint): Promise<boolean> {
    try {
      return await this.contract.isRevoked(tokenId);
    } catch (error) {
      throw new SBTContractError(
        `Failed to check revocation status of token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'IS_REVOKED_ERROR',
        this.address,
        'isRevoked'
      );
    }
  }

  /**
   * Listen to Transfer events
   */
  public onTransfer(
    callback: (event: SBTTransferEvent) => void,
    filter?: { from?: string; to?: string }
  ): void {
    this.contract.on('Transfer', (from, to, tokenId, event) => {
      callback({
        from,
        to,
        tokenId,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });
    });
  }

  /**
   * Listen to TokenRevoked events
   */
  public onTokenRevoked(
    callback: (event: SBTRevocationEvent) => void,
    filter?: { tokenId?: bigint }
  ): void {
    this.contract.on('TokenRevoked', (tokenId, reason, event) => {
      callback({
        tokenId,
        reason,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });
    });
  }

  /**
   * Listen to Approval events
   */
  public onApproval(
    callback: (event: SBTApprovalEvent) => void,
    filter?: { owner?: string; approved?: string }
  ): void {
    this.contract.on('Approval', (owner, approved, tokenId, event) => {
      callback({
        owner,
        approved,
        tokenId,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });
    });
  }

  /**
   * Remove all event listeners
   */
  public removeAllListeners(): void {
    this.contract.removeAllListeners();
  }

  /**
   * Get contract instance
   */
  public getContract(): any {
    return this.contract;
  }

  /**
   * Update contract signer
   */
  public updateSigner(signer: ethers.Signer): void {
    this.contract = this.contract.connect(signer) as any;
  }
}

/**
 * SBT Contract Factory for deployment
 */
export class SBTContractFactory {
  private adapter: MoonbeamAdapter;

  constructor(adapter: MoonbeamAdapter) {
    this.adapter = adapter;
  }

  /**
   * Deploy a new SBT contract
   */
  public async deploy(
    config: SBTContractDeploymentConfig,
    signer: ethers.Signer
  ): Promise<SBTContractDeploymentResult> {
    try {
      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new SBTContractError(
          'Moonbeam adapter not connected',
          'ADAPTER_NOT_CONNECTED'
        );
      }

      // Create contract factory
      const factory = new ethers.ContractFactory(
        SBT_CONTRACT_ABI,
        this.getContractBytecode(),
        signer
      );

      // Prepare deployment parameters
      const deploymentParams = [config.name, config.symbol, config.baseURI || ''];

      // Estimate gas
      const gasEstimate = await factory.getDeployTransaction(...deploymentParams);
      
      // Deploy contract
      const contract = await factory.deploy(
        ...deploymentParams,
        {
          gasLimit: config.gasLimit || gasEstimate.gasLimit,
          gasPrice: config.gasPrice,
        }
      );

      // Wait for deployment
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      // Get deployment transaction details
      const deployTx = contract.deploymentTransaction();
      if (!deployTx) {
        throw new SBTContractError(
          'Failed to get deployment transaction',
          'DEPLOYMENT_TX_ERROR'
        );
      }

      const receipt = await deployTx.wait();
      if (!receipt) {
        throw new SBTContractError(
          'Failed to get deployment receipt',
          'DEPLOYMENT_RECEIPT_ERROR'
        );
      }

      return {
        contractAddress,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        deploymentCost: receipt.gasUsed * (receipt.gasPrice || BigInt(0)),
      };
    } catch (error) {
      throw new SBTContractError(
        `Failed to deploy SBT contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DEPLOYMENT_ERROR'
      );
    }
  }

  /**
   * Get contract bytecode (placeholder - would be actual compiled bytecode)
   */
  private getContractBytecode(): string {
    // This would be the actual compiled bytecode of the SBT contract
    // For now, returning a placeholder
    return '0x608060405234801561001057600080fd5b506040516...'; // Truncated for brevity
  }
}

export { SBTContract as default };
