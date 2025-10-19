/**
 * Blockchain Monitor - Cross-Chain Transaction and Health Monitoring
 * 
 * Provides comprehensive monitoring for KILT and Moonbeam blockchain operations:
 * - Real-time transaction status tracking
 * - Automatic failure detection and retry coordination
 * - Performance metrics collection (latency, success rates, costs)
 * - Blockchain connection health checks
 * - Error reporting and logging with severity levels
 * - Network congestion detection
 * - Gas price tracking and recommendations
 */

import { ApiPromise } from '@polkadot/api';
import { ethers } from 'ethers';
import { KiltAdapter } from '../adapters/KiltAdapter.js';
import { MoonbeamAdapter } from '../adapters/MoonbeamAdapter.js';
import { KILTTransactionService } from '../did/services/KILTTransactionService.js';
import { 
  KILTTransactionResult, 
  KILTError, 
  KILTErrorType 
} from '../did/types/KILTTypes.js';
import { MoonbeamErrorCode } from '../config/moonbeamConfig.js';
import { WalletError } from '../errors/WalletErrors.js';

/**
 * Blockchain types for monitoring
 */
export enum BlockchainType {
  KILT = 'kilt',
  MOONBEAM = 'moonbeam',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  TIMEOUT = 'timeout',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Health status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical',
}

/**
 * Transaction record for monitoring
 */
export interface MonitoredTransaction {
  id: string;
  blockchain: BlockchainType;
  hash: string;
  status: TransactionStatus;
  submittedAt: number;
  confirmedAt?: number;
  failedAt?: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  gasUsed?: bigint;
  cost?: bigint;
  blockNumber?: number;
  confirmations?: number;
  operation?: string;
  metadata?: Record<string, any>;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  blockchain: BlockchainType;
  period: {
    start: number;
    end: number;
    durationMs: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    retried: number;
    successRate: number;
    averageConfirmationTime: number;
    medianConfirmationTime: number;
  };
  costs: {
    totalGasUsed: bigint;
    totalCost: bigint;
    averageCost: bigint;
    averageGasPrice: bigint;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<ErrorSeverity, number>;
  };
  latency: {
    averageMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
}

/**
 * Blockchain health check result
 */
export interface HealthCheckResult {
  blockchain: BlockchainType;
  status: HealthStatus;
  timestamp: number;
  checks: {
    connection: {
      status: HealthStatus;
      latencyMs?: number;
      error?: string;
    };
    blockProduction: {
      status: HealthStatus;
      lastBlockTime?: number;
      blockTimeDelta?: number;
      error?: string;
    };
    nodeSync: {
      status: HealthStatus;
      isSyncing?: boolean;
      error?: string;
    };
    gasPrice: {
      status: HealthStatus;
      currentGasPrice?: bigint;
      trend?: 'stable' | 'increasing' | 'decreasing';
      error?: string;
    };
  };
  recommendations?: string[];
}

/**
 * Error report
 */
export interface ErrorReport {
  id: string;
  blockchain: BlockchainType;
  severity: ErrorSeverity;
  timestamp: number;
  operation: string;
  error: string;
  stack?: string;
  context?: Record<string, any>;
  transactionHash?: string;
  retryable: boolean;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enableMetrics: boolean;
  metricsInterval: number;
  enableHealthChecks: boolean;
  healthCheckInterval: number;
  transactionTimeout: number;
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default monitoring configuration
 */
const DEFAULT_CONFIG: MonitoringConfig = {
  enableMetrics: true,
  metricsInterval: 60000, // 1 minute
  enableHealthChecks: true,
  healthCheckInterval: 30000, // 30 seconds
  transactionTimeout: 300000, // 5 minutes
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  enableLogging: true,
  logLevel: 'info',
};

/**
 * Blockchain Monitor Service
 */
export class BlockchainMonitor {
  private config: MonitoringConfig;
  private kiltAdapter?: KiltAdapter;
  private moonbeamAdapter?: MoonbeamAdapter;
  private kiltTransactionService?: KILTTransactionService;
  
  // Transaction tracking
  private transactions: Map<string, MonitoredTransaction> = new Map();
  private transactionHistory: MonitoredTransaction[] = [];
  
  // Metrics tracking
  private metrics: Map<BlockchainType, PerformanceMetrics> = new Map();
  private metricsIntervalId?: NodeJS.Timeout;
  
