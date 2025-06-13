import { WalletConnectAdapter, WalletConnectConfig } from '../../adapters/WalletConnectAdapter';
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  WalletConnectionError,
  AddressValidationError,
} from '../../errors/WalletErrors';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { Session } from '@walletconnect/types';

// Define types for mock callbacks
type MockCall = [string, (...args: any[]) => void];

// Valid test address
const TEST_ADDRESS = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

// Mock @polkadot/util-crypto before importing the types
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn((address) => {
    // Only accept our test address
    return address === TEST_ADDRESS;
  }),
  checkAddress: jest.fn((address) => {
    // Only accept our test address
    if (address === TEST_ADDRESS) {
      return [true, null];
    }
    return [false, 'Invalid decoded address checksum'];
  }),
}));

// Mock WalletConnect provider
jest.mock('@walletconnect/web3-provider', () => {
  return {
    WalletConnectProvider: jest.fn().mockImplementation(() => ({
      enable: jest.fn(),
      getAccounts: jest.fn(),
      signMessage: jest.fn(),
      getSession: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    })),
  };
});

describe('WalletConnectAdapter', () => {
  let adapter: WalletConnectAdapter;
  let mockProvider: jest.Mocked<WalletConnectProvider>;
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

    test('should throw with invalid infura ID', () => {
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
        accounts: [TEST_ADDRESS],
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
      const mockSession: Session = { chainId: 'polkadot', accounts: [TEST_ADDRESS] };
      mockProvider.getSession.mockResolvedValue(mockSession);

      const sessionExpireHandler = mockProvider.on.mock.calls.find(
        (call: MockCall) => call[0] === 'session_expire'
      )?.[1];

      if (sessionExpireHandler) {
        await sessionExpireHandler();
        expect(adapter.getSession()).toBeNull();
      }
    });
  });

  describe('Account Management', () => {
    beforeEach(() => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: [TEST_ADDRESS],
      });
    });

    test('should get accounts from active session', async () => {
      const mockAccounts = [
        {
          address: TEST_ADDRESS,
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

    test('should throw on invalid address format', async () => {
      const mockAccounts = [
        {
          address: 'invalid-address',
          name: 'Test Account',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ];
      mockProvider.getAccounts.mockResolvedValue(mockAccounts);
      await adapter.enable();
      await expect(adapter.getAccounts()).rejects.toThrow(AddressValidationError);
    });
  });

  describe('Message Signing', () => {
    beforeEach(() => {
      mockProvider.getSession.mockResolvedValue({
        chainId: 'polkadot',
        accounts: [TEST_ADDRESS],
      });
      mockProvider.getAccounts.mockResolvedValue([
        {
          address: TEST_ADDRESS,
          name: 'Test Account',
          chainId: 'polkadot',
          walletId: 'test-wallet',
          walletName: 'Test Wallet',
        },
      ]);
    });

    test('should sign valid messages', async () => {
      // Mock a valid sr25519 signature (0x + 128 hex chars)
      const mockSignature = '0x' + '1'.repeat(128);
      mockProvider.signMessage.mockResolvedValue(mockSignature);

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
      mockProvider.signMessage.mockRejectedValue(new Error('User rejected the request'));
      await adapter.enable();
      await expect(adapter.signMessage('Test message')).rejects.toThrow(UserRejectedError);
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
      // Mock a promise that never resolves
      mockProvider.enable.mockImplementation(() => new Promise(() => {}));

      await expect(adapter.enable()).rejects.toThrow(TimeoutError);
    }, 15000); // Set test timeout to 15 seconds
  });

  describe('Event Handling', () => {
    test('should emit session events', async () => {
      const mockSession: Session = { chainId: 'polkadot', accounts: [TEST_ADDRESS] };
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
  });
});
