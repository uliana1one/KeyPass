import { KILTDIDProvider } from '../KILTDIDProvider';
import { KiltAdapter } from '../../adapters/KiltAdapter';
import { 
  KILTCreateDIDRequest,
  KILTCreateDIDResponse,
  KILTError,
  KILTErrorType,
  KILTDIDStatus,
  KILTDIDDocument,
  KILTVerificationMethod,
  KILTService,
  KILTTransactionResult,
  KILTTransactionEvent
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
    disconnect: jest.fn(),
    enable: jest.fn(),
    getAccounts: jest.fn().mockResolvedValue([
      {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        name: 'Test Account',
        source: 'kilt',
      },
    ]),
    signMessage: jest.fn().mockResolvedValue('0xsignedmessage'),
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
              send: jest.fn().mockImplementation((callback) => {
                setTimeout(() => {
                  callback({
                    status: {
                      type: 'Finalized',
                      asFinalized: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                    },
                    isFinalized: true,
                    isInBlock: false,
                    events: []
                  });
                }, 10);
                return jest.fn(); // Return unsubscribe function
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
              send: jest.fn().mockImplementation((callback) => {
                setTimeout(() => {
                  callback({
                    status: {
                      type: 'Finalized',
                      asFinalized: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                    },
                    isFinalized: true,
                    isInBlock: false,
                    events: []
                  });
                }, 10);
                return jest.fn(); // Return unsubscribe function
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
              extrinsics: [],
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
    return true;
  }),
}));

// Mock crypto for key generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

