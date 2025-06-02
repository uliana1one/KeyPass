# Integration Guide

This guide provides detailed technical information for integrating the KeyPass Login SDK into your application.
## Installation

```bash
npm install @keypass/login-sdk
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# Required for WalletConnect
WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Override default timeouts (in milliseconds)
WALLET_TIMEOUT=30000
MAX_MESSAGE_AGE_MS=300000
```

### Quick Start

The basic integration is very simple:

```typescript
import { connectWallet } from '@keypass/login-sdk';

// Connect to wallet
const wallet = await connectWallet();

// Get accounts
const accounts = await wallet.getAccounts();
console.log('Available accounts:', accounts);
```

That's all you need to get started! The SDK handles:
- Wallet detection and connection
- Session management
- Error handling
- Security considerations

The rest of this guide provides detailed information about:
- Configuration options
- Advanced features
- Error handling
- Security considerations
- Best practices

But for basic usage, the two lines above are sufficient.


### Wallet Configuration

The SDK supports multiple wallet types with configurable priorities. The default configuration is in `wallets.json`:

```json
{
  "wallets": [
    {
      "id": "polkadot-js",
      "name": "Polkadot.js",
      "adapter": "PolkadotJsAdapter",
      "priority": 1
    },
    {
      "id": "talisman",
      "name": "Talisman",
      "adapter": "TalismanAdapter",
      "priority": 2
    },
    {
      "id": "walletconnect",
      "name": "WalletConnect",
      "adapter": "WalletConnectAdapter",
      "priority": 3
    }
  ]
}
```

You can override this configuration by providing your own `wallets.json` file.

## Basic Integration

### 1. Initialize the SDK

```typescript
import { connectWallet, loginWithPolkadot } from '@keypass/login-sdk';

// The SDK is automatically initialized when imported
// No explicit initialization needed
```

### 2. Connect to Wallet

```typescript
async function connectToWallet() {
  try {
    const wallet = await connectWallet();
    
    // Get the connected wallet type
    const provider = wallet.getProvider();
    console.log('Connected to:', provider); // 'polkadot-js' | 'talisman' | 'walletconnect'
    
    // Get accounts
    const accounts = await wallet.getAccounts();
    console.log('Available accounts:', accounts);
    
    // Listen for wallet events
    wallet.on('disconnect', () => {
      console.log('Wallet disconnected');
    });
    
    wallet.on('sessionExpire', () => {
      console.log('Session expired');
    });
    
    return wallet;
  } catch (error) {
    if (error.name === 'WalletNotFoundError') {
      console.error('No wallet found. Please install a wallet extension.');
    } else if (error.name === 'UserRejectedError') {
      console.error('User rejected the connection request');
    } else {
      console.error('Connection failed:', error.message);
    }
    throw error;
  }
}
```

### 3. Implement Authentication

```typescript
async function authenticate() {
  try {
    const result = await loginWithPolkadot();
    
    // Send authentication data to your backend
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: result.address,
        signature: result.signature,
        message: result.message,
        did: result.did,
        nonce: result.nonce,
        issuedAt: result.issuedAt
      })
    });
    
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'UserRejectedError') {
      console.error('User rejected the login request');
    } else if (error.name === 'InvalidSignatureError') {
      console.error('Invalid signature');
    } else {
      console.error('Login failed:', error.message);
    }
    throw error;
  }
}
```

## Advanced Integration

### Custom Wallet Configuration

You can customize the wallet configuration by providing your own configuration:

```typescript
import { WalletConnectConfig } from '@keypass/login-sdk';

const customWalletConnectConfig: WalletConnectConfig = {
  projectId: process.env.WALLETCONNECT_PROJECT_ID!,
  metadata: {
    name: 'Your App Name',
    description: 'Your App Description',
    url: 'https://your-app.com',
    icons: ['https://your-app.com/icon.png']
  },
  relayUrl: 'wss://relay.walletconnect.com', // Optional custom relay
  chainId: 'polkadot', // Optional chain ID
  sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
};
```

### Error Handling

The SDK provides a comprehensive error handling system:

