import { useState, useCallback, useRef, useEffect } from 'react';

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
}

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const activeOperations = useRef<Map<string, PerformanceMetrics>>(new Map());

  const startTracking = useCallback(() => {
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  const startOperation = useCallback((
    operationId: string,
    operation: string,
    metadata?: Record<string, any>
  ) => {
    if (!isTracking) return;

    const metric: PerformanceMetrics = {
      operation,
      startTime: Date.now(),
      success: false,
      metadata,
    };

    activeOperations.current.set(operationId, metric);
  }, [isTracking]);

  const endOperation = useCallback((
    operationId: string,
    success: boolean,
    error?: string
  ) => {
    if (!isTracking) return;

    const metric = activeOperations.current.get(operationId);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      success,
      error,
    };

    setMetrics(prev => [...prev, completedMetric]);
    activeOperations.current.delete(operationId);
  }, [isTracking]);

  const trackOperation = useCallback(async <T>(
    operationId: string,
    operation: string,
    operationFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    startOperation(operationId, operation, metadata);

    try {
      const result = await operationFn();
      endOperation(operationId, true);
      return result;
    } catch (error) {
      endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [startOperation, endOperation]);

  const getStats = useCallback((): PerformanceStats => {
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
      };
    }

    const durations = completedMetrics.map(m => m.duration!);
    const successful = completedMetrics.filter(m => m.success);
    const failed = completedMetrics.filter(m => !m.success);

    return {
      totalOperations: completedMetrics.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successful.length / completedMetrics.length,
    };
  }, [metrics]);

  const getOperationStats = useCallback((operation: string): PerformanceStats => {
    const operationMetrics = metrics.filter(m => m.operation === operation && m.duration !== undefined);
    
    if (operationMetrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
      };
    }

    const durations = operationMetrics.map(m => m.duration!);
    const successful = operationMetrics.filter(m => m.success);
    const failed = operationMetrics.filter(m => !m.success);

    return {
      totalOperations: operationMetrics.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successful.length / operationMetrics.length,
    };
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    activeOperations.current.clear();
  }, []);

  const exportMetrics = useCallback(() => {
    const stats = getStats();
    return {
      metrics,
      stats,
      timestamp: new Date().toISOString(),
    };
  }, [metrics, getStats]);

  // Auto-clear old metrics (keep last 100)
  useEffect(() => {
    if (metrics.length > 100) {
      setMetrics(prev => prev.slice(-100));
    }
  }, [metrics]);

  return {
    metrics,
    isTracking,
    startTracking,
    stopTracking,
    startOperation,
    endOperation,
    trackOperation,
    getStats,
    getOperationStats,
    clearMetrics,
    exportMetrics,
  };
};
