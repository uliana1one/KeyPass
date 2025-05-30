import request from 'supertest';
import { createServer } from '../server';
import { hexToU8a } from '@polkadot/util';
import { sr25519Sign, ed25519Sign } from '@polkadot/util-crypto';

// Mock @polkadot/util-crypto
jest.mock('@polkadot/util-crypto', () => ({
  sr25519Sign: jest.fn((message: Uint8Array, address: string) => {
    if (address === VALID_ADDRESS) {
      return new Uint8Array(64).fill(1); // Valid signature
    }
    throw new Error('Invalid address');
  }),
  sr25519Verify: jest.fn((message: Uint8Array, signature: Uint8Array, address: string) => {
    return address === VALID_ADDRESS && signature.every(byte => byte === 1);
  }),
  ed25519Verify: jest.fn((message: Uint8Array, signature: Uint8Array, address: string) => {
    return address === VALID_ADDRESS && signature.every(byte => byte === 2);
  }),
  isAddress: jest.fn((address: string) => address === VALID_ADDRESS),
  checkAddress: jest.fn((address: string) => [address === VALID_ADDRESS, null])
}));

// Mock messageBuilder
jest.mock('../../message/messageBuilder', () => ({
  buildLoginMessage: jest.fn((params) => {
    return `KeyPass Login\nIssued At: ${params.issuedAt}\nNonce: ${params.nonce}\nAddress: ${params.address}`;
  })
}));

// Valid test data
const VALID_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const TEST_NONCE = 'test-nonce-123';
const TEST_ISSUED_AT = new Date().toISOString();
const TEST_MESSAGE = `KeyPass Login\nIssued At: ${TEST_ISSUED_AT}\nNonce: ${TEST_NONCE}\nAddress: ${VALID_ADDRESS}`;

// Mock sign message function
async function mockSignMessage(message: string, address: string): Promise<string> {
  const messageU8a = new TextEncoder().encode(message);
  const signatureU8a = new Uint8Array(64).fill(1); // Use SR25519 signature for tests
  return '0x' + Buffer.from(signatureU8a).toString('hex');
}

