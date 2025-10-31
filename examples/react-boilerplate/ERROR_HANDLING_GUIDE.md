# 🚨 Error Handling Guide

This guide explains how to handle errors effectively in the KeyPass React Boilerplate with Moonbeam integration.

## 🎯 Overview

The KeyPass system provides comprehensive error handling for:
- **Network errors** (connection failures, timeouts)
- **Transaction errors** (gas estimation, execution failures)
- **Contract errors** (invalid calls, insufficient permissions)
- **User errors** (insufficient balance, rejected transactions)
- **Validation errors** (invalid parameters, format issues)

## 🔧 Error Handling Components

### 1. ErrorBoundary Component

The `ErrorBoundary` component catches React errors and displays a fallback UI:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches JavaScript errors anywhere in the component tree
- Displays fallback UI instead of crashing
- Logs errors for debugging
- Provides retry functionality

### 2. ErrorDisplay Component

The `ErrorDisplay` component shows user-friendly error messages:

```typescript
import { ErrorDisplay } from './components/ErrorDisplay';

<ErrorDisplay
  error={error}
  onRetry={() => retry()}
  onDismiss={() => clearError()}
/>
```

**Features:**
- User-friendly error messages
- Retry buttons for recoverable errors
- Dismiss functionality
- Error categorization (network, transaction, user)

### 3. useErrorHandling Hook

The `useErrorHandling` hook provides centralized error management:

```typescript
import { useErrorHandling } from './hooks/useErrorHandling';

const {
  errorState,
  handleError,
  clearError,
  retry,
  isRetryable,
  getErrorMessage
} = useErrorHandling();
```

## 🚨 Error Types and Handling

### Network Errors

**Common Network Errors:**
- `NETWORK_ERROR`: Connection failed
- `CONNECTION_FAILED`: Cannot connect to RPC
- `TIMEOUT`: Request timed out
- `RPC_ERROR`: RPC endpoint error

**Handling:**
```typescript
try {
  await moonbeamAdapter.connect();
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    handleError(error, {
      showToast: true,
      retryable: true,
      maxRetries: 3
    });
  }
}
```

### Transaction Errors

**Common Transaction Errors:**
- `GAS_ESTIMATION_FAILED`: Cannot estimate gas
- `TRANSACTION_FAILED`: Transaction execution failed
- `TRANSACTION_TIMEOUT`: Transaction confirmation timeout
- `REPLACEMENT_FEE_TOO_LOW`: Gas price too low

**Handling:**
```typescript
try {
  const tx = await mintingService.mintSBT(params);
} catch (error) {
  if (error.code === 'GAS_ESTIMATION_FAILED') {
    // Try with higher gas limit
    const retryParams = { ...params, gasLimit: params.gasLimit * 1.2 };
    await retry(() => mintingService.mintSBT(retryParams));
  }
}
```

### Contract Errors

**Common Contract Errors:**
- `CONTRACT_CALL_FAILED`: Contract method failed
- `INVALID_CALL_DATA`: Invalid function call
- `CONTRACT_NOT_FOUND`: Contract address not found
- `INSUFFICIENT_PERMISSIONS`: Not authorized to call function

**Handling:**
```typescript
try {
  await contract.mint(recipient, tokenId);
} catch (error) {
  if (error.code === 'CONTRACT_CALL_FAILED') {
    // Check if contract is deployed and accessible
    const isDeployed = await contract.isDeployed();
    if (!isDeployed) {
      handleError(new Error('Contract not deployed'), {
        showToast: true,
        retryable: false
      });
    }
  }
}
```

### User Errors

**Common User Errors:**
- `INSUFFICIENT_BALANCE`: Not enough tokens for transaction
- `USER_REJECTED`: User rejected transaction
- `INVALID_ADDRESS`: Invalid wallet address
- `WALLET_NOT_CONNECTED`: Wallet not connected

**Handling:**
```typescript
try {
  await mintingService.mintSBT(params);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    // Show balance error with faucet link
    handleError(error, {
      showToast: true,
      retryable: false,
      customMessage: 'Insufficient balance. Get DEV tokens from the faucet.'
    });
  } else if (error.code === 'USER_REJECTED') {
    // Don't show error for user rejection
    handleError(error, {
      showToast: false,
      logToConsole: true
    });
  }
}
```

## 🔄 Retry Logic

### Automatic Retry

```typescript
const { retry } = useErrorHandling();

// Retry with exponential backoff
await retry(
  async () => {
    return await moonbeamAdapter.connect();
  },
  {
    maxRetries: 3,
    retryable: true
  }
);
```

### Manual Retry

```typescript
const { isRetryable, handleError } = useErrorHandling();

try {
  await operation();
} catch (error) {
  if (isRetryable(error)) {
    // Show retry button to user
    setShowRetryButton(true);
  } else {
    // Show error without retry option
    handleError(error, { retryable: false });
  }
}
```

