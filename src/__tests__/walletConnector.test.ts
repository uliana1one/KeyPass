import { connectWallet } from '../walletConnector';
import { PolkadotJsAdapter, TalismanAdapter } from '../adapters';

// Mock the wallets config
jest.mock('../../config/wallets.json', () => ({
  wallets: [
    {
      id: 'polkadot-js',
      name: 'Polkadot.js',
      adapter: 'PolkadotJsAdapter',
    },
    {
      id: 'talisman',
      name: 'Talisman',
      adapter: 'TalismanAdapter',
    },
  ],
}));

// Create base mock implementations
const createBaseMockAdapter = () => ({
  enable: jest.fn(),
  getAccounts: jest.fn().mockResolvedValue([]),
  signMessage: jest.fn().mockRejectedValue(new Error('Not implemented')),
});

// Mock dynamic imports
jest.mock('../adapters/PolkadotJsAdapter', () => ({
  PolkadotJsAdapter: jest.fn().mockImplementation(() => ({
    ...createBaseMockAdapter(),
    enable: jest.fn().mockRejectedValue(new Error('Polkadot.js not available')),
  })),
}));

jest.mock('../adapters/TalismanAdapter', () => ({
  TalismanAdapter: jest.fn().mockImplementation(() => ({
    ...createBaseMockAdapter(),
    enable: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('connectWallet()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should try each adapter in sequence', async () => {
    // Mock TalismanAdapter to succeed
    jest.mocked(TalismanAdapter).mockImplementation(() => ({
      ...createBaseMockAdapter(),
      enable: jest.fn().mockResolvedValue(undefined),
    }));

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
    jest.mocked(PolkadotJsAdapter).mockImplementation(() => ({
      ...createBaseMockAdapter(),
      enable: jest.fn().mockRejectedValue(new Error('Polkadot.js not available')),
    }));

    jest.mocked(TalismanAdapter).mockImplementation(() => ({
      ...createBaseMockAdapter(),
      enable: jest.fn().mockRejectedValue(new Error('Talisman not available')),
    }));

    await expect(connectWallet()).rejects.toThrow('No supported wallet found');

    // Verify both adapters were tried
    expect(PolkadotJsAdapter).toHaveBeenCalled();
    expect(TalismanAdapter).toHaveBeenCalled();
  });
});
