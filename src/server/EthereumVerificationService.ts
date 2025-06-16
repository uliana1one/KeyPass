import { verifyMessage } from 'ethers';
import { EthereumDIDProvider } from '../did/EthereumDIDProvider.js';
import { VerificationRequest, VerificationResponse } from './types.js';
import { AddressValidationError, MessageValidationError } from '../errors/WalletErrors.js';

// Error codes for verification responses
export const ETHEREUM_ERROR_CODES = {
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  INVALID_SIGNATURE_FORMAT: 'INVALID_SIGNATURE_FORMAT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  MESSAGE_EXPIRED: 'MESSAGE_EXPIRED',
  MESSAGE_FUTURE: 'MESSAGE_FUTURE',
  DID_CREATION_FAILED: 'DID_CREATION_FAILED',
} as const;

/**
 * Service for verifying Ethereum wallet signatures and managing DIDs.
 * This service provides functionality for:
 * - Verifying message signatures using ECDSA algorithm
 * - Managing DID (Decentralized Identifier) creation and validation
 * - Validating message age and format
 * - Ethereum address validation
 *
 * The service implements security best practices including:
 * - Message age validation (5-minute expiration)
 * - Message length limits
 * - Signature format validation
 * - Address format validation
 */
export class EthereumVerificationService {
  private didProvider: EthereumDIDProvider;
  /** Maximum allowed age of a message in milliseconds (5 minutes) */
  private readonly MAX_MESSAGE_AGE_MS = 5 * 60 * 1000;
  /** Maximum allowed length of a message in characters */
  private readonly MAX_MESSAGE_LENGTH = 256;

  /**
   * Creates a new instance of EthereumVerificationService.
   * Initializes the DID provider for DID-related operations.
   */
  constructor() {
    this.didProvider = new EthereumDIDProvider();
  }

  /**
   * Validates an Ethereum address format.
   */
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validates Ethereum signature format.
   */
  private isValidEthereumSignature(signature: string): boolean {
    // Ethereum signatures are 65 bytes (130 hex chars + 0x prefix)
    return /^0x[a-fA-F0-9]{130}$/.test(signature);
  }

  /**
   * Validates the length of a message.
   */
  private validateMessageLength(message: string): void {
    if (message.length > this.MAX_MESSAGE_LENGTH) {
      throw new MessageValidationError(`Message exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters`);
    }
  }

  /**
   * Validates the format of a message.
   */
  private validateMessageFormat(message: string, expectedAddress: string): void {
    const lines = message.split(/\r?\n/).map((line) => line.trim());
    
    // Check for required fields
    const hasIssuedAt = lines.some((line) => line.startsWith('Issued At:'));
    const hasNonce = lines.some((line) => line.startsWith('Nonce:'));
    const hasAddress = lines.some((line) => line.startsWith('Address:'));

    if (!hasIssuedAt || !hasNonce || !hasAddress) {
      throw new MessageValidationError('Invalid message format: missing required fields');
    }

    // Validate address in message matches request address
    const addressLine = lines.find((line) => line.startsWith('Address:'));
    if (addressLine) {
      const messageAddress = addressLine.substring(addressLine.indexOf(':') + 1).trim();
      if (messageAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
        throw new MessageValidationError('Message address does not match request address');
      }
    }
  }

  /**
   * Validates the timestamp of a message.
   */
  private validateMessageTimestamp(message: string): void {
    const lines = message.split(/\r?\n/).map((line) => line.trim());
    const timestampLine = lines.find((line) => line.startsWith('Issued At:'));

    if (!timestampLine) {
      throw new MessageValidationError('Invalid message format: missing timestamp');
    }

    const issuedAt = timestampLine.substring(timestampLine.indexOf(':') + 1).trim();
    const messageTime = new Date(issuedAt).getTime();
    const now = Date.now();

    if (isNaN(messageTime)) {
      throw new MessageValidationError('Invalid timestamp format');
    }

    if (now - messageTime > this.MAX_MESSAGE_AGE_MS) {
      throw new MessageValidationError('Message has expired');
    }

    if (messageTime > now + 60000) {
      // Allow 1 minute clock skew
      throw new MessageValidationError('Message timestamp is in the future');
    }
  }

