// Mock @polkadot/util-crypto before importing the types
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn(() => true),
  checkAddress: jest.fn(() => [true, null]),
}));

import { MessageValidationError, AddressValidationError, InvalidSignatureError } from '../../errors/WalletErrors';

// Mock the types module
jest.mock('../types', () => ({
  validateAndSanitizeMessage: jest.fn((message) => {
    if (!message || message === '') {
      throw new MessageValidationError('Message cannot be empty');
    }
    if (message.length > 256) {
      throw new MessageValidationError('Message exceeds max length');
    }
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(message)) {
      throw new MessageValidationError('Message contains invalid characters');
    }
    return message.trim();
  }),
  validatePolkadotAddress: jest.fn((address) => {
    if (!address || typeof address !== 'string') {
      throw new AddressValidationError('Address must be a non-empty string');
    }
    if (address === 'invalid-address') {
      throw new AddressValidationError('Invalid Polkadot address');
    }
    if (address === 'invalid-checksum-address') {
      throw new AddressValidationError('Invalid address checksum or SS58 format');
    }
    return true;
  }),
  validateSignature: jest.fn((signature) => {
    if (!signature || typeof signature !== 'string') {
      throw new InvalidSignatureError('Invalid signature format');
    }
    if (signature === 'invalid-hex') {
      throw new InvalidSignatureError('Invalid signature format');
    }
    if (!signature.startsWith('0x')) {
      throw new InvalidSignatureError('Invalid signature format: missing 0x prefix');
    }
    if (signature.length !== 130 && signature.length !== 66) {
      throw new InvalidSignatureError(
        'Invalid signature length: must be 0x + 128 hex chars (sr25519) or 0x + 64 hex chars (ed25519)'
      );
    }
    if (!/^0x[0-9a-fA-F]+$/.test(signature)) {
      throw new InvalidSignatureError('Invalid signature format: contains invalid hex characters');
    }
  }),
  validateAddress: jest.fn(),
  WALLET_TIMEOUT: 10000,
}));

import { WalletConnectAdapter, WalletConnectConfig } from '../WalletConnectAdapter';
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  WalletConnectionError,
  ConfigurationError,
} from '../../errors/WalletErrors';

// Mock WalletConnect v2 providers
jest.mock('@walletconnect/ethereum-provider', () => ({
  EthereumProvider: {
    init: jest.fn().mockResolvedValue({
      connect: jest.fn().mockResolvedValue(undefined),
      request: jest.fn().mockImplementation(({ method }) => {
        if (method === 'eth_accounts') {
          return Promise.resolve(['0x123']);
        }
        if (method === 'personal_sign') {
          return Promise.resolve('0x1234');
        }
        return Promise.resolve(null);
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    }),
  },
}));

jest.mock('@walletconnect/universal-provider', () => ({
  UniversalProvider: {
    init: jest.fn().mockResolvedValue({
      connect: jest.fn().mockResolvedValue(undefined),
      request: jest.fn().mockImplementation(({ method }) => {
        if (method === 'eth_accounts') {
          return Promise.resolve(['0x123']);
        }
        return Promise.resolve(null);
      }),
      disconnect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
    }),
  },
}));

describe('WalletConnectAdapter', () => {
  let adapter: WalletConnectAdapter;
  const mockConfig: WalletConnectConfig = {
    projectId: 'test-project-id',
    rpc: {
      0: 'wss://rpc.polkadot.io',
      2: 'wss://kusama-rpc.polkadot.io',
    },
    metadata: {
      name: 'Test App',
      description: 'Test Description',
      url: 'https://test.app',
      icons: ['https://test.app/icon.png'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new WalletConnectAdapter(mockConfig);
  });

  describe('Initialization', () => {
    test('should initialize with valid config', () => {
      expect(adapter).toBeDefined();
    });

    test('should throw with invalid config', () => {
      expect(
        () =>
          new WalletConnectAdapter({
            ...mockConfig,
            projectId: '',
          })
      ).toThrow('projectId is required for WalletConnect v2');
    });
  });

  describe('Basic Functionality', () => {
    test('should have getProvider method', () => {
      expect(typeof adapter.getProvider).toBe('function');
    });

    test('should have validateAddress method', () => {
      expect(typeof adapter.validateAddress).toBe('function');
    });

    test('should have on method', () => {
      expect(typeof adapter.on).toBe('function');
    });

    test('should have off method', () => {
      expect(typeof adapter.off).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing projectId', () => {
      expect(() => new WalletConnectAdapter({
        ...mockConfig,
        projectId: '',
      })).toThrow(ConfigurationError);
    });
  });
});
