// BlockchainMonitor for React boilerplate
import { MoonbeamAdapter } from '../adapters/MoonbeamAdapter';

export enum BlockchainType {
  MOONBEAM = 'moonbeam'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

export interface MonitoredTransaction {
  id: string;
  blockchain: BlockchainType;
  hash: string;
  status: TransactionStatus;
  submittedAt: number;
  confirmedAt?: number;
  blockNumber?: number;
  gasUsed?: bigint;
  cost?: bigint;
  confirmations?: number;
  retryCount: number;
  maxRetries: number;
  operation: string;
}

export interface BlockchainMetrics {
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  };
  performance: {
    averageLatency: number;
    averageGasUsed: number;
    averageCost: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: number;
  };
}

export interface BlockchainMonitorConfig {
  moonbeamAdapter?: MoonbeamAdapter;
  maxRetries?: number;
  retryDelay?: number;
}

export class BlockchainMonitor {
  private config: BlockchainMonitorConfig;
  private transactions: Map<string, MonitoredTransaction> = new Map();
  private transactionHistory: MonitoredTransaction[] = [];
  private metrics: Map<BlockchainType, BlockchainMetrics> = new Map();

  constructor(config: BlockchainMonitorConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  async monitorMoonbeamTransaction(
    txHash: string,
    operation: string = 'SBT Minting',
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
      maxRetries: options.maxRetries || this.config.maxRetries!,
      operation,
    };

    this.transactions.set(transaction.id, transaction);

    // Simulate successful transaction for testing
    setTimeout(() => {
      transaction.status = TransactionStatus.CONFIRMED;
      transaction.confirmedAt = Date.now();
      transaction.blockNumber = 14000000 + Math.floor(Math.random() * 1000);
      transaction.gasUsed = BigInt(150000);
      transaction.cost = BigInt(150000 * 1000000000); // 150k gas * 1 gwei
      transaction.confirmations = 1;
      
      this.updateMetrics(BlockchainType.MOONBEAM);
      options.onProgress?.(transaction);
    }, 2000);

    this.transactionHistory.push(transaction);
    return transaction;
  }

  async monitorMoonbeamDIDTransaction(
    txHash: string,
    operation: string = 'DID Registration',
    options: {
      maxRetries?: number;
      onProgress?: (tx: MonitoredTransaction) => void;
    } = {}
  ): Promise<MonitoredTransaction> {
    return this.monitorMoonbeamTransaction(txHash, operation, options);
  }

  getMetrics(blockchain: BlockchainType): BlockchainMetrics {
    return this.metrics.get(blockchain) || {
      transactions: { total: 0, successful: 0, failed: 0, pending: 0 },
      performance: { averageLatency: 0, averageGasUsed: 0, averageCost: 0 },
      health: { status: 'healthy', lastCheck: Date.now() }
    };
  }

  private updateMetrics(blockchain: BlockchainType): void {
    const transactions = Array.from(this.transactions.values())
      .filter(tx => tx.blockchain === blockchain);

    const successful = transactions.filter(tx => tx.status === TransactionStatus.CONFIRMED);
    const failed = transactions.filter(tx => tx.status === TransactionStatus.FAILED);
    const pending = transactions.filter(tx => tx.status === TransactionStatus.PENDING);

    const metrics: BlockchainMetrics = {
      transactions: {
        total: transactions.length,
        successful: successful.length,
        failed: failed.length,
        pending: pending.length
      },
      performance: {
        averageLatency: successful.reduce((sum, tx) => 
          sum + (tx.confirmedAt! - tx.submittedAt), 0) / successful.length || 0,
        averageGasUsed: successful.reduce((sum, tx) => 
          sum + Number(tx.gasUsed || 0), 0) / successful.length || 0,
        averageCost: successful.reduce((sum, tx) => 
          sum + Number(tx.cost || 0), 0) / successful.length || 0
      },
      health: {
        status: failed.length > successful.length ? 'unhealthy' : 'healthy',
        lastCheck: Date.now()
      }
    };

    this.metrics.set(blockchain, metrics);
  }
}