  /**
   * Verifies an Ethereum signature against a message and address.
   */
  private async verifyEthereumSignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Ethereum signature verification error:', error);
      return false;
    }
  }

  /**
   * Verifies a signature against a message and address.
   * @param request - The verification request containing message, signature, and address
   * @returns A promise that resolves to the verification response
   */
  public async verifySignature(request: VerificationRequest): Promise<VerificationResponse> {
    try {
      // Validate request format
      if (!request || typeof request !== 'object') {
        return {
          status: 'error',
          message: 'Invalid request body',
          code: ETHEREUM_ERROR_CODES.INVALID_REQUEST,
        };
      }

      // Validate required fields
      if (!request.message || !request.signature || !request.address ||
          typeof request.message !== 'string' ||
          typeof request.signature !== 'string' ||
          typeof request.address !== 'string' ||
          request.message.trim() === '' ||
          request.signature.trim() === '' ||
          request.address.trim() === '') {
        return {
          status: 'error',
          message: 'Invalid request body',
          code: ETHEREUM_ERROR_CODES.INVALID_REQUEST,
        };
      }

      // Validate message length
      try {
        this.validateMessageLength(request.message);
      } catch (error) {
        if (error instanceof MessageValidationError && error.message.includes('exceeds maximum length')) {
          return {
            status: 'error',
            message: error.message,
            code: ETHEREUM_ERROR_CODES.MESSAGE_TOO_LONG,
          };
        }
        throw error;
      }

      // Validate Ethereum address format
      if (!this.isValidEthereumAddress(request.address)) {
        return {
          status: 'error',
          message: 'Invalid Ethereum address',
          code: ETHEREUM_ERROR_CODES.INVALID_ADDRESS,
        };
      }

      // Validate signature format
      if (!this.isValidEthereumSignature(request.signature)) {
        return {
          status: 'error',
          message: 'Invalid signature format',
          code: ETHEREUM_ERROR_CODES.INVALID_SIGNATURE_FORMAT,
        };
      }

      // Validate message format
      try {
        this.validateMessageFormat(request.message, request.address);
      } catch (error) {
        if (error instanceof MessageValidationError) {
          return {
            status: 'error',
            message: error.message,
            code: ETHEREUM_ERROR_CODES.INVALID_MESSAGE_FORMAT,
          };
        }
        throw error;
      }

      // Validate message timestamp
      try {
        this.validateMessageTimestamp(request.message);
      } catch (error) {
        if (error instanceof MessageValidationError) {
          if (error.message === 'Message has expired') {
            return {
              status: 'error',
              message: error.message,
              code: ETHEREUM_ERROR_CODES.MESSAGE_EXPIRED,
            };
          }
          if (error.message === 'Message timestamp is in the future') {
            return {
              status: 'error',
              message: error.message,
              code: ETHEREUM_ERROR_CODES.MESSAGE_FUTURE,
            };
          }
          return {
            status: 'error',
            message: error.message,
            code: ETHEREUM_ERROR_CODES.INVALID_MESSAGE_FORMAT,
          };
        }
        throw error;
      }

      // Verify signature
      const isValid = await this.verifyEthereumSignature(
        request.message,
        request.signature,
        request.address
      );

      if (!isValid) {
        return {
          status: 'error',
          message: 'Verification failed',
          code: ETHEREUM_ERROR_CODES.VERIFICATION_FAILED,
        };
      }

      // Create DID for the address
      try {
        const did = await this.didProvider.createDid(request.address);
        return {
          status: 'success',
          message: 'Verification successful',
          code: 'SUCCESS',
          did,
        };
      } catch (error: unknown) {
        console.error('DID creation error:', error);
        return {
          status: 'error',
          message: 'Failed to create DID',
          code: ETHEREUM_ERROR_CODES.DID_CREATION_FAILED,
        };
      }
    } catch (error: unknown) {
      console.error('Unexpected verification error:', error);
      return {
        status: 'error',
        message: 'Verification failed',
        code: ETHEREUM_ERROR_CODES.VERIFICATION_FAILED,
      };
    }
  }
} 