import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { KILTDIDPalletService } from '../services/KILTDIDPalletService.js';
import { KILTTransactionService } from '../services/KILTTransactionService.js';
import { KILTError, KILTErrorType } from '../types/KILTTypes.js';

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
});

