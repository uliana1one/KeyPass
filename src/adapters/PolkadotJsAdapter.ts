/**
 * Adapter for the Polkadot.js browser extension wallet.
 * Handles connection, account listing, and message signing for the official
 * Polkadot.js wallet extension.
 */
export class PolkadotJsAdapter {
  /**
   * Attempts to enable the Polkadot.js wallet extension.
   * This should be called before any other wallet operations.
   * @throws {Error} If the wallet extension is not installed or cannot be enabled
   */
  public async enable(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Retrieves a list of accounts from the Polkadot.js wallet.
   * @returns Promise resolving to an array of account objects containing addresses
   * @throws {Error} If the wallet is not enabled or accounts cannot be retrieved
   */
  public async getAccounts(): Promise<{ address: string }[]> {
    throw new Error('Not implemented');
  }

  /**
   * Signs a message using the Polkadot.js wallet.
   * @param message - The message to sign
   * @returns Promise resolving to the signature as a hex string
   * @throws {Error} If the wallet is not enabled or signing fails
   */
  public async signMessage(message: string): Promise<string> {
    throw new Error('Not implemented');
  }
} 