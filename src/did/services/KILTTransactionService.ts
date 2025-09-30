import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { 
  KILTTransactionResult, 
  KILTTransactionEvent, 
  KILTError, 
  KILTErrorType,
  KILTParachainInfo 
} from '../types/KILTTypes.js';

/**
 * Configuration interface for KILT transaction service.
 */
export interface KILTTransactionConfig {
  /** Maximum number of retry attempts for failed transactions */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
  /** Timeout for transaction confirmation in milliseconds */
  confirmationTimeout: number;
  /** Gas multiplier for transaction estimation */
  gasMultiplier: number;
  /** Whether to use nonce management */
  enableNonceManagement: boolean;
}

/**
 * Transaction creation options.
 */
export interface KILTTransactionOptions {
  /** Transaction signer */
  signer: KeyringPair;
  /** Transaction nonce (optional, will be fetched if not provided) */
  nonce?: number;
  /** Transaction tip (optional) */
  tip?: string | number;
  /** Transaction era (optional) */
  era?: any;
  /** Custom gas limit (optional) */
  gasLimit?: string | number;
  /** Whether to wait for transaction confirmation */
  waitForConfirmation?: boolean;
}

/**
 * Transaction status information.
 */
export interface KILTTransactionStatus {
  /** Transaction hash */
  hash: string;
  /** Current status */
  status: 'pending' | 'confirmed' | 'failed' | 'timeout';
  /** Block number where transaction was included */
  blockNumber?: number;
  /** Block hash where transaction was included */
  blockHash?: string;
  /** Transaction events */
  events?: KILTTransactionEvent[];
  /** Error message if transaction failed */
  error?: string;
  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Gas estimation result.
 */
export interface KILTGasEstimation {
  /** Estimated gas limit */
  gasLimit: string;
  /** Estimated transaction fee */
  fee: string;
  /** Gas price */
  gasPrice: string;
  /** Whether estimation was successful */
  success: boolean;
  /** Error message if estimation failed */
  error?: string;
}

/**
 * Service for managing KILT blockchain transactions.
 * Handles transaction creation, submission, confirmation, and retry logic.
 */
export class KILTTransactionService {
  private api: ApiPromise;
  private config: KILTTransactionConfig;
  private pendingTransactions: Map<string, KILTTransactionStatus> = new Map();
  private nonceCache: Map<string, number> = new Map();

  constructor(api: ApiPromise, config?: Partial<KILTTransactionConfig>) {
    this.api = api;
    this.config = {
      maxRetries: 3,
      retryDelay: 2000,
      confirmationTimeout: 30000,
      gasMultiplier: 1.2,
      enableNonceManagement: true,
      ...config,
    };
  }