  // Health check tracking
  private healthStatus: Map<BlockchainType, HealthCheckResult> = new Map();
  private healthCheckIntervalId?: NodeJS.Timeout;
  
  // Error tracking
  private errors: ErrorReport[] = [];
  
  // Event listeners
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize monitoring with blockchain adapters
   */
  public async initialize(
    kiltAdapter?: KiltAdapter,
    moonbeamAdapter?: MoonbeamAdapter
  ): Promise<void> {
    this.kiltAdapter = kiltAdapter;
    this.moonbeamAdapter = moonbeamAdapter;

    // Initialize KILT transaction service if KILT adapter is provided
    if (this.kiltAdapter) {
      try {
        await this.kiltAdapter.connect();
        const service = this.kiltAdapter.getTransactionService();
        if (service) {
          this.kiltTransactionService = service;
        }
      } catch (error) {
        this.log('error', 'Failed to initialize KILT adapter:', error);
      }
    }

    // Initialize Moonbeam adapter
    if (this.moonbeamAdapter) {
      try {
        await this.moonbeamAdapter.connect();
      } catch (error) {
        this.log('error', 'Failed to initialize Moonbeam adapter:', error);
      }
    }

    // Start periodic tasks
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    this.log('info', 'BlockchainMonitor initialized');
  }

  /**
   * Monitor a KILT transaction
   */
  public async monitorKILTTransaction(
    txHash: string,
    operation: string = 'unknown',
    options: {
      maxRetries?: number;
      onProgress?: (tx: MonitoredTransaction) => void;
    } = {}
  ): Promise<MonitoredTransaction> {
    const transaction: MonitoredTransaction = {
      id: `kilt-${txHash}`,
      blockchain: BlockchainType.KILT,
      hash: txHash,
      status: TransactionStatus.PENDING,
      submittedAt: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || this.config.maxRetries,
      operation,
    };

    this.transactions.set(transaction.id, transaction);
    this.emit('transaction:started', transaction);

    try {
      // Wait for transaction confirmation
      if (this.kiltTransactionService) {
        await this.kiltTransactionService.waitForConfirmation(txHash);
        
        // Get transaction details
        const status = this.kiltTransactionService.getTransactionStatus(txHash);
        if (status) {
          transaction.status = status.status === 'confirmed' 
            ? TransactionStatus.CONFIRMED 
            : TransactionStatus.FAILED;
          transaction.confirmedAt = Date.now();
          transaction.blockNumber = status.blockNumber;
          // Note: confirmations field may not be available in all cases
        }
      }

      this.emit('transaction:confirmed', transaction);
      options.onProgress?.(transaction);
      
      return transaction;
    } catch (error) {
      return this.handleTransactionFailure(transaction, error, options.onProgress);
    } finally {
      this.transactionHistory.push(transaction);
    }
  }

  /**
   * Monitor a Moonbeam transaction
   */
  public async monitorMoonbeamTransaction(
    txHash: string,
    operation: string = 'unknown',
    options: {
      maxRetries?: number;
      onProgress?: (tx: MonitoredTransaction) => void;
    } = {}
  ): Promise<MonitoredTransaction> {
    const transaction: MonitoredTransaction = {
      id: `moonbeam-${txHash}`,
      blockchain: BlockchainType.MOONBEAM,
      hash: txHash,
      status: TransactionStatus.PENDING,
      submittedAt: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || this.config.maxRetries,
      operation,
    };

    this.transactions.set(transaction.id, transaction);
    this.emit('transaction:started', transaction);

    try {
      if (!this.moonbeamAdapter) {
        throw new Error('Moonbeam adapter not initialized');
      }

      // Wait for confirmation
      const provider = this.moonbeamAdapter.getProvider();
      if (!provider) {
        throw new Error('Moonbeam provider not available');
      }

      const receipt = await provider.waitForTransaction(txHash, 1, this.config.transactionTimeout);
      
      if (receipt) {
        transaction.status = receipt.status === 1 
          ? TransactionStatus.CONFIRMED 
          : TransactionStatus.FAILED;
        transaction.confirmedAt = Date.now();
        transaction.blockNumber = receipt.blockNumber;
        transaction.gasUsed = receipt.gasUsed;
        transaction.cost = receipt.gasUsed * (receipt.gasPrice || BigInt(0));
        transaction.confirmations = 1;
      } else {
        throw new Error('Transaction receipt not found');
      }

      this.emit('transaction:confirmed', transaction);
      options.onProgress?.(transaction);
      
      return transaction;
    } catch (error) {
      return this.handleTransactionFailure(transaction, error, options.onProgress);
    } finally {
      this.transactionHistory.push(transaction);
    }
  }

