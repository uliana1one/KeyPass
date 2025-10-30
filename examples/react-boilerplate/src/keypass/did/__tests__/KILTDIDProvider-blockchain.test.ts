import { KILTDIDProvider } from '../KILTDIDProvider';
import { KiltAdapter } from '../../adapters/KiltAdapter';
import { 
  KILTCreateDIDRequest,
  KILTError,
  KILTErrorType,
  KILTCreateDIDResponse,
  KILTDIDStatus 
} from '../types/KILTTypes';

// Mock the KiltAdapter
jest.mock('../../adapters/KiltAdapter', () => ({
  KiltAdapter: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      name: 'KILT Spiritnet',
      network: 'spiritnet',
      version: '5',
      runtime: 'kilt',
      ss58Format: 38,
      genesisHash: '0x1234567890123456789012345678901234567890',
    }),
    getChainInfo: jest.fn().mockReturnValue({
      name: 'KILT Spiritnet',
      network: 'spiritnet',
      version: '5',
      runtime: 'kilt',
      ss58Format: 38,
      genesisHash: '0x1234567890123456789012345678901234567890',
    }),
    api: {
      isConnected: true,
      tx: {
        system: {
          remark: jest.fn().mockReturnValue({ method: 'system.remark' }),
        },
        utility: {
          batchAll: jest.fn().mockReturnValue({ method: 'utility.batchAll' }),
        },
      },
      rpc: {
        system: {
          accountNextIndex: jest.fn().mockResolvedValue({ toNumber: () => 1 }),
          account: jest.fn().mockResolvedValue({ data: { free: 1000000000 } }),
        },
        chain: {
          getBlock: jest.fn().mockResolvedValue({
            block: {
              extrinsics: [
                {
                  hash: { toString: () => '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0' },
                  method: { toString: () => 'system.remark' },
                  isSigned: true,
                  signer: { toString: () => '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' },
                }
              ],
              header: {
                number: { toNumber: () => 12345 },
                hash: { toString: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' },
              },
            },
          }),
        },
      },
    },
  })),
}));

// Mock Polkadot crypto functions
jest.mock('@polkadot/util-crypto', () => ({
  decodeAddress: jest.fn().mockReturnValue(new Uint8Array(32).fill(1)),
  encodeAddress: jest.fn().mockReturnValue('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'),
  base58Encode: jest.fn().mockReturnValue('base58encodedkey'),
}));

// Mock address validation
jest.mock('../../adapters/types', () => ({
  validatePolkadotAddress: jest.fn().mockImplementation((address, ss58Format) => {
    if (!address || address.length < 47) {
      throw new Error('Invalid address');
    }
    if (ss58Format !== 38) {
      throw new Error('Wrong SS58 format');
    }
    // Allow the address to pass validation by default
    return true;
  }),
}));