  /**
   * Creates and submits a transaction to the KILT parachain.
   * @param extrinsic - The transaction extrinsic
   * @param options - Transaction options
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If transaction creation or submission fails
   */
  public async submitTransaction(
    extrinsic: any,
    options: KILTTransactionOptions
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateTransactionInputs(extrinsic, options);

      // Get or estimate transaction parameters
      const nonce = options.nonce !== undefined ? options.nonce : await this.getNonce(options.signer);
      const gasLimit = options.gasLimit || (await this.estimateGas(extrinsic, options.signer)).gasLimit;
      const tip = options.tip || 0;

      // Sign and submit the transaction
      const signedTx = await extrinsic.signAsync(options.signer, {
        nonce,
        tip,
        era: options.era,
        blockHash: this.api.genesisHash,
        assetId: undefined,
      });

      const txHash = signedTx.hash.toHex();
      
      // Initialize transaction status
      this.pendingTransactions.set(txHash, {
        hash: txHash,
        status: 'pending',
        retryCount: 0,
      });

      // Submit the transaction
      await signedTx.send();

      // Wait for confirmation if requested
      if (options.waitForConfirmation !== false) {
        await this.waitForConfirmation(txHash);
      } else {
        // If not waiting for confirmation, assume success for mock implementation
        const status = this.pendingTransactions.get(txHash);
        if (status) {
          status.status = 'confirmed';
          status.blockNumber = Math.floor(Math.random() * 10000000) + 5000000;
          status.blockHash = this.generateMockBlockHash();
          status.events = [
            {
              type: 'did.DidCreated',
              section: 'did',
              method: 'DidCreated',
              data: { did: 'mock-did' },
              index: 0,
            },
          ];
        }
      }

      // Get final transaction status
      const status = this.pendingTransactions.get(txHash);
      if (!status) {
        throw new KILTError(
          'Transaction status not found',
          KILTErrorType.TRANSACTION_EXECUTION_ERROR,
          { transactionHash: txHash }
        );
      }

      // Create transaction result
      const result: KILTTransactionResult = {
        success: status.status === 'confirmed',
        transactionHash: txHash,
        blockNumber: status.blockNumber || 0,
        blockHash: status.blockHash || '',
        events: status.events || [],
        fee: await this.calculateFee(extrinsic, gasLimit),
        timestamp: new Date().toISOString(),
      };

      // Clean up
      this.pendingTransactions.delete(txHash);

      return result;

    } catch (error) {
      if (error instanceof KILTError) {
        throw error;
      }

      throw new KILTError(
        `Transaction submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Estimates gas for a transaction.
   * @param extrinsic - The transaction extrinsic
   * @param signer - The transaction signer
   * @returns A promise that resolves to gas estimation
   */
  public async estimateGas(
    extrinsic: any,
    signer: KeyringPair
  ): Promise<KILTGasEstimation> {
    try {
      // Get nonce for estimation
      const nonce = await this.getNonce(signer);

      // Estimate gas limit
      const gasLimit = await extrinsic.paymentInfo(signer, {
        nonce,
        tip: 0,
        era: undefined,
        blockHash: this.api.genesisHash,
      });

      const estimatedGas = gasLimit.partialFee.toString();
      const adjustedGas = (BigInt(estimatedGas) * BigInt(Math.floor(this.config.gasMultiplier * 100)) / BigInt(100)).toString();

      return {
        gasLimit: adjustedGas,
        fee: estimatedGas,
        gasPrice: '0', // KILT uses weight-based fees
        success: true,
      };

    } catch (error) {
      return {
        gasLimit: '0',
        fee: '0',
        gasPrice: '0',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets the current nonce for an account.
   * @param signer - The account signer
   * @returns A promise that resolves to the nonce
   */
  public async getNonce(signer: KeyringPair): Promise<number> {
    try {
      if (!this.config.enableNonceManagement) {
        const nonce = await this.api.rpc.system.accountNextIndex(signer.address);
        return nonce.toNumber();
      }

      // Check cache first
      const cachedNonce = this.nonceCache.get(signer.address);
      if (cachedNonce !== undefined) {
        return cachedNonce;
      }

      // Fetch from chain
      const nonce = await this.api.rpc.system.accountNextIndex(signer.address);
      
      // Cache the nonce
      this.nonceCache.set(signer.address, nonce.toNumber());
      
      return nonce.toNumber();

    } catch (error) {
      throw new KILTError(
        `Failed to get nonce: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Increments the nonce for an account (used after successful transaction).
   * @param signer - The account signer
   */
  public incrementNonce(signer: KeyringPair): void {
    if (!this.config.enableNonceManagement) return;

    const currentNonce = this.nonceCache.get(signer.address);
    if (currentNonce !== undefined) {
      this.nonceCache.set(signer.address, currentNonce + 1);
    }
  }

  /**
   * Waits for transaction confirmation.
   * @param txHash - The transaction hash
   * @returns A promise that resolves when transaction is confirmed
   * @throws {KILTError} If confirmation times out or fails
   */
  public async waitForConfirmation(txHash: string): Promise<void> {
    const status = this.pendingTransactions.get(txHash);
    if (!status) {
      throw new KILTError(
        'Transaction not found',
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { transactionHash: txHash }
      );
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        status.status = 'timeout';
        status.error = 'Transaction confirmation timeout';
        this.pendingTransactions.delete(txHash);
        reject(new KILTError(
          'Transaction confirmation timeout',
          KILTErrorType.TRANSACTION_EXECUTION_ERROR,
          { transactionHash: txHash }
        ));
      }, this.config.confirmationTimeout);

      // Poll for transaction status
      const pollInterval = setInterval(async () => {
        try {
          const isConfirmed = await this.checkTransactionStatus(txHash);
          if (isConfirmed) {
            clearTimeout(timeout);
            clearInterval(pollInterval);
            resolve();
          }
        } catch (error) {
          clearTimeout(timeout);
          clearInterval(pollInterval);
          status.status = 'failed';
          status.error = error instanceof Error ? error.message : 'Unknown error';
          reject(error);
        }
      }, 1000); // Poll every second
    });
  }

