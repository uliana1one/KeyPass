import {
  WalletError,
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  InvalidSignatureError,
  InvalidAddressError,
  ConfigurationError,
  WalletConnectionError,
  MessageValidationError,
  AddressValidationError
} from '../../errors/WalletErrors';

describe('Wallet Error Classes', () => {
  describe('WalletError', () => {
    it('should create error with message and code', () => {
      const error = new WalletError('Test error', 'TEST_ERROR');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('WalletError');
    });
  });

  describe('WalletNotFoundError', () => {
    it('should create error with wallet name', () => {
      const error = new WalletNotFoundError('test-wallet');
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('test-wallet wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
      expect(error.name).toBe('WalletNotFoundError');
    });
  });

  describe('UserRejectedError', () => {
    it.each([
      ['connection', 'User rejected wallet connection'],
      ['wallet_connection', 'User rejected wallet connection'],
      ['signing', 'User rejected message signing'],
      ['message_signing', 'User rejected message signing'],
      ['account_access', 'User rejected account access']
    ])('should create error for %s operation', (operation, expectedMessage) => {
      const error = new UserRejectedError(operation as any);
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe(expectedMessage);
      expect(error.code).toBe('USER_REJECTED');
      expect(error.name).toBe('UserRejectedError');
    });
  });

  describe('TimeoutError', () => {
    it.each([
      ['wallet_connection', 'wallet connection timed out'],
      ['message_signing', 'message signing timed out'],
      ['signing', 'operation timed out']
    ])('should create error for %s operation', (operation, expectedMessage) => {
      const error = new TimeoutError(operation as any);
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe(expectedMessage);
      expect(error.code).toBe('OPERATION_TIMEOUT');
      expect(error.name).toBe('TimeoutError');
    });
  });

  describe('InvalidSignatureError', () => {
    it('should create error with default message', () => {
      const error = new InvalidSignatureError();
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Invalid signature');
      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error.name).toBe('InvalidSignatureError');
    });

    it('should create error with custom message', () => {
      const error = new InvalidSignatureError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });

  describe('InvalidAddressError', () => {
    it('should create error with address', () => {
      const error = new InvalidAddressError('0x123');
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Invalid address format: 0x123');
      expect(error.code).toBe('ADDRESS_VALIDATION_ERROR');
      expect(error.name).toBe('InvalidAddressError');
    });
  });

  describe('ConfigurationError', () => {
    it('should create error with message', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('INVALID_CONFIG');
      expect(error.name).toBe('ConfigurationError');
    });
  });

  describe('WalletConnectionError', () => {
    it('should create error with message', () => {
      const error = new WalletConnectionError('Connection failed');
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('CONNECTION_FAILED');
      expect(error.name).toBe('WalletConnectionError');
    });
  });

  describe('MessageValidationError', () => {
    it('should create error with message', () => {
      const error = new MessageValidationError('Invalid message');
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Invalid message');
      expect(error.code).toBe('INVALID_MESSAGE');
      expect(error.name).toBe('MessageValidationError');
    });
  });

  describe('AddressValidationError', () => {
    it('should create error with message', () => {
      const error = new AddressValidationError('Invalid address');
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Invalid address');
      expect(error.code).toBe('INVALID_ADDRESS');
      expect(error.name).toBe('AddressValidationError');
    });
  });
}); 