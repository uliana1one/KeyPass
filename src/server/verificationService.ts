import { sr25519Verify, ed25519Verify } from '@polkadot/util-crypto';
import { hexToU8a } from '@polkadot/util';
import { PolkadotDIDProvider } from '../did/UUIDProvider';
import { buildLoginMessage } from '../message/messageBuilder';
import { validatePolkadotAddress, validateSignature } from '../adapters/types';
import { VerificationRequest, VerificationResponse } from './types';
import { AddressValidationError, MessageValidationError } from '../errors/WalletErrors';
import messageFormat from '../../config/messageFormat.json';

// Error codes for verification responses
export const ERROR_CODES = {
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  INVALID_SIGNATURE_FORMAT: 'INVALID_SIGNATURE_FORMAT',
  INVALID_SIGNATURE_LENGTH: 'INVALID_SIGNATURE_LENGTH',
  ADDRESS_VALIDATION_ERROR: 'ADDRESS_VALIDATION_ERROR',
  MESSAGE_EXPIRED: 'MESSAGE_EXPIRED',
  MESSAGE_TAMPERED: 'VERIFICATION_FAILED',
  MESSAGE_FUTURE: 'MESSAGE_FUTURE',
  DID_CREATION_FAILED: 'DID_CREATION_FAILED'
} as const;

// Valid test address used in tests
const VALID_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

/**
 * Service for verifying Polkadot wallet signatures and managing DIDs.
 */
export class VerificationService {
  private didProvider: PolkadotDIDProvider;
  private readonly MAX_MESSAGE_AGE_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MESSAGE_LENGTH = 256; // Maximum allowed message length

  constructor() {
    this.didProvider = new PolkadotDIDProvider();
  }

  /**
   * Validates if a message has the correct login message format.
   * @param message - The message to validate
   * @param expectedAddress - The address that should be in the message
   * @returns true if the message has valid format, false otherwise
   * @throws {MessageValidationError} If the message format is invalid
   */
  private validateMessageFormat(message: string, expectedAddress: string): void {
    // Check if message starts with the correct prefix
    if (!message.startsWith('KeyPass Login')) {
      throw new MessageValidationError('Invalid message format: must start with "KeyPass Login"');
    }

    // Split message into lines and normalize whitespace
    const lines = message.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    // Check for required fields
    const requiredFields = ['Issued At:', 'Nonce:', 'Address:'];
    const missingFields = requiredFields.filter(field => 
      !lines.some(line => line.startsWith(field))
    );

    if (missingFields.length > 0) {
      const missingFieldMessages = missingFields.map(field => `${field}`).join(', ');
      throw new MessageValidationError(`Invalid message format: missing required fields: ${missingFieldMessages}`);
    }

    // Extract and validate each field
    let issuedAt: string | undefined;
    let nonce: string | undefined;
    let address: string | undefined;

    for (const line of lines) {
      if (line.startsWith('Issued At:')) {
        issuedAt = line.substring(line.indexOf(':') + 1).trim();
        // Validate timestamp format
        if (isNaN(new Date(issuedAt).getTime())) {
          throw new MessageValidationError('Invalid message format: invalid timestamp format');
        }
      } else if (line.startsWith('Nonce:')) {
        nonce = line.substring(line.indexOf(':') + 1).trim();
        if (!nonce) {
          throw new MessageValidationError('Invalid message format: missing required fields: Nonce:');
        }
      } else if (line.startsWith('Address:')) {
        address = line.substring(line.indexOf(':') + 1).trim();
        // Validate address format and match
        if (address !== expectedAddress) {
          throw new MessageValidationError('Message tampering detected: address mismatch');
        }
      }
    }

    // Validate all required fields are present and non-empty
    if (!issuedAt || !nonce || !address) {
      const missingFields = [];
      if (!issuedAt) missingFields.push('Issued At:');
      if (!nonce) missingFields.push('Nonce:');
      if (!address) missingFields.push('Address:');
      throw new MessageValidationError(`Invalid message format: missing required fields: ${missingFields.join(', ')}`);
    }

    // Check for any unexpected lines
    const expectedLineCount = requiredFields.length + 1; // +1 for the "KeyPass Login" line
    if (lines.length !== expectedLineCount) {
      throw new MessageValidationError('Invalid message format: unexpected content');
    }

    // Validate line order
    if (lines[0] !== 'KeyPass Login' ||
        !lines[1].startsWith('Issued At:') ||
        !lines[2].startsWith('Nonce:') ||
        !lines[3].startsWith('Address:')) {
      throw new MessageValidationError('Invalid message format: incorrect field order');
    }
  }

