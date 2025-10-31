import { KILTTransactionService, KILTTransactionConfig, KILTTransactionOptions } from '../KILTTransactionService.js';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { KILTError, KILTErrorType } from '../../types/KILTTypes.js';

// Mock @polkadot/api
jest.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: jest.fn(),
  },
}));

// Mock KeyringPair
const mockKeyringPair: jest.Mocked<KeyringPair> = {
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  publicKey: new Uint8Array(32).fill(1),
  sign: jest.fn(),
  lock: jest.fn(),
  unlock: jest.fn(),
  isLocked: false,
  type: 'sr25519',
  meta: {},
  encodedLength: 96,
  encodePkcs8: jest.fn(),
  encode: jest.fn(),
  setMeta: jest.fn(),
  signAsync: jest.fn(),
} as any;

// Mock SubmittableExtrinsic
const mockExtrinsic: any = {
  signAsync: jest.fn(),
  send: jest.fn(),
  paymentInfo: jest.fn(),
  hash: {
    toHex: jest.fn().mockReturnValue('0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0'),
  },
};

// Mock ApiPromise
const mockApiPromise: jest.Mocked<ApiPromise> = {
  isConnected: true,
  genesisHash: '0x1234567890123456789012345678901234567890',
  rpc: {
    system: {
      accountNextIndex: jest.fn().mockResolvedValue({ toNumber: () => 1 }),
    },
    author: {
      pendingExtrinsics: jest.fn().mockResolvedValue([]),
    },
    chain: {
      getBlock: jest.fn().mockResolvedValue({
        block: {
          header: {
            hash: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
          },
          extrinsics: []
        }
      }),
      getBlockHash: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
    },
  },
} as any;

