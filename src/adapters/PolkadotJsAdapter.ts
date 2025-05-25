import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { InjectedWindow } from '@polkadot/extension-inject/types';

const POLKADOT_EXTENSION_NAME = 'polkadot-js';

/**
 * Adapter for the Polkadot.js browser extension wallet.
 * Handles connection, account listing, and message signing for the official
 * Polkadot.js wallet extension.
 */
export class PolkadotJsAdapter {
  private enabled = false;
  private readonly timeout = 10000; // 10 seconds timeout for wallet operations
  private provider: 'polkadot-js' | null = null;

  /**
   * Attempts to enable the Polkadot.js wallet extension.
   * This should be called before any other wallet operations.
   * @throws {Error} If the wallet extension is not installed or cannot be enabled
   */
  public async enable(): Promise<void> {
    if (this.enabled) return;

    try {
      // Check if extension is installed
      const injectedWindow = window as Window & InjectedWindow;
      if (!injectedWindow.injectedWeb3?.[POLKADOT_EXTENSION_NAME]) {
        throw new Error('Polkadot.js extension not installed');
      }

      // Enable the extension with timeout
      const enablePromise = web3Enable('KeyPass Login SDK');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Wallet connection timeout')), this.timeout)
      );

      await Promise.race([enablePromise, timeoutPromise]);
      this.provider = 'polkadot-js';
      this.enabled = true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('User rejected wallet connection');
        }
        throw error;
      }
      throw new Error('Failed to enable Polkadot.js wallet');
    }
  }

  /**
   * Retrieves a list of accounts from the Polkadot.js wallet.
   * @returns Promise resolving to an array of account objects containing addresses
   * @throws {Error} If the wallet is not enabled or accounts cannot be retrieved
   */
  public async getAccounts(): Promise<{ address: string }[]> {
    if (!this.enabled) {
      throw new Error('Wallet not enabled. Call enable() first');
    }

    try {
      const accounts = await web3Accounts();
      return accounts.map(account => ({
        address: account.address
      }));
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('User rejected account access');
        }
        throw new Error(`Failed to get accounts: ${error.message}`);
      }
      throw new Error('Failed to get accounts from wallet');
    }
  }

  /**
   * Signs a message using the Polkadot.js wallet.
   * @param message - The message to sign
   * @returns Promise resolving to the signature as a hex string
   * @throws {Error} If the wallet is not enabled or signing fails
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.enabled) {
      throw new Error('Wallet not enabled. Call enable() first');
    }

    try {
      // Get the first account for signing (in a real app, you'd want to let the user select)
      const accounts = await this.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts available for signing');
      }

      const address = accounts[0].address;
      const injector = await web3FromAddress(address);

      if (!injector.signer.signRaw) {
        throw new Error('Signer does not support raw signing');
      }

      // Convert message to Uint8Array for signing
      const messageU8a = new TextEncoder().encode(message);
      
      // Sign the message with timeout
      const signPromise = injector.signer.signRaw({
        address,
        data: u8aToHex(messageU8a),
        type: 'bytes'
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signing timeout')), this.timeout)
      );

      const { signature } = await Promise.race([signPromise, timeoutPromise]) as { signature: string };
      
      // Verify the signature format
      try {
        hexToU8a(signature);
      } catch {
        throw new Error('Invalid signature format received from wallet');
      }

      return signature;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('User rejected message signing');
        }
        throw new Error(`Failed to sign message: ${error.message}`);
      }
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Returns the provider being used (polkadot-js)
   */
  public getProvider(): 'polkadot-js' | null {
    return this.provider;
  }
}
