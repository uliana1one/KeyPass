import express, { Request, Response, NextFunction } from 'express';
import { UnifiedVerificationService } from './UnifiedVerificationService';
import { VerificationRequest } from './types';
import { MessageValidationError, AddressValidationError } from '../errors/WalletErrors';

// Constants for security settings
const MAX_REQUEST_SIZE = '10kb'; // Maximum request body size
const MAX_MESSAGE_LENGTH = 256; // Maximum message length

// Error codes for unified verification
const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  INVALID_JSON: 'INVALID_JSON',
} as const;

/**
 * Creates and configures an Express server with the verification endpoint.
 * @returns The configured Express application
 */
export function createServer(): express.Application {
  const app = express();
  const verificationService = new UnifiedVerificationService();

  // Add root endpoint for health checks
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // CORS middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  });

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

      // Basic validation - let UnifiedVerificationService handle detailed validation
      if (!request || typeof request !== 'object') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request body',
          code: ERROR_CODES.INVALID_REQUEST,
        });
      }

      // Verify signature
      const result = await verificationService.verifySignature(request);

      // Handle case where result is undefined
      if (!result) {
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        });
      }

      // Use appropriate HTTP status code based on the verification result
      const httpStatus = result.status === 'success' ? 200 : 400;
      return res.status(httpStatus).json(result);
    } catch (error) {
      // Log unexpected errors
      console.error('Verification error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  });

  // Error handling middleware
  app.use(async (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Log error without sensitive data
    console.error('Server error:', {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    if (err instanceof MessageValidationError) {
      return res.status(400).json({
        status: 'error',
        message: err.message,
        code: ERROR_CODES.INVALID_MESSAGE_FORMAT,
      });
    }

    if (err instanceof AddressValidationError) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Polkadot address',
        code: ERROR_CODES.INVALID_ADDRESS,
      });
    }

    if (err instanceof SyntaxError && err.message.includes('JSON')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid JSON in request body',
        code: ERROR_CODES.INVALID_JSON,
      });
    }

    // Default error response for unexpected errors
    return res.status(400).json({
      status: 'error',
      message: 'Verification failed',
      code: ERROR_CODES.VERIFICATION_FAILED,
    });
  });

  return app;
}
