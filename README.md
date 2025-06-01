# KeyPass - Polkadot Authentication SDK

KeyPass is a secure authentication SDK for Polkadot-based applications. It provides a simple way to implement wallet-based authentication using Polkadot.js and Talisman wallets.

## Features

- Secure wallet-based authentication
- Support for Polkadot.js and Talisman wallets
- DID (Decentralized Identifier) integration
- Message signing and verification
- Automatic retry for network errors
- Security best practices built-in
- Comprehensive error handling
- Session management utilities
- Message validation and sanitization

## Installation

Currently, this package is in development and not yet published to npm. There are several ways to test it in your project:

### Method 1: Using npm link (Recommended for local development)

This method is fully supported and recommended for local development:

1. Clone the repository:
```bash
git clone https://github.com/uliana1one/keypass.git
cd keypass
```

2. Install dependencies:
```bash
npm install
```

3. Build the package:
```bash
npm run build
```

4. Link it to your project:
```bash
npm link
```

5. In your project directory:
```bash
npm link @keypass/login-sdk
```

### Method 2: Using Git URL (For testing in other projects)

> **Note**: This method is currently being set up. For now, please use Method 1 (npm link) for testing.

In your project's `package.json`:
```json
{
  "dependencies": {
    "@keypass/login-sdk": "github:uliana1one/keypass"
  }
}
```

### Method 3: Using Local Path (For testing in other projects)

> **Note**: This method is currently being set up. For now, please use Method 1 (npm link) for testing.

In your project's `package.json`:
```json
{
  "dependencies": {
    "@keypass/login-sdk": "file:../path/to/keypass"
  }
}
```

> **Important**: While the package is in development, we recommend using Method 1 (npm link) for testing as it's the most reliable method at this stage. Other methods will be fully supported in future updates.

## Quick Start

Here's a basic example of how to use KeyPass in your application:

```typescript
import { loginWithPolkadot } from '@keypass/login-sdk';

async function handleLogin() {
  try {
    const result = await loginWithPolkadot();
    console.log('Logged in as:', result.address);
    console.log('DID:', result.did);
    
    // Store auth data in your preferred storage solution
    localStorage.setItem('auth', JSON.stringify(result));
  } catch (error) {
    if (error.code === 'WALLET_NOT_FOUND') {
      console.error('Please install a Polkadot wallet');
    } else if (error.code === 'USER_REJECTED') {
      console.error('Login was rejected by user');
    } else {
      console.error('Login failed:', error.message);
    }
  }
}
```

## Documentation

For detailed documentation, please refer to:

- [Integration Guide](./docs/integration.md) - Complete guide for integrating KeyPass into your application
- [API Reference](./docs/api.md) - Detailed API documentation
- [Security Guide](./docs/security.md) - Security best practices and considerations

## Key Features

### 1. Wallet Integration
- Support for Polkadot.js and Talisman wallets
- Automatic wallet detection
- Account management
- Message signing
- Connection state management

### 2. Security
- Server-side signature verification
- Message validation and sanitization
- Nonce-based replay attack prevention
- Rate limiting support
- Session management

### 3. Error Handling
- Comprehensive error types
- Automatic retry for network errors
- User-friendly error messages
- Detailed error logging

### 4. DID Support
- DID generation for Polkadot addresses
- DID resolution
- DID document management

## Prerequisites

Before using KeyPass, ensure:

1. Your application is served over HTTPS
2. Users have either [Polkadot.js](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/) wallet installed
3. Your backend is prepared to handle signature verification
4. You have a secure storage solution for session management

## Security Considerations

KeyPass implements several security measures:

1. **Message Validation**
   - All messages are validated and sanitized
   - Nonce-based replay attack prevention
   - Timestamp-based expiration

2. **Signature Verification**
   - Server-side signature verification
   - Rate limiting support
   - Message age validation

3. **Session Management**
   - Secure session storage
   - Session expiration
   - Proper cleanup on logout

4. **Error Handling**
   - Comprehensive error types
   - Proper error recovery
   - Security-focused logging


## Support

For issues and feature requests, please visit our [GitHub repository](https://github.com/uliana1one/keypass).

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.