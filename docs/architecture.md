# Architecture Overview

The KeyPass Login SDK follows a **two-layer architecture** that separates core authentication logic from user interface implementations, providing flexibility for developers to choose their integration approach.

## Architectural Layers

### **Layer 1: Core SDK** (`src/`)
**Purpose**: Provides the fundamental authentication logic and identity primitives
- **Wallet connection and management**
- **Message signing and verification**
- **DID (Decentralized Identifier) creation and management**
- **Multi-chain support** (Polkadot and Ethereum)
- **Credential and SBT support**
- **zkProof generation and verification**
- **Error handling and validation**

### **Layer 2: Frontend Examples** (`examples/`)
**Purpose**: Demonstrates complete user experience implementations
- **Interactive wallet selection interfaces**
- **Account selection workflows**
- **Chain selection UI components**
- **DID Explorer dashboard with multi-step wizard**
- **Credential/SBT display and management**
- **zkProof credential demo and privacy controls**
- **Professional styling and animations**
- **Comprehensive error handling UI**

## 🧩 New Additions: DID Explorer, Credential Dashboard, zkProof Demo

### **DID Explorer Dashboard (React Boilerplate)**
- Implements a **multi-step wizard** for DID creation:
  1. **DID Type**: Choose between Basic and Advanced DID
  2. **Configuration**: (Advanced only) Set purpose, attributes, endpoints
  3. **Preview**: Review DID document and features
  4. **Create**: Confirm and generate DID
- **Fixed-stepper UI**: Always shows all steps for clarity, even if some are skipped in navigation (e.g., Basic DID skips Configuration but step is still visible and inactive)
- **Componentized logic**: Each step is a separate render function, with state managed in the wizard parent
- **Integration with core SDK**: Calls DID creation and preview logic from the SDK layer

### **Credential & SBT Dashboard**
- **Credential display**: Grid and card components for issued credentials and SBTs
- **Credential request wizard**: Multi-step flow for requesting new credentials, selecting claims, and privacy settings
- **SBT display**: Grid and card UI for badges and SBTs, with support for demo/test/real data modes
- **Integration with core SDK**: Uses credential and SBT service APIs for fetching, issuing, and revoking credentials

### **zkProof Credential Demo**
- **Proof generation UI**: Stepper for selecting credential, circuit, and generating proof (Semaphore, PLONK, Groth16)
- **Privacy controls**: Selective disclosure, proof sharing, and verification
- **Integration with core SDK**: Calls zkProof service for proof generation and verification

## 🔧 Core SDK Architecture (7-Layer System)

The core SDK implements a clean 7-layer architecture focused on authentication and identity logic:

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

## Example Implementation Architecture

The examples demonstrate how to build complete user experiences on top of the core SDK:

### **React Boilerplate Architecture** (`examples/react-boilerplate/`)
```
┌──────────────────────────────────────────────┐
│                App Component                │
├──────────────────────────────────────────────┤
│  State Management:                          │
│  • Chain selection state                    │
│  • Wallet detection results                 │
│  • Account selection state                  │
│  • Authentication state                     │
│  • DID wizard state (step, options, preview)│
│  • Credential/SBT/zkProof dashboard state   │
├──────────────────────────────────────────────┤
│  UI Flow Management:                        │
│  • Chain Selection View                     │
│  • Wallet Selection View                    │
│  • Account Selection View                   │
│  • DID Creation Wizard (multi-step)         │
│  • Credential Dashboard                     │
│  • SBT Display                              │
│  • zkProof Generation/Verification          │
│  • Authentication Success View              │
├──────────────────────────────────────────────┤
│  Core SDK Integration:                      │
│  • connectWallet()                          │
│  • loginWithPolkadot()/loginWithEthereum()  │
│  • createDID(), previewDID()                │
│  • getCredentials(), requestCredential()     │
│  • generateZKProof()                        │
└──────────────────────────────────────────────┘
```

### **Multi-Step Wizard Pattern**
- **Fixed stepper**: UI always shows all steps (DID Type, Configuration, Preview, Create)
- **Conditional navigation**: For Basic DID, Configuration step is skipped in logic but shown as inactive in UI
- **Extensible**: New steps or flows (e.g., credential issuance, proof generation) can be added with minimal changes

### **Component Interactions**
- **DIDWizard**: Manages step state, options, and preview; interacts with core SDK for DID logic
- **CredentialSection/SBTSection**: Fetches and displays credentials/SBTs; handles requests and revocations
- **ZKProofGenerator**: Handles proof configuration, generation, and verification
- **All dashboard components**: Share state via parent App or context, and call core SDK APIs for all blockchain/identity operations

## Data Flow Patterns

### **DID Creation Flow**
```
User
  ↓
DIDWizard (stepper UI)
  ↓
User selects type/options
  ↓
DIDWizard calls previewDID()/createDID() from core SDK
  ↓
DID document preview/generated
  ↓
Result passed to dashboard/profile
```

### **Credential/zkProof Flow**
```
User
  ↓
CredentialRequestWizard / ZKProofGenerator
  ↓
User selects credential, claims, privacy
  ↓
Component calls core SDK (requestCredential, generateZKProof)
  ↓
Credential/proof issued or verified
  ↓
Result displayed in dashboard
```

## Architecture Benefits

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

## Component Interactions

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

## Security Considerations

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

## Testing Strategy

### **Core SDK Testing**
- **Unit tests**: Each layer tested independently
- **Integration tests**: Layer interactions validated
- **End-to-end tests**: Complete authentication flows

### **Example Testing**
- **UI component tests**: Interface behavior validation
- **Integration tests**: Core SDK integration verification
- **User experience tests**: Complete workflow validation

## Deployment Patterns

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