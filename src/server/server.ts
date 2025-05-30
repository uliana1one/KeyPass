import express, { Request, Response, NextFunction } from 'express';
import { VerificationService } from './verificationService';
import { VerificationRequest } from './types';
import { MessageValidationError, AddressValidationError } from '../errors/WalletErrors';

// Constants for security settings
const MAX_REQUEST_SIZE = '10kb'; // Maximum request body size
const MAX_MESSAGE_LENGTH = 256; // Maximum message length

/**
 * Creates and configures an Express server with the verification endpoint.
 * @returns The configured Express application
 */
export function createServer(): express.Application {
  const app = express();
  const verificationService = new VerificationService();

  // Security middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Request size limit middleware
  app.use(express.json({ limit: MAX_REQUEST_SIZE }));

  /**
   * POST /api/verify
   * Verifies a Polkadot wallet signature and returns the associated DID.
   * 
   * Request body:
   * {
   *   message: string;    // The message that was signed
   *   signature: string;  // The signature in hex format (0x-prefixed)
   *   address: string;    // The Polkadot address that signed the message
   * }
   * 
   * Response:
   * {
   *   status: number;     // HTTP status code
   *   message: string;    // Success or error message
   *   code: string;       // Error code if applicable
   *   did?: string;       // The DID associated with the address (if valid)
   * }
   */
  app.post('/api/verify', async (req: Request, res: Response) => {
    try {
      const request = req.body as VerificationRequest;

      // Validate request body
      if (!request || typeof request !== 'object') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request body',
          code: 'INVALID_REQUEST'
        });
      }

      if (!request.message || typeof request.message !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Message is required and must be a string',
          code: 'INVALID_REQUEST'
        });
      }

      if (!request.signature || typeof request.signature !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Signature is required and must be a string',
          code: 'INVALID_REQUEST'
        });
      }

      if (!request.address || typeof request.address !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Address is required and must be a string',
          code: 'INVALID_REQUEST'
        });
      }

      // Verify signature
      const result = await verificationService.verifySignature(request);

      // Transform the response to match expected format with correct field order
      const responseBody = {
        status: result.status,
        message: result.message,
        ...(result.did && { did: result.did }),
        code: result.code
      };

      // Use appropriate HTTP status code based on the verification result
      const httpStatus = result.status === 'success' ? 200 : 400;
      return res.status(httpStatus).json(responseBody);
    } catch (error) {
      // Handle specific error types with appropriate status codes and messages
      if (error instanceof MessageValidationError) {
        const errorCode = error.message.includes('tampering') ? 'MESSAGE_TAMPERED' :
                         error.message.includes('format') ? 'INVALID_MESSAGE_FORMAT' :
                         error.message.includes('expired') ? 'MESSAGE_EXPIRED' :
                         error.message.includes('future') ? 'MESSAGE_FUTURE' :
                         'VERIFICATION_FAILED';

        return res.status(400).json({
          status: 'error',
          message: error.message,
          code: errorCode
        });
      }

      if (error instanceof AddressValidationError) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid Polkadot address',
          code: 'VERIFICATION_FAILED'
        });
      }

      // Log unexpected errors
      console.error('Verification error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    // Log error without sensitive data
    console.error('Server error:', {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    if (err instanceof MessageValidationError) {
      const errorCode = err.message.includes('tampering') ? 'MESSAGE_TAMPERED' :
                       err.message.includes('format') ? 'INVALID_MESSAGE_FORMAT' :
                       err.message.includes('expired') ? 'MESSAGE_EXPIRED' :
                       err.message.includes('future') ? 'MESSAGE_FUTURE' :
                       'VERIFICATION_FAILED';

      return res.status(400).json({
        status: 'error',
        message: err.message,
        code: errorCode
      });
    }

    if (err instanceof AddressValidationError) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Polkadot address',
        code: 'VERIFICATION_FAILED'
      });
    }

    if (err instanceof SyntaxError && err.message.includes('JSON')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid JSON in request body',
        code: 'INVALID_REQUEST'
      });
    }

    // Default error response
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  });

  return app;
} 