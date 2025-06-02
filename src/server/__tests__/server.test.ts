// Add setImmediate polyfill at the top
if (typeof setImmediate === 'undefined') {
  (global as any).setImmediate = (callback: Function, ...args: any[]) => {
    return setTimeout(callback, 0, ...args);
  };
}

import request from 'supertest';
import express from 'express';
import { createServer } from '../server';
import { VerificationService, ERROR_CODES } from '../verificationService';
import { MessageValidationError, AddressValidationError } from '../../errors/WalletErrors';
import { VerificationResponse } from '../types';
import { Server } from 'http';

// Mock the VerificationService
jest.mock('../verificationService');

describe('Express Server', () => {
  let app: express.Application;
  let server: Server;
  let mockVerificationService: jest.Mocked<VerificationService>;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a new app instance for each test
    app = createServer();

    // Create and store server instance
    server = app.listen(0); // Use port 0 for random available port

    // Get the mocked instance and set up default mock behavior
    mockVerificationService = VerificationService.prototype as jest.Mocked<VerificationService>;
    mockVerificationService.verifySignature.mockImplementation(async (request) => {
      // Default mock implementation that handles invalid requests
      if (!request || typeof request !== 'object') {
        return {
          status: 'error',
          message: 'Invalid request body',
          code: ERROR_CODES.INVALID_REQUEST,
        };
      }

      // For valid requests, return a default success response
      return {
        status: 'success',
        message: 'Signature verified successfully',
        did: 'did:polkadot:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        code: 'SUCCESS',
      };
    });
  });

  afterEach(async () => {
    // Close the server after each test and wait for it to close
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      // Add a small delay to ensure server is fully closed
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  describe('Security Headers Middleware', () => {
    it('should set all required security headers', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBe(
        'max-age=31536000; includeSubDomains'
      );
    });
  });

  describe('POST /api/verify - Valid Requests', () => {
    it('should return success response when verification succeeds', async () => {
      const mockResult: VerificationResponse = {
        status: 'success',
        message: 'Signature verified successfully',
        did: 'did:polkadot:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        code: 'SUCCESS',
      };

      mockVerificationService.verifySignature.mockResolvedValue(mockResult);

      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        message: 'Signature verified successfully',
        did: 'did:polkadot:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        code: 'SUCCESS',
      });
    });

    it('should return error response when verification fails', async () => {
      const mockResult: VerificationResponse = {
        status: 'error',
        message: 'Invalid signature',
        code: ERROR_CODES.VERIFICATION_FAILED,
      };

      mockVerificationService.verifySignature.mockResolvedValue(mockResult);

      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid signature',
        code: ERROR_CODES.VERIFICATION_FAILED,
      });
    });

    it('should handle response without DID field', async () => {
      const mockResult: VerificationResponse = {
        status: 'error',
        message: 'Verification failed',
        code: ERROR_CODES.VERIFICATION_FAILED,
      };

      mockVerificationService.verifySignature.mockResolvedValue(mockResult);

      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: ERROR_CODES.VERIFICATION_FAILED,
      });
      expect(response.body).not.toHaveProperty('did');
    });
  });

  describe('POST /api/verify - Request Validation', () => {
    it('should reject non-object request body', async () => {
      const response = await request(app).post('/api/verify').send('invalid string body');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject null request body', async () => {
      const response = await request(app).post('/api/verify').send(undefined);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with null message field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: null,
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with null signature field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: null,
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with null address field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: null,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with undefined message field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: undefined,
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with undefined signature field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: undefined,
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with undefined address field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: undefined,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with empty message string', async () => {
      const response = await request(app).post('/api/verify').send({
        message: '',
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with empty signature string', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with empty address string', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: '',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with non-string message field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 123,
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with non-string signature field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: 123,
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });

    it('should reject request with non-string address field', async () => {
      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: 123,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid request body',
        code: ERROR_CODES.INVALID_REQUEST,
      });
    });
  });

  describe('POST /api/verify - Error Handling', () => {
    it('should handle MessageValidationError thrown by verification service', async () => {
      const error = new MessageValidationError('Message format is invalid');
      mockVerificationService.verifySignature.mockRejectedValue(error);

      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Message format is invalid',
        code: ERROR_CODES.INVALID_MESSAGE_FORMAT,
      });
    });

    it('should handle AddressValidationError thrown by verification service', async () => {
      const error = new AddressValidationError('Address format is invalid');
      mockVerificationService.verifySignature.mockRejectedValue(error);

      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid Polkadot address',
        code: ERROR_CODES.INVALID_ADDRESS,
      });
    });

    it('should handle unexpected errors thrown by verification service', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Unexpected error');
      mockVerificationService.verifySignature.mockRejectedValue(error);

      const response = await request(app).post('/api/verify').send({
        message: 'test message',
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: ERROR_CODES.VERIFICATION_FAILED,
      });
      expect(consoleSpy).toHaveBeenCalledWith('Verification error:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle MessageValidationError in middleware', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create a custom app to test middleware error handling
      const testApp = express();
      testApp.use(express.json());

      // Add a route that throws MessageValidationError
      testApp.post('/test-error', (req, res, next) => {
        const error = new MessageValidationError('Test message validation error');
        next(error);
      });

      // Add the same error handling middleware from createServer
      testApp.use(
        async (
          err: Error,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
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

          return res.status(400).json({
            status: 'error',
            message: 'Verification failed',
            code: ERROR_CODES.VERIFICATION_FAILED,
          });
        }
      );

      const response = await request(testApp).post('/test-error').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Test message validation error',
        code: ERROR_CODES.INVALID_MESSAGE_FORMAT,
      });

      consoleSpy.mockRestore();
    });

    it('should handle AddressValidationError in middleware', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const testApp = express();
      testApp.use(express.json());

      testApp.post('/test-error', (req, res, next) => {
        const error = new AddressValidationError('Test address validation error');
        next(error);
      });

      testApp.use(
        async (
          err: Error,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
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

          return res.status(400).json({
            status: 'error',
            message: 'Verification failed',
            code: ERROR_CODES.VERIFICATION_FAILED,
          });
        }
      );

      const response = await request(testApp).post('/test-error').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid Polkadot address',
        code: ERROR_CODES.INVALID_ADDRESS,
      });

      consoleSpy.mockRestore();
    });

    it('should handle JSON SyntaxError in middleware', async () => {
      const response = await request(app)
        .post('/api/verify')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}'); // Invalid JSON

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid JSON in request body',
        code: ERROR_CODES.INVALID_JSON,
      });
    });

    it('should handle unexpected errors in middleware', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const testApp = express();
      testApp.use(express.json());

      testApp.post('/test-error', (req, res, next) => {
        const error = new Error('Unexpected server error');
        next(error);
      });

      testApp.use(
        async (
          err: Error,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
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

          return res.status(400).json({
            status: 'error',
            message: 'Verification failed',
            code: ERROR_CODES.VERIFICATION_FAILED,
          });
        }
      );

      const response = await request(testApp).post('/test-error').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: ERROR_CODES.VERIFICATION_FAILED,
      });

      consoleSpy.mockRestore();
    });

    it('should log error details in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const testApp = express();
      testApp.use(express.json());

      testApp.post('/test-error', (req, res, next) => {
        const error = new Error('Test error with stack');
        error.stack = 'Error: Test error with stack\n    at test line';
        next(error);
      });

      testApp.use(
        async (
          err: Error,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
          console.error('Server error:', {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
          });

          return res.status(400).json({
            status: 'error',
            message: 'Verification failed',
            code: ERROR_CODES.VERIFICATION_FAILED,
          });
        }
      );

      await request(testApp).post('/test-error').send({});

      expect(consoleSpy).toHaveBeenCalledWith('Server error:', {
        name: 'Error',
        message: 'Test error with stack',
        stack: 'Error: Test error with stack\n    at test line',
      });

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log stack trace in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const testApp = express();
      testApp.use(express.json());

      testApp.post('/test-error', (req, res, next) => {
        const error = new Error('Test error with stack');
        error.stack = 'Error: Test error with stack\n    at test line';
        next(error);
      });

      testApp.use(
        async (
          err: Error,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
          console.error('Server error:', {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
          });

          return res.status(400).json({
            status: 'error',
            message: 'Verification failed',
            code: ERROR_CODES.VERIFICATION_FAILED,
          });
        }
      );

      await request(testApp).post('/test-error').send({});

      expect(consoleSpy).toHaveBeenCalledWith('Server error:', {
        name: 'Error',
        message: 'Test error with stack',
        stack: undefined,
      });

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Request Size Limits', () => {
    it('should handle requests within size limit', async () => {
      const mockResult: VerificationResponse = {
        status: 'success',
        message: 'Signature verified successfully',
        did: 'did:polkadot:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        code: 'SUCCESS',
      };

      mockVerificationService.verifySignature.mockResolvedValue(mockResult);

      // Create a message that's within limits (256 chars max)
      const validMessage = 'a'.repeat(200);

      const response = await request(app).post('/api/verify').send({
        message: validMessage,
        signature: '0x123abc',
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Route Coverage', () => {
    it('should handle non-existent routes with 404', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should only accept POST requests on /api/verify', async () => {
      const response = await request(app).get('/api/verify');

      expect(response.status).toBe(404);
    });
  });
});
