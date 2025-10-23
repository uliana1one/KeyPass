# 📊 Performance Monitoring Guide

This guide explains how to monitor and optimize performance in the KeyPass React Boilerplate with Moonbeam integration.

## 🎯 Overview

The KeyPass system provides comprehensive performance monitoring for:
- **Transaction performance** (latency, success rates)
- **Gas usage** (efficiency, cost optimization)
- **Network performance** (connection speed, reliability)
- **User experience** (loading times, responsiveness)
- **Error rates** (failure analysis, recovery)

## 🔧 Performance Components

### 1. PerformanceMonitor Component

The `PerformanceMonitor` component provides real-time performance metrics:

```typescript
import { PerformanceMonitor } from './components/PerformanceMonitor';

<PerformanceMonitor
  showDetails={true}
  autoRefresh={true}
  refreshInterval={5000}
/>
```

**Features:**
- Real-time performance metrics
- Operation-specific statistics
- Success rate tracking
- Duration analysis
- Export functionality

### 2. usePerformanceMetrics Hook

The `usePerformanceMetrics` hook provides performance tracking:

```typescript
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';

const {
  trackOperation,
  getStats,
  getOperationStats,
  exportMetrics
} = usePerformanceMetrics();
```

## 📊 Performance Metrics

### Transaction Metrics

**Key Metrics:**
- **Total Operations**: Number of operations performed
- **Success Rate**: Percentage of successful operations
- **Average Duration**: Mean time for operations
- **Min/Max Duration**: Range of operation times
- **Failed Operations**: Number of failed operations

**Example:**
```typescript
const stats = getStats();
console.log('Overall stats:', {
  totalOperations: stats.totalOperations,
  successRate: stats.successRate,
  averageDuration: stats.averageDuration
});
```

### Operation-Specific Metrics

**Track specific operations:**
```typescript
const sbtStats = getOperationStats('sbt-minting');
console.log('SBT minting stats:', {
  totalMints: sbtStats.totalOperations,
  successRate: sbtStats.successRate,
  averageTime: sbtStats.averageDuration
});
```

## 🚀 Performance Tracking

### Basic Operation Tracking

```typescript
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';

const { trackOperation } = usePerformanceMetrics();

const result = await trackOperation(
  'did-registration',
  'DID Registration',
  async () => {
    return await didProvider.createDid(walletAddress);
  }
);
```

### Advanced Operation Tracking

```typescript
const result = await trackOperation(
  'sbt-minting',
  'SBT Minting',
  async () => {
    return await mintingService.mintSBT(params);
  },
  {
    recipient: walletAddress,
    contractAddress: contractAddress,
    gasLimit: estimatedGas
  }
);
```

### Manual Performance Tracking

```typescript
const { startOperation, endOperation } = usePerformanceMetrics();

// Start tracking
startOperation('custom-operation', 'Custom Operation', { param1: 'value1' });

try {
  // Your operation here
  const result = await performOperation();
  
  // End with success
  endOperation('custom-operation', true);
  return result;
} catch (error) {
  // End with failure
  endOperation('custom-operation', false, error.message);
  throw error;
}
```

## 📈 Performance Optimization

### Gas Optimization

**Monitor gas usage:**
```typescript
const gasStats = getOperationStats('gas-estimation');
console.log('Gas efficiency:', {
  averageGas: gasStats.averageDuration,
  minGas: gasStats.minDuration,
  maxGas: gasStats.maxDuration
});
```

**Optimize gas limits:**
```typescript
const optimizeGasLimit = (baseGasLimit, operationStats) => {
  const averageGas = operationStats.averageDuration;
  const maxGas = operationStats.maxDuration;
  
  // Use 110% of average or 120% of max, whichever is higher
  return Math.max(averageGas * 1.1, maxGas * 1.2);
};
```

### Network Optimization

**Monitor network performance:**
```typescript
const networkStats = getOperationStats('network-connection');
console.log('Network performance:', {
  averageLatency: networkStats.averageDuration,
  successRate: networkStats.successRate
});
```

