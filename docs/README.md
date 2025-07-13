# KeyPass Identity Platform Documentation

Welcome to the KeyPass Identity Platform documentation. KeyPass is a **self-sovereign login and identity system** that replaces "Sign in with Google" using decentralized identifiers (DIDs) and crypto wallets. Users can log into apps using their wallet, own their digital identity, and prove traits like age or student status via zk-proofs—all while maintaining privacy and data control.

## Architecture Overview

The KeyPass Identity Platform follows a **multi-layer architecture**:

### **Core SDK Layer** (`src/`)
- **Wallet connection and authentication logic**
- **Message signing and verification**
- **DID (Decentralized Identifier) creation and management**
- **Multi-chain support** (Polkadot and Ethereum)
- **SBT (Soulbound Token) service and credential management**
- **zkProof generation and verification**
- **TypeScript interfaces and error handling**

### **Frontend Implementation Layer** (`examples/`)
- **Interactive wallet selection UI**
- **DID Explorer dashboard** with multi-step creation wizard
- **Credential/SBT display and management**
- **zkProof credential demo** with privacy-preserving proofs
- **Account selection interfaces** 
- **Chain selection workflows**
- **Professional UI components** with dark theme and animations
- **Comprehensive error handling and user feedback**

## What's Available

### **Core SDK Features** (Available when you `npm install @keypass/login-sdk`)
- `loginWithPolkadot()` - Authenticate with Polkadot wallets
- `loginWithEthereum()` - Authenticate with Ethereum wallets  
- `connectWallet()` - Direct wallet connection
- **DID creation and management** (Polkadot and Ethereum DIDs)
- **SBT service** for credential and badge management
- **zkProof generation** for privacy-preserving credential verification
- Wallet adapters for Polkadot.js, Talisman, MetaMask
- Server verification endpoints
- TypeScript interfaces and error types

### **Example Implementation Features** (Available in the boilerplates)
- **DID Explorer Dashboard** with multi-step creation wizard
- **Credential/SBT Display** with grid and card layouts
- **zkProof Credential Demo** with circuit selection and proof generation
- Interactive wallet selection UI (chain → wallet → account)
- Wallet detection functions (`detectPolkadotWallets`, `detectEthereumWallets`)
- Account selection interfaces with metadata display
- Professional styling with glassmorphism design
- Comprehensive error handling with user-friendly messages
- Mobile-responsive layouts

## Documentation Sections

### **Core Documentation**
- **[API Reference](./api.md)** - Complete API documentation for Core SDK functions
- **[Integration Guide](./integration.md)** - How to integrate the SDK into your application
- **[Architecture Guide](./architecture.md)** - Technical architecture and design patterns
- **[Tutorial](./tutorial.md)** - Step-by-step implementation guide
- **[Error Handling](./errors.md)** - Error types and handling strategies
- **[Testing Guide](./testing.md)** - Testing strategies and mock implementations

### **Example Documentation**
- **[Examples Overview](../examples/README.md)** - Complete guide to frontend implementations
- **[Wallet Selection Guide](../examples/WALLET_SELECTION.md)** - Implementation patterns for wallet selection
- **[React Boilerplate](../examples/react-boilerplate/README.md)** - React implementation guide
- **[Vanilla JS Boilerplate](../examples/vanilla-boilerplate/README.md)** - Vanilla JavaScript implementation

### **Advanced Features Documentation**
- **[DID Wizard Guide](../examples/react-boilerplate/DID_WIZARD_README.md)** - DID creation wizard implementation
- **[Credential Implementation Guide](../examples/react-boilerplate/CREDENTIAL_IMPLEMENTATION_GUIDE.md)** - Credential management and display
- **[zkProof Implementation Guide](../examples/react-boilerplate/ZK_PROOF_IMPLEMENTATION.md)** - Privacy-preserving proof generation
- **[SBT Integration Guide](../examples/react-boilerplate/SBT_INTEGRATION_GUIDE.md)** - Soulbound token integration

### **Additional Resources**
- **[Protocols](./protocols.md)** - Supported blockchain protocols and standards
- **[Docker Testing](./docker-testing.md)** - Docker-based testing setup

## Quick Setup Guide

### **1. Install the Core SDK**
```bash
npm install @keypass/login-sdk
```

### **2. Start KeyPass Server** (Required for signature verification)
```bash
# From the main KeyPass directory
npm install
npm start
# Server starts on http://localhost:3000
```

### **3. Choose Your Integration Approach**

#### **Option A: Use Complete Examples** (Recommended)
```bash
# Copy React boilerplate with full identity features
cp -r examples/react-boilerplate/* your-project/

# Or copy Vanilla JS boilerplate  
cp -r examples/vanilla-boilerplate/* your-project/
```