describe('KILTTransactionService', () => {
  let transactionService: KILTTransactionService;
  let mockApi: jest.Mocked<ApiPromise>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mocks to their default behavior
    mockApi = {
      isConnected: true,
      genesisHash: '0x1234567890123456789012345678901234567890',
      rpc: {
        system: {
          accountNextIndex: jest.fn().mockResolvedValue({ toNumber: () => 1 }),
        },
        author: {
          pendingExtrinsics: jest.fn().mockResolvedValue([]),
        },
        chain: {
          getBlock: jest.fn().mockResolvedValue({
            block: {
              header: {
                number: { toNumber: () => 12345 },
                hash: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
              },
              extrinsics: []
            }
          }),
          getBlockHash: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
        },
      },
    } as any;

    transactionService = new KILTTransactionService(mockApi);
  });

  describe('constructor', () => {
    it('should create service with default configuration', () => {
      const config = transactionService.getConfig();
      
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelay).toBe(2000);
      expect(config.confirmationTimeout).toBe(30000);
      expect(config.gasMultiplier).toBe(1.2);
      expect(config.enableNonceManagement).toBe(true);
    });

    it('should create service with custom configuration', () => {
      const customConfig: Partial<KILTTransactionConfig> = {
        maxRetries: 5,
        retryDelay: 1000,
        confirmationTimeout: 60000,
        gasMultiplier: 1.5,
        enableNonceManagement: false,
      };

      const service = new KILTTransactionService(mockApi, customConfig);
      const config = service.getConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.retryDelay).toBe(1000);
      expect(config.confirmationTimeout).toBe(60000);
      expect(config.gasMultiplier).toBe(1.5);
      expect(config.enableNonceManagement).toBe(false);
    });
  });

  describe('getNonce', () => {
    it('should get nonce from API when nonce management is enabled', async () => {
      const nonce = await transactionService.getNonce(mockKeyringPair);
      
      expect(nonce).toBe(1);
      expect(mockApi.rpc.system.accountNextIndex).toHaveBeenCalledWith(mockKeyringPair.address);
    });

    it('should cache nonce for subsequent calls', async () => {
      await transactionService.getNonce(mockKeyringPair);
      await transactionService.getNonce(mockKeyringPair);
      
      // Should only call API once due to caching
      expect(mockApi.rpc.system.accountNextIndex).toHaveBeenCalledTimes(1);
    });

    it('should throw KILTError when API call fails', async () => {
      mockApi.rpc.system.accountNextIndex.mockRejectedValue(new Error('API Error'));

      await expect(transactionService.getNonce(mockKeyringPair)).rejects.toThrow(KILTError);
    });

    it('should not cache when nonce management is disabled', async () => {
      const service = new KILTTransactionService(mockApi, { enableNonceManagement: false });
      
      await service.getNonce(mockKeyringPair);
      await service.getNonce(mockKeyringPair);
      
      expect(mockApi.rpc.system.accountNextIndex).toHaveBeenCalledTimes(2);
    });
  });

  describe('incrementNonce', () => {
    it('should increment cached nonce', async () => {
      await transactionService.getNonce(mockKeyringPair);
      transactionService.incrementNonce(mockKeyringPair);
      
      const nonce = await transactionService.getNonce(mockKeyringPair);
      expect(nonce).toBe(2);
    });

    it('should do nothing when nonce management is disabled', () => {
      const service = new KILTTransactionService(mockApi, { enableNonceManagement: false });
      
      // Should not throw or cause issues
      service.incrementNonce(mockKeyringPair);
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas successfully', async () => {
      const mockPaymentInfo = jest.fn().mockResolvedValue({
        partialFee: { toString: () => '1000000000000000000' },
      });

      const testExtrinsic = {
        ...mockExtrinsic,
        paymentInfo: mockPaymentInfo,
      };

      const estimation = await transactionService.estimateGas(testExtrinsic, mockKeyringPair);

      expect(estimation.success).toBe(true);
      expect(estimation.gasLimit).toBe('1200000000000000000'); // 1.2 * original
      expect(estimation.fee).toBe('1000000000000000000');
      expect(estimation.gasPrice).toBe('0');
    });

    it('should handle gas estimation failure', async () => {
      const mockPaymentInfo = jest.fn().mockRejectedValue(new Error('Estimation failed'));

      const testExtrinsic = {
        ...mockExtrinsic,
        paymentInfo: mockPaymentInfo,
      };

      const estimation = await transactionService.estimateGas(testExtrinsic, mockKeyringPair);

      expect(estimation.success).toBe(false);
      expect(estimation.error).toBe('Estimation failed');
      expect(estimation.gasLimit).toBe('0');
    });
  });

  describe('submitTransaction', () => {
    const mockOptions: KILTTransactionOptions = {
      signer: mockKeyringPair,
      waitForConfirmation: true,
    };

    it('should submit transaction successfully', async () => {
      const testExtrinsic = {
        ...mockExtrinsic,
        signAsync: jest.fn().mockResolvedValue({
          hash: { toHex: () => '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0' },
          send: jest.fn().mockImplementation((callback) => {
            // Simulate the callback being called with proper status sequence
            setTimeout(() => {
              // First call: inBlock status
              callback({
                status: {
                  type: 'InBlock',
                  asInBlock: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                },
                isInBlock: true,
                isFinalized: false,
                events: []
              });
              
              // Second call: finalized status
              setTimeout(() => {
                callback({
                  status: {
                    type: 'Finalized',
                    asFinalized: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                  },
                  isFinalized: true,
                  isInBlock: false,
                  events: []
                });
              }, 10);
            }, 0);
            return jest.fn(); // Return unsubscribe function
          }),
        }),
      };

      const result = await transactionService.submitTransaction(testExtrinsic, mockOptions);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0');
      expect(result.fee.currency).toBe('KILT');
      expect(testExtrinsic.signAsync).toHaveBeenCalled();
    });

    it('should validate transaction inputs', async () => {
      await expect(
        transactionService.submitTransaction(null as any, mockOptions)
      ).rejects.toThrow(KILTError);

      await expect(
        transactionService.submitTransaction(mockExtrinsic, { signer: null as any })
      ).rejects.toThrow(KILTError);
    });

    it('should handle API connection errors', async () => {
      mockApi.isConnected = false;

      await expect(
        transactionService.submitTransaction(mockExtrinsic, mockOptions)
      ).rejects.toThrow(KILTError);
    });

    it('should use provided nonce when available', async () => {
      const testExtrinsic = {
        ...mockExtrinsic,
        signAsync: jest.fn().mockResolvedValue({
          hash: { toHex: () => '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0' },
          send: jest.fn().mockResolvedValue(undefined),
        }),
      };

      const optionsWithNonce = { ...mockOptions, nonce: 42 };
      
      await transactionService.submitTransaction(testExtrinsic, optionsWithNonce);

      expect(testExtrinsic.signAsync).toHaveBeenCalledWith(
        mockKeyringPair,
        expect.objectContaining({ nonce: 42 })
      );
    });

    it('should use provided gas limit when available', async () => {
      const testExtrinsic = {
        ...mockExtrinsic,
        signAsync: jest.fn().mockResolvedValue({
          hash: { toHex: () => '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0' },
          send: jest.fn().mockResolvedValue(undefined),
        }),
        paymentInfo: jest.fn(),
      };

      const optionsWithGas = { ...mockOptions, gasLimit: '5000000000000000000' };
      
      await transactionService.submitTransaction(testExtrinsic, optionsWithGas);

      // Should not call paymentInfo since gas limit is provided
      expect(testExtrinsic.paymentInfo).not.toHaveBeenCalled();
    });
  });

  describe('checkTransactionStatus', () => {
    it('should return true when transaction is confirmed', async () => {
      const txHash = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0';
      
      // Add transaction to pending
      (transactionService as any).pendingTransactions.set(txHash, {
        hash: txHash,
        status: 'pending',
        retryCount: 0,
      });

      const isConfirmed = await transactionService.checkTransactionStatus(txHash);

      expect(isConfirmed).toBe(true);
    });

    it('should return false when transaction is still pending', async () => {
      const txHash = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0';
      
      // Mock pending transaction
      mockApi.rpc.author.pendingExtrinsics.mockResolvedValue([
        { hash: { toHex: () => txHash } },
      ] as any);

      const isConfirmed = await transactionService.checkTransactionStatus(txHash);

      expect(isConfirmed).toBe(false);
    });

    it('should throw KILTError when status check fails', async () => {
      mockApi.rpc.author.pendingExtrinsics.mockRejectedValue(new Error('Status check failed'));

      await expect(
        transactionService.checkTransactionStatus('0x123')
      ).rejects.toThrow(KILTError);
    });
  });

  describe('waitForConfirmation', () => {
    it('should wait for transaction confirmation', async () => {
      const txHash = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0';
      
      // Add transaction to pending
      (transactionService as any).pendingTransactions.set(txHash, {
        hash: txHash,
        status: 'pending',
        retryCount: 0,
      });

      // Mock checkTransactionStatus to return true after first call
      let callCount = 0;
      jest.spyOn(transactionService, 'checkTransactionStatus').mockImplementation(async () => {
        callCount++;
        return callCount > 1;
      });

      await transactionService.waitForConfirmation(txHash);

      expect(callCount).toBe(2);
    });

    it('should timeout when confirmation takes too long', async () => {
      const service = new KILTTransactionService(mockApi, { confirmationTimeout: 100 });
      const txHash = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0';
      
      // Add transaction to pending
      (service as any).pendingTransactions.set(txHash, {
        hash: txHash,
        status: 'pending',
        retryCount: 0,
      });

      // Mock checkTransactionStatus to always return false
      jest.spyOn(service, 'checkTransactionStatus').mockResolvedValue(false);

      await expect(service.waitForConfirmation(txHash)).rejects.toThrow(KILTError);
    });

    it('should throw error when transaction is not found', async () => {
      await expect(
        transactionService.waitForConfirmation('0x123')
      ).rejects.toThrow(KILTError);
    });
  });

  describe('retryTransaction', () => {
    it('should retry failed transaction', async () => {
      const txHash = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0';
      
      // Add failed transaction to pending
      (transactionService as any).pendingTransactions.set(txHash, {
        hash: txHash,
        status: 'failed',
        retryCount: 0,
      });

      const testExtrinsic = {
        ...mockExtrinsic,
        signAsync: jest.fn().mockResolvedValue({
          hash: { toHex: () => '0xnewhash' },
          send: jest.fn().mockImplementation((callback) => {
            // Simulate the callback being called with proper status sequence
            setTimeout(() => {
              // First call: inBlock status
              callback({
                status: {
                  type: 'InBlock',
                  asInBlock: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                },
                isInBlock: true,
                isFinalized: false,
                events: []
              });
              
              // Second call: finalized status
              setTimeout(() => {
                callback({
                  status: {
                    type: 'Finalized',
                    asFinalized: { toHex: () => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
                  },
                  isFinalized: true,
                  isInBlock: false,
                  events: []
                });
              }, 10);
            }, 0);
            return jest.fn(); // Return unsubscribe function
          }),
        }),
      };

      const result = await transactionService.retryTransaction(
        txHash,
        testExtrinsic,
        { signer: mockKeyringPair, waitForConfirmation: true }
      );

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xnewhash');
    });

    it('should throw error when max retries exceeded', async () => {
      const txHash = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0';
      
      // Add transaction with max retries
      (transactionService as any).pendingTransactions.set(txHash, {
        hash: txHash,
        status: 'failed',
        retryCount: 3,
      });

      await expect(
        transactionService.retryTransaction(txHash, mockExtrinsic, { signer: mockKeyringPair })
      ).rejects.toThrow(KILTError);
    });

    it('should throw error when original transaction not found', async () => {
      await expect(
        transactionService.retryTransaction('0x123', mockExtrinsic, { signer: mockKeyringPair })
      ).rejects.toThrow(KILTError);
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      transactionService.updateConfig({ maxRetries: 10, retryDelay: 5000 });
      
      const config = transactionService.getConfig();
      expect(config.maxRetries).toBe(10);
      expect(config.retryDelay).toBe(5000);
      expect(config.confirmationTimeout).toBe(30000); // Should remain unchanged
    });
  });

  describe('transaction status management', () => {
    it('should get transaction status', () => {
      const txHash = '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0';
      const status = {
        hash: txHash,
        status: 'pending' as const,
        retryCount: 0,
      };

      (transactionService as any).pendingTransactions.set(txHash, status);

      const retrievedStatus = transactionService.getTransactionStatus(txHash);
      expect(retrievedStatus).toEqual(status);
    });

    it('should get all pending transactions', () => {
      const status1 = { hash: '0x1', status: 'pending' as const, retryCount: 0 };
      const status2 = { hash: '0x2', status: 'confirmed' as const, retryCount: 0 };

      (transactionService as any).pendingTransactions.set('0x1', status1);
      (transactionService as any).pendingTransactions.set('0x2', status2);

      const pending = transactionService.getPendingTransactions();
      expect(pending).toHaveLength(2);
      expect(pending).toContainEqual(status1);
      expect(pending).toContainEqual(status2);
    });

    it('should clear pending transactions', () => {
      (transactionService as any).pendingTransactions.set('0x1', {});
      
      transactionService.clearPendingTransactions();
      
      expect(transactionService.getPendingTransactions()).toHaveLength(0);
    });

    it('should clear nonce cache', async () => {
      await transactionService.getNonce(mockKeyringPair);
      expect(mockApi.rpc.system.accountNextIndex).toHaveBeenCalledTimes(1);

      transactionService.clearNonceCache();
      
      await transactionService.getNonce(mockKeyringPair);
      expect(mockApi.rpc.system.accountNextIndex).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle non-KILT errors and wrap them', async () => {
      mockApi.rpc.system.accountNextIndex.mockRejectedValue(new Error('Network error'));

      await expect(transactionService.getNonce(mockKeyringPair)).rejects.toThrow(KILTError);
    });

    it('should preserve KILT errors', async () => {
      const kiltError = new KILTError('KILT specific error', KILTErrorType.DID_REGISTRATION_ERROR);
      mockApi.rpc.system.accountNextIndex.mockRejectedValue(kiltError);

      await expect(transactionService.getNonce(mockKeyringPair)).rejects.toThrow(KILTError);
    });
  });
});
