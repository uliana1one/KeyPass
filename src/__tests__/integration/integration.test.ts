/// <reference types="jest" />

import { loginWithPolkadot, LoginResult } from '../../index';
import { WalletNotFoundError, UserRejectedError } from '../../errors/WalletErrors';
import { connectWallet } from '@/walletConnector';
import { VerificationService, ERROR_CODES } from '../../server/verificationService';
import { WalletAdapter } from '../../adapters/types';
import { PolkadotDIDProvider } from '../../did/UUIDProvider';
import { VerificationResponse } from '../../server/types';
import { MockedWalletAdapter } from '../types';

// Mock the walletConnector module
jest.mock('../../walletConnector', () => ({
  connectWallet: jest.fn(),
}));

// Mock the verification service
jest.mock('../../server/verificationService', () => {
  const mockVerifySignature = jest.fn().mockResolvedValue({
    status: 'success',
    message: 'Verification successful',
    code: 'SUCCESS',
    did: 'did:key:z' + '1'.repeat(58),
  });

  return {
    VerificationService: jest.fn().mockImplementation(() => ({
      verifySignature: mockVerifySignature,
    })),
    ERROR_CODES: {
      VERIFICATION_FAILED: 'VERIFICATION_FAILED',
      INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
      INVALID_REQUEST: 'INVALID_REQUEST',
      INVALID_JSON: 'INVALID_JSON',
      MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
      INVALID_SIGNATURE_FORMAT: 'INVALID_SIGNATURE_FORMAT',
      INVALID_SIGNATURE_LENGTH: 'INVALID_SIGNATURE_LENGTH',
      INVALID_ADDRESS: 'INVALID_ADDRESS',
      MESSAGE_EXPIRED: 'MESSAGE_EXPIRED',
      MESSAGE_FUTURE: 'MESSAGE_FUTURE',
      DID_CREATION_FAILED: 'DID_CREATION_FAILED',
    },
  };
});

// Mock the UUID provider
jest.mock('../../did/UUIDProvider', () => {
  const mockCreateDid = jest.fn().mockResolvedValue('did:key:z' + '1'.repeat(58));
  const mockCreateDIDDocument = jest.fn().mockResolvedValue({
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
      'https://w3id.org/security/suites/sr25519-2020/v1',
    ],
    id: 'did:key:z' + '1'.repeat(58),
    controller: 'did:key:z' + '1'.repeat(58),
    verificationMethod: [
      {
        id: 'did:key:z' + '1'.repeat(58) + '#key-1',
        type: 'Sr25519VerificationKey2020',
        controller: 'did:key:z' + '1'.repeat(58),
        publicKeyMultibase: 'z' + '1'.repeat(58),
      },
    ],
    authentication: ['did:key:z' + '1'.repeat(58) + '#key-1'],
    assertionMethod: ['did:key:z' + '1'.repeat(58) + '#key-1'],
    keyAgreement: [],
    capabilityInvocation: ['did:key:z' + '1'.repeat(58) + '#key-1'],
    capabilityDelegation: ['did:key:z' + '1'.repeat(58) + '#key-1'],
    service: [],
  });

  const mockResolve = jest.fn().mockImplementation(async (did: string) => {
    if (did === 'did:key:z' + '1'.repeat(58)) {
      return mockCreateDIDDocument();
    }
    throw new Error('DID not found');
  });

  const MockPolkadotDIDProvider = jest.fn().mockImplementation(() => ({
    createDid: mockCreateDid,
    createDIDDocument: mockCreateDIDDocument,
    resolve: mockResolve,
  }));

  return {
    PolkadotDIDProvider: MockPolkadotDIDProvider,
    __mockCreateDid: mockCreateDid,
    __mockCreateDIDDocument: mockCreateDIDDocument,
    __mockResolve: mockResolve,
  };
});

