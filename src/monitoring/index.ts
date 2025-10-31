/**
 * Blockchain Monitoring Module
 * 
 * Exports:
 * - BlockchainMonitor: Main monitoring service
 * - Types and interfaces for monitoring
 */

export { 
  BlockchainMonitor,
  BlockchainType,
  TransactionStatus,
  ErrorSeverity,
  HealthStatus,
} from './BlockchainMonitor.js';

export type { 
  MonitoringConfig,
  MonitoredTransaction,
  PerformanceMetrics,
  HealthCheckResult,
  ErrorReport,
} from './BlockchainMonitor.js';