#### **Option B: Core SDK Only**
```typescript
import { loginWithPolkadot, loginWithEthereum } from '@keypass/login-sdk';

// Simple authentication (auto-selects first available wallet)
const result = await loginWithPolkadot();
```

#### **Option C: Advanced Identity Features**
```typescript
// DID creation and management
import { DIDProvider } from '@keypass/login-sdk';
const didProvider = new DIDProvider();
const did = await didProvider.createDid(address);

// SBT/credential management
import { SBTService } from '@keypass/login-sdk';
const sbtService = new SBTService(config);
const tokens = await sbtService.getTokens(address);

// zkProof generation
import { ZKProofService } from '@keypass/login-sdk';
const zkService = new ZKProofService();
const proof = await zkService.generateProof(credential, circuit);
```

## Integration Patterns

### **Pattern 1: Complete Identity Platform** (Recommended)
- Copy entire React boilerplate with DID Explorer, credential management, and zkProof demo
- Customize styling and branding
- Deploy with full identity and privacy features

### **Pattern 2: Component Extraction** (Flexible)
- Extract specific components (DID Wizard, Credential Display, zkProof Generator)
- Integrate into existing applications
- Maintain your current architecture while adding identity features

### **Pattern 3: Core SDK Integration** (Minimal)
- Use only the authentication and identity functions
- Build completely custom UI
- Maximum control over user experience

### **Pattern 4: Hybrid Integration** (Advanced)
- Mix Core SDK functions with example components
- Customize specific flows while leveraging proven patterns
- Balance flexibility with development speed

## What's New in This Release

### **Advanced Identity Features**
- **DID Explorer Dashboard** with multi-step creation wizard and DID document preview
- **Credential/SBT Management** with grid display, request wizard, and privacy controls
- **zkProof Credential Demo** with circuit selection, proof generation, and verification
- **Privacy-Preserving Features** for secure credential sharing and verification

### **Enhanced Architecture**
- **Multi-layer architecture** supporting Core SDK, Frontend implementations, and hybrid approaches
- **Comprehensive identity flows** from wallet connection to credential management
- **Production-ready examples** with full identity and privacy features

### **Developer Experience**
- **Complete working examples** with DID creation, credential management, and zkProof generation
- **Copy-paste ready code** with detailed comments and TypeScript support
- **Testing strategies** for all identity and privacy features
- **Production deployment** guidance with security best practices

## Learning Path

### **For Beginners**
1. Start with [Vanilla JavaScript Example](../examples/vanilla-boilerplate/)
2. Understand the authentication flow
3. Study wallet detection patterns
4. Experiment with customizations

### **For React Developers**
1. Start with [React Boilerplate](../examples/react-boilerplate/)
2. Study the DID Explorer dashboard and credential management
3. Understand zkProof generation and privacy features
4. Integrate with existing React apps
5. Customize for production use

### **For Identity/Privacy Developers**
1. Review [DID Wizard Guide](../examples/react-boilerplate/DID_WIZARD_README.md)
2. Study [Credential Implementation Guide](../examples/react-boilerplate/CREDENTIAL_IMPLEMENTATION_GUIDE.md)
3. Explore [zkProof Implementation Guide](../examples/react-boilerplate/ZK_PROOF_IMPLEMENTATION.md)
4. Implement privacy-preserving credential flows

### **For Backend Developers**
1. Review [API Reference](./api.md)
2. Study server verification patterns
3. Implement secure session management
4. Add production security measures
5. Integrate with DID and credential services

## Key Features

### **Wallet-Based Authentication**
- Multi-chain support (Polkadot and Ethereum)
- Professional wallet selection UI
- Secure message signing and verification
- Comprehensive error handling

### **DID Management**
- DID creation and resolution
- Multi-chain DID support (Polkadot and Ethereum)
- DID document preview and management
- Advanced DID configuration options

### **Credential Management**
- SBT (Soulbound Token) display and management
- Credential request wizard
- Privacy controls and sharing options
- Revocation and verification features

### **Privacy-Preserving Features**
- zkProof generation for credential verification
- Circuit selection (Semaphore, PLONK, Groth16)
- Privacy-preserving credential sharing
- Zero-knowledge proof verification

## Quick Links

- **[Get Started](./tutorial.md)** - Begin with the tutorial
- **[API Docs](./api.md)** - Core SDK function reference
- **[Examples](../examples/)** - Complete implementation examples
- **[DID Explorer](../examples/react-boilerplate/)** - Full identity platform demo
- **[GitHub](https://github.com/uliana1one/keypass)** - Source code and issues

---

**Ready to start?** Choose your integration approach and dive into the documentation that matches your needs!

**Tagline:** The wallet-based identity layer for the next billion Web3 learners.
