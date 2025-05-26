import { PolkadotJsAdapter } from '../PolkadotJsAdapter';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { hexToU8a } from '@polkadot/util';
import { InjectedWindow } from '@polkadot/extension-inject/types';
import { MessageValidationError, AddressValidationError } from '../../errors/WalletErrors';

// Mock the extension-dapp functions
jest.mock('@polkadot/extension-dapp', () => ({
  web3Accounts: jest.fn(),
  web3Enable: jest.fn(),
  web3FromAddress: jest.fn()
}));

// Mock hexToU8a so that it throws on invalid hex
jest.mock('@polkadot/util', () => ({
  hexToU8a: jest.fn((hex) => {
    if (hex === 'invalid-hex') {
      throw new Error('Invalid signature format');
    }
    return new Uint8Array(0);
  }),
  u8aToHex: jest.fn((u8a: Uint8Array) => '0x' + Array.from(u8a).map((b: number) => b.toString(16).padStart(2, '0')).join(''))
}));

// Mock the window.injectedWeb3 object
const mockInjectedWeb3 = {
  'polkadot-js': {
    version: '1.0.0',
    enable: jest.fn().mockResolvedValue(true)
  }
};

// At the top, add a mock for @polkadot/util-crypto
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn(() => true),
  checkAddress: jest.fn(() => [true, null]),
}));

// Mock the types module
jest.mock('../types', () => ({
  validateAndSanitizeMessage: jest.fn(),
  validatePolkadotAddress: jest.fn(),
  validateSignature: jest.fn(),
  validateAddress: jest.fn(),
  WALLET_TIMEOUT: 10000
}));

