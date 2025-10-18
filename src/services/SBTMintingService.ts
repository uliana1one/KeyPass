/**
 * SBT Minting Service - Production Implementation
 * 
 * Real blockchain integration for minting Soulbound Tokens (SBTs) with:
 * - Real IPFS metadata upload and management
 * - Real blockchain transactions with monitoring
 * - Transaction retry logic and error handling
 * - Real gas estimation and fee calculation
 * - Comprehensive deployment management
 */

import { ethers, Signer } from 'ethers';
import { SBTContract, DeploymentConfigLoader, TransactionMonitoringResult, GasEstimationResult } from '../contracts/SBTContract.js';
import { SBTContractFactory } from '../contracts/SBTContractFactory.js';
import { MoonbeamAdapter } from '../adapters/MoonbeamAdapter.js';
import { MoonbeamNetwork, MoonbeamErrorCode } from '../config/moonbeamConfig.js';
import { WalletError } from '../errors/WalletErrors.js';
import { 
  SBTMintParams, 
  SBTTokenMetadata,
  SBTContractAddress,
  SBTContractDeploymentConfig,
  SBTContractDeploymentResult
} from '../contracts/types/SBTContractTypes.js';

/**
 * IPFS pinning service configuration
 */
export interface IPFSConfig {
  pinningService?: 'pinata' | 'web3storage' | 'nftstorage' | 'local';
  apiKey?: string;
  apiSecret?: string;
  gatewayUrl?: string;
}

/**
 * Custom error for SBT Minting Service operations
 */
export class SBTMintingServiceError extends WalletError {
  public readonly code: MoonbeamErrorCode;
  public readonly operation?: string;
  public readonly tokenId?: string;
  public readonly metadata?: any;
  public readonly transactionHash?: string;

  constructor(
    message: string,
    code: MoonbeamErrorCode,
    operation?: string,
    tokenId?: string,
    transactionHash?: string,
    metadata?: any,
    details?: any
  ) {
    super(message, code);
    this.code = code;
    this.operation = operation;
    this.tokenId = tokenId;
    this.transactionHash = transactionHash;
    this.metadata = metadata;
  }
}

/**
 * Interface for SBT minting result
 */
export interface SBTMintingResult {
  tokenId: bigint;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  totalCost: bigint;
  totalCostInEther: string;
  metadataUri: string;
  contractAddress: SBTContractAddress;
  recipient: SBTContractAddress;
  mintedAt: string;
  confirmations: number;
  timestamp?: number;
}

/**
 * Interface for IPFS upload result
 */
export interface IPFSUploadResult {
  cid: string;
  uri: string;
  gatewayUrl: string;
  size: number;
  uploadedAt: string;
  pinned: boolean;
}

/**
 * Interface for batch minting result
 */
export interface BatchMintingResult {
  success: boolean;
  totalMinted: number;
  totalFailed: number;
  results: SBTMintingResult[];
  errors: Array<{ index: number; error: string; metadata?: SBTTokenMetadata }>;
  totalGasUsed: bigint;
  totalCost: bigint;
  totalCostInEther: string;
}

/**
 * Interface for minting progress callback
 */
export type MintingProgressCallback = (progress: {
  stage: 'uploading' | 'estimating' | 'minting' | 'confirming' | 'completed';
  message: string;
  percentage: number;
  data?: any;
}) => void;

/**
 * Production SBT Minting Service
 */
export class SBTMintingService {
  private adapter: MoonbeamAdapter;
  private ipfsConfig: IPFSConfig;
  private debugMode: boolean;
  private maxRetries: number;
  private retryDelay: number;
  private contractFactory: SBTContractFactory | null = null;
  private configLoader: DeploymentConfigLoader;
  private confirmationTimeout: number;
  private requiredConfirmations: number;

