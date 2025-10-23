# 🌐 Real Blockchain Integration Guide

This guide explains how to integrate the KeyPass React Boilerplate with real Moonbeam blockchain functionality.

## 🎯 Overview

The KeyPass React Boilerplate now supports **Moonbeam-only integration** for:
- **DID Registration**: Create decentralized identifiers on Moonbeam
- **SBT Minting**: Mint soulbound tokens linked to DIDs
- **Transaction Monitoring**: Real-time transaction tracking
- **Error Handling**: Comprehensive error management
- **Performance Metrics**: Transaction performance tracking

## 🔧 Setup Requirements

### 1. Environment Configuration

Create a `.env` file in the `examples/react-boilerplate` directory:

```bash
# Moonbeam Configuration
REACT_APP_MOONBEAM_RPC_URL=https://rpc.api.moonbase.moonbeam.network
REACT_APP_SBT_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# IPFS Configuration (Optional - for metadata storage)
REACT_APP_PINATA_API_KEY=your-pinata-api-key
REACT_APP_PINATA_SECRET=your-pinata-secret

# Development Configuration
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG_MODE=true
```

### 2. Get Testnet Tokens

1. **Connect MetaMask to Moonbase Alpha**:
   - Network Name: `Moonbase Alpha`
   - RPC URL: `https://rpc.api.moonbase.moonbeam.network`
   - Chain ID: `1287`
   - Currency Symbol: `DEV`
   - Block Explorer: `https://moonbase.moonscan.io`

