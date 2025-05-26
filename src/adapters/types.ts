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
  // Basic hex signature validation
  if (!/^0x[0-9a-fA-F]{128}$/.test(signature)) {
    throw new WalletError('Invalid signature format', 'INVALID_SIGNATURE');
  }
}

export const WALLET_TIMEOUT = 10000; // 10 seconds 

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
  if (typeof message !== 'string') throw new MessageValidationError('Message must be a string');
  const sanitized = message.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control chars
  if (sanitized.length === 0) throw new MessageValidationError('Message cannot be empty');
  if (sanitized.length > maxLength) throw new MessageValidationError(`Message exceeds max length of ${maxLength}`);
  if (!/^[\x20-\x7E\n\r]+$/.test(sanitized)) throw new MessageValidationError('Message contains invalid characters');
  return sanitized;
}

/**
 * Validate a Polkadot address with checksum and SS58 support.
 * Throws if invalid.
 *
 * @param address - The address to validate
 * @param ss58Format - The expected SS58 format (default: 0 for Polkadot)
 * @throws {AddressValidationError} If the address is invalid or checksum fails
 *
 * @example
 * validatePolkadotAddress('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');
 * // throws if invalid
 */
export function validatePolkadotAddress(address: string, ss58Format = 0): void {
  if (!isAddress(address)) throw new AddressValidationError('Invalid Polkadot address');
  try {
    const [isValid] = checkAddress(address, ss58Format);
    if (!isValid) throw new AddressValidationError('Invalid address checksum or SS58 format');
  } catch {
    throw new AddressValidationError('Invalid address checksum or SS58 format');
  }
} 