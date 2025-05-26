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
 */
export class TalismanAdapter implements WalletAdapter {
  private enabled = false;
  private provider: string | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  /**
   * Attempts to enable the Talisman wallet extension.
   * This should be called before any other wallet operations.
   * @throws {Error} If the wallet extension is not installed or cannot be enabled
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
          throw new UserRejectedError('wallet connection');
        }
        if (error.message.includes('timeout')) {
          throw new TimeoutError('wallet connection');
        }
        throw new WalletConnectionError(`Failed to enable wallet: ${error.message}`);
      }
      throw new WalletConnectionError('Failed to enable wallet');
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
        reject(new TimeoutError('wallet connection'));
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
   * Retrieves a list of accounts from the wallet.
   * @returns Promise resolving to an array of account objects containing addresses
   * @throws {Error} If the wallet is not enabled or accounts cannot be retrieved
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
          validatePolkadotAddress(acc.address);
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
          throw new UserRejectedError('account access');
        }
        throw new WalletConnectionError(`Failed to fetch accounts: ${error.message}`);
      }
      throw new WalletConnectionError('Failed to fetch accounts');
    }
  }

  /**
   * Signs a message using the wallet.
   * @param message - The message to sign
   * @returns Promise resolving to the signature as a hex string
   * @throws {Error} If the wallet is not enabled or signing fails
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.enabled) throw new WalletNotFoundError('Wallet');
    let sanitized: string;
    try {
      sanitized = validateAndSanitizeMessage(message);
    } catch (e) {
      if (e instanceof MessageValidationError) {
        throw e;
      }
      throw new MessageValidationError('Message validation failed');
    }
    try {
      const accounts = await this.getAccounts();
      if (accounts.length === 0) {
        throw new WalletConnectionError('No accounts available for signing');
      }
      const address = accounts[0].address;
      const injector = await web3FromAddress(address);
      if (!injector.signer.signRaw) {
        throw new WalletConnectionError('Signer does not support raw signing');
      }
      const messageU8a = new TextEncoder().encode(sanitized);
      const signPromise = injector.signer.signRaw({ address, data: u8aToHex(messageU8a), type: 'bytes' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new TimeoutError('message signing')), WALLET_TIMEOUT)
      );
      const { signature } = await Promise.race([signPromise, timeoutPromise]) as { signature: string };
      try {
        validateSignature(signature);
        hexToU8a(signature);
      } catch {
        throw new InvalidSignatureError();
      }
      return signature;
    } catch (error) {
      if (error instanceof MessageValidationError ||
          error instanceof InvalidSignatureError ||
          error instanceof TimeoutError ||
          error instanceof UserRejectedError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new UserRejectedError('message signing');
        }
        if (error.message.includes('timeout')) {
          throw new TimeoutError('message signing');
        }
        throw new WalletConnectionError(`Failed to sign message: ${error.message}`);
      }
      throw new WalletConnectionError('Failed to sign message');
    }
  }

  /**
   * Returns the provider being used (talisman or wallet-connect)
   */
  public getProvider(): string | null {
    return this.provider;
  }

  /**
   * Disconnects the wallet adapter, resetting connection state and provider.
   * Use this to clean up when switching wallets or logging out.
   *
   * @example
   * adapter.disconnect();
   */
  disconnect(): void {
    this.enabled = false;
    this.provider = null;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}