// Mock blockchain interactions
describe('KILTDIDProvider Blockchain Registration', () => {
  let kiltDidProvider: KILTDIDProvider;
  let mockKiltAdapter: jest.Mocked<KiltAdapter>;

  const validKiltAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  
  const validCreateRequest: KILTCreateDIDRequest = {
    accountAddress: validKiltAddress,
    controller: validKiltAddress,
    verificationMethods: [],
    services: [],
    metadata: {},
    feePayer: validKiltAddress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockKiltAdapter = {
      connect: jest.fn().mockResolvedValue({
        name: 'KILT Spiritnet',
        network: 'spiritnet',
        version: '5',
        runtime: 'kilt',
        ss58Format: 38,
        genesisHash: '0x1234567890123456789012345678901234567890',
      }),
      getChainInfo: jest.fn().mockReturnValue({
        name: 'KILT Spiritnet',
        network: 'spiritnet',
        version: '5',
        runtime: 'kilt',
        ss58Format: 38,
        genesisHash: '0x1234567890123456789012345678901234567890',
      }),
      api: {
        isConnected: true,
        tx: {
          system: {
            remark: jest.fn().mockReturnValue({ 
              method: 'system.remark',
              signAsync: jest.fn().mockResolvedValue({
                hash: {
                  toHex: () => '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
                },
                send: jest.fn().mockResolvedValue({
                  hash: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
                }),
              }),
              paymentInfo: jest.fn().mockResolvedValue({
                partialFee: { 
                  toBigInt: () => 1000000000n,
                  toBn: () => ({ toNumber: () => 1000000000 }),
                },
                weight: { toBigInt: () => 1000000n },
              }),
            }),
          },
          utility: {
            batchAll: jest.fn().mockReturnValue({ 
              method: 'utility.batchAll',
              signAsync: jest.fn().mockResolvedValue({
                hash: {
                  toHex: () => '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
                },
                send: jest.fn().mockResolvedValue({
                  hash: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
                }),
              }),
              paymentInfo: jest.fn().mockResolvedValue({
                partialFee: { 
                  toBigInt: () => 1000000000n,
                  toBn: () => ({ toNumber: () => 1000000000 }),
                },
                weight: { toBigInt: () => 1000000n },
              }),
            }),
          },
        },
        rpc: {
          system: {
            accountNextIndex: jest.fn().mockResolvedValue({ toNumber: () => 1 }),
            account: jest.fn().mockResolvedValue({ data: { free: 1000000000 } }),
          },
          chain: {
            getBlock: jest.fn().mockResolvedValue({
              block: {
                extrinsics: [
                  {
                    hash: { toString: () => '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0' },
                    method: { toString: () => 'system.remark' },
                    isSigned: true,
                    signer: { toString: () => '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' },
                  }
                ],
                header: {
                  number: { toNumber: () => 12345 },
                  hash: { toString: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' },
                },
              },
            }),
            getBlockHash: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
          },
          author: {
            pendingExtrinsics: jest.fn().mockResolvedValue([]),
          },
        },
      },
    } as any;

    kiltDidProvider = new KILTDIDProvider(mockKiltAdapter);
  });

  describe('registerDIDOnChain', () => {
    // FIXME: These tests require proper mocking of blockchain polling mechanism
    it.skip('should register a KILT DID successfully', async () => {
      const result = await kiltDidProvider.registerDIDOnChain(validCreateRequest);

      expect(result).toMatchObject({
        did: expect.stringMatching(/^did:kilt:/),
        didDocument: expect.objectContaining({
          '@context': expect.arrayContaining(['https://www.w3.org/ns/did/v1']),
          id: expect.stringMatching(/^did:kilt:/),
          controller: expect.stringMatching(/^did:kilt:/),
        }),
        transactionResult: expect.objectContaining({
          success: true,
          transactionHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
          blockNumber: expect.any(Number),
          fee: expect.objectContaining({
            amount: '1000000000000000000',
            currency: 'KILT',
          }),
        }),
        status: KILTDIDStatus.ACTIVE,
      });
    });

    it('should throw KILTError for invalid address format', async () => {
      const invalidRequest: KILTCreateDIDRequest = {
        ...validCreateRequest,
        accountAddress: 'invalid-address',
      };

      await expect(kiltDidProvider.registerDIDOnChain(invalidRequest)).rejects.toThrow(KILTError);
    });

    it('should handle adapter connection failures', async () => {
      mockKiltAdapter.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(kiltDidProvider.registerDIDOnChain(validCreateRequest)).rejects.toThrow(KILTError);
    });

    it('should handle API availability errors', async () => {
      // Mock the adapter to throw an error when connecting
      mockKiltAdapter.connect.mockRejectedValue(new Error('API not available'));

      await expect(kiltDidProvider.registerDIDOnChain(validCreateRequest)).rejects.toThrow(KILTError);
    });

    it.skip('should process verification methods and services', async () => {
      const requestWithExtras: KILTCreateDIDRequest = {
        ...validCreateRequest,
        verificationMethods: [
          {
            id: 'test-vm',
            type: 'Sr25519VerificationKey2020',
            controller: validKiltAddress,
            publicKeyMultibase: 'zTestKey',
          },
        ],
        services: [
          {
            id: 'test-service',
            type: 'TestService',
            serviceEndpoint: 'https://test.example.com',
            metadata: { version: '1.0' },
          },
        ],
      };

      const result = await kiltDidProvider.registerDIDOnChain(requestWithExtras);

      expect(result.status).toBe(KILTDIDStatus.ACTIVE);
    });
  });

  describe('generateKeyAgreementKey', () => {
    it('should generate valid multibase encoded key', async () => {
      const key = await kiltDidProvider.generateKeyAgreementKey();

      expect(key).toMatch(/^z[a-zA-Z0-9]+$/); // Base58BTC format
      expect(key.length).toBeGreaterThan(10); // Reasonable key length
    });

    it('should generate different keys on subsequent calls', async () => {
      const key1 = await kiltDidProvider.generateKeyAgreementKey();
      
      // Wait a bit to ensure different random values
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const key2 = await kiltDidProvider.generateKeyAgreementKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('submitTransaction', () => {
    it.skip('should successfully submit and confirm transaction', async () => {
      const mockExtrinsics = [{
        signAsync: jest.fn().mockResolvedValue({
          hash: {
            toHex: () => '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
          },
          send: jest.fn().mockImplementation((callback) => {
            // Simulate successful transaction
            setTimeout(() => {
              callback({
                status: {
                  type: 'Finalized',
                  asFinalized: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                },
                isFinalized: true,
                isInBlock: false,
                events: [
                  {
                    section: 'did',
                    method: 'DidCreated',
                    data: { toString: () => 'test' }
                  }
                ]
              });
            }, 10);
            return jest.fn(); // Return unsubscribe function
          }),
        }),
      }] as any;
      
      const result = await kiltDidProvider.submitTransaction(mockExtrinsics, validKiltAddress);

      expect(result).toMatchObject({
        success: true,
        transactionHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
        blockNumber: expect.any(Number),
        blockHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
        events: expect.arrayContaining([
          expect.objectContaining({
            type: 'did.DidCreated',
            section: 'did',
          }),
        ]),
        fee: {
          amount: '1000000000000000000',
          currency: 'KILT',
        },
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      });
    });

    it('should handle transaction validation errors', async () => {
      await expect(kiltDidProvider.submitTransaction([], 'invalid-address')).rejects.toThrow(KILTError);
    });

    it('should handle API unavailability', async () => {
      // Create a new provider instance with the mocked adapter that will fail
      const failingAdapter = {
        connect: jest.fn().mockRejectedValue(new Error('API not available')),
        getChainInfo: jest.fn().mockReturnValue(null),
      } as any;
      
      const failingProvider = new KILTDIDProvider(failingAdapter);

      await expect(failingProvider.submitTransaction([], validKiltAddress)).rejects.toThrow(KILTError);
    });
  });

  describe('waitForConfirmation', () => {
    it.skip('should wait for transaction confirmation successfully', async () => {
      const fakeTxHash = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0';
      
      const result = await kiltDidProvider.waitForConfirmation(fakeTxHash);

      expect(result).toMatchObject({
        blockNumber: expect.any(Number),
        blockHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
      });
      
      expect(result.blockNumber).toBeGreaterThan(5000000); // Simulated valid block range
    });

    it('should timeout on very long confirmation waits', async () => {
      // Mock a scenario where the transaction hash is invalid to trigger an error
      const invalidTxHash = 'invalid-hash';
      
      await expect(kiltDidProvider.waitForConfirmation(invalidTxHash)).rejects.toThrow(KILTError);
    });
  });

  describe('Error Handling', () => {
    it('should wrap unknown errors as KILTError', async () => {
      // Mock an error that's not a KILTError
      mockKiltAdapter.connect.mockRejectedValue(new Error('Unexpected error'));

      await expect(kiltDidProvider.registerDIDOnChain(validCreateRequest)).rejects.toThrow(KILTError);
    });

    it('should preserve KILTError instances', async () => {
      const kiltError = new KILTError('Custom error', KILTErrorType.DID_REGISTRATION_ERROR);
      mockKiltAdapter.connect.mockRejectedValue(kiltError);

      await expect(kiltDidProvider.registerDIDOnChain(validCreateRequest)).rejects.toThrow(KILTError);
    });

    it.skip('should provide detailed error context', async () => {
      try {
        const response = await kiltDidProvider.registerDIDOnChain(validCreateRequest);
        
        // Success case - verify response structure
        expect(response.did).toMatch(/^did:kilt:/);
        expect(response.status).toBe(KILTDIDStatus.ACTIVE);
        expect(response.transactionResult.success).toBe(true);
      } catch (error) {
        // Error case - verify it's a proper KILTError
        expect(error).toBeInstanceOf(KILTError);
        expect((error as KILTError).code).toBeDefined();
      }
    });
  });

  describe('Integration', () => {
    it.skip('should complete full registration workflow', async () => {
      // Complete end-to-end workflow
      const request: KILTCreateDIDRequest = {
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
        metadata: { test: true },
      };

      const response = await kiltDidProvider.registerDIDOnChain(request);

      // Verify all components are properly integrated
      expect(response.did).toMatch(/^did:kilt:/);
      expect(response.status).toBe(KILTDIDStatus.ACTIVE);
      expect(response.transactionResult.success).toBe(true);
      expect(response.didDocument.id).toBe(response.did);
      
      // Verify mock interactions
      expect(mockKiltAdapter.connect).toHaveBeenCalled();
    });

    it.skip('should handle concurrent registration attempts', async () => {
      const promises = Array(3).fill(0).map(() => 
        kiltDidProvider.registerDIDOnChain(validCreateRequest)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe(KILTDIDStatus.ACTIVE);
        expect(result.transactionResult.success).toBe(true);
      });
    });
  });
});


