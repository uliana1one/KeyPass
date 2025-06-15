# KeyPass - Multi-Chain Authentication SDK

KeyPass is a secure authentication SDK for blockchain-based applications. It provides a simple way to implement wallet-based authentication with support for both **Polkadot** and **Ethereum** ecosystems.

## Features

- **Multi-Chain Support**: Polkadot and Ethereum wallet authentication
- **Unified Verification**: Single API endpoint for all supported chains
- **Automatic Chain Detection**: Smart routing based on address format
- **Secure Wallet Integration**: Support for Polkadot.js, Talisman, and Ethereum wallets
- **Server-Side Verification**: ECDSA and SR25519 signature verification
- **DID Integration**: Decentralized Identifier support for both chains
- **Message Signing and Verification**: Secure message-based authentication
- **Automatic Retry**: Network error recovery
- **Security Best Practices**: Built-in security measures
- **Comprehensive Error Handling**: Detailed error types and recovery
- **Session Management**: Secure session utilities
- **Message Validation**: Input sanitization and validation

## Supported Chains

### Polkadot Ecosystem
- **Signature Algorithm**: SR25519
- **Address Format**: SS58 (e.g., `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`)
- **Supported Wallets**: Polkadot.js, Talisman
- **DID Method**: `did:key` with multibase encoding

### Ethereum Ecosystem  
- **Signature Algorithm**: ECDSA (secp256k1)
- **Address Format**: Hex (e.g., `0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b`)
- **Supported Wallets**: MetaMask, WalletConnect, and other Ethereum wallets
- **DID Method**: `did:ethr` with Ethereum addresses

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

Here are examples of how to use KeyPass with different blockchain networks:

### Polkadot Authentication

```typescript
import { loginWithPolkadot } from '@keypass/login-sdk';

async function handlePolkadotLogin() {
  try {
    const result = await loginWithPolkadot();
    console.log('Logged in as:', result.address);
    console.log('DID:', result.did);
    
    // Store auth data in your preferred storage solution
    localStorage.setItem('polkadot-auth', JSON.stringify(result));
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

### Ethereum Authentication

```typescript
import { loginWithEthereum } from '@keypass/login-sdk';

async function handleEthereumLogin() {
  try {
    const result = await loginWithEthereum();
    console.log('Logged in as:', result.address);
    console.log('DID:', result.did);
    
    // Store auth data in your preferred storage solution
    localStorage.setItem('ethereum-auth', JSON.stringify(result));
  } catch (error) {
    if (error.code === 'WALLET_NOT_FOUND') {
      console.error('Please install MetaMask or another Ethereum wallet');
    } else if (error.code === 'USER_REJECTED') {
      console.error('Login was rejected by user');
    } else {
      console.error('Login failed:', error.message);
    }
  }
}
```

### Server-Side Verification

The SDK provides a unified verification endpoint that automatically detects the chain type:

```typescript
// Server-side verification (Node.js/Express)
import { UnifiedVerificationService } from '@keypass/login-sdk/server';

const verificationService = new UnifiedVerificationService();

app.post('/api/verify', async (req, res) => {
  try {
    const { message, signature, address } = req.body;
    
    // Automatically detects chain type from address format
    const result = await verificationService.verifySignature({
      message,
      signature, 
      address
    });
    
    if (result.status === 'success') {
      console.log('Verified DID:', result.did);
      console.log('Chain type:', result.data.chainType); // 'polkadot' or 'ethereum'
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Documentation

For detailed documentation, please refer to:

- [Integration Guide](./docs/integration.md) - Complete guide for integrating KeyPass into your application
- [API Reference](./docs/api.md) - Detailed API documentation
- [Security Guide](./docs/security.md) - Security best practices and considerations

## Key Features

### 1. Multi-Chain Wallet Integration
- **Polkadot**: Polkadot.js and Talisman wallet support
- **Ethereum**: MetaMask, WalletConnect, and other Ethereum wallets
- **Automatic Detection**: Smart wallet detection and connection
- **Account Management**: Multi-account support across chains
- **Message Signing**: Chain-specific message signing protocols
- **Connection State Management**: Robust connection handling

### 2. Unified Server-Side Verification
- **Multi-Chain Support**: Single endpoint for Polkadot and Ethereum
- **Automatic Chain Detection**: Routes based on address format
- **ECDSA Verification**: Ethereum signature verification using ethers.js
- **SR25519 Verification**: Polkadot signature verification
- **Message Validation**: Format and security validation
- **DID Integration**: Automatic DID creation for verified addresses

### 3. Security
- **Server-Side Signature Verification**: Cryptographic signature validation
- **Message Validation and Sanitization**: Input security measures
- **Nonce-Based Replay Attack Prevention**: UUID-based nonces
- **Time-Based Expiration**: 5-minute message expiration window
- **Rate Limiting Support**: Built-in protection mechanisms
- **Secure Session Management**: Best-practice session handling

### 4. Error Handling & Reliability
- **Comprehensive Error Types**: Detailed error classification
- **Automatic Retry**: Network error recovery with exponential backoff
- **User-Friendly Messages**: Clear error communication
- **Detailed Logging**: Security-focused error logging
- **Chain-Specific Errors**: Tailored error handling per blockchain

### 5. DID Support
- **Multi-Chain DIDs**: Support for both Polkadot and Ethereum
- **Polkadot DIDs**: `did:key` method with multibase encoding
- **Ethereum DIDs**: `did:ethr` method with Ethereum addresses
- **DID Resolution**: Resolve DIDs to addresses and documents
- **DID Document Management**: Complete DID document creation

## Prerequisites

Before using KeyPass, ensure:

1. **HTTPS Required**: Your application is served over HTTPS
2. **Wallet Installation**: Users have appropriate wallets installed:
   - **For Polkadot**: [Polkadot.js](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/) wallet
   - **For Ethereum**: [MetaMask](https://metamask.io/) or other Ethereum-compatible wallets
3. **Backend Setup**: Your backend implements the unified verification endpoint
4. **Secure Storage**: You have a secure storage solution for session management
5. **CORS Configuration**: Proper CORS setup for cross-origin requests

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