# Multi-Chain Architecture Overview

The KeyPass Login SDK follows a **multi-chain 7-layer architecture** designed for modularity, security, and maintainability across both Polkadot and Ethereum ecosystems. Each layer has a specific responsibility and interacts with other layers through well-defined interfaces.

## Supported Chains

### Polkadot Ecosystem
- **Signature Algorithm**: SR25519/Ed25519
- **Address Format**: SS58 (base58 encoded)
- **DID Method**: `did:key` with multibase encoding
- **Wallets**: Polkadot.js, Talisman, WalletConnect

### Ethereum Ecosystem
- **Signature Algorithm**: ECDSA (secp256k1)
- **Address Format**: Hex (0x-prefixed)
- **DID Method**: `did:ethr` with Ethereum addresses
- **Wallets**: MetaMask, WalletConnect, injected providers

## Layer System

### 1. Config Layer (`src/config/`)
- **Purpose**: Multi-chain configuration management and validation
- **Components**:
  - Chain-specific wallet adapter configurations
  - Multi-chain message format templates
  - Chain-specific validation rules
- **Key Files**:
  - `config/validator.ts`: Multi-chain configuration validation
  - `config/messageFormat.json`: Chain-agnostic message templates

### 2. Wallet Adapter Layer (`src/adapters/`)
- **Purpose**: Multi-chain wallet interaction abstraction
- **Components**:
  - `WalletAdapter` interface (chain-agnostic)
  - **Polkadot**: PolkadotJsAdapter, TalismanAdapter
  - **Ethereum**: EthereumAdapter, MetaMaskAdapter
  - **Universal**: WalletConnectAdapter (supports both chains)
- **Key Features**:
  - Chain-specific wallet connection management
  - Multi-chain account listing
  - Chain-appropriate message signing
  - Unified error handling across chains

### 3. Account Layer (`src/accounts/`)
- **Purpose**: Multi-chain account management and selection
- **Components**:
  - Chain-agnostic account selection logic
  - Multi-format address validation (SS58 + Hex)
  - Chain-specific account metadata
- **Key Features**:
  - Cross-chain account handling
  - Address format detection and validation
  - Chain-specific account filtering

### 4. Message Layer (`src/message/`)
- **Purpose**: Chain-agnostic message handling and validation
- **Components**:
  - Universal message builder
  - Chain-agnostic template management
  - Multi-chain validation rules
- **Key Features**:
  - Unified message construction across chains
  - Chain-agnostic timestamp handling
  - Universal nonce generation
  - Multi-format validation

### 5. Signature Layer (`src/server/`)
- **Purpose**: Multi-chain cryptographic operations
- **Components**:
  - **UnifiedVerificationService**: Auto-routing verification service
  - **EthereumVerificationService**: ECDSA signature verification
  - **PolkadotVerificationService**: SR25519/Ed25519 verification
- **Key Features**:
  - **Automatic chain detection** from address format
  - **ECDSA support** for Ethereum (using ethers.js)
  - **SR25519/Ed25519 support** for Polkadot
  - **Unified response format** across chains
  - **Chain-specific message integrity** checks

### 6. DID Layer (`src/did/`)
- **Purpose**: Multi-chain decentralized identifier management
- **Components**:
  - **EthereumDIDProvider**: `did:ethr` method implementation
  - **PolkadotDIDProvider**: `did:key` method implementation
  - **Unified DID resolution** across chains
- **Key Features**:
  - **Chain-specific DID creation**
  - **Multi-chain DID document generation**
  - **Cross-chain address resolution**
  - **Unified DID interface**

### 7. Server Layer (`src/server/`)
- **Purpose**: Unified multi-chain API and middleware
- **Components**:
  - **Unified verification endpoint** (`/api/verify`)
  - **Chain-agnostic Express middleware**
  - **Multi-chain request validation**
  - **Unified error handling**
- **Key Features**:
  - **Single endpoint** for all chains
  - **Automatic chain detection**
  - **CORS support** for web3 applications
  - **Chain-specific security headers**
  - **Unified rate limiting**

## Multi-Chain Data Flow

### 1. **Chain Detection & Authentication Initiation**
   ```
   Client -> Config Layer -> Chain Detection -> Wallet Adapter Layer
   ```

### 2. **Chain-Specific Wallet Connection**
   ```
   Wallet Adapter Layer -> Account Layer -> Message Layer
   ```
   - **Polkadot**: PolkadotJsAdapter/TalismanAdapter
   - **Ethereum**: EthereumAdapter/MetaMaskAdapter
   - **Universal**: WalletConnectAdapter

### 3. **Chain-Appropriate Message Signing**
   ```
   Message Layer -> Wallet Adapter Layer -> Signature Layer
   ```
   - **Polkadot**: SR25519/Ed25519 signing
   - **Ethereum**: ECDSA (secp256k1) signing

