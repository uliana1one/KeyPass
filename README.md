# KeyPass Login SDK

A lightweight TypeScript SDK for implementing Polkadot wallet-based authentication in web applications. Replace traditional OAuth with secure, decentralized wallet signatures.

## Features

- 🔐 Wallet-based authentication using Polkadot wallets
- 🆔 Simple DID generation and verification
- 🔄 Support for multiple wallet adapters (Polkadot.js, Talisman, etc.)
- 📦 Zero dependencies (except for wallet connectors)
- 🧪 Comprehensive test coverage
- 📚 TypeScript-first with full type definitions

## Installation

```bash
npm install keypass-login-sdk
```

## Quick Start

```typescript
import { KeyPassLogin } from 'keypass-login-sdk';

const login = new KeyPassLogin({
  walletType: 'polkadot-js',
  appName: 'My DApp',
  network: 'polkadot'
});

// Login with wallet
const authResult = await login.authenticate();
// Returns: { address, did, signature, nonce, issuedAt }

// Verify signature on server
const isValid = await login.verifySignature(authResult);
```

## Architecture

The SDK follows a layered architecture:

1. **Config Layer**: Wallet and message format configurations
2. **Wallet Adapter Layer**: Wallet connection and interaction
3. **Account Layer**: Account fetching and selection
4. **Message Layer**: Authentication message assembly
5. **Signature Layer**: Message signing and verification
6. **DID Layer**: Decentralized identifier generation
7. **Server Layer**: Express middleware for signature verification
8. **Package Layer**: Build, test, and publish scripts

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## License

Apache License 2.0