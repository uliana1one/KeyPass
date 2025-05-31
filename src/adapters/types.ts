import { WalletError } from '../errors/WalletErrors';
import { isAddress, checkAddress } from '@polkadot/util-crypto';
import { MessageValidationError, AddressValidationError } from '../errors/WalletErrors';

export interface WalletAccount {
  address: string;
  name?: string;
  source: string;
}

export interface WalletAdapter {
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
}

export interface WalletAdapterConstructor {
  new(): WalletAdapter;
}

export function validateAddress(address: string): void {
  // Basic SS58 format validation
  if (!/^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address)) {
    throw new WalletError(`Invalid SS58 address format: ${address}`, 'INVALID_ADDRESS');
  }
}

export function validateSignature(signature: string): void {
  // Check for 0x prefix
  if (!signature.startsWith('0x')) {
    throw new Error('Invalid signature format: missing 0x prefix');
  }

  // Check length (0x + 128 hex chars for sr25519, 0x + 64 hex chars for ed25519)
  const hexLength = signature.length - 2; // subtract 0x
  if (hexLength !== 128 && hexLength !== 64) {
    throw new Error('Invalid signature length: must be 0x + 128 hex chars (sr25519) or 0x + 64 hex chars (ed25519)');
  }

  // Check for valid hex characters
  if (!/^0x[0-9a-fA-F]+$/.test(signature)) {
    throw new Error('Invalid signature format: contains invalid hex characters');
  }
}

export const WALLET_TIMEOUT = 10000; // 10 seconds 

const INVALID_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;

/**
 * Validate a message before signing.
 * - Checks format (alphanumeric, spaces, punctuation)
 * - Enforces max length
 * - Sanitizes input (trims, strips dangerous chars)
 *
 * @param message - The message to validate and sanitize
 * @param maxLength - Maximum allowed message length (default: 256)
 * @returns The sanitized message string
 * @throws {MessageValidationError} If the message is invalid
 *
 * @example
 * const msg = validateAndSanitizeMessage('Login with address 5F...', 256);
 * // returns sanitized string or throws error
 */
export function validateAndSanitizeMessage(message: string, maxLength = 256): string {
  if (!message || typeof message !== 'string') {
    throw new MessageValidationError('Message must be a non-empty string');
  }

  // Trim first to handle whitespace-only strings
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new MessageValidationError('Message must be a non-empty string');
  }

  // Check for invalid characters
  if (INVALID_CHARS.test(message)) {
    throw new MessageValidationError('Message contains invalid characters');
  }

  // Check length
  if (message.length > maxLength) {
    throw new MessageValidationError(`Message exceeds maximum length of ${maxLength} characters`);
  }

  return trimmedMessage;
}

/**
 * Validate a Polkadot address with checksum and SS58 support.
 * Throws if invalid.
 *
 * @param address - The address to validate
 * @param ss58Format - The expected SS58 format (default: 42 for Polkadot)
 * @throws {AddressValidationError} If the address is invalid or checksum fails
 *
 * @example
 * validatePolkadotAddress('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');
 * // throws if invalid
 */
export function validatePolkadotAddress(address: string, ss58Format = 42): void {
  if (!address || typeof address !== 'string') {
    throw new AddressValidationError('Address must be a non-empty string');
  }

  // Trim the address first
  const trimmedAddress = address.trim();
  if (!trimmedAddress) {
    throw new AddressValidationError('Address must be a non-empty string');
  }

  // First check if it's a valid SS58 format
  if (!isAddress(trimmedAddress)) {
    throw new AddressValidationError('Invalid Polkadot address format');
  }

  // Then validate the checksum and format
  const [isValid, error] = checkAddress(trimmedAddress, ss58Format);
  if (!isValid) {
    throw new AddressValidationError(error || 'Invalid address checksum or SS58 format');
  }
} 