## 📊 Error Monitoring

### Error Tracking

```typescript
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';

const { trackOperation } = usePerformanceMetrics();

const result = await trackOperation(
  'sbt-minting',
  'SBT Minting',
  async () => {
    return await mintingService.mintSBT(params);
  }
);

// Errors are automatically tracked in performance metrics
```

### Error Reporting

```typescript
const { exportMetrics } = usePerformanceMetrics();

// Export error metrics for analysis
const metrics = exportMetrics();
console.log('Error metrics:', metrics.stats.failedOperations);
```

## 🛠️ Custom Error Handling

### Custom Error Messages

```typescript
const getCustomErrorMessage = (error) => {
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      return 'You need more DEV tokens to complete this transaction. Visit the Moonbeam faucet to get testnet tokens.';
    case 'NETWORK_ERROR':
      return 'Unable to connect to Moonbeam network. Please check your internet connection and try again.';
    case 'CONTRACT_CALL_FAILED':
      return 'The smart contract call failed. This might be due to network congestion or invalid parameters.';
    default:
      return error.message;
  }
};
```

### Error Recovery Strategies

```typescript
const handleErrorWithRecovery = async (error, operation) => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await operation();
      
    case 'GAS_ESTIMATION_FAILED':
      // Increase gas limit and retry
      const newParams = { ...operation.params, gasLimit: operation.params.gasLimit * 1.5 };
      return await operation(newParams);
      
    case 'INSUFFICIENT_BALANCE':
      // Show faucet link
      showFaucetLink();
      return null;
      
    default:
      throw error;
  }
};
```

## 🧪 Testing Error Handling

### Error Simulation

```typescript
// Simulate network error
const simulateNetworkError = () => {
  throw new Error('Network connection failed');
};

// Simulate insufficient balance
const simulateInsufficientBalance = () => {
  const error = new Error('Insufficient balance');
  error.code = 'INSUFFICIENT_BALANCE';
  throw error;
};
```

### Error Boundary Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('ErrorBoundary catches errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
});
```

## 📋 Error Handling Checklist

### Before Production

- [ ] All network errors have retry logic
- [ ] User errors show helpful messages
- [ ] Transaction errors have recovery strategies
- [ ] Error boundaries wrap all components
- [ ] Error metrics are being tracked
- [ ] Custom error messages are user-friendly
- [ ] Error logging is configured
- [ ] Error recovery is tested

### Error Handling Best Practices

1. **Always wrap async operations** in try-catch blocks
2. **Provide meaningful error messages** to users
3. **Implement retry logic** for transient errors
4. **Log errors** for debugging purposes
5. **Use error boundaries** to prevent crashes
6. **Test error scenarios** thoroughly
7. **Monitor error rates** in production
8. **Have fallback UI** for critical failures

## 🚀 Error Handling Examples

### Complete Error Handling Example

```typescript
import React, { useState } from 'react';
import { useErrorHandling } from './hooks/useErrorHandling';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';
import { ErrorDisplay } from './components/ErrorDisplay';

const SBTMintingComponent = ({ walletAddress }) => {
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  
  const { errorState, handleError, clearError, retry } = useErrorHandling();
  const { trackOperation } = usePerformanceMetrics();

  const mintSBT = async () => {
    setIsMinting(true);
    clearError();

    try {
      const result = await trackOperation(
        'sbt-minting',
        'SBT Minting',
        async () => {
          // Your minting logic here
          return await mintingService.mintSBT({
            to: walletAddress,
            metadata: { name: 'Test SBT' }
          });
        }
      );

      setMintResult(result);
    } catch (error) {
      handleError(error, {
        showToast: true,
        logToConsole: true,
        retryable: true,
        maxRetries: 3
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleRetry = () => {
    retry(mintSBT, {
      maxRetries: 3,
      retryable: true
    });
  };

  return (
    <div>
      <button onClick={mintSBT} disabled={isMinting}>
        {isMinting ? 'Minting...' : 'Mint SBT'}
      </button>

      {errorState.isError && (
        <ErrorDisplay
          error={errorState.error}
          onRetry={handleRetry}
          onDismiss={() => clearError()}
        />
      )}

      {mintResult && (
        <div>
          <h3>Minting Successful!</h3>
          <p>Token ID: {mintResult.tokenId}</p>
        </div>
      )}
    </div>
  );
};
```

## 📚 Additional Resources

- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Moonbeam Error Codes](https://docs.moonbeam.network/builders/tools/eth-libraries/)
- [Ethers.js Error Handling](https://docs.ethers.io/v5/api/utils/logger/)
- [KeyPass Error Reference](../docs/errors.md)

## 🤝 Support

If you need help with error handling:

1. Check the browser console for detailed error messages
2. Review the error handling examples in this guide
3. Test with different error scenarios
4. Open an issue on GitHub with error details
