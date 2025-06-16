# Architecture Overview

The KeyPass Login SDK follows a **two-layer architecture** that separates core authentication logic from user interface implementations, providing flexibility for developers to choose their integration approach.

## 🏗️ Architectural Layers

### **Layer 1: Core SDK** (`src/`)
**Purpose**: Provides the fundamental authentication and wallet connection logic
- **Wallet connection and management**
- **Message signing and verification** 
- **DID (Decentralized Identifier) creation and management**
- **Multi-chain support** (Polkadot and Ethereum)
- **Error handling and validation**

### **Layer 2: Frontend Examples** (`examples/`)
**Purpose**: Demonstrates complete user experience implementations
- **Interactive wallet selection interfaces**
- **Account selection workflows**
- **Chain selection UI components**
- **Professional styling and animations**
- **Comprehensive error handling UI**

## 🔧 Core SDK Architecture (7-Layer System)

The core SDK implements a clean 7-layer architecture focused on authentication logic:

### 1. Config Layer (`src/config/`)
- **Purpose**: Configuration management and validation
- **Components**:
  - Wallet adapter configurations
  - Message format templates
  - Validation rules
- **Key Files**:
  - `config/validator.ts`: Configuration validation
  - `config/messageFormat.json`: Message templates

### 2. Wallet Adapter Layer (`src/adapters/`)
- **Purpose**: Multi-chain wallet interaction abstraction
- **Components**:
  - `WalletAdapter` interface (chain-agnostic)
  - **Polkadot**: PolkadotJsAdapter, TalismanAdapter
  - **Ethereum**: EthereumAdapter  
  - **Universal**: WalletConnectAdapter (supports both chains)
- **Key Features**:
  - Chain-specific wallet connection management
  - Multi-chain account listing
  - Chain-appropriate message signing
  - Unified error handling across chains

### 3. Account Layer (`src/accounts/`)
- **Purpose**: Basic account management
- **Components**:
  - Simple account selection logic (`selectAccount()`)
  - Address validation
  - Account metadata handling
- **Note**: Advanced account selection UI is implemented in examples

### 4. Message Layer (`src/message/`)
- **Purpose**: Chain-agnostic message handling and validation
- **Components**:
  - Universal message builder
  - Template management
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
  - **PolkadotVerificationService**: SR25519/Ed25519 verification (via VerificationService)
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
  - **PolkadotDIDProvider** (UUIDProvider): `did:key` method implementation
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

## 🎨 Example Implementation Architecture

The examples demonstrate how to build complete user experiences on top of the core SDK:

### **React Boilerplate Architecture** (`examples/react-boilerplate/`)
```
┌─────────────────────────────────────┐
│            App Component            │
├─────────────────────────────────────┤
│  State Management:                  │
│  • Chain selection state           │
│  • Wallet detection results        │
│  • Account selection state         │
│  • Authentication state            │
├─────────────────────────────────────┤
│  UI Flow Management:                │
│  • Chain Selection View            │
│  • Wallet Selection View           │
│  • Account Selection View          │
│  • Authentication Success View     │
├─────────────────────────────────────┤
│  Core SDK Integration:              │
│  • connectWallet()                  │
│  • loginWithPolkadot()             │
│  • loginWithEthereum()             │
└─────────────────────────────────────┘
```

### **Vanilla Boilerplate Architecture** (`examples/vanilla-boilerplate/`)
```
┌─────────────────────────────────────┐
│           Single HTML File          │
├─────────────────────────────────────┤
│  JavaScript Functions:              │
│  • detectPolkadotWallets()         │
│  • detectEthereumWallets()          │
│  • getPolkadotAccounts()           │
│  • getEthereumAccounts()           │
│  • authenticateWith*()             │
├─────────────────────────────────────┤
│  UI Management:                     │
│  • showWalletSelection()           │
│  • Dynamic DOM manipulation        │
│  • Event handling                  │
├─────────────────────────────────────┤
│  Core Logic:                        │
│  • Direct wallet API calls         │
│  • Message signing                 │
│  • Server verification             │
└─────────────────────────────────────┘
```

## 🔄 Data Flow Patterns

### **Core SDK Flow** (Basic Authentication)
```
Client App
    ↓
loginWithPolkadot() / loginWithEthereum()
    ↓
connectWallet() (Auto-detects available wallets)
    ↓
WalletAdapter.enable() → WalletAdapter.getAccounts()
    ↓
WalletAdapter.signMessage()
    ↓
Server Verification (/api/verify)
    ↓
DID Creation
    ↓
LoginResult
```

### **Example Implementation Flow** (Full UI Experience)
```
Client App
    ↓
Chain Selection UI (Polkadot vs Ethereum)
    ↓
detectPolkadotWallets() / detectEthereumWallets()
    ↓
Wallet Selection UI (List available wallets)
    ↓
getPolkadotAccounts() / getEthereumAccounts()
    ↓
Account Selection UI (Choose specific account)
    ↓
authenticateWithPolkadot() / authenticateWithEthereum()
    ↓
Core SDK Authentication Flow
    ↓
Authentication Success UI
```

## 🏆 Architecture Benefits

### **Separation of Concerns**
- **Core SDK**: Focuses purely on authentication logic
- **Examples**: Handle all UI/UX considerations
- **Clear boundaries**: Easy to understand what belongs where

### **Flexibility**
- **Use core SDK only**: For custom UI implementations
- **Use examples as base**: For rapid development
- **Mix and match**: Copy specific components from examples

### **Maintainability**
- **Independent testing**: Core logic and UI tested separately
- **Framework agnostic**: Core SDK works with any frontend framework
- **Clear dependencies**: Examples depend on core SDK, not vice versa

## 🔍 Component Interactions

### **Within Core SDK**
The layers interact in a strict hierarchy:
1. Client calls Server Layer functions
2. Server Layer coordinates with other layers:
   - Authentication Flow: Server → Signature → DID
   - Message Flow: Server → Message → Account → Adapter → Config

### **Between Core SDK and Examples**
Examples use core SDK functions as building blocks:
- **Import core functions**: `import { connectWallet, loginWithPolkadot } from '@keypass/login-sdk'`
- **Add UI layer**: Implement wallet detection, selection interfaces
- **Handle user interaction**: Convert UI events to core SDK function calls

## 🛡️ Security Considerations

### **Core SDK Security**
- Each layer implements its own security measures
- Cross-layer communication is strictly typed
- Error handling is consistent across layers
- Cryptographic operations are isolated
- Input validation at each layer

### **Example Security**
- UI validation before calling core SDK functions
- Secure handling of sensitive data in UI state
- Proper error display without exposing internals
- Safe wallet extension interaction

## 🧪 Testing Strategy

### **Core SDK Testing**
- **Unit tests**: Each layer tested independently
- **Integration tests**: Layer interactions validated
- **End-to-end tests**: Complete authentication flows

### **Example Testing**
- **UI component tests**: Interface behavior validation
- **Integration tests**: Core SDK integration verification
- **User experience tests**: Complete workflow validation

## 🚀 Deployment Patterns

### **Core SDK Only** (Minimal)
```
Your App → @keypass/login-sdk → KeyPass Server
```

### **With Examples** (Complete)
```
Your App → Example UI Components → Core SDK → KeyPass Server
```

### **Hybrid** (Customized)
```
Your App → Custom UI + Example Components → Core SDK → KeyPass Server
```

This architecture provides maximum flexibility while maintaining clear separation between authentication logic and user interface implementation. 