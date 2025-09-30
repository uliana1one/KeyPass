/**
 * Moonbeam Adapter Tests
 * 
 * Tests for Moonbeam blockchain connectivity and operations.
 */

import { ethers } from 'ethers';
import { MoonbeamAdapter, MoonbeamAdapterError } from '../MoonbeamAdapter.js';
import { MoonbeamNetwork, MoonbeamErrorCode } from '../../config/moonbeamConfig.js';

// Mock ethers.js
const mockProvider = {
  getNetwork: jest.fn(),
  getBlockNumber: jest.fn(),
  getBlock: jest.fn(),
  getFeeData: jest.fn(),
  getBalance: jest.fn(),
  getTransaction: jest.fn(),
  waitForTransaction: jest.fn(),
  removeAllListeners: jest.fn(),
};

jest.mock('ethers', () => {
  const MockJsonRpcProvider = jest.fn().mockImplementation(() => mockProvider);
  
  return {
    ethers: {
      JsonRpcProvider: MockJsonRpcProvider,
      formatUnits: jest.fn((value: any, unit: string) => {
        if (unit === 'gwei') {
          return (Number(value) / 1e9).toFixed(2);
        }
        return value.toString();
      }),
      parseUnits: jest.fn((value: string, unit: string) => {
        if (unit === 'gwei') {
          return BigInt(Math.floor(Number(value) * 1e9));
        }
        if (unit === 'ether') {
          return BigInt(Math.floor(Number(value) * 1e18));
        }
        return BigInt(value);
      }),
      parseEther: jest.fn((value: string) => {
        return BigInt(Math.floor(Number(value) * 1e18));
      }),
      isAddress: jest.fn((address: string) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      }),
    },
    JsonRpcProvider: MockJsonRpcProvider,
    formatUnits: jest.fn((value: any, unit: string) => {
      if (unit === 'gwei') {
        return (Number(value) / 1e9).toFixed(2);
      }
      return value.toString();
    }),
    parseUnits: jest.fn((value: string, unit: string) => {
      if (unit === 'gwei') {
        return BigInt(Math.floor(Number(value) * 1e9));
      }
      if (unit === 'ether') {
        return BigInt(Math.floor(Number(value) * 1e18));
      }
      return BigInt(value);
    }),
    parseEther: jest.fn((value: string) => {
      return BigInt(Math.floor(Number(value) * 1e18));
    }),
    isAddress: jest.fn((address: string) => {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }),
  };
});

// Mock the config manager
jest.mock('../../config/moonbeamConfig.js', () => ({
  MoonbeamConfigManager: {
    getInstance: jest.fn(() => ({
      setCurrentNetwork: jest.fn(),
      getCurrentNetworkConfig: jest.fn(() => ({
        name: 'Moonbase Alpha',
        chainId: 1287,
        rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
        wsUrl: 'wss://wss.api.moonbase.moonbeam.network',
        explorerUrl: 'https://moonbase.moonscan.io',
        nativeToken: 'DEV',
        nativeTokenDecimals: 18,
        gasPrice: '1000000000',
        maxGasLimit: '30000000',
        blockTime: 12,
      })),
      getTransactionConfig: jest.fn(() => ({
        defaultGasLimit: '300000',
        gasPriceMultiplier: 1.2,
        timeout: 60000,
        maxRetries: 3,
        retryDelay: 1000,
        confirmationBlocks: 1,
      })),
    })),
  },
  MoonbeamNetwork: {
    MAINNET: 'mainnet',
    MOONBASE_ALPHA: 'moonbase-alpha',
    MOONRIVER: 'moonriver',
  },
  MoonbeamErrorCode: {
    NETWORK_ERROR: 'MOONBEAM_NETWORK_ERROR',
    CONTRACT_ERROR: 'MOONBEAM_CONTRACT_ERROR',
    TRANSACTION_ERROR: 'MOONBEAM_TRANSACTION_ERROR',
    METADATA_ERROR: 'MOONBEAM_METADATA_ERROR',
    VALIDATION_ERROR: 'MOONBEAM_VALIDATION_ERROR',
    IPFS_ERROR: 'MOONBEAM_IPFS_ERROR',
  },
}));

