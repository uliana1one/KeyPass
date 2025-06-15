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

// At the top, add a mock for @polkadot/util-crypto
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn(() => true),
  checkAddress: jest.fn(() => [true, null]),
}));

// Mock the window.injectedWeb3 object
const mockInjectedWeb3 = {
  talisman: {
    version: '1.0.0',
    enable: jest.fn().mockResolvedValue(true),
  },
  'wallet-connect': {
    version: '1.0.0',
    enable: jest.fn().mockResolvedValue(true),
  },
};

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

  describe('enable', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should enable the Talisman extension', async () => {
      (web3Enable as jest.Mock).mockResolvedValueOnce(true);
      await expect(adapter.enable()).resolves.not.toThrow();
      expect(web3Enable).toHaveBeenCalledWith('KeyPass Login SDK');
    });

    it('should throw WalletNotFoundError if extension is not available', async () => {
      (web3Enable as jest.Mock).mockRejectedValueOnce(new Error('Extension not found'));
      await expect(adapter.enable()).rejects.toThrow(WalletNotFoundError);
    });

    it('should throw UserRejectedError if user rejects the connection', async () => {
      (web3Enable as jest.Mock).mockRejectedValueOnce(new Error('User rejected'));
      const error = await adapter.enable().catch((e) => e);
      expect(error).toBeInstanceOf(UserRejectedError);
      expect(error.message).toBe('User rejected wallet connection');
      expect(error.code).toBe('USER_REJECTED');
    });
  });

  describe('getAccounts', () => {
    const validAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
    
    beforeEach(async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
      jest.clearAllMocks();
    });

    it('should throw WalletNotFoundError if wallet is not enabled', async () => {
      const newAdapter = new TalismanAdapter();
      const error = await newAdapter.getAccounts().catch((e) => e);
      expect(error).toBeInstanceOf(WalletNotFoundError);
      expect(error.message).toBe('Wallet wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });

    it('should throw AddressValidationError for invalid addresses', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new AddressValidationError('Invalid Polkadot address format');
      });
      (web3Accounts as jest.Mock).mockResolvedValueOnce([{ address: 'invalid-address' }]);

      const error = await adapter.getAccounts().catch((e) => e);
      expect(error).toBeInstanceOf(AddressValidationError);
      expect(error.message).toBe('Invalid Polkadot address');
      expect(error.code).toBe('INVALID_ADDRESS');
    });

    it('should return valid accounts', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {});
      (web3Accounts as jest.Mock).mockResolvedValueOnce([{ address: validAddress }]);

      const accounts = await adapter.getAccounts();
      expect(accounts).toEqual([{ address: validAddress, name: undefined, source: 'talisman' }]);
    });
  });

  describe('signMessage', () => {
    const testMessage = 'Test message';
    const validAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
    const mockExtension = {
      signer: {
        signRaw: jest.fn(),
      },
    };

    beforeEach(async () => {
      // Mock validatePolkadotAddress to pass validation
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {});
      
      // Mock web3Enable and web3Accounts
      (web3Enable as jest.Mock).mockResolvedValue(true);
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: validAddress }]);
      (web3FromAddress as jest.Mock).mockResolvedValue(mockExtension);
      
      await adapter.enable();
      jest.clearAllMocks();
    });

    it('should throw WalletNotFoundError if wallet is not enabled', async () => {
      const newAdapter = new TalismanAdapter();
      const error = await newAdapter.signMessage(testMessage).catch((e) => e);
      expect(error).toBeInstanceOf(WalletNotFoundError);
      expect(error.message).toBe('Wallet not enabled wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });

    it('should sign a message successfully', async () => {
      const mockSignature = '0x' + '1'.repeat(128);
      mockExtension.signer.signRaw.mockResolvedValueOnce({ signature: mockSignature });

      const signature = await adapter.signMessage(testMessage);
      expect(signature).toBe(mockSignature);
      expect(mockExtension.signer.signRaw).toHaveBeenCalledWith({
        address: validAddress,
        data: expect.any(String),
        type: 'bytes',
      });
    });

    it('should throw UserRejectedError if user rejects signing', async () => {
      mockExtension.signer.signRaw.mockRejectedValueOnce(new Error('User rejected'));

      const error = await adapter.signMessage(testMessage).catch((e) => e);
      expect(error).toBeInstanceOf(UserRejectedError);
      expect(error.message).toBe('User rejected message signing');
      expect(error.code).toBe('USER_REJECTED');
    });
  });

  describe('validateAddress', () => {
    const validAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

    beforeEach(async () => {
      (web3Enable as jest.Mock).mockResolvedValue(true);
      await adapter.enable();
      jest.clearAllMocks();
    });

    it('should validate a correct Polkadot address', async () => {
      const { validatePolkadotAddress } = require('../types');
      // Mock the actual implementation to not throw
      validatePolkadotAddress.mockImplementation(() => {});
      
      const result = await adapter.validateAddress(validAddress);
      expect(result).toBe(true);
    });

    it('should throw AddressValidationError for invalid addresses', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new AddressValidationError('Invalid Polkadot address format');
      });

      const error = await adapter.validateAddress('invalid-address').catch((e) => e);
      expect(error).toBeInstanceOf(AddressValidationError);
      expect(error.message).toBe('Invalid Polkadot address');
      expect(error.code).toBe('INVALID_ADDRESS');
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
      (web3Accounts as jest.Mock).mockResolvedValue([
        { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' },
      ]);
      (web3FromAddress as jest.Mock).mockResolvedValue({
        signer: {
          signRaw: jest.fn().mockResolvedValue({ signature: '0x' + '1'.repeat(128) }),
        },
      });
      await adapter.enable();
      // Reset all mocks
      jest.clearAllMocks();
    });

    it('should throw on empty message', async () => {
      await expect(adapter.signMessage('')).rejects.toThrow('Message cannot be empty');
    });

    it('should throw on too long message', async () => {
      const longMsg = 'a'.repeat(300);
      await expect(adapter.signMessage(longMsg)).rejects.toThrow('Message exceeds max length');
    });

    it('should throw on invalid characters', async () => {
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
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: 'invalid-address' }]);

      const error = await adapter.getAccounts().catch((e) => e);
      expect(error).toBeInstanceOf(AddressValidationError);
      expect(error.message).toBe('Invalid Polkadot address');
      expect(error.code).toBe('INVALID_ADDRESS');
    });

    it('should throw on invalid checksum', async () => {
      const { validatePolkadotAddress } = require('../types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new AddressValidationError('Invalid Polkadot address');
      });
      (web3Accounts as jest.Mock).mockResolvedValue([{ address: 'invalid-checksum-address' }]);

      const error = await adapter.getAccounts().catch((e) => e);
      expect(error).toBeInstanceOf(AddressValidationError);
      expect(error.message).toBe('Invalid Polkadot address');
      expect(error.code).toBe('INVALID_ADDRESS');
    });
  });
});
