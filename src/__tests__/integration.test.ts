import { connectWallet } from '../walletConnector';
import { loginWithPolkadot } from '../index';
import { VerificationService } from '../server/verificationService';
import { WalletAdapter } from '../adapters/types';
import { WalletNotFoundError, UserRejectedError } from '../errors/WalletErrors';
import { PolkadotDIDProvider } from '../did/UUIDProvider';

// Mock the wallet connector
jest.mock('../walletConnector', () => ({
  connectWallet: jest.fn()
}));

// Mock the verification service
jest.mock('../server/verificationService', () => ({
  VerificationService: jest.fn().mockImplementation(() => ({
    verifySignature: jest.fn()
  }))
}));

// Mock the UUID provider
jest.mock('../did/UUIDProvider', () => ({
  PolkadotDIDProvider: jest.fn().mockImplementation(() => ({
    createDid: jest.fn().mockResolvedValue('did:key:z' + '1'.repeat(58))
  }))
}));

describe('Integration Tests', () => {
  let mockAdapter: jest.Mocked<WalletAdapter>;
  let verificationService: jest.Mocked<VerificationService>;
  let mockDidProvider: jest.Mocked<PolkadotDIDProvider>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock adapter
    mockAdapter = {
      enable: jest.fn().mockResolvedValue(undefined),
      getAccounts: jest.fn().mockResolvedValue([
        {
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          name: 'Test Account',
          source: 'polkadot-js'
        }
      ]),
      signMessage: jest.fn().mockResolvedValue('0x' + '1'.repeat(128)),
      getProvider: jest.fn().mockReturnValue('polkadot-js')
    };

    // Setup mock verification service
    verificationService = new VerificationService() as jest.Mocked<VerificationService>;
    (verificationService.verifySignature as jest.Mock).mockResolvedValue({
      valid: true,
      did: 'did:key:z' + '1'.repeat(58)
    });

    // Setup mock DID provider
    mockDidProvider = {
      createDid: jest.fn().mockResolvedValue('did:key:z' + '1'.repeat(58)),
      createDIDDocument: jest.fn().mockResolvedValue({
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:key:z' + '1'.repeat(58),
        controller: 'did:key:z' + '1'.repeat(58),
        verificationMethod: [],
        authentication: [],
        assertionMethod: [],
        keyAgreement: [],
        capabilityInvocation: [],
        capabilityDelegation: [],
        service: []
      }),
      resolve: jest.fn().mockResolvedValue(null),
      extractAddress: jest.fn().mockReturnValue('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
    } as unknown as jest.Mocked<PolkadotDIDProvider>;
    (PolkadotDIDProvider as unknown as jest.Mock).mockImplementation(() => mockDidProvider);

    // Setup default wallet connector mock
    (connectWallet as jest.Mock).mockImplementation(async () => {
      await mockAdapter.enable();
      return mockAdapter;
    });
  });

  describe('Full Authentication Flow', () => {
    it('should complete full authentication flow successfully', async () => {
      const result = await loginWithPolkadot();

      // Verify wallet connection
      expect(connectWallet).toHaveBeenCalled();
      expect(mockAdapter.getAccounts).toHaveBeenCalled();

      // Verify message signing
      expect(mockAdapter.signMessage).toHaveBeenCalled();
      const signedMessage = await mockAdapter.signMessage.mock.results[0].value;
      expect(signedMessage).toMatch(/^0x[0-9a-f]{128}$/);

      // Verify DID creation
      const accounts = await mockAdapter.getAccounts();
      expect(mockDidProvider.createDid).toHaveBeenCalledWith(accounts[0].address);

      // Verify result structure
      expect(result).toEqual({
        address: expect.any(String),
        did: expect.any(String),
        message: expect.any(String),
        signature: expect.any(String),
        issuedAt: expect.any(String),
        nonce: expect.any(String)
      });

      // Verify message format
      expect(result.message).toMatch(/^KeyPass Login\nIssued At: .*\nNonce: .*\nAddress: .*$/);
    });

    it('should handle wallet connection failure', async () => {
      (connectWallet as jest.Mock).mockRejectedValue(new WalletNotFoundError('Polkadot.js'));

      await expect(loginWithPolkadot()).rejects.toThrow(WalletNotFoundError);
      expect(mockAdapter.enable).not.toHaveBeenCalled();
    });

    it('should handle user rejection', async () => {
      (mockAdapter.enable as jest.Mock).mockRejectedValue(new UserRejectedError('connection'));

      await expect(loginWithPolkadot()).rejects.toThrow(UserRejectedError);
      expect(mockAdapter.getAccounts).not.toHaveBeenCalled();
    });

    it('should handle no accounts available', async () => {
      (mockAdapter.getAccounts as jest.Mock).mockResolvedValue([]);

      await expect(loginWithPolkadot()).rejects.toThrow('No accounts found');
      expect(mockAdapter.signMessage).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent login attempts', async () => {
      const attempts = Array(5).fill(null).map(() => loginWithPolkadot());
      const results = await Promise.all(attempts);

      // Verify all attempts succeeded
      results.forEach(result => {
        expect(result).toEqual({
          address: expect.any(String),
          did: expect.any(String),
          message: expect.any(String),
          signature: expect.any(String),
          issuedAt: expect.any(String),
          nonce: expect.any(String)
        });
      });

      // Verify each attempt used a unique nonce
      const nonces = results.map(r => r.nonce);
      const uniqueNonces = new Set(nonces);
      expect(uniqueNonces.size).toBe(nonces.length);
    });

    it('should handle concurrent wallet connections', async () => {
      // Create unique mock adapters for each connection
      const mockAdapters = Array(3).fill(null).map(() => ({
        ...mockAdapter,
        getProvider: jest.fn().mockReturnValue('polkadot-js')
      }));

      // Mock connectWallet to return different adapters
      (connectWallet as jest.Mock)
        .mockResolvedValueOnce(mockAdapters[0])
        .mockResolvedValueOnce(mockAdapters[1])
        .mockResolvedValueOnce(mockAdapters[2]);

      const connections = Array(3).fill(null).map(() => connectWallet());
      const adapters = await Promise.all(connections);

      // Verify all connections succeeded
      adapters.forEach(adapter => {
        expect(adapter).toBeDefined();
        expect(adapter.enable).toBeDefined();
        expect(adapter.getAccounts).toBeDefined();
        expect(adapter.signMessage).toBeDefined();
      });

      // Verify each connection was unique
      const uniqueAdapters = new Set(adapters);
      expect(uniqueAdapters.size).toBe(adapters.length);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary connection failures', async () => {
      // Reset the mock to remove the default implementation
      (connectWallet as jest.Mock).mockReset();
      
      // Setup the mock to fail once then succeed
      (connectWallet as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockImplementationOnce(async () => {
          await mockAdapter.enable();
          return mockAdapter;
        });

      const result = await loginWithPolkadot();
      expect(result).toBeDefined();
      expect(connectWallet).toHaveBeenCalledTimes(2);
    });

    it('should handle signature verification failures', async () => {
      (verificationService.verifySignature as jest.Mock).mockResolvedValueOnce({
        valid: false,
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE'
      });

      await expect(loginWithPolkadot()).rejects.toThrow('Invalid signature');
    });
  });
}); 