describe('Authentication Integration Tests', () => {
  let mockAdapter: MockedWalletAdapter;
  let verificationService: jest.Mocked<VerificationService>;
  let mockCreateDid: jest.Mock;
  let mockCreateDIDDocument: jest.Mock;
  let mockResolve: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get the mock functions from the module
    const mocks = require('../../did/UUIDProvider');
    mockCreateDid = mocks.__mockCreateDid;
    mockCreateDIDDocument = mocks.__mockCreateDIDDocument;
    mockResolve = mocks.__mockResolve;

    // Setup mock adapter
    mockAdapter = {
      enable: jest.fn().mockResolvedValue(undefined),
      getAccounts: jest.fn().mockResolvedValue([
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          name: 'Test Account',
          source: 'test',
        },
      ]),
      signMessage: jest.fn().mockResolvedValue('0x1234'),
      getProvider: jest.fn().mockReturnValue('test'),
      disconnect: jest.fn().mockResolvedValue(undefined),
      validateAddress: jest.fn().mockResolvedValue(true),
      on: jest.fn(),
      off: jest.fn(),
    };

    // Get the mock instance
    verificationService = new VerificationService() as jest.Mocked<VerificationService>;

    // Setup wallet connector mock to call enable() before returning the adapter
    (connectWallet as jest.Mock).mockImplementation(async () => {
      await mockAdapter.enable();
      return mockAdapter;
    });
  });

  describe('Wallet Integration', () => {
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

  describe('Verification Service Integration', () => {
    it('should handle signature verification failures', async () => {
      // Mock verification service to return an error response
      (verificationService.verifySignature as jest.Mock).mockResolvedValueOnce({
        status: 'error',
        message: 'Invalid signature',
        code: ERROR_CODES.VERIFICATION_FAILED,
      });

      await expect(loginWithPolkadot()).rejects.toThrow('Invalid signature');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent login attempts', async () => {
      const attempts = Array(5)
        .fill(null)
        .map(() => loginWithPolkadot());
      const results: LoginResult[] = await Promise.all(attempts);

      // Verify all attempts succeeded
      results.forEach((result: LoginResult) => {
        expect(result).toEqual({
          address: expect.any(String),
          did: expect.any(String),
          message: expect.any(String),
          signature: expect.any(String),
          issuedAt: expect.any(String),
          nonce: expect.any(String),
        });
      });

      // Verify each attempt used a unique nonce
      const nonces = results.map((r: LoginResult) => r.nonce);
      const uniqueNonces = new Set(nonces);
      expect(uniqueNonces.size).toBe(nonces.length);
    });

    it('should handle concurrent wallet connections', async () => {
      // Create unique mock adapters for each connection
      const mockAdapters = Array(3)
        .fill(null)
        .map(() => ({
          ...mockAdapter,
          getProvider: jest.fn().mockReturnValue('polkadot-js'),
        }));

      // Mock connectWallet to return different adapters
      (connectWallet as jest.Mock)
        .mockResolvedValueOnce(mockAdapters[0])
        .mockResolvedValueOnce(mockAdapters[1])
        .mockResolvedValueOnce(mockAdapters[2]);

      const connections = Array(3)
        .fill(null)
        .map(() => connectWallet());
      const adapters = await Promise.all(connections);

      // Verify all connections succeeded
      adapters.forEach((adapter) => {
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
      // Simulate temporary failure then success
      (connectWallet as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockAdapter);

      const result = await loginWithPolkadot();
      expect(result).toBeDefined();
      expect(connectWallet).toHaveBeenCalledTimes(2);
    });
  });

  describe('DID Provider Integration', () => {
    it('should handle DID resolution failures', async () => {
      // Mock DID resolution to fail for invalid DID
      mockResolve.mockImplementationOnce(async () => {
        throw new Error('DID not found');
      });

      const loginResult = await loginWithPolkadot();
      const didProvider = new PolkadotDIDProvider();

      // Attempt to resolve DID
      await expect(didProvider.resolve('invalid-did')).rejects.toThrow('DID not found');

      // Verify the DID document is still valid
      const didDocument = await didProvider.createDIDDocument(loginResult.address);
      expect(didDocument.id).toBe(loginResult.did);
    });
  });
});
