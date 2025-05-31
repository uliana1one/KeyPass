import walletsConfig from '../config/wallets.json';
import { validateWalletConfig } from './config/validator';
import { WalletAdapter, WalletAdapterConstructor } from './adapters/types';
import { WalletConnectionError, ConfigurationError } from './errors/WalletErrors';

// Validate wallet configuration at startup
try {
  validateWalletConfig(walletsConfig);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Invalid wallet configuration:', error.message);
  }
  throw error;
}

/**
 * Attempts to connect to a supported wallet by trying each available adapter
 * in sequence according to their priority in the configuration.
 * Returns the first successfully enabled adapter.
 *
 * @returns Promise resolving to an enabled wallet adapter
 * @throws {WalletConnectionError} If no supported wallet is found or can be enabled
 * @throws {ConfigurationError} If the wallet configuration is invalid
 *
 * @example
 * ```typescript
 * const wallet = await connectWallet();
 * const accounts = await wallet.getAccounts();
 * ```
 */
export async function connectWallet(retryCount = 1): Promise<WalletAdapter> {
  // Ensure configuration is valid
  validateWalletConfig(walletsConfig);

  const errors: Error[] = [];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    for (const wallet of walletsConfig.wallets) {
      try {
        // Dynamic import of adapter class
        const AdapterModule = await import(`./adapters/${wallet.adapter}`);
        const AdapterClass = AdapterModule[wallet.adapter] as WalletAdapterConstructor;

        // Create and enable adapter
        const adapter = new AdapterClass();
        await adapter.enable();

        return adapter;
      } catch (error) {
        // Log error but continue to next wallet
        console.debug(`Failed to connect to ${wallet.name} (attempt ${attempt + 1}/${retryCount + 1}):`, error);
        if (error instanceof Error) {
          errors.push(error);
          lastError = error;
        }
        continue;
      }
    }

    // If this wasn't the last attempt and we got a network error, wait and retry
    if (attempt < retryCount && lastError?.message.includes('Network error')) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      continue;
    }
  }

  // If we get here, no wallet could be connected
  const errorMessages = errors.map(e => e.message).join(', ');
  throw new WalletConnectionError(
    `No supported wallet found. Errors: ${errorMessages}`
  );
}
