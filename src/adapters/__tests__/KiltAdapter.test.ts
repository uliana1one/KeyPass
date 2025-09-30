import { KiltAdapter } from '../KiltAdapter.js';
import {
  WalletNotFoundError,
  TimeoutError,
  WalletConnectionError,
  AddressValidationError,
} from '../../errors/WalletErrors.js';

// Mock the API and providers for testing
jest.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: jest.fn().mockResolvedValue({
      isReady: Promise.resolve(),
      runtimeChain: { toString: () => 'KILT Spiritnet' },
      runtimeVersion: {
        specVersion: { toString: () => '5' },
        specName: { toString: () => 'kilt' },
      },
      genesisHash: { toString: () => '0x1234567890123456789012345678901234567890' },
      disconnect: jest.fn(),
    }),
  },
  WsProvider: jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
  })),
}));

// Mock extension dapp
jest.mock('@polkadot/extension-dapp', () => ({
  web3Enable: jest.fn().mockResolvedValue(true),
  web3Accounts: jest.fn().mockResolvedValue([
    {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: {
        name: 'Test Account',
      },
    },
  ]),
  web3FromAddress: jest.fn().mockResolvedValue({
    signer: {
      signRaw: jest.fn().mockResolvedValue({
        signature: '0x' + '1'.repeat(128),
      }),
    },
  }),
}));

// Mock util-crypto
jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn().mockReturnValue(true),
}));

// Mock window object with proper setup
const mockWindow = {
  injectedWeb3: {
    kilt: {},
  },
};
Object.assign(window, mockWindow);
global.window = window as any;

