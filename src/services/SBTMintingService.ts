/**
 * SBT Minting Service
 * 
 * Service for minting Soulbound Tokens (SBTs) with metadata upload to IPFS,
 * unique token ID generation, gas estimation, transaction confirmation,
 * and real contract deployment integration.
 */

import { ethers, Signer, ContractTransactionReceipt, ContractTransactionResponse } from 'ethers';
import { createHelia } from 'helia';
import { UnixFS } from 'ipfs-unixfs';
import { SBTContract } from '../contracts/SBTContract.js';
import { SBTContractFactory } from '../contracts/SBTContractFactory.js';
import { MoonbeamAdapter } from '../adapters/MoonbeamAdapter.js';
import { MoonbeamNetwork, MoonbeamErrorCode } from '../config/moonbeamConfig.js';
import { WalletError } from '../errors/WalletErrors.js';
import { 
  SBTMintParams, 
  SBTTokenMetadata, 
  SBTTokenAttribute,
  SBTContractAddress,
  SBTContractErrorType,
  SBTContractDeploymentConfig,
  SBTContractDeploymentResult
} from '../contracts/types/SBTContractTypes.js';
import { 
  getNetworkConfig, 
  getContractBytecode, 
  getGasEstimate,
  validateNetwork,
  isTestnet,
  getExplorerUrl,
  ArtifactUtils
} from '../contracts/artifacts/index.js';

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
 * Interface for deployment configuration
 */
export interface DeploymentConfig {
  network: string;
  contractName: string;
  constructorArgs: {
    name: string;
    symbol: string;
    baseURI: string;
  };
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  enableVerification: boolean;
  verificationApiKey?: string;
}

/**
 * Interface for contract connection result
 */
export interface ContractConnectionResult {
  success: boolean;
  contractAddress?: SBTContractAddress;
  contract?: SBTContract;
  error?: string;
  network: string;
  connectedAt: string;
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
  private contractFactory: SBTContractFactory | null = null;
  private deployedContracts: Map<string, SBTContractAddress> = new Map();
  private connectionTimeout: number;
  private confirmationTimeout: number;

