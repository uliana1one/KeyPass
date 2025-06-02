import walletsConfig from '../config/wallets.json';
import { validateWalletConfig } from './config/validator';
import { WalletAdapter, WalletAdapterConstructor } from './adapters/types';
import { WalletConnectionError, ConfigurationError } from './errors/WalletErrors';
import { PolkadotJsAdapter } from './adapters/PolkadotJsAdapter';
import { TalismanAdapter } from './adapters/TalismanAdapter';
import { WalletConnectAdapter, WalletConnectConfig } from './adapters/WalletConnectAdapter';

// Validate wallet configuration at startup
try {
  validateWalletConfig(walletsConfig);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Invalid wallet configuration:', error.message);
  }
  throw error;
}

// Default WalletConnect configuration
const defaultWalletConnectConfig: WalletConnectConfig = {
  projectId: process.env.WALLETCONNECT_PROJECT_ID || '',
  metadata: {
    name: 'KeyPass Login SDK',
    description: 'KeyPass Login SDK for Polkadot wallets',
    url: 'https://keypass.app',
    icons: ['https://keypass.app/icon.png']
  }
};

/**
 * Attempts to connect to a supported wallet by trying each adapter in priority order.
 * @returns A promise that resolves to the first successfully connected wallet adapter
 * @throws Error if no supported wallet is found
 */
export async function connectWallet(): Promise<WalletAdapter> {
  // Sort adapters by priority
  const sortedWallets = [...walletsConfig.wallets].sort((a, b) => a.priority - b.priority);

  // Try each adapter in sequence
  for (const wallet of sortedWallets) {
    try {
      let adapter: WalletAdapter;
      switch (wallet.adapter) {
        case 'PolkadotJsAdapter':
          adapter = new PolkadotJsAdapter();
          break;
        case 'TalismanAdapter':
          adapter = new TalismanAdapter();
          break;
        case 'WalletConnectAdapter':
          if (!defaultWalletConnectConfig.projectId) {
            console.warn('WalletConnect project ID not configured, skipping WalletConnect adapter');
            continue;
          }
          adapter = new WalletConnectAdapter(defaultWalletConnectConfig);
          break;
        default:
          continue; // Skip unsupported adapters
      }

      // Try to enable the wallet
      await adapter.enable();
      return adapter;
    } catch (error) {
      // Log the error but continue trying other adapters
      console.debug(`Failed to connect to ${wallet.name}:`, error);
      continue;
    }
  }

  throw new Error('No supported wallet found');
}
