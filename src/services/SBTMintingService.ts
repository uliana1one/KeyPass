/**
 * SBT Minting Service
 * 
 * Service for minting Soulbound Tokens (SBTs) with metadata upload to IPFS,
 * unique token ID generation, gas estimation, and transaction confirmation.
 */

import { ethers, Signer, ContractTransactionReceipt } from 'ethers';
import { createHelia } from 'helia';
import { UnixFS } from 'ipfs-unixfs';
import { SBTContract } from '../contracts/SBTContract.js';
import { MoonbeamAdapter } from '../adapters/MoonbeamAdapter.js';
import { MoonbeamNetwork, MoonbeamErrorCode } from '../config/moonbeamConfig.js';
import { WalletError } from '../errors/WalletErrors.js';
import { 
  SBTMintParams, 
  SBTTokenMetadata, 
  SBTTokenAttribute,
  SBTContractAddress,
  SBTContractErrorType 
} from '../contracts/types/SBTContractTypes.js';

/**
 * Custom error for SBT Minting Service operations
 */
export class SBTMintingServiceError extends WalletError {
  public readonly code: MoonbeamErrorCode;
  public readonly operation?: string;
  public readonly tokenId?: string;
  public readonly metadata?: any;

  constructor(
    message: string,
    code: MoonbeamErrorCode,
    operation?: string,
    tokenId?: string,
    metadata?: any,
    details?: any
  ) {
    super(message, code);
    this.code = code;
    this.operation = operation;
    this.tokenId = tokenId;
    this.metadata = metadata;
  }
}

/**
 * Interface for SBT minting result
 */
export interface SBTMintingResult {
  tokenId: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  metadataUri: string;
  contractAddress: SBTContractAddress;
  recipient: SBTContractAddress;
  mintedAt: string;
}

/**
 * Interface for gas estimation result
 */
export interface SBTGasEstimation {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostInETH: string;
}

/**
 * Interface for IPFS upload result
 */
export interface IPFSUploadResult {
  cid: string;
  uri: string;
  size: number;
  uploadedAt: string;
}

/**
 * SBT Minting Service
 */
export class SBTMintingService {
  private adapter: MoonbeamAdapter;
  private ipfs: any;
  private unixfs: UnixFS | null = null;
  private debugMode: boolean;
  private maxRetries: number;
  private retryDelay: number;

  constructor(adapter: MoonbeamAdapter, debugMode: boolean = false) {
    this.adapter = adapter;
    this.debugMode = debugMode;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.initializeIPFS();
  }

