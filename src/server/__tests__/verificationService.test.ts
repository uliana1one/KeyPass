import { VerificationService, ERROR_CODES } from '../verificationService';
import { PolkadotDIDProvider } from '../../did/UUIDProvider';
import { MessageValidationError, AddressValidationError } from '../../errors/WalletErrors';
import { buildLoginMessage } from '../../message/messageBuilder';

// Mock dependencies
jest.mock('../../did/UUIDProvider');
jest.mock('../../message/messageBuilder');
jest.mock('@polkadot/util-crypto', () => {
  const mockSr25519Verify = jest.fn();
  const mockEd25519Verify = jest.fn();
  return {
    sr25519Verify: mockSr25519Verify,
    ed25519Verify: mockEd25519Verify,
    hexToU8a: jest.fn().mockImplementation((hex) => new Uint8Array(hex.length / 2))
  };
});

jest.mock('../../adapters/types', () => ({
  validatePolkadotAddress: jest.fn(),
  validateSignature: jest.fn()
}));

describe('VerificationService', () => {
  let service: VerificationService;
  let mockDidProvider: jest.Mocked<PolkadotDIDProvider>;
  const VALID_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const VALID_SIGNATURE = '0x' + '1'.repeat(128);
  const VALID_DID = 'did:key:z' + '1'.repeat(58);
  let sr25519Verify: jest.Mock;
  let ed25519Verify: jest.Mock;
  let validateSignature: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock functions
    const crypto = require('@polkadot/util-crypto');
    const adapters = require('../../adapters/types');
    sr25519Verify = crypto.sr25519Verify;
    ed25519Verify = crypto.ed25519Verify;
    validateSignature = adapters.validateSignature;
    
    // Setup mock DID provider
    mockDidProvider = {
      createDid: jest.fn().mockResolvedValue(VALID_DID),
      createDIDDocument: jest.fn().mockResolvedValue({
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: VALID_DID,
        controller: VALID_DID,
        verificationMethod: [],
        authentication: [],
        assertionMethod: [],
        keyAgreement: [],
        capabilityInvocation: [],
        capabilityDelegation: [],
        service: []
      })
    } as unknown as jest.Mocked<PolkadotDIDProvider>;

    ((PolkadotDIDProvider as unknown) as jest.Mock).mockImplementation(() => mockDidProvider);
    
    // Create service instance
    service = new VerificationService();
  });

  describe('Message Format Validation', () => {
    const createValidMessage = (address: string = VALID_ADDRESS) => 
      `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: ${Math.random().toString(36)}\nAddress: ${address}`;

    it('should accept valid message format', () => {
      const message = createValidMessage();
      expect(() => (service as any).validateMessageFormat(message, VALID_ADDRESS)).not.toThrow();
    });

    it('should reject message without KeyPass Login prefix', () => {
      const message = `Invalid Prefix\nIssued At: ${new Date().toISOString()}\nNonce: abc\nAddress: ${VALID_ADDRESS}`;
      expect(() => (service as any).validateMessageFormat(message, VALID_ADDRESS))
        .toThrow(MessageValidationError);
    });

    it('should reject message with missing required fields', () => {
      const message = 'KeyPass Login\nIssued At: 2024-03-20T12:00:00Z\nAddress: ' + VALID_ADDRESS;
      expect(() => (service as any).validateMessageFormat(message, VALID_ADDRESS))
        .toThrow(MessageValidationError);
    });

    it('should reject message with invalid timestamp format', () => {
      const message = `KeyPass Login\nIssued At: invalid-date\nNonce: abc\nAddress: ${VALID_ADDRESS}`;
      expect(() => (service as any).validateMessageFormat(message, VALID_ADDRESS))
        .toThrow(MessageValidationError);
    });

    it('should reject message with address mismatch', () => {
      const message = createValidMessage('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');
      expect(() => (service as any).validateMessageFormat(message, VALID_ADDRESS))
        .toThrow(MessageValidationError);
    });

    it('should reject message with unexpected content', () => {
      const message = createValidMessage() + '\nExtra Line';
      expect(() => (service as any).validateMessageFormat(message, VALID_ADDRESS))
        .toThrow(MessageValidationError);
    });

    it('should reject message with incorrect field order', () => {
      const message = `KeyPass Login\nAddress: ${VALID_ADDRESS}\nIssued At: ${new Date().toISOString()}\nNonce: abc`;
      expect(() => (service as any).validateMessageFormat(message, VALID_ADDRESS))
        .toThrow(MessageValidationError);
    });
  });

  describe('Message Timestamp Validation', () => {
    const createMessageWithTimestamp = (timestamp: Date) =>
      `KeyPass Login\nIssued At: ${timestamp.toISOString()}\nNonce: abc\nAddress: ${VALID_ADDRESS}`;

    it('should accept message with valid timestamp', () => {
      const message = createMessageWithTimestamp(new Date());
      expect(() => (service as any).validateMessageTimestamp(message)).not.toThrow();
    });

    it('should reject expired message', () => {
      const expiredDate = new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago
      const message = createMessageWithTimestamp(expiredDate);
      expect(() => (service as any).validateMessageTimestamp(message))
        .toThrow(MessageValidationError);
    });

    it('should reject future-dated message', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes in future
      const message = createMessageWithTimestamp(futureDate);
      expect(() => (service as any).validateMessageTimestamp(message))
        .toThrow(MessageValidationError);
    });

    it('should reject message with invalid timestamp format', () => {
      const message = `KeyPass Login\nIssued At: invalid-date\nNonce: abc\nAddress: ${VALID_ADDRESS}`;
      expect(() => (service as any).validateMessageTimestamp(message))
        .toThrow(MessageValidationError);
    });
  });

  describe('Signature Verification', () => {
    const createValidRequest = () => ({
      message: `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc\nAddress: ${VALID_ADDRESS}`,
      signature: VALID_SIGNATURE,
      address: VALID_ADDRESS
    });

    beforeEach(() => {
      // Reset crypto mocks to default false
      sr25519Verify.mockReturnValue(false);
      ed25519Verify.mockReturnValue(false);
      // Don't throw for valid signature format
      validateSignature.mockImplementation(() => {});
    });

    it('should verify valid sr25519 signature', async () => {
      sr25519Verify.mockReturnValueOnce(true);
      validateSignature.mockImplementation(() => {}); // Don't throw for valid signature

      const result = await service.verifySignature(createValidRequest());
      expect(result).toEqual({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID
      });
    });

    it('should verify valid ed25519 signature', async () => {
      sr25519Verify.mockReturnValue(false);
      ed25519Verify.mockReturnValue(true);
      validateSignature.mockImplementation(() => {}); // Don't throw for valid signature

      const result = await service.verifySignature(createValidRequest());
      expect(result).toEqual({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID
      });
    });

    it('should reject invalid signature format', async () => {
      validateSignature.mockImplementation(() => {
        throw new Error('Invalid signature format: missing 0x prefix');
      });

      const result = await service.verifySignature({
        ...createValidRequest(),
        signature: 'invalid-signature'
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid signature format',
        code: ERROR_CODES.INVALID_SIGNATURE_FORMAT
      });
    });

    it('should reject invalid signature length', async () => {
      validateSignature.mockImplementation(() => {
        throw new Error('Invalid signature length: must be 0x + 128 hex chars (sr25519) or 0x + 64 hex chars (ed25519)');
      });

      const result = await service.verifySignature({
        ...createValidRequest(),
        signature: '0x' + '1'.repeat(64) // Too short
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid signature length',
        code: ERROR_CODES.INVALID_SIGNATURE_LENGTH
      });
    });

    it('should reject failed verification', async () => {
      sr25519Verify.mockReturnValue(false);
      ed25519Verify.mockReturnValue(false);

      const result = await service.verifySignature(createValidRequest());
      expect(result).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: ERROR_CODES.VERIFICATION_FAILED
      });
    });

    it('should handle verification errors gracefully', async () => {
      sr25519Verify.mockImplementation(() => {
        throw new Error('Verification error');
      });

      const result = await service.verifySignature(createValidRequest());
      expect(result).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: ERROR_CODES.VERIFICATION_FAILED
      });
    });
  });

  describe('DID Creation', () => {
    const createValidRequest = () => ({
      message: `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc\nAddress: ${VALID_ADDRESS}`,
      signature: VALID_SIGNATURE,
      address: VALID_ADDRESS
    });

    beforeEach(() => {
      // Set up our mocks with explicit implementations
      sr25519Verify.mockReturnValue(true);
      ed25519Verify.mockReturnValue(false);
    });

    it('should create DID for valid address', async () => {
      const result = await service.verifySignature(createValidRequest());
      
      expect(result).toEqual({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID
      });
      expect(mockDidProvider.createDid).toHaveBeenCalledWith(VALID_ADDRESS);
    });

    it('should handle DID creation failure', async () => {
      mockDidProvider.createDid.mockRejectedValueOnce(new Error('DID creation failed'));

      const result = await service.verifySignature(createValidRequest());
      expect(result).toEqual({
        status: 'error',
        message: 'Failed to create DID',
        code: ERROR_CODES.DID_CREATION_FAILED
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid request format', async () => {
      const result = await service.verifySignature(null as any);
      expect(result).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: ERROR_CODES.INVALID_REQUEST
      });
    });

    it('should handle missing message', async () => {
      const result = await service.verifySignature({
        signature: VALID_SIGNATURE,
        address: VALID_ADDRESS
      } as any);

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: ERROR_CODES.INVALID_REQUEST
      });
    });

    it('should handle message too long', async () => {
      const result = await service.verifySignature({
        message: 'a'.repeat(257), // Exceeds MAX_MESSAGE_LENGTH
        signature: VALID_SIGNATURE,
        address: VALID_ADDRESS
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Message exceeds maximum length of 256 characters',
        code: ERROR_CODES.MESSAGE_TOO_LONG
      });
    });

    it('should handle invalid address format', async () => {
      const result = await service.verifySignature({
        message: `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc\nAddress: invalid-address`,
        signature: VALID_SIGNATURE,
        address: 'invalid-address'
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: ERROR_CODES.VERIFICATION_FAILED
      });
    });
  });

  describe('Message Rebuilding', () => {
    it('should rebuild message with template', async () => {
      const address = VALID_ADDRESS;
      const nonce = 'test-nonce';
      const issuedAt = new Date().toISOString();
      const expectedMessage = 'rebuilt message';

      (buildLoginMessage as jest.Mock).mockReturnValueOnce(expectedMessage);

      const result = await service.rebuildMessage(address, nonce, issuedAt);
      expect(result).toBe(expectedMessage);
      expect(buildLoginMessage).toHaveBeenCalledWith({
        template: expect.any(String),
        address,
        nonce,
        issuedAt
      });
    });
  });
}); 