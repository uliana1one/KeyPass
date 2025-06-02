import { WalletConnectProvider } from '@walletconnect/web3-provider';
import { Session } from '@walletconnect/types';
import { EventEmitter } from 'events';
import { WalletAdapter, WalletAccount, validateAddress, validateSignature, WALLET_TIMEOUT, validateAndSanitizeMessage, validatePolkadotAddress } from './types';
import { 
  WalletNotFoundError, 
  UserRejectedError, 
  TimeoutError, 
  InvalidSignatureError,
  WalletConnectionError,
  MessageValidationError,
  AddressValidationError,
  ConfigurationError
} from '../errors/WalletErrors';

// Add type declarations for WalletConnect
declare module '@walletconnect/web3-provider' {
  export class WalletConnectProvider {
    constructor(opts: {
      projectId: string;
      metadata: {
        name: string;
        description: string;
        url: string;
        icons: string[];
      };
      relayUrl?: string;
      chainId?: string;
    });
    enable(): Promise<void>;
    getAccounts(): Promise<WalletConnectAccount[]>;
    signMessage(params: { message: string; chainId: string }): Promise<string>;
    getSession(): Promise<Session>;
    disconnect(): Promise<void>;
    on(event: string, callback: EventHandler): void;
  }
}

declare module '@walletconnect/types' {
  export interface Session {
    chainId: string;
    accounts: string[];
    // Add other session properties as needed
  }
}

// Define WalletConnect account type
interface WalletConnectAccount {
  address: string;
  name?: string;
  chainId: string;
  walletId: string;
  walletName: string;
}

// Define event handler type
type EventHandler = (...args: any[]) => void;

export interface WalletConnectConfig {
  projectId: string;           // WalletConnect project ID
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  relayUrl?: string;          // Optional custom relay URL
  chainId?: string;           // Default chain ID
  sessionTimeout?: number;    // Session timeout in milliseconds
}

/**
 * Adapter for WalletConnect protocol.
 * Handles connection, account listing, and message signing through WalletConnect.
 * This adapter implements the WalletAdapter interface and provides
 * functionality for connecting to any wallet that supports WalletConnect.
 */
export class WalletConnectAdapter implements WalletAdapter {
  private provider!: WalletConnectProvider;  // Using definite assignment assertion
  private session: Session | null = null;
  private eventEmitter: EventEmitter;
  private config: WalletConnectConfig;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(config: WalletConnectConfig) {
    if (!config.projectId) {
      throw new ConfigurationError('WalletConnect project ID is required');
    }

    this.config = {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours default
      ...config
    };
    
    this.eventEmitter = new EventEmitter();
    this.initializeProvider();
  }

