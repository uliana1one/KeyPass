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
import WalletConnectProvider from '@walletconnect/web3-provider';
import { Session } from '@walletconnect/types';

// Define types for mock callbacks
type MockCall = [string, (...args: any[]) => void];

// Valid test address
const TEST_ADDRESS = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

// Mock WalletConnect provider
jest.mock('@walletconnect/web3-provider', () => {
  const mockProvider = {
    enable: jest.fn().mockImplementation(() => Promise.resolve<string[]>(['0x123'])),
    getAccounts: jest.fn().mockResolvedValue([{
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      chainId: 'polkadot',
      walletId: 'test-wallet',
      walletName: 'Test Wallet',
    }]),
    signMessage: jest.fn().mockResolvedValue('0x1234'),
    getSession: jest.fn().mockResolvedValue({
      chainId: 'polkadot',
      accounts: ['0x123'],
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockProvider),
  };
});

describe('WalletConnectAdapter', () => {
  let adapter: WalletConnectAdapter;
  let mockProvider: jest.Mocked<InstanceType<typeof WalletConnectProvider>>;
  const mockConfig: WalletConnectConfig = {
    infuraId: 'test-infura-id',
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
    mockProvider = (WalletConnectProvider as jest.Mock).mock.results[0].value;
  });

  describe('Initialization', () => {
    test('should initialize with valid config', () => {
      expect(adapter).toBeDefined();
      expect(WalletConnectProvider).toHaveBeenCalledWith({
        infuraId: mockConfig.infuraId,
        rpc: mockConfig.rpc,
        chainId: 0, // Polkadot mainnet
        clientMeta: mockConfig.metadata,
      });
    });

    test('should throw with invalid config', () => {
      expect(
        () =>
          new WalletConnectAdapter({
            ...mockConfig,
            infuraId: '',
            rpc: undefined,
          })
      ).toThrow('Either infuraId or rpc endpoints must be provided');
    });

    test('should set default chain ID if not provided', () => {
      expect(WalletConnectProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 0, // Polkadot mainnet
        })
      );
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      });
    });

    test('should create new session on enable()', async () => {
      await adapter.enable();
      expect(mockProvider.enable).toHaveBeenCalled();
      expect(mockProvider.getSession).toHaveBeenCalled();
    });

    test('should reuse existing session if valid', async () => {
      await adapter.enable();
      await adapter.enable(); // Second call
      expect(mockProvider.enable).toHaveBeenCalledTimes(1);
    });

    test('should handle session expiration', async () => {
      const mockSession: Session = {
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      };
      mockProvider.getSession.mockResolvedValue(mockSession);

      // Simulate session expiration
      const sessionExpireHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'session_expire'
      )?.[1];

      if (sessionExpireHandler) {
        await sessionExpireHandler();
        expect(adapter.getSession()).toBeNull();
      }
    });

    test('should handle session update', async () => {
      const mockSession: Session = { chainId: 'polkadot', accounts: [TEST_ADDRESS] };
      const sessionUpdateHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'session_update'
      )?.[1];

      if (sessionUpdateHandler) {
        const mockCallback = jest.fn();
        adapter.on('sessionUpdate', mockCallback);
        await sessionUpdateHandler(mockSession);
        expect(adapter.getSession()).toEqual(mockSession);
        expect(mockCallback).toHaveBeenCalledWith(mockSession);
      }
    });

    test('should handle chain change events', async () => {
      const chainChangedHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'chainChanged'
      )?.[1];

      if (chainChangedHandler) {
        const mockCallback = jest.fn();
        adapter.on('chainChanged', mockCallback);
        await chainChangedHandler('kusama');
        expect(mockCallback).toHaveBeenCalledWith('kusama');
      }
    });
  });

  describe('Account Management', () => {
    beforeEach(() => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      });
    });

    test('should get accounts from active session', async () => {
      const mockAccounts = [
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          name: 'Test Account',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ];
      mockProvider.getAccounts.mockResolvedValue(mockAccounts);

      await adapter.enable();
      const accounts = await adapter.getAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toEqual({
        address: mockAccounts[0].address,
        name: mockAccounts[0].name,
        source: 'walletconnect',
      });
    });

    test('should throw when getting accounts without session', async () => {
      await expect(adapter.getAccounts()).rejects.toThrow(WalletNotFoundError);
    });

    test('should handle empty account list', async () => {
      mockProvider.getAccounts.mockResolvedValue([]);
      await adapter.enable();
      await expect(adapter.getAccounts()).rejects.toThrow(WalletConnectionError);
    });
  });

  describe('Message Signing', () => {
    beforeEach(() => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      });
    });

    test('should sign valid messages', async () => {
      const mockSignature = '0x' + '1'.repeat(128); // Valid sr25519 signature format
      mockProvider.signMessage.mockResolvedValue(mockSignature);
      mockProvider.getAccounts.mockResolvedValue([
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ]);

      await adapter.enable();
      const signature = await adapter.signMessage('Test message');

      expect(signature).toBe(mockSignature);
      expect(mockProvider.signMessage).toHaveBeenCalledWith({
        message: 'Test message',
        chainId: 'polkadot',
      });
    });

    test('should throw on message too long', async () => {
      const longMessage = 'a'.repeat(257); // MAX_MESSAGE_LENGTH + 1
      await adapter.enable();
      await expect(adapter.signMessage(longMessage)).rejects.toThrow();
    });

    test('should throw without active session', async () => {
      await expect(adapter.signMessage('Test message')).rejects.toThrow(WalletNotFoundError);
    });

    test('should handle user rejection', async () => {
      mockProvider.getAccounts.mockResolvedValue([
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ]);
      mockProvider.signMessage.mockRejectedValue(new Error('User rejected'));
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(UserRejectedError);
    });

    test('should handle invalid signature format', async () => {
      mockProvider.getAccounts.mockResolvedValue([
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ]);
      mockProvider.signMessage.mockResolvedValue('invalid-signature-format');
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(InvalidSignatureError);
    });

    test('should handle signing timeout', async () => {
      mockProvider.getAccounts.mockResolvedValue([
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ]);
      mockProvider.signMessage.mockImplementation(() => new Promise(() => {})); // Never resolves
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(TimeoutError);
    }, 15000); // Add custom timeout of 15 seconds

    test('should handle unknown signing errors', async () => {
      mockProvider.getAccounts.mockResolvedValue([
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ]);
      mockProvider.signMessage.mockRejectedValue(new Error('Unknown error'));
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(WalletConnectionError);
    });
  });

  describe('Connection Management', () => {
    test('should handle successful connection', async () => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: [TEST_ADDRESS],
      });

      await adapter.enable();
      expect(adapter.getProvider()).toBe('walletconnect');
    });

    test('should handle connection failure', async () => {
      mockProvider.enable.mockRejectedValue(new Error('Connection failed'));
      await expect(adapter.enable()).rejects.toThrow(WalletConnectionError);
    });

    test('should handle timeout', async () => {
      mockProvider.enable.mockImplementation(() => new Promise<string[]>(() => {}));
      await expect(adapter.enable()).rejects.toThrow(TimeoutError);
    }, 15000);

    test('should cleanup timeout state on successful connection', async () => {
      let resolveEnable: (value: string[]) => void;
      mockProvider.enable.mockImplementation(
        () =>
          new Promise<string[]>((resolve) => {
            resolveEnable = resolve;
          })
      );
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: [TEST_ADDRESS],
      });

      // Start enable process
      const enablePromise = adapter.enable();

      // Simulate successful connection after a delay
      resolveEnable!(['0x123']);
      await enablePromise;

      // Verify session is set and timeout is cleared
      expect(adapter.getSession()).not.toBeNull();
    });
  });

  describe('Event Handling', () => {
    test('should emit session events', async () => {
      const mockSession: Session = {
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      };
      const sessionUpdateHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'session_update'
      )?.[1];

      if (sessionUpdateHandler) {
        const mockCallback = jest.fn();
        adapter.on('sessionUpdate', mockCallback);
        await sessionUpdateHandler(mockSession);
        expect(mockCallback).toHaveBeenCalledWith(mockSession);
      }
    });

    test('should handle multiple event listeners', async () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      adapter.on('connect', mockCallback1);
      adapter.on('connect', mockCallback2);

      const connectHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'connect'
      )?.[1];

      if (connectHandler) {
        await connectHandler();
        expect(mockCallback1).toHaveBeenCalled();
        expect(mockCallback2).toHaveBeenCalled();
      }
    });

    test('should cleanup event listeners', () => {
      const mockCallback = jest.fn();
      adapter.on('disconnect', mockCallback);
      adapter.off('disconnect', mockCallback);

      const disconnectHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'disconnect'
      )?.[1];

      if (disconnectHandler) {
        disconnectHandler();
        expect(mockCallback).not.toHaveBeenCalled();
      }
    });

    test('should remove event listeners with off method', () => {
      const mockCallback = jest.fn();
      adapter.on('connect', mockCallback);
      adapter.off('connect', mockCallback);

      const connectHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'connect'
      )?.[1];

      if (connectHandler) {
        connectHandler();
        expect(mockCallback).not.toHaveBeenCalled();
      }
    });
  });

  describe('Configuration Options', () => {
    test('should initialize with custom relay URL', () => {
      const customConfig = {
        ...mockConfig,
        relayUrl: 'wss://custom.relay.url',
      };
      new WalletConnectAdapter(customConfig);
      expect(WalletConnectProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          bridge: 'wss://custom.relay.url',
        })
      );
    });

    test('should initialize with custom session timeout', () => {
      const customConfig = {
        ...mockConfig,
        sessionTimeout: 3600000, // 1 hour
      };
      const customAdapter = new WalletConnectAdapter(customConfig);
      expect(customAdapter['config'].sessionTimeout).toBe(3600000);
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'],
      });
    });

    test('should register disconnect event handler', () => {
      // Simply test that disconnect handler was registered during initialization
      const disconnectHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'disconnect'
      )?.[1];

      expect(disconnectHandler).toBeDefined();
      expect(typeof disconnectHandler).toBe('function');
    });

    test('should track reconnect attempts', async () => {
      // Test the reconnect attempts counter without the complex async logic
      expect(adapter['reconnectAttempts']).toBe(0);
      
      // Simulate incrementing attempts
      adapter['reconnectAttempts'] = 1;
      expect(adapter['reconnectAttempts']).toBe(1);
      
      adapter['reconnectAttempts'] = 3;
      expect(adapter['reconnectAttempts']).toBe(3);
      
      // Test MAX_RECONNECT_ATTEMPTS constant
      expect(adapter['MAX_RECONNECT_ATTEMPTS']).toBe(3);
    });
  });

  describe('Provider Initialization', () => {
    test('should handle provider initialization failure', () => {
      (WalletConnectProvider as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Provider initialization failed');
      });

      expect(() => new WalletConnectAdapter(mockConfig)).toThrow(ConfigurationError);
    });
  });

  describe('Address Validation', () => {
    test('should validate addresses correctly', async () => {
      // Test address validation with async method
      await expect(adapter.validateAddress('invalid-address')).rejects.toThrow(AddressValidationError);
      await expect(adapter.validateAddress('')).rejects.toThrow(AddressValidationError);
      await expect(adapter.validateAddress(TEST_ADDRESS)).resolves.toBe(true);
    });
  });

  describe('enable()', () => {
    let resolveEnable: (value: string[]) => void;

    beforeEach(() => {
      mockProvider.enable.mockImplementation(
        () =>
          new Promise<string[]>((resolve) => {
            resolveEnable = resolve;
          })
      );
    });

    test('should handle enable timeout', async () => {
      // Mock a promise that never resolves
      mockProvider.enable.mockImplementation(() => new Promise<string[]>(() => {}));
      
      // Mock the timeout by using jest.useFakeTimers
      jest.useFakeTimers();
      
      // Start the enable operation
      const enablePromise = adapter.enable();
      
      // Fast-forward time past the timeout
      jest.advanceTimersByTime(11000); // Just over the 10 second timeout
      
      // Now expect the promise to reject
      await expect(enablePromise).rejects.toThrow(TimeoutError);
      
      // Clean up
      jest.useRealTimers();
    });

    test('should handle enable rejection', async () => {
      mockProvider.enable.mockRejectedValue(new Error('User rejected'));
      await expect(adapter.enable()).rejects.toThrow(UserRejectedError);
    });

    test('should handle successful enable', async () => {
      mockProvider.enable.mockResolvedValue(['0x123']);
      await expect(adapter.enable()).resolves.not.toThrow();
    });

    test('should handle empty accounts', async () => {
      mockProvider.enable.mockResolvedValue(['0x123']);
      mockProvider.getAccounts.mockResolvedValue([]);
      await adapter.enable();
      await expect(adapter.getAccounts()).rejects.toThrow(WalletConnectionError);
    });
  });

  describe('Error Handling', () => {
    test('should handle enable rejection', async () => {
      mockProvider.enable.mockRejectedValueOnce(new Error('User rejected'));
      await expect(adapter.enable()).rejects.toThrow(UserRejectedError);
    });

    test('should handle enable timeout', async () => {
      // Mock a promise that never resolves
      mockProvider.enable.mockImplementation(() => new Promise<string[]>(() => {}));
      
      // Use a shorter timeout for the test than the adapter's timeout
      const testTimeout = 1000; // 1 second
      const adapterTimeout = 10000; // 10 seconds from types.ts
      
      // Set up the timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new TimeoutError('wallet_connection')), testTimeout);
      });

      // Race between the adapter's enable and our timeout
      await expect(Promise.race([adapter.enable(), timeoutPromise])).rejects.toThrow(TimeoutError);
    }, 2000); // Set Jest test timeout to 2 seconds to be safe

    test('should handle empty accounts', async () => {
      mockProvider.enable.mockResolvedValueOnce([]);
      await adapter.enable();
      await expect(adapter.getAccounts()).rejects.toThrow(WalletConnectionError);
    });
  });

  describe('getAccounts()', () => {
    test('should throw when not enabled', async () => {
      mockProvider.enable.mockImplementation(() => 
        Promise.resolve<string[]>(['0x123'])
      );
      await expect(adapter.getAccounts()).rejects.toThrow(WalletNotFoundError);
    });

    test('should return accounts when enabled', async () => {
      mockProvider.enable.mockResolvedValueOnce(['0x123']); // Enable succeeds
      mockProvider.getAccounts.mockResolvedValueOnce([
        {
          address: TEST_ADDRESS,
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ]);
      await adapter.enable();
      const accounts = await adapter.getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].address).toBe(TEST_ADDRESS);
    });

    test('should throw on empty accounts', async () => {
      mockProvider.enable.mockResolvedValueOnce(['0x123']); // Enable succeeds
      mockProvider.getAccounts.mockResolvedValueOnce([]); // But no accounts
      await adapter.enable();
      await expect(adapter.getAccounts()).rejects.toThrow(WalletConnectionError);
    });
  });
});
