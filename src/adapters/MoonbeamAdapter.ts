/**
 * Moonbeam Adapter
 * 
 * This module provides blockchain connectivity for Moonbeam network using ethers.js.
 * It handles RPC connections, gas estimation, and network information retrieval.
 */

import { 
  ethers, 
  JsonRpcProvider, 
  Network, 
  TransactionResponse, 
  TransactionReceipt,
  Signer,
  Wallet,
  TransactionRequest,
  FeeData
} from 'ethers';
import { MoonbeamConfigManager, MoonbeamNetwork, MoonbeamErrorCode, MoonbeamErrorMessages } from '../config/moonbeamConfig';

/**
 * Moonbeam network information interface
 */
export interface MoonbeamNetworkInfo {
  /** Chain ID */
  chainId: number;
  /** Network name */
  name: string;
  /** Network type */
  network: MoonbeamNetwork;
  /** RPC URL */
  rpcUrl: string;
  /** Block explorer URL */
  explorerUrl: string;
  /** Native token symbol */
  nativeToken: string;
  /** Native token decimals */
  nativeTokenDecimals: number;
  /** Current block number */
  currentBlockNumber?: number;
  /** Latest block hash */
  latestBlockHash?: string;
  /** Gas price in wei */
  gasPrice?: string;
  /** Connection status */
  connected: boolean;
  /** Connection timestamp */
  connectedAt?: string;
}

/**
 * Gas price information interface
 */
export interface MoonbeamGasInfo {
  /** Current gas price in wei */
  gasPrice: string;
  /** Gas price in gwei */
  gasPriceGwei: string;
  /** Estimated gas limit for a simple transfer */
  estimatedGasLimit: string;
  /** Maximum gas limit */
  maxGasLimit: string;
  /** Priority fee in wei (EIP-1559) */
  maxPriorityFeePerGas?: string;
  /** Base fee in wei (EIP-1559) */
  maxFeePerGas?: string;
}

/**
 * Transaction request interface
 */
export interface MoonbeamTransactionRequest {
  /** Recipient address */
  to: string;
  /** Transaction value in wei */
  value?: bigint;
  /** Transaction data */
  data?: string;
  /** Gas limit */
  gasLimit?: bigint;
  /** Gas price (legacy) */
  gasPrice?: bigint;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas?: bigint;
  /** Max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: bigint;
  /** Nonce (optional, will be auto-managed) */
  nonce?: number;
  /** Chain ID */
  chainId?: number;
  /** From address (for estimation) */
  from?: string;
}

/**
 * Transaction status information
 */
export interface MoonbeamTransactionStatus {
  /** Transaction hash */
  hash: string;
  /** Transaction status: pending, confirmed, failed */
  status: 'pending' | 'confirmed' | 'failed';
  /** Block number (if mined) */
  blockNumber?: number;
  /** Block hash (if mined) */
  blockHash?: string;
  /** Confirmations count */
  confirmations: number;
  /** Gas used */
  gasUsed?: bigint;
  /** Effective gas price */
  effectiveGasPrice?: bigint;
  /** Transaction fee in wei */
  transactionFee?: bigint;
  /** Timestamp */
  timestamp?: number;
  /** Transaction receipt */
  receipt?: TransactionReceipt;
}

/**
 * Nonce management result
 */
export interface NonceInfo {
  /** Current nonce */
  nonce: number;
  /** Pending nonce (including pending transactions) */
  pendingNonce: number;
  /** Address */
  address: string;
}

/**
 * Custom error for Moonbeam adapter operations
 */
export class MoonbeamAdapterError extends Error {
  public readonly code: MoonbeamErrorCode;
  public readonly network?: MoonbeamNetwork;
  public readonly rpcUrl?: string;

  constructor(
    message: string,
    code: MoonbeamErrorCode,
    network?: MoonbeamNetwork,
    rpcUrl?: string
  ) {
    super(message);
    this.name = 'MoonbeamAdapterError';
    this.code = code;
    this.network = network;
    this.rpcUrl = rpcUrl;
  }
}

/**
 * Moonbeam Adapter class
 */
