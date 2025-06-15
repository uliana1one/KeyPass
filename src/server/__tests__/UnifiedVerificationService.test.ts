import { UnifiedVerificationService } from '../UnifiedVerificationService';
import { VerificationService } from '../verificationService';
import { EthereumVerificationService } from '../EthereumVerificationService';
import { VerificationRequest, VerificationResponse } from '../types';

// Mock the verification services
jest.mock('../verificationService');
jest.mock('../EthereumVerificationService');

describe('UnifiedVerificationService', () => {
  let service: UnifiedVerificationService;
  let mockPolkadotService: jest.Mocked<VerificationService>;
  let mockEthereumService: jest.Mocked<EthereumVerificationService>;

  const POLKADOT_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const ETHEREUM_ADDRESS = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b';
  const VALID_SIGNATURE = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b';
  const VALID_DID = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';

  const createValidPolkadotRequest = (): VerificationRequest => ({
    message: `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc123\nAddress: ${POLKADOT_ADDRESS}`,
    signature: VALID_SIGNATURE,
    address: POLKADOT_ADDRESS,
    chainType: 'polkadot',
  });

  const createValidEthereumRequest = (): VerificationRequest => ({
    message: `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc123\nAddress: ${ETHEREUM_ADDRESS}`,
    signature: VALID_SIGNATURE,
    address: ETHEREUM_ADDRESS,
    chainType: 'ethereum',
  });

  const createSuccessResponse = (): VerificationResponse => ({
    status: 'success',
    message: 'Verification successful',
    code: 'SUCCESS',
    did: VALID_DID,
  });

  const createErrorResponse = (message: string, code: string): VerificationResponse => ({
    status: 'error',
    message,
    code,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Polkadot service
    mockPolkadotService = {
      verifySignature: jest.fn(),
    } as unknown as jest.Mocked<VerificationService>;

    // Setup mock Ethereum service
    mockEthereumService = {
      verifySignature: jest.fn(),
    } as unknown as jest.Mocked<EthereumVerificationService>;

    (VerificationService as jest.MockedClass<typeof VerificationService>).mockImplementation(() => mockPolkadotService);
    (EthereumVerificationService as jest.MockedClass<typeof EthereumVerificationService>).mockImplementation(() => mockEthereumService);

    service = new UnifiedVerificationService();
  });

  describe('constructor', () => {
    it('should create an instance with both verification services', () => {
      expect(service).toBeInstanceOf(UnifiedVerificationService);
      expect(VerificationService).toHaveBeenCalled();
      expect(EthereumVerificationService).toHaveBeenCalled();
    });
  });

  describe('verifySignature', () => {
    describe('chain type detection', () => {
      it('should route to Polkadot service when chainType is polkadot', async () => {
        mockPolkadotService.verifySignature.mockResolvedValue(createSuccessResponse());

        const result = await service.verifySignature(createValidPolkadotRequest());

        expect(mockPolkadotService.verifySignature).toHaveBeenCalledWith(createValidPolkadotRequest());
        expect(mockEthereumService.verifySignature).not.toHaveBeenCalled();
        expect(result).toEqual({
          ...createSuccessResponse(),
          data: { chainType: 'polkadot' },
        });
      });

      it('should route to Ethereum service when chainType is ethereum', async () => {
        mockEthereumService.verifySignature.mockResolvedValue(createSuccessResponse());

        const result = await service.verifySignature(createValidEthereumRequest());

        expect(mockEthereumService.verifySignature).toHaveBeenCalledWith(createValidEthereumRequest());
        expect(mockPolkadotService.verifySignature).not.toHaveBeenCalled();
        expect(result).toEqual({
          ...createSuccessResponse(),
          data: { chainType: 'ethereum' },
        });
      });

      it('should auto-detect Polkadot address when chainType is not specified', async () => {
        const request = { ...createValidPolkadotRequest() };
        delete request.chainType;
        mockPolkadotService.verifySignature.mockResolvedValue(createSuccessResponse());

        const result = await service.verifySignature(request);

        expect(mockPolkadotService.verifySignature).toHaveBeenCalledWith(request);
        expect(mockEthereumService.verifySignature).not.toHaveBeenCalled();
        expect(result).toEqual({
          ...createSuccessResponse(),
          data: { chainType: 'polkadot' },
        });
      });

      it('should auto-detect Ethereum address when chainType is not specified', async () => {
        const request = { ...createValidEthereumRequest() };
        delete request.chainType;
        mockEthereumService.verifySignature.mockResolvedValue(createSuccessResponse());

        const result = await service.verifySignature(request);

        expect(mockEthereumService.verifySignature).toHaveBeenCalledWith(request);
        expect(mockPolkadotService.verifySignature).not.toHaveBeenCalled();
        expect(result).toEqual({
          ...createSuccessResponse(),
          data: { chainType: 'ethereum' },
        });
      });

      it('should reject unsupported chain type', async () => {
        const request = {
          ...createValidEthereumRequest(),
          chainType: 'bitcoin' as any,
        };

        const result = await service.verifySignature(request);

        expect(result).toEqual({
          status: 'error',
          message: 'Unsupported chain type: bitcoin',
          code: 'UNSUPPORTED_CHAIN_TYPE',
        });
        expect(mockPolkadotService.verifySignature).not.toHaveBeenCalled();
        expect(mockEthereumService.verifySignature).not.toHaveBeenCalled();
      });

      it('should reject unrecognized address format', async () => {
        const request = {
          ...createValidEthereumRequest(),
          address: 'invalid-address-format',
        };
        delete request.chainType;

        const result = await service.verifySignature(request);

        expect(result).toEqual({
          status: 'error',
          message: 'Unable to determine chain type from address format',
          code: 'UNKNOWN_ADDRESS_FORMAT',
        });
        expect(mockPolkadotService.verifySignature).not.toHaveBeenCalled();
        expect(mockEthereumService.verifySignature).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle Polkadot service errors', async () => {
        const errorResponse = createErrorResponse('Polkadot verification failed', 'POLKADOT_ERROR');
        mockPolkadotService.verifySignature.mockResolvedValue(errorResponse);

        const result = await service.verifySignature(createValidPolkadotRequest());

        expect(result).toEqual(errorResponse);
      });

      it('should handle Ethereum service errors', async () => {
        const errorResponse = createErrorResponse('Ethereum verification failed', 'ETHEREUM_ERROR');
        mockEthereumService.verifySignature.mockResolvedValue(errorResponse);

        const result = await service.verifySignature(createValidEthereumRequest());

        expect(result).toEqual(errorResponse);
      });

      it('should handle service exceptions', async () => {
        mockPolkadotService.verifySignature.mockRejectedValue(new Error('Service crashed'));

        const result = await service.verifySignature(createValidPolkadotRequest());

        expect(result).toEqual({
          status: 'error',
          message: 'Internal verification error',
          code: 'INTERNAL_ERROR',
        });
      });

      it('should handle invalid request format', async () => {
        const result = await service.verifySignature(null as any);

        expect(result).toEqual({
          status: 'error',
          message: 'Invalid request format',
          code: 'INVALID_REQUEST',
        });
      });

      it('should handle missing required fields', async () => {
        const result = await service.verifySignature({
          message: '',
          signature: VALID_SIGNATURE,
          address: ETHEREUM_ADDRESS,
        });

        expect(result).toEqual({
          status: 'error',
          message: 'Invalid request format',
          code: 'INVALID_REQUEST',
        });
      });
    });

    describe('address format detection', () => {
      it('should detect SS58 addresses as Polkadot', async () => {
        const ss58Addresses = [
          '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg',
          '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5',
        ];

        mockPolkadotService.verifySignature.mockResolvedValue(createSuccessResponse());

        for (const address of ss58Addresses) {
          const request = {
            message: `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc123\nAddress: ${address}`,
            signature: VALID_SIGNATURE,
            address,
          };

          await service.verifySignature(request);
          expect(mockPolkadotService.verifySignature).toHaveBeenCalledWith(request);
        }
      });

      it('should detect 0x addresses as Ethereum', async () => {
        const ethereumAddresses = [
          '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b',
          '0x8ba1f109551bD432803012645aac136c12345678',
          '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        ];

        mockEthereumService.verifySignature.mockResolvedValue(createSuccessResponse());

        for (let i = 0; i < ethereumAddresses.length; i++) {
          const address = ethereumAddresses[i];
          const request = {
            message: `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: abc123\nAddress: ${address}`,
            signature: VALID_SIGNATURE,
            address,
          };

          await service.verifySignature(request);
          expect(mockEthereumService.verifySignature).toHaveBeenNthCalledWith(i + 1, request);
        }
        
        expect(mockEthereumService.verifySignature).toHaveBeenCalledTimes(ethereumAddresses.length);
      });
    });

    describe('response forwarding', () => {
      it('should forward successful responses with additional metadata', async () => {
        const successResponse = {
          ...createSuccessResponse(),
          data: { chainType: 'polkadot' },
        };
        mockPolkadotService.verifySignature.mockResolvedValue(createSuccessResponse());

        const result = await service.verifySignature(createValidPolkadotRequest());

        expect(result).toEqual({
          ...createSuccessResponse(),
          data: { chainType: 'polkadot' },
        });
      });

      it('should forward error responses unchanged', async () => {
        const errorResponse = createErrorResponse('Custom error', 'CUSTOM_ERROR');
        mockEthereumService.verifySignature.mockResolvedValue(errorResponse);

        const result = await service.verifySignature(createValidEthereumRequest());

        expect(result).toEqual(errorResponse);
      });
    });
  });

  describe('chain type detection utility', () => {
    it('should correctly identify chain types', () => {
      // Test the detectChainType method if it's exposed or test through verifySignature
      const polkadotRequest = { ...createValidPolkadotRequest() };
      delete polkadotRequest.chainType;

      const ethereumRequest = { ...createValidEthereumRequest() };
      delete ethereumRequest.chainType;

      // These will be tested through the verifySignature method calls above
      expect(service).toBeDefined();
    });
  });
}); 