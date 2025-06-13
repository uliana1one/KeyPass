import { PolkadotJsAdapter } from '../PolkadotJsAdapter';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { hexToU8a } from '@polkadot/util';
import { InjectedWindow } from '@polkadot/extension-inject/types';
import { MessageValidationError, AddressValidationError } from '../../errors/WalletErrors';
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  WalletConnectionError,
  InvalidSignatureError,
} from '../../errors/WalletErrors';

// Mock the extension-dapp functions
jest.mock('@polkadot/extension-dapp', () => ({
  web3Accounts: jest.fn(),
  web3Enable: jest.fn(),
  web3FromAddress: jest.fn(),
}));

// Mock hexToU8a so that it throws on invalid hex
jest.mock('@polkadot/util', () => ({
  hexToU8a: jest.fn((hex) => {
    if (hex === 'invalid-hex') {
      throw new Error('Invalid signature format');
    }
    return new Uint8Array(0);
  }),
  u8aToHex: jest.fn(
    (u8a: Uint8Array) =>
      '0x' +
      Array.from(u8a)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('')
  ),
}));

// Mock the window.injectedWeb3 object
const mockInjectedWeb3 = {
  'polkadot-js': {
    version: '1.0.0',
    enable: jest.fn().mockResolvedValue(true),
  },
};

// At the top, add a mock for @polkadot/util-crypto
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn(() => true),
  checkAddress: jest.fn(() => [true, null]),
}));

