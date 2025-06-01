import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { isAddress } from '@polkadot/util-crypto';
import { InjectedWindow } from '@polkadot/extension-inject/types';
import { WalletAdapter, WalletAccount, validateAddress, validateSignature, WALLET_TIMEOUT, validateAndSanitizeMessage, validatePolkadotAddress } from './types';
import { 
  WalletNotFoundError, 
  UserRejectedError, 
  TimeoutError, 
  InvalidSignatureError,
  WalletConnectionError,
  MessageValidationError,
  AddressValidationError
} from '../errors/WalletErrors';

const TALISMAN_EXTENSION_NAME = 'talisman';
const WALLET_CONNECT_NAME = 'wallet-connect';

/**
 * Adapter for the Talisman browser extension wallet.
 * Handles connection, account listing, and message signing for the
 * Talisman wallet extension, with fallback to WalletConnect.
 * 
 * This adapter implements the WalletAdapter interface and provides
 * functionality for:
 * - Connecting to the Talisman wallet extension
 * - Listing available accounts
 * - Signing messages
 * - Managing wallet connection state
 * 
 * @example
 * ```typescript
 * const adapter = new TalismanAdapter();
 * await adapter.enable();
 * const accounts = await adapter.getAccounts();
 * const signature = await adapter.signMessage("Hello, World!");
 * ```
 */
export class TalismanAdapter implements WalletAdapter {
  private enabled = false;
  private provider: string | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  /**
   * Attempts to enable the Talisman wallet extension.
   * This should be called before any other wallet operations.
   * 
   * @throws {WalletNotFoundError} If the Talisman extension is not installed
   * @throws {UserRejectedError} If the user rejects the connection request
   * @throws {TimeoutError} If the connection request times out
   * @throws {WalletConnectionError} For other connection failures
   */
  public async enable(): Promise<void> {
    if (this.enabled) return;

    try {
      const injectedWindow = window as Window & InjectedWindow;
      
      // Try Talisman first
      if (injectedWindow.injectedWeb3?.[TALISMAN_EXTENSION_NAME]) {
        await this.enableProvider(TALISMAN_EXTENSION_NAME);
        return;
      }
      
      // Fallback to WalletConnect if Talisman is not available
      if (injectedWindow.injectedWeb3?.[WALLET_CONNECT_NAME]) {
        await this.enableProvider(WALLET_CONNECT_NAME);
        return;
      }

      // If neither provider is available, throw error
      throw new WalletNotFoundError('Talisman');
    } catch (error) {
      // Reset state on error
      this.enabled = false;
      this.provider = null;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      if (error instanceof WalletNotFoundError || 
          error instanceof TimeoutError || 
          error instanceof UserRejectedError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new UserRejectedError('wallet_connection');
        }
        if (error.message.includes('timeout')) {
          throw new TimeoutError('wallet_connection');
        }
      }
      throw new WalletConnectionError('Failed to enable Talisman wallet');
    }
  }

  /**
   * Internal method to enable a specific provider
   * @param providerName - The name of the provider to enable
   * @throws {Error} If the provider cannot be enabled
   */
  private async enableProvider(providerName: string): Promise<void> {
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

    await Promise.race([enablePromise, timeoutPromise]);
    
    // Clear timeout on success
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.provider = providerName;
    this.enabled = true;
  }

  /**
   * Retrieves a list of accounts from the Talisman wallet.
   * Returns an array of account objects containing addresses and metadata.
   * 
   * @returns Promise resolving to an array of WalletAccount objects
   * @throws {WalletNotFoundError} If the wallet is not enabled
   * @throws {WalletConnectionError} If no accounts are found or connection fails
   * @throws {UserRejectedError} If the user rejects the account access request
   * @throws {AddressValidationError} If any account address is invalid
   */
  public async getAccounts(): Promise<WalletAccount[]> {
    if (!this.enabled) throw new WalletNotFoundError('Wallet');
    try {
      const accounts = await web3Accounts();
      if (!accounts || accounts.length === 0) {
        throw new WalletConnectionError('No accounts found');
      }
      return accounts.map((acc) => {
        try {
          this.validateAddress(acc.address);
          return { address: acc.address, name: acc.meta?.name, source: 'talisman' };
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
      throw new WalletConnectionError('Failed to get accounts from Talisman wallet');
    }
  }

  /**
   * Signs a message using the Talisman wallet.
   * The message is first validated and sanitized before signing.
   * 
   * @param message - The message to sign
   * @returns Promise resolving to the signature as a hex string
   * @throws {WalletNotFoundError} If the wallet is not enabled
   * @throws {MessageValidationError} If the message is invalid
   * @throws {WalletConnectionError} If signing fails
   * @throws {UserRejectedError} If the user rejects the signing request
   * @throws {TimeoutError} If the signing request times out
   * @throws {InvalidSignatureError} If the signature is invalid
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
        throw new WalletConnectionError('Failed to sign message: Signer does not support raw signing');
      }

      const messageU8a = new TextEncoder().encode(sanitizedMessage);
      const signPromise = injector.signer.signRaw({ address: account.address, data: u8aToHex(messageU8a), type: 'bytes' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new TimeoutError('message_signing')), WALLET_TIMEOUT)
      );
      const { signature } = await Promise.race([signPromise, timeoutPromise]) as { signature: string };

      try {
        validateSignature(signature);
        return signature;
      } catch (error) {
        // Preserve the original error message if it's an Error instance
        const errorMessage = error instanceof Error ? error.message : 'Invalid signature format';
        throw new InvalidSignatureError(errorMessage);
      }
    } catch (error) {
      // Handle known error types
      if (error instanceof MessageValidationError ||
          error instanceof InvalidSignatureError ||
          error instanceof TimeoutError ||
          error instanceof UserRejectedError ||
          error instanceof WalletConnectionError) {
        throw error;
      }
      
      // Handle Error instances with specific messages
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new UserRejectedError('message_signing');
        }
        if (error.message.includes('timeout')) {
          throw new TimeoutError('message_signing');
        }
        if (error.message.includes('Invalid signature')) {
          const errorMessage = error.message;
          throw new InvalidSignatureError(errorMessage);
        }
        // For other Error instances, preserve the message
        throw new WalletConnectionError(`Failed to sign message: ${error.message}`);
      }
      
      // Handle non-Error objects
      throw new WalletConnectionError('Failed to sign message: Unknown error');
    }
  }

  /**
   * Returns the current wallet provider being used.
   * Can be either 'talisman' or 'wallet-connect'.
   * 
   * @returns The provider name or null if not connected
   */
  public getProvider(): string | null {
    return this.provider;
  }

  /**
   * Disconnects the wallet adapter and cleans up resources.
   * Resets the connection state and clears any pending timeouts.
   * Should be called when switching wallets or logging out.
   * 
   * @example
   * ```typescript
   * adapter.disconnect();
   * ```
   */
  public disconnect(): void {
    this.enabled = false;
    this.provider = null;
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
}