### 4. **Unified Verification & DID Creation**
   ```
   Signature Layer -> UnifiedVerificationService -> Chain-Specific Verification -> DID Layer -> Server Layer -> Client
   ```
   - **Auto-detection**: Address format determines chain type
   - **Polkadot**: SR25519 verification → `did:key` creation
   - **Ethereum**: ECDSA verification → `did:ethr` creation

## Component Interactions

The layers interact in the following sequence:

1. Client initiates requests to the Server Layer
2. Server Layer coordinates two main flows:
   - Authentication Flow:
     * Server → Signature Layer (verifies signatures)
     * Signature Layer → DID Layer (creates/validates DIDs)
   - Message Flow:
     * Server → Message Layer (handles message format)
     * Message Layer → Account Layer (manages accounts)
     * Account Layer → Wallet Adapter Layer (connects to wallets)
     * Wallet Adapter Layer → Config Layer (loads settings)

Each layer only communicates with its immediate neighbors, maintaining a clean separation of concerns.

## Security Considerations

- Each layer implements its own security measures
- Cross-layer communication is strictly typed
- Error handling is consistent across layers
- Cryptographic operations are isolated
- Input validation at each layer

## Best Practices

1. **Layer Independence**
   - Each layer is independently testable
   - Dependencies flow downward
   - No circular dependencies

2. **Error Handling**
   - Errors are caught at the appropriate layer
   - Error types are specific to each layer
   - Error messages are user-friendly

3. **Type Safety**
   - TypeScript interfaces for all layer boundaries
   - Runtime type checking where necessary
   - Comprehensive type definitions

4. **Testing**
   - Unit tests for each layer
   - Integration tests for layer interactions
   - End-to-end tests for complete flows

## Core Components

### Wallet Connection Layer

The wallet connection system provides a unified interface for different wallet types:

1. Main Entry Point: `connectWallet`
   - Attempts to connect to available wallets in priority order
   - Handles connection errors and retries

2. Common Interface: `WalletAdapter`
   - Standard methods for all wallet types:
     * enable(): Connect to wallet
     * getAccounts(): List available accounts
     * signMessage(): Sign authentication messages
     * getProvider(): Get wallet provider info
     * disconnect(): End wallet session
     * Event handling (on/off)

3. Supported Wallet Types:
   - Polkadot.js (Priority 1)
   - Talisman (Priority 2)
   - WalletConnect (Priority 3)

Each wallet adapter implements the same interface, allowing the system to work with any supported wallet type.

### Authentication Flow

The authentication process follows these steps:

1. Client initiates wallet connection
2. User selects an account and signs a login message
3. Server verifies the signature:
   - First attempts sr25519 verification
   - If that fails, tries ed25519 verification
   - Retries on network errors
4. On successful verification, creates a DID for the address
5. Generates and returns a session with verification data

### DID Management

The DID system works as follows:

1. Creates a DID from a Polkadot address using the did:key method
2. Generates a DID document containing:
   - A verification method (public key)
   - Authentication capability
   - Assertion capability
   - Invocation and delegation capabilities
3. Provides DID resolution to look up and validate documents
4. Manages capability verification for actions

## Wallet Adapters

### Common Interface

All wallet adapters implement the `WalletAdapter` interface:

```typescript
interface WalletAdapter {
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
  disconnect(): Promise<void>;
  on(event: string, callback: EventHandler): void;
  off(event: string, callback: EventHandler): void;
}
```

### Adapter Types

1. **PolkadotJsAdapter**
   - Connects to the Polkadot.js browser extension
   - Uses `@polkadot/extension-dapp`
   - Priority: 1

2. **TalismanAdapter**
   - Connects to the Talisman wallet extension
   - Uses Talisman's injected provider
   - Priority: 2

3. **WalletConnectAdapter**
   - Connects to any wallet supporting WalletConnect
   - Uses `@walletconnect/web3-provider`
   - Requires WalletConnect project ID
   - Priority: 3

## Error Handling

The SDK uses a hierarchical error system:

```
Error
├── WalletError
│   ├── WalletNotFoundError
│   ├── UserRejectedError
│   ├── TimeoutError
│   └── WalletConnectionError
├── ValidationError
│   ├── MessageValidationError
│   └── AddressValidationError
└── AuthenticationError
    ├── InvalidSignatureError
    └── ConfigurationError
```

## Configuration

The SDK can be configured through:

1. Environment variables:
   ```
   WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

2. Wallet configuration (wallets.json):
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

## Security Considerations

1. **Message Signing**
   - Messages are validated and sanitized
   - Signatures are verified
   - Nonces prevent replay attacks

2. **Session Management**
   - Sessions expire after a configurable timeout
   - DIDs provide verifiable identity
   - Secure headers protect against common web vulnerabilities

3. **WalletConnect Security**
   - Project ID required for WalletConnect
   - Session encryption
   - Chain ID validation
   - Address validation 