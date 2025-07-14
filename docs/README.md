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

### **Backend Services Layer** (`proxy-server.cjs`)
- **Express proxy server** for API management
- **Credential data endpoints** (`/api/credentials`, `/api/offers`, `/api/requests`)
- **Verification endpoint** (`/api/verify`) for signature verification
- **Blockchain API proxying** (Etherscan, Alchemy, Polkadot RPC)
- **CORS handling and security headers**
- **External service integration** and API key management

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

### **Backend Services Features** (Available with Express proxy server)
- **API endpoints** for credential data and verification
- **Blockchain API proxying** for external service integration
- **CORS configuration** for web3 applications
- **Security headers** and rate limiting
- **Environment configuration** for API keys and settings

## Documentation Sections

### **Core Documentation**
- **[API Reference](./api.md)** - Complete API documentation for Core SDK functions and backend endpoints
- **[Integration Guide](./integration.md)** - How to integrate the SDK into your application with backend services
- **[Architecture Guide](./architecture.md)** - Technical architecture and design patterns including backend integration
- **[Tutorial](./tutorial.md)** - Step-by-step implementation guide with backend setup
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

### **3. Start Backend Proxy Server** (Required for API endpoints)
```bash
# From the main KeyPass directory (in a new terminal)
node proxy-server.cjs
# Backend starts on http://localhost:5000
```

### **4. Choose Your Integration Approach**

#### **Option A: Use Complete Examples** (Recommended)
```bash
# Copy React boilerplate with full identity features and backend integration
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

#### **Option C: Advanced Identity Features with Backend**
```typescript
// DID creation and management
import { DIDProvider } from '@keypass/login-sdk';
const didProvider = new DIDProvider();
const did = await didProvider.createDid(address);

// SBT/credential management with backend
const credentials = await fetch('/api/credentials').then(r => r.json());

// zkProof generation
import { ZKProofService } from '@keypass/login-sdk';
const zkService = new ZKProofService();
const proof = await zkService.generateProof(credential, circuit);

// Backend verification
const verification = await fetch('/api/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ signature, message, address })
});
```

## Integration Patterns

### **Pattern 1: Complete Identity Platform** (Recommended)
- Copy entire React boilerplate with DID Explorer, credential management, zkProof demo, and backend integration
- Customize styling and branding
- Deploy with full identity and privacy features
- Use backend for API management and external service integration

### **Pattern 2: Component Extraction** (Flexible)
- Extract specific components (DID Wizard, Credential Display, zkProof Generator)
- Integrate into existing applications
- Use backend for credential data and verification
- Maintain your current architecture while adding identity features

### **Pattern 3: Core SDK Integration** (Minimal)
- Use only the authentication and identity functions
- Build completely custom UI
- Maximum control over user experience
- Optional backend integration for API management

### **Pattern 4: Backend-First Integration** (Production)
- Start with backend proxy server for API management
- Add frontend components as needed
- Integrate with external blockchain services
- Build production-ready API endpoints

### **Pattern 5: Hybrid Integration** (Advanced)
- Mix Core SDK functions with example components
- Use backend for credential data and verification
- Customize specific flows while leveraging proven patterns
- Balance flexibility with development speed

## What's New in This Release

### **Advanced Identity Features**
- **DID Explorer Dashboard** with multi-step creation wizard and DID document preview
- **Credential/SBT Management** with grid display, request wizard, and privacy controls
- **zkProof Credential Demo** with circuit selection, proof generation, and verification
- **Privacy-Preserving Features** for secure credential sharing and verification

### **Backend Services Integration**
- **Express proxy server** for API management and external service integration
- **Credential data endpoints** for fetching and managing credentials
- **Blockchain API proxying** for Etherscan, Alchemy, and Polkadot RPC
- **Verification endpoints** for signature and credential verification
- **CORS and security** configuration for web3 applications

### **Enhanced Architecture**
- **Multi-layer architecture** supporting Core SDK, Frontend implementations, Backend services, and hybrid approaches
- **Comprehensive identity flows** from wallet connection to credential management with backend integration
- **Production-ready examples** with full identity, privacy, and backend features

### **Developer Experience**
- **Complete working examples** with DID creation, credential management, zkProof generation, and backend integration
- **Copy-paste ready code** with detailed comments and TypeScript support
- **Testing strategies** for all identity, privacy, and backend features
- **Production deployment** guidance with security best practices

## Learning Path

### **For Beginners**
1. Start with [Vanilla JavaScript Example](../examples/vanilla-boilerplate/)
2. Understand the authentication flow
3. Study wallet detection patterns
4. Experiment with customizations
5. Add backend integration for API management

### **For React Developers**
1. Start with [React Boilerplate](../examples/react-boilerplate/)
2. Study the DID Explorer dashboard and credential management
3. Understand zkProof generation and privacy features
4. Integrate backend services for credential data
5. Integrate with existing React apps
6. Customize for production use

### **For Identity/Privacy Developers**
1. Review [DID Wizard Guide](../examples/react-boilerplate/DID_WIZARD_README.md)
2. Study [Credential Implementation Guide](../examples/react-boilerplate/CREDENTIAL_IMPLEMENTATION_GUIDE.md)
3. Explore [zkProof Implementation Guide](../examples/react-boilerplate/ZK_PROOF_IMPLEMENTATION.md)
4. Implement privacy-preserving credential flows
5. Add backend integration for credential management

### **For Backend Developers**
1. Review [API Reference](./api.md) for backend endpoints
2. Study server verification patterns and proxy configuration
3. Implement secure session management and API key handling
4. Add production security measures and rate limiting
5. Integrate with DID and credential services
6. Extend backend with custom endpoints and external service integration

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
- Backend integration for credential data

### **Privacy-Preserving Features**
- zkProof generation for credential verification
- Circuit selection (Semaphore, PLONK, Groth16)
- Privacy-preserving credential sharing
- Zero-knowledge proof verification

### **Backend Services**
- API endpoints for credential data and verification
- Blockchain API proxying for external services
- CORS configuration for web3 applications
- Security headers and rate limiting
- Environment configuration for API keys

## Quick Links

- **[Get Started](./tutorial.md)** - Begin with the tutorial
- **[API Docs](./api.md)** - Core SDK function reference and backend endpoints
- **[Examples](../examples/)** - Complete implementation examples
- **[DID Explorer](../examples/react-boilerplate/)** - Full identity platform demo
- **[Backend Integration](./integration.md)** - Backend setup and API management
- **[GitHub](https://github.com/uliana1one/keypass)** - Source code and issues

---

**Ready to start?** Choose your integration approach and dive into the documentation that matches your needs!

**Tagline:** The wallet-based identity layer for the next billion Web3 learners.
