import { randomBytes } from 'crypto';
import { sr25519Sign, sr25519Verify, ed25519Verify } from '@polkadot/util-crypto';
import type { Keypair } from '@polkadot/util-crypto/types';
import { hexToU8a } from '@polkadot/util';

// Test constants
export const TEST_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
export const TEST_NONCE = 'test-nonce-123';

/**
 * Creates a test message with the current timestamp
 */
export function createTestMessage(address: string = TEST_ADDRESS) {
  const issuedAt = new Date().toISOString();
  const nonce = randomBytes(16).toString('hex');
  const message = `KeyPass Login\nIssued At: ${issuedAt}\nNonce: ${nonce}\nAddress: ${address}`;
  return { message, issuedAt, nonce };
}

/**
 * Helper to generate a deterministic mock signature
 */
function generateMockSignature(message: string): string {
  const messageU8a = new TextEncoder().encode(message);
  const mockSignature = new Uint8Array(64);
  for (let i = 0; i < mockSignature.length; i++) {
    mockSignature[i] = messageU8a[i % messageU8a.length] ^ i;
  }
  return `0x${Buffer.from(mockSignature).toString('hex')}`;
}

/**
 * Mocks signing a message with SR25519 or ED25519
 * In tests, we use simple patterns for signatures:
 * - SR25519 signatures are generated deterministically based on the message
 * - ED25519 signatures are all bytes set to 0x32
 */
export async function mockSignMessage(message: string, address: string): Promise<string> {
  // Set up mock verification functions if not already set
  if (!(sr25519Verify as jest.Mock).mock.calls.length) {
    (sr25519Verify as jest.Mock).mockImplementation(
      (msg: Uint8Array, sig: Uint8Array, addr: string) => {
        const expectedSig = new Uint8Array(64);
        for (let i = 0; i < expectedSig.length; i++) {
          expectedSig[i] = msg[i % msg.length] ^ i;
        }
        return sig.every((byte, i) => byte === expectedSig[i]);
      }
    );
  }
  if (!(ed25519Verify as jest.Mock).mock.calls.length) {
    (ed25519Verify as jest.Mock).mockImplementation(
      (msg: Uint8Array, sig: Uint8Array, addr: string) => {
        return sig.every((byte) => byte === 0x32);
      }
    );
  }

  // Mock the sr25519Sign function to return a predictable signature
  (sr25519Sign as jest.Mock).mockImplementation(() => {
    return hexToU8a(generateMockSignature(message));
  });

  // Return a deterministic signature based on the message
  return generateMockSignature(message);
}

/**
 * Creates a tampered message by replacing the address
 */
export function createTamperedMessage(message: string, newAddress: string): string {
  return message.replace(TEST_ADDRESS, newAddress);
}

/**
 * Creates an expired message by setting the timestamp to the past
 */
export function createExpiredMessage(address: string = TEST_ADDRESS): string {
  const expiredTime = new Date(Date.now() - 5.1 * 60 * 1000).toISOString(); // Just over 5 minutes ago
  return `KeyPass Login\nIssued At: ${expiredTime}\nNonce: ${TEST_NONCE}\nAddress: ${address}`;
}

/**
 * Creates a future message by setting the timestamp to the future
 */
export function createFutureMessage(address: string = TEST_ADDRESS): string {
  const futureTime = new Date(Date.now() + 1.1 * 60 * 1000).toISOString(); // Just over 1 minute in future
  return `KeyPass Login\nIssued At: ${futureTime}\nNonce: ${TEST_NONCE}\nAddress: ${address}`;
}

/**
 * Creates a message with a timestamp within clock skew
 */
export function createClockSkewMessage(address: string = TEST_ADDRESS): string {
  const skewTime = new Date(Date.now() + 0.5 * 60 * 1000).toISOString(); // 30 seconds in future
  return `KeyPass Login\nIssued At: ${skewTime}\nNonce: ${TEST_NONCE}\nAddress: ${address}`;
}