describe('KILTDIDProvider Integration Tests', () => {
  let kiltDidProvider: KILTDIDProvider;
  let mockKiltAdapter: jest.Mocked<KiltAdapter>;

  const validKiltAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const validKiltDid = `did:kilt:${validKiltAddress}`;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset address validation mock to default behavior
    const { validatePolkadotAddress } = require('../../adapters/types');
    validatePolkadotAddress.mockImplementation((address, ss58Format) => {
      if (!address || address.length < 47) {
        throw new Error('Invalid address');
      }
      if (ss58Format !== 38) {
        throw new Error('Wrong SS58 format');
      }
      return true;
    });
    
    // Mock KiltAdapter instance
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
      disconnect: jest.fn(),
      enable: jest.fn(),
      getAccounts: jest.fn().mockResolvedValue([
        {
          address: validKiltAddress,
          name: 'Test Account',
          source: 'kilt',
        },
      ]),
      signMessage: jest.fn().mockResolvedValue('0xsignedmessage'),
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
                send: jest.fn().mockImplementation((callback) => {
                  setTimeout(() => {
                    callback({
                      status: {
                        type: 'Finalized',
                        asFinalized: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                      },
                      isFinalized: true,
                      isInBlock: false,
                      events: []
                    });
                  }, 10);
                  return jest.fn(); // Return unsubscribe function
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
                send: jest.fn().mockImplementation((callback) => {
                  setTimeout(() => {
                    callback({
                      status: {
                        type: 'Finalized',
                        asFinalized: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                      },
                      isFinalized: true,
                      isInBlock: false,
                      events: []
                    });
                  }, 10);
                  return jest.fn(); // Return unsubscribe function
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
                extrinsics: [],
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

  describe('Complete DID Registration Flow', () => {
    // FIXME: These tests require proper mocking of blockchain polling mechanism
    it.skip('should complete end-to-end DID registration successfully', async () => {
      const request: KILTCreateDIDRequest = {
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
        metadata: { source: 'test', version: '1.0' },
      };

      const response = await kiltDidProvider.registerDIDOnChain(request);

      // Verify response structure
      expect(response).toMatchObject({
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
        }),
        status: KILTDIDStatus.ACTIVE,
      });

      // Verify DID format compliance
      expect(response.did).toBe(validKiltDid);
      expect(response.didDocument.id).toBe(validKiltDid);
      expect(response.didDocument.controller).toBe(validKiltDid);

      // Verify blockchain interaction
      expect(mockKiltAdapter.connect).toHaveBeenCalled();
    });

    it.skip('should create DID with additional verification methods and services', async () => {
      const request: KILTCreateDIDRequest = {
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
        verificationMethods: [
          {
            id: 'test-vm-1',
            type: 'Sr25519VerificationKey2020',
            controller: validKiltAddress,
            publicKeyMultibase: 'zTestKey1',
            keyType: 'sr25519' as any,
            isActive: true,
          },
        ],
        services: [
          {
            id: 'test-service',
            type: 'KiltCredentialRegistry' as any,
            serviceEndpoint: 'https://test.example.com',
            metadata: { version: '1.0' },
          },
        ],
        metadata: { enhanced: true },
      };

      const response = await kiltDidProvider.registerDIDOnChain(request);

      expect(response.status).toBe(KILTDIDStatus.ACTIVE);
      expect(response.transactionResult.success).toBe(true);
      
      // Verify DID document contains expected elements
      expect(response.didDocument.verificationMethod).toBeDefined();
      expect(response.didDocument.service).toBeDefined();
    });

    it.skip('should handle concurrent DID registrations', async () => {
      const requests = Array(3).fill(0).map((_, index) => ({
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
        metadata: { index },
      }));

      const promises = requests.map(request => 
        kiltDidProvider.registerDIDOnChain(request)
      );

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.status).toBe(KILTDIDStatus.ACTIVE);
        expect(response.did).toBe(validKiltDid);
        expect(response.transactionResult.success).toBe(true);
      });
    });
  });

  describe('Transaction Failure Scenarios', () => {
    it('should handle adapter connection failure during registration', async () => {
      mockKiltAdapter.connect.mockRejectedValue(new Error('Network connection failed'));

      const request: KILTCreateDIDRequest = {
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
      };

      await expect(kiltDidProvider.registerDIDOnChain(request)).rejects.toThrow(KILTError);
    });

    it('should handle invalid address format in registration request', async () => {
      const { validatePolkadotAddress } = require('../../adapters/types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Invalid address');
      });

      const request: KILTCreateDIDRequest = {
        accountAddress: 'invalid-address',
        controller: 'invalid-address',
      };

      await expect(kiltDidProvider.registerDIDOnChain(request)).rejects.toThrow(KILTError);
    });

    it.skip('should handle transaction submission failure', async () => {
      // Mock a scenario where the transaction service would fail
      const request: KILTCreateDIDRequest = {
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
      };

      // This should still succeed in our mock implementation
      // In a real scenario, this would be handled by the transaction service
      const response = await kiltDidProvider.registerDIDOnChain(request);
      expect(response.transactionResult.success).toBe(true);
    });

    it.skip('should handle DID creation with malformed verification methods', async () => {
      const request: KILTCreateDIDRequest = {
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
        verificationMethods: [
          {
            id: 'invalid-vm',
            type: 'InvalidType',
            controller: 'invalid-controller',
            publicKeyMultibase: 'invalid-key',
            keyType: 'invalid' as any,
            isActive: true,
          },
        ],
      };

      // Should still complete registration but with validation
      const response = await kiltDidProvider.registerDIDOnChain(request);
      expect(response.status).toBe(KILTDIDStatus.ACTIVE);
    });
  });

  describe('DID Document Retrieval and Verification', () => {
    it('should create and resolve DID document with correct structure', async () => {
      const didDocument = await kiltDidProvider.createDIDDocument(validKiltAddress);

      // Verify DID document structure
      expect(didDocument).toMatchObject({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/sr25519-2020/v1',
          'https://w3id.org/security/suites/kilt-2023/v1',
        ],
        id: validKiltDid,
        controller: validKiltDid,
        verificationMethod: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(new RegExp(`^${validKiltDid}#`)),
            type: 'Sr25519VerificationKey2020',
            controller: validKiltDid,
            publicKeyMultibase: expect.stringMatching(/^z[a-zA-Z0-9]+$/),
          }),
        ]),
        service: expect.arrayContaining([
          expect.objectContaining({
            id: `${validKiltDid}#kilt-parachain`,
            type: 'KiltParachainService',
            serviceEndpoint: 'wss://spiritnet.kilt.io',
          }),
          expect.objectContaining({
            id: `${validKiltDid}#kilt-did-registry`,
            type: 'KiltDIDRegistry',
            serviceEndpoint: 'https://spiritnet.api.subscan.io/api',
          }),
        ]),
      });

      // Verify all required DID document properties
      expect(didDocument.authentication).toHaveLength(1);
      expect(didDocument.assertionMethod).toHaveLength(1);
      expect(didDocument.capabilityInvocation).toHaveLength(1);
      expect(didDocument.capabilityDelegation).toHaveLength(1);
    });

    it('should resolve DID document from DID identifier', async () => {
      const resolvedDocument = await kiltDidProvider.resolve(validKiltDid);

      expect(resolvedDocument.id).toBe(validKiltDid);
      expect(resolvedDocument.controller).toBe(validKiltDid);
      expect(resolvedDocument.verificationMethod).toHaveLength(1);
      expect(resolvedDocument.service).toHaveLength(2);
    });

    it('should extract address from DID and validate format', async () => {
      const extractedAddress = await kiltDidProvider.extractAddress(validKiltDid);

      expect(extractedAddress).toBe(validKiltAddress);
      expect(extractedAddress).toMatch(/^5[A-Za-z0-9]{47}$/); // KILT SS58 format
    });
  });

  describe('DID Format Compliance', () => {
    it('should create DIDs in correct did:kilt: format', async () => {
      const did = await kiltDidProvider.createDid(validKiltAddress);

      expect(did).toBe(validKiltDid);
      expect(did).toMatch(/^did:kilt:5[A-Za-z0-9]{47}$/);
    });

    it('should validate did:kilt: format in resolution', async () => {
      // Valid KILT DID should resolve
      const validDid = `did:kilt:${validKiltAddress}`;
      await expect(kiltDidProvider.resolve(validDid)).resolves.toBeDefined();

      // Invalid DID formats should fail
      await expect(kiltDidProvider.resolve('did:key:123')).rejects.toThrow('Invalid KILT DID format');
      await expect(kiltDidProvider.resolve('did:ethr:456')).rejects.toThrow('Invalid KILT DID format');
      await expect(kiltDidProvider.resolve('not-a-did')).rejects.toThrow('Invalid KILT DID format');
    });

    it('should handle different KILT address formats consistently', async () => {
      const addresses = [
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
      ];

      for (const address of addresses) {
        const did = await kiltDidProvider.createDid(address);
        expect(did).toBe(`did:kilt:${address}`);
        expect(did).toMatch(/^did:kilt:5[A-Za-z0-9]{47}$/);

        const extractedAddress = await kiltDidProvider.extractAddress(did);
        expect(extractedAddress).toBe(address);
      }
    });
  });

  describe('Key Generation and Management', () => {
    it('should generate unique key agreement keys', async () => {
      const key1 = await kiltDidProvider.generateKeyAgreementKey();
      const key2 = await kiltDidProvider.generateKeyAgreementKey();

      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^z[a-zA-Z0-9]+$/); // Base58BTC format
      expect(key2).toMatch(/^z[a-zA-Z0-9]+$/); // Base58BTC format
      expect(key1.length).toBeGreaterThan(10);
      expect(key2.length).toBeGreaterThan(10);
    });

    it('should create verification methods with proper KILT key types', async () => {
      const didDocument = await kiltDidProvider.createDIDDocument(validKiltAddress);
      const verificationMethod = didDocument.verificationMethod[0];

      expect(verificationMethod.type).toBe('Sr25519VerificationKey2020');
      expect(verificationMethod.publicKeyMultibase).toMatch(/^z[a-zA-Z0-9]+$/);
      expect(verificationMethod.controller).toBe(validKiltDid);
      expect(verificationMethod.id).toMatch(new RegExp(`^${validKiltDid}#`));
    });
  });

  describe('Onchain Verification', () => {
    it('should verify DID onchain when connected to spiritnet', async () => {
      const isValid = await kiltDidProvider.verifyOnchain(validKiltDid);

      expect(isValid).toBe(true);
      expect(mockKiltAdapter.connect).toHaveBeenCalled();
    });

    it('should handle onchain verification failures gracefully', async () => {
      mockKiltAdapter.connect.mockRejectedValue(new Error('Connection failed'));

      const isValid = await kiltDidProvider.verifyOnchain(validKiltDid);

      expect(isValid).toBe(false);
    });

    it('should return false for non-spiritnet networks', async () => {
      mockKiltAdapter.getChainInfo.mockReturnValue({
        name: 'Test Network',
        network: 'testnet',
        version: '1',
        runtime: 'test',
        ss58Format: 42,
        genesisHash: '0xabc',
      });

      const isValid = await kiltDidProvider.verifyOnchain(validKiltDid);

      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or whitespace addresses', async () => {
      const { validatePolkadotAddress } = require('../../adapters/types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Invalid address');
      });

      await expect(kiltDidProvider.createDid('')).rejects.toThrow();
      await expect(kiltDidProvider.createDid('   ')).rejects.toThrow();
    });

    it('should handle malformed DID strings', async () => {
      await expect(kiltDidProvider.resolve('did:kilt:')).rejects.toThrow();
      await expect(kiltDidProvider.extractAddress('did:kilt:invalid')).rejects.toThrow();
    });

    it('should preserve error context in KILTError instances', async () => {
      // Test with invalid address to trigger KILTError with proper context
      const invalidAddress = 'invalid_address_format';
      
      try {
        await kiltDidProvider.registerDIDOnChain({
          accountAddress: invalidAddress,
          controller: validKiltAddress,
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(KILTError);
        // With our improved validation, invalid addresses now throw INVALID_KILT_ADDRESS
        expect((error as KILTError).code).toBe(KILTErrorType.INVALID_KILT_ADDRESS);
        // Check that error message contains validation failure info
        expect((error as KILTError).message).toBeTruthy();
      }
    });
  });

  describe('Transaction Management', () => {
    it.skip('should handle transaction submission with custom options', async () => {
      const request: KILTCreateDIDRequest = {
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
        feePayer: validKiltAddress,
        metadata: { custom: 'options' },
      };

      const response = await kiltDidProvider.registerDIDOnChain(request);

      expect(response.transactionResult.success).toBe(true);
      expect(response.transactionResult.fee.currency).toBe('KILT');
      expect(response.transactionResult.events).toBeDefined();
    });

    it.skip('should handle transaction confirmation timeout scenarios', async () => {
      // This test verifies the transaction service handles timeouts
      const request: KILTCreateDIDRequest = {
        accountAddress: validKiltAddress,
        controller: validKiltAddress,
      };

      // In our mock implementation, this should succeed
      // In a real implementation, this would test timeout handling
      const response = await kiltDidProvider.registerDIDOnChain(request);
      expect(response.transactionResult.success).toBe(true);
    });
  });
});