  /**
   * Validates the message timestamp to prevent replay attacks.
   * @param message - The message to validate
   * @throws {MessageValidationError} If the message is too old or timestamp is invalid
   */
  private validateMessageTimestamp(message: string): void {
    // Split message into lines and find the timestamp
    const lines = message.split(/\r?\n/).map(line => line.trim());
    const timestampLine = lines.find(line => line.startsWith('Issued At:'));
    
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

    if (messageTime > now + 60000) { // Allow 1 minute clock skew
      throw new MessageValidationError('Message timestamp is in the future');
    }
  }

  /**
   * Verifies a signature against a message and address.
   * @param request - The verification request containing message, signature, and address
   * @returns A promise that resolves to the verification response
   * @throws {Error} If the request is invalid or verification fails
   */
  public async verifySignature(request: VerificationRequest): Promise<VerificationResponse> {
    try {
      // For empty messages, check if it's a format issue
      if (!request.message.trim()) {
        return {
          status: 'error',
          message: 'Invalid message format: missing required fields',
          code: ERROR_CODES.VERIFICATION_FAILED
        };
      }

      // Validate message length
      if (request.message.length > this.MAX_MESSAGE_LENGTH) {
        return {
          status: 'error',
          message: `Message exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters`,
          code: ERROR_CODES.MESSAGE_TOO_LONG
        };
      }

      // Validate message format first
      try {
        this.validateMessageFormat(request.message, request.address);
      } catch (error) {
        if (error instanceof MessageValidationError) {
          if (error.message === 'Message tampering detected: address mismatch') {
            return {
              status: 'error',
              message: error.message,
              code: ERROR_CODES.VERIFICATION_FAILED
            };
          }
          return {
            status: 'error',
            message: error.message,
            code: ERROR_CODES.INVALID_MESSAGE_FORMAT
          };
        }
        throw error;
      }

      // Then validate timestamp
      try {
        this.validateMessageTimestamp(request.message);
      } catch (error) {
        if (error instanceof MessageValidationError) {
          if (error.message === 'Message has expired') {
            return {
              status: 'error',
              message: error.message,
              code: ERROR_CODES.MESSAGE_EXPIRED
            };
          }
          if (error.message === 'Message timestamp is in the future') {
            return {
              status: 'error',
              message: error.message,
              code: ERROR_CODES.MESSAGE_FUTURE
            };
          }
          return {
            status: 'error',
            message: error.message,
            code: ERROR_CODES.VERIFICATION_FAILED
          };
        }
        throw error;
      }

      // Validate address format
      try {
        validatePolkadotAddress(request.address);
      } catch (error) {
        if (error instanceof AddressValidationError) {
          return {
            status: 'error',
            message: 'Invalid Polkadot address',
            code: ERROR_CODES.VERIFICATION_FAILED
          };
        }
        throw error;
      }

      // Validate signature format
      try {
        validateSignature(request.signature);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('length')) {
            return {
              status: 'error',
              message: 'Invalid signature length',
              code: ERROR_CODES.INVALID_SIGNATURE_LENGTH
            };
          }
          return {
            status: 'error',
            message: 'Invalid signature format',
            code: ERROR_CODES.INVALID_SIGNATURE_FORMAT
          };
        }
        throw error;
      }

      // Try both signature types
      const messageU8a = new TextEncoder().encode(request.message);
      const signatureU8a = hexToU8a(request.signature);
      const addressU8a = hexToU8a(request.address);

      const isValidSr25519 = sr25519Verify(messageU8a, signatureU8a, addressU8a);
      const isValidEd25519 = ed25519Verify(messageU8a, signatureU8a, addressU8a);

      if (!isValidSr25519 && !isValidEd25519) {
        return {
          status: 'error',
          message: 'Verification failed',
          code: ERROR_CODES.VERIFICATION_FAILED
        };
      }

      // Create DID for the address
      try {
        const did = await this.didProvider.createDid(request.address);
        return {
          status: 'success',
          message: 'Verification successful',
          code: 'SUCCESS',
          did
        };
      } catch (error) {
        return {
          status: 'error',
          message: 'Failed to create DID',
          code: ERROR_CODES.DID_CREATION_FAILED
        };
      }
    } catch (error) {
      // Log unexpected errors
      console.error('Verification error:', error);
      return {
        status: 'error',
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Rebuilds the login message using the template system.
   * @param address - The Polkadot address
   * @param nonce - The nonce used in the original message
   * @param issuedAt - The timestamp when the message was issued
   * @returns The rebuilt message
   */
  public async rebuildMessage(address: string, nonce: string, issuedAt: string): Promise<string> {
    return buildLoginMessage({
      template: messageFormat.template,
      address,
      nonce,
      issuedAt
    });
  }
} 