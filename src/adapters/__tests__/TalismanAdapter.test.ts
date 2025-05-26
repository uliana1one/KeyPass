import { TalismanAdapter } from '../TalismanAdapter';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { hexToU8a } from '@polkadot/util';
import { InjectedWindow } from '@polkadot/extension-inject/types';
import { 
  MessageValidationError, 
  AddressValidationError,
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  WalletConnectionError,
  InvalidSignatureError
} from '../../errors/WalletErrors';

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

// At the top, add a mock for @polkadot/util-crypto
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn(() => true),
  checkAddress: jest.fn(() => [true, null]),
}));

// Mock the window.injectedWeb3 object
const mockInjectedWeb3 = {
  'talisman': {
    version: '1.0.0',
    enable: jest.fn().mockResolvedValue(true)
  },
  'wallet-connect': {
    version: '1.0.0',
    enable: jest.fn().mockResolvedValue(true)
  }
};

// Mock the types module
jest.mock('../types', () => ({
  validateAndSanitizeMessage: jest.fn(),
  validatePolkadotAddress: jest.fn(),
  validateSignature: jest.fn(),
  validateAddress: jest.fn(),
  WALLET_TIMEOUT: 10000
}));

describe('TalismanAdapter', () => {
  let adapter: TalismanAdapter;
  let mockWindow: Window & Partial<InjectedWindow>;

  beforeEach(() => {
    adapter = new TalismanAdapter();
    
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
    expect(adapter).toBeInstanceOf(TalismanAdapter);
  });

  describe('enable()', () => {
    it('should enable Talisman wallet when available', async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await expect(adapter.enable()).resolves.not.toThrow();
      expect(web3Enable).toHaveBeenCalledWith('KeyPass Login SDK');
      expect(adapter.getProvider()).toBe('talisman');
    });

    it('should fallback to WalletConnect when Talisman is not available', async () => {
      // Mock only WalletConnect being available
      mockWindow.injectedWeb3 = {
        'wallet-connect': {
          version: '1.0.0',
          enable: jest.fn().mockResolvedValue(true)
        }
      };
      (web3Enable as jest.Mock).mockResolvedValue(true);
      
      await expect(adapter.enable()).resolves.not.toThrow();
      expect(web3Enable).toHaveBeenCalledWith('KeyPass Login SDK');
      expect(adapter.getProvider()).toBe('wallet-connect');
    });

    it('should throw when no wallet is available', async () => {
      mockWindow.injectedWeb3 = {};
      const error = await adapter.enable().catch(e => e);
      expect(error).toBeInstanceOf(WalletNotFoundError);
      expect(error.message).toBe('Talisman wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });

    it('should throw on timeout with Talisman', async () => {
      (web3Enable as jest.Mock).mockImplementation(() => new Promise(() => {}));
      const error = await adapter.enable().catch(e => e);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe('wallet connection timed out');
      expect(error.code).toBe('OPERATION_TIMEOUT');
    }, 15000);

    it('should throw on timeout with WalletConnect fallback', async () => {
      // Mock only WalletConnect being available
      mockWindow.injectedWeb3 = {
        'wallet-connect': {
          version: '1.0.0',
          enable: jest.fn().mockResolvedValue(true)
        }
      };
      (web3Enable as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      const error = await adapter.enable().catch(e => e);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe('wallet connection timed out');
      expect(error.code).toBe('OPERATION_TIMEOUT');
    }, 15000);

    it('should throw on user rejection with Talisman', async () => {
      (web3Enable as jest.Mock).mockRejectedValue(new Error('User rejected'));
      const error = await adapter.enable().catch(e => e);
      expect(error).toBeInstanceOf(UserRejectedError);
      expect(error.message).toBe('User rejected wallet connection');
      expect(error.code).toBe('USER_REJECTED');
    });

    it('should throw on user rejection with WalletConnect fallback', async () => {
      // Mock only WalletConnect being available
      mockWindow.injectedWeb3 = {
        'wallet-connect': {
          version: '1.0.0',
          enable: jest.fn().mockResolvedValue(true)
        }
      };
      (web3Enable as jest.Mock).mockRejectedValue(new Error('User rejected'));
      
      const error = await adapter.enable().catch(e => e);
      expect(error).toBeInstanceOf(UserRejectedError);
      expect(error.message).toBe('User rejected wallet connection');
      expect(error.code).toBe('USER_REJECTED');
    });

    it('should prefer Talisman over WalletConnect when both are available', async () => {
      // Mock both providers being available
      mockWindow.injectedWeb3 = {
        'talisman': {
          version: '1.0.0',
          enable: jest.fn().mockResolvedValue(true)
        },
        'wallet-connect': {
          version: '1.0.0',
          enable: jest.fn().mockResolvedValue(true)
        }
      };
      (web3Enable as jest.Mock).mockResolvedValue(true);
      
      await expect(adapter.enable()).resolves.not.toThrow();
      expect(adapter.getProvider()).toBe('talisman');
    });
  });

  describe('getAccounts()', () => {
    const mockAccounts = [
      { 
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        name: undefined,
        source: 'talisman'
      },
      { 
        address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
        name: undefined,
        source: 'talisman'
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
      const newAdapter = new TalismanAdapter();
      const error = await newAdapter.getAccounts().catch(e => e);
      expect(error).toBeInstanceOf(WalletNotFoundError);
      expect(error.message).toBe('Wallet wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });

    it('should throw when no accounts are found', async () => {
      (web3Accounts as jest.Mock).mockResolvedValue([]);
      
      const error = await adapter.getAccounts().catch(e => e);
      expect(error).toBeInstanceOf(WalletConnectionError);
      expect(error.message).toBe('No accounts found');
      expect(error.code).toBe('CONNECTION_FAILED');
    });

    it('should throw when user rejects account access', async () => {
      (web3Accounts as jest.Mock).mockRejectedValue(new Error('User rejected'));
      
      const error = await adapter.getAccounts().catch(e => e);
      expect(error).toBeInstanceOf(UserRejectedError);
      expect(error.message).toBe('User rejected account access');
      expect(error.code).toBe('USER_REJECTED');
    });
  });

  describe('signMessage()', () => {
    const mockMessage = 'Test message';
    const mockAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

    beforeEach(async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: mockAddress }]);
      await adapter.enable();
    });

    it('should sign message successfully', async () => {
      const mockSignature = '0x1234';
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: mockSignature })
        }
      });

      const signature = await adapter.signMessage(mockMessage);
      expect(signature).toBe(mockSignature);
    });

    it('should throw when wallet is not enabled', async () => {
      const newAdapter = new TalismanAdapter();
      const error = await newAdapter.signMessage(mockMessage).catch(e => e);
      expect(error).toBeInstanceOf(WalletNotFoundError);
      expect(error.message).toBe('Wallet wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });

    it('should throw when no accounts are available', async () => {
      (web3Accounts as jest.Mock).mockResolvedValue([]);
      const error = await adapter.signMessage(mockMessage).catch(e => e);
      expect(error).toBeInstanceOf(WalletConnectionError);
      expect(error.message).toBe('Failed to sign message: No accounts found');
      expect(error.code).toBe('CONNECTION_FAILED');
    });

    it('should throw when signer does not support raw signing', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({ signer: {} });
      const error = await adapter.signMessage(mockMessage).catch(e => e);
      expect(error).toBeInstanceOf(WalletConnectionError);
      expect(error.message).toBe('Failed to sign message: Signer does not support raw signing');
      expect(error.code).toBe('CONNECTION_FAILED');
    });

    it('should throw when user rejects signing', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockRejectedValue(new Error('User rejected'))
        }
      });
      
      const error = await adapter.signMessage(mockMessage).catch(e => e);
      expect(error).toBeInstanceOf(UserRejectedError);
      expect(error.message).toBe('User rejected message signing');
      expect(error.code).toBe('USER_REJECTED');
    });

    it('should throw on invalid signature format', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: 'invalid-hex' })
        }
      });
      
      const error = await adapter.signMessage(mockMessage).catch(e => e);
      expect(error).toBeInstanceOf(InvalidSignatureError);
      expect(error.code).toBe('INVALID_SIGNATURE');
    });

    it('should throw on signing timeout', async () => {
      // Mock web3FromAddress to return a valid injector
      const mockInjector = {
        signer: {
          signRaw: jest.fn().mockImplementation(() => new Promise(() => {}))
        }
      };
      const mockWeb3FromAddress = jest.fn().mockResolvedValue(mockInjector);
      require('@polkadot/extension-dapp').web3FromAddress = mockWeb3FromAddress;
      // Mock setTimeout to immediately call the timeout callback
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        if (delay === 10000) {
          Promise.resolve().then(callback);
        }
        return 1;
      }) as unknown as typeof setTimeout;
      try {
        await expect(adapter.signMessage(mockMessage)).rejects.toThrow('message signing timed out');
      } finally {
        global.setTimeout = originalSetTimeout;
      }
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
      await adapter.enable();
      expect(adapter.getProvider()).toBe('talisman');
      adapter.disconnect();
      expect(adapter.getProvider()).toBeNull();
      await expect(adapter.getAccounts()).rejects.toThrow('Wallet wallet not found');
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
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw on invalid address', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new AddressValidationError('Invalid Polkadot address');
      });
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: 'invalid-address' }]);
      
      const error = await adapter.getAccounts().catch(e => e);
      expect(error).toBeInstanceOf(AddressValidationError);
      expect(error.message).toBe('Invalid Polkadot address');
      expect(error.code).toBe('ADDRESS_VALIDATION_ERROR');
    });

    it('should throw on invalid checksum', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new AddressValidationError('Invalid address checksum or SS58 format');
      });
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: 'invalid-checksum-address' }]);
      
      const error = await adapter.getAccounts().catch(e => e);
      expect(error).toBeInstanceOf(AddressValidationError);
      expect(error.message).toBe('Invalid address checksum or SS58 format');
      expect(error.code).toBe('ADDRESS_VALIDATION_ERROR');
    });
  });
});
