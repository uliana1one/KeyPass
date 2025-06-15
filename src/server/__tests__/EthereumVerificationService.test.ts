import { EthereumVerificationService } from '../EthereumVerificationService';
import { EthereumDIDProvider } from '../../did/EthereumDIDProvider';
import { AddressValidationError, MessageValidationError } from '../../errors/WalletErrors';

// Mock the EthereumDIDProvider
jest.mock('../../did/EthereumDIDProvider');

// Mock ethers for signature verification
jest.mock('ethers', () => ({
  verifyMessage: jest.fn(),
}));

describe('EthereumVerificationService', () => {
  let service: EthereumVerificationService;
  let mockDIDProvider: jest.Mocked<EthereumDIDProvider>;
  
  const VALID_ADDRESS = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b';
  const VALID_SIGNATURE = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b';
  const VALID_DID = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';

  const createValidRequest = () => ({
    message: `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc123\nAddress: ${VALID_ADDRESS}`,
    signature: VALID_SIGNATURE,
    address: VALID_ADDRESS,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock DID provider
    mockDIDProvider = {
      createDid: jest.fn().mockResolvedValue(VALID_DID),
      createDIDDocument: jest.fn(),
      resolve: jest.fn(),
      extractAddress: jest.fn(),
    } as unknown as jest.Mocked<EthereumDIDProvider>;

    (EthereumDIDProvider as jest.MockedClass<typeof EthereumDIDProvider>).mockImplementation(() => mockDIDProvider);

    service = new EthereumVerificationService();
  });

  describe('constructor', () => {
    it('should create an instance with DID provider', () => {
      expect(service).toBeInstanceOf(EthereumVerificationService);
      expect(EthereumDIDProvider).toHaveBeenCalled();
    });
  });

  describe('verifySignature', () => {
    it('should verify valid Ethereum signature successfully', async () => {
      const { verifyMessage } = require('ethers');
      verifyMessage.mockReturnValue(VALID_ADDRESS.toLowerCase());

      const result = await service.verifySignature(createValidRequest());

      expect(result).toEqual({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
      });
    });

    it('should reject invalid request format', async () => {
      const result = await service.verifySignature(null as any);

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: 'INVALID_REQUEST',
      });
    });

    it('should reject request with missing fields', async () => {
      const result = await service.verifySignature({
        message: '',
        signature: VALID_SIGNATURE,
        address: VALID_ADDRESS,
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: 'INVALID_REQUEST',
      });
    });

    it('should reject invalid Ethereum address format', async () => {
      const result = await service.verifySignature({
        ...createValidRequest(),
        address: 'invalid-address',
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid Ethereum address',
        code: 'INVALID_ADDRESS',
      });
    });

    it('should reject invalid signature format', async () => {
      const result = await service.verifySignature({
        ...createValidRequest(),
        signature: 'invalid-signature',
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid signature format',
        code: 'INVALID_SIGNATURE_FORMAT',
      });
    });

    it('should reject signature verification failure', async () => {
      const { verifyMessage } = require('ethers');
      verifyMessage.mockReturnValue('0xdifferentaddress');

      const result = await service.verifySignature(createValidRequest());

      expect(result).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: 'VERIFICATION_FAILED',
      });
    });

    it('should handle message too long', async () => {
      const longMessage = 'a'.repeat(300);
      const result = await service.verifySignature({
        ...createValidRequest(),
        message: longMessage,
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Message exceeds maximum length of 256 characters',
        code: 'MESSAGE_TOO_LONG',
      });
    });

    it('should validate message timestamp', async () => {
      const expiredMessage = `KeyPass Login\nIssued At: 2020-01-01T00:00:00.000Z\nNonce: abc123\nAddress: ${VALID_ADDRESS}`;
      const result = await service.verifySignature({
        ...createValidRequest(),
        message: expiredMessage,
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Message has expired',
        code: 'MESSAGE_EXPIRED',
      });
    });

    it('should handle DID creation failure', async () => {
      const { verifyMessage } = require('ethers');
      verifyMessage.mockReturnValue(VALID_ADDRESS.toLowerCase());
      mockDIDProvider.createDid.mockRejectedValue(new Error('DID creation failed'));

      const result = await service.verifySignature(createValidRequest());

      expect(result).toEqual({
        status: 'error',
        message: 'Failed to create DID',
        code: 'DID_CREATION_FAILED',
      });
    });

    it('should handle ethers verification errors', async () => {
      const { verifyMessage } = require('ethers');
      verifyMessage.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = await service.verifySignature(createValidRequest());

      expect(result).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: 'VERIFICATION_FAILED',
      });
    });

    it('should normalize addresses to lowercase for comparison', async () => {
      const { verifyMessage } = require('ethers');
      verifyMessage.mockReturnValue(VALID_ADDRESS.toUpperCase());

      const result = await service.verifySignature({
        ...createValidRequest(),
        address: VALID_ADDRESS.toLowerCase(),
      });

      expect(result).toEqual({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
      });
    });
  });

  describe('message validation', () => {
    it('should validate message format', async () => {
      const invalidMessage = 'Invalid message format';
      const result = await service.verifySignature({
        ...createValidRequest(),
        message: invalidMessage,
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid message format: missing required fields',
        code: 'INVALID_MESSAGE_FORMAT',
      });
    });

    it('should validate message contains correct address', async () => {
      const messageWithWrongAddress = `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc123\nAddress: 0xdifferentaddress`;
      const result = await service.verifySignature({
        ...createValidRequest(),
        message: messageWithWrongAddress,
      });

      expect(result).toEqual({
        status: 'error',
        message: 'Message address does not match request address',
        code: 'INVALID_MESSAGE_FORMAT',
      });
    });
  });

  describe('signature format validation', () => {
    it('should accept valid Ethereum signature format', async () => {
      const { verifyMessage } = require('ethers');
      verifyMessage.mockReturnValue(VALID_ADDRESS.toLowerCase());

      const validSignatures = [
        '0x' + '1'.repeat(130), // 65 bytes
        '0x' + 'a'.repeat(130), // 65 bytes with hex chars
      ];

      for (const signature of validSignatures) {
        const result = await service.verifySignature({
          ...createValidRequest(),
          signature,
        });

        expect(result.status).toBe('success');
      }
    });

    it('should reject invalid signature formats', async () => {
      const invalidSignatures = [
        'no-0x-prefix',
        '0x' + '1'.repeat(64), // Too short
        '0x' + '1'.repeat(140), // Too long
        '0x' + 'g'.repeat(130), // Invalid hex
      ];

      for (const signature of invalidSignatures) {
        const result = await service.verifySignature({
          ...createValidRequest(),
          signature,
        });

        expect(result).toEqual({
          status: 'error',
          message: 'Invalid signature format',
          code: 'INVALID_SIGNATURE_FORMAT',
        });
      }
    });
  });
}); 