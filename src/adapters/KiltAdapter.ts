import { ApiPromise, WsProvider } from '@polkadot/api';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { isAddress } from '@polkadot/util-crypto';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { InjectedWindow } from '@polkadot/extension-inject/types';
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

// Kilt spiritnet endpoint
const KILT_SPIRITNET_ENDPOINT = 'wss://spiritnet.kilt.io';
const KILT_EXTENSION_NAME = 'kilt';

// Chain info interface
export interface KiltChainInfo {
  name: string;
  network: string;
  version: string;
  runtime: string;
  ss58Format: number;
  genesisHash: string;
}

/**
 * Adapter for KILT parachain connection and wallet operations.
 * Handles connection to KILT spiritnet, account listing, and message signing.
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

  constructor() {
    this.injectedWindow = window as Window & InjectedWindow;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Connects to KILT spiritnet and retrieves chain information.
   * @returns Promise resolving to KiltChainInfo
   * @throws {WalletConnectionError} If connection fails
   */
  public async connect(): Promise<KiltChainInfo> {
    try {
      // Create WebSocket provider
      this.wsProvider = new WsProvider(KILT_SPIRITNET_ENDPOINT);
      
      // Create API instance
      this.api = await ApiPromise.create({
        provider: this.wsProvider,
        rpc: {
          // Add any custom RPC methods if needed
        },
      });

      // Wait for API to be ready
      await this.api.isReady;

      // Retrieve chain information
      const chainName = this.api.runtimeChain.toString();
      const version = this.api.runtimeVersion.specVersion.toString();
      const runtime = this.api.runtimeVersion.specName.toString();
      const genesisHash = this.api.genesisHash.toString();
      
      // KILT uses SS58 format 38
      const ss58Format = 38;

      this.chainInfo = {
        name: chainName,
        network: 'spiritnet',
        version,
        runtime,
        ss58Format,
        genesisHash,
      };

      this.eventEmitter.emit('chainConnected', this.chainInfo);
      return this.chainInfo;

    } catch (error) {
      console.error('KILT connection failed:', error);
      
      // Clean up on failure
      await this.cleanup();
      
      throw new WalletConnectionError(
        `Failed to connect to KILT parachain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
   * Disconnects from the KILT wallet and cleans up resources.
   */
  public async disconnect(): Promise<void> {
    try {
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
    this.chainInfo = null;

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
