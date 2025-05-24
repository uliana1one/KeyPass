import wallets from '../config/wallets.json';
import { PolkadotJsAdapter, TalismanAdapter } from './adapters';

type WalletAdapter = PolkadotJsAdapter | TalismanAdapter;

/**
 * Attempts to connect to a supported wallet by trying each available adapter
 * in sequence. Returns the first successfully enabled adapter.
 * 
 * @returns Promise resolving to an enabled wallet adapter
 * @throws {Error} If no supported wallet is found or can be enabled
 * 
 * @example
 * ```typescript
 * const wallet = await connectWallet();
 * const accounts = await wallet.getAccounts();
 * ```
 */
export async function connectWallet(): Promise<WalletAdapter> {
  for (const wallet of wallets.wallets) {
    try {
      // Dynamic import of adapter class
      const AdapterModule = await import(`./adapters/${wallet.adapter}`);
      const AdapterClass = AdapterModule[wallet.adapter];
      
      // Create and enable adapter
      const adapter = new AdapterClass();
      await adapter.enable();
      
      return adapter;
    } catch (error) {
      // Log error but continue to next wallet
      console.debug(`Failed to connect to ${wallet.name}:`, error);
      continue;
    }
  }

  throw new Error('No supported wallet found');
} 