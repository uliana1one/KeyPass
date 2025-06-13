import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { isAddress } from '@polkadot/util-crypto';
import { InjectedWindow } from '@polkadot/extension-inject/types';
import {
  WalletAdapter,
  WalletAccount,
  validateAddress,
  validateSignature,
  WALLET_TIMEOUT,
  validateAndSanitizeMessage,
  validatePolkadotAddress,
} from './types';
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  InvalidSignatureError,
  WalletConnectionError,
  MessageValidationError,
  AddressValidationError,
} from '../errors/WalletErrors';

const POLKADOT_EXTENSION_NAME = 'polkadot-js';

/**
 * Adapter for the Polkadot.js browser extension wallet.
 * Handles connection, account listing, and message signing for the official
 * Polkadot.js wallet extension.
 */
export class PolkadotJsAdapter implements WalletAdapter {
  private enabled = false;
  private provider: string | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private injectedWindow: Window & InjectedWindow;

  constructor() {
    this.injectedWindow = window as Window & InjectedWindow;
  }

  /**
   * Attempts to enable the Polkadot.js wallet extension.
   * This should be called before any other wallet operations.
   * @throws {Error} If the wallet extension is not installed or cannot be enabled
   */
  public async enable(): Promise<void> {
    if (this.enabled) return;

    try {
      const injectedWindow = window as Window & InjectedWindow;
      if (!injectedWindow.injectedWeb3?.[POLKADOT_EXTENSION_NAME]) {
        throw new WalletNotFoundError('Polkadot.js');
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

      this.provider = 'polkadot-js';
      this.enabled = true;
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
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new UserRejectedError('wallet_connection');
        }
      }
      throw new WalletConnectionError('Failed to enable Polkadot.js wallet');
    }
  }

  /**
   * Retrieves a list of accounts from the Polkadot.js wallet.
   * @returns Promise resolving to an array of account objects containing addresses
   * @throws {Error} If the wallet is not enabled or accounts cannot be retrieved
   */
  public async getAccounts(): Promise<WalletAccount[]> {
    if (!this.enabled) throw new WalletNotFoundError('Wallet not enabled');
    try {
      const accounts = await web3Accounts();
      if (!accounts || accounts.length === 0) {
        throw new WalletConnectionError('No accounts found');
      }
      return accounts.map((acc) => {
        try {
          this.validateAddress(acc.address);
          return { address: acc.address, name: acc.meta?.name, source: 'polkadot-js' };
        } catch (error) {
          if (error instanceof AddressValidationError) {
            throw error;
          }
          throw new WalletConnectionError('Invalid Polkadot address format');
        }
      });
    } catch (error) {
      if (error instanceof AddressValidationError || error instanceof WalletConnectionError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new UserRejectedError('account_access');
        }
      }
      throw new WalletConnectionError('Failed to get accounts from Polkadot.js wallet');
    }
  }

  /**
   * Signs a message using the Polkadot.js wallet.
   * @param message - The message to sign
   * @returns Promise resolving to the signature as a hex string
   * @throws {Error} If the wallet is not enabled or signing fails
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.enabled) throw new WalletNotFoundError('Wallet not enabled');

    let sanitizedMessage: string;
    try {
      // Validate and sanitize message first
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
        throw new WalletConnectionError('Failed to sign message: No accounts found');
      }

      const account = accounts[0];
      const injector = await web3FromAddress(account.address);
      if (!injector.signer || !injector.signer.signRaw) {
        throw new WalletConnectionError(
          'Failed to sign message: Signer does not support raw signing'
        );
      }

      const messageU8a = new TextEncoder().encode(sanitizedMessage);
      const signPromise = injector.signer.signRaw({
        address: account.address,
        data: u8aToHex(messageU8a),
        type: 'bytes',
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new TimeoutError('message_signing')), WALLET_TIMEOUT)
      );
      const { signature } = (await Promise.race([signPromise, timeoutPromise])) as {
        signature: string;
      };

      try {
        validateSignature(signature);
        return signature;
      } catch (error) {
        // Preserve the original error message if it's an Error instance
        const errorMessage = error instanceof Error ? error.message : 'Invalid signature format';
        throw new InvalidSignatureError(errorMessage);
      }
    } catch (error) {
      if (
        error instanceof MessageValidationError ||
        error instanceof InvalidSignatureError ||
        error instanceof TimeoutError ||
        error instanceof UserRejectedError
      ) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new UserRejectedError('message_signing');
        }
        if (error.message.includes('timeout')) {
          throw new TimeoutError('message_signing');
        }
        // If it's a WalletConnectionError from getAccounts, preserve its message
        if (error instanceof WalletConnectionError && error.message === 'No accounts found') {
          throw new WalletConnectionError('Failed to sign message: No accounts found');
        }
      }
      throw error;
    }
  }

  /**
   * Returns the provider being used (polkadot-js)
   */
  public getProvider(): string | null {
    return this.provider;
  }

  /**
   * Disconnects from the wallet and cleans up resources.
   * Due to limitations in the Polkadot.js extension API,
   * this will only clear local state. The next connection attempt
   * will require user approval.
   */
  public async disconnect(): Promise<void> {
    // Clear local state
    this.enabled = false;
    this.provider = null;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Try to revoke permissions by re-enabling with a different app name
    try {
      // This will trigger the extension's permission dialog
      await web3Enable('KeyPass Logout');
      // Immediately disable again
      this.enabled = false;
    } catch (error) {
      // Ignore errors during disconnect
      console.debug('Error during wallet disconnect:', error);
    }
  }

  /**
   * Validates a Polkadot address format.
   * @param address - The address to validate
   * @returns A promise that resolves to true if the address is valid, false otherwise
   */
  public async validateAddress(address: string): Promise<boolean> {
    try {
      // Check if the address is a valid SS58 format
      const isValid = isAddress(address);
      return isValid;
    } catch (error) {
      console.error('Error validating address:', error);
      return false;
    }
  }
}
