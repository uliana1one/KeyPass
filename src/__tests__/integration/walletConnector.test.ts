/// <reference types="jest" />

// Mock the validator using a factory function to avoid hoisting issues
const createValidatorMock = (shouldThrow = false) => {
  const { ConfigurationError } = require('../../errors/WalletErrors');
  return {
    validateWalletConfig: () => {
      if (shouldThrow) {
        throw new ConfigurationError('Invalid wallet configuration');
      }
    }
  };
};

// Mock dynamic imports
jest.mock('../../adapters/PolkadotJsAdapter', () => ({
  PolkadotJsAdapter: jest.fn().mockImplementation(() => new MockAdapter(false))
}));

jest.mock('../../adapters/TalismanAdapter', () => ({
  TalismanAdapter: jest.fn().mockImplementation(() => new MockAdapter(false))
}));

jest.mock('../../adapters/WalletConnectAdapter', () => ({
  WalletConnectAdapter: jest.fn().mockImplementation(() => new MockAdapter(false))
}));

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
    {
      id: 'wallet-connect',
      name: 'WalletConnect',
      adapter: 'WalletConnectAdapter',
      priority: 3
    }
  ]
}));

// Mock the validator
jest.mock('../../config/validator', () => ({
  validateWalletConfig: () => {} // Never throw
}));

// Mock console.error
const originalConsoleError = console.error;
console.error = jest.fn();

import { connectWallet } from '@/walletConnector';
import { PolkadotJsAdapter } from '../../adapters/PolkadotJsAdapter';
import { TalismanAdapter } from '../../adapters';
import { WalletConnectAdapter } from '../../adapters/WalletConnectAdapter';
import { WalletAdapter, WalletAccount } from '../../adapters/types';
import { WalletNotFoundError, UserRejectedError, ConfigurationError } from '../../errors/WalletErrors';

// Create mock adapter implementations
class MockAdapter implements WalletAdapter {
  enabled = false;
  provider: any = null;
  connectionTimeout = 15000;

  constructor(private shouldEnable: boolean) {}

  async enable(): Promise<void> {
    if (!this.shouldEnable) {
      throw new Error('Wallet not available');
    }
    this.enabled = true;
  }

  async getAccounts(): Promise<WalletAccount[]> {
    return [];
  }

  async signMessage(): Promise<string> {
    throw new Error('Not implemented');
  }

  getProvider(): string | null {
    return this.provider;
  }

  disconnect(): void {
    this.enabled = false;
    this.provider = null;
  }

  async validateAddress(address: string): Promise<boolean> {
    return true;
  }

  async enableProvider(): Promise<void> {
    if (!this.shouldEnable) {
      throw new Error('Provider not available');
    }
  }
}

// Mock process.env
const originalEnv = process.env;
beforeAll(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

// Configuration validation tests in a separate describe block
describe('Wallet Configuration Validation', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should handle configuration validation error', async () => {
    // Override the validator mock for this specific test
    jest.mock('../../config/validator', () => createValidatorMock(true), { virtual: true });
    
    await expect(async () => {
      await jest.isolateModulesAsync(async () => {
        await import('../../walletConnector');
      });
    }).rejects.toThrow('Invalid wallet configuration');

    expect(console.error).toHaveBeenCalledWith(
      'Invalid wallet configuration:',
      'Invalid wallet configuration'
    );
  });
});

describe('connectWallet()', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should try each adapter in sequence', async () => {
    // Mock PolkadotJs to fail and Talisman to succeed
    jest.mocked(PolkadotJsAdapter).mockImplementation(() => new MockAdapter(false) as unknown as PolkadotJsAdapter);
    jest.mocked(TalismanAdapter).mockImplementation(() => new MockAdapter(true) as unknown as TalismanAdapter);

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

// Restore console.error at the end of all tests
afterAll(() => {
  console.error = originalConsoleError;
});
