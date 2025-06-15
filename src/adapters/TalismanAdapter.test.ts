import { TalismanAdapter } from './TalismanAdapter';
import { AddressValidationError, WalletNotFoundError, UserRejectedError } from '../errors/WalletErrors';

describe('TalismanAdapter', () => {
  let adapter: TalismanAdapter;
  let mockExtension: any;

  beforeEach(() => {
    // Mock the window.injectedWeb3 object
    mockExtension = {
      enable: jest.fn().mockResolvedValue(true),
      accounts: {
        get: jest.fn()
      },
      signer: {
        signRaw: jest.fn()
      }
    };

    (window as any).injectedWeb3 = {
      'talisman': mockExtension
    };

    adapter = new TalismanAdapter();
  });

  afterEach(() => {
    delete (window as any).injectedWeb3;
    jest.clearAllMocks();
  });

  describe('enable', () => {
    it('should enable the Talisman extension', async () => {
      await adapter.enable();
      expect(mockExtension.enable).toHaveBeenCalledWith('KeyPass Login SDK');
    });

    it('should throw WalletNotFoundError if extension is not available', async () => {
      delete (window as any).injectedWeb3['talisman'];
      await expect(adapter.enable()).rejects.toThrow(WalletNotFoundError);
    });

    it('should throw UserRejectedError if user rejects the connection', async () => {
      mockExtension.enable.mockRejectedValueOnce(new Error('User rejected'));
      await expect(adapter.enable()).rejects.toThrow(UserRejectedError);
    });
  });

  describe('getAccounts', () => {
    beforeEach(async () => {
      await adapter.enable();
    });

    it('should throw WalletNotFoundError if wallet is not enabled', async () => {
      const newAdapter = new TalismanAdapter();
      await expect(newAdapter.getAccounts()).rejects.toThrow(WalletNotFoundError);
    });

    it('should throw AddressValidationError for invalid addresses', async () => {
      mockExtension.accounts.get.mockResolvedValueOnce([{ address: 'invalid-address' }]);
      await expect(adapter.getAccounts()).rejects.toThrow(AddressValidationError);
    });

    it('should return valid accounts', async () => {
      const validAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      mockExtension.accounts.get.mockResolvedValueOnce([{
        address: validAddress,
        meta: {
          name: 'Test Account',
          source: 'talisman'
        }
      }]);

      const accounts = await adapter.getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toEqual({
        address: validAddress,
        name: 'Test Account',
        source: 'talisman'
      });
    });
  });

  describe('signMessage', () => {
    const validAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    const testMessage = 'Test message';

    beforeEach(async () => {
      await adapter.enable();
      mockExtension.accounts.get.mockResolvedValueOnce([{
        address: validAddress,
        meta: { name: 'Test Account' }
      }]);
    });

    it('should throw WalletNotFoundError if wallet is not enabled', async () => {
      const newAdapter = new TalismanAdapter();
      await expect(newAdapter.signMessage(testMessage)).rejects.toThrow(WalletNotFoundError);
    });

    it('should sign a message successfully', async () => {
      const mockSignature = '0x1234';
      mockExtension.signer.signRaw.mockResolvedValueOnce({ signature: mockSignature });

      const signature = await adapter.signMessage(testMessage);
      expect(signature).toBe(mockSignature);
      expect(mockExtension.signer.signRaw).toHaveBeenCalledWith({
        address: validAddress,
        data: testMessage,
        type: 'bytes'
      });
    });

    it('should throw UserRejectedError if user rejects signing', async () => {
      mockExtension.signer.signRaw.mockRejectedValueOnce(new Error('User rejected'));
      await expect(adapter.signMessage(testMessage)).rejects.toThrow(UserRejectedError);
    });
  });

  describe('validateAddress', () => {
    it('should validate a correct Polkadot address', async () => {
      const validAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const result = await adapter.validateAddress(validAddress);
      expect(result).toBe(true);
    });

    it('should throw AddressValidationError for invalid addresses', async () => {
      await expect(adapter.validateAddress('invalid-address')).rejects.toThrow(AddressValidationError);
    });
  });
}); 