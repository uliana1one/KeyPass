import { loginWithPolkadot, LoginResult } from '../../index';
import { WalletNotFoundError, UserRejectedError } from '../../errors/WalletErrors';
import { PolkadotJsAdapter } from '../../adapters/PolkadotJsAdapter';
import { TalismanAdapter } from '../../adapters/TalismanAdapter';
import { InjectedWindow } from '@polkadot/extension-inject/types';
import { connectWallet } from '@/walletConnector';
import { VerificationService, ERROR_CODES } from '../../server/verificationService';
import { WalletAdapter } from '../../adapters/types';
import { PolkadotDIDProvider } from '../../did/UUIDProvider';
import { DIDDocument } from '../../did/types';

// Define MockedWalletAdapter type directly
type MockedWalletAdapter = {
  enable: jest.Mock;
  getAccounts: jest.Mock;
  signMessage: jest.Mock;
  getProvider: jest.Mock;
  disconnect: jest.Mock;
  validateAddress: jest.Mock;
  on: jest.Mock;
  off: jest.Mock;
};

// Mock the walletConnector module
jest.mock('@/walletConnector', () => ({
  connectWallet: jest.fn(),
}));

// Mock the verification service
jest.mock('@/server/verificationService', () => {
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
jest.mock('@/did/UUIDProvider', () => {
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

// Extend Window interface to include injectedWeb3
declare global {
  interface Window {
    injectedWeb3?: Record<string, any>;
  }
}

describe('Authentication E2E Tests', () => {
  let mockAdapter: MockedWalletAdapter;
  let verificationService: jest.Mocked<VerificationService>;
  let mockCreateDid: jest.Mock;
  let mockCreateDIDDocument: jest.Mock;
  let mockResolve: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get the mock functions from the module
    const mocks = require('@/did/UUIDProvider');
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
      signMessage: jest.fn().mockResolvedValue('0x' + '1'.repeat(128)),
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

  describe('Complete Authentication Flow', () => {
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
      expect(mockCreateDid).toHaveBeenCalledWith(accounts[0].address);

      // Verify result structure
      expect(result).toEqual({
        address: expect.any(String),
        did: expect.any(String),
        message: expect.any(String),
        signature: expect.any(String),
        issuedAt: expect.any(String),
        nonce: expect.any(String),
      });

      // Verify message format
      expect(result.message).toMatch(/^KeyPass Login\nIssued At: .*\nNonce: .*\nAddress: .*$/);
    });
  });

  describe('Complete Authentication and DID Resolution Flow', () => {
    it('should complete full flow from wallet connection to DID resolution', async () => {
      // 1. Connect wallet and login
      const loginResult = await loginWithPolkadot();

      // 2. Verify login result
      expect(loginResult.did).toBeDefined();
      expect(loginResult.address).toBe('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');

      // 3. Create DID document
      const didProvider = new PolkadotDIDProvider();
      const didDocument = await didProvider.createDIDDocument(loginResult.address);

      // 4. Verify DID document structure
      expect(didDocument.id).toBe(loginResult.did);
      expect(didDocument.verificationMethod).toHaveLength(1);
      expect(didDocument.authentication).toHaveLength(1);
      expect((didDocument as DIDDocument).assertionMethod!).toHaveLength(1);
      expect(didDocument.capabilityInvocation).toHaveLength(1);
      expect(didDocument.capabilityDelegation).toHaveLength(1);

      // 5. Verify DID document relationships
      const verificationMethod = didDocument.verificationMethod![0];
      expect(verificationMethod.type).toBe('Sr25519VerificationKey2020');
      expect(verificationMethod.controller).toBe(loginResult.did);
      expect(didDocument.authentication![0]).toBe(verificationMethod.id);
      expect((didDocument as DIDDocument).assertionMethod![0]).toBe(verificationMethod.id);

      // 6. Verify DID resolution
      const resolvedDocument = await didProvider.resolve(loginResult.did);
      expect(resolvedDocument).toEqual(didDocument);

      // 7. Verify DID can be used for verification
      const verificationResult = await verificationService.verifySignature({
        message: loginResult.message,
        signature: loginResult.signature,
        address: loginResult.address,
      });

      expect(verificationResult.status).toBe('success');
      expect(verificationResult.did).toBe(loginResult.did);
    });

    it('should maintain DID consistency across operations', async () => {
      // 1. First login
      const loginResult1 = await loginWithPolkadot();
      const didProvider = new PolkadotDIDProvider();
      const didDocument1 = await didProvider.createDIDDocument(loginResult1.address);

      // 2. Second login with same account
      const loginResult2 = await loginWithPolkadot();
      const didDocument2 = await didProvider.createDIDDocument(loginResult2.address);

      // 3. Verify DID consistency
      expect(loginResult1.did).toBe(loginResult2.did);
      expect(didDocument1.id).toBe(didDocument2.id);
      expect(didDocument1.verificationMethod![0].publicKeyMultibase).toBe(
        didDocument2.verificationMethod![0].publicKeyMultibase
      );

      // 4. Verify both DIDs can be resolved
      const resolvedDoc1 = await didProvider.resolve(loginResult1.did);
      const resolvedDoc2 = await didProvider.resolve(loginResult2.did);
      expect(resolvedDoc1).toEqual(resolvedDoc2);
    });

    it('should handle concurrent DID operations', async () => {
      const didProvider = new PolkadotDIDProvider();
      const address = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

      // Perform concurrent DID operations
      const [doc1, doc2, doc3] = await Promise.all([
        didProvider.createDIDDocument(address),
        didProvider.createDIDDocument(address),
        didProvider.createDIDDocument(address),
      ]);

      // Verify all documents are identical
      expect(doc1).toEqual(doc2);
      expect(doc2).toEqual(doc3);

      // Verify concurrent resolution
      const [resolved1, resolved2, resolved3] = await Promise.all([
        didProvider.resolve(doc1.id),
        didProvider.resolve(doc2.id),
        didProvider.resolve(doc3.id),
      ]);

      expect(resolved1).toEqual(resolved2);
      expect(resolved2).toEqual(resolved3);
    });
  });
});
