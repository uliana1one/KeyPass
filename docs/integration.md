# Integration Guide

This guide provides step-by-step instructions for integrating KeyPass Login SDK into your Polkadot dApp.

## Installation

```bash
npm install @keypass/login-sdk
# or
yarn add @keypass/login-sdk
```

## Basic Integration

### 1. Initialize the SDK

```typescript
import { loginWithPolkadot } from '@keypass/login-sdk';

// Basic usage
const handleLogin = async () => {
  try {
    const result = await loginWithPolkadot();
    // Handle successful login
    console.log('Login successful:', result.did);
  } catch (error) {
    // Handle errors
    console.error('Login failed:', error.message);
  }
};
```

### 2. Add Login Button

```tsx
import React from 'react';
import { loginWithPolkadot } from '@keypass/login-sdk';

const LoginButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await loginWithPolkadot();
      // Store the DID and address in your app state
      localStorage.setItem('userDid', result.did);
      localStorage.setItem('userAddress', result.address);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Login with Polkadot'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
```

## Advanced Integration

### 1. Custom Wallet Selection

```typescript
import { 
  loginWithPolkadot,
  PolkadotJsAdapter,
  TalismanAdapter
} from '@keypass/login-sdk';

const handleCustomWalletLogin = async (walletType: 'polkadot' | 'talisman') => {
  const adapter = walletType === 'polkadot' 
    ? new PolkadotJsAdapter()
    : new TalismanAdapter();

  try {
    await adapter.enable();
    const accounts = await adapter.getAccounts();
    // Handle account selection
    const selectedAccount = accounts[0]; // Or implement your own selection UI
    
    const result = await loginWithPolkadot();
    return result;
  } catch (error) {
    throw new Error(`Wallet connection failed: ${error.message}`);
  }
};
```

### 2. Server-Side Verification

```typescript
// Server-side code (Node.js/Express)
import express from 'express';
import { VerificationService } from '@keypass/login-sdk';

const app = express();
const verificationService = new VerificationService();

app.post('/api/verify', async (req, res) => {
  try {
    const { message, signature, address } = req.body;
    
    const result = await verificationService.verifySignature({
      message,
      signature,
      address
    });

    if (result.status === 'success') {
      // Create session or JWT token
      const token = createSessionToken(result.did);
      res.json({ token });
    } else {
      res.status(401).json({ error: result.message });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 3. Session Management

```typescript
// Client-side session management
interface Session {
  did: string;
  address: string;
  expiresAt: number;
}

class AuthManager {
  private static SESSION_KEY = 'keypass_session';

  static async login(): Promise<Session> {
    const result = await loginWithPolkadot();
    
    const session: Session = {
      did: result.did,
      address: result.address,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return session;
  }

  static getSession(): Session | null {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (!session) return null;

    const parsed = JSON.parse(session) as Session;
    if (parsed.expiresAt < Date.now()) {
      this.logout();
      return null;
    }

    return parsed;
  }

  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }
}
```

## Error Handling

### Common Error Scenarios

1. **Wallet Not Found**
```typescript
try {
  await loginWithPolkadot();
} catch (error) {
  if (error instanceof WalletNotFoundError) {
    // Prompt user to install wallet
    showWalletInstallPrompt();
  }
}
```

2. **User Rejection**
```typescript
try {
  await loginWithPolkadot();
} catch (error) {
  if (error instanceof UserRejectedError) {
    // Handle user rejection gracefully
    showUserRejectionMessage();
  }
}
```

3. **Network Errors**
```typescript
try {
  // Retry up to 3 times for network errors
  await loginWithPolkadot(3);
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout
    showTimeoutMessage();
  }
}
```

## Best Practices

1. **Always Handle Errors**
   - Implement proper error handling for all wallet operations
   - Provide user-friendly error messages
   - Log errors for debugging

2. **Session Management**
   - Implement secure session storage
   - Set appropriate session timeouts
   - Clear sessions on logout

3. **Security**
   - Never store private keys
   - Validate all server responses
   - Use HTTPS for all API calls
   - Implement rate limiting

4. **User Experience**
   - Show loading states during wallet operations
   - Provide clear feedback for all actions
   - Handle wallet connection gracefully
   - Support multiple wallet types

5. **Testing**
   - Test with different wallet implementations
   - Verify error handling
   - Test session management
   - Implement integration tests

## Troubleshooting

### Common Issues

1. **Wallet Connection Fails**
   - Check if wallet extension is installed
   - Verify wallet is unlocked
   - Check network connectivity
   - Ensure correct network is selected

2. **Signature Verification Fails**
   - Verify message format
   - Check signature format (should be 0x-prefixed)
   - Ensure correct address is used
   - Check message expiration

3. **DID Creation Fails**
   - Verify address format
   - Check network connectivity
   - Ensure proper permissions

### Debugging

```typescript
// Enable debug logging
import { setDebug } from '@keypass/login-sdk';

setDebug(true);

// Debug logs will show:
// - Wallet connection attempts
// - Message signing process
// - Signature verification
// - DID creation
```

## Support

For additional support:
- Check the [API Reference](./api.md)
- Review the [Architecture Overview](./architecture.md)
- Open an issue on GitHub
- Join our Discord community 