  constructor(
    adapter: MoonbeamAdapter, 
    ipfsConfig: IPFSConfig = {},
    debugMode: boolean = false
  ) {
    this.adapter = adapter;
    this.ipfsConfig = {
      pinningService: ipfsConfig.pinningService || 'local',
      gatewayUrl: ipfsConfig.gatewayUrl || 'https://gateway.pinata.cloud/ipfs',
      ...ipfsConfig,
    };
    this.debugMode = debugMode;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
    this.confirmationTimeout = 300000; // 5 minutes
    this.requiredConfirmations = 3;
    this.configLoader = DeploymentConfigLoader.getInstance();

    if (this.debugMode) {
      console.log('[SBTMintingService] Initialized with config:', {
        network: adapter.getCurrentNetwork(),
        ipfsService: this.ipfsConfig.pinningService,
        maxRetries: this.maxRetries,
      });
    }
  }

  // ============= IPFS Operations =============

  /**
   * Upload metadata to IPFS using configured pinning service
   */
  public async uploadMetadataToIPFS(metadata: SBTTokenMetadata): Promise<IPFSUploadResult> {
    try {
      if (this.debugMode) {
        console.log('[SBTMintingService] Uploading metadata to IPFS:', metadata.name);
      }

      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBytes = new TextEncoder().encode(metadataJson);

      let cid: string;
      let pinned = false;

      switch (this.ipfsConfig.pinningService) {
        case 'pinata':
          ({ cid, pinned } = await this.uploadToPinata(metadataJson, metadata.name));
          break;
        
        case 'web3storage':
          ({ cid, pinned } = await this.uploadToWeb3Storage(metadataBytes, metadata.name));
          break;
        
        case 'nftstorage':
          ({ cid, pinned } = await this.uploadToNFTStorage(metadataJson, metadata.name));
          break;
        
        case 'local':
        default:
          // For local/development, create a data URL
          const base64 = Buffer.from(metadataJson).toString('base64');
          cid = `data:application/json;base64,${base64}`;
          pinned = false;
          break;
      }

      const uri = cid.startsWith('data:') ? cid : `ipfs://${cid}`;
      const gatewayUrl = cid.startsWith('data:') ? cid : `${this.ipfsConfig.gatewayUrl}/${cid}`;

      const result: IPFSUploadResult = {
        cid,
        uri,
        gatewayUrl,
        size: metadataBytes.length,
        uploadedAt: new Date().toISOString(),
        pinned,
      };

      if (this.debugMode) {
        console.log('[SBTMintingService] Metadata uploaded successfully:', result);
      }

      return result;
    } catch (error) {
      throw new SBTMintingServiceError(
        `Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`,
        MoonbeamErrorCode.IPFS_ERROR,
        'uploadMetadataToIPFS',
        undefined,
        undefined,
        metadata,
        error
      );
    }
  }

