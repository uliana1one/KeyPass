# KeyPass Login SDK Documentation

Welcome to the KeyPass Login SDK documentation. This documentation provides comprehensive information about implementing **multi-chain wallet authentication** in your Web3 applications.

## 🏗️ Architecture Overview

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
- **Professional UI components** with dark theme and glassmorphism design
- **Complete user experience flows**

## 🚀 What's Available

### ✅ **Core SDK Features** (Available when you `npm install @keypass/login-sdk`)
- **`loginWithPolkadot()`**: Complete Polkadot authentication
- **`loginWithEthereum()`**: Complete Ethereum authentication  
- **`connectWallet()`**: Multi-wallet connection with auto-detection
- **Wallet Adapters**: PolkadotJs, Talisman, WalletConnect, Ethereum
- **DID Providers**: Automatic DID creation for both chains
- **Verification Service**: Server-side signature verification

### ✅ **Example Implementation Features** (Available in the boilerplates)
- **Interactive wallet selection UI**: Professional modal interfaces
- **Multi-step selection flow**: Chain → Wallet → Account → Authentication
- **Wallet detection functions**: Auto-discovery of installed wallets
- **Account selection interface**: Interactive account picker with metadata
- **Error handling UI**: User-friendly error messages and retry logic
- **Mobile-responsive design**: Works on all devices

## 📚 Documentation Sections

1. **[Architecture Overview](architecture.md)**
   - Core SDK vs Frontend implementation distinction
   - Multi-chain authentication patterns
   - Component interactions and data flow

2. **[API Reference](api.md)**
   - **Core SDK APIs**: Functions available when you install the library
   - **Example Implementation APIs**: Frontend utilities in the boilerplates
   - Multi-chain type definitions and interfaces

3. **[Integration Guide](integration.md)**
   - **Using the Core SDK**: How to implement basic authentication
   - **Using the Examples**: How to implement the full UI experience
   - Server setup and configuration

4. **[Tutorial](tutorial.md)**
   - **Basic Integration**: Using just the core SDK functions
   - **Full UI Implementation**: Building wallet selection like the examples
   - Best practices and common patterns

5. **[Error Handling](errors.md)**
   - Core SDK error types and handling
   - Example UI error handling patterns
   - Troubleshooting guide

6. **[Testing](testing.md)**
   - Core SDK testing strategies
   - [Docker Testing](docker-testing.md) - Containerized test environment
   - Frontend testing approaches

7. **[Protocols](protocols.md)**
   - Multi-chain authentication protocols
   - Wallet communication standards
   - Security protocols and best practices

## 🛠️ Quick Setup Guide

### 1. **Start the KeyPass Server**
```bash
# From the root KeyPass directory
cd /path/to/KeyPass
npm start
```

### 2. **Choose Your Integration Approach**

#### **Option A: Use the Complete Examples** (Recommended for new projects)
```bash
# React Boilerplate (includes full wallet selection UI)
cd examples/react-boilerplate
npm install
npm start

# Vanilla JavaScript Boilerplate (zero dependencies)
cd examples/vanilla-boilerplate
python3 -m http.server 8006
# Open http://localhost:8006
```

#### **Option B: Use Just the Core SDK** (For custom implementations)
```bash
npm install @keypass/login-sdk
```

```typescript
import { loginWithPolkadot, loginWithEthereum } from '@keypass/login-sdk';

// Basic Polkadot login (no UI)
const result = await loginWithPolkadot();

// Basic Ethereum login (no UI)  
const result = await loginWithEthereum();
```

### 3. **Test the Experience**
- Install wallet extensions (Polkadot.js, MetaMask, etc.)
- Navigate to the example applications
- Experience the complete wallet selection flow

## 💡 Integration Patterns

### **Pattern 1: Use the Examples as Starting Point** (Fastest)
1. Copy the React or Vanilla boilerplate
2. Customize the UI to match your brand
3. Modify the authentication flow as needed
4. Deploy alongside the KeyPass server

### **Pattern 2: Build Custom UI with Core SDK** (Most Flexible)
1. Install the core SDK: `npm install @keypass/login-sdk`
2. Use `connectWallet()` for wallet detection
3. Use `loginWithPolkadot()` or `loginWithEthereum()` for authentication
4. Build your own wallet selection UI
5. Handle errors and loading states

### **Pattern 3: Hybrid Approach** (Balanced)
1. Use core SDK functions for authentication logic
2. Copy UI components from examples for wallet selection
3. Customize styling and user experience
4. Maintain separation between logic and presentation

## 🎯 What's New in This Release

### **Enhanced Developer Experience**
- **Clear architecture separation**: Distinguish between core SDK and UI implementations
- **Multiple integration options**: Choose the approach that fits your needs
- **Comprehensive examples**: Both React and vanilla JavaScript implementations
- **Detailed documentation**: Clear guidance on where each feature lives

### **Complete User Experience** (Available in Examples)
- **Step-by-step selection**: Users choose chain → wallet → account in a guided flow
- **Visual feedback**: Loading states, success indicators, and clear error messages
- **Professional design**: Dark theme with glassmorphism effects and smooth animations
- **Mobile optimization**: Responsive design that works on all devices

### **Robust Core SDK** (Available when you install the library)
- **Enhanced wallet detection**: Robust detection with retry logic and fallbacks
- **Better error handling**: Specific error types for different wallet scenarios
- **Improved TypeScript support**: Enhanced type definitions and interfaces
- **Security enhancements**: Updated authentication flows and validation

## 📚 Learning Path

### **I want the full experience (UI + Auth)**
1. Start with [Tutorial](tutorial.md) - Section: "Using the Complete Examples"
2. Try the [React Boilerplate](../examples/react-boilerplate/) or [Vanilla Boilerplate](../examples/vanilla-boilerplate/)
3. Customize the UI and deploy

### **I want to build my own UI**
1. Review [API Reference](api.md) - Section: "Core SDK APIs"
2. Follow [Integration Guide](integration.md) - Section: "Using the Core SDK"
3. Check [Architecture Overview](architecture.md) for patterns

### **I want to understand everything**
1. Read [Architecture Overview](architecture.md) for the complete picture
2. Explore both the core SDK source and example implementations
3. Review [Protocols](protocols.md) for security considerations

## 🔗 Quick Links

- **[Live Examples](../examples/)** - Complete wallet selection experiences
- **[Core SDK Source](../src/)** - Authentication and wallet connection logic
- **[GitHub Repository](https://github.com/uliana1one/keypass)** - Source code and issues
- **[Issue Tracker](https://github.com/uliana1one/keypass/issues)** - Bug reports and feature requests

## 🆘 Need Help?

- **"Where is feature X?"**: Check the [Architecture Overview](architecture.md) to understand what's in the core SDK vs examples
- **Setup Issues**: Check the [Integration Guide](integration.md) troubleshooting section
- **Wallet Problems**: Review [Error Handling](errors.md) for wallet-specific solutions
- **Code Examples**: Explore the [examples directory](../examples/) for working implementations
- **Community Support**: Visit [GitHub Discussions](https://github.com/uliana1one/keypass/discussions)

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 
