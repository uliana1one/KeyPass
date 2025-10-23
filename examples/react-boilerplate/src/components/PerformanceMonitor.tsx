import React, { useState, useEffect } from 'react';
import { usePerformanceMetrics, PerformanceStats } from '../hooks/usePerformanceMetrics';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  const {
    metrics,
    isTracking,
    startTracking,
    stopTracking,
    getStats,
    getOperationStats,
    clearMetrics,
    exportMetrics,
  } = usePerformanceMetrics();

  const [stats, setStats] = useState<PerformanceStats>({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageDuration: 0,
    minDuration: 0,
    maxDuration: 0,
    successRate: 0,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);

  // Update stats when metrics change
  useEffect(() => {
    setStats(getStats());
  }, [metrics, getStats]);

  // Auto-refresh stats
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setStats(getStats());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, getStats]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 0.9) return '#10b981'; // green
    if (rate >= 0.7) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getDurationColor = (duration: number): string => {
    if (duration < 1000) return '#10b981'; // green
    if (duration < 5000) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const uniqueOperations = Array.from(new Set(metrics.map(m => m.operation)));

  const handleExport = () => {
    const data = exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`performance-monitor ${className}`}>
      <div className="monitor-header">
        <div className="monitor-title">
          <h3>Performance Monitor</h3>
          <div className="tracking-status">
            <div className={`status-indicator ${isTracking ? 'active' : 'inactive'}`} />
            <span>{isTracking ? 'Tracking' : 'Stopped'}</span>
          </div>
        </div>
        
        <div className="monitor-controls">
          <button
            className="control-button"
            onClick={isTracking ? stopTracking : startTracking}
          >
            {isTracking ? 'Stop' : 'Start'}
          </button>
          <button
            className="control-button"
            onClick={clearMetrics}
            disabled={metrics.length === 0}
          >
            Clear
          </button>
          <button
            className="control-button"
            onClick={handleExport}
            disabled={metrics.length === 0}
          >
            Export
          </button>
          <button
            className="control-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div className="monitor-stats">
        <div className="stat-card">
          <div className="stat-label">Total Operations</div>
          <div className="stat-value">{stats.totalOperations}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Success Rate</div>
          <div 
            className="stat-value"
            style={{ color: getSuccessRateColor(stats.successRate) }}
          >
            {formatPercentage(stats.successRate)}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Avg Duration</div>
          <div 
            className="stat-value"
            style={{ color: getDurationColor(stats.averageDuration) }}
          >
            {formatDuration(stats.averageDuration)}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value">{stats.failedOperations}</div>
        </div>
      </div>

      {isExpanded && (
        <div className="monitor-details">
          <div className="operations-list">
            <h4>Operations</h4>
            <div className="operations-grid">
              {uniqueOperations.map(operation => {
                const operationStats = getOperationStats(operation);
                return (
                  <div
                    key={operation}
                    className={`operation-card ${selectedOperation === operation ? 'selected' : ''}`}
                    onClick={() => setSelectedOperation(
                      selectedOperation === operation ? null : operation
                    )}
                  >
                    <div className="operation-name">{operation}</div>
                    <div className="operation-stats">
                      <span className="operation-count">{operationStats.totalOperations}</span>
                      <span 
                        className="operation-success-rate"
                        style={{ color: getSuccessRateColor(operationStats.successRate) }}
                      >
                        {formatPercentage(operationStats.successRate)}
                      </span>
                      <span 
                        className="operation-duration"
                        style={{ color: getDurationColor(operationStats.averageDuration) }}
                      >
                        {formatDuration(operationStats.averageDuration)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedOperation && (
            <div className="operation-details">
              <h4>{selectedOperation} Details</h4>
              <div className="details-stats">
                <div className="detail-item">
                  <span className="detail-label">Total:</span>
                  <span className="detail-value">{getOperationStats(selectedOperation).totalOperations}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Successful:</span>
                  <span className="detail-value">{getOperationStats(selectedOperation).successfulOperations}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Failed:</span>
                  <span className="detail-value">{getOperationStats(selectedOperation).failedOperations}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Min Duration:</span>
                  <span className="detail-value">{formatDuration(getOperationStats(selectedOperation).minDuration)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Max Duration:</span>
                  <span className="detail-value">{formatDuration(getOperationStats(selectedOperation).maxDuration)}</span>
                </div>
              </div>
            </div>
          )}

          {showDetails && (
            <div className="recent-metrics">
              <h4>Recent Operations</h4>
              <div className="metrics-list">
                {metrics.slice(-10).reverse().map((metric, index) => (
                  <div key={index} className={`metric-item ${metric.success ? 'success' : 'error'}`}>
                    <div className="metric-operation">{metric.operation}</div>
                    <div className="metric-duration">
                      {metric.duration ? formatDuration(metric.duration) : 'In progress'}
                    </div>
                    <div className="metric-status">
                      {metric.success ? '✓' : '✗'}
                    </div>
                    {metric.error && (
                      <div className="metric-error">{metric.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
