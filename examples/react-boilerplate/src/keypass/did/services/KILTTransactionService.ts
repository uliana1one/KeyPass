import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { 
  KILTTransactionResult, 
  KILTTransactionEvent, 
  KILTError, 
  KILTErrorType,
  KILTParachainInfo 
} from '../types/KILTTypes';
import { KILTConfigManager } from '../../config/kiltConfig';

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
  status: 'pending' | 'inBlock' | 'confirmed' | 'failed' | 'timeout';
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
  private configManager: KILTConfigManager;

  constructor(api: ApiPromise, config?: Partial<KILTTransactionConfig>, configManager?: KILTConfigManager) {
    this.api = api;
    this.configManager = configManager || new KILTConfigManager();
    
    // Get configuration from KILT config manager
    const kiltConfig = this.configManager.getTransactionConfig();
    
    this.config = {
      maxRetries: kiltConfig.maxRetries,
      retryDelay: kiltConfig.retryDelay,
      confirmationTimeout: kiltConfig.confirmationTimeout,
      gasMultiplier: kiltConfig.gasMultiplier,
      enableNonceManagement: true,
      ...config,
    };
  }

  /**
   * Submits a pre-signed transaction to the KILT parachain.
   * @param signedExtrinsic - The signed transaction extrinsic
   * @param options - Transaction options
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If transaction submission fails
   */
  public async submitSignedTransaction(
    signedExtrinsic: any,
    options?: Partial<Pick<KILTTransactionOptions, 'waitForConfirmation'>>
  ): Promise<KILTTransactionResult> {
    try {
      const txHash = signedExtrinsic.hash.toHex();
      
      // Initialize transaction status
      this.pendingTransactions.set(txHash, {
        hash: txHash,
        status: 'pending',
        retryCount: 0,
      });

      console.log(`Submitting pre-signed transaction: ${txHash}`);

      // Submit the transaction with blockchain monitoring
      const unsub = await signedExtrinsic.send((status: any) => {
        console.log(`Transaction status: ${status.status.type}`);
        
        if (status.isInBlock) {
          console.log(`Transaction included in block: ${status.status.asInBlock.toHex()}`);
          const txStatus = this.pendingTransactions.get(txHash);
          if (txStatus) {
            txStatus.status = 'inBlock';
            txStatus.blockHash = status.status.asInBlock.toHex();
          }
        }
        
        if (status.isFinalized) {
          console.log(`Transaction finalized: ${status.status.asFinalized.toHex()}`);
          const txStatus = this.pendingTransactions.get(txHash);
          if (txStatus) {
            txStatus.status = 'confirmed';
            txStatus.blockHash = status.status.asFinalized.toHex();
            
            this.getBlockNumber(status.status.asFinalized.toHex()).then(blockNumber => {
              if (txStatus) {
                txStatus.blockNumber = blockNumber;
              }
            }).catch(error => {
              console.warn('Failed to get block number:', error);
              if (txStatus) {
                txStatus.blockNumber = 0;
              }
            });
            
            if (status.events) {
              txStatus.events = status.events.map((event: any, index: number) => ({
                type: `${event.section}.${event.method}`,
                section: event.section,
                method: event.method,
                data: event.data,
                index,
              }));
            }
          }
          unsub();
        }
      });

      // Wait for confirmation if requested
      if (options?.waitForConfirmation !== false) {
        await this.waitForConfirmation(txHash);
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
        fee: await this.estimateFeeFromExtrinsicV2(signedExtrinsic, '0'),
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
        `Pre-signed transaction submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Creates and submits a transaction to the KILT parachain with retry logic.
   * @param extrinsic - The transaction extrinsic
   * @param options - Transaction options
   * @returns A promise that resolves to the transaction result
   * @throws {KILTError} If transaction creation or submission fails after all retries
   */
  public async submitTransaction(
    extrinsic: any,
    options: KILTTransactionOptions
  ): Promise<KILTTransactionResult> {
    return this.submitTransactionWithRetry(extrinsic, options, 0);
  }

  /**
   * Internal method to submit transaction with retry logic.
   * @private
   */
  private async submitTransactionWithRetry(
    extrinsic: any,
    options: KILTTransactionOptions,
    attemptCount: number
  ): Promise<KILTTransactionResult> {
    try {
      // Validate inputs
      this.validateTransactionInputs(extrinsic, options);

      // Ensure API is connected
      if (!this.api.isConnected) {
        throw new KILTError(
          'KILT API not connected',
          KILTErrorType.NETWORK_ERROR
        );
      }

      // Get or estimate transaction parameters
      const nonce = options.nonce !== undefined ? options.nonce : await this.getNonce(options.signer);
      const gasLimit = options.gasLimit || (await this.estimateGas(extrinsic, options.signer)).gasLimit;
      const tip = options.tip || 0;

      console.log(`Submitting transaction with nonce: ${nonce}, gasLimit: ${gasLimit}`);

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

      console.log(`Transaction signed: ${txHash}`);

      // Submit the transaction with real blockchain monitoring
      const unsub = await signedTx.send((status: any) => {
        console.log(`Transaction status: ${status.status.type}`);
        
        if (status.isInBlock) {
          console.log(`Transaction included in block: ${status.status.asInBlock.toHex()}`);
          const txStatus = this.pendingTransactions.get(txHash);
          if (txStatus) {
            txStatus.status = 'inBlock';
            txStatus.blockHash = status.status.asInBlock.toHex();
          }
        }
        
        if (status.isFinalized) {
          console.log(`Transaction finalized: ${status.status.asFinalized.toHex()}`);
          const txStatus = this.pendingTransactions.get(txHash);
          if (txStatus) {
            txStatus.status = 'confirmed';
            txStatus.blockHash = status.status.asFinalized.toHex();
            
            // Handle async operations in the callback
            this.getBlockNumber(status.status.asFinalized.toHex()).then(blockNumber => {
              if (txStatus) {
                txStatus.blockNumber = blockNumber;
              }
            }).catch(error => {
              console.warn('Failed to get block number in callback:', error);
              // Set to 0 if we can't retrieve it, transaction is still valid
              if (txStatus) {
                txStatus.blockNumber = 0;
              }
            });
            
            // Extract events from status
            if (status.events) {
              txStatus.events = status.events.map((event: any, index: number) => ({
                type: `${event.section}.${event.method}`,
                section: event.section,
                method: event.method,
                data: event.data,
                index,
              }));
            }
          }
          unsub();
        }
      });

      // Wait for confirmation if requested
      if (options.waitForConfirmation !== false) {
        await this.waitForConfirmation(txHash);
      }

      // Increment nonce after successful submission
      this.incrementNonce(options.signer);

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
        fee: await this.estimateFeeFromExtrinsicV2(extrinsic, "0"),
        timestamp: new Date().toISOString(),
      };

      // Clean up
      this.pendingTransactions.delete(txHash);

      return result;

    } catch (error) {
      // Check if this is a retryable error
      const isRetryable = this.isRetryableError(error);
      
      if (!isRetryable) {
        // Non-retryable error - throw immediately
        if (error instanceof KILTError) {
          throw error;
        }
        throw new KILTError(
          `Transaction submission failed (non-retryable): ${error instanceof Error ? error.message : 'Unknown error'}`,
          KILTErrorType.TRANSACTION_EXECUTION_ERROR,
          { cause: error as Error }
        );
      }

      // Check if we should retry
      if (attemptCount >= this.config.maxRetries) {
        console.error(`Transaction failed after ${attemptCount + 1} attempts`);
        if (error instanceof KILTError) {
          throw error;
        }
        throw new KILTError(
          `Transaction submission failed after ${this.config.maxRetries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          KILTErrorType.TRANSACTION_EXECUTION_ERROR,
          { cause: error as Error }
        );
      }

      // Calculate retry delay with exponential backoff
      const retryDelay = Math.min(
        this.config.retryDelay * Math.pow(this.config.gasMultiplier, attemptCount),
        this.config.confirmationTimeout
      );

      console.warn(`Transaction attempt ${attemptCount + 1} failed. Retrying in ${retryDelay}ms...`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      // Retry the transaction
      return this.submitTransactionWithRetry(extrinsic, options, attemptCount + 1);
    }
  }

  /**
   * Helper method to estimate fee from an extrinsic.
   * @private
   */

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
      if (status && status.status === 'pending') {
        // Search through recent blocks to find the transaction
        try {
          await this.searchTransactionInRecentBlocks(txHash, status);
          
          // If we couldn't find it in recent blocks, try current block as fallback
          if (status.status === 'pending') {
            const latestBlock = await this.api.rpc.chain.getBlock();
            const blockHash = latestBlock.block.header.hash.toHex();
            
            status.status = 'confirmed';
            try {
              status.blockNumber = await this.getBlockNumber(blockHash);
            } catch (blockNumError) {
              console.warn('Failed to get block number:', blockNumError);
              status.blockNumber = 0; // Set to 0 if unavailable
            }
            status.blockHash = blockHash;
            
            // Parse events from the block
            status.events = await this.extractTransactionEvents(latestBlock.block.extrinsics, blockHash);
          }
        } catch (blockError) {
          console.warn('Failed to search for transaction in blocks:', blockError);
          // Mark as confirmed but without detailed block info
          status.status = 'confirmed';
          status.blockNumber = 0;
        }
      }

      return true;

    } catch (error) {
      throw new KILTError(
        `Failed to check transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Retries a failed transaction with exponential backoff.
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

    // Calculate exponential backoff delay
    const backoffDelay = Math.min(
      this.config.retryDelay * Math.pow(2, status.retryCount),
      this.configManager.getTransactionConfig().maxRetryDelay
    );

    console.log(`Retrying transaction ${originalTxHash} (attempt ${status.retryCount + 1}/${this.config.maxRetries}) after ${backoffDelay}ms`);

    // Increment retry count
    status.retryCount++;

    // Wait before retry with exponential backoff
    await new Promise(resolve => setTimeout(resolve, backoffDelay));

    // Update nonce for retry
    options.nonce = await this.getNonce(options.signer);

    // Submit the transaction again
    return this.submitTransaction(extrinsic, options);
  }

  /**
   * Automatically retries failed transactions based on configuration.
   * @param txHash - The transaction hash to retry
   * @param extrinsic - The transaction extrinsic
   * @param options - Transaction options
   * @returns A promise that resolves to the final transaction result
   */
  public async autoRetryTransaction(
    txHash: string,
    extrinsic: any,
    options: KILTTransactionOptions
  ): Promise<KILTTransactionResult> {
    let lastResult: KILTTransactionResult | null = null;
    let attempts = 0;

    while (attempts <= this.config.maxRetries) {
      try {
        if (attempts > 0) {
          // Wait for retry delay with exponential backoff
          const backoffDelay = Math.min(
            this.config.retryDelay * Math.pow(2, attempts - 1),
            this.configManager.getTransactionConfig().maxRetryDelay
          );
          
          console.log(`Auto-retrying transaction ${txHash} (attempt ${attempts + 1}) after ${backoffDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          
          // Update nonce for retry
          options.nonce = await this.getNonce(options.signer);
        }

        lastResult = await this.submitTransaction(extrinsic, options);
        
        if (lastResult.success) {
          console.log(`Transaction ${txHash} succeeded on attempt ${attempts + 1}`);
          return lastResult;
        }

      } catch (error) {
        console.warn(`Transaction attempt ${attempts + 1} failed:`, error);
        
        // Check if this is a retryable error
        if (!this.isRetryableError(error)) {
          throw error;
        }
      }

      attempts++;
    }

    // All retries exhausted
    throw new KILTError(
      `Transaction ${txHash} failed after ${this.config.maxRetries + 1} attempts`,
      KILTErrorType.TRANSACTION_EXECUTION_ERROR,
      { 
        transactionHash: txHash,
        cause: new Error('Maximum retry attempts exceeded')
      }
    );
  }

  /**
   * Determines if an error is retryable.
   * @param error - The error to check
   * @returns True if the error is retryable
   * @private
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Non-retryable errors
    const nonRetryableErrors = [
      'insufficient balance',
      'invalid signature',
      'invalid nonce',
      'account not found',
      'invalid extrinsic',
    ];
    
    if (nonRetryableErrors.some(msg => errorMessage.includes(msg))) {
      return false;
    }
    
    // Network and timeout errors are retryable
    const retryableErrors = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'busy',
      'rate limit',
    ];
    
    return retryableErrors.some(msg => errorMessage.includes(msg));
  }

  /**
   * Calculates transaction fee.
   * @param extrinsic - The transaction extrinsic
   * @param gasLimit - The gas limit
   * @returns A promise that resolves to fee information
   */
  private async estimateFeeFromExtrinsicV2(
    extrinsic: any,
    gasLimit: string | number
  ): Promise<{ amount: string; currency: string }> {
    try {
      // Get fee details using KILT's payment query
      const feeDetails = await this.api.rpc.payment.queryFeeDetails(extrinsic, gasLimit.toString());
      
      let totalFee = BigInt(0);
      
      // Calculate total fee from inclusion fee components
      if (feeDetails.inclusionFee && !feeDetails.inclusionFee.isNone) {
        const inclusionFee = feeDetails.inclusionFee.unwrap();
        
        // Base fee
        if (inclusionFee.baseFee) {
          totalFee += BigInt(inclusionFee.baseFee.toString());
        }
        
        // Length fee
        if (inclusionFee.lenFee) {
          totalFee += BigInt(inclusionFee.lenFee.toString());
        }
        
        // Adjusted weight fee
        if (inclusionFee.adjustedWeightFee) {
          totalFee += BigInt(inclusionFee.adjustedWeightFee.toString());
        }
      }
      
      // Add tip if present (note: tip might not be available in all versions)
      if ((feeDetails as any).tip) {
        totalFee += BigInt((feeDetails as any).tip.toString());
      }
      
      // Get the current network token symbol
      const networkConfig = this.configManager.getNetworkConfig(this.configManager.getCurrentNetwork());
      
      return {
        amount: totalFee.toString(),
        currency: networkConfig.tokenSymbol,
      };
    } catch (error) {
      console.warn('Failed to calculate transaction fee:', error);
      
      // Fallback to default fee based on network
      const networkConfig = this.configManager.getNetworkConfig(this.configManager.getCurrentNetwork());
      const defaultFee = networkConfig.isTestnet ? '1000000000000000' : '1000000000000000000'; // 0.001 or 1 KILT
      
      return {
        amount: defaultFee,
        currency: networkConfig.tokenSymbol,
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
   * Gets the block number for a given block hash.
   * @param blockHash - The block hash
   * @returns The block number
   * @throws {KILTError} If block number cannot be retrieved
   * @private
   */
  private async getBlockNumber(blockHash: string): Promise<number> {
    try {
      const block = await this.api.rpc.chain.getBlock(blockHash);
      return block.block.header.number.toNumber();
    } catch (error) {
      throw new KILTError(
        `Failed to get block number for hash ${blockHash}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.NETWORK_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Extracts transaction events from block extrinsics using real KILT blockchain data.
   * @param extrinsics - The block extrinsics
   * @param blockHash - The block hash for event retrieval
   * @returns Array of transaction events
   * @private
   */
  private async extractTransactionEvents(extrinsics: any[], blockHash?: string): Promise<KILTTransactionEvent[]> {
    try {
      const events: KILTTransactionEvent[] = [];
      
      if (!blockHash) {
        console.warn('Block hash not provided for event extraction');
        return events;
      }

      // Get events from the block
      const blockEvents = await this.api.query.system.events.at(blockHash);
      
      // Find events for our transaction
      const eventsArray = blockEvents as unknown as any[];
      for (let i = 0; i < eventsArray.length; i++) {
        const event = eventsArray[i];
        const phase = event.phase;
        
        // Check if this event is from an extrinsic (not from inherents)
        if (phase.isApplyExtrinsic) {
          const extrinsicIndex = phase.asApplyExtrinsic.toNumber();
          
          // Check if this event corresponds to one of our extrinsics
          if (extrinsicIndex < extrinsics.length) {
            const eventData = event.event;
            
            const parsedEvent: KILTTransactionEvent = {
              type: `${eventData.section}.${eventData.method}`,
              section: eventData.section.toString(),
              method: eventData.method.toString(),
              data: this.parseEventData(eventData.data),
              index: i,
            };
            
            events.push(parsedEvent);
          }
        }
      }
      
      return events;
    } catch (error) {
      console.warn('Failed to extract transaction events:', error);
      return [];
    }
  }

  /**
   * Parses event data from KILT blockchain events.
   * @param eventData - Raw event data from the blockchain
   * @returns Parsed event data object
   * @private
   */
  private parseEventData(eventData: any): Record<string, unknown> {
    const parsed: Record<string, unknown> = {};
    
    try {
      // Convert the event data to a more readable format
      const eventDataArray = (eventData as any[]);
      if (Array.isArray(eventDataArray)) {
        eventDataArray.forEach((data: any, index: number) => {
        const key = `param${index}`;
        
        if (data && typeof data === 'object') {
          if (data.isU8a) {
            // Handle Uint8Array data
            parsed[key] = data.toHex();
          } else if (data.isU64 || data.isU32 || data.isU16 || data.isU8) {
            // Handle numeric data
            parsed[key] = data.toNumber();
          } else if (data.isText) {
            // Handle text data
            parsed[key] = data.toString();
          } else if (data.isAccountId) {
            // Handle account ID data
            parsed[key] = data.toString();
          } else if (data.isHash) {
            // Handle hash data
            parsed[key] = data.toHex();
          } else {
            // Fallback for other types
            parsed[key] = data.toString();
          }
        } else {
          parsed[key] = data;
        }
        });
      }
    } catch (error) {
      console.warn('Error parsing event data:', error);
      parsed.raw = eventData.toString();
    }

    return parsed;
  }

  /**
   * Searches for a transaction in recent blocks.
   * @param txHash - The transaction hash to search for
   * @param status - The transaction status to update
   * @private
   */
  private async searchTransactionInRecentBlocks(txHash: string, status: KILTTransactionStatus): Promise<void> {
    try {
      // Search through recent blocks to find the transaction
      let currentBlockHash = await this.api.rpc.chain.getFinalizedHead();
      let searchDepth = 0;
      const maxSearchDepth = 10; // Search last 10 blocks

      while (searchDepth < maxSearchDepth) {
        const block = await this.api.rpc.chain.getBlock(currentBlockHash);
        
        // Check if our transaction is in this block
        const transactionFound = block.block.extrinsics.some((extrinsic: any) => 
          extrinsic.hash.toHex() === txHash
        );

        if (transactionFound) {
          // Transaction found! Get block details
          const blockNumber = block.block.header.number.toNumber();
          
          status.status = 'confirmed';
          status.blockNumber = blockNumber;
          status.blockHash = currentBlockHash.toString();
          status.events = await this.extractTransactionEvents(block.block.extrinsics, currentBlockHash.toString());
          return;
        }

        // Move to previous block
        const header = block.block.header;
        currentBlockHash = header.parentHash;
        searchDepth++;
      }

      // Transaction not found in recent blocks
      status.status = 'failed';
      status.error = 'Transaction not found in recent blocks';
      
    } catch (error) {
      console.warn('Error searching for transaction in recent blocks:', error);
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : 'Unknown error';
    }
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

  /**
   * Monitors transaction status with real-time updates.
   * @param txHash - The transaction hash to monitor
   * @param callback - Callback function for status updates
   * @returns A promise that resolves when monitoring is complete
   */
  public async monitorTransaction(
    txHash: string,
    callback: (status: KILTTransactionStatus) => void
  ): Promise<KILTTransactionResult> {
    const status = this.pendingTransactions.get(txHash);
    if (!status) {
      throw new KILTError(
        'Transaction not found for monitoring',
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        { transactionHash: txHash }
      );
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        status.status = 'timeout';
        status.error = 'Transaction monitoring timeout';
        callback(status);
        reject(new KILTError(
          'Transaction monitoring timeout',
          KILTErrorType.TRANSACTION_EXECUTION_ERROR,
          { transactionHash: txHash }
        ));
      }, this.config.confirmationTimeout);

      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const isConfirmed = await this.checkTransactionStatus(txHash);
          
          // Update callback with current status
          callback(status);
          
          if (isConfirmed && status.status === 'confirmed') {
            clearTimeout(timeout);
            clearInterval(pollInterval);
            
            const result: KILTTransactionResult = {
              success: true,
              transactionHash: txHash,
              blockNumber: status.blockNumber || 0,
              blockHash: status.blockHash || '',
              events: status.events || [],
              fee: { amount: '0', currency: 'KILT' }, // Will be calculated separately
              timestamp: new Date().toISOString(),
            };
            
            resolve(result);
          } else if (status.status === 'failed') {
            clearTimeout(timeout);
            clearInterval(pollInterval);
            
            const result: KILTTransactionResult = {
              success: false,
              transactionHash: txHash,
              blockNumber: 0,
              blockHash: '',
              events: [],
              fee: { amount: '0', currency: 'KILT' },
              timestamp: new Date().toISOString(),
            };
            
            reject(new KILTError(
              status.error || 'Transaction failed',
              KILTErrorType.TRANSACTION_EXECUTION_ERROR,
              { transactionHash: txHash }
            ));
          }
        } catch (error) {
          clearTimeout(timeout);
          clearInterval(pollInterval);
          reject(error);
        }
      }, 1000); // Poll every second
    });
  }

  /**
   * Gets transaction details from the blockchain.
   * @param txHash - The transaction hash
   * @returns A promise that resolves to transaction details
   */
  public async getTransactionDetails(txHash: string): Promise<{
    hash: string;
    blockNumber: number;
    blockHash: string;
    events: KILTTransactionEvent[];
    fee: { amount: string; currency: string };
    timestamp: string;
  } | null> {
    try {
      // Search through recent blocks for the transaction
      let currentBlockHash = await this.api.rpc.chain.getFinalizedHead();
      let searchDepth = 0;
      const maxSearchDepth = 50; // Search last 50 blocks

      while (searchDepth < maxSearchDepth) {
        const block = await this.api.rpc.chain.getBlock(currentBlockHash);
        
        // Check if our transaction is in this block
        const transactionIndex = block.block.extrinsics.findIndex((extrinsic: any) => 
          extrinsic.hash.toHex() === txHash
        );

        if (transactionIndex !== -1) {
          // Transaction found! Get details
          const blockNumber = block.block.header.number.toNumber();
          const blockHash = currentBlockHash.toString();
          const events = await this.extractTransactionEvents(block.block.extrinsics, blockHash);
          
          // Calculate fee for this transaction
          const extrinsic = block.block.extrinsics[transactionIndex];
          const gasLimit = await this.estimateGas(extrinsic, null as any);
          const fee = await this.estimateFeeFromExtrinsicV2(extrinsic, gasLimit.gasLimit);

          return {
            hash: txHash,
            blockNumber,
            blockHash,
            events,
            fee,
            timestamp: new Date().toISOString(),
          };
        }

        // Move to previous block
        const header = block.block.header;
        currentBlockHash = header.parentHash;
        searchDepth++;
      }

      return null; // Transaction not found
      
    } catch (error) {
      console.warn('Error getting transaction details:', error);
      return null;
    }
  }

  /**
   * Gets network statistics for monitoring.
   * @returns A promise that resolves to network statistics
   */
  public async getNetworkStats(): Promise<{
    blockNumber: number;
    blockHash: string;
    finalizedBlockNumber: number;
    finalizedBlockHash: string;
    pendingTransactions: number;
    averageBlockTime: number;
    networkName: string;
    tokenSymbol: string;
  }> {
    try {
      const [latestBlock, finalizedBlock, pendingExtrinsics] = await Promise.all([
        this.api.rpc.chain.getBlock(),
        this.api.rpc.chain.getFinalizedHead(),
        this.api.rpc.author.pendingExtrinsics(),
      ]);

      const networkConfig = this.configManager.getNetworkConfig(this.configManager.getCurrentNetwork());

      return {
        blockNumber: latestBlock.block.header.number.toNumber(),
        blockHash: latestBlock.block.header.hash.toHex(),
        finalizedBlockNumber: (await this.api.rpc.chain.getBlock(finalizedBlock)).block.header.number.toNumber(),
        finalizedBlockHash: finalizedBlock.toString(),
        pendingTransactions: pendingExtrinsics.length,
        averageBlockTime: networkConfig.blockTime,
        networkName: networkConfig.displayName,
        tokenSymbol: networkConfig.tokenSymbol,
      };
    } catch (error) {
      throw new KILTError(
        `Failed to get network statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KILTErrorType.NETWORK_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Validates transaction before submission.
   * @param extrinsic - The transaction extrinsic
   * @param signer - The transaction signer
   * @returns A promise that resolves to validation result
   */
  public async validateTransaction(extrinsic: any, signer: KeyringPair): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedFee: string;
    gasEstimate: string;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate API connection
      if (!this.api.isConnected) {
        errors.push('API not connected');
      }

      // Validate signer
      if (!signer || !signer.address) {
        errors.push('Invalid signer');
      }

      // Validate extrinsic
      if (!extrinsic) {
        errors.push('Invalid extrinsic');
      }

      // Estimate gas and fee
      let gasEstimate = '0';
      let estimatedFee = '0';

      try {
        const gasResult = await this.estimateGas(extrinsic, signer);
        gasEstimate = gasResult.gasLimit;
        
        const feeResult = await this.estimateFeeFromExtrinsicV2(extrinsic, gasEstimate);
        estimatedFee = feeResult.amount;
        
        if (!gasResult.success) {
          warnings.push('Gas estimation failed, using default values');
        }
      } catch (error) {
        warnings.push('Failed to estimate gas and fees');
      }

      // Check account balance (if possible)
      try {
        const balance = await this.api.query.system.account(signer.address);
        const freeBalance = (balance as any).data.free.toBn();
        const estimatedFeeBigInt = BigInt(estimatedFee);
        
        if (freeBalance < estimatedFeeBigInt) {
          errors.push('Insufficient balance for transaction fee');
        } else if (freeBalance < estimatedFeeBigInt * BigInt(2)) {
          warnings.push('Low balance, consider adding more funds');
        }
      } catch (error) {
        warnings.push('Could not check account balance');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        estimatedFee,
        gasEstimate,
      };

    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        isValid: false,
        errors,
        warnings,
        estimatedFee: '0',
        gasEstimate: '0',
      };
    }
  }
}