describe('Verification Server', () => {
  const app = createServer();

  describe('POST /api/verify', () => {
    it('should verify a valid SR25519 signature and return DID', async () => {
      // Create a valid signature using the mock
      const messageU8a = new TextEncoder().encode(TEST_MESSAGE);
      const signatureU8a = new Uint8Array(64).fill(1); // SR25519 signature
      const signature = '0x' + Buffer.from(signatureU8a).toString('hex');

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: TEST_MESSAGE,
          signature,
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        message: 'Verification successful',
        did: expect.stringMatching(/^did:key:z/),
        code: 'SUCCESS'
      });
    });

    it('should verify a valid ED25519 signature and return DID', async () => {
      // Create a valid signature using the mock
      const messageU8a = new TextEncoder().encode(TEST_MESSAGE);
      const signatureU8a = new Uint8Array(64).fill(2); // ED25519 signature
      const signature = '0x' + Buffer.from(signatureU8a).toString('hex');

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: TEST_MESSAGE,
          signature,
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        message: 'Verification successful',
        did: expect.stringMatching(/^did:key:z/),
        code: 'SUCCESS'
      });
    });

    it('should reject expired message', async () => {
      const expiredTime = new Date(Date.now() - 5.1 * 60 * 1000).toISOString(); // Just over 5 minutes ago
      const expiredMessage = `KeyPass Login\nIssued At: ${expiredTime}\nNonce: ${TEST_NONCE}\nAddress: ${VALID_ADDRESS}`;

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: expiredMessage,
          signature: '0x' + '1'.repeat(128),
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Message has expired',
        code: 'MESSAGE_EXPIRED'
      });
    });

    it('should reject future timestamp', async () => {
      const futureTime = new Date(Date.now() + 1.1 * 60 * 1000).toISOString(); // Just over 1 minute in future
      const futureMessage = `KeyPass Login\nIssued At: ${futureTime}\nNonce: ${TEST_NONCE}\nAddress: ${VALID_ADDRESS}`;

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: futureMessage,
          signature: '0x' + '1'.repeat(128),
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Message timestamp is in the future',
        code: 'MESSAGE_FUTURE'
      });
    });

    it('should accept timestamp within clock skew', async () => {
      const futureTime = new Date(Date.now() + 0.5 * 60 * 1000).toISOString(); // 30 seconds in future
      const futureMessage = `KeyPass Login\nIssued At: ${futureTime}\nNonce: ${TEST_NONCE}\nAddress: ${VALID_ADDRESS}`;

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: futureMessage,
          signature: '0x' + '1'.repeat(128),
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(400); // Will fail verification but not timestamp
      expect(response.body).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: 'VERIFICATION_FAILED'
      });
    });

    it('should reject tampered message', async () => {
      const tamperedMessage = TEST_MESSAGE.replace(VALID_ADDRESS, '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: tamperedMessage,
          signature: '0x' + '1'.repeat(128),
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Message tampering detected: address mismatch',
        code: 'VERIFICATION_FAILED'
      });
    });

    it('should reject message without nonce', async () => {
      const messageWithoutNonce = `KeyPass Login\nIssued At: ${TEST_ISSUED_AT}\nAddress: ${VALID_ADDRESS}`;

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: messageWithoutNonce,
          signature: '0x' + '1'.repeat(128),
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid message format: missing required fields: Nonce:',
        code: 'VERIFICATION_FAILED'
      });
    });

    it('should reject oversized request', async () => {
      const largeMessage = 'a'.repeat(300); // Exceeds MAX_MESSAGE_LENGTH

      const response = await request(app)
        .post('/api/verify')
        .send({
          message: largeMessage,
          signature: '0x' + '1'.repeat(128),
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Message exceeds maximum length of 256 characters',
        code: 'MESSAGE_TOO_LONG'
      });
    });

    it('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/verify')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      });
    });

    it('should reject invalid signature', async () => {
      const message = TEST_MESSAGE
        .replace('{{address}}', VALID_ADDRESS)
        .replace('{{issuedAt}}', TEST_ISSUED_AT);

      const response = await request(app)
        .post('/api/verify')
        .send({
          message,
          signature: '0x' + '1'.repeat(128), // Invalid signature
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Verification failed',
        code: 'VERIFICATION_FAILED'
      });
    });

    it('should reject invalid address', async () => {
      const message = TEST_MESSAGE
        .replace('{{address}}', 'invalid-address')
        .replace('{{issuedAt}}', TEST_ISSUED_AT);

      const response = await request(app)
        .post('/api/verify')
        .send({
          message,
          signature: '0x' + '1'.repeat(128),
          address: 'invalid-address'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid Polkadot address',
        code: 'VERIFICATION_FAILED'
      });
    });

    it('should reject malformed request', async () => {
      const response = await request(app)
        .post('/api/verify')
        .send({
          // Missing required fields
          message: TEST_MESSAGE
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Missing required fields',
        code: 'INVALID_REQUEST'
      });
    });

    it('should reject invalid message format', async () => {
      const response = await request(app)
        .post('/api/verify')
        .send({
          message: '', // Empty message
          signature: '0x' + '1'.repeat(128),
          address: VALID_ADDRESS
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid message format: missing required fields',
        code: 'INVALID_MESSAGE_FORMAT'
      });
    });

    describe('Edge Cases', () => {
      it('should reject null values in request', async () => {
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: null,
            signature: null,
            address: null
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Missing required fields',
          code: 'INVALID_REQUEST'
        });
      });

      it('should reject undefined values in request', async () => {
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: undefined,
            signature: undefined,
            address: undefined
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Missing required fields',
          code: 'INVALID_REQUEST'
        });
      });

      it('should reject malformed signature format', async () => {
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: TEST_MESSAGE,
            signature: 'invalid-signature-format', // Missing 0x prefix
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid signature format',
          code: 'INVALID_SIGNATURE_FORMAT'
        });
      });

      it('should reject signature with wrong length', async () => {
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: TEST_MESSAGE,
            signature: '0x' + '1'.repeat(32), // Too short for both SR25519 and ED25519
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid signature length',
          code: 'INVALID_SIGNATURE_LENGTH'
        });
      });
    });

    describe('Integration Tests', () => {
      it('should perform end-to-end verification with client-side signing', async () => {
        // Simulate client-side message creation and signing
        const clientMessage = `KeyPass Login\nIssued At: ${TEST_ISSUED_AT}\nNonce: ${TEST_NONCE}\nAddress: ${VALID_ADDRESS}`;
        const signature = await mockSignMessage(clientMessage, VALID_ADDRESS);

        // Send to server for verification
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: clientMessage,
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          status: 'success',
          message: 'Verification successful',
          did: expect.stringMatching(/^did:key:z/),
          code: 'SUCCESS'
        });
      });

      it('should reject when client-side signature is tampered with', async () => {
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: TEST_MESSAGE,
            signature: '0x' + '2'.repeat(128), // Tampered signature
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Verification failed',
          code: 'VERIFICATION_FAILED'
        });
      });

      it('should handle concurrent verification requests', async () => {
        const requests = Array(5).fill(null).map(async () => {
          const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
          return request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature,
              address: VALID_ADDRESS
            });
        });

        const responses = await Promise.all(requests);
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body).toEqual({
            status: 'success',
            message: 'Verification successful',
            did: expect.stringMatching(/^did:key:z/),
            code: 'SUCCESS'
          });
        });
      });
    });

    describe('Message Format Validation', () => {
      it('should reject message with wrong prefix', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'Wrong Prefix\nIssued At: 2024-01-01T00:00:00Z\nNonce: 123\nAddress: ' + VALID_ADDRESS,
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid message format: must start with "KeyPass Login"',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      });

      it('should reject message with missing required fields', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'KeyPass Login\nAddress: ' + VALID_ADDRESS,
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid message format: missing required fields: Issued At:, Nonce:',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      });

      it('should reject message with empty nonce', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'KeyPass Login\nIssued At: 2024-01-01T00:00:00Z\nNonce: \nAddress: ' + VALID_ADDRESS,
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid message format: missing required fields: Nonce:',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      });

      it('should reject message with invalid timestamp format', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'KeyPass Login\nIssued At: invalid-date\nNonce: 123\nAddress: ' + VALID_ADDRESS,
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid message format: invalid timestamp format',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      });

      it('should reject message with incorrect field order', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'KeyPass Login\nAddress: ' + VALID_ADDRESS + '\nIssued At: 2024-01-01T00:00:00Z\nNonce: 123',
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid message format: incorrect field order',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      });

      it('should reject message with unexpected content', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'KeyPass Login\nIssued At: 2024-01-01T00:00:00Z\nNonce: 123\nAddress: ' + VALID_ADDRESS + '\nExtra: content',
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid message format: unexpected content',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      });

      it('should reject message with whitespace-only lines', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'KeyPass Login\n\nIssued At: 2024-01-01T00:00:00Z\n\nNonce: 123\n\nAddress: ' + VALID_ADDRESS,
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Invalid message format: unexpected content',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      });

      it('should reject message with address mismatch', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'KeyPass Login\nIssued At: 2024-01-01T00:00:00Z\nNonce: 123\nAddress: ' + '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          status: 'error',
          message: 'Message tampering detected: address mismatch',
          code: 'VERIFICATION_FAILED'
        });
      });

      it('should accept message with proper format and trailing whitespace', async () => {
        const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
        const response = await request(app)
          .post('/api/verify')
          .send({
            message: 'KeyPass Login\nIssued At: 2024-01-01T00:00:00Z\nNonce: 123\nAddress: ' + VALID_ADDRESS + '\n  ',
            signature,
            address: VALID_ADDRESS
          });

        expect(response.status).toBe(400); // Will fail verification but not format
        expect(response.body).toEqual({
          status: 'error',
          message: 'Verification failed',
          code: 'VERIFICATION_FAILED'
        });
      });
    });

    describe('Signature Validation', () => {
      describe('SR25519 Signatures', () => {
        it('should verify valid SR25519 signature with all bytes set to 1', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x' + '1'.repeat(128),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(200);
          expect(response.body).toEqual({
            status: 'success',
            message: 'Verification successful',
            did: expect.stringMatching(/^did:key:z/),
            code: 'SUCCESS'
          });
        });

        it('should reject SR25519 signature with first byte not 1', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x2' + '1'.repeat(127),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Verification failed',
            code: 'VERIFICATION_FAILED'
          });
        });

        it('should reject SR25519 signature with not all bytes set to 1', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x' + '1'.repeat(64) + '2'.repeat(64),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Verification failed',
            code: 'VERIFICATION_FAILED'
          });
        });
      });

      describe('ED25519 Signatures', () => {
        it('should verify valid ED25519 signature with all bytes set to 2', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x' + '2'.repeat(128),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(200);
          expect(response.body).toEqual({
            status: 'success',
            message: 'Verification successful',
            did: expect.stringMatching(/^did:key:z/),
            code: 'SUCCESS'
          });
        });

        it('should reject ED25519 signature with first byte not 2', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x1' + '2'.repeat(127),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Verification failed',
            code: 'VERIFICATION_FAILED'
          });
        });

        it('should reject ED25519 signature with not all bytes set to 2', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x' + '2'.repeat(64) + '1'.repeat(64),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Verification failed',
            code: 'VERIFICATION_FAILED'
          });
        });
      });

      describe('Signature Format Validation', () => {
        it('should reject signature with invalid hex characters', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x' + 'g'.repeat(128),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Invalid signature format',
            code: 'INVALID_SIGNATURE_FORMAT'
          });
        });

        it('should reject signature with odd length hex string', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x' + '1'.repeat(127),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Invalid signature length',
            code: 'INVALID_SIGNATURE_LENGTH'
          });
        });
      });

      describe('Signature and Message Tampering', () => {
        it('should reject when signature is valid but message is tampered', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: 'KeyPass Login\nIssued At: 2024-01-01T00:00:00Z\nNonce: 123\nAddress: ' + '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
              signature: await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Message tampering detected: address mismatch',
            code: 'VERIFICATION_FAILED'
          });
        });

        it('should reject when signature is tampered but message is valid', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: TEST_MESSAGE,
              signature: '0x' + '2'.repeat(128),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Verification failed',
            code: 'VERIFICATION_FAILED'
          });
        });

        it('should reject when both signature and message are tampered', async () => {
          const response = await request(app)
            .post('/api/verify')
            .send({
              message: 'KeyPass Login\nIssued At: 2024-01-01T00:00:00Z\nNonce: 123\nAddress: ' + '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
              signature: '0x' + '2'.repeat(128),
              address: VALID_ADDRESS
            });

          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            status: 'error',
            message: 'Message tampering detected: address mismatch',
            code: 'VERIFICATION_FAILED'
          });
        });
      });

      describe('Concurrent Signature Verification', () => {
        it('should handle multiple valid signature verifications concurrently', async () => {
          const requests = Array(5).fill(null).map(async () => {
            const signature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
            return request(app)
              .post('/api/verify')
              .send({
                message: TEST_MESSAGE,
                signature,
                address: VALID_ADDRESS
              });
          });

          const responses = await Promise.all(requests);
          responses.forEach(response => {
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
              status: 'success',
              message: 'Verification successful',
              did: expect.stringMatching(/^did:key:z/),
              code: 'SUCCESS'
            });
          });
        });

        it('should handle mixed valid and invalid signature verifications concurrently', async () => {
          const validSignature = await mockSignMessage(TEST_MESSAGE, VALID_ADDRESS);
          const testCases = [
            {
              message: TEST_MESSAGE,
              signature: validSignature,
              address: VALID_ADDRESS,
              shouldSucceed: true
            },
            {
              message: TEST_MESSAGE,
              signature: '0x' + '2'.repeat(128),
              address: VALID_ADDRESS,
              shouldSucceed: false
            },
            {
              message: 'KeyPass Login\nIssued At: 2024-01-01T00:00:00Z\nNonce: 123\nAddress: ' + '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
              signature: validSignature,
              address: VALID_ADDRESS,
              shouldSucceed: false
            }
          ];

          const requests = testCases.map(testCase =>
            request(app)
              .post('/api/verify')
              .send(testCase)
          );

          const responses = await Promise.all(requests);
          responses.forEach((response, index) => {
            const testCase = testCases[index];
            if (testCase.shouldSucceed) {
              expect(response.status).toBe(200);
              expect(response.body).toEqual({
                status: 'success',
                message: 'Verification successful',
                did: expect.stringMatching(/^did:key:z/),
                code: 'SUCCESS'
              });
            } else {
              expect(response.status).toBe(400);
              expect(response.body).toEqual({
                status: 'error',
                message: 'Verification failed',
                code: 'VERIFICATION_FAILED'
              });
            }
          });
        });
      });
    });
  });
}); 