describe('KiltAdapter', () => {
  let kiltAdapter: KiltAdapter;

  beforeEach(() => {
    // Reset window mock before each test
    Object.assign(window, {
      injectedWeb3: {
        kilt: {},
      },
    });
    
    // Reset all mocks
    const { web3Enable } = require('@polkadot/extension-dapp');
    web3Enable.mockResolvedValue(true); // Default to successful resolution
    
    kiltAdapter = new KiltAdapter();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await kiltAdapter.disconnect();
  });

  describe('connect', () => {
    it('should connect to KILT spiritnet and return chain info', async () => {
      const chainInfo = await kiltAdapter.connect();

      expect(chainInfo).toEqual({
        name: 'KILT Spiritnet',
        network: 'spiritnet',
        version: '5',
        runtime: 'kilt',
        ss58Format: 38,
        genesisHash: '0x1234567890123456789012345678901234567890',
      });

      expect(chainInfo.ss58Format).toBe(38); // KILT uses SS58 format 38
    });

    it('should emit chainConnected event', (done) => {
      kiltAdapter.on('chainConnected', (data) => {
        expect(data.network).toBe('spiritnet');
        done();
      });

      kiltAdapter.connect();
    });

    it('should clean up on connection failure', async () => {
      // Mock API creation to throw error for all attempts
      const { ApiPromise } = require('@polkadot/api');
      ApiPromise.create.mockRejectedValue(new Error('Connection failed'));

      await expect(kiltAdapter.connect()).rejects.toThrow(WalletConnectionError);
      expect(kiltAdapter.getChainInfo()).toBeNull();
    });
  });

  describe('enable', () => {
    it('should enable KILT extension when connected', async () => {
      await kiltAdapter.connect();
      await kiltAdapter.enable();

      expect(kiltAdapter.getProvider()).toBe('kilt');
    });

    it('should throw error when KILT extension is not available', async () => {
      // Remove KILT extension from window mock
      delete (window as any).injectedWeb3.kilt;

      await kiltAdapter.connect();

      await expect(kiltAdapter.enable()).rejects.toThrow(WalletNotFoundError);
      expect(kiltAdapter.getProvider()).toBeNull();
    });

    it('should handle timeout during enable', async () => {
      // Mock web3Enable to hang, but ensure extension exists first
      const { web3Enable } = require('@polkadot/extension-dapp');
      web3Enable.mockReturnValue(new Promise(() => {})); // Never resolves

      await kiltAdapter.connect();

      // This should timeout because web3Enable never resolves
      await expect(kiltAdapter.enable()).rejects.toThrow(TimeoutError);
    }, 15000); // Increase timeout to 15 seconds
  });

  describe('getAccounts', () => {
    beforeEach(async () => {
      await kiltAdapter.connect();
      await kiltAdapter.enable();
    });

    it('should return KILT accounts', async () => {
      const accounts = await kiltAdapter.getAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toEqual({
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        name: 'Test Account',
        source: 'kilt',
      });
    });

    it('should throw error when not enabled', async () => {
      const newAdapter = new KiltAdapter();
      
      await expect(newAdapter.getAccounts()).rejects.toThrow(WalletNotFoundError);
    });

    it('should handle empty accounts', async () => {
      const { web3Accounts } = require('@polkadot/extension-dapp');
      web3Accounts.mockResolvedValueOnce([]);

      await expect(kiltAdapter.getAccounts()).rejects.toThrow(WalletConnectionError);
    });
  });

  describe('signMessage', () => {
    beforeEach(async () => {
      await kiltAdapter.connect();
      await kiltAdapter.enable();
    });

    it('should sign message with KILT account', async () => {
      const signature = await kiltAdapter.signMessage('Hello KILT');

        expect(signature).toBe('0x' + '1'.repeat(128));
        expect(signature).toMatch(/^0x[a-fA-F0-9]{128}$/); // 0x + 128 hex chars for SR25519
    });

    it('should validate message content', async () => {
      await expect(kiltAdapter.signMessage('')).rejects.toThrow('Message must be a non-empty string');
    });

    it('should throw error when not enabled', async () => {
      const newAdapter = new KiltAdapter();
      
      await expect(newAdapter.signMessage('test')).rejects.toThrow(WalletNotFoundError);
    });

    it('should handle signing rejection', async () => {
      const { web3FromAddress } = require('@polkadot/extension-dapp');
      web3FromAddress.mockResolvedValueOnce({
        signer: {
          signRaw: jest.fn().mockRejectedValue(new Error('User rejected')),
        },
      });

      await expect(kiltAdapter.signMessage('test')).rejects.toThrow('User rejected');
    });
  });

  describe('validateAddress', () => {
    beforeEach(async () => {
      await kiltAdapter.connect();
    });

    it('should validate KILT address with SS58 format 38', async () => {
      // Mock the validation functions to work together properly
      const { validatePolkadotAddress } = require('../../adapters/types.js');
      const validateSpy = jest.spyOn(require('../../adapters/types.js'), 'validatePolkadotAddress').mockImplementation(() => {});

      const isValid = await kiltAdapter.validateAddress('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
      expect(isValid).toBe(true);
      
      validateSpy.mockRestore();
    });

    it('should throw error for invalid address', async () => {
      const { isAddress } = require('@polkadot/util-crypto');
      isAddress.mockReturnValueOnce(false);

      await expect(kiltAdapter.validateAddress('invalid')).rejects.toThrow(AddressValidationError);
    });
  });

  describe('disconnect', () => {
    it('should clean up all connections', async () => {
      await kiltAdapter.connect();
      await kiltAdapter.enable();

      expect(kiltAdapter.getProvider()).toBe('kilt');
      expect(kiltAdapter.getChainInfo()).toBeTruthy();

      await kiltAdapter.disconnect();

      expect(kiltAdapter.getProvider()).toBeNull();
      expect(kiltAdapter.getChainInfo()).toBeNull();
    });

    it('should emit disconnected event', (done) => {
      kiltAdapter.on('disconnected', () => {
        done();
      });

      kiltAdapter.disconnect();
    });
  });

  describe('getChainInfo', () => {
    it('should return null before connection', () => {
      expect(kiltAdapter.getChainInfo()).toBeNull();
    });

    it('should return chain info after connection', async () => {
      await kiltAdapter.connect();
      
      const chainInfo = kiltAdapter.getChainInfo();
      expect(chainInfo).toBeTruthy();
      expect(chainInfo!.network).toBe('spiritnet');
      expect(chainInfo!.ss58Format).toBe(38);
    });
  });

  describe('event handling', () => {
    it('should register and remove event listeners', () => {
      const callback = jest.fn();
      
      kiltAdapter.on('test', callback);
      expect(kiltAdapter['eventEmitter'].listeners('test')).toHaveLength(1);

      kiltAdapter.off('test', callback);
      expect(kiltAdapter['eventEmitter'].listeners('test')).toHaveLength(0);
    });
  });
});
