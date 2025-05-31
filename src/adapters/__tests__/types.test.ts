import { validateAndSanitizeMessage, validatePolkadotAddress, validateSignature } from '../types';
import { MessageValidationError, AddressValidationError } from '../../errors/WalletErrors';

// Mock @polkadot/util-crypto
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn((address) => {
    // Return true for our valid test address, false for others
    return address === '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
  }),
  checkAddress: jest.fn(() => [true, null]),
}));

describe('Types Module', () => {
  describe('validateAndSanitizeMessage', () => {
    it('should handle empty messages', () => {
      expect(() => validateAndSanitizeMessage('')).toThrow(MessageValidationError);
      expect(() => validateAndSanitizeMessage('   ')).toThrow(MessageValidationError);
    });

    it('should handle invalid characters', () => {
      expect(() => validateAndSanitizeMessage('Hello\u0000World')).toThrow(MessageValidationError);
      expect(() => validateAndSanitizeMessage('Hello\u0007World')).toThrow(MessageValidationError);
    });

    it('should handle message length limits', () => {
      const longMessage = 'a'.repeat(300);
      expect(() => validateAndSanitizeMessage(longMessage)).toThrow(MessageValidationError);
      
      const validMessage = 'a'.repeat(256);
      expect(() => validateAndSanitizeMessage(validMessage)).not.toThrow();
    });

    it('should sanitize valid messages', () => {
      const input = '  Hello World  \n  ';
      const expected = 'Hello World';
      expect(validateAndSanitizeMessage(input)).toBe(expected);
    });

    it('should handle custom max length', () => {
      const message = 'a'.repeat(100);
      expect(() => validateAndSanitizeMessage(message, 50)).toThrow(MessageValidationError);
      expect(() => validateAndSanitizeMessage(message, 150)).not.toThrow();
    });
  });

  describe('validatePolkadotAddress', () => {
    const validAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
    const invalidAddresses = [
      'invalid',
      '0x123',
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQYinvalid',
      '',
      '   '
    ];

    it('should accept valid addresses', () => {
      expect(() => validatePolkadotAddress(validAddress)).not.toThrow();
    });

    it('should reject invalid addresses', () => {
      invalidAddresses.forEach(address => {
        expect(() => validatePolkadotAddress(address)).toThrow(AddressValidationError);
      });
    });

    it('should handle null and undefined', () => {
      expect(() => validatePolkadotAddress(null as any)).toThrow(AddressValidationError);
      expect(() => validatePolkadotAddress(undefined as any)).toThrow(AddressValidationError);
    });
  });

  describe('validateSignature', () => {
    const validSignature = '0x' + '1'.repeat(128);
    const invalidSignatures = [
      '0x' + '1'.repeat(127), // Too short
      '0x' + '1'.repeat(129), // Too long
      '1'.repeat(128), // Missing 0x prefix
      '0x' + 'g'.repeat(128), // Invalid hex
      '',
      '   ',
      null,
      undefined
    ];

    it('should accept valid signatures', () => {
      expect(() => validateSignature(validSignature)).not.toThrow();
    });

    it('should reject invalid signatures', () => {
      invalidSignatures.forEach(signature => {
        expect(() => validateSignature(signature as any)).toThrow();
      });
    });

    it('should handle edge cases', () => {
      expect(() => validateSignature('0x')).toThrow();
      expect(() => validateSignature('0x0')).toThrow();
    });
  });
}); 