# Tutorial Guide

This tutorial will guide you through integrating the KeyPass Login SDK into your application, from basic setup to advanced features.


## Getting Started

### Prerequisites

Before you begin, ensure you have:

1. Node.js (v14 or later) installed
2. A modern web browser
3. A code editor
4. Basic knowledge of TypeScript/JavaScript
5. A WalletConnect project ID (for WalletConnect support)

### Installation

1. Install the SDK in your project:

```bash
npm install @keypass/login-sdk
```

2. Create a `.env` file in your project root:

```bash
# Required for WalletConnect
WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Override default timeouts
WALLET_TIMEOUT=30000
MAX_MESSAGE_AGE_MS=300000
```
### Quick Start

The basic usage of the SDK is very simple:

```typescript
import { connectWallet } from '@keypass/login-sdk';

// Connect to wallet
const wallet = await connectWallet();

// Get accounts
const accounts = await wallet.getAccounts();
console.log('Available accounts:', accounts);
```

That's it! The SDK will automatically:
- Detect available wallets
- Connect to the highest priority wallet
- Handle the connection process
- Manage the session

The rest of this tutorial shows how to:
- Add user interface components
- Handle different wallet types
- Manage sessions
- Handle errors
- Implement advanced features

But remember - you can start with just the two lines above!

### Basic Integration

Let's create a simple React component that implements wallet connection and authentication:

```typescript
import React, { useState, useEffect } from 'react';
import { connectWallet, loginWithPolkadot } from '@keypass/login-sdk';

function WalletLogin() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<any>(null);

  // Connect to wallet
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const connectedWallet = await connectWallet();
      setWallet(connectedWallet);
      
      // Get available accounts
      const availableAccounts = await connectedWallet.getAccounts();
      setAccounts(availableAccounts.map(acc => acc.address));
      
      // Set up event listeners
      connectedWallet.on('disconnect', () => {
        setWallet(null);
        setAccounts([]);
        setSelectedAccount(null);
      });
      
      connectedWallet.on('sessionExpire', () => {
        setError('Session expired. Please reconnect.');
        setWallet(null);
        setAccounts([]);
        setSelectedAccount(null);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!selectedAccount) {
      setError('Please select an account first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await loginWithPolkadot();
      
      // Send to your backend
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

      // Handle successful login
      const { token } = await response.json();
      // Store token and update UI
      localStorage.setItem('auth_token', token);
      // Redirect or update state
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wallet-login">
      <h2>Connect Your Wallet</h2>
      
      {!wallet ? (
        <button 
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="wallet-connected">
          <h3>Select Account</h3>
          <select
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select an account</option>
            {accounts.map(account => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleLogin}
            disabled={!selectedAccount || isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          
          <button
            onClick={() => wallet.disconnect()}
            disabled={isLoading}
          >
            Disconnect
          </button>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default WalletLogin;
```

## Advanced Features

### Custom Wallet Selection

Let's create a component that allows users to choose their preferred wallet:

```typescript
import React, { useState } from 'react';
import { connectWallet } from '@keypass/login-sdk';

function WalletSelector() {
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallets = [
    { id: 'polkadot-js', name: 'Polkadot.js' },
    { id: 'talisman', name: 'Talisman' },
    { id: 'walletconnect', name: 'WalletConnect' }
  ];

  const handleConnect = async (walletId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const wallet = await connectWallet(walletId);
      
      // Handle successful connection
      console.log('Connected to:', wallet.getProvider());
      
      // Get accounts
      const accounts = await wallet.getAccounts();
      console.log('Available accounts:', accounts);
      
      // Set up event listeners
      wallet.on('disconnect', () => {
        console.log('Wallet disconnected');
      });
      
      wallet.on('sessionExpire', () => {
        console.log('Session expired');
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wallet-selector">
      <h2>Select Your Wallet</h2>
      
      <div className="wallet-options">
        {wallets.map(wallet => (
          <button
            key={wallet.id}
            onClick={() => handleConnect(wallet.id)}
            disabled={isLoading}
            className={selectedWallet === wallet.id ? 'selected' : ''}
          >
            {wallet.name}
          </button>
        ))}
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default WalletSelector;
```

### Session Management

Here's an example of implementing custom session management:

