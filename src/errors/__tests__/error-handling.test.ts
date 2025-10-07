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
  AddressValidationError,
  WalletOperation
} from '../WalletErrors.js';
import { KILTError, KILTErrorType } from '../../did/types/KILTTypes.js';

describe('Error Handling Tests', () => {
  describe('WalletError Base Class', () => {
    test('should create base WalletError with message and code', () => {
      const error = new WalletError('Test error message', 'TEST_CODE');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('WalletError');
    });

    test('should have stack trace', () => {
      const error = new WalletError('Test error', 'TEST_CODE');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('WalletError');
    });
  });

  describe('WalletNotFoundError', () => {
    test('should create error for missing wallet extension', () => {
      const error = new WalletNotFoundError('Polkadot');
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Polkadot wallet not found');
      expect(error.code).toBe('WALLET_NOT_FOUND');
      expect(error.name).toBe('WalletNotFoundError');
    });

    test('should work with different wallet names', () => {
      const errors = [
        new WalletNotFoundError('Sporran'),
        new WalletNotFoundError('KILT Extension'),
        new WalletNotFoundError('MetaMask')
      ];

      errors.forEach((error, index) => {
        const expectedWallets = ['Sporran', 'KILT Extension', 'MetaMask'];
        expect(error.message).toContain(expectedWallets[index]);
        expect(error.code).toBe('WALLET_NOT_FOUND');
      });
    });
  });

  describe('UserRejectedError', () => {
    test('should create error for connection rejection', () => {
      const error = new UserRejectedError('connection');
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('User rejected wallet connection');
      expect(error.code).toBe('USER_REJECTED');
      expect(error.name).toBe('UserRejectedError');
    });

    test('should create error for wallet_connection rejection', () => {
      const error = new UserRejectedError('wallet_connection');
      
      expect(error.message).toBe('User rejected wallet connection');
      expect(error.code).toBe('USER_REJECTED');
    });

    test('should create error for signing rejection', () => {
      const error = new UserRejectedError('signing');
      
      expect(error.message).toBe('User rejected message signing');
      expect(error.code).toBe('USER_REJECTED');
    });

    test('should create error for message_signing rejection', () => {
      const error = new UserRejectedError('message_signing');
      
      expect(error.message).toBe('User rejected message signing');
      expect(error.code).toBe('USER_REJECTED');
    });

    test('should create error for account_access rejection', () => {
      const error = new UserRejectedError('account_access');
      
      expect(error.message).toBe('User rejected account access');
      expect(error.code).toBe('USER_REJECTED');
    });
  });

  describe('TimeoutError', () => {
    test('should create error for wallet_connection timeout', () => {
      const error = new TimeoutError('wallet_connection');
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('wallet connection timed out');
      expect(error.code).toBe('OPERATION_TIMEOUT');
      expect(error.name).toBe('TimeoutError');
    });

    test('should create error for message_signing timeout', () => {
      const error = new TimeoutError('message_signing');
      
      expect(error.message).toBe('message signing timed out');
      expect(error.code).toBe('OPERATION_TIMEOUT');
    });

    test('should create error for generic operation timeout', () => {
      const error = new TimeoutError('signing');
      
      expect(error.message).toBe('operation timed out');
      expect(error.code).toBe('OPERATION_TIMEOUT');
    });
  });

  describe('InvalidSignatureError', () => {
    test('should create error with default message', () => {
      const error = new InvalidSignatureError();
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Invalid signature');
      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error.name).toBe('InvalidSignatureError');
    });

    test('should create error with custom message', () => {
      const error = new InvalidSignatureError('Signature verification failed for this transaction');
      
      expect(error.message).toBe('Signature verification failed for this transaction');
      expect(error.code).toBe('INVALID_SIGNATURE');
    });
  });

  describe('InvalidAddressError', () => {
    test('should create error for invalid address format', () => {
      const invalidAddress = '0xinvalid';
      const error = new InvalidAddressError(invalidAddress);
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe(`Invalid address format: ${invalidAddress}`);
      expect(error.code).toBe('ADDRESS_VALIDATION_ERROR');
      expect(error.name).toBe('InvalidAddressError');
    });

    test('should include the invalid address in message', () => {
      const addresses = ['abc123', '0x', 'not-an-address'];
      
      addresses.forEach(addr => {
        const error = new InvalidAddressError(addr);
        expect(error.message).toContain(addr);
      });
    });
  });

  describe('ConfigurationError', () => {
    test('should create error with custom configuration message', () => {
      const error = new ConfigurationError('Missing API endpoint configuration');
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Missing API endpoint configuration');
      expect(error.code).toBe('INVALID_CONFIG');
      expect(error.name).toBe('ConfigurationError');
    });

    test('should handle various configuration error messages', () => {
      const messages = [
        'Invalid network configuration',
        'Missing required parameters',
        'Unsupported blockchain network'
      ];

      messages.forEach(msg => {
        const error = new ConfigurationError(msg);
        expect(error.message).toBe(msg);
        expect(error.code).toBe('INVALID_CONFIG');
      });
    });
  });

  describe('WalletConnectionError', () => {
    test('should create error for connection failure', () => {
      const error = new WalletConnectionError('Failed to connect to wallet provider');
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Failed to connect to wallet provider');
      expect(error.code).toBe('CONNECTION_FAILED');
      expect(error.name).toBe('WalletConnectionError');
    });

    test('should handle various connection error scenarios', () => {
      const scenarios = [
        'Network timeout',
        'Provider disconnected',
        'Wallet locked'
      ];

      scenarios.forEach(scenario => {
        const error = new WalletConnectionError(scenario);
        expect(error.message).toBe(scenario);
        expect(error.code).toBe('CONNECTION_FAILED');
      });
    });
  });

  describe('MessageValidationError', () => {
    test('should create error for invalid message format', () => {
      const error = new MessageValidationError('Message contains invalid characters');
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Message contains invalid characters');
      expect(error.code).toBe('INVALID_MESSAGE');
      expect(error.name).toBe('MessageValidationError');
    });

    test('should handle various message validation errors', () => {
      const errors = [
        'Message too long',
        'Empty message not allowed',
        'Invalid UTF-8 encoding'
      ];

      errors.forEach(msg => {
        const error = new MessageValidationError(msg);
        expect(error.message).toBe(msg);
        expect(error.code).toBe('INVALID_MESSAGE');
      });
    });
  });

  describe('AddressValidationError', () => {
    test('should create error for address validation failure', () => {
      const error = new AddressValidationError('Address checksum validation failed');
      
      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Address checksum validation failed');
      expect(error.code).toBe('INVALID_ADDRESS');
      expect(error.name).toBe('AddressValidationError');
    });

    test('should handle various address validation scenarios', () => {
      const scenarios = [
        'Address length incorrect',
        'Invalid SS58 format',
        'Unsupported address type'
      ];

      scenarios.forEach(scenario => {
        const error = new AddressValidationError(scenario);
        expect(error.message).toBe(scenario);
        expect(error.code).toBe('INVALID_ADDRESS');
      });
    });
  });

  describe('KILTError', () => {
    test('should create KILT error with network error type', () => {
      const error = new KILTError('Network connection failed', KILTErrorType.NETWORK_ERROR);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Network connection failed');
      expect(error.code).toBe(KILTErrorType.NETWORK_ERROR);
      expect(error.name).toBe('KILTError');
    });

    test('should create error with transaction details', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const blockNum = 12345;
      
      const error = new KILTError(
        'Transaction failed',
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        {
          transactionHash: txHash,
          blockNumber: blockNum
        }
      );
      
      expect(error.message).toBe('Transaction failed');
      expect(error.code).toBe(KILTErrorType.TRANSACTION_EXECUTION_ERROR);
      expect(error.transactionHash).toBe(txHash);
      expect(error.blockNumber).toBe(blockNum);
    });

    test('should handle parachain connection error', () => {
      const error = new KILTError(
        'Failed to connect to KILT parachain',
        KILTErrorType.PARACHAIN_CONNECTION_ERROR
      );
      
      expect(error.code).toBe(KILTErrorType.PARACHAIN_CONNECTION_ERROR);
      expect(error.message).toContain('parachain');
    });

    test('should handle invalid KILT address error', () => {
      const error = new KILTError(
        'Invalid KILT address format',
        KILTErrorType.INVALID_KILT_ADDRESS
      );
      
      expect(error.code).toBe(KILTErrorType.INVALID_KILT_ADDRESS);
      expect(error.message).toContain('Invalid');
    });

    test('should handle DID not found error', () => {
      const error = new KILTError(
        'DID not found on chain',
        KILTErrorType.DID_NOT_FOUND
      );
      
      expect(error.code).toBe(KILTErrorType.DID_NOT_FOUND);
    });

    test('should handle DID registration error', () => {
      const error = new KILTError(
        'Failed to register DID',
        KILTErrorType.DID_REGISTRATION_ERROR
      );
      
      expect(error.code).toBe(KILTErrorType.DID_REGISTRATION_ERROR);
    });

    test('should handle DID update error', () => {
      const error = new KILTError(
        'Failed to update DID',
        KILTErrorType.DID_UPDATE_ERROR
      );
      
      expect(error.code).toBe(KILTErrorType.DID_UPDATE_ERROR);
    });

    test('should handle DID deletion error', () => {
      const error = new KILTError(
        'Failed to delete DID',
        KILTErrorType.DID_DELETION_ERROR
      );
      
      expect(error.code).toBe(KILTErrorType.DID_DELETION_ERROR);
    });

    test('should handle insufficient balance error', () => {
      const error = new KILTError(
        'Insufficient balance for transaction',
        KILTErrorType.INSUFFICIENT_BALANCE
      );
      
      expect(error.code).toBe(KILTErrorType.INSUFFICIENT_BALANCE);
    });

    test('should handle gas estimation error', () => {
      const error = new KILTError(
        'Failed to estimate gas',
        KILTErrorType.GAS_ESTIMATION_ERROR
      );
      
      expect(error.code).toBe(KILTErrorType.GAS_ESTIMATION_ERROR);
    });

    test('should handle invalid parameters error', () => {
      const error = new KILTError(
        'Invalid parameters provided',
        KILTErrorType.INVALID_PARAMETERS
      );
      
      expect(error.code).toBe(KILTErrorType.INVALID_PARAMETERS);
    });

    test('should preserve stack trace from cause error if provided', () => {
      const causeError = new Error('Original network error');
      const error = new KILTError(
        'Failed to connect',
        KILTErrorType.NETWORK_ERROR,
        { cause: causeError }
      );
      
      // The cause error's stack is preserved in the KILT error's stack
      expect(error.stack).toBeDefined();
      if (causeError.stack) {
        expect(error.stack).toBe(causeError.stack);
      }
    });

    test('should include parachain info if provided', () => {
      const parachainInfo = {
        network: 'Spiritnet',
        endpoint: 'wss://spiritnet.kilt.io',
        chainId: 2086
      };

      const error = new KILTError(
        'Parachain connection failed',
        KILTErrorType.PARACHAIN_CONNECTION_ERROR,
        { parachainInfo }
      );
      
      expect(error.parachainInfo).toEqual(parachainInfo);
    });
  });

  describe('Error Inheritance', () => {
    test('all wallet errors should be instances of Error', () => {
      const errors = [
        new WalletError('test', 'TEST'),
        new WalletNotFoundError('test'),
        new UserRejectedError('connection'),
        new TimeoutError('connection'),
        new InvalidSignatureError(),
        new InvalidAddressError('test'),
        new ConfigurationError('test'),
        new WalletConnectionError('test'),
        new MessageValidationError('test'),
        new AddressValidationError('test')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(WalletError);
      });
    });

    test('KILTError should be instance of Error', () => {
      const error = new KILTError('test', KILTErrorType.NETWORK_ERROR);
      
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Error Catching', () => {
    test('should be catchable with try-catch', () => {
      expect(() => {
        try {
          throw new WalletNotFoundError('TestWallet');
        } catch (error) {
          expect(error).toBeInstanceOf(WalletNotFoundError);
          expect(error).toBeInstanceOf(WalletError);
          expect(error).toBeInstanceOf(Error);
          throw error;
        }
      }).toThrow(WalletNotFoundError);
    });

    test('should preserve error type through throw/catch', () => {
      const throwAndCatch = (errorInstance: any) => {
        try {
          throw errorInstance;
        } catch (e) {
          return e;
        }
      };

      const error = new UserRejectedError('signing');
      const caught = throwAndCatch(error);
      
      expect(caught).toBeInstanceOf(UserRejectedError);
      expect(caught.message).toBe(error.message);
      expect(caught.code).toBe(error.code);
    });

    test('should distinguish between different error types', () => {
      const handleError = (error: Error) => {
        if (error instanceof WalletNotFoundError) {
          return 'wallet_not_found';
        } else if (error instanceof UserRejectedError) {
          return 'user_rejected';
        } else if (error instanceof KILTError) {
          return 'kilt_error';
        }
        return 'unknown';
      };

      expect(handleError(new WalletNotFoundError('Test'))).toBe('wallet_not_found');
      expect(handleError(new UserRejectedError('connection'))).toBe('user_rejected');
      expect(handleError(new KILTError('Test', KILTErrorType.NETWORK_ERROR))).toBe('kilt_error');
      expect(handleError(new Error('Generic'))).toBe('unknown');
    });
  });
});

