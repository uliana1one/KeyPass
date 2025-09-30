/**
 * Moonbeam Adapter
 * 
 * This module provides blockchain connectivity for Moonbeam network using ethers.js.
 * It handles RPC connections, gas estimation, and network information retrieval.
 */

import { ethers, JsonRpcProvider, Network, TransactionResponse } from 'ethers';
import { MoonbeamConfigManager, MoonbeamNetwork, MoonbeamErrorCode, MoonbeamErrorMessages } from '../config/moonbeamConfig.js';

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

      // Create JsonRpcProvider with retry logic
      this.provider = new JsonRpcProvider(
        networkConfig.rpcUrl,
        {
          name: networkConfig.name,
          chainId: networkConfig.chainId,
        },
        {
          staticNetwork: true,
          polling: true,
          pollingInterval: 4000,
        }
      );

      // Test connection with a simple call
      await this.provider.getNetwork();
      
      // Get current block information
      const blockNumber = await this.provider.getBlockNumber();
      const block = await this.provider.getBlock(blockNumber);
      
      // Get gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);

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
        latestBlockHash: block?.hash || undefined,
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
      const block = await this.provider!.getBlock(blockNumber);
      const feeData = await this.provider!.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);

      return {
        chainId: Number(network.chainId),
        name: networkConfig.name,
        network: this.currentNetwork,
        rpcUrl: networkConfig.rpcUrl,
        explorerUrl: networkConfig.explorerUrl,
        nativeToken: networkConfig.nativeToken,
        nativeTokenDecimals: networkConfig.nativeTokenDecimals,
        currentBlockNumber: blockNumber,
        latestBlockHash: block?.hash || undefined,
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
}

export { MoonbeamAdapter as default };
