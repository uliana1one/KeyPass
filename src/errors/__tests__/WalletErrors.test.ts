import {
  WalletError,
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  InvalidSignatureError,
  WalletConnectionError,
  MessageValidationError,
  AddressValidationError,
  ConfigurationError
} from '../WalletErrors';

describe('Wallet Errors', () => {
  describe('Base WalletError', () => {
    it('should create errors with correct codes', () => {
      const error = new WalletError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('WalletError');
    });

    it('should maintain error inheritance', () => {
      const error = new WalletError('Test error', 'TEST_ERROR');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof WalletError).toBe(true);
    });
  });

  describe('WalletNotFoundError', () => {
    it('should create with correct code', () => {
      const error = new WalletNotFoundError('Polkadot.js');
      expect(error.message).toBe('Polkadot.js wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
      expect(error instanceof WalletError).toBe(true);
    });

    it('should handle custom messages', () => {
      const error = new WalletNotFoundError('Custom wallet');
      expect(error.message).toBe('Custom wallet wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
    });
  });

  describe('UserRejectedError', () => {
    it('should create with correct code', () => {
      const error = new UserRejectedError('connection');
      expect(error.message).toBe('User rejected wallet connection');
      expect(error.code).toBe('USER_REJECTED');
      expect(error instanceof WalletError).toBe(true);
    });

    it('should handle different operations', () => {
      const error = new UserRejectedError('signing');
      expect(error.message).toBe('User rejected message signing');
    });
  });

  describe('TimeoutError', () => {
    it('should create with correct code', () => {
      const error = new TimeoutError('wallet_connection');
      expect(error.message).toBe('wallet connection timed out');
      expect(error.code).toBe('OPERATION_TIMEOUT');
      expect(error instanceof WalletError).toBe(true);
    });

    it('should handle different operations', () => {
      const error = new TimeoutError('message_signing');
      expect(error.message).toBe('message signing timed out');
    });
  });

  describe('InvalidSignatureError', () => {
    it('should create with correct code', () => {
      const error = new InvalidSignatureError();
      expect(error.message).toBe('Invalid signature');
      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error instanceof WalletError).toBe(true);
    });

    it('should handle custom messages', () => {
      const error = new InvalidSignatureError();
      expect(error.message).toBe('Invalid signature');
      expect(error.code).toBe('INVALID_SIGNATURE');
    });
  });

  describe('WalletConnectionError', () => {
    it('should create with correct code', () => {
      const error = new WalletConnectionError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('CONNECTION_FAILED');
      expect(error instanceof WalletError).toBe(true);
    });
  });

  describe('MessageValidationError', () => {
    it('should create with correct code', () => {
      const error = new MessageValidationError('Invalid message');
      expect(error.message).toBe('Invalid message');
      expect(error.code).toBe('INVALID_MESSAGE');
      expect(error instanceof WalletError).toBe(true);
    });
  });

  describe('AddressValidationError', () => {
    it('should create with correct code', () => {
      const error = new AddressValidationError('Invalid address');
      expect(error.message).toBe('Invalid address');
      expect(error.code).toBe('INVALID_ADDRESS');
      expect(error instanceof WalletError).toBe(true);
    });
  });

  describe('ConfigurationError', () => {
    it('should create with correct code', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('INVALID_CONFIG');
      expect(error instanceof WalletError).toBe(true);
    });
  });

  describe('Error Stack Traces', () => {
    it('should include stack traces', () => {
      const error = new WalletError('Test error', 'TEST_ERROR');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('WalletErrors.test.ts');
    });
  });
}); 