describe('PolkadotJsAdapter', () => {
  let adapter: PolkadotJsAdapter;
  let mockWindow: Window & Partial<InjectedWindow>;

  beforeEach(() => {
    adapter = new PolkadotJsAdapter();
    
    // Setup window mock
    mockWindow = window as Window & Partial<InjectedWindow>;
    mockWindow.injectedWeb3 = mockInjectedWeb3;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up window mock
    mockWindow.injectedWeb3 = undefined;
  });

  it('should instantiate successfully', () => {
    expect(adapter).toBeInstanceOf(PolkadotJsAdapter);
  });

  describe('enable()', () => {
    it('should enable the wallet when extension is available', async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      
      await expect(adapter.enable()).resolves.not.toThrow();
      expect(web3Enable).toHaveBeenCalledWith('KeyPass Login SDK');
      expect(adapter.getProvider()).toBe('polkadot-js');
    });

    it('should throw when extension is not installed', async () => {
      mockWindow.injectedWeb3 = undefined;
      
      await expect(adapter.enable()).rejects.toThrow('Polkadot.js wallet not found');
    });

    it('should throw when user rejects connection', async () => {
      (web3Enable as jest.Mock).mockRejectedValue(new Error('User rejected'));
      
      await expect(adapter.enable()).rejects.toThrow('User rejected wallet connection');
    });

    it('should throw on timeout', async () => {
      (web3Enable as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 11000))
      );
      
      await expect(adapter.enable()).rejects.toThrow('wallet connection timed out');
    }, 15000); // Increase timeout to 15s
  });

  describe('getAccounts()', () => {
    const mockAccounts = [
      { 
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        name: undefined,
        source: 'polkadot-js'
      },
      { 
        address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
        name: undefined,
        source: 'polkadot-js'
      }
    ];

    beforeEach(async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
    });

    it('should return accounts when available', async () => {
      (web3Accounts as jest.Mock).mockResolvedValue([
        { address: mockAccounts[0].address },
        { address: mockAccounts[1].address }
      ]);
      
      const accounts = await adapter.getAccounts();
      expect(accounts).toEqual(mockAccounts);
    });

    it('should throw when wallet is not enabled', async () => {
      const newAdapter = new PolkadotJsAdapter();
      await expect(newAdapter.getAccounts()).rejects.toThrow('Wallet not enabled');
    });

    it('should throw when user rejects account access', async () => {
      (web3Accounts as jest.Mock).mockRejectedValue(new Error('User rejected'));
      
      await expect(adapter.getAccounts()).rejects.toThrow('User rejected account access');
    });
  });

  describe('signMessage()', () => {
    const mockAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
    const mockMessage = 'Test message';
    const mockSignature = '0x' + '1'.repeat(128); // Valid hex signature format

    beforeEach(async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: mockAddress }]);
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: mockSignature })
        }
      });
      await adapter.enable();
    });

    it('should sign message successfully', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: mockSignature })
        }
      });

      const signature = await adapter.signMessage(mockMessage);
      expect(signature).toBe(mockSignature);
      expect(hexToU8a(signature)).toBeDefined(); // Verify signature format
    });

    it('should throw when wallet is not enabled', async () => {
      const newAdapter = new PolkadotJsAdapter();
      await expect(newAdapter.signMessage(mockMessage)).rejects.toThrow('Wallet not enabled');
    });

    it('should throw when no accounts are available', async () => {
      (web3Accounts as jest.Mock).mockResolvedValue([]);
      await expect(adapter.signMessage(mockMessage)).rejects.toThrow('No accounts available');
    });

    it('should throw when signer does not support raw signing', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {}
      });
      await expect(adapter.signMessage(mockMessage)).rejects.toThrow('Signer does not support raw signing');
    });

    it('should throw when user rejects signing', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockRejectedValue(new Error('User rejected'))
        }
      });
      await expect(adapter.signMessage(mockMessage)).rejects.toThrow('User rejected message signing');
    });

    it('should throw on invalid signature format', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: 'invalid-hex' })
        }
      });
      await expect(adapter.signMessage(mockMessage)).rejects.toThrow('Invalid signature format');
    });
  });

  describe('connection state', () => {
    it('should not call enable twice if already enabled', async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
      await expect(adapter.enable()).resolves.not.toThrow();
      expect(web3Enable).toHaveBeenCalledTimes(1);
    });

    it('should reset state on disconnect', async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
      adapter.disconnect();
      expect(adapter.getProvider()).toBeNull();
      // Should require enable again
      await expect(adapter.getAccounts()).rejects.toThrow('Wallet not enabled');
    });
  });

  describe('message validation', () => {
    beforeEach(async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' }]);
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: '0x' + '1'.repeat(128) })
        }
      });
      await adapter.enable();
      // Reset the mock before each test
      jest.clearAllMocks();
    });

    it('should throw on empty message', async () => {
      const { validateAndSanitizeMessage } = require('../types');
      validateAndSanitizeMessage.mockImplementation(() => {
        throw new MessageValidationError('Message cannot be empty');
      });
      await expect(adapter.signMessage('')).rejects.toThrow('Message cannot be empty');
    });

    it('should throw on too long message', async () => {
      const { validateAndSanitizeMessage } = require('../types');
      validateAndSanitizeMessage.mockImplementation(() => {
        throw new MessageValidationError('Message exceeds max length');
      });
      const longMsg = 'a'.repeat(300);
      await expect(adapter.signMessage(longMsg)).rejects.toThrow('Message exceeds max length');
    });

    it('should throw on invalid characters', async () => {
      const { validateAndSanitizeMessage } = require('../types');
      validateAndSanitizeMessage.mockImplementation(() => {
        throw new MessageValidationError('Message contains invalid characters');
      });
      await expect(adapter.signMessage('Hello\u0000World')).rejects.toThrow('Message contains invalid characters');
    });
  });

  describe('address validation', () => {
    beforeEach(async () => {
      // Enable the wallet first
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
      // Reset mocks
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw on invalid address', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Invalid Polkadot address');
      });
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: 'invalid-address' }]);
      await expect(adapter.getAccounts()).rejects.toThrow('Invalid Polkadot address');
    });

    it('should throw on invalid checksum', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Invalid address checksum or SS58 format');
      });
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: 'invalid-checksum-address' }]);
      await expect(adapter.getAccounts()).rejects.toThrow('Invalid address checksum or SS58 format');
    });
  });
});