  /**
   * Initialize IPFS client
   */
  private async initializeIPFS(): Promise<void> {
    try {
      if (this.debugMode) {
        console.log('[SBTMintingService] Initializing IPFS client...');
      }

      this.ipfs = await createHelia();
      this.unixfs = new UnixFS(this.ipfs);

      if (this.debugMode) {
        console.log('[SBTMintingService] IPFS client initialized successfully');
      }
    } catch (error) {
      const errorMessage = `Failed to initialize IPFS client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] IPFS initialization error:', error);
      }

      throw new SBTMintingServiceError(
        errorMessage,
        MoonbeamErrorCode.IPFS_ERROR,
        'initializeIPFS',
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Upload metadata to IPFS
   */
  public async uploadMetadataToIPFS(metadata: SBTTokenMetadata): Promise<IPFSUploadResult> {
    try {
      if (!this.ipfs || !this.unixfs) {
        await this.initializeIPFS();
      }

      if (this.debugMode) {
        console.log('[SBTMintingService] Uploading metadata to IPFS:', metadata.name);
      }

      // Convert metadata to JSON string
      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBytes = new TextEncoder().encode(metadataJson);

      // Upload to IPFS
      const cid = await this.ipfs!.addBytes(metadataBytes);
      const uri = `ipfs://${cid}`;
      
      const result: IPFSUploadResult = {
        cid: cid.toString(),
        uri,
        size: metadataBytes.length,
        uploadedAt: new Date().toISOString(),
      };

      if (this.debugMode) {
        console.log('[SBTMintingService] Metadata uploaded successfully:', result);
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] IPFS upload error:', error);
      }

      throw new SBTMintingServiceError(
        errorMessage,
        MoonbeamErrorCode.IPFS_ERROR,
        'uploadMetadataToIPFS',
        undefined,
        metadata,
        error
      );
    }
  }

  /**
   * Generate unique token ID
   */
  public async generateUniqueTokenId(contractAddress: SBTContractAddress): Promise<bigint> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTMintingServiceError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'generateUniqueTokenId'
        );
      }

      if (this.debugMode) {
        console.log('[SBTMintingService] Generating unique token ID for contract:', contractAddress);
      }

      const contract = new SBTContract(contractAddress, this.adapter);
      
      // Get current total supply and increment by 1
      const totalSupply = await contract.totalSupply();
      const tokenId = totalSupply + BigInt(1);

      if (this.debugMode) {
        console.log('[SBTMintingService] Generated token ID:', tokenId.toString());
      }

      return tokenId;
    } catch (error) {
      const errorMessage = `Failed to generate unique token ID: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] Token ID generation error:', error);
      }

      throw new SBTMintingServiceError(
        errorMessage,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'generateUniqueTokenId',
        undefined,
        { contractAddress },
        error
      );
    }
  }

  /**
   * Estimate gas for minting transaction
   */
  public async estimateMintingGas(
    contractAddress: SBTContractAddress,
    recipient: SBTContractAddress,
    tokenURI: string,
    signer: Signer
  ): Promise<SBTGasEstimation> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTMintingServiceError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'estimateMintingGas'
        );
      }

      if (this.debugMode) {
        console.log('[SBTMintingService] Estimating gas for minting transaction...');
      }

      const contract = new SBTContract(contractAddress, this.adapter, signer);
      
      // Get current gas price
      const gasPriceInfo = await this.adapter.getGasPrice();
      const gasPrice = BigInt(gasPriceInfo.gasPrice);

      // Estimate gas limit for minting
      const estimatedGasLimit = await contract.getContract().mint.estimateGas(recipient, tokenURI);
      
      // Add 20% buffer to gas limit
      const gasLimit = estimatedGasLimit + (estimatedGasLimit * BigInt(20)) / BigInt(100);

      // Calculate estimated cost
      const estimatedCost = gasLimit * gasPrice;
      const estimatedCostInETH = ethers.formatEther(estimatedCost);

      // EIP-1559 support
      let maxFeePerGas: bigint | undefined;
      let maxPriorityFeePerGas: bigint | undefined;

      if (gasPriceInfo.maxFeePerGas && gasPriceInfo.maxPriorityFeePerGas) {
        maxFeePerGas = BigInt(gasPriceInfo.maxFeePerGas);
        maxPriorityFeePerGas = BigInt(gasPriceInfo.maxPriorityFeePerGas);
      }

      const result: SBTGasEstimation = {
        gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimatedCost,
        estimatedCostInETH,
      };

      if (this.debugMode) {
        console.log('[SBTMintingService] Gas estimation completed:', result);
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to estimate gas for minting: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] Gas estimation error:', error);
      }

      throw new SBTMintingServiceError(
        errorMessage,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'estimateMintingGas',
        undefined,
        { contractAddress, recipient, tokenURI },
        error
      );
    }
  }

  /**
   * Mint SBT with metadata
   */
  public async mintSBT(
    contractAddress: SBTContractAddress,
    params: SBTMintParams,
    signer: Signer
  ): Promise<SBTMintingResult> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTMintingServiceError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'mintSBT'
        );
      }

      if (this.debugMode) {
        console.log('[SBTMintingService] Starting SBT minting process...');
      }

      let metadataUri = params.tokenURI;
      
      // Upload metadata to IPFS if metadata object is provided
      if (params.metadata && !params.tokenURI) {
        if (this.debugMode) {
          console.log('[SBTMintingService] Uploading metadata to IPFS...');
        }
        
        const ipfsResult = await this.uploadMetadataToIPFS(params.metadata);
        metadataUri = ipfsResult.uri;
        
        if (this.debugMode) {
          console.log('[SBTMintingService] Metadata uploaded to IPFS:', metadataUri);
        }
      }

      // Ensure metadataUri is defined
      if (!metadataUri) {
        throw new SBTMintingServiceError(
          'No metadata URI provided and no metadata object to upload',
          MoonbeamErrorCode.NETWORK_ERROR,
          'mintSBT'
        );
      }

      // Generate unique token ID
      const tokenId = await this.generateUniqueTokenId(contractAddress);

      if (this.debugMode) {
        console.log('[SBTMintingService] Generated token ID:', tokenId.toString());
      }

      // Estimate gas
      const gasEstimation = await this.estimateMintingGas(contractAddress, params.to, metadataUri, signer);

      if (this.debugMode) {
        console.log('[SBTMintingService] Gas estimation:', gasEstimation);
      }

      // Create contract instance
      const contract = new SBTContract(contractAddress, this.adapter, signer);

      // Execute minting transaction with retry logic
      const receipt = await this.executeMintingTransaction(
        contract,
        contractAddress,
        params.to,
        tokenId,
        metadataUri,
        gasEstimation,
        params.value
      );

      const result: SBTMintingResult = {
        tokenId: tokenId.toString(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        metadataUri,
        contractAddress,
        recipient: params.to,
        mintedAt: new Date().toISOString(),
      };

      if (this.debugMode) {
        console.log('[SBTMintingService] SBT minted successfully:', result);
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to mint SBT: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] SBT minting error:', error);
      }

      throw new SBTMintingServiceError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        'mintSBT',
        undefined,
        params,
        error
      );
    }
  }

  /**
   * Execute minting transaction with retry logic
   */
  private async executeMintingTransaction(
    contract: SBTContract,
    contractAddress: SBTContractAddress,
    recipient: SBTContractAddress,
    tokenId: bigint,
    tokenURI: string,
    gasEstimation: SBTGasEstimation,
    value?: bigint
  ): Promise<ContractTransactionReceipt> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (this.debugMode) {
          console.log(`[SBTMintingService] Minting attempt ${attempt}/${this.maxRetries}...`);
        }

        // Prepare transaction options
        const txOptions: any = {
          gasLimit: gasEstimation.gasLimit,
          value: value || BigInt(0),
        };

        // Add EIP-1559 support if available
        if (gasEstimation.maxFeePerGas && gasEstimation.maxPriorityFeePerGas) {
          txOptions.maxFeePerGas = gasEstimation.maxFeePerGas;
          txOptions.maxPriorityFeePerGas = gasEstimation.maxPriorityFeePerGas;
        } else {
          txOptions.gasPrice = gasEstimation.gasPrice;
        }

        // Execute minting
        const txResponse = await contract.mint(recipient, tokenURI);
        const receipt = await txResponse.wait();
        
        if (!receipt) {
          throw new Error('Transaction receipt is null');
        }

        if (this.debugMode) {
          console.log(`[SBTMintingService] Minting transaction successful on attempt ${attempt}`);
        }

        return receipt;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (this.debugMode) {
          console.warn(`[SBTMintingService] Minting attempt ${attempt} failed:`, lastError.message);
        }

        // Don't retry on certain types of errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          if (this.debugMode) {
            console.log(`[SBTMintingService] Waiting ${delay}ms before retry...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new SBTMintingServiceError(
      `Minting transaction failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      MoonbeamErrorCode.TRANSACTION_ERROR,
      'executeMintingTransaction',
      tokenId.toString(),
      { contractAddress, recipient, tokenURI, gasEstimation },
      lastError
    );
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'insufficient funds',
      'nonce too low',
      'invalid signature',
      'contract not deployed',
      'token already exists',
    ];

    const errorMessage = error.message.toLowerCase();
    return nonRetryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Wait for transaction confirmation
   */
  public async waitForTransactionConfirmation(
    transactionHash: string,
    confirmations: number = 1
  ): Promise<ContractTransactionReceipt | null> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTMintingServiceError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'waitForTransactionConfirmation'
        );
      }

      if (this.debugMode) {
        console.log(`[SBTMintingService] Waiting for transaction confirmation: ${transactionHash}`);
      }

      const receipt = await this.adapter.waitForTransaction(transactionHash, confirmations);

      if (this.debugMode && receipt) {
        console.log('[SBTMintingService] Transaction confirmed:', {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        });
      }

      return receipt;
    } catch (error) {
      const errorMessage = `Failed to wait for transaction confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] Transaction confirmation error:', error);
      }

      throw new SBTMintingServiceError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        'waitForTransactionConfirmation',
        undefined,
        { transactionHash, confirmations },
        error
      );
    }
  }

  /**
   * Get minting service status
   */
  public getStatus(): {
    connected: boolean;
    network: MoonbeamNetwork;
    ipfsInitialized: boolean;
    debugMode: boolean;
    maxRetries: number;
    retryDelay: number;
  } {
    return {
      connected: this.adapter.isConnected(),
      network: this.adapter.getCurrentNetwork(),
      ipfsInitialized: !!this.ipfs && !!this.unixfs,
      debugMode: this.debugMode,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    };
  }

  /**
   * Set debug mode
   */
  public setDebugMode(debug: boolean): void {
    this.debugMode = debug;
    if (this.debugMode) {
      console.log('[SBTMintingService] Debug mode enabled');
    }
  }

  /**
   * Set retry configuration
   */
  public setRetryConfig(maxRetries: number, retryDelay: number): void {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    
    if (this.debugMode) {
      console.log(`[SBTMintingService] Retry config updated: maxRetries=${maxRetries}, retryDelay=${retryDelay}ms`);
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.ipfs) {
        await this.ipfs.stop();
        this.ipfs = null;
        this.unixfs = null;
      }

      if (this.debugMode) {
        console.log('[SBTMintingService] Resources cleaned up successfully');
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('[SBTMintingService] Cleanup error:', error);
      }
    }
  }
}
