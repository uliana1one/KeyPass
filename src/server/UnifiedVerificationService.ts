import { VerificationService } from './verificationService.js';
import { EthereumVerificationService } from './EthereumVerificationService.js';
import { VerificationRequest, VerificationResponse, VerificationService as IVerificationService } from './types.js';

/**
 * Unified verification service that handles both Polkadot and Ethereum signature verification.
 * This service acts as a router, determining the appropriate chain-specific service
 * based on the request's chain type or address format.
 * 
 * Features:
 * - Automatic chain type detection from address format
 * - Explicit chain type support via chainType parameter
 * - Unified error handling and response formatting
 * - Support for both Polkadot (SS58) and Ethereum (0x) addresses
 */
export class UnifiedVerificationService implements IVerificationService {
  private polkadotService: VerificationService;
  private ethereumService: EthereumVerificationService;

  /**
   * Creates a new instance of UnifiedVerificationService.
   * Initializes both Polkadot and Ethereum verification services.
   */
  constructor() {
    this.polkadotService = new VerificationService();
    this.ethereumService = new EthereumVerificationService();
  }

  /**
   * Detects the chain type based on address format.
   * @param address - The address to analyze
   * @returns The detected chain type or null if unrecognized
   */
  private detectChainType(address: string): 'polkadot' | 'ethereum' | null {
    // Ethereum addresses start with 0x and are 42 characters long
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return 'ethereum';
    }

    // Polkadot addresses use SS58 format - typically 47-48 characters
    // and use base58 encoding (no 0, O, I, l characters)
    if (/^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address)) {
      return 'polkadot';
    }

    return null;
  }

  /**
   * Validates the basic request format.
   * @param request - The verification request to validate
   * @returns True if the request is valid, false otherwise
   */
  private isValidRequest(request: VerificationRequest): boolean {
    return (
      request &&
      typeof request === 'object' &&
      typeof request.message === 'string' &&
      typeof request.signature === 'string' &&
      typeof request.address === 'string' &&
      request.message.trim() !== '' &&
      request.signature.trim() !== '' &&
      request.address.trim() !== ''
    );
  }

  /**
   * Adds chain type metadata to successful responses.
   * @param response - The original response
   * @param chainType - The chain type to add
   * @returns The response with added metadata
   */
  private addChainMetadata(response: VerificationResponse, chainType: 'polkadot' | 'ethereum'): VerificationResponse {
    if (response.status === 'success') {
      return {
        ...response,
        data: {
          ...response.data,
          chainType,
        },
      };
    }
    return response;
  }

  /**
   * Verifies a signature using the appropriate chain-specific service.
   * @param request - The verification request
   * @returns A promise that resolves to the verification response
   */
  public async verifySignature(request: VerificationRequest): Promise<VerificationResponse> {
    try {
      // Validate request format
      if (!this.isValidRequest(request)) {
        return {
          status: 'error',
          message: 'Invalid request format',
          code: 'INVALID_REQUEST',
        };
      }

      // Determine chain type
      let chainType: 'polkadot' | 'ethereum';

      if (request.chainType) {
        // Use explicit chain type if provided
        if (request.chainType !== 'polkadot' && request.chainType !== 'ethereum') {
          return {
            status: 'error',
            message: `Unsupported chain type: ${request.chainType}`,
            code: 'UNSUPPORTED_CHAIN_TYPE',
          };
        }
        chainType = request.chainType;
      } else {
        // Auto-detect chain type from address format
        const detectedType = this.detectChainType(request.address);
        if (!detectedType) {
          return {
            status: 'error',
            message: 'Unable to determine chain type from address format',
            code: 'UNKNOWN_ADDRESS_FORMAT',
          };
        }
        chainType = detectedType;
      }

      // Route to appropriate service
      let response: VerificationResponse;
      if (chainType === 'polkadot') {
        response = await this.polkadotService.verifySignature(request);
      } else {
        response = await this.ethereumService.verifySignature(request);
      }

      // Add chain type metadata to successful responses
      return this.addChainMetadata(response, chainType);

    } catch (error: unknown) {
      console.error('Unified verification service error:', error);
      return {
        status: 'error',
        message: 'Internal verification error',
        code: 'INTERNAL_ERROR',
      };
    }
  }
} 