**Implement connection pooling:**
```typescript
class ConnectionPool {
  private connections: Map<string, any> = new Map();
  
  async getConnection(url: string) {
    if (!this.connections.has(url)) {
      const connection = await createConnection(url);
      this.connections.set(url, connection);
    }
    return this.connections.get(url);
  }
}
```

### Transaction Batching

**Batch multiple operations:**
```typescript
const batchOperations = async (operations) => {
  const startTime = Date.now();
  const results = [];
  
  for (const operation of operations) {
    try {
      const result = await trackOperation(
        'batch-operation',
        'Batch Operation',
        operation.fn,
        operation.metadata
      );
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error });
    }
  }
  
  const totalDuration = Date.now() - startTime;
  return { results, totalDuration };
};
```

## 🔍 Performance Analysis

### Real-Time Monitoring

```typescript
import { PerformanceMonitor } from './components/PerformanceMonitor';

const App = () => {
  const [showMonitor, setShowMonitor] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowMonitor(!showMonitor)}>
        {showMonitor ? 'Hide' : 'Show'} Performance Monitor
      </button>
      
      {showMonitor && (
        <PerformanceMonitor
          showDetails={true}
          autoRefresh={true}
          refreshInterval={2000}
        />
      )}
    </div>
  );
};
```

### Performance Alerts

```typescript
const { getStats } = usePerformanceMetrics();

useEffect(() => {
  const checkPerformance = () => {
    const stats = getStats();
    
    // Alert if success rate drops below 90%
    if (stats.successRate < 0.9) {
      console.warn('Low success rate detected:', stats.successRate);
    }
    
    // Alert if average duration exceeds 10 seconds
    if (stats.averageDuration > 10000) {
      console.warn('Slow operations detected:', stats.averageDuration);
    }
  };
  
  const interval = setInterval(checkPerformance, 30000);
  return () => clearInterval(interval);
}, []);
```

### Performance Reporting

```typescript
const generatePerformanceReport = () => {
  const metrics = exportMetrics();
  const report = {
    timestamp: new Date().toISOString(),
    overall: metrics.stats,
    operations: {},
    recommendations: []
  };
  
  // Add operation-specific stats
  const operations = ['did-registration', 'sbt-minting', 'gas-estimation'];
  operations.forEach(op => {
    report.operations[op] = getOperationStats(op);
  });
  
  // Add recommendations
  if (metrics.stats.successRate < 0.95) {
    report.recommendations.push('Consider implementing retry logic');
  }
  
  if (metrics.stats.averageDuration > 5000) {
    report.recommendations.push('Consider optimizing gas limits');
  }
  
  return report;
};
```

## 🛠️ Performance Tools

### Performance Dashboard

```typescript
const PerformanceDashboard = () => {
  const { getStats, getOperationStats } = usePerformanceMetrics();
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const updateStats = () => {
      setStats({
        overall: getStats(),
        operations: {
          'did-registration': getOperationStats('did-registration'),
          'sbt-minting': getOperationStats('sbt-minting'),
          'gas-estimation': getOperationStats('gas-estimation')
        }
      });
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);
  
  if (!stats) return <div>Loading...</div>;
  
  return (
    <div className="performance-dashboard">
      <h2>Performance Dashboard</h2>
      
      <div className="overall-stats">
        <h3>Overall Performance</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-label">Total Operations:</span>
            <span className="stat-value">{stats.overall.totalOperations}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Success Rate:</span>
            <span className="stat-value">{(stats.overall.successRate * 100).toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Duration:</span>
            <span className="stat-value">{stats.overall.averageDuration.toFixed(0)}ms</span>
          </div>
        </div>
      </div>
      
      <div className="operation-stats">
        <h3>Operation Performance</h3>
        {Object.entries(stats.operations).map(([operation, opStats]) => (
          <div key={operation} className="operation-card">
            <h4>{operation}</h4>
            <div className="op-stats">
              <span>Total: {opStats.totalOperations}</span>
              <span>Success: {(opStats.successRate * 100).toFixed(1)}%</span>
              <span>Avg Time: {opStats.averageDuration.toFixed(0)}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Performance Testing

```typescript
const performanceTest = async () => {
  const { trackOperation, getStats } = usePerformanceMetrics();
  const testResults = [];
  
  // Test DID registration performance
  for (let i = 0; i < 10; i++) {
    const result = await trackOperation(
      'performance-test',
      'Performance Test',
      async () => {
        // Simulate DID registration
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
        return { success: true };
      }
    );
    testResults.push(result);
  }
  
  const stats = getStats();
  console.log('Performance test results:', stats);
  
  return {
    testResults,
    stats,
    recommendations: generateRecommendations(stats)
  };
};
```

## 📋 Performance Checklist

### Before Production

- [ ] Performance monitoring is enabled
- [ ] Gas limits are optimized
- [ ] Network connections are pooled
- [ ] Error rates are monitored
- [ ] Performance alerts are configured
- [ ] Performance reports are generated
- [ ] Load testing is performed
- [ ] Performance baselines are established

### Performance Best Practices

1. **Monitor continuously** - Track performance in real-time
2. **Set performance budgets** - Define acceptable limits
3. **Optimize gas usage** - Minimize transaction costs
4. **Implement caching** - Reduce redundant operations
5. **Use connection pooling** - Reuse network connections
6. **Batch operations** - Group related transactions
7. **Monitor error rates** - Track and analyze failures
8. **Test under load** - Verify performance under stress

## 🚀 Performance Examples

### Complete Performance Monitoring Example

```typescript
import React, { useState, useEffect } from 'react';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';
import { PerformanceMonitor } from './components/PerformanceMonitor';