```typescript
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  WalletConnectionError,
  MessageValidationError,
  InvalidSignatureError,
  ConfigurationError
} from '@keypass/login-sdk';

async function handleWalletOperation() {
  try {
    // ... wallet operation
  } catch (error) {
    switch (error.constructor) {
      case WalletNotFoundError:
        // Handle missing wallet
        break;
      case UserRejectedError:
        // Handle user rejection
        break;
      case TimeoutError:
        // Handle timeout
        break;
      case WalletConnectionError:
        // Handle connection failure
        break;
      case MessageValidationError:
        // Handle invalid message
        break;
      case InvalidSignatureError:
        // Handle invalid signature
        break;
      case ConfigurationError:
        // Handle configuration error
        break;
      default:
        // Handle unexpected errors
        break;
    }
  }
}
```

### Session Management

The SDK handles session management automatically, but you can implement custom session handling:

```typescript
import { connectWallet } from '@keypass/login-sdk';

class WalletSessionManager {
  private wallet: WalletAdapter | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  
  async connect() {
    this.wallet = await connectWallet();
    
    // Set up session timeout
    this.wallet.on('sessionExpire', () => {
      this.handleSessionExpire();
    });
    
    // Set up disconnect handler
    this.wallet.on('disconnect', () => {
      this.handleDisconnect();
    });
    
    return this.wallet;
  }
  
  private handleSessionExpire() {
    // Clear any existing timeout
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Notify user
    console.log('Session expired. Please reconnect.');
    
    // Clean up
    this.wallet = null;
  }
  
  private handleDisconnect() {
    // Clear any existing timeout
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Clean up
    this.wallet = null;
  }
  
  async disconnect() {
    if (this.wallet) {
      await this.wallet.disconnect();
      this.wallet = null;
    }
  }
}
```

### DID Management

The SDK provides DID management through the `PolkadotDIDProvider`:

```typescript
import { PolkadotDIDProvider } from '@keypass/login-sdk';

const didProvider = new PolkadotDIDProvider();

async function handleDID(address: string) {
  // Create DID
  const did = await didProvider.createDid(address);
  
  // Get DID document
  const didDocument = await didProvider.createDIDDocument(address);
  
  // Resolve DID
  const resolvedDocument = await didProvider.resolve(did);
  
  // Extract address from DID
  const extractedAddress = await didProvider.extractAddress(did);
  
  return {
    did,
    didDocument,
    resolvedDocument,
    extractedAddress
  };
}
```

## Best Practices

1. **Error Handling**
   - Always handle all possible error types
   - Provide user-friendly error messages
   - Log errors for debugging
   - Implement retry logic for network errors

2. **Session Management**
   - Implement proper session cleanup
   - Handle session expiration
   - Provide clear feedback to users
   - Implement reconnection logic

3. **Security**
   - Validate all inputs
   - Verify signatures
   - Use secure communication
   - Implement proper session timeouts
   - Handle wallet disconnection gracefully

4. **User Experience**
   - Show loading states
   - Provide clear feedback
   - Handle wallet installation
   - Guide users through the process
   - Support multiple wallet types

5. **Testing**
   - Test all wallet types
   - Test error scenarios
   - Test session management
   - Test network conditions
   - Implement integration tests

## Troubleshooting

### Common Issues

1. **Wallet Not Found**
   - Check if wallet extension is installed
   - Verify wallet is enabled
   - Check browser compatibility

2. **Connection Failures**
   - Verify network connection
   - Check wallet configuration
   - Verify project ID for WalletConnect

3. **Signature Errors**
   - Verify message format
   - Check address format
   - Verify wallet permissions

4. **Session Issues**
   - Check session timeout
   - Verify session cleanup
   - Check reconnection logic

### Debugging

Enable debug logging:

```typescript
import { setLogLevel } from '@keypass/login-sdk';

// Set log level to debug
setLogLevel('debug');
```

## API Reference

For detailed API documentation, see [API Reference](./api.md).

## Security Considerations

1. **Message Signing**
   - Always validate messages
   - Verify signatures
   - Use nonces for replay protection

2. **Session Security**
   - Implement proper session timeouts
   - Handle session expiration
   - Secure session storage

3. **WalletConnect Security**
   - Keep project ID secure
   - Validate chain ID
   - Verify addresses
   - Handle session encryption

4. **General Security**
   - Use HTTPS
   - Implement CORS
   - Validate all inputs
   - Handle errors securely
   - Implement rate limiting 