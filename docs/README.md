# KeyPass Login SDK Documentation

Welcome to the KeyPass Login SDK documentation. This documentation provides comprehensive information about implementing **multi-chain wallet authentication** in your Web3 applications.

## Architecture Overview

The KeyPass Login SDK follows a **two-layer architecture**:

### **Core SDK Layer** (`src/`)
- **Wallet connection and authentication logic**
- **Message signing and verification**
- **DID (Decentralized Identifier) creation**
- **Multi-chain support** (Polkadot and Ethereum)
- **TypeScript interfaces and error handling**

### **Frontend Implementation Layer** (`examples/`)
- **Interactive wallet selection UI**
- **Account selection interfaces** 
- **Chain selection workflows**
- **Professional UI components** with dark theme and animations
- **Comprehensive error handling and user feedback**

## What's Available

### **Core SDK Features** (Available when you `npm install @keypass/login-sdk`)
- `loginWithPolkadot()` - Authenticate with Polkadot wallets
- `loginWithEthereum()` - Authenticate with Ethereum wallets  
- `connectWallet()` - Direct wallet connection
- Wallet adapters for Polkadot.js, Talisman, MetaMask
- Server verification endpoints
- TypeScript interfaces and error types

### **Example Implementation Features** (Available in the boilerplates)
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

#### **Option A: Use Complete Examples**
```bash
# Copy React boilerplate
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

#### **Option C: Custom UI + Core SDK**
```typescript
// Build your own wallet selection UI
import { detectPolkadotWallets } from './examples/walletDetection';
import { loginWithPolkadot } from '@keypass/login-sdk';

const wallets = await detectPolkadotWallets();
const selectedWallet = await showCustomWalletPicker(wallets);
const result = await loginWithPolkadot(selectedWallet);
```

## Integration Patterns

### **Pattern 1: Complete Example Integration** (Fastest)
- Copy entire React or Vanilla JS boilerplate
- Customize styling and branding
- Deploy with minimal changes

### **Pattern 2: Component Extraction** (Flexible)
- Extract specific components from examples
- Integrate into existing applications
- Maintain your current architecture

### **Pattern 3: Core SDK Integration** (Minimal)
- Use only the authentication functions
- Build completely custom UI
- Maximum control over user experience

## What's New in This Release

### **Enhanced Architecture**
- **Clear separation** between Core SDK and Frontend implementations
- **Multiple integration approaches** for different use cases
- **Comprehensive documentation** with accurate feature attribution

### **Wallet Selection Features**
- **Interactive UI components** for wallet and account selection
- **Multi-wallet support** with auto-detection
- **Professional styling** with responsive design
- **Error handling** with user-friendly messages

### **Developer Experience**
- **Complete working examples** in React and Vanilla JavaScript
- **Copy-paste ready code** with detailed comments
- **Testing strategies** for both Core SDK and UI components
- **Production deployment** guidance

## Learning Path

### **For Beginners**
1. Start with [Vanilla JavaScript Example](../examples/vanilla-boilerplate/)
2. Understand the authentication flow
3. Study wallet detection patterns
4. Experiment with customizations

### **For React Developers**
1. Start with [React Boilerplate](../examples/react-boilerplate/)
2. Study component architecture
3. Integrate with existing React apps
4. Customize for production use

### **For Backend Developers**
1. Review [API Reference](./api.md)
2. Study server verification patterns
3. Implement secure session management
4. Add production security measures

## Quick Links

- **[Get Started](./tutorial.md)** - Begin with the tutorial
- **[API Docs](./api.md)** - Core SDK function reference
- **[Examples](../examples/)** - Complete implementation examples
- **[GitHub](https://github.com/uliana1one/keypass)** - Source code and issues

---

**Ready to start?** Choose your integration approach and dive into the documentation that matches your needs!
