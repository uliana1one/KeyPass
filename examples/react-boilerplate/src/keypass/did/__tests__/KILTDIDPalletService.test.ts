import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { KILTDIDPalletService } from '../services/KILTDIDPalletService';
import { KILTTransactionService } from '../services/KILTTransactionService';
import { KILTError, KILTErrorType } from '../types/KILTTypes';

describe('KILTDIDPalletService Tests', () => {
  let palletService: KILTDIDPalletService;
  let transactionService: KILTTransactionService;
  let testAccount: any;
  let mockApi: any;

  beforeAll(async () => {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
    testAccount = keyring.addFromMnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    );

    // Create comprehensive mock API
    mockApi = {
      isConnected: true,
      genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      tx: {
        utility: {
          batchAll: jest.fn((operations) => ({
            method: { section: 'utility', method: 'batchAll' },
            args: operations,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0xbatchhash1234567890abcdef1234567890abcdef1234567890abcdef12345678' },
              send: jest.fn().mockResolvedValue('0xbatchhash1234567890abcdef1234567890abcdef1234567890abcdef12345678')
            })
          }))
        },
        did: {
          create: jest.fn((...args) => ({
            method: { section: 'did', method: 'create' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
              send: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
            })
          })),
          addVerificationMethod: jest.fn((...args) => ({
            method: { section: 'did', method: 'addVerificationMethod' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x2345678901bcdef2345678901bcdef2345678901bcdef2345678901bcdef01' },
              send: jest.fn().mockResolvedValue('0x2345678901bcdef2345678901bcdef2345678901bcdef2345678901bcdef01')
            })
          })),
          removeVerificationMethod: jest.fn((...args) => ({
            method: { section: 'did', method: 'removeVerificationMethod' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x3456789012cdef3456789012cdef3456789012cdef3456789012cdef3456789' },
              send: jest.fn().mockResolvedValue('0x3456789012cdef3456789012cdef3456789012cdef3456789012cdef3456789')
            })
          })),
          addService: jest.fn((...args) => ({
            method: { section: 'did', method: 'addService' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x4567890123def4567890123def4567890123def4567890123def4567890123de' },
              send: jest.fn().mockResolvedValue('0x4567890123def4567890123def4567890123def4567890123def4567890123de')
            })
          })),
          removeService: jest.fn((...args) => ({
            method: { section: 'did', method: 'removeService' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x5678901234ef5678901234ef5678901234ef5678901234ef5678901234ef567' },
              send: jest.fn().mockResolvedValue('0x5678901234ef5678901234ef5678901234ef5678901234ef5678901234ef567')
            })
          })),
          setController: jest.fn((...args) => ({
            method: { section: 'did', method: 'setController' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x6789012345f6789012345f6789012345f6789012345f6789012345f67890123' },
              send: jest.fn().mockResolvedValue('0x6789012345f6789012345f6789012345f6789012345f6789012345f67890123')
            })
          })),
          updateMetadata: jest.fn((...args) => ({
            method: { section: 'did', method: 'updateMetadata' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x7890123456789012345678901234567890123456789012345678901234567890' },
              send: jest.fn().mockResolvedValue('0x7890123456789012345678901234567890123456789012345678901234567890')
            })
          })),
          remove: jest.fn((...args) => ({
            method: { section: 'did', method: 'remove' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x8901234567890123456789012345678901234567890123456789012345678901' },
              send: jest.fn().mockResolvedValue('0x8901234567890123456789012345678901234567890123456789012345678901')
            })
          })),
          delete: jest.fn((...args) => ({
            method: { section: 'did', method: 'delete' },
            args,
            signAsync: jest.fn().mockResolvedValue({
              hash: { toHex: () => '0x8901234567890123456789012345678901234567890123456789012345678901' },
              send: jest.fn().mockResolvedValue('0x8901234567890123456789012345678901234567890123456789012345678901')
            })
          }))
        }
      },
      query: {
        did: {
          didStorage: jest.fn().mockResolvedValue({
            isSome: true,
            unwrap: () => ({
              verificationMethod: [
                {
                  id: { toString: () => 'key-1' },
                  type: { toString: () => 'Ed25519VerificationKey2020' },
                  publicKey: { toString: () => 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP' }
                }
              ],
              service: [
                {
                  id: { toString: () => 'service-1' },
                  type: { toString: () => 'LinkedDomains' },
                  serviceEndpoint: { toString: () => 'https://example.com' }
                }
              ]
            })
          })
        }
      },
      rpc: {
        chain: {
          getHeader: jest.fn().mockResolvedValue({
            number: {
              toNumber: () => 1000
            }
          })
        }
      }
    };

    transactionService = new KILTTransactionService(mockApi);
    palletService = new KILTDIDPalletService(mockApi, transactionService);
    
    // Mock transactionService.submitTransaction
    jest.spyOn(transactionService, 'submitTransaction').mockResolvedValue({
      success: true,
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 1000,
      blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      events: []
    });
    
    // Mock queryDID to return non-existent by default
    jest.spyOn(palletService, 'queryDID').mockResolvedValue({
      exists: false,
      did: null,
      document: null
    });
  });

  describe('DID Creation via Pallet', () => {
    test('should create DID via pallet', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const result = await palletService.createDID({ did }, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
      expect(mockApi.tx.did.create).toHaveBeenCalled();
    });

    test('should create DID with verification methods', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const verificationMethods = [{
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
      }];

      const result = await palletService.createDID({ did, verificationMethods }, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.create).toHaveBeenCalled();
    });

    test('should create DID with services', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const services = [{
        id: `${did}#service-1`,
        type: 'LinkedDomains',
        serviceEndpoint: 'https://example.com'
      }];

      const result = await palletService.createDID({ did, services }, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.create).toHaveBeenCalled();
    });
  });

  describe('DID Updates via Pallet', () => {
    beforeEach(() => {
      // Mock existing DID for updates
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did: `did:kilt:${testAccount.address}`,
        document: {} as any
      });
    });

    test('should update DID with new verification methods', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const newVerificationMethod = {
        did,
        operation: 'add' as const,
        verificationMethod: {
          id: `${did}#key-2`,
          type: 'X25519KeyAgreementKey2020',
          controller: did,
          publicKeyMultibase: 'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc'
        }
      };

      const result = await palletService.addVerificationMethod(newVerificationMethod, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.addVerificationMethod).toHaveBeenCalled();
    });

    test('should update DID with new services', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const newService = {
        did,
        operation: 'add' as const,
        service: {
          id: `${did}#service-2`,
          type: 'MessagingService',
          serviceEndpoint: 'https://messaging.example.com'
        }
      };

      const result = await palletService.addService(newService, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.addService).toHaveBeenCalled();
    });

    test('should update DID controller', async () => {
      const did = `did:kilt:${testAccount.address}`;
      // Use the test account address as the new controller (valid KILT address)
      const newController = testAccount.address;

      const result = await palletService.setController(did, newController, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.setController).toHaveBeenCalled();
    });

    test('should update DID with combined add and remove operations', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const updateRequest = {
        did,
        addVerificationMethods: [{
          id: `${did}#key-new`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
        }],
        removeVerificationMethods: [`${did}#key-old`],
        addServices: [{
          id: `${did}#service-new`,
          type: 'LinkedDomains',
          serviceEndpoint: 'https://new.example.com'
        }],
        removeServices: [`${did}#service-old`]
      };

      const result = await palletService.updateDID(updateRequest, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.utility.batchAll).toHaveBeenCalled();
    });

    test('should update DID with controller and metadata', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const updateRequest = {
        did,
        controller: testAccount.address,
        metadata: {
          updated: true,
          version: '2.0.0'
        }
      };

      const result = await palletService.updateDID(updateRequest, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.utility.batchAll).toHaveBeenCalled();
    });

    test('should update DID with only removeVerificationMethods', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const updateRequest = {
        did,
        removeVerificationMethods: [`${did}#key-1`, `${did}#key-2`]
      };

      const result = await palletService.updateDID(updateRequest, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should update DID with only removeServices', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const updateRequest = {
        did,
        removeServices: [`${did}#service-1`, `${did}#service-2`]
      };

      const result = await palletService.updateDID(updateRequest, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('DID Deletion via Pallet', () => {
    test('should delete DID successfully', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock existing DID
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const result = await palletService.deleteDID(did, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.delete).toHaveBeenCalled();
    });
  });

  describe('Verification Method Management', () => {
    beforeEach(() => {
      // Mock existing DID
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did: `did:kilt:${testAccount.address}`,
        document: {} as any
      });
    });

    test('should add verification method to pallet', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const operation = {
        did,
        operation: 'add' as const,
        verificationMethod: {
          id: `${did}#key-3`,
          type: 'EcdsaSecp256k1VerificationKey2019',
          controller: did,
          publicKeyMultibase: 'zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme'
        }
      };

      const result = await palletService.addVerificationMethod(operation, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.addVerificationMethod).toHaveBeenCalled();
    });

    test('should remove verification method from pallet', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const operation = {
        did,
        operation: 'remove' as const,
        verificationMethod: {
          id: `${did}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
        }
      };

      const result = await palletService.removeVerificationMethod(operation, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.removeVerificationMethod).toHaveBeenCalled();
    });
  });

  describe('Service Endpoint Management', () => {
    beforeEach(() => {
      // Mock existing DID
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did: `did:kilt:${testAccount.address}`,
        document: {} as any
      });
    });

    test('should add service to pallet', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const operation = {
        did,
        operation: 'add' as const,
        service: {
          id: `${did}#service-3`,
          type: 'CredentialRegistry',
          serviceEndpoint: 'https://credentials.example.com'
        }
      };

      const result = await palletService.addService(operation, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.addService).toHaveBeenCalled();
    });

    test('should remove service from pallet', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const operation = {
        did,
        operation: 'remove' as const,
        service: {
          id: `${did}#service-1`,
          type: 'LinkedDomains',
          serviceEndpoint: 'https://example.com'
        }
      };

      const result = await palletService.removeService(operation, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.removeService).toHaveBeenCalled();
    });
  });

  describe('Metadata Management', () => {
    beforeEach(() => {
      // Mock existing DID
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did: `did:kilt:${testAccount.address}`,
        document: {} as any
      });
    });

    test('should update DID metadata', async () => {
      const did = `did:kilt:${testAccount.address}`;
      const metadata = {
        name: 'Test DID',
        description: 'A test DID for unit testing',
        version: '1.0.0'
      };

      const result = await palletService.updateMetadata(did, metadata, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.did.updateMetadata).toHaveBeenCalledWith(did, metadata);
    });

    test('should throw error when metadata is invalid', async () => {
      const did = `did:kilt:${testAccount.address}`;

      await expect(
        palletService.updateMetadata(did, null as any, testAccount)
      ).rejects.toThrow('Invalid metadata provided');

      await expect(
        palletService.updateMetadata(did, undefined as any, testAccount)
      ).rejects.toThrow('Invalid metadata provided');
    });
  });

  describe('DID Query Operations', () => {
    test('should query existing DID', async () => {
      // Restore original queryDID implementation temporarily
      jest.spyOn(palletService, 'queryDID').mockRestore();
      
      const did = `did:kilt:${testAccount.address}`;
      const result = await palletService.queryDID(did);

      expect(result).toBeDefined();
      expect(result.exists).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document?.id).toBe(did);
    });

    test('should return false for non-existent DID', async () => {
      // Restore original queryDID
      jest.spyOn(palletService, 'queryDID').mockRestore();

      // Mock storage to return None
      mockApi.query.did.didStorage = jest.fn().mockResolvedValue({
        isSome: false,
        isNone: true
      });

      const did = `did:kilt:non-existent-address`;
      const result = await palletService.queryDID(did);

      expect(result.exists).toBe(false);
      expect(result.document).toBeNull();
    });

    test('should check if DID exists', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock queryDID to return existing
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const exists = await palletService.didExists(did);
      expect(exists).toBe(true);

      // Mock queryDID to return non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: false,
        did: null,
        document: null
      });

      const notExists = await palletService.didExists(`did:kilt:non-existent`);
      expect(notExists).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    test('should execute batch create operation', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock queryDID as non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: false,
        did: null,
        document: null
      });

      const batchOperation = {
        operations: [
          {
            type: 'create' as const,
            data: {
              did,
              verificationMethods: [],
              services: [],
              controller: testAccount.address,
              metadata: {}
            }
          }
        ]
      };

      const result = await palletService.executeBatchOperation(batchOperation, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockApi.tx.utility.batchAll).toBeDefined();
    });

    test('should execute batch with multiple operation types', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const batchOperation = {
        operations: [
          {
            type: 'addVerificationMethod' as const,
            data: {
              did,
              verificationMethod: {
                id: `${did}#key-batch`,
                type: 'Ed25519VerificationKey2020',
                controller: did,
                publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
              }
            }
          },
          {
            type: 'addService' as const,
            data: {
              did,
              service: {
                id: `${did}#service-batch`,
                type: 'LinkedDomains',
                serviceEndpoint: 'https://batch.example.com'
              }
            }
          },
          {
            type: 'setController' as const,
            data: {
              did,
              controller: testAccount.address
            }
          },
          {
            type: 'updateMetadata' as const,
            data: {
              did,
              metadata: { batch: true }
            }
          }
        ]
      };

      const result = await palletService.executeBatchOperation(batchOperation, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should execute batch with remove operations', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const batchOperation = {
        operations: [
          {
            type: 'removeVerificationMethod' as const,
            data: {
              did,
              verificationMethodId: `${did}#key-1`
            }
          },
          {
            type: 'removeService' as const,
            data: {
              did,
              serviceId: `${did}#service-1`
            }
          }
        ]
      };

      const result = await palletService.executeBatchOperation(batchOperation, testAccount);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should throw error for unknown batch operation type', async () => {
      const batchOperation = {
        operations: [
          {
            type: 'unknownType' as any,
            data: {}
          }
        ]
      };

      await expect(
        palletService.executeBatchOperation(batchOperation, testAccount)
      ).rejects.toThrow('Unknown operation type');
    });
  });

  describe('Error Handling for Pallet Operations', () => {
    test('should throw error when API not connected on createDID', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock API as disconnected
      const disconnectedApi = { ...mockApi, isConnected: false };
      const disconnectedPalletService = new KILTDIDPalletService(disconnectedApi, transactionService);

      await expect(
        disconnectedPalletService.createDID({ did }, testAccount)
      ).rejects.toThrow('KILT API not connected');
    });

    test('should throw error when API not connected on updateDID', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const disconnectedApi = { ...mockApi, isConnected: false };
      const disconnectedPalletService = new KILTDIDPalletService(disconnectedApi, transactionService);

      await expect(
        disconnectedPalletService.updateDID({ did, metadata: { test: true } }, testAccount)
      ).rejects.toThrow('KILT API not connected');
    });

    test('should throw error when API not connected on deleteDID', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const disconnectedApi = { ...mockApi, isConnected: false };
      const disconnectedPalletService = new KILTDIDPalletService(disconnectedApi, transactionService);

      await expect(
        disconnectedPalletService.deleteDID(did, testAccount)
      ).rejects.toThrow('KILT API not connected');
    });

    test('should throw error when API not connected on addVerificationMethod', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const disconnectedApi = { ...mockApi, isConnected: false };
      const disconnectedPalletService = new KILTDIDPalletService(disconnectedApi, transactionService);

      await expect(
        disconnectedPalletService.addVerificationMethod({
          did,
          operation: 'add',
          verificationMethod: {
            id: `${did}#key-1`,
            type: 'Ed25519VerificationKey2020',
            controller: did,
            publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
          }
        }, testAccount)
      ).rejects.toThrow('KILT API not connected');
    });

    test('should throw error when API not connected on addService', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const disconnectedApi = { ...mockApi, isConnected: false };
      const disconnectedPalletService = new KILTDIDPalletService(disconnectedApi, transactionService);

      await expect(
        disconnectedPalletService.addService({
          did,
          operation: 'add',
          service: {
            id: `${did}#service-1`,
            type: 'LinkedDomains',
            serviceEndpoint: 'https://example.com'
          }
        }, testAccount)
      ).rejects.toThrow('KILT API not connected');
    });

    test('should throw error when API not connected on setController', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const disconnectedApi = { ...mockApi, isConnected: false };
      const disconnectedPalletService = new KILTDIDPalletService(disconnectedApi, transactionService);

      await expect(
        disconnectedPalletService.setController(did, testAccount.address, testAccount)
      ).rejects.toThrow('KILT API not connected');
    });

    test('should throw error when API not connected on updateMetadata', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      const disconnectedApi = { ...mockApi, isConnected: false };
      const disconnectedPalletService = new KILTDIDPalletService(disconnectedApi, transactionService);

      await expect(
        disconnectedPalletService.updateMetadata(did, { test: true }, testAccount)
      ).rejects.toThrow('KILT API not connected');
    });

    test('should throw error when API not connected on executeBatchOperation', async () => {
      const disconnectedApi = { ...mockApi, isConnected: false };
      const disconnectedPalletService = new KILTDIDPalletService(disconnectedApi, transactionService);

      await expect(
        disconnectedPalletService.executeBatchOperation({
          operations: [{ type: 'create', data: { did: 'did:kilt:test' } }]
        }, testAccount)
      ).rejects.toThrow('KILT API not connected');
    });

    test('should throw error when DID already exists on creation', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as already existing
      jest.spyOn(palletService, 'queryDID').mockResolvedValueOnce({
        exists: true,
        did,
        document: {} as any
      });

      await expect(
        palletService.createDID({ did }, testAccount)
      ).rejects.toThrow(`DID ${did} already exists`);
    });

    test('should throw error when DID does not exist on update', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValueOnce({
        exists: false,
        did: null,
        document: null
      });

      const updateRequest = {
        did,
        addVerificationMethods: [{
          id: `${did}#key-new`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
        }]
      };

      await expect(
        palletService.updateDID(updateRequest, testAccount)
      ).rejects.toThrow(`DID ${did} does not exist`);
    });

    test('should throw error when DID does not exist on delete', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValueOnce({
        exists: false,
        did: null,
        document: null
      });

      await expect(
        palletService.deleteDID(did, testAccount)
      ).rejects.toThrow(`DID ${did} does not exist`);
    });

    test('should throw error when DID does not exist on addVerificationMethod', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValueOnce({
        exists: false,
        did: null,
        document: null
      });

      const operation = {
        did,
        operation: 'add' as const,
        verificationMethod: {
          id: `${did}#key-new`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
        }
      };

      await expect(
        palletService.addVerificationMethod(operation, testAccount)
      ).rejects.toThrow(`DID ${did} does not exist`);
    });

    test('should throw error when DID does not exist on addService', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValueOnce({
        exists: false,
        did: null,
        document: null
      });

      const operation = {
        did,
        operation: 'add' as const,
        service: {
          id: `${did}#service-new`,
          type: 'LinkedDomains',
          serviceEndpoint: 'https://example.com'
        }
      };

      await expect(
        palletService.addService(operation, testAccount)
      ).rejects.toThrow(`DID ${did} does not exist`);
    });

    test('should throw error when transaction submission fails', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock queryDID to return non-existent for createDID
      jest.spyOn(palletService, 'queryDID').mockResolvedValueOnce({
        exists: false,
        did: null,
        document: null
      });

      // Mock transaction service to fail
      jest.spyOn(transactionService, 'submitTransaction').mockRejectedValueOnce(
        new Error('Transaction failed: insufficient funds')
      );

      await expect(
        palletService.createDID({ did }, testAccount)
      ).rejects.toThrow('Failed to create DID');
    });
  });

  describe('Input Validation Error Handling', () => {
    test('should throw error for invalid DID identifier format', async () => {
      const invalidDIDs = [
        '',
        'not-a-did',
        'did:example:123',
        'did:kilt',
        null as any,
        undefined as any,
        123 as any
      ];

      for (const invalidDID of invalidDIDs) {
        await expect(
          palletService.createDID({ did: invalidDID }, testAccount)
        ).rejects.toThrow();
      }
    });

    test('should throw error when creating DID with invalid verification method', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock queryDID as non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: false,
        did: null,
        document: null
      });

      const invalidVM = {
        id: '', // Invalid empty ID
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
      };

      await expect(
        palletService.createDID({ did, verificationMethods: [invalidVM] }, testAccount)
      ).rejects.toThrow('Invalid verification method');
    });

    test('should throw error when creating DID with invalid service', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock queryDID as non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: false,
        did: null,
        document: null
      });

      const invalidService = {
        id: '', // Invalid empty ID
        type: 'LinkedDomains',
        serviceEndpoint: 'https://example.com'
      };

      await expect(
        palletService.createDID({ did, services: [invalidService] }, testAccount)
      ).rejects.toThrow('Invalid service');
    });

    test('should throw error when creating DID with invalid controller', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock queryDID as non-existent
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: false,
        did: null,
        document: null
      });

      await expect(
        palletService.createDID({ did, controller: 'invalid-address' }, testAccount)
      ).rejects.toThrow('Invalid');
    });

    test('should throw error when updating DID with invalid verification method', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock existing DID
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const invalidVM = {
        id: '', // Invalid empty ID
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
      };

      await expect(
        palletService.updateDID({ did, addVerificationMethods: [invalidVM] }, testAccount)
      ).rejects.toThrow('Invalid verification method');
    });

    test('should throw error when updating DID with invalid service', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock existing DID
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const invalidService = {
        id: '', // Invalid empty ID
        type: 'LinkedDomains',
        serviceEndpoint: 'https://example.com'
      };

      await expect(
        palletService.updateDID({ did, addServices: [invalidService] }, testAccount)
      ).rejects.toThrow('Invalid service');
    });

    test('should throw error when updating DID with invalid controller', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock existing DID
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      await expect(
        palletService.updateDID({ did, controller: 'invalid-address' }, testAccount)
      ).rejects.toThrow('Invalid');
    });

    test('should throw error for invalid verification method', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as existing
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const invalidOperations = [
        {
          did,
          operation: 'add' as const,
          verificationMethod: {
            id: '', // Invalid empty ID
            type: 'Ed25519VerificationKey2020',
            controller: did,
            publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
          }
        },
        {
          did,
          operation: 'add' as const,
          verificationMethod: {
            id: `${did}#key-1`,
            type: '', // Invalid empty type
            controller: did,
            publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
          }
        },
        {
          did,
          operation: 'add' as const,
          verificationMethod: {
            id: `${did}#key-1`,
            type: 'Ed25519VerificationKey2020',
            controller: did,
            publicKeyMultibase: '' // Invalid empty public key
          }
        }
      ];

      for (const operation of invalidOperations) {
        await expect(
          palletService.addVerificationMethod(operation, testAccount)
        ).rejects.toThrow();
      }
    });

    test('should throw error for invalid service endpoint', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as existing
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const invalidOperations = [
        {
          did,
          operation: 'add' as const,
          service: {
            id: '', // Invalid empty ID
            type: 'LinkedDomains',
            serviceEndpoint: 'https://example.com'
          }
        },
        {
          did,
          operation: 'add' as const,
          service: {
            id: `${did}#service-1`,
            type: '', // Invalid empty type
            serviceEndpoint: 'https://example.com'
          }
        },
        {
          did,
          operation: 'add' as const,
          service: {
            id: `${did}#service-1`,
            type: 'LinkedDomains',
            serviceEndpoint: '' // Invalid empty endpoint
          }
        }
      ];

      for (const operation of invalidOperations) {
        await expect(
          palletService.addService(operation, testAccount)
        ).rejects.toThrow();
      }
    });

    test('should throw error for invalid address format', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as existing
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const invalidAddresses = [
        '',
        'invalid-address',
        '123',
        'not-a-valid-ss58-address',
        null as any,
        undefined as any
      ];

      for (const invalidAddress of invalidAddresses) {
        await expect(
          palletService.setController(did, invalidAddress, testAccount)
        ).rejects.toThrow();
      }
    });

    test('should throw error for invalid operation type', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as existing
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const invalidOperation = {
        did,
        operation: 'invalid' as any, // Invalid operation type
        verificationMethod: {
          id: `${did}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP'
        }
      };

      await expect(
        palletService.addVerificationMethod(invalidOperation, testAccount)
      ).rejects.toThrow('Invalid operation type');
    });

    test('should throw error for empty batch operations', async () => {
      const emptyBatch = {
        operations: []
      };

      await expect(
        palletService.executeBatchOperation(emptyBatch, testAccount)
      ).rejects.toThrow('No operations specified for batch execution');
    });

    test('should throw error when updateDID has no operations', async () => {
      const did = `did:kilt:${testAccount.address}`;
      
      // Mock DID as existing
      jest.spyOn(palletService, 'queryDID').mockResolvedValue({
        exists: true,
        did,
        document: {} as any
      });

      const emptyUpdateRequest = {
        did
        // No operations specified
      };

      await expect(
        palletService.updateDID(emptyUpdateRequest, testAccount)
      ).rejects.toThrow('No update operations specified');
    });
  });
});

