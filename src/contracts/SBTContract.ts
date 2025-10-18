/**
 * SBT (Soulbound Token) Contract Interface
 * 
 * Enhanced implementation with real blockchain integration, transaction monitoring,
 * gas estimation, event handling, and comprehensive contract interactions.
 */

import { ethers, Contract, ContractTransactionResponse, ContractTransactionReceipt, EventLog, Log } from 'ethers';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MoonbeamAdapter, MoonbeamNetworkInfo } from '../adapters/MoonbeamAdapter.js';
import { SBTContractABI, SBTContractAddress } from './types/SBTContractTypes.js';

/**
 * Transaction monitoring result
 */
export interface TransactionMonitoringResult {
  receipt: ContractTransactionReceipt;
  confirmations: number;
  blockNumber: number;
  transactionHash: string;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  totalCost: bigint;
  logs: Log[];
  events: EventLog[];
  status: number;
  timestamp: number;
}

/**
 * Gas estimation result
 */
export interface GasEstimationResult {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostInEther: string;
  baseFee?: bigint;
  priorityFee?: bigint;
}

/**
 * Transaction options for contract methods
 */
export interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  value?: bigint;
  nonce?: number;
  confirmations?: number;
  timeout?: number;
}

/**
 * Event filter options
 */
export interface EventFilterOptions {
  fromBlock?: number | 'latest' | 'earliest' | 'pending';
  toBlock?: number | 'latest' | 'earliest' | 'pending';
  address?: string;
  topics?: (string | string[] | null)[];
}

/**
 * SBT Token metadata
 */
export interface SBTTokenMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  [key: string]: any;
}

/**
 * SBT Token information
 */
export interface SBTTokenInfo {
  tokenId: bigint;
  owner: string;
  tokenURI: string;
  metadata?: SBTTokenMetadata;
  isRevoked: boolean;
  mintedAt?: number;
  revokedAt?: number;
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
  logIndex: number;
  timestamp?: number;
}

export interface SBTApprovalEvent {
  owner: string;
  approved: string;
  tokenId: bigint;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp?: number;
}

export interface SBTApprovalForAllEvent {
  owner: string;
  operator: string;
  approved: boolean;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp?: number;
}

export interface SBTRevocationEvent {
  tokenId: bigint;
  reason: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp?: number;
}

export type SBTContractEvent = 
  | SBTTransferEvent 
  | SBTApprovalEvent 
  | SBTApprovalForAllEvent
  | SBTRevocationEvent;

/**
 * Custom error for SBT contract operations
 */
export class SBTContractError extends Error {
  public readonly code: string;
  public readonly contractAddress?: string;
  public readonly method?: string;
  public readonly transactionHash?: string;
  public readonly details?: any;

  constructor(
    message: string,
    code: string,
    contractAddress?: string,
    method?: string,
    transactionHash?: string,
    details?: any
  ) {
    super(message);
    this.name = 'SBTContractError';
    this.code = code;
    this.contractAddress = contractAddress;
    this.method = method;
    this.transactionHash = transactionHash;
    this.details = details;
  }
}

/**
 * Deployment configuration loader
 */
export class DeploymentConfigLoader {
  private static instance: DeploymentConfigLoader;
  private config: any = null;
  private configPath: string = '';

  private constructor() {
    // Try multiple possible config paths
    const possiblePaths = [
      join(process.cwd(), 'config', 'deployments.json'),
      join(__dirname, '..', '..', 'config', 'deployments.json'),
      join(__dirname, '../../config/deployments.json'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        this.configPath = path;
        this.loadConfig();
        break;
      }
    }

    if (!this.config) {
      console.warn('Warning: No deployments.json found. Using empty configuration.');
      this.config = { deployments: {}, metadata: {} };
      this.configPath = possiblePaths[0];
    }
  }

  public static getInstance(): DeploymentConfigLoader {
    if (!DeploymentConfigLoader.instance) {
      DeploymentConfigLoader.instance = new DeploymentConfigLoader();
    }
    return DeploymentConfigLoader.instance;
  }