export class MoonbeamAdapter {
  private provider: JsonRpcProvider | null = null;
  private configManager: MoonbeamConfigManager;
  private currentNetwork: MoonbeamNetwork;
  private connected: boolean = false;
  private connectedAt: string | null = null;
  private retryAttempts: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  private debugMode: boolean = false;
  private nonceCache: Map<string, number> = new Map();
  private pendingTransactions: Map<string, Set<string>> = new Map();

  constructor(network: MoonbeamNetwork = MoonbeamNetwork.MOONBASE_ALPHA) {
    this.configManager = MoonbeamConfigManager.getInstance();
    this.currentNetwork = network;
    this.configManager.setCurrentNetwork(network);
  }

  /**
   * Connect to Moonbeam network
   */
  public async connect(): Promise<MoonbeamNetworkInfo> {
    try {
      const networkConfig = this.configManager.getCurrentNetworkConfig();
      
      if (this.debugMode) {
        console.log(`[MoonbeamAdapter] Connecting to ${networkConfig.name} at ${networkConfig.rpcUrl}`);
      }

      // Create JsonRpcProvider with simplified configuration
      this.provider = new JsonRpcProvider(networkConfig.rpcUrl);

      // Test connection with a simple call
      const network = await this.provider.getNetwork();
      
      // Verify chain ID matches
      if (Number(network.chainId) !== networkConfig.chainId) {
        throw new Error(`Chain ID mismatch: expected ${networkConfig.chainId}, got ${network.chainId}`);
      }
      
      // Get current block information
      const blockNumber = await this.provider.getBlockNumber();
      
      // Get gas price with error handling
      let gasPrice = BigInt(0);
      try {
        const feeData = await this.provider.getFeeData();
        gasPrice = feeData.gasPrice || BigInt(0);
      } catch (feeError) {
        if (this.debugMode) {
          console.warn('[MoonbeamAdapter] Failed to get fee data, using default gas price');
        }
        gasPrice = BigInt('1000000000'); // 1 gwei default
      }

      this.connected = true;
      this.connectedAt = new Date().toISOString();
      this.retryAttempts = 0;

      if (this.debugMode) {
        console.log(`[MoonbeamAdapter] Successfully connected to ${networkConfig.name}`);
        console.log(`[MoonbeamAdapter] Current block: ${blockNumber}, Gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
      }

      return {
        chainId: networkConfig.chainId,
        name: networkConfig.name,
        network: this.currentNetwork,
        rpcUrl: networkConfig.rpcUrl,
        explorerUrl: networkConfig.explorerUrl,
        nativeToken: networkConfig.nativeToken,
        nativeTokenDecimals: networkConfig.nativeTokenDecimals,
        currentBlockNumber: blockNumber,
        latestBlockHash: undefined, // Avoid potential parsing issues
        gasPrice: gasPrice.toString(),
        connected: true,
        connectedAt: this.connectedAt,
      };
    } catch (error) {
      this.connected = false;
      this.connectedAt = null;
      
      const networkConfig = this.configManager.getCurrentNetworkConfig();
      const errorMessage = `Failed to connect to Moonbeam ${networkConfig.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error(`[MoonbeamAdapter] Connection failed:`, error);
      }

      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork,
        networkConfig.rpcUrl
      );
    }
  }

  /**
   * Disconnect from Moonbeam network
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.provider) {
        // Remove all listeners
        this.provider.removeAllListeners();
        this.provider = null;
      }
      
      this.connected = false;
      this.connectedAt = null;
      
      if (this.debugMode) {
        console.log('[MoonbeamAdapter] Disconnected from Moonbeam network');
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('[MoonbeamAdapter] Error during disconnect:', error);
      }
      // Don't throw error during disconnect
    }
  }

  /**
   * Check if connected to network
   */
  public isConnected(): boolean {
    return this.connected && this.provider !== null;
  }

  /**
   * Get network information
   */
  public async getNetworkInfo(): Promise<MoonbeamNetworkInfo> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const networkConfig = this.configManager.getCurrentNetworkConfig();
      const network = await this.provider!.getNetwork();
      const blockNumber = await this.provider!.getBlockNumber();
      
      // Get gas price with error handling
      let gasPrice = BigInt(0);
      try {
        const feeData = await this.provider!.getFeeData();
        gasPrice = feeData.gasPrice || BigInt(0);
      } catch (feeError) {
        if (this.debugMode) {
          console.warn('[MoonbeamAdapter] Failed to get fee data in getNetworkInfo, using default');
        }
        gasPrice = BigInt('1000000000'); // 1 gwei default
      }

      return {
        chainId: Number(network.chainId),
        name: networkConfig.name,
        network: this.currentNetwork,
        rpcUrl: networkConfig.rpcUrl,
        explorerUrl: networkConfig.explorerUrl,
        nativeToken: networkConfig.nativeToken,
        nativeTokenDecimals: networkConfig.nativeTokenDecimals,
        currentBlockNumber: blockNumber,
        latestBlockHash: undefined, // Avoid potential parsing issues
        gasPrice: gasPrice.toString(),
        connected: true,
        connectedAt: this.connectedAt || undefined,
      };
    } catch (error) {
      const errorMessage = `Failed to get network info: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[MoonbeamAdapter] Network info error:', error);
      }

      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Get gas price information
   */
  public async getGasPrice(): Promise<MoonbeamGasInfo> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const networkConfig = this.configManager.getCurrentNetworkConfig();
      const transactionConfig = this.configManager.getTransactionConfig();
      
      // Get current gas price
      const feeData = await this.provider!.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      const gasPriceGwei = ethers.formatUnits(gasPrice, 'gwei');
      
      // Estimate gas for a simple transfer (21,000 gas)
      const estimatedGasLimit = '21000';
      
      // Calculate priority fee and max fee (for EIP-1559 support)
      let maxPriorityFeePerGas: string | undefined;
      let maxFeePerGas: string | undefined;
      
      try {
        const feeData = await this.provider!.getFeeData();
        if (feeData.maxPriorityFeePerGas) {
          maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
        }
        if (feeData.maxFeePerGas) {
          maxFeePerGas = feeData.maxFeePerGas.toString();
        }
      } catch (feeError) {
        // EIP-1559 not supported, use legacy gas price
        if (this.debugMode) {
          console.debug('[MoonbeamAdapter] EIP-1559 not supported, using legacy gas price');
        }
      }

      return {
        gasPrice: gasPrice.toString(),
        gasPriceGwei,
        estimatedGasLimit,
        maxGasLimit: networkConfig.maxGasLimit,
        maxPriorityFeePerGas,
        maxFeePerGas,
      };
    } catch (error) {
      const errorMessage = `Failed to get gas price: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[MoonbeamAdapter] Gas price error:', error);
      }

      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Get current block number
   */
  public async getCurrentBlockNumber(): Promise<number> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      return await this.provider!.getBlockNumber();
    } catch (error) {
      const errorMessage = `Failed to get current block number: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Get balance for an address
   */
  public async getBalance(address: string): Promise<string> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const balance = await this.provider!.getBalance(address);
      return balance.toString();
    } catch (error) {
      const errorMessage = `Failed to get balance for address ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Get transaction by hash
   */
  public async getTransaction(txHash: string): Promise<TransactionResponse | null> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      return await this.provider!.getTransaction(txHash);
    } catch (error) {
      const errorMessage = `Failed to get transaction ${txHash}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Wait for transaction confirmation
   */
  public async waitForTransaction(txHash: string, confirmations: number = 1): Promise<any> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      return await this.provider!.waitForTransaction(txHash, confirmations);
    } catch (error) {
      const errorMessage = `Failed to wait for transaction ${txHash}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Switch to different Moonbeam network
   */
  public async switchNetwork(network: MoonbeamNetwork): Promise<MoonbeamNetworkInfo> {
    try {
      // Disconnect from current network
      await this.disconnect();
      
      // Update current network
      this.currentNetwork = network;
      this.configManager.setCurrentNetwork(network);
      
      // Connect to new network
      return await this.connect();
    } catch (error) {
      const errorMessage = `Failed to switch to network ${network}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        network
      );
    }
  }

  /**
   * Get the underlying ethers provider
   */
  public getProvider(): JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Get current network
   */
  public getCurrentNetwork(): MoonbeamNetwork {
    return this.currentNetwork;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    connected: boolean;
    network: MoonbeamNetwork;
    connectedAt: string | null;
  } {
    return {
      connected: this.connected,
      network: this.currentNetwork,
      connectedAt: this.connectedAt,
    };
  }

  /**
   * Enable debug logging
   */
  public setDebug(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Get debug status
   */
  public get debug(): boolean {
    return this.debugMode;
  }

  // ============= Transaction Signing and Submission =============

  /**
   * Sign and send transaction
   */
  public async sendTransaction(
    signer: Signer,
    transaction: MoonbeamTransactionRequest
  ): Promise<TransactionResponse> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const signerAddress = await signer.getAddress();
      
      if (this.debugMode) {
        console.log(`[MoonbeamAdapter] Preparing transaction from ${signerAddress}`);
      }

      // Prepare transaction with nonce management
      const txRequest: TransactionRequest = {
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        chainId: transaction.chainId || (await this.provider!.getNetwork()).chainId,
      };

      // Handle nonce
      if (transaction.nonce !== undefined) {
        txRequest.nonce = transaction.nonce;
      } else {
        txRequest.nonce = await this.getNextNonce(signerAddress);
      }

      // Handle gas pricing (EIP-1559 vs legacy)
      if (transaction.maxFeePerGas && transaction.maxPriorityFeePerGas) {
        txRequest.maxFeePerGas = transaction.maxFeePerGas;
        txRequest.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
      } else if (transaction.gasPrice) {
        txRequest.gasPrice = transaction.gasPrice;
      } else {
        // Auto-estimate fees
        const feeData = await this.provider!.getFeeData();
        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
          txRequest.maxFeePerGas = feeData.maxFeePerGas;
          txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
        } else {
          txRequest.gasPrice = feeData.gasPrice || undefined;
        }
      }

      // Estimate gas if not provided
      if (!txRequest.gasLimit) {
        try {
          txRequest.gasLimit = await this.provider!.estimateGas(txRequest);
          // Add 20% buffer
          txRequest.gasLimit = (txRequest.gasLimit * BigInt(120)) / BigInt(100);
        } catch (error) {
          if (this.debugMode) {
            console.warn('[MoonbeamAdapter] Gas estimation failed, using default');
          }
          txRequest.gasLimit = BigInt(100000);
        }
      }

      if (this.debugMode) {
        console.log('[MoonbeamAdapter] Transaction request:', {
          to: txRequest.to,
          value: txRequest.value?.toString(),
          nonce: txRequest.nonce,
          gasLimit: txRequest.gasLimit?.toString(),
        });
      }

      // Send transaction
      const txResponse = await signer.sendTransaction(txRequest);

      // Track pending transaction
      this.trackPendingTransaction(signerAddress, txResponse.hash);

      if (this.debugMode) {
        console.log(`[MoonbeamAdapter] Transaction sent: ${txResponse.hash}`);
      }

      return txResponse;
    } catch (error) {
      const errorMessage = `Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[MoonbeamAdapter] Transaction error:', error);
      }

      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Sign transaction without sending
   */
  public async signTransaction(
    signer: Signer,
    transaction: MoonbeamTransactionRequest
  ): Promise<string> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const signerAddress = await signer.getAddress();
      
      const txRequest: TransactionRequest = {
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        chainId: transaction.chainId || (await this.provider!.getNetwork()).chainId,
        nonce: transaction.nonce ?? (await this.getNextNonce(signerAddress)),
      };

      // Handle gas pricing
      if (transaction.maxFeePerGas && transaction.maxPriorityFeePerGas) {
        txRequest.maxFeePerGas = transaction.maxFeePerGas;
        txRequest.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
      } else if (transaction.gasPrice) {
        txRequest.gasPrice = transaction.gasPrice;
      } else {
        const feeData = await this.provider!.getFeeData();
        if (feeData.maxFeePerGas) {
          txRequest.maxFeePerGas = feeData.maxFeePerGas;
          txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || undefined;
        } else {
          txRequest.gasPrice = feeData.gasPrice || undefined;
        }
      }

      const signedTx = await signer.signTransaction(txRequest);
      
      if (this.debugMode) {
        console.log('[MoonbeamAdapter] Transaction signed');
      }

      return signedTx;
    } catch (error) {
      const errorMessage = `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Broadcast signed transaction
   */
  public async broadcastTransaction(signedTx: string): Promise<TransactionResponse> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const txResponse = await this.provider!.broadcastTransaction(signedTx);
      
      if (this.debugMode) {
        console.log(`[MoonbeamAdapter] Transaction broadcasted: ${txResponse.hash}`);
      }

      return txResponse;
    } catch (error) {
      const errorMessage = `Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        this.currentNetwork
      );
    }
  }

  // ============= Nonce Management =============

  /**
   * Get nonce for address
   */
  public async getNonce(address: string, pending: boolean = false): Promise<number> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const blockTag = pending ? 'pending' : 'latest';
      const nonce = await this.provider!.getTransactionCount(address, blockTag);
      
      if (this.debugMode) {
        console.log(`[MoonbeamAdapter] Nonce for ${address} (${blockTag}): ${nonce}`);
      }

      return nonce;
    } catch (error) {
      const errorMessage = `Failed to get nonce for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Get next available nonce (with pending transaction awareness)
   */
  public async getNextNonce(address: string): Promise<number> {
    try {
      // Get pending nonce from network
      const pendingNonce = await this.getNonce(address, true);
      
      // Check cached nonce
      const cachedNonce = this.nonceCache.get(address.toLowerCase());
      
      // Use the higher of the two
      const nextNonce = cachedNonce !== undefined ? Math.max(cachedNonce, pendingNonce) : pendingNonce;
      
      // Update cache
      this.nonceCache.set(address.toLowerCase(), nextNonce + 1);
      
      if (this.debugMode) {
        console.log(`[MoonbeamAdapter] Next nonce for ${address}: ${nextNonce} (cached: ${cachedNonce}, pending: ${pendingNonce})`);
      }

      return nextNonce;
    } catch (error) {
      const errorMessage = `Failed to get next nonce: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Get nonce information for address
   */
  public async getNonceInfo(address: string): Promise<NonceInfo> {
    try {
      const [nonce, pendingNonce] = await Promise.all([
        this.getNonce(address, false),
        this.getNonce(address, true),
      ]);

      return {
        nonce,
        pendingNonce,
        address,
      };
    } catch (error) {
      const errorMessage = `Failed to get nonce info: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Reset nonce cache for address
   */
  public resetNonce(address: string): void {
    this.nonceCache.delete(address.toLowerCase());
    
    if (this.debugMode) {
      console.log(`[MoonbeamAdapter] Nonce cache reset for ${address}`);
    }
  }

  /**
   * Clear all nonce caches
   */
  public clearNonceCache(): void {
    this.nonceCache.clear();
    
    if (this.debugMode) {
      console.log('[MoonbeamAdapter] All nonce caches cleared');
    }
  }

  // ============= Transaction Status Monitoring =============

  /**
   * Get transaction status
   */
  public async getTransactionStatus(txHash: string): Promise<MoonbeamTransactionStatus> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const tx = await this.provider!.getTransaction(txHash);
      
      if (!tx) {
        return {
          hash: txHash,
          status: 'pending',
          confirmations: 0,
        };
      }

      const receipt = await this.provider!.getTransactionReceipt(txHash);
      const currentBlock = await this.provider!.getBlockNumber();

      if (!receipt) {
        return {
          hash: txHash,
          status: 'pending',
          confirmations: 0,
        };
      }

      const confirmations = currentBlock - receipt.blockNumber + 1;
      const status = receipt.status === 1 ? 'confirmed' : 'failed';
      
      // Get block timestamp
      let timestamp: number | undefined;
      try {
        const block = await this.provider!.getBlock(receipt.blockNumber);
        timestamp = block?.timestamp;
      } catch {
        // Continue without timestamp
      }

      const transactionFee = receipt.gasUsed * (receipt.gasPrice || BigInt(0));

      return {
        hash: txHash,
        status,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        confirmations,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.gasPrice,
        transactionFee,
        timestamp,
        receipt,
      };
    } catch (error) {
      const errorMessage = `Failed to get transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Monitor transaction with progress callback
   */
  public async monitorTransaction(
    txHash: string,
    requiredConfirmations: number = 3,
    onProgress?: (confirmations: number, required: number) => void
  ): Promise<MoonbeamTransactionStatus> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      if (this.debugMode) {
        console.log(`[MoonbeamAdapter] Monitoring transaction ${txHash} for ${requiredConfirmations} confirmations`);
      }

      let currentConfirmations = 0;

      while (currentConfirmations < requiredConfirmations) {
        const status = await this.getTransactionStatus(txHash);

        if (status.status === 'failed') {
          throw new Error('Transaction failed');
        }

        currentConfirmations = status.confirmations;

        if (onProgress) {
          onProgress(currentConfirmations, requiredConfirmations);
        }

        if (currentConfirmations >= requiredConfirmations) {
          if (this.debugMode) {
            console.log(`[MoonbeamAdapter] Transaction ${txHash} confirmed with ${currentConfirmations} confirmations`);
          }
          return status;
        }

        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return await this.getTransactionStatus(txHash);
    } catch (error) {
      const errorMessage = `Failed to monitor transaction: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        this.currentNetwork
      );
    }
  }

  /**
   * Wait for transaction with detailed status
   */
  public async waitForTransactionWithStatus(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 300000
  ): Promise<MoonbeamTransactionStatus> {
    if (!this.isConnected()) {
      throw new MoonbeamAdapterError(
        'Not connected to Moonbeam network',
        MoonbeamErrorCode.NETWORK_ERROR,
        this.currentNetwork
      );
    }

    try {
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const status = await this.getTransactionStatus(txHash);

        if (status.status === 'failed') {
          throw new Error('Transaction failed');
        }

        if (status.status === 'confirmed' && status.confirmations >= confirmations) {
          return status;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
    } catch (error) {
      const errorMessage = `Failed to wait for transaction: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      throw new MoonbeamAdapterError(
        errorMessage,
        MoonbeamErrorCode.TRANSACTION_ERROR,
        this.currentNetwork
      );
    }
  }

  // ============= Transaction Tracking =============

  /**
   * Track pending transaction
   */
  private trackPendingTransaction(address: string, txHash: string): void {
    const addressLower = address.toLowerCase();
    
    if (!this.pendingTransactions.has(addressLower)) {
      this.pendingTransactions.set(addressLower, new Set());
    }
    
    this.pendingTransactions.get(addressLower)!.add(txHash);
    
    if (this.debugMode) {
      console.log(`[MoonbeamAdapter] Tracking pending transaction ${txHash} for ${address}`);
    }
  }

  /**
   * Remove pending transaction
   */
  private removePendingTransaction(address: string, txHash: string): void {
    const addressLower = address.toLowerCase();
    this.pendingTransactions.get(addressLower)?.delete(txHash);
    
    if (this.debugMode) {
      console.log(`[MoonbeamAdapter] Removed pending transaction ${txHash} for ${address}`);
    }
  }

  /**
   * Get pending transactions for address
   */
  public getPendingTransactions(address: string): string[] {
    const addressLower = address.toLowerCase();
    return Array.from(this.pendingTransactions.get(addressLower) || []);
  }

  /**
   * Clear pending transactions for address
   */
  public clearPendingTransactions(address: string): void {
    const addressLower = address.toLowerCase();
    this.pendingTransactions.delete(addressLower);
    
    if (this.debugMode) {
      console.log(`[MoonbeamAdapter] Cleared pending transactions for ${address}`);
    }
  }

  // ============= Chain Information =============

  /**
   * Get chain information
   */
  public getChainInfo(): MoonbeamNetworkInfo | null {
    if (!this.isConnected()) {
      return null;
    }

    const networkConfig = this.configManager.getCurrentNetworkConfig();
    
    return {
      chainId: networkConfig.chainId,
      name: networkConfig.name,
      network: this.currentNetwork,
      rpcUrl: networkConfig.rpcUrl,
      explorerUrl: networkConfig.explorerUrl,
      nativeToken: networkConfig.nativeToken,
      nativeTokenDecimals: networkConfig.nativeTokenDecimals,
      connected: this.connected,
      connectedAt: this.connectedAt || undefined,
    };
  }
}

export { MoonbeamAdapter as default };