  constructor(adapter: MoonbeamAdapter, debugMode: boolean = false) {
    this.adapter = adapter;
    this.debugMode = debugMode;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.connectionTimeout = 30000; // 30 seconds
    this.confirmationTimeout = 300000; // 5 minutes
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
   * Initialize contract factory
   */
  private async initializeContractFactory(): Promise<void> {
    try {
      if (!this.contractFactory) {
        if (this.debugMode) {
          console.log('[SBTMintingService] Initializing contract factory...');
        }

        this.contractFactory = new SBTContractFactory(this.adapter, {
          enableVerification: true,
          debugMode: this.debugMode,
        });

        if (this.debugMode) {
          console.log('[SBTMintingService] Contract factory initialized successfully');
        }
      }
    } catch (error) {
      const errorMessage = `Failed to initialize contract factory: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] Contract factory initialization error:', error);
      }

      throw new SBTMintingServiceError(
        errorMessage,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'initializeContractFactory',
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Deploy SBT contract
   */
  public async deployContract(
    config: DeploymentConfig,
    signer: Signer
  ): Promise<SBTContractDeploymentResult> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTMintingServiceError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'deployContract'
        );
      }

      if (!validateNetwork(config.network)) {
        throw new SBTMintingServiceError(
          `Unsupported network: ${config.network}`,
          MoonbeamErrorCode.NETWORK_ERROR,
          'deployContract'
        );
      }

      if (this.debugMode) {
        console.log('[SBTMintingService] Starting contract deployment...');
        console.log('[SBTMintingService] Deployment config:', config);
      }

      // Initialize contract factory if needed
      await this.initializeContractFactory();

      // Prepare deployment configuration
      const deploymentConfig: SBTContractDeploymentConfig = {
        name: config.constructorArgs.name,
        symbol: config.constructorArgs.symbol,
        baseURI: config.constructorArgs.baseURI,
        owner: await signer.getAddress() as `0x${string}`,
        gasLimit: config.gasLimit,
        gasPrice: config.gasPrice,
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
      };

      // Deploy contract
      const result = await this.contractFactory!.deployContract(deploymentConfig, signer);

      // Store deployed contract address
      const networkKey = `${config.network}-${config.contractName}`;
      this.deployedContracts.set(networkKey, result.contractAddress);

      if (this.debugMode) {
        console.log('[SBTMintingService] Contract deployed successfully:', result);
        console.log(`[SBTMintingService] Explorer: ${getExplorerUrl(config.network, result.contractAddress)}`);
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to deploy contract: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] Contract deployment error:', error);
      }

      throw new SBTMintingServiceError(
        errorMessage,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'deployContract',
        undefined,
        config,
        error
      );
    }
  }

  /**
   * Connect to deployed SBT contract
   */
  public async connectToContract(
    contractAddress: SBTContractAddress,
    signer?: Signer
  ): Promise<ContractConnectionResult> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTMintingServiceError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'connectToContract'
        );
      }

      if (this.debugMode) {
        console.log('[SBTMintingService] Connecting to contract:', contractAddress);
      }

      // Validate contract address
      if (!ethers.isAddress(contractAddress)) {
        throw new SBTMintingServiceError(
          `Invalid contract address: ${contractAddress}`,
          MoonbeamErrorCode.CONTRACT_ERROR,
          'connectToContract'
        );
      }

      // Check if contract is deployed
      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new SBTMintingServiceError(
          'Provider not available',
          MoonbeamErrorCode.NETWORK_ERROR,
          'connectToContract'
        );
      }

      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        throw new SBTMintingServiceError(
          `No contract found at address: ${contractAddress}`,
          MoonbeamErrorCode.CONTRACT_ERROR,
          'connectToContract'
        );
      }

      // Create contract instance
      const contract = new SBTContract(contractAddress, this.adapter, signer);

      // Test connection by calling a view function
      try {
        await contract.name();
        if (this.debugMode) {
          console.log('[SBTMintingService] Contract connection test successful');
        }
      } catch (error) {
        throw new SBTMintingServiceError(
          `Contract connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          MoonbeamErrorCode.CONTRACT_ERROR,
          'connectToContract'
        );
      }

      const result: ContractConnectionResult = {
        success: true,
        contractAddress,
        contract,
        network: this.adapter.getCurrentNetwork(),
        connectedAt: new Date().toISOString(),
      };

      if (this.debugMode) {
        console.log('[SBTMintingService] Contract connected successfully:', result);
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to connect to contract: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTMintingService] Contract connection error:', error);
      }