  private loadConfig(): void {
    try {
      const configData = readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.warn(`Failed to load deployment config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.config = { deployments: {}, metadata: {} };
    }
  }

  public getContractAddress(network: string, contractName: string = 'SBTSimple'): string | null {
    if (!this.config || !this.config.deployments) {
      return null;
    }

    const networkDeployments = this.config.deployments[network];
    if (!networkDeployments || !networkDeployments[contractName]) {
      return null;
    }

    return networkDeployments[contractName].address;
  }

  public getDeploymentInfo(network: string, contractName: string = 'SBTSimple'): any {
    if (!this.config || !this.config.deployments) {
      return null;
    }

    return this.config.deployments[network]?.[contractName];
  }

  public getAllDeployments(): any {
    return this.config?.deployments || {};
  }

  public reload(): void {
    this.loadConfig();
  }
}

/**
 * Enhanced SBT Contract Class with comprehensive blockchain integration
 */
export class SBTContract {
  private contract: Contract;
  private adapter: MoonbeamAdapter;
  private address: string;
  private network: string;
  private debugMode: boolean;
  private eventSubscriptions: Map<string, any> = new Map();

  constructor(
    contractAddress: string,
    adapter: MoonbeamAdapter,
    signer?: ethers.Signer,
    debugMode: boolean = false
  ) {
    this.address = contractAddress;
    this.adapter = adapter;
    this.network = adapter.getCurrentNetwork();
    this.debugMode = debugMode;
    
    const provider = adapter.getProvider();
    if (!provider) {
      throw new SBTContractError(
        'Moonbeam adapter not connected',
        'ADAPTER_NOT_CONNECTED',
        contractAddress
      );
    }

    const contractSigner = signer || provider;
    this.contract = new Contract(
      contractAddress,
      SBTContractABI,
      contractSigner
    );

    if (this.debugMode) {
      console.log(`[SBTContract] Initialized at ${contractAddress} on ${this.network}`);
    }
  }

  /**
   * Create SBTContract from deployed address (auto-loads from config)
   */
  public static fromDeployment(
    network: string,
    adapter: MoonbeamAdapter,
    signer?: ethers.Signer,
    contractName: string = 'SBTSimple',
    debugMode: boolean = false
  ): SBTContract {
    const loader = DeploymentConfigLoader.getInstance();
    const address = loader.getContractAddress(network, contractName);
    
    if (!address) {
      throw new SBTContractError(
        `No deployed contract found for ${contractName} on ${network}`,
        'DEPLOYMENT_NOT_FOUND',
        undefined,
        undefined,
        undefined,
        { network, contractName }
      );
    }

    return new SBTContract(address, adapter, signer, debugMode);
  }

  // ============= Contract Information =============

  /**
   * Get contract address
   */
  public getAddress(): string {
    return this.address;
  }

  /**
   * Get current network
   */
  public getNetwork(): string {
    return this.network;
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

  // ============= Gas Estimation =============

  /**
   * Estimate gas for minting a token
   */
  public async estimateMintGas(
    to: string,
    tokenURI?: string
  ): Promise<GasEstimationResult> {
    try {
      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new SBTContractError('Provider not available', 'PROVIDER_ERROR');
      }

      // Estimate gas limit
      let gasLimit: bigint;
      if (tokenURI) {
        gasLimit = await this.contract.mint.estimateGas(to, tokenURI);
      } else {
        gasLimit = await this.contract.safeMint.estimateGas(to);
      }

      // Add 20% buffer
      gasLimit = (gasLimit * BigInt(120)) / BigInt(100);

      // Get fee data
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      const maxFeePerGas = feeData.maxFeePerGas;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

      const estimatedCost = gasLimit * gasPrice;

      return {
        gasLimit,
        gasPrice,
        maxFeePerGas: maxFeePerGas || undefined,
        maxPriorityFeePerGas: maxPriorityFeePerGas || undefined,
        estimatedCost,
        estimatedCostInEther: ethers.formatEther(estimatedCost),
        baseFee: feeData.maxFeePerGas || undefined,
        priorityFee: feeData.maxPriorityFeePerGas || undefined,
      };
    } catch (error) {
      throw new SBTContractError(
        `Failed to estimate gas for mint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GAS_ESTIMATION_ERROR',
        this.address,
        'estimateMintGas'
      );
    }
  }

