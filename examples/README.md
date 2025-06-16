# �� KeyPass Examples & Frontend Implementations

Welcome to the **KeyPass Examples** directory! Here you'll find **complete frontend implementations** that demonstrate how to build wallet selection and authentication experiences on top of the KeyPass Core SDK.

## 🏗️ What These Examples Provide

### **Frontend Implementation Features** (What you get in these examples)
- ✅ **Complete wallet selection UI**: Interactive chain → wallet → account selection flow
- ✅ **Wallet detection functions**: Auto-discovery of installed browser extensions
- ✅ **Account selection interfaces**: Interactive account picker with metadata display
- ✅ **Professional styling**: Modern UI with animations and responsive design
- ✅ **Comprehensive error handling**: User-friendly error messages and retry logic
- ✅ **Multi-chain support**: Both Polkadot and Ethereum authentication flows

### **Core SDK Integration** (What the examples use underneath)
- ✅ **Authentication logic**: Uses `loginWithPolkadot()` and `loginWithEthereum()` from Core SDK
- ✅ **Wallet connections**: Uses `connectWallet()` for actual wallet communication
- ✅ **Message signing**: Uses Core SDK adapters for signature operations
- ✅ **Server verification**: Communicates with KeyPass server for signature verification

## 📁 Available Examples

### 🔷 [React Boilerplate](./react-boilerplate/)
**Complete React application with TypeScript that implements wallet selection UI**
- ✅ **Full wallet selection experience**: Visual wallet picker with account selection
- ✅ Modern React 18 with TypeScript
- ✅ Beautiful glassmorphism UI with animations
- ✅ Production-ready build system
- ✅ **Uses Core SDK underneath**: Integrates `@keypass/login-sdk` functions

**Perfect for:** Production applications, React developers, TypeScript projects

```bash
cd examples/react-boilerplate
npm install
npm start
```

### 🌟 [Vanilla JavaScript Boilerplate](./vanilla-boilerplate/)
**Single-file HTML demo that implements wallet selection without frameworks**
- ✅ **Complete wallet selection flow**: Implemented in pure JavaScript
- ✅ Zero build tools or dependencies
- ✅ Educational code with detailed comments
- ✅ Mobile-responsive glassmorphism design
- ✅ **Shows how to build UI around Core SDK**: Direct integration examples

**Perfect for:** Beginners, quick prototypes, learning how wallet selection works

```bash
# Serve the file locally
cd examples/vanilla-boilerplate
python3 -m http.server 8006
# Open http://localhost:8006
```

### 📄 [Ethereum Login Example](./ethereum-login.html)
**Simple Ethereum-only authentication demo**
- ✅ Focused on Ethereum ecosystem only
- ✅ Basic MetaMask integration example
- ✅ **Shows minimal Core SDK usage**: Simple authentication without wallet selection

**Perfect for:** Ethereum-specific projects, minimal implementations

## 🎯 Choose Your Starting Point

### 👨‍💻 **For Production Applications**
→ Start with [**React Boilerplate**](./react-boilerplate/) - Copy and customize the complete implementation

### 🌱 **For Learning & Understanding**
→ Start with [**Vanilla JavaScript Boilerplate**](./vanilla-boilerplate/) - See exactly how wallet selection works

### ⚡ **For Simple Integration**
→ Use [**Ethereum Login Example**](./ethereum-login.html) - Basic authentication without wallet selection UI

### 🔧 **For Custom UI Development**
→ Study the examples to understand patterns, then build your own UI using the Core SDK

## 💡 Understanding the Architecture

### **Core SDK vs Examples**
```
┌─────────────────────────────────────┐
│           Your Application          │
├─────────────────────────────────────┤
│      Frontend Implementation       │ ← These Examples
│  • Wallet selection UI             │
│  • Account selection interface     │  
│  • Error handling displays         │
│  • Loading states & animations     │
├─────────────────────────────────────┤
│         KeyPass Core SDK            │ ← npm install @keypass/login-sdk
│  • loginWithPolkadot()             │
│  • loginWithEthereum()             │
│  • connectWallet()                 │
│  • Wallet adapters                 │
└─────────────────────────────────────┘
```

### **What's Actually Happening**
1. **Examples provide**: UI components, wallet detection, user interaction flows
2. **Core SDK provides**: Authentication logic, wallet communication, server verification
3. **Examples use Core SDK**: The UI calls Core SDK functions to perform actual authentication

## 🛠️ What You'll Learn

### **Frontend Implementation Skills**
- **How to build wallet selection UI** from scratch
- **Wallet detection patterns** for multiple browser extensions
- **Account selection interfaces** with user-friendly displays
- **Error handling UX** for Web3 applications
- **Responsive design** for wallet authentication flows

### **Core SDK Integration**
- **How to use** `loginWithPolkadot()` and `loginWithEthereum()`
- **When to call** `connectWallet()` vs building custom detection
- **How to handle** Core SDK errors and responses
- **Server integration** with KeyPass verification endpoint

### **Web3 Development Concepts**
- **Multi-chain authentication** patterns
- **Browser extension interaction** and permission handling
- **Message signing** and signature verification
- **DID (Decentralized Identity)** creation and management

## 🚀 Quick Start Guide