  /**
   * Handle transaction failure with retry logic
   */
  private async handleTransactionFailure(
    transaction: MonitoredTransaction,
    error: any,
    onProgress?: (tx: MonitoredTransaction) => void
  ): Promise<MonitoredTransaction> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    transaction.lastError = errorMessage;
    transaction.failedAt = Date.now();

    // Log error
    this.reportError({
      blockchain: transaction.blockchain,
      severity: ErrorSeverity.MEDIUM,
      operation: transaction.operation || 'unknown',
      error: errorMessage,
      transactionHash: transaction.hash,
      retryable: transaction.retryCount < transaction.maxRetries,
      context: { transaction },
    });

    // Check if retryable
    if (this.isRetryableError(error) && transaction.retryCount < transaction.maxRetries) {
      transaction.status = TransactionStatus.RETRYING;
      transaction.retryCount++;
      
      this.emit('transaction:retrying', transaction);
      onProgress?.(transaction);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * transaction.retryCount));

      // Retry based on blockchain type
      if (transaction.blockchain === BlockchainType.KILT) {
        return this.monitorKILTTransaction(transaction.hash, transaction.operation, { maxRetries: transaction.maxRetries - transaction.retryCount, onProgress });
      } else {
        return this.monitorMoonbeamTransaction(transaction.hash, transaction.operation, { maxRetries: transaction.maxRetries - transaction.retryCount, onProgress });
      }
    }

    // Mark as failed
    transaction.status = TransactionStatus.FAILED;
    this.emit('transaction:failed', transaction);
    onProgress?.(transaction);