// Mock the types module
jest.mock('../types', () => ({
  validateAndSanitizeMessage: jest.fn((message) => {
    if (!message || message === '') {
      throw new MessageValidationError('Message cannot be empty');
    }
    if (message.length > 256) {
      throw new MessageValidationError('Message exceeds max length');
    }
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(message)) {
      throw new MessageValidationError('Message contains invalid characters');
    }
    return message.trim();
  }),
  validatePolkadotAddress: jest.fn((address) => {
    if (!address || typeof address !== 'string') {
      throw new AddressValidationError('Address must be a non-empty string');
    }
    if (address === 'invalid-address') {
      throw new AddressValidationError('Invalid Polkadot address');
    }
    if (address === 'invalid-checksum-address') {
      throw new AddressValidationError('Invalid address checksum or SS58 format');
    }
    return true;
  }),
  validateSignature: jest.fn((signature) => {
    if (!signature || typeof signature !== 'string') {
      throw new InvalidSignatureError('Invalid signature format');
    }
    if (signature === 'invalid-hex') {
      throw new InvalidSignatureError('Invalid signature format');
    }
    if (!signature.startsWith('0x')) {
      throw new InvalidSignatureError('Invalid signature format: missing 0x prefix');
    }
    if (signature.length !== 130 && signature.length !== 66) {
      throw new InvalidSignatureError(
        'Invalid signature length: must be 0x + 128 hex chars (sr25519) or 0x + 64 hex chars (ed25519)'
      );
    }
    if (!/^0x[0-9a-fA-F]+$/.test(signature)) {
      throw new InvalidSignatureError('Invalid signature format: contains invalid hex characters');
    }
  }),
  validateAddress: jest.fn(),
  WALLET_TIMEOUT: 10000,
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
      const error = await adapter.enable().catch((e) => e);
      expect(error).toBeInstanceOf(WalletNotFoundError);
      expect(error.message).toBe('Polkadot.js wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });

    it('should throw when user rejects connection', async () => {
      (web3Enable as jest.Mock).mockRejectedValue(new Error('User rejected'));
      const error = await adapter.enable().catch((e) => e);
      expect(error).toBeInstanceOf(UserRejectedError);
      expect(error.message).toBe('User rejected wallet connection');
      expect(error.code).toBe('USER_REJECTED');
    });

    it('should throw on timeout', async () => {
      (web3Enable as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 11000))
      );
      const error = await adapter.enable().catch((e) => e);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe('wallet connection timed out');
      expect(error.code).toBe('OPERATION_TIMEOUT');
    }, 15000);
  });

  describe('getAccounts()', () => {
    const mockAccounts = [
      {
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        name: undefined,
        source: 'polkadot-js',
      },
      {
        address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
        name: undefined,
        source: 'polkadot-js',
      },
    ];

    beforeEach(async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
    });

    it('should return accounts when available', async () => {
      (web3Accounts as jest.Mock).mockResolvedValue([
        { address: mockAccounts[0].address },
        { address: mockAccounts[1].address },
      ]);

      const accounts = await adapter.getAccounts();
      expect(accounts).toEqual(mockAccounts);
    });

    it('should throw when wallet is not enabled', async () => {
      const newAdapter = new PolkadotJsAdapter();
      const error = await newAdapter.getAccounts().catch((e) => e);
      expect(error).toBeInstanceOf(WalletNotFoundError);
      expect(error.message).toBe('Wallet not enabled wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });

    it('should throw when no accounts are found', async () => {
      (web3Accounts as jest.Mock).mockResolvedValue([]);

      const error = await adapter.getAccounts().catch((e) => e);
      expect(error).toBeInstanceOf(WalletConnectionError);
      expect(error.message).toBe('No accounts found');
      expect(error.code).toBe('CONNECTION_FAILED');
    });

    it('should throw when user rejects account access', async () => {
      (web3Accounts as jest.Mock).mockRejectedValue(new Error('User rejected'));

      const error = await adapter.getAccounts().catch((e) => e);
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
      const mockSignature = '0x' + '1'.repeat(128); // Valid sr25519 signature length
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: mockSignature }),
        },
      });

      const signature = await adapter.signMessage(mockMessage);
      expect(signature).toBe(mockSignature);
    });

    it('should throw when wallet is not enabled', async () => {
      const newAdapter = new PolkadotJsAdapter();
      const error = await newAdapter.signMessage(mockMessage).catch((e) => e);
      expect(error).toBeInstanceOf(WalletNotFoundError);
      expect(error.message).toBe('Wallet not enabled wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });

    it('should throw when no accounts are available', async () => {
      (web3Accounts as jest.Mock).mockResolvedValue([]);
      const error = await adapter.signMessage(mockMessage).catch((e) => e);
      expect(error).toBeInstanceOf(WalletConnectionError);
      expect(error.message).toBe('Failed to sign message: No accounts found');
      expect(error.code).toBe('CONNECTION_FAILED');
    });

    it('should throw when signer does not support raw signing', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({ signer: {} });
      const error = await adapter.signMessage(mockMessage).catch((e) => e);
      expect(error).toBeInstanceOf(WalletConnectionError);
      expect(error.message).toBe('Failed to sign message: Signer does not support raw signing');
      expect(error.code).toBe('CONNECTION_FAILED');
    });

    it('should throw when user rejects signing', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockRejectedValue(new Error('User rejected')),
        },
      });

      const error = await adapter.signMessage(mockMessage).catch((e) => e);
      expect(error).toBeInstanceOf(UserRejectedError);
      expect(error.message).toBe('User rejected message signing');
      expect(error.code).toBe('USER_REJECTED');
    });

    it('should throw on invalid signature format', async () => {
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: 'invalid-hex' }),
        },
      });

      const error = await adapter.signMessage(mockMessage).catch((e) => e);
      expect(error).toBeInstanceOf(InvalidSignatureError);
      expect(error.code).toBe('INVALID_SIGNATURE');
    });

    it('should throw on signing timeout', async () => {
      // Mock web3FromAddress to return a valid injector
      const mockInjector = {
        signer: {
          signRaw: jest.fn().mockImplementation(() => new Promise(() => {})),
        },
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
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
      adapter.disconnect();
      expect(adapter.getProvider()).toBeNull();
      // Should require enable again
      await expect(adapter.getAccounts()).rejects.toThrow('Wallet not enabled wallet not found');
    });
  });

  describe('message validation', () => {
    beforeEach(async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      (web3Accounts as jest.Mock).mockResolvedValue([
        { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' },
      ]);
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: '0x' + '1'.repeat(128) }),
        },
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
      await expect(adapter.signMessage('Hello\u0000World')).rejects.toThrow(
        'Message contains invalid characters'
      );
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

      // Mock web3Accounts to return an array with an invalid address
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: 'invalid-address' }]);

      // Check both the error type and properties in a single expect
      await expect(adapter.getAccounts()).rejects.toMatchObject({
        name: 'AddressValidationError',
        message: 'Invalid Polkadot address',
        code: 'INVALID_ADDRESS'
      });
    });

    it('should throw on invalid checksum', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new AddressValidationError('Invalid address checksum or SS58 format');
      });

      // Mock web3Accounts to return an array with an invalid checksum address
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: 'invalid-checksum-address' }]);

      // Check both the error type and properties in a single expect
      await expect(adapter.getAccounts()).rejects.toMatchObject({
        name: 'AddressValidationError',
        message: 'Invalid address checksum or SS58 format',
        code: 'INVALID_ADDRESS'
      });
    });
  });
});
