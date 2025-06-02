/// <reference types="jest" />

import { connectWallet } from '@/walletConnector';
import { PolkadotJsAdapter } from '../../adapters/PolkadotJsAdapter';
import { TalismanAdapter } from '../../adapters';
import { WalletAdapter, WalletAccount } from '../../adapters/types';
import { WalletNotFoundError, UserRejectedError } from '../../errors/WalletErrors';

// Create mock adapter implementations
class MockAdapter implements WalletAdapter {
  constructor(private shouldEnable: boolean) {}

  async enable(): Promise<void> {
    if (!this.shouldEnable) {
      throw new Error('Wallet not available');
    }
  }

  async getAccounts(): Promise<WalletAccount[]> {
    return [];
  }

  async signMessage(): Promise<string> {
    throw new Error('Not implemented');
  }

  getProvider(): string | null {
    return null;
  }

  disconnect(): void {}
}

// Mock the wallets config
jest.mock('../../config/wallets.json', () => ({
  wallets: [
    {
      id: 'polkadot-js',
      name: 'Polkadot.js',
      adapter: 'PolkadotJsAdapter',
      priority: 1
    },
    {
      id: 'talisman',
      name: 'Talisman',
      adapter: 'TalismanAdapter',
      priority: 2
    },
  ],
}));

// Mock dynamic imports
jest.mock('../../adapters/PolkadotJsAdapter', () => ({
  PolkadotJsAdapter: jest.fn().mockImplementation(() => new MockAdapter(false) as unknown as PolkadotJsAdapter),
}));

jest.mock('../../adapters/TalismanAdapter', () => ({
  TalismanAdapter: jest.fn().mockImplementation(() => new MockAdapter(true) as unknown as TalismanAdapter),
}));

describe('connectWallet()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should try each adapter in sequence', async () => {
    const adapter = await connectWallet();

    // Verify PolkadotJsAdapter was tried first
    expect(PolkadotJsAdapter).toHaveBeenCalled();

    // Verify TalismanAdapter was tried and returned
    expect(TalismanAdapter).toHaveBeenCalled();
    expect(adapter).toBeDefined();
    expect(adapter.enable).toBeDefined();
    expect(adapter.getAccounts).toBeDefined();
    expect(adapter.signMessage).toBeDefined();
  });

  it('should throw when no adapters are available', async () => {
    // Mock both adapters to fail
    jest.mocked(PolkadotJsAdapter).mockImplementation(() => new MockAdapter(false) as unknown as PolkadotJsAdapter);
    jest.mocked(TalismanAdapter).mockImplementation(() => new MockAdapter(false) as unknown as TalismanAdapter);

    await expect(connectWallet()).rejects.toThrow('No supported wallet found');

    // Verify both adapters were tried
    expect(PolkadotJsAdapter).toHaveBeenCalled();
    expect(TalismanAdapter).toHaveBeenCalled();
  });
});
