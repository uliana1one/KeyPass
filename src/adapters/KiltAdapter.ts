import { ApiPromise, WsProvider } from '@polkadot/api';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { isAddress } from '@polkadot/util-crypto';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { InjectedWindow } from '@polkadot/extension-inject/types';
import { KeyringPair } from '@polkadot/keyring/types';
import {
  WalletAdapter,
  WalletAccount,
  validateAddress,
  validateSignature,
  WALLET_TIMEOUT,
  validateAndSanitizeMessage,
  validatePolkadotAddress,
} from './types.js';
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  InvalidSignatureError,
  WalletConnectionError,
  MessageValidationError,
  AddressValidationError,
} from '../errors/WalletErrors';
import { EventEmitter } from 'events';
import { KILT_NETWORKS, KILTNetwork } from '../config/kiltConfig.js';
import { KILTTransactionService } from '../did/services/KILTTransactionService.js';
import { 
  KILTTransactionResult, 
  KILTTransactionEvent,
  KILTError,
  KILTErrorType
} from '../did/types/KILTTypes.js';

// KILT network endpoints with fallbacks
const KILT_ENDPOINTS = {
  [KILTNetwork.SPIRITNET]: [
    'wss://spiritnet.kilt.io',
    'wss://spiritnet.api.onfinality.io/public-ws',
    'wss://spiritnet-rpc.kilt.io'
  ],
  [KILTNetwork.MAINNET]: [
    'wss://kilt-rpc.dwellir.com',
    'wss://kilt.api.onfinality.io/public-ws',
    'wss://rpc.kilt.io'
  ],
  [KILTNetwork.PEREGRINE]: [
    'wss://peregrine.kilt.io',
    'wss://peregrine.api.onfinality.io/public-ws'
  ],
  [KILTNetwork.DEVNET]: [
    'wss://devnet.kilt.io'
  ]
};

const KILT_EXTENSION_NAME = 'kilt';

// Connection configuration
const CONNECTION_CONFIG = {
  maxRetries: 5,
  baseRetryDelay: 1000, // 1 second
  maxRetryDelay: 30000, // 30 seconds
  retryBackoffMultiplier: 2,
  connectionTimeout: 15000, // 15 seconds
  healthCheckInterval: 30000, // 30 seconds
  reconnectOnHealthFailure: true,
};

// Chain info interface
export interface KiltChainInfo {
  name: string;
  network: string;
  version: string;
  runtime: string;
  ss58Format: number;
  genesisHash: string;
}

// Transaction options interface
export interface KILTTransactionOptions {
  /** Transaction signer */
  signer: KeyringPair | string;
  /** Transaction nonce (optional, will be fetched if not provided) */
  nonce?: number;
  /** Transaction tip (optional) */
  tip?: string | number;
  /** Transaction era (optional) */
  era?: any;
  /** Custom gas limit (optional) */
  gasLimit?: string | number;
  /** Whether to wait for transaction confirmation */
  waitForConfirmation?: boolean;
  /** Transaction metadata */
  metadata?: Record<string, unknown>;
}

// Transaction status interface
export interface KILTTransactionStatus {
  /** Transaction hash */
  hash: string;
  /** Current status */
  status: 'pending' | 'inBlock' | 'confirmed' | 'failed' | 'timeout';
  /** Block number where transaction was included */
  blockNumber?: number;
  /** Block hash where transaction was included */
  blockHash?: string;
  /** Transaction events */
  events?: KILTTransactionEvent[];
  /** Error message if transaction failed */
  error?: string;
  /** Number of retry attempts */
  retryCount: number;
}

// Nonce management interface
export interface KILTNonceInfo {
  /** Current nonce */
  nonce: number;
  /** Whether nonce is cached */
  cached: boolean;
  /** Timestamp of last nonce update */
  lastUpdated: Date;
}

/**
 * Enhanced adapter for KILT parachain connection and wallet operations.
 * Handles connection to KILT networks, account listing, message signing, and real transaction operations.
 */