  /**
   * Estimate gas for burning a token
   */
  public async estimateBurnGas(tokenId: bigint): Promise<GasEstimationResult> {
    try {
      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new SBTContractError('Provider not available', 'PROVIDER_ERROR');
      }

      let gasLimit = await this.contract.burn.estimateGas(tokenId);
      gasLimit = (gasLimit * BigInt(120)) / BigInt(100);

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      const estimatedCost = gasLimit * gasPrice;

      return {
        gasLimit,
        gasPrice,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
        estimatedCost,
        estimatedCostInEther: ethers.formatEther(estimatedCost),
        baseFee: feeData.maxFeePerGas || undefined,
        priorityFee: feeData.maxPriorityFeePerGas || undefined,
      };
    } catch (error) {
      throw new SBTContractError(
        `Failed to estimate gas for burn: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GAS_ESTIMATION_ERROR',
        this.address,
        'estimateBurnGas'
      );
    }
  }

  /**
   * Estimate gas for any contract method
   */
  public async estimateGas(
    method: string,
    ...args: any[]
  ): Promise<GasEstimationResult> {
    try {
      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new SBTContractError('Provider not available', 'PROVIDER_ERROR');
      }

      if (!this.contract[method]) {
        throw new SBTContractError(
          `Method ${method} not found`,
          'METHOD_NOT_FOUND',
          this.address,
          method
        );
      }

      let gasLimit = await this.contract[method].estimateGas(...args);
      gasLimit = (gasLimit * BigInt(120)) / BigInt(100);

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      const estimatedCost = gasLimit * gasPrice;

      return {
        gasLimit,
        gasPrice,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
        estimatedCost,
        estimatedCostInEther: ethers.formatEther(estimatedCost),
        baseFee: feeData.maxFeePerGas || undefined,
        priorityFee: feeData.maxPriorityFeePerGas || undefined,
      };
    } catch (error) {
      throw new SBTContractError(
        `Failed to estimate gas for ${method}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GAS_ESTIMATION_ERROR',
        this.address,
        method
      );
    }
  }

  // ============= Transaction Monitoring =============

  /**
   * Wait for transaction confirmation with detailed monitoring
   */
  public async waitForTransaction(
    txResponse: ContractTransactionResponse,
    confirmations: number = 1,
    timeout: number = 300000 // 5 minutes default
  ): Promise<TransactionMonitoringResult> {
    try {
      if (this.debugMode) {
        console.log(`[SBTContract] Waiting for transaction ${txResponse.hash} with ${confirmations} confirmations...`);
      }

      const receipt = await txResponse.wait(confirmations, timeout);
      if (!receipt) {
        throw new SBTContractError(
          'Transaction receipt not available',
          'RECEIPT_ERROR',
          this.address,
          undefined,
          txResponse.hash
        );
      }

      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new SBTContractError('Provider not available', 'PROVIDER_ERROR');
      }

      // Get block timestamp
      const block = await provider.getBlock(receipt.blockNumber);
      const timestamp = block?.timestamp || 0;

      // Parse events from logs
      const events: EventLog[] = [];
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          if (parsedLog) {
            events.push(log as EventLog);
          }
        } catch {
          // Log is not from this contract or not parseable
        }
      }

      const result: TransactionMonitoringResult = {
        receipt,
        confirmations,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.gasPrice,
        totalCost: receipt.gasUsed * receipt.gasPrice,
        logs: receipt.logs,
        events,
        status: receipt.status || 0,
        timestamp,
      };

      if (this.debugMode) {
        console.log(`[SBTContract] Transaction confirmed:`, {
          hash: result.transactionHash,
          block: result.blockNumber,
          gasUsed: result.gasUsed.toString(),
          cost: ethers.formatEther(result.totalCost),
          events: result.events.length,
        });
      }

      return result;
    } catch (error) {
      throw new SBTContractError(
        `Transaction monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION_MONITORING_ERROR',
        this.address,
        undefined,
        txResponse.hash
      );
    }
  }

  /**
   * Monitor transaction with progress updates
   */
  public async monitorTransaction(
    txResponse: ContractTransactionResponse,
    onProgress?: (confirmations: number, required: number) => void,
    requiredConfirmations: number = 3
  ): Promise<TransactionMonitoringResult> {
    try {
      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new SBTContractError('Provider not available', 'PROVIDER_ERROR');
      }

      let currentConfirmations = 0;
      
      // Monitor confirmations
      const checkConfirmations = async (): Promise<void> => {
        while (currentConfirmations < requiredConfirmations) {
          const receipt = await provider.getTransactionReceipt(txResponse.hash);
          if (receipt) {
            const currentBlock = await provider.getBlockNumber();
            currentConfirmations = currentBlock - receipt.blockNumber + 1;
            
            if (onProgress) {
              onProgress(currentConfirmations, requiredConfirmations);
            }
            
            if (currentConfirmations >= requiredConfirmations) {
              break;
            }
          }
          
          // Wait 2 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      };

      await checkConfirmations();
      
      return await this.waitForTransaction(txResponse, requiredConfirmations);
    } catch (error) {
      throw new SBTContractError(
        `Transaction monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSACTION_MONITORING_ERROR',
        this.address,
        undefined,
        txResponse.hash
      );
    }
  }

  // ============= Token Operations =============

  /**
   * Mint a new SBT token with monitoring
   */
  public async mint(
    to: string,
    tokenURI?: string,
    options?: TransactionOptions
  ): Promise<{
    transaction: ContractTransactionResponse;
    monitoring: TransactionMonitoringResult;
    tokenId?: bigint;
  }> {
    try {
      if (this.debugMode) {
        console.log(`[SBTContract] Minting token to ${to}${tokenURI ? ` with URI ${tokenURI}` : ''}`);
      }

      // Build transaction options
      const txOptions: any = {};
      if (options?.gasLimit) txOptions.gasLimit = options.gasLimit;
      if (options?.gasPrice) txOptions.gasPrice = options.gasPrice;
      if (options?.maxFeePerGas) txOptions.maxFeePerGas = options.maxFeePerGas;
      if (options?.maxPriorityFeePerGas) txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options?.value) txOptions.value = options.value;
      if (options?.nonce !== undefined) txOptions.nonce = options.nonce;

      // Execute mint transaction
      let transaction: ContractTransactionResponse;
      if (tokenURI) {
        transaction = await this.contract.mint(to, tokenURI, txOptions);
      } else {
        transaction = await this.contract.safeMint(to, txOptions);
      }

      // Monitor transaction
      const monitoring = await this.waitForTransaction(
        transaction,
        options?.confirmations || 1,
        options?.timeout
      );

      // Extract token ID from events
      let tokenId: bigint | undefined;
      for (const event of monitoring.events) {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: [...event.topics],
            data: event.data,
          });
          if (parsed && parsed.name === 'Transfer') {
            tokenId = parsed.args.tokenId;
            break;
          }
        } catch {
          // Continue checking other events
        }
      }

      if (this.debugMode) {
        console.log(`[SBTContract] Token minted:`, {
          tokenId: tokenId?.toString(),
          to,
          txHash: transaction.hash,
        });
      }

      return { transaction, monitoring, tokenId };
    } catch (error) {
      throw new SBTContractError(
        `Failed to mint token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MINT_ERROR',
        this.address,
        'mint',
        undefined,
        { to, tokenURI, options }
      );
    }
  }

  /**
   * Burn an SBT token with monitoring
   */
  public async burn(
    tokenId: bigint,
    options?: TransactionOptions
  ): Promise<{
    transaction: ContractTransactionResponse;
    monitoring: TransactionMonitoringResult;
  }> {
    try {
      if (this.debugMode) {
        console.log(`[SBTContract] Burning token ${tokenId}`);
      }

      const txOptions: any = {};
      if (options?.gasLimit) txOptions.gasLimit = options.gasLimit;
      if (options?.gasPrice) txOptions.gasPrice = options.gasPrice;
      if (options?.maxFeePerGas) txOptions.maxFeePerGas = options.maxFeePerGas;
      if (options?.maxPriorityFeePerGas) txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options?.nonce !== undefined) txOptions.nonce = options.nonce;

      const transaction = await this.contract.burn(tokenId, txOptions);
      const monitoring = await this.waitForTransaction(
        transaction,
        options?.confirmations || 1,
        options?.timeout
      );

      if (this.debugMode) {
        console.log(`[SBTContract] Token burned:`, {
          tokenId: tokenId.toString(),
          txHash: transaction.hash,
        });
      }

      return { transaction, monitoring };
    } catch (error) {
      throw new SBTContractError(
        `Failed to burn token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BURN_ERROR',
        this.address,
        'burn',
        undefined,
        { tokenId: tokenId.toString(), options }
      );
    }
  }

  /**
   * Revoke an SBT token with monitoring
   */
  public async revoke(
    tokenId: bigint,
    options?: TransactionOptions
  ): Promise<{
    transaction: ContractTransactionResponse;
    monitoring: TransactionMonitoringResult;
  }> {
    try {
      if (this.debugMode) {
        console.log(`[SBTContract] Revoking token ${tokenId}`);
      }

      const txOptions: any = {};
      if (options?.gasLimit) txOptions.gasLimit = options.gasLimit;
      if (options?.gasPrice) txOptions.gasPrice = options.gasPrice;
      if (options?.maxFeePerGas) txOptions.maxFeePerGas = options.maxFeePerGas;
      if (options?.maxPriorityFeePerGas) txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options?.nonce !== undefined) txOptions.nonce = options.nonce;

      const transaction = await this.contract.revoke(tokenId, txOptions);
      const monitoring = await this.waitForTransaction(
        transaction,
        options?.confirmations || 1,
        options?.timeout
      );

      if (this.debugMode) {
        console.log(`[SBTContract] Token revoked:`, {
          tokenId: tokenId.toString(),
          txHash: transaction.hash,
        });
      }

      return { transaction, monitoring };
    } catch (error) {
      throw new SBTContractError(
        `Failed to revoke token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REVOKE_ERROR',
        this.address,
        'revoke',
        undefined,
        { tokenId: tokenId.toString(), options }
      );
    }
  }

  // ============= Token Queries =============

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
   * Get token metadata (fetches and parses JSON from tokenURI)
   */
  public async getTokenMetadata(tokenId: bigint): Promise<SBTTokenMetadata> {
    try {
      const uri = await this.tokenURI(tokenId);
      
      // If URI is data URL, parse directly
      if (uri.startsWith('data:application/json')) {
        const json = uri.split(',')[1];
        const decoded = Buffer.from(json, 'base64').toString();
        return JSON.parse(decoded);
      }
      
      // Otherwise fetch from HTTP(S)
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new SBTContractError(
        `Failed to get token metadata for ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'METADATA_ERROR',
        this.address,
        'getTokenMetadata'
      );
    }
  }

  /**
   * Get complete token information
   */
  public async getTokenInfo(tokenId: bigint): Promise<SBTTokenInfo> {
    try {
      const [owner, tokenURI, isRevoked] = await Promise.all([
        this.ownerOf(tokenId),
        this.tokenURI(tokenId),
        this.isRevoked(tokenId),
      ]);

      let metadata: SBTTokenMetadata | undefined;
      try {
        metadata = await this.getTokenMetadata(tokenId);
      } catch {
        // Metadata fetch failed, continue without it
      }

      return {
        tokenId,
        owner,
        tokenURI,
        metadata,
        isRevoked,
      };
    } catch (error) {
      throw new SBTContractError(
        `Failed to get token info for ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOKEN_INFO_ERROR',
        this.address,
        'getTokenInfo'
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

  // ============= Event Handling =============

  /**
   * Query past Transfer events
   */
  public async queryTransferEvents(
    filter?: EventFilterOptions & { from?: string; to?: string; tokenId?: bigint }
  ): Promise<SBTTransferEvent[]> {
    try {
      const eventFilter = this.contract.filters.Transfer(
        filter?.from,
        filter?.to,
        filter?.tokenId
      );

      const events = await this.contract.queryFilter(
        eventFilter,
        filter?.fromBlock || 0,
        filter?.toBlock || 'latest'
      );

      const provider = this.adapter.getProvider();
      const results: SBTTransferEvent[] = [];

      for (const event of events) {
        const log = event as EventLog;
        const parsed = this.contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });

        if (parsed) {
          let timestamp: number | undefined;
          if (provider) {
            try {
              const block = await provider.getBlock(log.blockNumber);
              timestamp = block?.timestamp;
            } catch {
              // Continue without timestamp
            }
          }

          results.push({
            from: parsed.args.from,
            to: parsed.args.to,
            tokenId: parsed.args.tokenId,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.index,
            timestamp,
          });
        }
      }

      return results;
    } catch (error) {
      throw new SBTContractError(
        `Failed to query Transfer events: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EVENT_QUERY_ERROR',
        this.address,
        'queryTransferEvents'
      );
    }
  }

  /**
   * Query past TokenRevoked events
   */
  public async queryRevocationEvents(
    filter?: EventFilterOptions & { tokenId?: bigint }
  ): Promise<SBTRevocationEvent[]> {
    try {
      const eventFilter = this.contract.filters.TokenRevoked(filter?.tokenId);

      const events = await this.contract.queryFilter(
        eventFilter,
        filter?.fromBlock || 0,
        filter?.toBlock || 'latest'
      );

      const provider = this.adapter.getProvider();
      const results: SBTRevocationEvent[] = [];

      for (const event of events) {
        const log = event as EventLog;
        const parsed = this.contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });

        if (parsed) {
          let timestamp: number | undefined;
          if (provider) {
            try {
              const block = await provider.getBlock(log.blockNumber);
              timestamp = block?.timestamp;
            } catch {
              // Continue without timestamp
            }
          }

          results.push({
            tokenId: parsed.args.tokenId,
            reason: parsed.args.reason,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.index,
            timestamp,
          });
        }
      }

      return results;
    } catch (error) {
      throw new SBTContractError(
        `Failed to query TokenRevoked events: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EVENT_QUERY_ERROR',
        this.address,
        'queryRevocationEvents'
      );
    }
  }

  /**
   * Subscribe to Transfer events
   */
  public onTransfer(
    callback: (event: SBTTransferEvent) => void,
    filter?: { from?: string; to?: string; tokenId?: bigint }
  ): string {
    const subscriptionId = `transfer-${Date.now()}-${Math.random()}`;
    
    const eventFilter = this.contract.filters.Transfer(
      filter?.from,
      filter?.to,
      filter?.tokenId
    );

    const listener = async (from: string, to: string, tokenId: bigint, event: any) => {
      const provider = this.adapter.getProvider();
      let timestamp: number | undefined;
      
      if (provider) {
        try {
          const block = await provider.getBlock(event.blockNumber);
          timestamp = block?.timestamp;
        } catch {
          // Continue without timestamp
        }
      }

      callback({
        from,
        to,
        tokenId,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
        timestamp,
      });
    };

    this.contract.on(eventFilter, listener);
    this.eventSubscriptions.set(subscriptionId, { filter: eventFilter, listener });

    if (this.debugMode) {
      console.log(`[SBTContract] Subscribed to Transfer events: ${subscriptionId}`);
    }

    return subscriptionId;
  }

  /**
   * Subscribe to TokenRevoked events
   */
  public onTokenRevoked(
    callback: (event: SBTRevocationEvent) => void,
    filter?: { tokenId?: bigint }
  ): string {
    const subscriptionId = `revocation-${Date.now()}-${Math.random()}`;
    
    const eventFilter = this.contract.filters.TokenRevoked(filter?.tokenId);

    const listener = async (tokenId: bigint, reason: string, event: any) => {
      const provider = this.adapter.getProvider();
      let timestamp: number | undefined;
      
      if (provider) {
        try {
          const block = await provider.getBlock(event.blockNumber);
          timestamp = block?.timestamp;
        } catch {
          // Continue without timestamp
        }
      }

      callback({
        tokenId,
        reason,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
        timestamp,
      });
    };

    this.contract.on(eventFilter, listener);
    this.eventSubscriptions.set(subscriptionId, { filter: eventFilter, listener });

    if (this.debugMode) {
      console.log(`[SBTContract] Subscribed to TokenRevoked events: ${subscriptionId}`);
    }

    return subscriptionId;
  }

  /**
   * Subscribe to Approval events
   */
  public onApproval(
    callback: (event: SBTApprovalEvent) => void,
    filter?: { owner?: string; approved?: string; tokenId?: bigint }
  ): string {
    const subscriptionId = `approval-${Date.now()}-${Math.random()}`;
    
    const eventFilter = this.contract.filters.Approval(
      filter?.owner,
      filter?.approved,
      filter?.tokenId
    );

    const listener = async (owner: string, approved: string, tokenId: bigint, event: any) => {
      const provider = this.adapter.getProvider();
      let timestamp: number | undefined;
      
      if (provider) {
        try {
          const block = await provider.getBlock(event.blockNumber);
          timestamp = block?.timestamp;
        } catch {
          // Continue without timestamp
        }
      }

      callback({
        owner,
        approved,
        tokenId,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
        timestamp,
      });
    };

    this.contract.on(eventFilter, listener);
    this.eventSubscriptions.set(subscriptionId, { filter: eventFilter, listener });

    if (this.debugMode) {
      console.log(`[SBTContract] Subscribed to Approval events: ${subscriptionId}`);
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from an event
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.eventSubscriptions.get(subscriptionId);
    if (subscription) {
      this.contract.off(subscription.filter, subscription.listener);
      this.eventSubscriptions.delete(subscriptionId);
      
      if (this.debugMode) {
        console.log(`[SBTContract] Unsubscribed: ${subscriptionId}`);
      }
    }
  }

  /**
   * Remove all event listeners
   */
  public removeAllListeners(): void {
    this.contract.removeAllListeners();
    this.eventSubscriptions.clear();
    
    if (this.debugMode) {
      console.log(`[SBTContract] All event listeners removed`);
    }
  }

  // ============= Contract Management =============

  /**
   * Get underlying contract instance
   */
  public getContract(): Contract {
    return this.contract;
  }

  /**
   * Update contract signer
   */
  public updateSigner(signer: ethers.Signer): void {
    this.contract = this.contract.connect(signer) as Contract;
    
    if (this.debugMode) {
      console.log(`[SBTContract] Signer updated`);
    }
  }

  /**
   * Check if contract exists at address
   */
  public async isDeployed(): Promise<boolean> {
    try {
      const provider = this.adapter.getProvider();
      if (!provider) {
        return false;
      }

      const code = await provider.getCode(this.address);
      return code !== '0x';
    } catch {
      return false;
    }
  }
}

/**
 * Default export
 */
export default SBTContract;