  private initializeProvider(): void {
    try {
      this.provider = new WalletConnectProvider({
        projectId: this.config.projectId,
        metadata: this.config.metadata,
        relayUrl: this.config.relayUrl,
        chainId: this.config.chainId || 'polkadot',
      });

      this.setupEventListeners();
    } catch (error) {
      throw new ConfigurationError(`Failed to initialize WalletConnect provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupEventListeners(): void {
    // Handle session events
    this.provider.on('session_update', this.handleSessionUpdate.bind(this));
    this.provider.on('session_delete', this.handleSessionDelete.bind(this));
    this.provider.on('session_expire', this.handleSessionExpire.bind(this));
    
    // Handle connection events
    this.provider.on('connect', this.handleConnect.bind(this));
    this.provider.on('disconnect', this.handleDisconnect.bind(this));
    
    // Handle chain events
    this.provider.on('chainChanged', this.handleChainChanged.bind(this));
  }

  /**
   * Attempts to enable the WalletConnect provider.
   * This should be called before any other wallet operations.
   * 
   * @throws {WalletNotFoundError} If no wallet is available
   * @throws {UserRejectedError} If the user rejects the connection request
   * @throws {TimeoutError} If the connection request times out
   * @throws {WalletConnectionError} For other connection failures
   */
  public async enable(): Promise<void> {
    try {
      if (!this.session) {
        // Clear any existing timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        const enablePromise = this.provider.enable();
        const timeoutPromise = new Promise((_, reject) => {
          this.connectionTimeout = setTimeout(() => {
            this.connectionTimeout = null;
            reject(new TimeoutError('wallet_connection'));
          }, WALLET_TIMEOUT);
        });

        await Promise.race([enablePromise, timeoutPromise]);
        
        // Clear timeout on success
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        this.session = await this.provider.getSession();
        this.reconnectAttempts = 0;
      }
    } catch (error) {
      // Reset state on error
      this.session = null;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      if (error instanceof TimeoutError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new UserRejectedError('wallet_connection');
        }
        if (error.message.includes('No wallet found')) {
          throw new WalletNotFoundError('WalletConnect');
        }
      }
      throw new WalletConnectionError(`Failed to enable WalletConnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves a list of accounts from the connected wallet.
   * Returns an array of account objects containing addresses and metadata.
   * 
   * @returns Promise resolving to an array of WalletAccount objects
   * @throws {WalletNotFoundError} If no session is active
   * @throws {WalletConnectionError} If no accounts are found or connection fails
   * @throws {UserRejectedError} If the user rejects the account access request
   * @throws {AddressValidationError} If any account address is invalid
   */
  public async getAccounts(): Promise<WalletAccount[]> {
    if (!this.session) {
      throw new WalletNotFoundError('No active session');
    }

    try {
      const accounts = await this.provider.getAccounts() as WalletConnectAccount[];
      if (!accounts || accounts.length === 0) {
        throw new WalletConnectionError('No accounts found');
      }

      return accounts.map((acc: WalletConnectAccount): WalletAccount => {
        try {
          this.validateAddress(acc.address);
          return {
            address: acc.address,
            name: acc.name || `Account ${acc.address.slice(0, 8)}...`,
            source: 'walletconnect'
          };
        } catch (error) {
          if (error instanceof AddressValidationError) {
            throw error;
          }
          throw new WalletConnectionError('Invalid Polkadot address format');
        }
      });
    } catch (error) {
      if (error instanceof AddressValidationError || 
          error instanceof WalletConnectionError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new UserRejectedError('account_access');
        }
      }
      throw new WalletConnectionError(`Failed to get accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Signs a message using the connected wallet.
   * The message is first validated and sanitized before signing.
   * 
   * @param message - The message to sign
   * @returns Promise resolving to the signature as a hex string
   * @throws {WalletNotFoundError} If no session is active
   * @throws {MessageValidationError} If the message is invalid
   * @throws {WalletConnectionError} If signing fails
   * @throws {UserRejectedError} If the user rejects the signing request
   * @throws {TimeoutError} If the signing request times out
   * @throws {InvalidSignatureError} If the signature is invalid
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.session) {
      throw new WalletNotFoundError('No active session');
    }
    
    let sanitizedMessage: string;
    try {
      sanitizedMessage = validateAndSanitizeMessage(message);
    } catch (error) {
      if (error instanceof MessageValidationError) {
        throw error;
      }
      throw new MessageValidationError('Invalid message format');
    }

    try {
      const accounts = await this.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new WalletConnectionError('No accounts found');
      }

      const account = accounts[0];
      try {
        const signPromise = this.provider.signMessage({
          message: sanitizedMessage,
          chainId: this.session.chainId,
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new TimeoutError('message_signing')), WALLET_TIMEOUT)
        );

        const signature = await Promise.race([signPromise, timeoutPromise]) as string;

        try {
          validateSignature(signature);
          return signature;
        } catch (error) {
          throw new InvalidSignatureError(error instanceof Error ? error.message : 'Invalid signature format');
        }
      } catch (error) {
        if (error instanceof TimeoutError) {
          throw error;
        }
        if (error instanceof Error) {
          if (error.message.includes('User rejected') || error.message.includes('User denied')) {
            throw new UserRejectedError('message_signing');
          }
          if (error.message.includes('Invalid signature')) {
            throw new InvalidSignatureError(error.message);
          }
        }
        throw new WalletConnectionError(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      if (error instanceof MessageValidationError ||
          error instanceof InvalidSignatureError ||
          error instanceof TimeoutError ||
          error instanceof UserRejectedError ||
          error instanceof WalletConnectionError) {
        throw error;
      }
      throw new WalletConnectionError('Failed to sign message: Unknown error');
    }
  }

  /**
   * Returns the current wallet provider being used (walletconnect).
   * 
   * @returns The provider name or null if not connected
   */
  public getProvider(): string | null {
    return this.session ? 'walletconnect' : null;
  }

  /**
   * Disconnects the wallet adapter and cleans up resources.
   * Resets the connection state and clears any pending timeouts.
   * Should be called when switching wallets or logging out.
   */
  public async disconnect(): Promise<void> {
    await this.cleanup();
  }

  // Session management methods
  private async handleSessionUpdate(session: Session): Promise<void> {
    this.session = session;
    this.eventEmitter.emit('sessionUpdate', session);
  }

  private async handleSessionDelete(): Promise<void> {
    this.session = null;
    this.eventEmitter.emit('sessionDelete');
    await this.cleanup();
  }

  private async handleSessionExpire(): Promise<void> {
    this.session = null;
    this.eventEmitter.emit('sessionExpire');
    await this.cleanup();
  }

  private async handleConnect(): Promise<void> {
    this.reconnectAttempts = 0;
    this.eventEmitter.emit('connect');
  }

  private async handleDisconnect(): Promise<void> {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      await this.reconnect();
    } else {
      await this.cleanup();
      this.eventEmitter.emit('disconnect');
    }
  }

  private async handleChainChanged(chainId: string): Promise<void> {
    this.eventEmitter.emit('chainChanged', chainId);
  }

  private async reconnect(): Promise<void> {
    try {
      await this.enable();
    } catch (error) {
      await this.cleanup();
      this.eventEmitter.emit('reconnectFailed');
    }
  }

  private async cleanup(): Promise<void> {
    if (this.session) {
      await this.provider.disconnect();
    }
    this.session = null;
    this.reconnectAttempts = 0;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Validates a Polkadot address format.
   * 
   * @param address - The address to validate
   * @throws {AddressValidationError} If the address is invalid
   * @private
   */
  private validateAddress(address: string): void {
    try {
      validatePolkadotAddress(address);
    } catch (error) {
      if (error instanceof AddressValidationError) {
        throw new AddressValidationError('Invalid Polkadot address');
      }
      throw error;
    }
  }

  // Public methods for session management
  public getSession(): Session | null {
    return this.session;
  }

  public on(event: string, callback: EventHandler): void {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: EventHandler): void {
    this.eventEmitter.off(event, callback);
  }
} 