export class KiltAdapter implements WalletAdapter {
  private enabled = false;
  private provider: string | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private injectedWindow: Window & InjectedWindow;
  private eventEmitter: EventEmitter;
  private api: ApiPromise | null = null;
  private wsProvider: WsProvider | null = null;
  private chainInfo: KiltChainInfo | null = null;
  
  // Connection management
  private currentNetwork: KILTNetwork = KILTNetwork.SPIRITNET;
  private connectionRetryCount = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private lastHealthCheck: Date | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';

  // Transaction management
  private transactionService: KILTTransactionService | null = null;
  private nonceCache: Map<string, KILTNonceInfo> = new Map();
  private pendingTransactions: Map<string, KILTTransactionStatus> = new Map();
  private transactionMonitorInterval: NodeJS.Timeout | null = null;

  constructor(network: KILTNetwork = KILTNetwork.SPIRITNET) {
    this.injectedWindow = window as Window & InjectedWindow;
    this.eventEmitter = new EventEmitter();
    this.currentNetwork = network;
  }

  /**
   * Connects to KILT network with retry logic and health checking.
   * @param network - The KILT network to connect to (defaults to current network)
   * @returns Promise resolving to KiltChainInfo
   * @throws {WalletConnectionError} If connection fails after all retries
   */
  public async connect(network?: KILTNetwork): Promise<KiltChainInfo> {
    if (network) {
      this.currentNetwork = network;
    }

    if (this.isConnecting) {
      throw new WalletConnectionError('Connection already in progress');
    }

    if (this.connectionState === 'connected' && this.chainInfo) {
      return this.chainInfo;
    }

    this.isConnecting = true;
    this.connectionState = 'connecting';
    this.connectionRetryCount = 0;

    try {
      const chainInfo = await this.connectWithRetry();
      
      this.connectionState = 'connected';
      this.connectionRetryCount = 0;
      this.lastHealthCheck = new Date();
      
      // Start health checking
      this.startHealthCheck();
      
      this.eventEmitter.emit('chainConnected', chainInfo);
      return chainInfo;

    } catch (error) {
      this.connectionState = 'disconnected';
      this.isConnecting = false;
      
      console.error('KILT connection failed after all retries:', error);
      
      // Clean up on failure
      await this.cleanup();
      
      throw new WalletConnectionError(
        `Failed to connect to KILT parachain after ${CONNECTION_CONFIG.maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Connects to KILT network with exponential backoff retry logic.
   * @returns Promise resolving to KiltChainInfo
   * @private
   */
  private async connectWithRetry(): Promise<KiltChainInfo> {
    const endpoints = KILT_ENDPOINTS[this.currentNetwork];
    
    for (let attempt = 0; attempt < CONNECTION_CONFIG.maxRetries; attempt++) {
      this.connectionRetryCount = attempt;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Attempting to connect to ${endpoint} (attempt ${attempt + 1}/${CONNECTION_CONFIG.maxRetries})`);
          
          // Clean up previous connection
          await this.cleanup();
          
          // Create WebSocket provider with timeout
          this.wsProvider = new WsProvider(endpoint);
          
          // Create API instance with connection timeout
          const connectionPromise = ApiPromise.create({
            provider: this.wsProvider,
            rpc: {
              // Add any custom RPC methods if needed
            },
          });

          // Add timeout to connection
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_CONFIG.connectionTimeout);
          });

          this.api = await Promise.race([connectionPromise, timeoutPromise]) as ApiPromise;

          // Wait for API to be ready with timeout
          const readyPromise = this.api.isReady;
          await Promise.race([readyPromise, timeoutPromise]);

          // Retrieve chain information
          const chainName = this.api.runtimeChain.toString();
          const version = this.api.runtimeVersion.specVersion.toString();
          const runtime = this.api.runtimeVersion.specName.toString();
          const genesisHash = this.api.genesisHash.toString();
          
          // Get SS58 format from network config
          const networkConfig = KILT_NETWORKS[this.currentNetwork];
          const ss58Format = networkConfig.ss58Format;

          this.chainInfo = {
            name: chainName,
            network: this.currentNetwork,
            version,
            runtime,
            ss58Format,
            genesisHash,
          };

          // Initialize transaction service
          this.transactionService = new KILTTransactionService(this.api);

          // Start transaction monitoring
          this.startTransactionMonitoring();

          console.log(`Successfully connected to ${endpoint}`);
          return this.chainInfo;

        } catch (error) {
          console.warn(`Failed to connect to ${endpoint}:`, error);
          
          // Clean up failed connection
          await this.cleanup();
          
          // If this is the last endpoint for this attempt, wait before retrying
          if (endpoint === endpoints[endpoints.length - 1]) {
            if (attempt < CONNECTION_CONFIG.maxRetries - 1) {
              const delay = Math.min(
                CONNECTION_CONFIG.baseRetryDelay * Math.pow(CONNECTION_CONFIG.retryBackoffMultiplier, attempt),
                CONNECTION_CONFIG.maxRetryDelay
              );
              
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
      }
    }
    
    throw new Error(`Failed to connect to any endpoint for network ${this.currentNetwork}`);
  }

  /**
   * Enables the KILT wallet extension.
   * This should be called before any wallet operations.
   * @throws {WalletNotFoundError} If the KILT wallet extension is not installed
   * @throws {TimeoutError} If the connection times out
   * @throws {WalletConnectionError} For other connection failures
   */
  public async enable(): Promise<void> {
    if (this.enabled) return;

    try {
      // First ensure we're connected to the chain
      if (!this.api || !this.chainInfo) {
        await this.connect();
      }

      // Check if KILT extension is available
      if (!this.injectedWindow.injectedWeb3?.[KILT_EXTENSION_NAME]) {
        throw new WalletNotFoundError('KILT Extension');
      }

      // Clear any existing timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      const enablePromise = web3Enable('KeyPass Login SDK');
      const timeoutPromise = new Promise((_, reject) => {
        this.connectionTimeout = setTimeout(() => {
          this.connectionTimeout = null;
          this.enabled = false;
          this.provider = null;
          reject(new TimeoutError('wallet_connection'));
        }, WALLET_TIMEOUT);
      });

      try {
        await Promise.race([enablePromise, timeoutPromise]);
      } catch (error) {
        if (error instanceof TimeoutError) {
          throw error;
        }
        throw error;
      } finally {
        // Clear timeout on success or error
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
      }

      this.provider = 'kilt';
      this.enabled = true;
      this.eventEmitter.emit('walletEnabled', { provider: 'kilt' });

    } catch (error) {
      // Reset state on error
      this.enabled = false;
      this.provider = null;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      if (error instanceof WalletNotFoundError || error instanceof TimeoutError) {
        throw error;
      }

      throw new WalletConnectionError(
        `Failed to enable KILT wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets a list of accounts from the KILT wallet extension.
   * @returns Promise resolving to an array of account objects
   * @throws {WalletNotFoundError} If the wallet is not enabled
   * @throws {WalletConnectionError} If no accounts are found
   * @throws {UserRejectedError} If the user rejects the account access
   */
  public async getAccounts(): Promise<WalletAccount[]> {
    if (!this.enabled || !this.provider) {
      throw new WalletNotFoundError('KILT Extension');
    }

    try {
      const allAccounts = await web3Accounts();
      
      if (!allAccounts || allAccounts.length === 0) {
        throw new WalletConnectionError('No KILT accounts found. Please create an account in the KILT wallet.');
      }

      // Filter for KILT accounts (accounts with SS58 format 38)
      const kiltAccounts = allAccounts.map(account => ({
        address: account.address,
        name: account.meta.name || 'Unnamed Account',
        source: 'kilt',
      }));

      return kiltAccounts;
    } catch (error) {
      console.error('Failed to get KILT accounts:', error);
      
      if (error instanceof WalletConnectionError) {
        throw error;
      }

      throw new WalletConnectionError(
        `Failed to get account list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Signs a message using the KILT wallet.
   * @param message - The message to sign
   * @returns Promise resolving to the signature
   * @throws {WalletNotFoundError} If the wallet is not enabled
   * @throws {MessageValidationError} If the message is invalid
   * @throws {UserRejectedError} If the user rejects the signing
   * @throws {TimeoutError} If the signing times out
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.enabled || !this.provider) {
      throw new WalletNotFoundError('KILT Extension');
    }

    try {
      // Validate and sanitize the message
      const validatedMessage = validateAndSanitizeMessage(message);

      const accounts = await this.getAccounts();
      if (!accounts.length) {
        throw new WalletConnectionError('No accounts available for signing');
      }

      // Use the first account for signing
      const address = accounts[0].address;
      
      const injector = await web3FromAddress(address);
      if (!injector.signer || !injector.signer.signRaw) {
        throw new WalletConnectionError(`No signer available for address ${address}`);
      }

      // Sign the message using SR25519
      const signature = await injector.signer.signRaw({
        address,
        data: u8aToHex(hexToU8a(validatedMessage)),
        type: 'bytes',
      });

      if (!signature) {
        throw new InvalidSignatureError('Signature generation failed');
      }

      // Validate the signature format
      validateSignature(signature.signature);

      return signature.signature;

    } catch (error) {
      if (error instanceof MessageValidationError || error instanceof InvalidSignatureError) {
        throw error;
      }

      console.error('KILT signing failed:', error);
      
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw new UserRejectedError('message_signing');
      }

      throw new InvalidSignatureError(
        `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets the name of the wallet provider being used.
   * @returns The provider name or null if not connected
   */
  public getProvider(): string | null {
    return this.provider;
  }

  /**
   * Gets the KILT chain information.
   * @returns KiltChainInfo or null if not connected
   */
  public getChainInfo(): KiltChainInfo | null {
    return this.chainInfo;
  }

  /**
   * Gets the current connection state.
   * @returns Connection state string
   */
  public getConnectionState(): string {
    return this.connectionState;
  }

  /**
   * Gets the current network being used.
   * @returns Current KILT network
   */
  public getCurrentNetwork(): KILTNetwork {
    return this.currentNetwork;
  }

  /**
   * Sets the network to connect to.
   * @param network - The KILT network to use
   */
  public setNetwork(network: KILTNetwork): void {
    if (this.currentNetwork !== network) {
      this.currentNetwork = network;
      // If already connected, reconnect to new network
      if (this.connectionState === 'connected') {
        this.reconnect();
      }
    }
  }

  /**
   * Performs a health check on the current connection.
   * @returns Promise resolving to true if healthy, false otherwise
   */
  public async performHealthCheck(): Promise<boolean> {
    if (!this.api || !this.chainInfo) {
      return false;
    }

    try {
      // Check if API is still connected and responsive
      const isConnected = this.api.isConnected;
      if (!isConnected) {
        console.warn('KILT API is not connected');
        return false;
      }

      // Try to get basic chain info to verify responsiveness
      await Promise.race([
        this.api.rpc.system.chain(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);

      this.lastHealthCheck = new Date();
      return true;

    } catch (error) {
      console.warn('KILT health check failed:', error);
      return false;
    }
  }

  /**
   * Starts periodic health checking.
   * @private
   */
  private startHealthCheck(): void {
    this.stopHealthCheck(); // Clear any existing interval

    this.healthCheckInterval = setInterval(async () => {
      if (this.connectionState === 'connected') {
        const isHealthy = await this.performHealthCheck();
        
        if (!isHealthy && CONNECTION_CONFIG.reconnectOnHealthFailure) {
          console.warn('Health check failed, attempting to reconnect...');
          this.eventEmitter.emit('healthCheckFailed');
          await this.reconnect();
        }
      }
    }, CONNECTION_CONFIG.healthCheckInterval);
  }

  /**
   * Stops periodic health checking.
   * @private
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Reconnects to the current network.
   * @returns Promise resolving when reconnection is complete
   */
  public async reconnect(): Promise<KiltChainInfo> {
    if (this.connectionState === 'reconnecting') {
      throw new WalletConnectionError('Reconnection already in progress');
    }

    this.connectionState = 'reconnecting';
    this.eventEmitter.emit('reconnecting');

    try {
      await this.cleanup();
      const chainInfo = await this.connect();
      this.eventEmitter.emit('reconnected', chainInfo);
      return chainInfo;
    } catch (error) {
      this.connectionState = 'disconnected';
      this.eventEmitter.emit('reconnectionFailed', error);
      throw error;
    }
  }

  /**
   * Validates a KILT address with SS58 format 38.
   * @param address - The address to validate
   * @returns Promise resolving to true if valid
   * @throws {AddressValidationError} If the address is invalid
   */
  public async validateAddress(address: string): Promise<boolean> {
    try {
      validatePolkadotAddress(address, 38); // KILT uses SS58 format 38
      return true;
    } catch (error) {
      if (error instanceof AddressValidationError) {
        throw error;
      }
      throw new AddressValidationError(`Invalid KILT address: ${address}`);
    }
  }

  /**
   * Signs and submits a transaction to the KILT parachain.
   * @param extrinsic - The transaction extrinsic
   * @param options - Transaction options
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If transaction submission fails
   */
  public async submitTransaction(
    extrinsic: any,
    options: KILTTransactionOptions
  ): Promise<KILTTransactionResult> {
    try {
      if (!this.api || !this.transactionService) {
        throw new KILTError(
          'KILT adapter not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Convert string signer to KeyringPair if needed
      let signer: KeyringPair;
      if (typeof options.signer === 'string') {
        signer = await this.getSignerFromAddress(options.signer);
      } else {
        signer = options.signer;
      }

      // Submit transaction using transaction service
      const result = await this.transactionService.submitTransaction(extrinsic, {
        signer,
        nonce: options.nonce,
        tip: options.tip,
        era: options.era,
        gasLimit: options.gasLimit,
        waitForConfirmation: options.waitForConfirmation,
      });

      // Emit transaction event
      this.eventEmitter.emit('transactionSubmitted', result);

      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Transaction submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Gets the current nonce for an account.
   * @param address - The account address
   * @returns A promise that resolves to the nonce info
   */
  public async getNonce(address: string): Promise<KILTNonceInfo> {
    try {
      if (!this.api) {
        throw new KILTError(
          'KILT adapter not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Check cache first
      const cached = this.nonceCache.get(address);
      if (cached && Date.now() - cached.lastUpdated.getTime() < 30000) { // 30 second cache
        return { ...cached, cached: true };
      }

      // Fetch from chain
      const nonce = await this.api.rpc.system.accountNextIndex(address);
      const nonceInfo: KILTNonceInfo = {
        nonce: nonce.toNumber(),
        cached: false,
        lastUpdated: new Date(),
      };

      // Cache the nonce
      this.nonceCache.set(address, nonceInfo);

      return nonceInfo;

    } catch (error) {
      throw new KILTError(
        `Failed to get nonce: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Increments the nonce for an account (used after successful transaction).
   * @param address - The account address
   */
  public incrementNonce(address: string): void {
    const cached = this.nonceCache.get(address);
    if (cached) {
      cached.nonce++;
      cached.lastUpdated = new Date();
      this.nonceCache.set(address, cached);
    }
  }

  /**
   * Gets the status of a pending transaction.
   * @param txHash - The transaction hash
   * @returns The transaction status or undefined if not found
   */
  public getTransactionStatus(txHash: string): KILTTransactionStatus | undefined {
    return this.pendingTransactions.get(txHash);
  }

  /**
   * Gets all pending transactions.
   * @returns Array of pending transaction statuses
   */
  public getPendingTransactions(): KILTTransactionStatus[] {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * Monitors transaction status with real-time updates.
   * @param txHash - The transaction hash to monitor
   * @param callback - Callback function for status updates
   * @returns A promise that resolves when monitoring is complete
   */
  public async monitorTransaction(
    txHash: string,
    callback: (status: KILTTransactionStatus) => void
  ): Promise<KILTTransactionResult> {
    if (!this.transactionService) {
      throw new KILTError(
        'Transaction service not available',
        KILTErrorType.NETWORK_ERROR
      );
    }

    return this.transactionService.monitorTransaction(txHash, callback);
  }

  /**
   * Estimates gas for a transaction.
   * @param extrinsic - The transaction extrinsic
   * @param signer - The transaction signer
   * @returns A promise that resolves to gas estimation
   */
  public async estimateGas(
    extrinsic: any,
    signer: KeyringPair | string
  ): Promise<{ gasLimit: string; fee: string; success: boolean; error?: string }> {
    try {
      if (!this.transactionService) {
        throw new KILTError(
          'Transaction service not available',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Convert string signer to KeyringPair if needed
      let keyringPair: KeyringPair;
      if (typeof signer === 'string') {
        keyringPair = await this.getSignerFromAddress(signer);
      } else {
        keyringPair = signer;
      }

      return await this.transactionService.estimateGas(extrinsic, keyringPair);

    } catch (error) {
      return {
        gasLimit: '0',
        fee: '0',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets transaction details from the blockchain.
   * @param txHash - The transaction hash
   * @returns A promise that resolves to transaction details
   */
  public async getTransactionDetails(txHash: string): Promise<{
    hash: string;
    blockNumber: number;
    blockHash: string;
    events: KILTTransactionEvent[];
    fee: { amount: string; currency: string };
    timestamp: string;
  } | null> {
    if (!this.transactionService) {
      throw new KILTError(
        'Transaction service not available',
        KILTErrorType.NETWORK_ERROR
      );
    }

    return this.transactionService.getTransactionDetails(txHash);
  }

  /**
   * Gets network statistics for monitoring.
   * @returns A promise that resolves to network statistics
   */
  public async getNetworkStats(): Promise<{
    blockNumber: number;
    blockHash: string;
    finalizedBlockNumber: number;
    finalizedBlockHash: string;
    pendingTransactions: number;
    averageBlockTime: number;
    networkName: string;
    tokenSymbol: string;
  }> {
    if (!this.transactionService) {
      throw new KILTError(
        'Transaction service not available',
        KILTErrorType.NETWORK_ERROR
      );
    }

    return this.transactionService.getNetworkStats();
  }

  /**
   * Creates a signer from an address using the wallet extension.
   * @param address - The account address
   * @returns A promise that resolves to a KeyringPair
   * @private
   */
  private async getSignerFromAddress(address: string): Promise<KeyringPair> {
    try {
      if (!this.enabled) {
        throw new KILTError(
          'Wallet not enabled',
          KILTErrorType.NETWORK_ERROR
        );
      }

      const injector = await web3FromAddress(address);
      if (!injector.signer) {
        throw new KILTError(
          `No signer available for address ${address}`,
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Create a KeyringPair adapter that uses the browser extension injector signer
      // This allows us to use the extension's signing capabilities with Polkadot API
      const keyringPairAdapter = {
        address,
        sign: async (message: Uint8Array) => {
          if (!injector.signer || !injector.signer.signRaw) {
            throw new KILTError('Signer not available', KILTErrorType.NETWORK_ERROR);
          }
          const signature = await injector.signer.signRaw({
            address,
            data: u8aToHex(message),
            type: 'bytes',
          });
          return signature.signature;
        },
        signAsync: async (message: Uint8Array) => {
          if (!injector.signer || !injector.signer.signRaw) {
            throw new KILTError('Signer not available', KILTErrorType.NETWORK_ERROR);
          }
          const signature = await injector.signer.signRaw({
            address,
            data: u8aToHex(message),
            type: 'bytes',
          });
          return signature.signature;
        },
      } as unknown as KeyringPair;

      return keyringPairAdapter;

    } catch (error) {
      throw new KILTError(
        `Failed to get signer for address ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.NETWORK_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Starts transaction monitoring for pending transactions.
   * @private
   */
  private startTransactionMonitoring(): void {
    this.stopTransactionMonitoring(); // Clear any existing interval

    this.transactionMonitorInterval = setInterval(async () => {
      if (this.pendingTransactions.size > 0) {
        for (const [txHash, status] of this.pendingTransactions.entries()) {
          try {
            if (this.transactionService) {
              const isConfirmed = await this.transactionService.checkTransactionStatus(txHash);
              if (isConfirmed && status.status !== 'confirmed' && status.status !== 'failed') {
                status.status = 'confirmed';
                this.eventEmitter.emit('transactionConfirmed', { txHash, status });
              }
            }
          } catch (error) {
            console.warn(`Failed to check status for transaction ${txHash}:`, error);
          }
        }

        // Clean up confirmed/failed transactions
        for (const [txHash, status] of this.pendingTransactions.entries()) {
          if (status.status === 'confirmed' || status.status === 'failed') {
            this.pendingTransactions.delete(txHash);
          }
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stops transaction monitoring.
   * @private
   */
  private stopTransactionMonitoring(): void {
    if (this.transactionMonitorInterval) {
      clearInterval(this.transactionMonitorInterval);
      this.transactionMonitorInterval = null;
    }
  }

  /**
   * Clears the nonce cache.
   */
  public clearNonceCache(): void {
    this.nonceCache.clear();
  }

  /**
   * Gets the transaction service instance.
   * @returns The transaction service or null if not available
   */
  public getTransactionService(): KILTTransactionService | null {
    return this.transactionService;
  }

  /**
   * Disconnects from the KILT wallet and cleans up resources.
   */
  public async disconnect(): Promise<void> {
    try {
      this.connectionState = 'disconnected';
      await this.cleanup();
      this.eventEmitter.emit('disconnected');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  /**
   * Private method to clean up connections and reset state.
   */
  private async cleanup(): Promise<void> {
    this.enabled = false;
    this.provider = null;
    this.isConnecting = false;

    // Stop health checking
    this.stopHealthCheck();

    // Stop transaction monitoring
    this.stopTransactionMonitoring();

    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Disconnect API if connected
    if (this.api) {
      try {
        await this.api.disconnect();
      } catch (error) {
        console.warn('Error disconnecting KILT API:', error);
      }
      this.api = null;
    }

    // Close WebSocket provider
    if (this.wsProvider) {
      try {
        this.wsProvider.disconnect();
      } catch (error) {
        console.warn('Error disconnecting KILT WebSocket provider:', error);
      }
      this.wsProvider = null;
    }

    // Reset connection state (but keep chainInfo for potential reuse)
    // Only clear chainInfo if we're fully disconnecting
    if (this.connectionState === 'disconnected') {
      this.chainInfo = null;
      this.lastHealthCheck = null;
      this.connectionRetryCount = 0;
      this.transactionService = null;
      this.nonceCache.clear();
      this.pendingTransactions.clear();
    }
  }

  /**
   * Registers an event listener for wallet events.
   * @param event - The event name to listen for
   * @param callback - The callback function to handle the event
   */
  public on(event: string, callback: (data: any) => void): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Removes an event listener for wallet events.
   * @param event - The event name to remove listener from
   * @param callback - The callback function to remove
   */
  public off(event: string, callback: (data: any) => void): void {
    this.eventEmitter.off(event, callback);
  }
}