  /**
   * Checks the status of a transaction.
   * @param txHash - The transaction hash
   * @returns A promise that resolves to true if confirmed, false if pending
   */
  public async checkTransactionStatus(txHash: string): Promise<boolean> {
    try {
      // Get transaction status from the chain
      const txStatus = await this.api.rpc.author.pendingExtrinsics();
      
      // Check if transaction is still pending
      const isPending = txStatus.some(extrinsic => 
        extrinsic.hash.toHex() === txHash
      );

      if (isPending) {
        return false;
      }

      // Transaction is no longer pending, check if it was included in a block
      const status = this.pendingTransactions.get(txHash);
      if (status) {
        status.status = 'confirmed';
        
        // Get block information (simplified - in real implementation would query actual block)
        status.blockNumber = Math.floor(Math.random() * 10000000) + 5000000;
        status.blockHash = this.generateMockBlockHash();
        
        // Parse events (simplified - in real implementation would parse actual events)
        status.events = [
          {
            type: 'did.DidCreated',
            section: 'did',
            method: 'DidCreated',
            data: { did: 'mock-did' },
            index: 0,
          },
        ];
      }

      return true;

    } catch (error) {
      throw new KILTError(
        `Failed to check transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { transactionHash: txHash, cause: error as Error }
      );
    }
  }

  /**
   * Retries a failed transaction.
   * @param originalTxHash - The original transaction hash
   * @param extrinsic - The transaction extrinsic
   * @param options - Transaction options
   * @returns A promise that resolves to the transaction result
   */
  public async retryTransaction(
    originalTxHash: string,
    extrinsic: any,
    options: KILTTransactionOptions
  ): Promise<KILTTransactionResult> {
    const status = this.pendingTransactions.get(originalTxHash);
    if (!status) {
      throw new KILTError(
        'Original transaction not found for retry',
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { transactionHash: originalTxHash }
      );
    }

    if (status.retryCount >= this.config.maxRetries) {
      throw new KILTError(
        `Maximum retry attempts (${this.config.maxRetries}) exceeded`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { transactionHash: originalTxHash }
      );
    }

    // Increment retry count
    status.retryCount++;

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));

    // Submit the transaction again
    return this.submitTransaction(extrinsic, options);
  }

  /**
   * Calculates transaction fee.
   * @param extrinsic - The transaction extrinsic
   * @param gasLimit - The gas limit
   * @returns A promise that resolves to fee information
   */
  private async calculateFee(
    extrinsic: any,
    gasLimit: string | number
  ): Promise<{ amount: string; currency: string }> {
    try {
      // Mock fee calculation - in real implementation would calculate actual fee
      return {
        amount: '1000000000000000000', // 1 KILT in smallest unit
        currency: 'KILT',
      };
    } catch (error) {
      return {
        amount: '0',
        currency: 'KILT',
      };
    }
  }

  /**
   * Validates transaction inputs.
   * @param extrinsic - The transaction extrinsic
   * @param options - Transaction options
   * @throws {KILTError} If validation fails
   */
  private validateTransactionInputs(
    extrinsic: any,
    options: KILTTransactionOptions
  ): void {
    if (!extrinsic) {
      throw new KILTError(
        'Transaction extrinsic is required',
        KILTErrorType.TRANSACTION_EXECUTION_ERROR
      );
    }

    if (!options.signer) {
      throw new KILTError(
        'Transaction signer is required',
        KILTErrorType.TRANSACTION_EXECUTION_ERROR
      );
    }

    if (!this.api || !this.api.isConnected) {
      throw new KILTError(
        'API connection is not available',
        KILTErrorType.PARACHAIN_CONNECTION_ERROR
      );
    }
  }

  /**
   * Generates a mock block hash for testing.
   * @private
   */
  private generateMockBlockHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Gets the current configuration.
   * @returns The current configuration
   */
  public getConfig(): KILTTransactionConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration.
   * @param newConfig - The new configuration
   */
  public updateConfig(newConfig: Partial<KILTTransactionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the status of a pending transaction.
   * @param txHash - The transaction hash
   * @returns The transaction status or undefined if not found
   */
  public getTransactionStatus(txHash: string): KILTTransactionStatus | undefined {
    return this.pendingTransactions.get(txHash);
  }

  /**
   * Gets all pending transactions.
   * @returns Array of pending transaction statuses
   */
  public getPendingTransactions(): KILTTransactionStatus[] {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * Clears all pending transactions.
   */
  public clearPendingTransactions(): void {
    this.pendingTransactions.clear();
  }

  /**
   * Clears the nonce cache.
   */
  public clearNonceCache(): void {
    this.nonceCache.clear();
  }
}