```typescript
import { connectWallet } from '@keypass/login-sdk';

class SessionManager {
  private wallet: any = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  async connect() {
    try {
      this.wallet = await connectWallet();
      
      // Set up session timeout
      this.setupSessionTimeout();
      
      // Set up event listeners
      this.wallet.on('disconnect', () => {
        this.handleDisconnect();
      });
      
      this.wallet.on('sessionExpire', () => {
        this.handleSessionExpire();
      });
      
      return this.wallet;
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }
  
  private setupSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    this.sessionTimeout = setTimeout(() => {
      this.handleSessionExpire();
    }, this.SESSION_DURATION);
  }
  
  private handleSessionExpire() {
    console.log('Session expired');
    this.cleanup();
  }
  
  private handleDisconnect() {
    console.log('Wallet disconnected');
    this.cleanup();
  }
  
  private cleanup() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
    
    if (this.wallet) {
      this.wallet.disconnect();
      this.wallet = null;
    }
    
    // Clear any stored session data
    localStorage.removeItem('wallet_session');
  }
  
  async disconnect() {
    this.cleanup();
  }
}

// Usage example
const sessionManager = new SessionManager();

// Connect
try {
  const wallet = await sessionManager.connect();
  console.log('Connected to wallet');
} catch (error) {
  console.error('Failed to connect:', error);
}

// Disconnect
await sessionManager.disconnect();
```

### Error Handling

Here's a comprehensive example of error handling:

```typescript
import {
  WalletNotFoundError,
  UserRejectedError,
  TimeoutError,
  WalletConnectionError,
  MessageValidationError,
  InvalidSignatureError
} from '@keypass/login-sdk';

class WalletErrorHandler {
  static handleError(error: unknown): string {
    if (error instanceof WalletNotFoundError) {
      return 'Please install a wallet extension to continue.';
    }
    
    if (error instanceof UserRejectedError) {
      return 'Operation was rejected. Please try again.';
    }
    
    if (error instanceof TimeoutError) {
      return 'Operation timed out. Please try again.';
    }
    
    if (error instanceof WalletConnectionError) {
      return 'Failed to connect to wallet. Please check your connection.';
    }
    
    if (error instanceof MessageValidationError) {
      return 'Invalid message format. Please try again.';
    }
    
    if (error instanceof InvalidSignatureError) {
      return 'Invalid signature. Please try again.';
    }
    
    // Handle unexpected errors
    console.error('Unexpected error:', error);
    return 'An unexpected error occurred. Please try again.';
  }
  
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: unknown;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry user rejections
        if (error instanceof UserRejectedError) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    throw lastError;
  }
}

// Usage example
async function connectWithRetry() {
  try {
    const wallet = await WalletErrorHandler.withRetry(
      () => connectWallet()
    );
    console.log('Connected successfully');
    return wallet;
  } catch (error) {
    const message = WalletErrorHandler.handleError(error);
    console.error(message);
    throw error;
  }
}
```

## Best Practices

1. **User Experience**
   - Show loading states during operations
   - Provide clear feedback for all actions
   - Handle wallet installation gracefully
   - Guide users through the process
   - Support multiple wallet types

2. **Error Handling**
   - Implement proper error handling
   - Provide user-friendly error messages
   - Log errors for debugging
   - Implement retry logic for network errors

3. **Session Management**
   - Implement proper session cleanup
   - Handle session expiration
   - Provide clear feedback to users
   - Implement reconnection logic

4. **Security**
   - Validate all inputs
   - Verify signatures
   - Use secure communication
   - Implement proper session timeouts
   - Handle wallet disconnection gracefully

## Next Steps

1. **Explore the API**
   - Review the [API Reference](./api.md)
   - Check out the [Integration Guide](./integration.md)
   - Read the [Architecture Documentation](./architecture.md)

2. **Advanced Topics**
   - Implement custom wallet adapters
   - Add support for additional chains
   - Implement advanced session management
   - Add custom error handling

3. **Testing**
   - Write unit tests for your implementation
   - Test with different wallet types
   - Test error scenarios
   - Test session management

4. **Deployment**
   - Set up environment variables
   - Configure CORS
   - Implement rate limiting
   - Set up monitoring

## Support

For help and support:

1. Check the [documentation](./)
2. Visit our [GitHub repository](https://github.com/uliana1one/keypass)
3. Open an issue for bugs or feature requests
4. Join our community chat

## License

Apache License 2.0 - see [LICENSE](../LICENSE) for details. 