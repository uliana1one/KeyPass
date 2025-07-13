import { loginWithEthereum } from '../index';
import { EthereumAdapter } from '../adapters/EthereumAdapter';
import { EthereumDIDProvider } from '../did/EthereumDIDProvider';
import { buildLoginMessage } from '../message/messageBuilder';
import {
  WalletNotFoundError,
  UserRejectedError,
  WalletConnectionError,
  AddressValidationError,
} from '../errors/WalletErrors';

// Mock all dependencies
jest.mock('../adapters/EthereumAdapter');
jest.mock('../did/EthereumDIDProvider');
jest.mock('../message/messageBuilder');

// Mock message format
jest.mock('../../config/messageFormat.json', () => ({
  template: 'KeyPass Login\nIssued At: {{issuedAt}}\nNonce: {{nonce}}\nAddress: {{address}}'
}));

describe('loginWithEthereum', () => {
  const mockAdapter = {
    enable: jest.fn(),
    getAccounts: jest.fn(),
    setCurrentAddress: jest.fn(),
    signMessage: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockDIDProvider = {
    createDid: jest.fn(),
  };

  const mockAccount = {
    address: '0x742d35cc6634c0532925a3b8d0e9c56a56b1c45b',
    name: 'Test Account',
    source: 'ethereum',
  };

  const mockSignature = '0x1234567890abcdef';
  const mockDID = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock constructors
    (EthereumAdapter as jest.MockedClass<typeof EthereumAdapter>).mockImplementation(() => mockAdapter as any);
    (EthereumDIDProvider as jest.MockedClass<typeof EthereumDIDProvider>).mockImplementation(() => mockDIDProvider as any);
    
    // Mock successful flow by default
    mockAdapter.enable.mockResolvedValue(undefined);
    mockAdapter.getAccounts.mockResolvedValue([mockAccount]);
    mockAdapter.setCurrentAddress.mockImplementation(() => {});
    mockAdapter.signMessage.mockResolvedValue(mockSignature);
    mockAdapter.disconnect.mockResolvedValue(undefined);
    mockDIDProvider.createDid.mockResolvedValue(mockDID);
    
    // Mock buildLoginMessage to return a message with the provided nonce
    (buildLoginMessage as jest.Mock).mockImplementation((params) => {
      return Promise.resolve(`KeyPass Login\nIssued At: ${params.issuedAt}\nNonce: ${params.nonce}\nAddress: ${params.address}`);
    });

    // Mock Date
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T00:00:00.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful login flow', () => {
    it('should complete the full login flow successfully', async () => {
      const result = await loginWithEthereum();

      expect(result).toMatchObject({
        address: mockAccount.address,
        signature: mockSignature,
        did: mockDID,
        issuedAt: '2023-01-01T00:00:00.000Z',
      });
      
      // Check that nonce is a valid UUID format
      expect(result.nonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.message).toBeDefined();
    });

    it('should call all adapter methods in correct order', async () => {
      await loginWithEthereum();

      expect(mockAdapter.enable).toHaveBeenCalled();
      expect(mockAdapter.getAccounts).toHaveBeenCalled();
      expect(mockAdapter.setCurrentAddress).toHaveBeenCalledWith(mockAccount.address);
      expect(mockAdapter.signMessage).toHaveBeenCalled();
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should build login message with correct parameters', async () => {
      await loginWithEthereum();

      expect(buildLoginMessage).toHaveBeenCalledTimes(1);
      
      const callArgs = (buildLoginMessage as jest.Mock).mock.calls[0][0];
      expect(callArgs.template).toBe('KeyPass Login\nIssued At: {{issuedAt}}\nNonce: {{nonce}}\nAddress: {{address}}');
      expect(callArgs.issuedAt).toBe('2023-01-01T00:00:00.000Z');
      expect(callArgs.address).toBe(mockAccount.address);
      expect(callArgs.nonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should create DID for the correct address', async () => {
      await loginWithEthereum();

      expect(mockDIDProvider.createDid).toHaveBeenCalledWith(mockAccount.address);
    });

    it('should always call disconnect even on success', async () => {
      await loginWithEthereum();

      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw WalletNotFoundError when adapter.enable fails', async () => {
      mockAdapter.enable.mockRejectedValue(new WalletNotFoundError('MetaMask not found'));

      await expect(loginWithEthereum()).rejects.toThrow(WalletNotFoundError);
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should throw UserRejectedError when user rejects connection', async () => {
      mockAdapter.enable.mockRejectedValue(new UserRejectedError('connection'));

      await expect(loginWithEthereum()).rejects.toThrow(UserRejectedError);
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should throw error when no accounts found', async () => {
      mockAdapter.getAccounts.mockResolvedValue([]);

      await expect(loginWithEthereum()).rejects.toThrow('No accounts found');
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should throw error when getAccounts returns null', async () => {
      mockAdapter.getAccounts.mockResolvedValue(null);

      await expect(loginWithEthereum()).rejects.toThrow('No accounts found');
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should throw WalletConnectionError when getAccounts fails', async () => {
      mockAdapter.getAccounts.mockRejectedValue(new WalletConnectionError('Connection failed'));

      await expect(loginWithEthereum()).rejects.toThrow(WalletConnectionError);
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should throw UserRejectedError when user rejects signing', async () => {
      mockAdapter.signMessage.mockRejectedValue(new UserRejectedError('message_signing'));

      await expect(loginWithEthereum()).rejects.toThrow(UserRejectedError);
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should throw error when message building fails', async () => {
      (buildLoginMessage as jest.Mock).mockRejectedValue(new Error('Message building failed'));

      await expect(loginWithEthereum()).rejects.toThrow('Message building failed');
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should throw AddressValidationError when DID creation fails', async () => {
      mockDIDProvider.createDid.mockRejectedValue(new AddressValidationError('Invalid address'));

      await expect(loginWithEthereum()).rejects.toThrow(AddressValidationError);
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should always call disconnect even when errors occur', async () => {
      mockAdapter.enable.mockRejectedValue(new Error('Connection failed'));

      await expect(loginWithEthereum()).rejects.toThrow();
      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });
  });

  describe('adapter interaction', () => {
    it('should use the first account from getAccounts', async () => {
      const multipleAccounts = [
        mockAccount,
        {
          address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          name: 'Second Account',
          source: 'ethereum',
        },
      ];
      mockAdapter.getAccounts.mockResolvedValue(multipleAccounts);

      const result = await loginWithEthereum();

      expect(mockAdapter.setCurrentAddress).toHaveBeenCalledWith(mockAccount.address);
      expect(result.address).toBe(mockAccount.address);
    });

    it('should pass the correct message to signMessage', async () => {
      const customMessage = 'Custom test message';
      (buildLoginMessage as jest.Mock).mockResolvedValue(customMessage);

      await loginWithEthereum();

      expect(mockAdapter.signMessage).toHaveBeenCalledWith(customMessage);
    });
  });

  describe('timestamp and nonce generation', () => {
    it('should generate unique nonce for each login attempt', async () => {
      const result1 = await loginWithEthereum();
      const result2 = await loginWithEthereum();

      // Check that nonces are valid UUIDs and different
      expect(result1.nonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result2.nonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result1.nonce).not.toBe(result2.nonce);
    });

    it('should use current timestamp for each login attempt', async () => {
      const mockDate = jest.spyOn(Date.prototype, 'toISOString');
      mockDate
        .mockReturnValueOnce('2023-01-01T00:00:00.000Z')
        .mockReturnValueOnce('2023-01-01T01:00:00.000Z');

      const result1 = await loginWithEthereum();
      const result2 = await loginWithEthereum();

      expect(result1.issuedAt).toBe('2023-01-01T00:00:00.000Z');
      expect(result2.issuedAt).toBe('2023-01-01T01:00:00.000Z');
    });
  });

  describe('return value structure', () => {
    it('should return object with all required fields', async () => {
      const result = await loginWithEthereum();

      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('did');
      expect(result).toHaveProperty('issuedAt');
      expect(result).toHaveProperty('nonce');
    });

    it('should return correct types for all fields', async () => {
      const result = await loginWithEthereum();

      expect(typeof result.address).toBe('string');
      expect(typeof result.signature).toBe('string');
      expect(typeof result.message).toBe('string');
      expect(typeof result.did).toBe('string');
      expect(typeof result.issuedAt).toBe('string');
      expect(typeof result.nonce).toBe('string');
    });
  });
}); 