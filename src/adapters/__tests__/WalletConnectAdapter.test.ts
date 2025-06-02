// Mock @polkadot/util-crypto before importing the types
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn(() => true),
  checkAddress: jest.fn(() => [true, null]),
}));

import { WalletConnectAdapter, WalletConnectConfig } from '../WalletConnectAdapter';
import { 
  WalletNotFoundError, 
  UserRejectedError, 
  TimeoutError, 
  WalletConnectionError, 
  InvalidSignatureError, 
  AddressValidationError,
  ConfigurationError 
} from '../../errors/WalletErrors';
import { WalletConnectProvider } from '@walletconnect/web3-provider';
import { Session } from '@walletconnect/types';

// Define types for mock callbacks
type MockCall = [string, (...args: any[]) => void];

// Valid test address
const TEST_ADDRESS = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

// Mock WalletConnect provider
jest.mock('@walletconnect/web3-provider', () => {
  return {
    WalletConnectProvider: jest.fn().mockImplementation(() => ({
      enable: jest.fn(),
      getAccounts: jest.fn(),
      signMessage: jest.fn(),
      getSession: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn()
    }))
  };
});

describe('WalletConnectAdapter', () => {
  let adapter: WalletConnectAdapter;
  let mockProvider: jest.Mocked<WalletConnectProvider>;
  const mockConfig: WalletConnectConfig = {
    projectId: 'test-project-id',
    metadata: {
      name: 'Test App',
      description: 'Test Description',
      url: 'https://test.app',
      icons: ['https://test.app/icon.png']
    }
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
        projectId: mockConfig.projectId,
        metadata: mockConfig.metadata,
        chainId: 'polkadot'
      });
    });

    test('should throw with invalid project ID', () => {
      expect(() => new WalletConnectAdapter({
        ...mockConfig,
        projectId: ''
      })).toThrow('WalletConnect project ID is required');
    });

    test('should set default chain ID if not provided', () => {
      expect(WalletConnectProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 'polkadot'
        })
      );
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty']
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
      const mockSession: Session = { chainId: 'polkadot', accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'] };
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
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty']
      });
    });

    test('should get accounts from active session', async () => {
      const mockAccounts = [
        {
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          name: 'Test Account',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet'
        }
      ];
      mockProvider.getAccounts.mockResolvedValue(mockAccounts);

      await adapter.enable();
      const accounts = await adapter.getAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toEqual({
        address: mockAccounts[0].address,
        name: mockAccounts[0].name,
        source: 'walletconnect'
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
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty']
      });
    });

    test('should sign valid messages', async () => {
      const mockSignature = '0x' + '1'.repeat(128); // Valid sr25519 signature format
      mockProvider.signMessage.mockResolvedValue(mockSignature);
      mockProvider.getAccounts.mockResolvedValue([{
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        chainId: 'polkadot',
        walletId: 'test-wallet',
        walletName: 'Test Wallet'
      }]);

      await adapter.enable();
      const signature = await adapter.signMessage('Test message');

      expect(signature).toBe(mockSignature);
      expect(mockProvider.signMessage).toHaveBeenCalledWith({
        message: 'Test message',
        chainId: 'polkadot'
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
      mockProvider.getAccounts.mockResolvedValue([{
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        chainId: 'polkadot',
        walletId: 'test-wallet',
        walletName: 'Test Wallet'
      }]);
      mockProvider.signMessage.mockRejectedValue(new Error('User rejected'));
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(UserRejectedError);
    });

    test('should handle invalid signature format', async () => {
      mockProvider.getAccounts.mockResolvedValue([{
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        chainId: 'polkadot',
        walletId: 'test-wallet',
        walletName: 'Test Wallet'
      }]);
      mockProvider.signMessage.mockResolvedValue('invalid-signature-format');
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(InvalidSignatureError);
    });

    test('should handle signing timeout', async () => {
      mockProvider.getAccounts.mockResolvedValue([{
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        chainId: 'polkadot',
        walletId: 'test-wallet',
        walletName: 'Test Wallet'
      }]);
      mockProvider.signMessage.mockImplementation(() => new Promise(() => {})); // Never resolves
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(TimeoutError);
    });

    test('should handle unknown signing errors', async () => {
      mockProvider.getAccounts.mockResolvedValue([{
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        chainId: 'polkadot',
        walletId: 'test-wallet',
        walletName: 'Test Wallet'
      }]);
      mockProvider.signMessage.mockRejectedValue(new Error('Unknown error'));
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(WalletConnectionError);
    });
  });

  describe('Connection Management', () => {
    test('should handle successful connection', async () => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty']
      });

      await adapter.enable();
      expect(adapter.getProvider()).toBe('walletconnect');
    });

    test('should handle connection failure', async () => {
      mockProvider.enable.mockRejectedValue(new Error('Connection failed'));
      await expect(adapter.enable()).rejects.toThrow(WalletConnectionError);
    });

    test('should handle timeout', async () => {
      mockProvider.enable.mockImplementation(() => new Promise(() => {})); // Never resolves
      await expect(adapter.enable()).rejects.toThrow(TimeoutError);
    }, 15000); // Set timeout for this specific test to 15 seconds

    test('should cleanup timeout state on successful connection', async () => {
      // Mock a delayed successful connection
      let resolveEnable: (value: void | PromiseLike<void>) => void;
      mockProvider.enable.mockImplementation(() => new Promise<void>(resolve => {
        resolveEnable = resolve;
      }));
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: [TEST_ADDRESS]
      });

      // Start enable process
      const enablePromise = adapter.enable();
      
      // Simulate successful connection after a delay
      resolveEnable!();
      await enablePromise;

      // Verify session is set and timeout is cleared
      expect(adapter.getSession()).not.toBeNull();
    });
  });

  describe('Event Handling', () => {
    test('should emit session events', async () => {
      const mockSession: Session = { chainId: 'polkadot', accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'] };
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
        relayUrl: 'wss://custom.relay.url'
      };
      new WalletConnectAdapter(customConfig);
      expect(WalletConnectProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          relayUrl: 'wss://custom.relay.url'
        })
      );
    });

    test('should initialize with custom session timeout', () => {
      const customConfig = {
        ...mockConfig,
        sessionTimeout: 3600000 // 1 hour
      };
      const customAdapter = new WalletConnectAdapter(customConfig);
      expect(customAdapter['config'].sessionTimeout).toBe(3600000);
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty']
      });
    });

    test('should attempt reconnection on disconnect', async () => {
      await adapter.enable();
      const disconnectHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'disconnect'
      )?.[1];

      if (disconnectHandler) {
        // Mock successful reconnection
        mockProvider.enable.mockResolvedValueOnce(undefined);
        await disconnectHandler();
        expect(mockProvider.enable).toHaveBeenCalled();
        expect(adapter.getSession()).not.toBeNull();
      }
    });

    test('should emit reconnectFailed event after max attempts', async () => {
      await adapter.enable();
      const disconnectHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'disconnect'
      )?.[1];

      if (disconnectHandler) {
        // Mock failed reconnection attempts
        mockProvider.enable.mockRejectedValue(new Error('Connection failed'));
        
        const mockCallback = jest.fn();
        adapter.on('reconnectFailed', mockCallback);

        // Trigger disconnect multiple times to exceed max attempts
        for (let i = 0; i < 4; i++) {
          await disconnectHandler();
        }

        expect(mockCallback).toHaveBeenCalled();
        expect(adapter.getSession()).toBeNull();
      }
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
    test('should handle invalid address format in getAccounts', async () => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: ['5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty']
      });
      mockProvider.getAccounts.mockResolvedValue([{
        address: 'invalid-address',
        chainId: 'polkadot',
        walletId: 'test-wallet',
        walletName: 'Test Wallet'
      }]);

      await adapter.enable();
      await expect(adapter.getAccounts()).rejects.toThrow(AddressValidationError);
    });
  });
}); 