# KeyPass Login SDK Integration Guide

## Overview

KeyPass Login SDK provides secure wallet-based authentication for Polkadot applications. This guide will help you integrate the SDK into your application with proper security considerations and error handling.

## Installation

> **Note**: The package is currently in development and not yet published to npm. There are several ways to test it in your project.

### Method 1: Using npm link (Recommended for local development)

```bash
# Clone the repository
git clone https://github.com/uliana1one/keypass.git
cd keypass

# Install dependencies
npm install

# Build the package
npm run build

# Link it to your project
npm link

# In your project directory
npm link @keypass/login-sdk
```

### Method 2: Using Git URL (For testing in other projects)

In your project's `package.json`:
```json
{
  "dependencies": {
    "@keypass/login-sdk": "github:uliana1one/keypass"
  }
}
```

Then run:
```bash
npm install
```

### Method 3: Using Local Path (For testing in other projects)

In your project's `package.json`:
```json
{
  "dependencies": {
    "@keypass/login-sdk": "file:../path/to/keypass"
  }
}
```

Then run:
```bash
npm install
```

> **Note**: While the package is in development, you might encounter breaking changes. We recommend using Method 1 (npm link) for local development as it allows you to easily update to the latest changes.

## Prerequisites

Before integrating the SDK, ensure:

1. Your application is served over HTTPS
2. Users have either [Polkadot.js](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/) wallet installed
3. Your backend is prepared to handle signature verification
4. You have a secure storage solution for session management

## Core Features

The SDK provides:

- Wallet connection and account management
- Secure message signing and verification
- DID (Decentralized Identifier) generation
- Automatic retry for network errors
- Comprehensive error handling
- Message validation and sanitization
- Session management utilities

## Basic Integration

### 1. Initialize Authentication

```typescript
import { loginWithPolkadot, LoginResult } from '@keypass/login-sdk';

class AuthService {
  private currentUser: LoginResult | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async login(retryCount = 2): Promise<LoginResult> {
    try {
      const result = await loginWithPolkadot(retryCount);
      
      // Verify the signature server-side
      const verificationResult = await this.verifySignature(result);
      if (!verificationResult.isValid) {
        throw new Error('Signature verification failed');
      }

      // Store the session
      this.setSession(result);
      
      return result;
    } catch (error) {
      this.handleLoginError(error);
      throw error;
    }
  }

  private setSession(result: LoginResult): void {
    this.currentUser = result;
    this.setupSessionTimeout();
    
    // Store in secure storage
    // Note: Replace with your secure storage solution
    localStorage.setItem('auth', JSON.stringify({
      ...result,
      expiresAt: Date.now() + this.SESSION_DURATION
    }));
  }

  private setupSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    this.sessionTimeout = setTimeout(() => {
      this.logout();
    }, this.SESSION_DURATION);
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
    localStorage.removeItem('auth');
  }

  private async verifySignature(result: LoginResult): Promise<{ isValid: boolean }> {
    // Implement your server-side verification
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: result.message,
        signature: result.signature,
        address: result.address,
        nonce: result.nonce,
        issuedAt: result.issuedAt
      })
    });
    
    return response.json();
  }

  private handleLoginError(error: unknown): void {
    if (error instanceof Error) {
      switch (error.code) {
        case 'WALLET_NOT_FOUND':
          // Handle missing wallet
          console.error('Please install a Polkadot wallet');
          break;
        case 'USER_REJECTED':
          // Handle user rejection
          console.error('Login was rejected by user');
          break;
        case 'WALLET_CONNECTION_ERROR':
          // Handle connection issues
          console.error('Failed to connect to wallet');
          break;
        case 'MESSAGE_VALIDATION_ERROR':
          // Handle invalid message
          console.error('Invalid message format');
          break;
        case 'INVALID_SIGNATURE':
          // Handle signature verification failure
          console.error('Invalid signature');
          break;
        case 'TIMEOUT_ERROR':
          // Handle timeout
          console.error('Operation timed out');
          break;
        default:
          // Handle other errors
          console.error('Login failed:', error.message);
      }
    }
  }
}
```

### 2. Server-Side Verification

Create a verification endpoint in your backend:

```typescript
import express from 'express';
import { VerificationService } from '@keypass/login-sdk';

const app = express();
const verificationService = new VerificationService({
  // Configure network settings
  network: 'polkadot',
  // Add any additional configuration
  maxMessageAge: 5 * 60 * 1000, // 5 minutes
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
});

app.post('/api/verify', async (req, res) => {
  try {
    const { message, signature, address, nonce, issuedAt } = req.body;
    
    // Validate request
    if (!message || !signature || !address || !nonce || !issuedAt) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Verify the signature
    const result = await verificationService.verifySignature({
      message,
      signature,
      address,
      nonce,
      issuedAt
    });

    if (result.status === 'success') {
      // Create session or JWT token
      const token = createSessionToken(result.did);
      res.json({ 
        token,
        did: result.did,
        expiresIn: 24 * 60 * 60 // 24 hours in seconds
      });
    } else {
      res.status(401).json({ 
        error: result.message,
        code: result.code
      });
    }
  } catch (error) {
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Verification failed',
      code: error instanceof Error ? error.code : 'UNKNOWN_ERROR'
    });
  }
});
```

