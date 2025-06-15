import request from 'supertest';
import { createServer } from '../server';
import { UnifiedVerificationService } from '../UnifiedVerificationService';

// Mock the UnifiedVerificationService
jest.mock('../UnifiedVerificationService');

describe('Server with UnifiedVerificationService', () => {
  let mockUnifiedService: jest.Mocked<UnifiedVerificationService>;
  let app: ReturnType<typeof createServer>;

  const POLKADOT_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const ETHEREUM_ADDRESS = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b';
  const VALID_SIGNATURE = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b';
  const VALID_DID = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';

  const FIXED_TIMESTAMP = '2025-06-15T04:00:00.000Z';

  const createValidPolkadotRequest = () => ({
    message: `KeyPass Login\nIssued At: ${FIXED_TIMESTAMP}\nNonce: abc123\nAddress: ${POLKADOT_ADDRESS}`,
    signature: VALID_SIGNATURE,
    address: POLKADOT_ADDRESS,
  });

  const createValidEthereumRequest = () => ({
    message: `KeyPass Login\nIssued At: ${FIXED_TIMESTAMP}\nNonce: abc123\nAddress: ${ETHEREUM_ADDRESS}`,
    signature: VALID_SIGNATURE,
    address: ETHEREUM_ADDRESS,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUnifiedService = {
      verifySignature: jest.fn(),
    } as unknown as jest.Mocked<UnifiedVerificationService>;

    (UnifiedVerificationService as jest.MockedClass<typeof UnifiedVerificationService>).mockImplementation(() => mockUnifiedService);
    
    app = createServer();
  });

  describe('POST /api/verify', () => {
    it('should verify Polkadot signatures successfully', async () => {
      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
        data: { chainType: 'polkadot' },
      });

      const response = await request(app)
        .post('/api/verify')
        .send(createValidPolkadotRequest())
        .expect(200);

      expect(response.body).toEqual({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
        data: { chainType: 'polkadot' },
      });

      expect(mockUnifiedService.verifySignature).toHaveBeenCalledWith(createValidPolkadotRequest());
    });

    it('should verify Ethereum signatures successfully', async () => {
      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
        data: { chainType: 'ethereum' },
      });

      const response = await request(app)
        .post('/api/verify')
        .send(createValidEthereumRequest())
        .expect(200);

      expect(response.body).toEqual({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
        data: { chainType: 'ethereum' },
      });

      expect(mockUnifiedService.verifySignature).toHaveBeenCalledWith(createValidEthereumRequest());
    });

    it('should handle explicit chain type specification', async () => {
      const requestWithChainType = {
        ...createValidEthereumRequest(),
        chainType: 'ethereum' as const,
      };

      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
        data: { chainType: 'ethereum' },
      });

      const response = await request(app)
        .post('/api/verify')
        .send(requestWithChainType)
        .expect(200);

      expect(response.body).toEqual({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
        data: { chainType: 'ethereum' },
      });

      expect(mockUnifiedService.verifySignature).toHaveBeenCalledWith(requestWithChainType);
    });

    it('should handle verification errors', async () => {
      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'error',
        message: 'Invalid signature',
        code: 'VERIFICATION_FAILED',
      });

      const response = await request(app)
        .post('/api/verify')
        .send(createValidPolkadotRequest())
        .expect(400);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid signature',
        code: 'VERIFICATION_FAILED',
      });
    });

    it('should handle unsupported chain types', async () => {
      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'error',
        message: 'Unsupported chain type: bitcoin',
        code: 'UNSUPPORTED_CHAIN_TYPE',
      });

      const response = await request(app)
        .post('/api/verify')
        .send({
          ...createValidEthereumRequest(),
          chainType: 'bitcoin',
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Unsupported chain type: bitcoin',
        code: 'UNSUPPORTED_CHAIN_TYPE',
      });
    });

    it('should handle unknown address formats', async () => {
      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'error',
        message: 'Unable to determine chain type from address format',
        code: 'UNKNOWN_ADDRESS_FORMAT',
      });

      const response = await request(app)
        .post('/api/verify')
        .send({
          ...createValidEthereumRequest(),
          address: 'invalid-address-format',
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Unable to determine chain type from address format',
        code: 'UNKNOWN_ADDRESS_FORMAT',
      });
    });

    it('should handle service exceptions', async () => {
      mockUnifiedService.verifySignature.mockRejectedValue(new Error('Service crashed'));

      const response = await request(app)
        .post('/api/verify')
        .send(createValidPolkadotRequest())
        .expect(500);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should handle invalid request body', async () => {
      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'error',
        message: 'Invalid request format',
        code: 'INVALID_REQUEST',
      });

      const response = await request(app)
        .post('/api/verify')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid request format',
        code: 'INVALID_REQUEST',
      });
    });

    it('should handle missing required fields', async () => {
      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'error',
        message: 'Invalid request format',
        code: 'INVALID_REQUEST',
      });

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: 'test',
          // missing signature and address
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid request format',
        code: 'INVALID_REQUEST',
      });
    });
  });

  describe('CORS and middleware', () => {
    it('should handle CORS preflight requests', async () => {
      await request(app)
        .options('/api/verify')
        .expect(204);
    });

    it('should include CORS headers', async () => {
      mockUnifiedService.verifySignature.mockResolvedValue({
        status: 'success',
        message: 'Verification successful',
        code: 'SUCCESS',
        did: VALID_DID,
      });

      const response = await request(app)
        .post('/api/verify')
        .send(createValidPolkadotRequest())
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });
}); 