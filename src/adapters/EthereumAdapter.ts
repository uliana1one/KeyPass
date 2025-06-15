import { EventEmitter } from 'events';
import {
  WalletAdapter,
  WalletAccount,
  WALLET_TIMEOUT,
  validateAndSanitizeMessage,
} from './types';
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  InvalidSignatureError,
  WalletConnectionError,
  MessageValidationError,
} from '../errors/WalletErrors';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}

// Simple Ethereum address validation
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Adapter for Ethereum wallets (MetaMask, etc.)
 * Handles connection, account listing, and message signing for Ethereum wallets.
 */
export class EthereumAdapter implements WalletAdapter {
  private enabled = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private eventEmitter: EventEmitter;
  private currentAddress: string | null = null;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Enables the Ethereum wallet connection.
   * Requests user permission to connect to their Ethereum wallet.
   */
  public async enable(): Promise<void> {
    if (!window.ethereum) {
      throw new WalletNotFoundError('MetaMask or compatible Ethereum wallet not found');
    }

    return new Promise((resolve, reject) => {
      this.connectionTimeout = setTimeout(() => {
        reject(new TimeoutError('connection'));
      }, WALLET_TIMEOUT);

      window.ethereum!.request({ method: 'eth_requestAccounts' })
        .then(() => {
          this.enabled = true;
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          resolve();
        })
        .catch((error: any) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          if (error.code === 4001) {
            reject(new UserRejectedError('connection'));
          } else {
            reject(new WalletConnectionError(`Failed to connect to Ethereum wallet: ${error.message}`));
          }
        });
    });
  }

  /**
   * Retrieves a list of accounts from the Ethereum wallet.
   */
  public async getAccounts(): Promise<WalletAccount[]> {
    if (!this.enabled) throw new WalletNotFoundError('Wallet not enabled');

    try {
      const accounts = await window.ethereum!.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new WalletConnectionError('No accounts found');
      }

      return accounts.map((address: string) => ({
        address: address.toLowerCase(), // Normalize to lowercase
        name: `Ethereum Account ${address.slice(0, 8)}...`,
        source: 'ethereum',
      }));
    } catch (error) {
      if (error instanceof WalletConnectionError) {
        throw error;
      }
      throw new WalletConnectionError('Failed to get accounts from Ethereum wallet');
    }
  }

  /**
   * Signs a message using the Ethereum wallet.
   * Note: This adapter needs to be called with the address set first via setCurrentAddress
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.enabled) throw new WalletNotFoundError('Wallet not enabled');
    if (!this.currentAddress) throw new WalletConnectionError('No address selected');

    try {
      // Validate and sanitize the message
      const sanitizedMessage = validateAndSanitizeMessage(message);
      
      // Sign the message using personal_sign
      const signature = await window.ethereum!.request({
        method: 'personal_sign',
        params: [sanitizedMessage, this.currentAddress],
      });
      
      return signature;
    } catch (error: any) {
      if (error instanceof MessageValidationError) {
        throw error;
      }
      if (error.code === 4001) {
        throw new UserRejectedError('message_signing');
      }
      throw new InvalidSignatureError(`Failed to sign message: ${error.message}`);
    }
  }

  /**
   * Sets the current address for signing operations
   */
  public setCurrentAddress(address: string): void {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address format');
    }
    this.currentAddress = address.toLowerCase();
  }

  /**
   * Validates an Ethereum address format.
   */
  public async validateAddress(address: string): Promise<boolean> {
    return isValidEthereumAddress(address);
  }

  /**
   * Gets the provider (returns null for compatibility)
   */
  public getProvider(): string | null {
    return null;
  }

  /**
   * Disconnects from the Ethereum wallet.
   */
  public async disconnect(): Promise<void> {
    this.enabled = false;
    this.currentAddress = null;
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.eventEmitter.emit('disconnected');
  }

  /**
   * Checks if the Ethereum wallet is available.
   */
  public isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  /**
   * Gets the wallet name.
   */
  public getName(): string {
    return window.ethereum?.isMetaMask ? 'MetaMask' : 'Ethereum Wallet';
  }

  // Event handling methods
  public on(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }
} 