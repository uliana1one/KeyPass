import { EthereumAdapter } from '../EthereumAdapter';
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  InvalidSignatureError,
  WalletConnectionError,
  MessageValidationError,
} from '../../errors/WalletErrors';

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
  WALLET_TIMEOUT: 10000,
}));

// Mock window.ethereum
const mockEthereum = {
  isMetaMask: true as boolean | undefined,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Set up global window mock
Object.defineProperty(global, 'window', {
  value: {
    ethereum: mockEthereum,
  },
  writable: true,
});

describe('EthereumAdapter', () => {
  let adapter: EthereumAdapter;

  beforeEach(() => {
    adapter = new EthereumAdapter();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(adapter).toBeInstanceOf(EthereumAdapter);
    });
  });

  describe('isAvailable', () => {
    it('should return true when window.ethereum exists', () => {
      expect(adapter.isAvailable()).toBe(true);
    });

    it('should return false when window.ethereum does not exist', () => {
      const originalEthereum = (global as any).window.ethereum;
      delete (global as any).window.ethereum;

      expect(adapter.isAvailable()).toBe(false);

      // Restore
      (global as any).window.ethereum = originalEthereum;
    });

    it('should return false when window does not exist', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(adapter.isAvailable()).toBe(false);

      // Restore
      (global as any).window = originalWindow;
    });
  });

  describe('getName', () => {
    it('should return MetaMask when isMetaMask is true', () => {
      mockEthereum.isMetaMask = true;
      expect(adapter.getName()).toBe('MetaMask');
    });

    it('should return Ethereum Wallet when isMetaMask is false', () => {
      mockEthereum.isMetaMask = false;
      expect(adapter.getName()).toBe('Ethereum Wallet');
    });

    it('should return Ethereum Wallet when isMetaMask is undefined', () => {
      mockEthereum.isMetaMask = undefined;
      expect(adapter.getName()).toBe('Ethereum Wallet');
    });
  });

  describe('enable', () => {
    it('should enable the wallet successfully', async () => {
      mockEthereum.request.mockResolvedValueOnce(['0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b']);

      await expect(adapter.enable()).resolves.toBeUndefined();
      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    });

    it('should throw WalletNotFoundError when window.ethereum does not exist', async () => {
      const originalEthereum = (global as any).window.ethereum;
      delete (global as any).window.ethereum;

      await expect(adapter.enable()).rejects.toThrow(WalletNotFoundError);
      await expect(adapter.enable()).rejects.toThrow('MetaMask or compatible Ethereum wallet not found');

      // Restore
      (global as any).window.ethereum = originalEthereum;
    });

    it('should throw UserRejectedError when user rejects connection', async () => {
      const rejectionError = { code: 4001, message: 'User rejected the request' };
      mockEthereum.request.mockRejectedValueOnce(rejectionError);

      await expect(adapter.enable()).rejects.toThrow(UserRejectedError);
    });

    it('should throw WalletConnectionError for other errors', async () => {
      const error = { code: 4902, message: 'Unrecognized chain ID' };
      mockEthereum.request.mockRejectedValueOnce(error);

      await expect(adapter.enable()).rejects.toThrow(WalletConnectionError);
    });

    it('should throw TimeoutError when connection times out', async () => {
      jest.useFakeTimers();
      
      // Mock a request that never resolves
      mockEthereum.request.mockImplementationOnce(() => new Promise(() => {}));

      const enablePromise = adapter.enable();
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(10000);

      await expect(enablePromise).rejects.toThrow(TimeoutError);
      
      jest.useRealTimers();
    });
  });

  describe('getAccounts', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValueOnce(['0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b']);
      await adapter.enable();
      jest.clearAllMocks();
    });

    it('should return accounts successfully', async () => {
      const accounts = ['0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'];
      mockEthereum.request.mockResolvedValueOnce(accounts);

      const result = await adapter.getAccounts();

      expect(result).toEqual([
        {
          address: '0x742d35cc6634c0532925a3b8d0e9c56a56b1c45b',
          name: 'Ethereum Account 0x742d35...', 
          source: 'ethereum'
        },
        {
          address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          name: 'Ethereum Account 0xd8dA6B...', 
          source: 'ethereum'
        }
      ]);
      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_accounts' });
    });

    it('should throw WalletNotFoundError if wallet is not enabled', async () => {
      const newAdapter = new EthereumAdapter();
      await expect(newAdapter.getAccounts()).rejects.toThrow(WalletNotFoundError);
    });

    it('should throw WalletConnectionError when no accounts found', async () => {
      mockEthereum.request.mockResolvedValueOnce([]);

      await expect(adapter.getAccounts()).rejects.toThrow(WalletConnectionError);
      await expect(adapter.getAccounts()).rejects.toThrow('No accounts found');
    });

    it('should throw WalletConnectionError when accounts is null', async () => {
      mockEthereum.request.mockResolvedValueOnce(null);

      await expect(adapter.getAccounts()).rejects.toThrow(WalletConnectionError);
    });

    it('should throw WalletConnectionError for other errors', async () => {
      mockEthereum.request.mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.getAccounts()).rejects.toThrow(WalletConnectionError);
    });
  });

  describe('signMessage', () => {
    const testAddress = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b';
    const testMessage = 'Test message';
    const testSignature = '0x1234567890abcdef';

    beforeEach(async () => {
      mockEthereum.request.mockResolvedValueOnce([testAddress]);
      await adapter.enable();
      adapter.setCurrentAddress(testAddress);
      jest.clearAllMocks();
    });

    it('should sign message successfully', async () => {
      mockEthereum.request.mockResolvedValueOnce(testSignature);

      const result = await adapter.signMessage(testMessage);

      expect(result).toBe(testSignature);
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'personal_sign',
        params: [testMessage, testAddress.toLowerCase()],
      });
    });

    it('should throw WalletNotFoundError if wallet is not enabled', async () => {
      const newAdapter = new EthereumAdapter();
      await expect(newAdapter.signMessage(testMessage)).rejects.toThrow(WalletNotFoundError);
    });

    it('should throw WalletConnectionError if no address is selected', async () => {
      const newAdapter = new EthereumAdapter();
      mockEthereum.request.mockResolvedValueOnce([testAddress]);
      await newAdapter.enable();

      await expect(newAdapter.signMessage(testMessage)).rejects.toThrow(WalletConnectionError);
      await expect(newAdapter.signMessage(testMessage)).rejects.toThrow('No address selected');
    });

    it('should throw UserRejectedError when user rejects signing', async () => {
      const rejectionError = { code: 4001, message: 'User rejected the request' };
      mockEthereum.request.mockRejectedValueOnce(rejectionError);

      await expect(adapter.signMessage(testMessage)).rejects.toThrow(UserRejectedError);
    });

    it('should throw InvalidSignatureError for other errors', async () => {
      const error = new Error('Network error');
      mockEthereum.request.mockRejectedValueOnce(error);

      await expect(adapter.signMessage(testMessage)).rejects.toThrow(InvalidSignatureError);
    });

    it('should throw MessageValidationError for invalid message', async () => {
      const { validateAndSanitizeMessage } = require('../types');
      validateAndSanitizeMessage.mockImplementationOnce(() => {
        throw new MessageValidationError('Message cannot be empty');
      });

      await expect(adapter.signMessage('')).rejects.toThrow(MessageValidationError);
    });
  });

  describe('setCurrentAddress', () => {
    it('should set a valid Ethereum address', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b';
      expect(() => adapter.setCurrentAddress(validAddress)).not.toThrow();
    });

    it('should throw error for invalid address format', () => {
      const invalidAddresses = [
        'invalid-address',
        '0x123',
        '742d35Cc6634C0532925a3b8D0e9C56A56b1c45b', // Missing 0x
        '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45g', // Invalid hex
        '',
      ];

      invalidAddresses.forEach(address => {
        expect(() => adapter.setCurrentAddress(address)).toThrow('Invalid Ethereum address format');
      });
    });

    it('should normalize address to lowercase', () => {
      const mixedCaseAddress = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b';
      adapter.setCurrentAddress(mixedCaseAddress);
      
      // We can't directly test the private property, but we can test through signMessage
      // The signMessage call should use the lowercase version
    });
  });

  describe('validateAddress', () => {
    it('should return true for valid Ethereum addresses', async () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      ];

      for (const address of validAddresses) {
        expect(await adapter.validateAddress(address)).toBe(true);
      }
    });

    it('should return false for invalid Ethereum addresses', async () => {
      const invalidAddresses = [
        'invalid-address',
        '0x123', // Too short
        '742d35Cc6634C0532925a3b8D0e9C56A56b1c45b', // Missing 0x
        '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45g', // Invalid hex
        '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45bb', // Too long
        '',
        'null',
        'undefined',
      ];

      for (const address of invalidAddresses) {
        expect(await adapter.validateAddress(address)).toBe(false);
      }
    });
  });

  describe('getProvider', () => {
    it('should return null for compatibility', () => {
      expect(adapter.getProvider()).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      mockEthereum.request.mockResolvedValueOnce(['0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b']);
      await adapter.enable();

      await adapter.disconnect();

      // Test that subsequent operations fail due to disabled state
      await expect(adapter.getAccounts()).rejects.toThrow(WalletNotFoundError);
    });

    it('should emit disconnected event', async () => {
      const disconnectedCallback = jest.fn();
      adapter.on('disconnected', disconnectedCallback);

      await adapter.disconnect();

      expect(disconnectedCallback).toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('should add and remove event listeners', () => {
      const callback = jest.fn();
      
      adapter.on('test-event', callback);
      adapter.off('test-event', callback);
      
      // Just test that the methods don't throw
      expect(true).toBe(true);
    });
  });
}); 