### 1. **Prerequisites**
- **Node.js 16+** (for React boilerplate)
- **Wallet Extensions**:
  - [Polkadot.js Extension](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/)
  - [MetaMask](https://metamask.io/) or another Ethereum wallet

### 2. **Start the KeyPass Server**
The examples need the KeyPass backend for signature verification:

```bash
# From the root KeyPass directory
cd KeyPass
npm install
npm start
```

Server starts on port 3000:
```
Server running on port 3000
Verification endpoint available at http://0.0.0.0:3000/api/verify
```

### 3. **Run an Example**

#### **React Boilerplate** (Complete implementation):
```bash
cd examples/react-boilerplate
npm install
npm start
# Opens http://localhost:3000
```

#### **Vanilla JavaScript Boilerplate** (Educational):
```bash
cd examples/vanilla-boilerplate
python3 -m http.server 8006
# Open http://localhost:8006
```

### 4. **Understand & Customize**
Each example includes:
- **Detailed code comments** explaining each step
- **Customization guides** for styling and functionality  
- **Integration patterns** showing how to use Core SDK functions

## 🔧 Implementation Patterns

### **Pattern 1: Copy Complete Example**
```bash
# Copy React boilerplate to your project
cp -r examples/react-boilerplate/* your-project/
# Customize branding, styling, and specific flows
```

### **Pattern 2: Extract Components** 
```typescript
// Copy specific functions from examples
import { detectPolkadotWallets, detectEthereumWallets } from './walletDetection';
import { loginWithPolkadot } from '@keypass/login-sdk';

// Build your own UI around these patterns
const wallets = await detectPolkadotWallets();
const result = await loginWithPolkadot();
```

### **Pattern 3: Core SDK Only**
```typescript
// Skip wallet selection UI entirely
import { loginWithPolkadot, loginWithEthereum } from '@keypass/login-sdk';

// Use Core SDK directly (auto-selects first available wallet/account)
const result = await loginWithPolkadot();
```

## 🎨 Wallet Support Details

### **What's Actually Implemented**

#### **Polkadot Ecosystem**
- ✅ **Polkadot.js Extension**: Full support with account selection
- ✅ **Talisman**: Full support with account selection  
- ✅ **WalletConnect**: Core SDK support (UI examples show detection patterns)
- ✅ **Generic extensions**: Auto-detection of any injected Polkadot extension

#### **Ethereum Ecosystem**
- ✅ **MetaMask**: Full support with account selection
- ✅ **Generic providers**: Auto-detection of `window.ethereum` providers
- ℹ️ **Specific wallet detection**: Examples show patterns for Trust Wallet, Coinbase Wallet detection

### **Detection vs Connection vs Support**
- **Detection**: Examples show how to detect if wallets are installed
- **Connection**: Core SDK handles actual wallet communication
- **Support**: What combinations actually work end-to-end

## 🔐 Security Implementation

### **What Examples Demonstrate**
- **Secure message construction** with timestamps and nonces
- **User permission handling** and clear consent flows
- **Error handling** without exposing sensitive information
- **Session management** patterns

### **Production Security Checklist**
- [ ] **HTTPS required**: All Web3 wallets require HTTPS in production
- [ ] **CORS configuration**: Proper headers for API communication
- [ ] **Input validation**: Validate all wallet responses server-side
- [ ] **Session security**: Implement secure session management
- [ ] **Error handling**: Never expose sensitive details in error messages

## 🐛 Common Issues & Solutions

### **Server Setup Issues**

#### KeyPass Server Already Running
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm start
```

#### Port Conflicts for Examples
```bash
# Try different ports for serving examples
python3 -m http.server 8001
python3 -m http.server 8002
python3 -m http.server 8006
```

### **Wallet Connection Issues**

#### No Wallets Detected
```javascript
// Examples show this pattern
if (!window.injectedWeb3 && !window.ethereum) {
  showInstallationGuide();
}
```

#### User Rejection Handling  
```javascript
// Error handling patterns from examples
try {
  const result = await authenticateWithPolkadot(account);
} catch (error) {
  if (error.message.includes('User rejected')) {
    showMessage('Authentication cancelled by user');
  }
}
```

## 📚 Learning Path

### **For Beginners**
1. **Start** with [Vanilla JavaScript Boilerplate](./vanilla-boilerplate/)
2. **Read code comments** to understand wallet detection and selection
3. **Experiment** with styling and customization
4. **Try building** your own simple version

### **For React Developers**  
1. **Start** with [React Boilerplate](./react-boilerplate/)
2. **Study state management** patterns for wallet selection
3. **Customize UI components** to match your design system
4. **Integrate** with your existing React application

### **For Backend Integration**
1. **Study server communication** patterns in examples
2. **Review** KeyPass server verification endpoint
3. **Implement** proper session management
4. **Add** production security measures

## 📖 Additional Resources

### **Example-Specific Documentation**
- 🔗 [Wallet Selection Implementation Guide](./WALLET_SELECTION.md) - Deep dive into wallet selection patterns
- 📘 [React Boilerplate Guide](./react-boilerplate/README.md) - React-specific implementation details

### **Core SDK Documentation**
- 📘 [Main Documentation](../docs/) - Core SDK API and architecture
- 🔧 [API Reference](../docs/api.md) - Core SDK functions and types
- 🛡️ [Integration Guide](../docs/integration.md) - How to use Core SDK in your app

### **Community & Support**
- 💬 [GitHub Discussions](https://github.com/uliana1one/keypass/discussions)
- 🐛 [Issue Tracker](https://github.com/uliana1one/keypass/issues)

---

**Ready to build?** 🎉 These examples show you exactly how to create professional wallet selection experiences. Pick your starting point and start building your Web3 authentication flow today! 