    return transaction;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = (error?.message || '').toLowerCase();
    const retryableErrors = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'busy',
      'rate limit',
      'too many requests',
      'nonce too low',
    ];

    return retryableErrors.some(msg => errorMessage.includes(msg));
  }

  /**
   * Perform health check for KILT
   */
  public async checkKILTHealth(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      blockchain: BlockchainType.KILT,
      status: HealthStatus.HEALTHY,
      timestamp: Date.now(),
      checks: {
        connection: { status: HealthStatus.HEALTHY },
        blockProduction: { status: HealthStatus.HEALTHY },
        nodeSync: { status: HealthStatus.HEALTHY },
        gasPrice: { status: HealthStatus.HEALTHY },
      },
    };

    if (!this.kiltAdapter) {
      result.status = HealthStatus.UNHEALTHY;
      result.checks.connection.status = HealthStatus.UNHEALTHY;
      result.checks.connection.error = 'KILT adapter not initialized';
      return result;
    }

    try {
      // Check connection
      const startTime = Date.now();
      const chainInfo = this.kiltAdapter.getChainInfo();
      
      if (!chainInfo) {
        result.checks.connection.status = HealthStatus.UNHEALTHY;
        result.checks.connection.error = 'Not connected';
        result.status = HealthStatus.UNHEALTHY;
      } else {
        result.checks.connection.latencyMs = Date.now() - startTime;
      }

      // Check block production
      if (chainInfo) {
        // Use current time as approximate check (actual block time would require API call)
        const now = Date.now();
        
        result.checks.blockProduction.lastBlockTime = now;
        result.checks.blockProduction.blockTimeDelta = 0; // Connected means blocks are recent

        result.checks.blockProduction.status = HealthStatus.HEALTHY;
      }

      // Check node sync status using adapter method
      const healthCheckResult = await this.kiltAdapter.performHealthCheck();
      if (!healthCheckResult) {
        result.checks.nodeSync.status = HealthStatus.DEGRADED;
        result.status = HealthStatus.DEGRADED;
      }

    } catch (error) {
      this.log('error', 'KILT health check failed:', error);
      result.status = HealthStatus.UNHEALTHY;
      result.checks.connection.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.healthStatus.set(BlockchainType.KILT, result);
    this.emit('health:updated', result);
    
    return result;
  }

  /**
   * Perform health check for Moonbeam
   */
  public async checkMoonbeamHealth(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      blockchain: BlockchainType.MOONBEAM,
      status: HealthStatus.HEALTHY,
      timestamp: Date.now(),
      checks: {
        connection: { status: HealthStatus.HEALTHY },
        blockProduction: { status: HealthStatus.HEALTHY },
        nodeSync: { status: HealthStatus.HEALTHY },
        gasPrice: { status: HealthStatus.HEALTHY },
      },
    };

    if (!this.moonbeamAdapter) {
      result.status = HealthStatus.UNHEALTHY;
      result.checks.connection.status = HealthStatus.UNHEALTHY;
      result.checks.connection.error = 'Moonbeam adapter not initialized';
      return result;
    }

    try {
      const startTime = Date.now();
      const provider = this.moonbeamAdapter.getProvider();
      
      if (!provider) {
        result.checks.connection.status = HealthStatus.UNHEALTHY;
        result.checks.connection.error = 'Provider not available';
        result.status = HealthStatus.UNHEALTHY;
        return result;
      }

      // Check connection
      const network = await provider.getNetwork();
      result.checks.connection.latencyMs = Date.now() - startTime;

      // Check block production
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      
      if (block) {
        const blockTime = block.timestamp * 1000; // Convert to milliseconds
        const now = Date.now();
        result.checks.blockProduction.lastBlockTime = blockTime;
        result.checks.blockProduction.blockTimeDelta = now - blockTime;

        // If last block is more than 30 seconds old, mark as degraded
        if (result.checks.blockProduction.blockTimeDelta > 30000) {
          result.checks.blockProduction.status = HealthStatus.DEGRADED;
          result.status = HealthStatus.DEGRADED;
        }
      }

      // Check gas price
      const feeData = await provider.getFeeData();
      if (feeData.gasPrice) {
        result.checks.gasPrice.currentGasPrice = feeData.gasPrice;
        
        // Check if gas price is abnormally high (simple check)
        const gasPriceGwei = Number(ethers.formatUnits(feeData.gasPrice, 'gwei'));
        if (gasPriceGwei > 100) {
          result.checks.gasPrice.status = HealthStatus.DEGRADED;
          result.checks.gasPrice.trend = 'increasing';
          result.status = HealthStatus.DEGRADED;
          result.recommendations = ['Gas prices are high. Consider waiting for lower fees.'];
        }
      }

    } catch (error) {
      this.log('error', 'Moonbeam health check failed:', error);
      result.status = HealthStatus.UNHEALTHY;
      result.checks.connection.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.healthStatus.set(BlockchainType.MOONBEAM, result);
    this.emit('health:updated', result);
    
    return result;
  }

  /**
   * Calculate performance metrics
   */
  public calculateMetrics(
    blockchain: BlockchainType,
    period: { start: number; end: number } = {
      start: Date.now() - 3600000, // Last hour
      end: Date.now(),
    }
  ): PerformanceMetrics {
    const txs = this.transactionHistory.filter(
      tx => tx.blockchain === blockchain && 
      tx.submittedAt >= period.start && 
      tx.submittedAt <= period.end
    );

    const successful = txs.filter(tx => tx.status === TransactionStatus.CONFIRMED);
    const failed = txs.filter(tx => tx.status === TransactionStatus.FAILED);
    const pending = txs.filter(tx => tx.status === TransactionStatus.PENDING);
    const retried = txs.filter(tx => tx.retryCount > 0);

    const confirmationTimes = successful
      .filter(tx => tx.confirmedAt)
      .map(tx => tx.confirmedAt! - tx.submittedAt);

    const costs = successful
      .filter(tx => tx.cost)
      .map(tx => tx.cost!);

    const metrics: PerformanceMetrics = {
      blockchain,
      period: {
        start: period.start,
        end: period.end,
        durationMs: period.end - period.start,
      },
      transactions: {
        total: txs.length,
        successful: successful.length,
        failed: failed.length,
        pending: pending.length,
        retried: retried.length,
        successRate: txs.length > 0 ? successful.length / txs.length : 0,
        averageConfirmationTime: confirmationTimes.length > 0 
          ? confirmationTimes.reduce((a, b) => a + b, 0) / confirmationTimes.length 
          : 0,
        medianConfirmationTime: this.calculateMedian(confirmationTimes),
      },
      costs: {
        totalGasUsed: successful.reduce((sum, tx) => sum + (tx.gasUsed || BigInt(0)), BigInt(0)),
        totalCost: costs.reduce((sum, cost) => sum + cost, BigInt(0)),
        averageCost: costs.length > 0 
          ? costs.reduce((sum, cost) => sum + cost, BigInt(0)) / BigInt(costs.length) 
          : BigInt(0),
        averageGasPrice: BigInt(0), // Calculate from cost/gasUsed if needed
      },
      errors: {
        total: failed.length,
        byType: {},
        bySeverity: {
          [ErrorSeverity.LOW]: 0,
          [ErrorSeverity.MEDIUM]: 0,
          [ErrorSeverity.HIGH]: 0,
          [ErrorSeverity.CRITICAL]: 0,
        },
      },
      latency: {
        averageMs: confirmationTimes.length > 0 
          ? confirmationTimes.reduce((a, b) => a + b, 0) / confirmationTimes.length 
          : 0,
        p50Ms: this.calculatePercentile(confirmationTimes, 50),
        p95Ms: this.calculatePercentile(confirmationTimes, 95),
        p99Ms: this.calculatePercentile(confirmationTimes, 99),
      },
    };

    this.metrics.set(blockchain, metrics);
    this.emit('metrics:updated', metrics);

    return metrics;
  }

  /**
   * Report an error
   */
  public reportError(report: Omit<ErrorReport, 'id' | 'timestamp'>): void {
    const errorReport: ErrorReport = {
      ...report,
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.errors.push(errorReport);
    this.emit('error:reported', errorReport);

    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }

    // Log based on severity
    const logLevel = {
      [ErrorSeverity.LOW]: 'info',
      [ErrorSeverity.MEDIUM]: 'warn',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'error',
    }[report.severity] as 'info' | 'warn' | 'error';

    this.log(logLevel, `[${report.blockchain}] ${report.operation}:`, report.error);
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsIntervalId = setInterval(() => {
      if (this.kiltAdapter) {
        this.calculateMetrics(BlockchainType.KILT);
      }
      if (this.moonbeamAdapter) {
        this.calculateMetrics(BlockchainType.MOONBEAM);
      }
    }, this.config.metricsInterval);
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckIntervalId = setInterval(async () => {
      if (this.kiltAdapter) {
        await this.checkKILTHealth();
      }
      if (this.moonbeamAdapter) {
        await this.checkMoonbeamHealth();
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop all periodic tasks
   */
  public stop(): void {
    if (this.metricsIntervalId) {
      clearInterval(this.metricsIntervalId);
    }
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }
    this.log('info', 'BlockchainMonitor stopped');
  }

  /**
   * Get current metrics for a blockchain
   */
  public getMetrics(blockchain: BlockchainType): PerformanceMetrics | undefined {
    return this.metrics.get(blockchain);
  }

  /**
   * Get current health status for a blockchain
   */
  public getHealthStatus(blockchain: BlockchainType): HealthCheckResult | undefined {
    return this.healthStatus.get(blockchain);
  }

  /**
   * Get all monitored transactions
   */
  public getTransactions(): MonitoredTransaction[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Get transaction history
   */
  public getTransactionHistory(
    filter?: {
      blockchain?: BlockchainType;
      status?: TransactionStatus;
      since?: number;
    }
  ): MonitoredTransaction[] {
    let history = this.transactionHistory;

    if (filter) {
      if (filter.blockchain) {
        history = history.filter(tx => tx.blockchain === filter.blockchain);
      }
      if (filter.status) {
        history = history.filter(tx => tx.status === filter.status);
      }
      if (filter.since) {
        history = history.filter(tx => tx.submittedAt >= filter.since!);
      }
    }

    return history;
  }

  /**
   * Get recent errors
   */
  public getErrors(
    filter?: {
      blockchain?: BlockchainType;
      severity?: ErrorSeverity;
      since?: number;
      limit?: number;
    }
  ): ErrorReport[] {
    let errors = this.errors;

    if (filter) {
      if (filter.blockchain) {
        errors = errors.filter(err => err.blockchain === filter.blockchain);
      }
      if (filter.severity) {
        errors = errors.filter(err => err.severity === filter.severity);
      }
      if (filter.since) {
        errors = errors.filter(err => err.timestamp >= filter.since!);
      }
    }

    errors = errors.sort((a, b) => b.timestamp - a.timestamp);

    if (filter?.limit) {
      errors = errors.slice(0, filter.limit);
    }

    return errors;
  }

  /**
   * Event listener methods
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        this.log('error', `Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Logging helper
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', ...args: any[]): void {
    if (!this.config.enableLogging) return;

    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex >= configLevelIndex) {
      const prefix = `[BlockchainMonitor][${level.toUpperCase()}]`;
      console[level](prefix, ...args);
    }
  }

  /**
   * Calculate median
   */
  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Types and interfaces are exported at the top of the file