const PerformanceExample = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  
  const {
    trackOperation,
    getStats,
    getOperationStats,
    exportMetrics,
    startTracking,
    stopTracking
  } = usePerformanceMetrics();

  const runPerformanceTest = async () => {
    setIsRunning(true);
    startTracking();
    
    try {
      // Test DID registration
      const didResult = await trackOperation(
        'did-registration',
        'DID Registration',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { did: 'did:moonbeam:test123' };
        }
      );
      
      // Test SBT minting
      const sbtResult = await trackOperation(
        'sbt-minting',
        'SBT Minting',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { tokenId: '123' };
        }
      );
      
      // Test gas estimation
      const gasResult = await trackOperation(
        'gas-estimation',
        'Gas Estimation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return { gasLimit: 21000 };
        }
      );
      
      setResults({
        did: didResult,
        sbt: sbtResult,
        gas: gasResult,
        stats: getStats()
      });
      
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsRunning(false);
      stopTracking();
    }
  };

  const generateReport = () => {
    const metrics = exportMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      overall: metrics.stats,
      operations: {
        'did-registration': getOperationStats('did-registration'),
        'sbt-minting': getOperationStats('sbt-minting'),
        'gas-estimation': getOperationStats('gas-estimation')
      }
    };
    
    console.log('Performance Report:', report);
    return report;
  };

  return (
    <div>
      <h2>Performance Monitoring Example</h2>
      
      <div className="controls">
        <button onClick={runPerformanceTest} disabled={isRunning}>
          {isRunning ? 'Running Test...' : 'Run Performance Test'}
        </button>
        <button onClick={generateReport}>
          Generate Report
        </button>
      </div>
      
      {results && (
        <div className="results">
          <h3>Test Results</h3>
          <div className="result-stats">
            <p>Total Operations: {results.stats.totalOperations}</p>
            <p>Success Rate: {(results.stats.successRate * 100).toFixed(1)}%</p>
            <p>Average Duration: {results.stats.averageDuration.toFixed(0)}ms</p>
          </div>
        </div>
      )}
      
      <PerformanceMonitor
        showDetails={true}
        autoRefresh={true}
        refreshInterval={3000}
      />
    </div>
  );
};
```

## 📚 Additional Resources

- [Moonbeam Performance Guide](https://docs.moonbeam.network/builders/get-started/)
- [Ethers.js Performance Tips](https://docs.ethers.io/v5/api/utils/logger/)
- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)
- [Web Performance Best Practices](https://web.dev/performance/)

## 🤝 Support

If you need help with performance monitoring:

1. Check the performance metrics in the browser console
2. Review the performance examples in this guide
3. Use the PerformanceMonitor component for real-time insights
4. Open an issue on GitHub with performance data