2. **Get DEV tokens**:
   - Visit [Moonbeam Faucet](https://apps.moonbeam.network/moonbase-alpha/faucet/)
   - Connect your wallet
   - Request DEV tokens

### 3. Deploy SBT Contract

If you haven't deployed the SBT contract yet:

```bash
# From the project root
cd scripts
node deploy-sbt.js
```

This will deploy the contract and save the address to `deployments.json`.

## 🚀 Integration Examples

### 1. Basic DID Registration

```typescript
import { MoonbeamAdapter } from '@keypass/moonbeam';
import { MoonbeamDIDProvider } from '@keypass/did';

const moonbeamAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
await moonbeamAdapter.connect();

const didProvider = new MoonbeamDIDProvider(moonbeamAdapter);
const did = await didProvider.createDid(walletAddress);

console.log('Created DID:', did);
```

### 2. SBT Minting with DID Verification

```typescript
import { SBTMintingService } from '@keypass/services';

const mintingService = new SBTMintingService(
  moonbeamAdapter,
  contractAddress,
  didProvider
);

const result = await mintingService.mintSBT({
  to: walletAddress,
  metadata: {
    name: "KeyPass Identity SBT",
    description: `Soulbound token for ${did}`,
    image: "ipfs://...",
    attributes: [
      { trait_type: "DID", value: did },
      { trait_type: "Type", value: "Identity" }
    ]
  }
});

console.log('Minted SBT:', result.tokenId);
```

### 3. Transaction Monitoring

```typescript
import { BlockchainMonitor } from '@keypass/monitoring';

const monitor = new BlockchainMonitor({
  moonbeamAdapter,
  maxRetries: 3,
  retryDelay: 1000
});

// Monitor DID registration
const didTx = await monitor.monitorMoonbeamDIDTransaction(
  didTxHash,
  'DID Registration',
  {
    onProgress: (tx) => console.log('Progress:', tx.status),
    maxRetries: 3
  }
);

// Monitor SBT minting
const sbtTx = await monitor.monitorMoonbeamTransaction(
  sbtTxHash,
  'SBT Minting',
  {
    onProgress: (tx) => console.log('Progress:', tx.status),
    maxRetries: 3
  }
);
```

### 4. Error Handling

```typescript
import { useErrorHandling } from './hooks/useErrorHandling';

const { handleError, clearError, retry } = useErrorHandling();

try {
  const result = await mintingService.mintSBT(params);
} catch (error) {
  handleError(error, {
    showToast: true,
    logToConsole: true,
    retryable: true,
    maxRetries: 3
  });
}
```

### 5. Performance Monitoring

```typescript
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';

const { trackOperation, getStats } = usePerformanceMetrics();

const result = await trackOperation(
  'sbt-minting',
  'SBT Minting',
  async () => {
    return await mintingService.mintSBT(params);
  },
  { recipient: walletAddress }
);

const stats = getStats();
console.log('Performance stats:', stats);
```

## 🔄 Complete Flow Example

Here's a complete example of the DID → SBT flow:

```typescript
import React, { useState } from 'react';
import { MoonbeamAdapter, MoonbeamNetwork } from '@keypass/moonbeam';
import { MoonbeamDIDProvider } from '@keypass/did';
import { SBTMintingService } from '@keypass/services';
import { BlockchainMonitor } from '@keypass/monitoring';
import { useErrorHandling } from './hooks/useErrorHandling';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';

const CompleteFlowExample = ({ walletAddress }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  
  const { handleError, clearError } = useErrorHandling();
  const { trackOperation } = usePerformanceMetrics();

  const runCompleteFlow = async () => {
    setIsRunning(true);
    clearError();

    try {
      // Initialize services
      const moonbeamAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
      await moonbeamAdapter.connect();

      const didProvider = new MoonbeamDIDProvider(moonbeamAdapter);
      const monitor = new BlockchainMonitor({ moonbeamAdapter });

      // Step 1: Register DID
      const didResult = await trackOperation(
        'did-registration',
        'DID Registration',
        async () => {
          const did = await didProvider.createDid(walletAddress);
          return { did };
        }
      );

      // Step 2: Monitor DID transaction
      const didTx = await monitor.monitorMoonbeamDIDTransaction(
        didResult.txHash,
        'DID Registration'
      );

      // Step 3: Mint SBT
      const mintingService = new SBTMintingService(
        moonbeamAdapter,
        process.env.REACT_APP_SBT_CONTRACT_ADDRESS,
        didProvider
      );

      const sbtResult = await trackOperation(
        'sbt-minting',
        'SBT Minting',
        async () => {
          return await mintingService.mintSBT({
            to: walletAddress,
            metadata: {
              name: "KeyPass Identity SBT",
              description: `Soulbound token for ${didResult.did}`,
              attributes: [
                { trait_type: "DID", value: didResult.did },
                { trait_type: "Type", value: "Identity" }
              ]
            }
          });
        }
      );

      // Step 4: Monitor SBT transaction
      const sbtTx = await monitor.monitorMoonbeamTransaction(
        sbtResult.txHash,
        'SBT Minting'
      );

      setResult({
        did: didResult.did,
        sbtTokenId: sbtResult.tokenId,
        didTxHash: didTx.hash,
        sbtTxHash: sbtTx.hash,
        totalDuration: Date.now() - startTime
      });

    } catch (error) {
      handleError(error, {
        showToast: true,
        logToConsole: true,
        retryable: true
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <button onClick={runCompleteFlow} disabled={isRunning}>
        {isRunning ? 'Running...' : 'Start Complete Flow'}
      </button>
      
      {result && (
        <div>
          <h3>Flow Complete!</h3>
          <p>DID: {result.did}</p>
          <p>SBT Token ID: {result.sbtTokenId}</p>
          <p>Duration: {result.totalDuration}ms</p>
        </div>
      )}
    </div>
  );
};
```

## 🛠️ Advanced Configuration

### Custom Error Handling

```typescript
import { BlockchainErrorFactory } from '@keypass/errors';

const customErrorHandler = (error) => {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    // Show specific UI for insufficient balance
    showBalanceError();
  } else if (error.code === 'NETWORK_ERROR') {
    // Show network error with retry option
    showNetworkError(() => retry());
  } else {
    // Generic error handling
    showGenericError(error.message);
  }
};
```

### Performance Optimization

```typescript
import { PerformanceMonitor } from './components/PerformanceMonitor';

// Enable performance tracking
const monitor = new PerformanceMonitor({
  showDetails: true,
  autoRefresh: true,
  refreshInterval: 5000
});

// Track specific operations
const stats = monitor.getOperationStats('sbt-minting');
console.log('SBT minting stats:', stats);
```

## 🐛 Troubleshooting

### Common Issues

1. **"Network Error"**: Check your RPC URL and internet connection
2. **"Insufficient Balance"**: Get more DEV tokens from the faucet
3. **"Contract Not Found"**: Verify the contract address in your `.env` file
4. **"Transaction Failed"**: Check gas limits and network congestion

### Debug Mode

Enable debug mode in your `.env` file:

```bash
REACT_APP_DEBUG_MODE=true
```

This will show detailed logs in the browser console.

## 📚 Additional Resources

- [Moonbeam Documentation](https://docs.moonbeam.network/)
- [Moonbase Alpha Faucet](https://apps.moonbeam.network/moonbase-alpha/faucet/)
- [Moonbeam Explorer](https://moonbase.moonscan.io/)
- [KeyPass SDK Documentation](../docs/)

## 🤝 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your environment configuration
3. Ensure you have sufficient DEV tokens
4. Check the [troubleshooting guide](./ERROR_HANDLING_GUIDE.md)

For additional help, please open an issue on GitHub.