      return {
        success: false,
        error: errorMessage,
        network: this.adapter.getCurrentNetwork(),
        connectedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get deployed contract address for network
   */
  public getDeployedContractAddress(network: string, contractName: string = 'SBTSimple'): SBTContractAddress | undefined {
    const networkKey = `${network}-${contractName}`;
    return this.deployedContracts.get(networkKey);
  }

  /**
   * Set deployed contract address
   */
  public setDeployedContractAddress(
    network: string, 
    contractAddress: SBTContractAddress, 
    contractName: string = 'SBTSimple'
  ): void {
    const networkKey = `${network}-${contractName}`;
    this.deployedContracts.set(networkKey, contractAddress);
    
    if (this.debugMode) {
      console.log(`[SBTMintingService] Set deployed contract address: ${networkKey} -> ${contractAddress}`);
    }
  }

  /**
   * Get all deployed contract addresses
   */
  public getDeployedContracts(): Map<string, SBTContractAddress> {
    return new Map(this.deployedContracts);
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
   * Execute minting transaction with retry logic and proper gas management
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

        // Prepare transaction options with dynamic gas management
        const txOptions = await this.prepareTransactionOptions(gasEstimation, value);

        if (this.debugMode) {
          console.log('[SBTMintingService] Transaction options:', txOptions);
        }

        // Execute minting transaction
        const txResponse = await contract.mint(recipient, tokenURI);
        
        if (this.debugMode) {
          console.log('[SBTMintingService] Transaction submitted:', txResponse.hash);
        }

        // Wait for transaction confirmation with timeout
        const receipt = await this.waitForTransactionWithTimeout(txResponse);
        
        if (!receipt) {
          throw new Error('Transaction receipt is null');
        }

        if (receipt.status === 0) {
          throw new Error('Transaction failed');
        }

        if (this.debugMode) {
          console.log(`[SBTMintingService] Minting transaction successful on attempt ${attempt}`);
          console.log('[SBTMintingService] Transaction receipt:', {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            effectiveGasPrice: receipt.gasPrice?.toString(),
          });
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
   * Prepare transaction options with dynamic gas management
   */
  private async prepareTransactionOptions(
    gasEstimation: SBTGasEstimation,
    value?: bigint
  ): Promise<any> {
    try {
      const txOptions: any = {
        gasLimit: gasEstimation.gasLimit,
        value: value || BigInt(0),
      };

      // Get current gas price for dynamic adjustment
      const gasPriceInfo = await this.adapter.getGasPrice();
      const currentGasPrice = BigInt(gasPriceInfo.gasPrice);

      // Add EIP-1559 support if available
      if (gasEstimation.maxFeePerGas && gasEstimation.maxPriorityFeePerGas) {
        // Use current gas prices for EIP-1559
        txOptions.maxFeePerGas = BigInt(gasPriceInfo.maxFeePerGas || gasPriceInfo.gasPrice);
        txOptions.maxPriorityFeePerGas = BigInt(gasPriceInfo.maxPriorityFeePerGas || '1000000000');
      } else {
        // Use current gas price with small buffer
        txOptions.gasPrice = currentGasPrice + (currentGasPrice * BigInt(10)) / BigInt(100); // 10% buffer
      }

      // Adjust gas limit based on network conditions
      const networkConfig = getNetworkConfig(this.adapter.getCurrentNetwork());
      if (networkConfig) {
        const maxGasLimit = BigInt(networkConfig.deployment.gasLimit);
        if (txOptions.gasLimit > maxGasLimit) {
          txOptions.gasLimit = maxGasLimit;
          if (this.debugMode) {
            console.log('[SBTMintingService] Gas limit adjusted to network maximum');
          }
        }
      }

      return txOptions;
    } catch (error) {
      if (this.debugMode) {
        console.warn('[SBTMintingService] Failed to get current gas price, using estimation:', error);
      }
      
      // Fallback to estimation values
      const txOptions: any = {
        gasLimit: gasEstimation.gasLimit,
        value: value || BigInt(0),
      };

      if (gasEstimation.maxFeePerGas && gasEstimation.maxPriorityFeePerGas) {
        txOptions.maxFeePerGas = gasEstimation.maxFeePerGas;
        txOptions.maxPriorityFeePerGas = gasEstimation.maxPriorityFeePerGas;
      } else {
        txOptions.gasPrice = gasEstimation.gasPrice;
      }

      return txOptions;
    }
  }

  /**
   * Wait for transaction with timeout
   */
  private async waitForTransactionWithTimeout(
    txResponse: ContractTransactionResponse
  ): Promise<ContractTransactionReceipt | null> {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Transaction timeout after ${this.confirmationTimeout}ms`));
        }, this.confirmationTimeout);
      });

      // Race between transaction confirmation and timeout
      const receipt = await Promise.race([
        txResponse.wait(),
        timeoutPromise
      ]);

      return receipt;
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        if (this.debugMode) {
          console.warn('[SBTMintingService] Transaction confirmation timeout, but transaction may still be pending');
        }
        throw error;
      }
      throw error;
    }
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
      'execution reverted',
      'gas required exceeds allowance',
      'transaction underpriced',
      'replacement transaction underpriced',
      'already known',
      'invalid transaction',
      'transaction timeout',
    ];

    const errorMessage = error.message.toLowerCase();
    return nonRetryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Handle contract deployment failures
   */
  public async handleDeploymentFailure(
    error: Error,
    config: DeploymentConfig,
    signer: Signer
  ): Promise<{
    canRetry: boolean;
    retryConfig?: DeploymentConfig;
    error: string;
    suggestions: string[];
  }> {
    const errorMessage = error.message.toLowerCase();
    const suggestions: string[] = [];
    let canRetry = false;
    let retryConfig: DeploymentConfig | undefined;

    if (errorMessage.includes('insufficient funds')) {
      suggestions.push('Check wallet balance and ensure sufficient funds for deployment');
      suggestions.push('Consider reducing gas limit or gas price');
    } else if (errorMessage.includes('gas required exceeds allowance')) {
      suggestions.push('Increase gas limit for deployment');
      suggestions.push('Check network congestion and adjust gas settings');
      canRetry = true;
      retryConfig = {
        ...config,
        gasLimit: (config.gasLimit || BigInt('3000000')) + BigInt('500000'), // Add 500k gas
      };
    } else if (errorMessage.includes('contract creation failed')) {
      suggestions.push('Verify contract bytecode and constructor parameters');
      suggestions.push('Check if contract is already deployed at the address');
    } else if (errorMessage.includes('network error') || errorMessage.includes('timeout')) {
      suggestions.push('Check network connectivity and try again');
      suggestions.push('Consider using a different RPC endpoint');
      canRetry = true;
      retryConfig = config;
    } else if (errorMessage.includes('nonce')) {
      suggestions.push('Wait for pending transactions to confirm');
      suggestions.push('Reset wallet nonce if necessary');
      canRetry = true;
      retryConfig = config;
    } else {
      suggestions.push('Check contract source code for compilation errors');
      suggestions.push('Verify network compatibility and configuration');
      suggestions.push('Review error logs for more details');
      canRetry = true;
      retryConfig = config;
    }

    return {
      canRetry,
      retryConfig,
      error: error.message,
      suggestions,
    };
  }

  /**
   * Validate deployment configuration
   */
  public validateDeploymentConfig(config: DeploymentConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate network
    if (!validateNetwork(config.network)) {
      errors.push(`Unsupported network: ${config.network}`);
    }

    // Validate contract name
    if (!config.contractName || config.contractName.trim() === '') {
      errors.push('Contract name is required');
    }

    // Validate constructor arguments
    if (!config.constructorArgs.name || config.constructorArgs.name.trim() === '') {
      errors.push('Contract name in constructor args is required');
    }

    if (!config.constructorArgs.symbol || config.constructorArgs.symbol.trim() === '') {
      errors.push('Contract symbol in constructor args is required');
    }

    if (!config.constructorArgs.baseURI || config.constructorArgs.baseURI.trim() === '') {
      warnings.push('Base URI is empty, tokens will use default metadata');
    }

    // Validate gas settings
    if (config.gasLimit && config.gasLimit < BigInt('100000')) {
      warnings.push('Gas limit seems too low for contract deployment');
    }

    if (config.gasPrice && config.gasPrice < BigInt('1000000000')) {
      warnings.push('Gas price seems too low, transaction may fail');
    }

    // Validate network-specific settings
    if (config.network && !isTestnet(config.network)) {
      warnings.push('Deploying to mainnet, ensure you have tested on testnet first');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get deployment status for a contract
   */
  public async getDeploymentStatus(
    contractAddress: SBTContractAddress
  ): Promise<{
    deployed: boolean;
    verified: boolean;
    blockNumber?: number;
    transactionHash?: string;
    gasUsed?: bigint;
    deploymentCost?: bigint;
  }> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTMintingServiceError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'getDeploymentStatus'
        );
      }

      const provider = this.adapter.getProvider();
      if (!provider) {
        throw new SBTMintingServiceError(
          'Provider not available',
          MoonbeamErrorCode.NETWORK_ERROR,
          'getDeploymentStatus'
        );
      }

      // Check if contract is deployed
      const code = await provider.getCode(contractAddress);
      const deployed = code !== '0x';

      if (!deployed) {
        return {
          deployed: false,
          verified: false,
        };
      }

      // Get contract creation transaction
      const contract = new SBTContract(contractAddress, this.adapter);
      
      try {
        // Try to get contract info
        await contract.name();
        
        return {
          deployed: true,
          verified: false, // Would need to check explorer API for verification status
        };
      } catch (error) {
        return {
          deployed: true,
          verified: false,
        };
      }
    } catch (error) {
      throw new SBTMintingServiceError(
        `Failed to get deployment status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'getDeploymentStatus',
        undefined,
        { contractAddress },
        error
      );
    }
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
    contractFactoryInitialized: boolean;
    deployedContracts: number;
    debugMode: boolean;
    maxRetries: number;
    retryDelay: number;
    connectionTimeout: number;
    confirmationTimeout: number;
  } {
    return {
      connected: this.adapter.isConnected(),
      network: this.adapter.getCurrentNetwork(),
      ipfsInitialized: !!this.ipfs && !!this.unixfs,
      contractFactoryInitialized: !!this.contractFactory,
      deployedContracts: this.deployedContracts.size,
      debugMode: this.debugMode,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      connectionTimeout: this.connectionTimeout,
      confirmationTimeout: this.confirmationTimeout,
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
   * Set timeout configurations
   */
  public setTimeoutConfig(connectionTimeout: number, confirmationTimeout: number): void {
    this.connectionTimeout = connectionTimeout;
    this.confirmationTimeout = confirmationTimeout;
    
    if (this.debugMode) {
      console.log(`[SBTMintingService] Timeout config updated: connection=${connectionTimeout}ms, confirmation=${confirmationTimeout}ms`);
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

      // Clear deployed contracts map
      this.deployedContracts.clear();
      this.contractFactory = null;

      if (this.debugMode) {
        console.log('[SBTMintingService] Resources cleaned up successfully');
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('[SBTMintingService] Cleanup error:', error);
      }
    }
  }

  /**
   * Batch mint multiple tokens
   */
  public async batchMintSBT(
    contractAddress: SBTContractAddress,
    recipient: SBTContractAddress,
    metadataList: SBTTokenMetadata[],
    signer: Signer
  ): Promise<{
    success: boolean;
    results: SBTMintingResult[];
    errors: string[];
  }> {
    const results: SBTMintingResult[] = [];
    const errors: string[] = [];

    if (this.debugMode) {
      console.log(`[SBTMintingService] Starting batch mint of ${metadataList.length} tokens...`);
    }

    for (let i = 0; i < metadataList.length; i++) {
      try {
        const metadata = metadataList[i];
        
        if (this.debugMode) {
          console.log(`[SBTMintingService] Minting token ${i + 1}/${metadataList.length}: ${metadata.name}`);
        }

        const result = await this.mintSBT(contractAddress, {
          to: recipient,
          metadata,
        }, signer);

        results.push(result);
      } catch (error) {
        const errorMessage = `Failed to mint token ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        
        if (this.debugMode) {
          console.error(`[SBTMintingService] Batch mint error for token ${i + 1}:`, error);
        }
      }
    }

    const success = errors.length === 0;

    if (this.debugMode) {
      console.log(`[SBTMintingService] Batch mint completed: ${results.length} successful, ${errors.length} failed`);
    }

    return {
      success,
      results,
      errors,
    };
  }

  /**
   * Get gas price information for current network
   */
  public async getGasPriceInfo(): Promise<{
    gasPrice: string;
    gasPriceGwei: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    estimatedGasLimit: string;
  }> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTMintingServiceError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'getGasPriceInfo'
        );
      }

      const gasPriceInfo = await this.adapter.getGasPrice();
      
      if (this.debugMode) {
        console.log('[SBTMintingService] Gas price info:', gasPriceInfo);
      }

      return gasPriceInfo;
    } catch (error) {
      throw new SBTMintingServiceError(
        `Failed to get gas price info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        MoonbeamErrorCode.NETWORK_ERROR,
        'getGasPriceInfo',
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Check if contract is deployed and accessible
   */
  public async isContractDeployed(contractAddress: SBTContractAddress): Promise<boolean> {
    try {
      if (!this.adapter.isConnected()) {
        return false;
      }

      const provider = this.adapter.getProvider();
      if (!provider) {
        return false;
      }

      const code = await provider.getCode(contractAddress);
      return code !== '0x';
    } catch (error) {
      if (this.debugMode) {
        console.error('[SBTMintingService] Error checking contract deployment:', error);
      }
      return false;
    }
  }

  /**
   * Get contract information
   */
  public async getContractInfo(contractAddress: SBTContractAddress): Promise<{
    name: string;
    symbol: string;
    totalSupply: bigint;
  } | null> {
    try {
      if (!await this.isContractDeployed(contractAddress)) {
        return null;
      }

      const contract = new SBTContract(contractAddress, this.adapter);
      
      const [name, symbol, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
      ]);

      return {
        name,
        symbol,
        totalSupply,
      };
    } catch (error) {
      if (this.debugMode) {
        console.error('[SBTMintingService] Error getting contract info:', error);
      }
      return null;
    }
  }
}