  /**
   * Upload to Pinata
   */
  private async uploadToPinata(metadataJson: string, name: string): Promise<{ cid: string; pinned: boolean }> {
    if (!this.ipfsConfig.apiKey || !this.ipfsConfig.apiSecret) {
      throw new Error('Pinata API credentials not configured');
    }

    const formData = new FormData();
    const blob = new Blob([metadataJson], { type: 'application/json' });
    formData.append('file', blob, `${name}.json`);

    const pinataMetadata = JSON.stringify({
      name: `${name}_metadata`,
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': this.ipfsConfig.apiKey,
        'pinata_secret_api_key': this.ipfsConfig.apiSecret,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { cid: result.IpfsHash, pinned: true };
  }

  /**
   * Upload to Web3.Storage
   */
  private async uploadToWeb3Storage(data: Uint8Array, name: string): Promise<{ cid: string; pinned: boolean }> {
    if (!this.ipfsConfig.apiKey) {
      throw new Error('Web3.Storage API token not configured');
    }

    const blob = new Blob([data], { type: 'application/json' });
    const file = new File([blob], `${name}.json`, { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.ipfsConfig.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Web3.Storage upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { cid: result.cid, pinned: true };
  }

  /**
   * Upload to NFT.Storage
   */
  private async uploadToNFTStorage(metadataJson: string, name: string): Promise<{ cid: string; pinned: boolean }> {
    if (!this.ipfsConfig.apiKey) {
      throw new Error('NFT.Storage API token not configured');
    }

    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.ipfsConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: metadataJson,
    });

    if (!response.ok) {
      throw new Error(`NFT.Storage upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { cid: result.value.cid, pinned: true };
  }

  // ============= Contract Operations =============

  /**
   * Get or create SBT contract instance
   */
  private async getContract(
    contractAddress: SBTContractAddress,
    signer?: Signer
  ): Promise<SBTContract> {
    if (!this.adapter.isConnected()) {
      throw new SBTMintingServiceError(
        'MoonbeamAdapter is not connected',
        MoonbeamErrorCode.NETWORK_ERROR,
        'getContract'
      );
    }

    return new SBTContract(contractAddress, this.adapter, signer, this.debugMode);
  }

  /**
   * Load contract from deployment config
   */
  public async loadContractFromDeployment(
    network: string,
    contractName: string = 'SBTSimple',
    signer?: Signer
  ): Promise<SBTContract> {
    try {
      if (this.debugMode) {
        console.log(`[SBTMintingService] Loading contract ${contractName} from ${network} deployment`);
      }

      const contract = SBTContract.fromDeployment(network, this.adapter, signer, contractName, this.debugMode);

      // Verify contract is deployed
      const isDeployed = await contract.isDeployed();
      if (!isDeployed) {
        throw new Error(`Contract ${contractName} not deployed on ${network}`);
      }

      if (this.debugMode) {
        const [name, symbol, totalSupply] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.totalSupply(),
        ]);
        console.log('[SBTMintingService] Contract loaded:', { name, symbol, totalSupply: totalSupply.toString() });
      }

      return contract;
    } catch (error) {
      throw new SBTMintingServiceError(
        `Failed to load contract from deployment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'loadContractFromDeployment',
        undefined,
        undefined,
        { network, contractName },
        error
      );
    }
  }

  // ============= Gas Estimation =============

  /**
   * Estimate gas for minting transaction using enhanced SBTContract
   */
  public async estimateMintingGas(
    contractAddress: SBTContractAddress,
    recipient: SBTContractAddress,
    tokenURI: string,
    signer: Signer
  ): Promise<GasEstimationResult> {
    try {
      if (this.debugMode) {
        console.log('[SBTMintingService] Estimating gas for minting...');
      }

      const contract = await this.getContract(contractAddress, signer);
      const gasEstimate = await contract.estimateMintGas(recipient, tokenURI);

      if (this.debugMode) {
        console.log('[SBTMintingService] Gas estimation:', {
          gasLimit: gasEstimate.gasLimit.toString(),
          cost: gasEstimate.estimatedCostInEther,
        });
      }

      return gasEstimate;
    } catch (error) {
      throw new SBTMintingServiceError(
        `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'estimateMintingGas',
        undefined,
        undefined,
        { contractAddress, recipient, tokenURI },
        error
      );
    }
  }

  // ============= Minting Operations =============

  /**
   * Mint SBT with real blockchain transaction and monitoring
   */
  public async mintSBT(
    contractAddress: SBTContractAddress,
    params: SBTMintParams,
    signer: Signer,
    onProgress?: MintingProgressCallback
  ): Promise<SBTMintingResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (this.debugMode) {
          console.log(`[SBTMintingService] Minting attempt ${attempt}/${this.maxRetries}...`);
        }

        // Stage 1: Upload metadata to IPFS
        onProgress?.({
          stage: 'uploading',
          message: 'Uploading metadata to IPFS...',
          percentage: 10,
        });

        let metadataUri = params.tokenURI;
        if (params.metadata && !params.tokenURI) {
          const ipfsResult = await this.uploadMetadataToIPFS(params.metadata);
          metadataUri = ipfsResult.uri;
          
          if (this.debugMode) {
            console.log('[SBTMintingService] Metadata uploaded:', ipfsResult.uri);
          }
        }

        if (!metadataUri) {
          throw new Error('No metadata URI provided');
        }

        // Stage 2: Estimate gas
        onProgress?.({
          stage: 'estimating',
          message: 'Estimating transaction gas...',
          percentage: 25,
        });

        const contract = await this.getContract(contractAddress, signer);
        const gasEstimate = await contract.estimateMintGas(params.to, metadataUri);

        if (this.debugMode) {
          console.log('[SBTMintingService] Gas estimate:', gasEstimate.estimatedCostInEther);
        }

        // Stage 3: Execute minting transaction
        onProgress?.({
          stage: 'minting',
          message: 'Submitting minting transaction...',
          percentage: 40,
        });

        const { transaction, monitoring, tokenId } = await contract.mint(
          params.to,
          metadataUri,
          {
            gasLimit: params.gasLimit || gasEstimate.gasLimit,
            gasPrice: params.gasPrice,
            maxFeePerGas: params.maxFeePerGas || gasEstimate.maxFeePerGas,
            maxPriorityFeePerGas: params.maxPriorityFeePerGas || gasEstimate.maxPriorityFeePerGas,
            value: params.value,
            confirmations: this.requiredConfirmations,
            timeout: this.confirmationTimeout,
          }
        );

        if (!tokenId) {
          throw new Error('Token ID not found in transaction events');
        }

        // Stage 4: Wait for confirmations
        onProgress?.({
          stage: 'confirming',
          message: `Waiting for ${this.requiredConfirmations} confirmations...`,
          percentage: 70,
          data: { transactionHash: transaction.hash },
        });

        if (this.debugMode) {
          console.log('[SBTMintingService] Transaction confirmed:', {
            hash: monitoring.transactionHash,
            block: monitoring.blockNumber,
            gasUsed: monitoring.gasUsed.toString(),
            cost: ethers.formatEther(monitoring.totalCost),
          });
        }

        // Stage 5: Complete
        onProgress?.({
          stage: 'completed',
          message: 'Minting completed successfully!',
          percentage: 100,
          data: { tokenId: tokenId.toString(), transactionHash: monitoring.transactionHash },
        });

        const result: SBTMintingResult = {
          tokenId,
          transactionHash: monitoring.transactionHash,
          blockNumber: monitoring.blockNumber,
          gasUsed: monitoring.gasUsed,
          totalCost: monitoring.totalCost,
          totalCostInEther: ethers.formatEther(monitoring.totalCost),
          metadataUri,
          contractAddress,
          recipient: params.to,
          mintedAt: new Date().toISOString(),
          confirmations: this.requiredConfirmations,
          timestamp: monitoring.timestamp,
        };

        if (this.debugMode) {
          console.log('[SBTMintingService] Minting successful:', result);
        }

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (this.debugMode) {
          console.warn(`[SBTMintingService] Attempt ${attempt} failed:`, lastError.message);
        }

        // Check if error is retryable
        if (this.isNonRetryableError(lastError)) {
          throw new SBTMintingServiceError(
            `Minting failed: ${lastError.message}`,
            MoonbeamErrorCode.TRANSACTION_ERROR,
            'mintSBT',
            undefined,
            undefined,
            params,
            lastError
          );
        }

        // Wait before retry with exponential backoff
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          if (this.debugMode) {
            console.log(`[SBTMintingService] Retrying in ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new SBTMintingServiceError(
      `Minting failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      MoonbeamErrorCode.TRANSACTION_ERROR,
      'mintSBT',
      undefined,
      undefined,
      params,
      lastError
    );
  }

  /**
   * Batch mint multiple SBTs
   */
  public async batchMintSBT(
    contractAddress: SBTContractAddress,
    recipient: SBTContractAddress,
    metadataList: SBTTokenMetadata[],
    signer: Signer,
    onProgress?: (current: number, total: number, result?: SBTMintingResult, error?: string) => void
  ): Promise<BatchMintingResult> {
    const results: SBTMintingResult[] = [];
    const errors: Array<{ index: number; error: string; metadata?: SBTTokenMetadata }> = [];
    let totalGasUsed = BigInt(0);
    let totalCost = BigInt(0);

    if (this.debugMode) {
      console.log(`[SBTMintingService] Starting batch mint of ${metadataList.length} tokens...`);
    }

    for (let i = 0; i < metadataList.length; i++) {
      try {
        const metadata = metadataList[i];
        
        if (this.debugMode) {
          console.log(`[SBTMintingService] Batch minting ${i + 1}/${metadataList.length}: ${metadata.name}`);
        }

        const result = await this.mintSBT(
          contractAddress,
          { to: recipient, metadata },
          signer
        );

        results.push(result);
        totalGasUsed += result.gasUsed;
        totalCost += result.totalCost;

        onProgress?.(i + 1, metadataList.length, result);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          index: i,
          error: errorMessage,
          metadata: metadataList[i],
        });

        if (this.debugMode) {
          console.error(`[SBTMintingService] Batch mint error at index ${i}:`, error);
        }

        onProgress?.(i + 1, metadataList.length, undefined, errorMessage);
      }
    }

    const batchResult: BatchMintingResult = {
      success: errors.length === 0,
      totalMinted: results.length,
      totalFailed: errors.length,
      results,
      errors,
      totalGasUsed,
      totalCost,
      totalCostInEther: ethers.formatEther(totalCost),
    };

    if (this.debugMode) {
      console.log('[SBTMintingService] Batch minting completed:', {
        minted: batchResult.totalMinted,
        failed: batchResult.totalFailed,
        totalCost: batchResult.totalCostInEther,
      });
    }

    return batchResult;
  }

  // ============= Error Handling =============

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'insufficient funds',
      'nonce too low',
      'invalid signature',
      'execution reverted',
      'token already exists',
      'invalid address',
      'invalid token uri',
      'caller is not owner',
      'unauthorized',
      'max supply reached',
    ];

    const errorMessage = error.message.toLowerCase();
    return nonRetryableMessages.some(msg => errorMessage.includes(msg));
  }

  // ============= Utility Methods =============

  /**
   * Get contract information
   */
  public async getContractInfo(contractAddress: SBTContractAddress, signer?: Signer): Promise<{
    name: string;
    symbol: string;
    totalSupply: bigint;
    address: string;
    network: string;
    isDeployed: boolean;
  }> {
    try {
      const contract = await this.getContract(contractAddress, signer);
      
      const [name, symbol, totalSupply, isDeployed] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
        contract.isDeployed(),
      ]);

      return {
        name,
        symbol,
        totalSupply,
        address: contractAddress,
        network: this.adapter.getCurrentNetwork(),
        isDeployed,
      };
    } catch (error) {
      throw new SBTMintingServiceError(
        `Failed to get contract info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'getContractInfo',
        undefined,
        undefined,
        { contractAddress },
        error
      );
    }
  }

  /**
   * Get minting service status
   */
  public getStatus(): {
    connected: boolean;
    network: string;
    ipfsService: string;
    debugMode: boolean;
    maxRetries: number;
    retryDelay: number;
    confirmationTimeout: number;
    requiredConfirmations: number;
  } {
    return {
      connected: this.adapter.isConnected(),
      network: this.adapter.getCurrentNetwork(),
      ipfsService: this.ipfsConfig.pinningService || 'local',
      debugMode: this.debugMode,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      confirmationTimeout: this.confirmationTimeout,
      requiredConfirmations: this.requiredConfirmations,
    };
  }

  /**
   * Set configuration
   */
  public setConfig(config: {
    maxRetries?: number;
    retryDelay?: number;
    confirmationTimeout?: number;
    requiredConfirmations?: number;
    debugMode?: boolean;
  }): void {
    if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (config.retryDelay !== undefined) this.retryDelay = config.retryDelay;
    if (config.confirmationTimeout !== undefined) this.confirmationTimeout = config.confirmationTimeout;
    if (config.requiredConfirmations !== undefined) this.requiredConfirmations = config.requiredConfirmations;
    if (config.debugMode !== undefined) this.debugMode = config.debugMode;

    if (this.debugMode) {
      console.log('[SBTMintingService] Configuration updated:', config);
    }
  }

  /**
   * Update IPFS configuration
   */
  public setIPFSConfig(config: IPFSConfig): void {
    this.ipfsConfig = {
      ...this.ipfsConfig,
      ...config,
    };

    if (this.debugMode) {
      console.log('[SBTMintingService] IPFS configuration updated');
    }
  }
}

/**
 * Export real SBT minting service
 */
export default SBTMintingService;
