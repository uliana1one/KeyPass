import { ConfigurationError } from '../errors/WalletErrors';

const VALID_ADAPTERS = ['PolkadotJsAdapter', 'TalismanAdapter', 'WalletConnectAdapter'] as const;
const MIN_PRIORITY = 1;
const MAX_PRIORITY = 100;

export interface WalletConfig {
  id: string;
  name: string;
  adapter: string;
  icon?: string;
  description?: string;
  priority: number;
}

export interface WalletsConfig {
  wallets: WalletConfig[];
}

export function validateWalletConfig(config: WalletConfiguration): void {
  if (!config.wallets || !Array.isArray(config.wallets)) {
    throw new ConfigurationError('Wallets configuration must be an array');
  }

  if (config.wallets.length === 0) {
    throw new ConfigurationError('At least one wallet must be configured');
  }

  // Track used priorities and IDs
  const usedPriorities = new Set<number>();
  const usedIds = new Set<string>();

  for (const wallet of config.wallets) {
    // Validate required fields
    if (!wallet.id || typeof wallet.id !== 'string') {
      throw new ConfigurationError('Wallet ID must be a non-empty string');
    }
    if (!wallet.name || typeof wallet.name !== 'string') {
      throw new ConfigurationError('Wallet name must be a non-empty string');
    }
    if (!wallet.adapter || typeof wallet.adapter !== 'string') {
      throw new ConfigurationError('Wallet adapter must be a non-empty string');
    }
    if (typeof wallet.priority !== 'number' || !Number.isInteger(wallet.priority)) {
      throw new ConfigurationError('Wallet priority must be an integer');
    }

    // Validate adapter name
    if (!VALID_ADAPTERS.includes(wallet.adapter as any)) {
      throw new ConfigurationError(`Invalid adapter name: ${wallet.adapter}. Must be one of: ${VALID_ADAPTERS.join(', ')}`);
    }

    // Validate priority range
    if (wallet.priority < MIN_PRIORITY || wallet.priority > MAX_PRIORITY) {
      throw new ConfigurationError(`Wallet priority must be between ${MIN_PRIORITY} and ${MAX_PRIORITY}`);
    }

    // Check for duplicate IDs
    if (usedIds.has(wallet.id)) {
      throw new ConfigurationError(`Duplicate wallet ID: ${wallet.id}`);
    }
    usedIds.add(wallet.id);

    // Check for duplicate priorities
    if (usedPriorities.has(wallet.priority)) {
      throw new ConfigurationError(`Duplicate wallet priority: ${wallet.priority}`);
    }
    usedPriorities.add(wallet.priority);
  }

  // Validate priority ordering
  const sortedWallets = [...config.wallets].sort((a, b) => a.priority - b.priority);
  if (JSON.stringify(sortedWallets) !== JSON.stringify(config.wallets)) {
    throw new ConfigurationError('Wallets must be ordered by priority');
  }
} 