describe('MoonbeamAdapter', () => {
  let adapter: MoonbeamAdapter;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset mock provider methods
    mockProvider.getNetwork.mockReset();
    mockProvider.getBlockNumber.mockReset();
    mockProvider.getBlock.mockReset();
    mockProvider.getFeeData.mockReset();
    mockProvider.getBalance.mockReset();
    mockProvider.getTransaction.mockReset();
    mockProvider.waitForTransaction.mockReset();
    mockProvider.removeAllListeners.mockReset();

    adapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
    adapter.setDebug(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create adapter with default network', () => {
      const defaultAdapter = new MoonbeamAdapter();
      expect(defaultAdapter.getCurrentNetwork()).toBe(MoonbeamNetwork.MOONBASE_ALPHA);
    });

    it('should create adapter with specified network', () => {
      const mainnetAdapter = new MoonbeamAdapter(MoonbeamNetwork.MAINNET);
      expect(mainnetAdapter.getCurrentNetwork()).toBe(MoonbeamNetwork.MAINNET);
    });

    it('should initialize with disconnected state', () => {
      expect(adapter.isConnected()).toBe(false);
      expect(adapter.getConnectionStatus().connected).toBe(false);
    });
  });

  describe('Connection Management', () => {
    it('should connect successfully to Moonbeam network', async () => {
      // Mock successful connection
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1287n,
        name: 'moonbase-alpha',
      });
      mockProvider.getBlockNumber.mockResolvedValue(12345);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0x1234567890abcdef',
        number: 12345,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('0.1', 'gwei'),
        maxFeePerGas: ethers.parseUnits('1.1', 'gwei'),
      });

      const networkInfo = await adapter.connect();

      expect(networkInfo.connected).toBe(true);
      expect(networkInfo.chainId).toBe(1287);
      expect(networkInfo.name).toBe('Moonbase Alpha');
      expect(networkInfo.network).toBe(MoonbeamNetwork.MOONBASE_ALPHA);
      expect(networkInfo.currentBlockNumber).toBe(12345);
      expect(networkInfo.latestBlockHash).toBe('0x1234567890abcdef');
      expect(adapter.isConnected()).toBe(true);
    });

    it('should handle connection failures', async () => {
      mockProvider.getNetwork.mockRejectedValue(new Error('Connection failed'));

      await expect(adapter.connect()).rejects.toThrow(MoonbeamAdapterError);
      expect(adapter.isConnected()).toBe(false);
    });

    it('should disconnect successfully', async () => {
      // Mock successful connection first
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1287n,
        name: 'moonbase-alpha',
      });
      mockProvider.getBlockNumber.mockResolvedValue(12345);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0x1234567890abcdef',
        number: 12345,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
      });

      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);

      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
      expect(mockProvider.removeAllListeners).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      // Mock successful connection first
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1287n,
        name: 'moonbase-alpha',
      });
      mockProvider.getBlockNumber.mockResolvedValue(12345);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0x1234567890abcdef',
        number: 12345,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
      });

      await adapter.connect();
      
      // Mock disconnect error
      mockProvider.removeAllListeners.mockImplementation(() => {
        throw new Error('Disconnect error');
      });

      await expect(adapter.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Network Information', () => {
    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1287n,
        name: 'moonbase-alpha',
      });
      mockProvider.getBlockNumber.mockResolvedValue(12345);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0x1234567890abcdef',
        number: 12345,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
      });

      await adapter.connect();
    });

    it('should get network information', async () => {
      const networkInfo = await adapter.getNetworkInfo();

      expect(networkInfo.chainId).toBe(1287);
      expect(networkInfo.name).toBe('Moonbase Alpha');
      expect(networkInfo.network).toBe(MoonbeamNetwork.MOONBASE_ALPHA);
      expect(networkInfo.nativeToken).toBe('DEV');
      expect(networkInfo.nativeTokenDecimals).toBe(18);
      expect(networkInfo.connected).toBe(true);
    });

    it('should throw error when not connected', async () => {
      await adapter.disconnect();

      await expect(adapter.getNetworkInfo()).rejects.toThrow(MoonbeamAdapterError);
    });
  });

  describe('Gas Price Information', () => {
    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1287n,
        name: 'moonbase-alpha',
      });
      mockProvider.getBlockNumber.mockResolvedValue(12345);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0x1234567890abcdef',
        number: 12345,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('0.1', 'gwei'),
        maxFeePerGas: ethers.parseUnits('1.1', 'gwei'),
      });

      await adapter.connect();
    });

    it('should get gas price information', async () => {
      const gasInfo = await adapter.getGasPrice();

      expect(gasInfo.gasPrice).toBeDefined();
      expect(gasInfo.gasPriceGwei).toBe('1.00');
      expect(gasInfo.estimatedGasLimit).toBe('21000');
      expect(gasInfo.maxGasLimit).toBe('30000000');
      expect(gasInfo.maxPriorityFeePerGas).toBeDefined();
      expect(gasInfo.maxFeePerGas).toBeDefined();
    });

    it('should handle EIP-1559 not supported', async () => {
      // Mock getFeeData to return data without EIP-1559 fields
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
      });

      const gasInfo = await adapter.getGasPrice();

      expect(gasInfo.gasPrice).toBeDefined();
      expect(gasInfo.gasPriceGwei).toBe('1.00');
      expect(gasInfo.maxPriorityFeePerGas).toBeUndefined();
      expect(gasInfo.maxFeePerGas).toBeUndefined();
    });

    it('should throw error when not connected', async () => {
      await adapter.disconnect();

      await expect(adapter.getGasPrice()).rejects.toThrow(MoonbeamAdapterError);
    });
  });

  describe('Blockchain Operations', () => {
    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1287n,
        name: 'moonbase-alpha',
      });
      mockProvider.getBlockNumber.mockResolvedValue(12345);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0x1234567890abcdef',
        number: 12345,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
      });

      await adapter.connect();
    });

    it('should get current block number', async () => {
      const blockNumber = await adapter.getCurrentBlockNumber();

      expect(blockNumber).toBe(12345);
      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
    });

    it('should get balance for address', async () => {
      const mockBalance = ethers.parseEther('1.5');
      mockProvider.getBalance.mockResolvedValue(mockBalance);

      const balance = await adapter.getBalance('0x1234567890123456789012345678901234567890');

      expect(balance).toBe(mockBalance.toString());
      expect(mockProvider.getBalance).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890');
    });

    it('should get transaction by hash', async () => {
      const mockTx = {
        hash: '0xabcdef1234567890',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: ethers.parseEther('1'),
      };
      mockProvider.getTransaction.mockResolvedValue(mockTx);

      const tx = await adapter.getTransaction('0xabcdef1234567890');

      expect(tx).toEqual(mockTx);
      expect(mockProvider.getTransaction).toHaveBeenCalledWith('0xabcdef1234567890');
    });

    it('should wait for transaction confirmation', async () => {
      const mockTx = {
        hash: '0xabcdef1234567890',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: ethers.parseEther('1'),
      };
      mockProvider.waitForTransaction.mockResolvedValue(mockTx);

      const tx = await adapter.waitForTransaction('0xabcdef1234567890', 1);

      expect(tx).toEqual(mockTx);
      expect(mockProvider.waitForTransaction).toHaveBeenCalledWith('0xabcdef1234567890', 1);
    });
  });

  describe('Network Switching', () => {
    it('should switch to different network', async () => {
      // Mock initial connection
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1287n,
        name: 'moonbase-alpha',
      });
      mockProvider.getBlockNumber.mockResolvedValue(12345);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0x1234567890abcdef',
        number: 12345,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
      });

      await adapter.connect();

      // Mock network switch
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1284n,
        name: 'moonbeam-mainnet',
      });
      mockProvider.getBlockNumber.mockResolvedValue(54321);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0xfedcba0987654321',
        number: 54321,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1.5', 'gwei'),
      });

      const networkInfo = await adapter.switchNetwork(MoonbeamNetwork.MAINNET);

      expect(networkInfo.network).toBe(MoonbeamNetwork.MAINNET);
      expect(networkInfo.currentBlockNumber).toBe(54321);
      expect(adapter.getCurrentNetwork()).toBe(MoonbeamNetwork.MAINNET);
    });

    it('should handle network switch failures', async () => {
      await expect(adapter.switchNetwork(MoonbeamNetwork.MAINNET)).rejects.toThrow(MoonbeamAdapterError);
    });
  });

  describe('Error Handling', () => {
    it('should throw proper error for network operations when not connected', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';

      await expect(adapter.getNetworkInfo()).rejects.toThrow(MoonbeamAdapterError);
      await expect(adapter.getGasPrice()).rejects.toThrow(MoonbeamAdapterError);
      await expect(adapter.getCurrentBlockNumber()).rejects.toThrow(MoonbeamAdapterError);
      await expect(adapter.getBalance(testAddress)).rejects.toThrow(MoonbeamAdapterError);
      await expect(adapter.getTransaction('0x123')).rejects.toThrow(MoonbeamAdapterError);
      await expect(adapter.waitForTransaction('0x123')).rejects.toThrow(MoonbeamAdapterError);
    });

    it('should handle RPC failures gracefully', async () => {
      mockProvider.getNetwork.mockRejectedValue(new Error('RPC Error'));

      await expect(adapter.connect()).rejects.toThrow(MoonbeamAdapterError);
    });
  });

  describe('Utility Methods', () => {
    it('should get underlying provider', async () => {
      expect(adapter.getProvider()).toBeNull();

      // Mock successful connection
      mockProvider.getNetwork.mockResolvedValue({
        chainId: 1287n,
        name: 'moonbase-alpha',
      });
      mockProvider.getBlockNumber.mockResolvedValue(12345);
      mockProvider.getBlock.mockResolvedValue({
        hash: '0x1234567890abcdef',
        number: 12345,
      });
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: ethers.parseUnits('1', 'gwei'),
      });

      await adapter.connect();
      expect(adapter.getProvider()).toBe(mockProvider);
    });

    it('should get current network', () => {
      expect(adapter.getCurrentNetwork()).toBe(MoonbeamNetwork.MOONBASE_ALPHA);
    });

    it('should get connection status', () => {
      const status = adapter.getConnectionStatus();
      
      expect(status.connected).toBe(false);
      expect(status.network).toBe(MoonbeamNetwork.MOONBASE_ALPHA);
      expect(status.connectedAt).toBeNull();
    });

    it('should enable/disable debug mode', () => {
      // Debug mode starts as false by default
      adapter.setDebug(false);
      expect(adapter.debug).toBe(false);
      
      adapter.setDebug(true);
      expect(adapter.debug).toBe(true);
      
      adapter.setDebug(false);
      expect(adapter.debug).toBe(false);
    });
  });
});