## Advanced Features

### 1. Custom Wallet Selection

```typescript
import { 
  connectWallet,
  PolkadotJsAdapter,
  TalismanAdapter,
  WalletAdapter
} from '@keypass/login-sdk';

class WalletManager {
  private adapter: WalletAdapter | null = null;

  async connectToWallet(provider: 'polkadot-js' | 'talisman'): Promise<void> {
    try {
      this.adapter = await connectWallet(provider);
      await this.adapter.enable();
    } catch (error) {
      this.handleConnectionError(error);
      throw error;
    }
  }

  async getAccounts(): Promise<WalletAccount[]> {
    if (!this.adapter) {
      throw new Error('Wallet not connected');
    }
    return this.adapter.getAccounts();
  }

  async signMessage(message: string): Promise<string> {
    if (!this.adapter) {
      throw new Error('Wallet not connected');
    }
    return this.adapter.signMessage(message);
  }

  disconnect(): void {
    if (this.adapter) {
      this.adapter.disconnect();
      this.adapter = null;
    }
  }

  private handleConnectionError(error: unknown): void {
    if (error instanceof Error) {
      switch (error.code) {
        case 'WALLET_NOT_FOUND':
          console.error('Wallet extension not found');
          break;
        case 'USER_REJECTED':
          console.error('User rejected wallet connection');
          break;
        case 'TIMEOUT_ERROR':
          console.error('Wallet connection timed out');
          break;
        default:
          console.error('Wallet connection failed:', error.message);
      }
    }
  }
}
```

### 2. DID Management

```typescript
import { PolkadotDIDProvider } from '@keypass/login-sdk';

class DIDManager {
  private provider: PolkadotDIDProvider;

  constructor() {
    this.provider = new PolkadotDIDProvider();
  }

  async createDID(address: string): Promise<string> {
    try {
      return await this.provider.createDid(address);
    } catch (error) {
      console.error('Failed to create DID:', error);
      throw error;
    }
  }

  async resolveDID(did: string): Promise<DIDDocument> {
    try {
      return await this.provider.resolve(did);
    } catch (error) {
      console.error('Failed to resolve DID:', error);
      throw error;
    }
  }
}
```

## Security Considerations

1. **Message Validation**
   - All messages are validated and sanitized before signing
   - Messages include a nonce to prevent replay attacks
   - Messages include a timestamp for expiration checking

2. **Signature Verification**
   - Always verify signatures server-side
   - Implement rate limiting for verification requests
   - Validate message age and format
   - Check for replay attacks using nonce

3. **Session Management**
   - Use secure storage for session data
   - Implement session expiration
   - Clear sensitive data on logout
   - Use HTTPS for all API calls

4. **Error Handling**
   - Implement proper error recovery
   - Log security-related errors
   - Handle network errors with retry mechanism
   - Validate all user input

## Error Types

The SDK provides the following error types:

```typescript
import {
  WalletNotFoundError,    // When no wallet is found
  UserRejectedError,      // When user rejects an operation
  WalletConnectionError,  // When wallet connection fails
  MessageValidationError, // When message validation fails
  InvalidSignatureError,  // When signature verification fails
  TimeoutError,          // When an operation times out
  AddressValidationError // When address validation fails
} from '@keypass/login-sdk/errors';
```

Each error includes:
- `code`: Error type identifier
- `message`: Human-readable error message
- `details`: Additional error information (if available)

## API Reference

### Main Functions

```typescript
// Login with automatic wallet selection
loginWithPolkadot(retryCount?: number): Promise<LoginResult>

// Connect to a specific wallet
connectWallet(provider?: string): Promise<WalletAdapter>

// Build a login message
buildLoginMessage(params: MessageParams): Promise<string>
```

### Types

```typescript
interface LoginResult {
  address: string;    // Polkadot address
  signature: string;  // Message signature
  message: string;    // Signed message
  did: string;        // Generated DID
  issuedAt: string;   // ISO timestamp
  nonce: string;      // UUID nonce
}

interface WalletAccount {
  address: string;
  name?: string;
  source: string;
}

interface MessageParams {
  template: string;
  address: string;
  nonce: string;
  issuedAt: string;
  appName?: string;
}
```

### WalletAdapter Interface

```typescript
interface WalletAdapter {
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
  disconnect(): void;
}
```

## Best Practices

1. **Error Handling**
   - Always implement proper error handling
   - Use the provided error types
   - Implement retry logic for network errors
   - Provide user-friendly error messages

2. **Session Management**
   - Implement secure session storage
   - Handle session expiration
   - Clear sensitive data on logout
   - Implement proper session refresh

3. **Security**
   - Always verify signatures server-side
   - Implement rate limiting
   - Use HTTPS for all API calls
   - Validate all user input
   - Implement proper error logging

4. **User Experience**
   - Provide clear wallet installation guidance
   - Handle wallet connection states
   - Implement proper loading states
   - Provide clear error messages

## Migration Guide

### From v0.x to v1.0

1. Update error handling to use new error types
2. Implement new session management
3. Update verification service configuration
4. Update wallet connection handling

## Support

For issues and feature requests, please visit our [GitHub repository](https://github.com/uliana1one/keypass).

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details. 