import { ConfigurationError } from '../errors/WalletErrors';

export interface WalletConfig {
  id: string;
  name: string;
  adapter: string;
  icon?: string;
  description?: string;
  priority?: number;
}

export interface WalletsConfig {
  wallets: WalletConfig[];
}

export function validateWalletConfig(config: unknown): asserts config is WalletsConfig {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Invalid wallet configuration: must be an object');
  }

  const walletsConfig = config as WalletsConfig;
  
  if (!Array.isArray(walletsConfig.wallets)) {
    throw new ConfigurationError('Invalid wallet configuration: wallets must be an array');
  }

  if (walletsConfig.wallets.length === 0) {
    throw new ConfigurationError('Invalid wallet configuration: no wallets defined');
  }

  const seenIds = new Set<string>();
  const seenAdapters = new Set<string>();

  walletsConfig.wallets.forEach((wallet, index) => {
    // Required fields
    if (!wallet.id || typeof wallet.id !== 'string') {
      throw new ConfigurationError(`Invalid wallet at index ${index}: missing or invalid id`);
    }
    if (!wallet.name || typeof wallet.name !== 'string') {
      throw new ConfigurationError(`Invalid wallet at index ${index}: missing or invalid name`);
    }
    if (!wallet.adapter || typeof wallet.adapter !== 'string') {
      throw new ConfigurationError(`Invalid wallet at index ${index}: missing or invalid adapter`);
    }

    // Optional fields
    if (wallet.icon !== undefined && typeof wallet.icon !== 'string') {
      throw new ConfigurationError(`Invalid wallet at index ${index}: icon must be a string`);
    }
    if (wallet.description !== undefined && typeof wallet.description !== 'string') {
      throw new ConfigurationError(`Invalid wallet at index ${index}: description must be a string`);
    }
    if (wallet.priority !== undefined && typeof wallet.priority !== 'number') {
      throw new ConfigurationError(`Invalid wallet at index ${index}: priority must be a number`);
    }

    // Check for duplicates
    if (seenIds.has(wallet.id)) {
      throw new ConfigurationError(`Duplicate wallet id: ${wallet.id}`);
    }
    if (seenAdapters.has(wallet.adapter)) {
      throw new ConfigurationError(`Duplicate adapter: ${wallet.adapter}`);
    }

    seenIds.add(wallet.id);
    seenAdapters.add(wallet.adapter);
  });

  // Sort wallets by priority if specified
  if (walletsConfig.wallets.some(w => w.priority !== undefined)) {
    walletsConfig.wallets.sort((a, b) => {
      const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER;
      return priorityA - priorityB;
    });
  }
} 