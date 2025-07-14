# Integration Guide

This guide covers four main integration approaches: **using the Core SDK** for custom implementations, **using the Examples** for complete UI experiences, **backend integration** for API management, and **hybrid integration** for maximum flexibility. It now also covers advanced features like the DID Explorer dashboard, credential/SBT display, zkProof demo, and backend services.

## Integration Overview

### **Option A: Core SDK Integration** 
Use the authentication and identity functions directly with your own UI
- **Best for**: Custom UIs, specific design requirements, existing component libraries
- **What you get**: Authentication logic, wallet connections, server verification, DID creation, credential/SBT and zkProof APIs
- **What you build**: Wallet selection UI, account selection UI, error handling UI, custom dashboards

### **Option B: Example-Based Integration**
Use the complete examples as a starting point
- **Best for**: Rapid development, getting started quickly, proof of concepts
- **What you get**: Complete UI experience, wallet selection, account selection, DID Explorer wizard, credential/SBT dashboard, zkProof generator, styling
- **What you customize**: Branding, styling, specific workflows, privacy controls

### **Option C: Backend Integration**
Use the Express proxy server for API management and external service integration
- **Best for**: Production deployments, external API management, credential data handling
- **What you get**: API endpoints for credentials, offers, requests, verification, blockchain API proxying
- **What you customize**: Endpoint logic, external service integration, data storage

### **Option D: Hybrid Integration**
Mix core SDK functions with example UI components and backend services
- **Best for**: Balanced approach, selective customization, production-ready applications
- **What you do**: Pick specific components from examples, use backend for APIs, build custom logic around them

---

## New Additions: DID Explorer, Credential Dashboard, zkProof Demo, Backend Integration

### **DID Explorer Dashboard Integration**
- **Component**: `DIDWizard` (React)
- **Features**: Multi-step wizard for DID creation (Type → Configuration → Preview → Create), fixed-stepper UI, supports both Basic and Advanced DIDs
- **How to use**: Import and render `DIDWizard` in your app, pass wallet/account props, handle `onComplete` for DID creation result
- **Customization**: Style the wizard, add branding, extend steps as needed

### **Credential & SBT Dashboard Integration**
- **Components**: `CredentialSection`, `SBTSection`, `CredentialRequestWizard`
- **Features**: Credential/SBT grid and card display, request wizard, privacy controls, revocation, sharing
- **How to use**: Import and render dashboard components, connect to core SDK credential APIs, handle credential requests and offers
- **Customization**: Adjust UI, add new credential types, extend privacy features

### **zkProof Credential Demo Integration**
- **Component**: `ZKProofGenerator`
- **Features**: Stepper for selecting credential, circuit, generating and verifying zkProofs (Semaphore, PLONK, Groth16), privacy controls
- **How to use**: Import and render `ZKProofGenerator`, connect to credential/zkProof APIs, handle proof generation and verification
- **Customization**: Add new circuits, integrate with custom credential flows, style proof UI

### **Backend Integration**
- **Server**: Express proxy server (`proxy-server.cjs`)
- **Features**: API endpoints for credentials, verification, blockchain API proxying, CORS handling
- **How to use**: Start backend server, configure frontend proxy, use `/api/*` endpoints
- **Customization**: Add new endpoints, integrate with external services, implement custom logic

---

## Option A: Core SDK Integration

### Prerequisites

1. **Install the Core SDK**
```bash
npm install @keypass/login-sdk
```

2. **Set up the KeyPass Server**
```bash
# From the KeyPass repository root
npm install
npm start
# Server runs on http://localhost:3000
```

### Basic Integration

#### 1. Simple Polkadot Authentication

```typescript
import { loginWithPolkadot } from '@keypass/login-sdk';

async function authenticateUser() {
  try {
    const result = await loginWithPolkadot();
    
    // Handle successful authentication
    console.log('User authenticated:', {
      address: result.address,
      did: result.did,
      signature: result.signature
    });
    
    // Store authentication state
    localStorage.setItem('userAuth', JSON.stringify(result));
    
  } catch (error) {
    console.error('Authentication failed:', error);
    // Handle specific error types
    if (error.message.includes('No supported wallet found')) {
      alert('Please install Polkadot.js or Talisman wallet');
    }
  }
}
```

#### 2. Simple Ethereum Authentication

```typescript
import { loginWithEthereum } from '@keypass/login-sdk';

async function authenticateWithEth() {
  try {
    const result = await loginWithEthereum();
    
    console.log('Ethereum user authenticated:', {
      address: result.address,
      did: result.did
    });
    
  } catch (error) {
    console.error('Ethereum authentication failed:', error);
    if (error.message.includes('No accounts found')) {
      alert('Please connect your MetaMask wallet');
    }
  }
}
```

### Advanced Integration with Custom UI

#### 1. Build Your Own Wallet Selection

```typescript
import { connectWallet } from '@keypass/login-sdk';

// Build your own wallet detection
async function detectAvailableWallets() {
  const wallets = {
    polkadot: [],
    ethereum: []
  };
  
  // Check for Polkadot wallets
  if (window.injectedWeb3) {
    const extensions = Object.keys(window.injectedWeb3);
    for (const extensionName of extensions) {
      wallets.polkadot.push({
        id: extensionName,
        name: extensionName === 'polkadot-js' ? 'Polkadot.js' : extensionName,
        available: true
      });
    }
  }
  
  // Check for Ethereum wallets
  if (window.ethereum) {
    wallets.ethereum.push({
      id: 'ethereum',
      name: window.ethereum.isMetaMask ? 'MetaMask' : 'Ethereum Wallet',
      available: true
    });
  }
  
  return wallets;
}

// Build your own wallet connection with selection
async function connectWithSelection(chainType: 'polkadot' | 'ethereum') {
  const wallets = await detectAvailableWallets();
  const availableWallets = wallets[chainType];
  
  if (availableWallets.length === 0) {
    throw new Error(`No ${chainType} wallets available`);
  }
  
  // Show your custom wallet selection UI
  const selectedWallet = await showWalletSelectionModal(availableWallets);
  
  // Connect using core SDK
  const adapter = await connectWallet();
  const accounts = await adapter.getAccounts();
  
  // Show your custom account selection UI
  const selectedAccount = await showAccountSelectionModal(accounts);
  
  return { adapter, selectedAccount };
}
```

#### 2. Custom Authentication Flow

```typescript
import { connectWallet } from '@keypass/login-sdk';
import { buildLoginMessage } from '@keypass/login-sdk/message';

async function customAuthFlow(chainType: 'polkadot' | 'ethereum') {
  try {
    // Step 1: Connect to wallet
    const adapter = await connectWallet();
    
    // Step 2: Get accounts
    const accounts = await adapter.getAccounts();
    
    // Step 3: Let user select account (your UI)
    const selectedAccount = await yourAccountSelector(accounts);
    
    // Step 4: Create login message
    const message = await buildLoginMessage({
      template: "KeyPass Login\nIssued At: {issuedAt}\nNonce: {nonce}\nAddress: {address}",
      address: selectedAccount.address,
      nonce: generateNonce(),
      issuedAt: new Date().toISOString()
    });
    
    // Step 5: Sign message
    const signature = await adapter.signMessage(message);
    
    // Step 6: Verify with server
    const verificationResponse = await fetch('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        signature,
        address: selectedAccount.address
      })
    });
    
    const result = await verificationResponse.json();
    
    if (result.status === 'success') {
      return {
        address: selectedAccount.address,
        did: result.did,
        signature,
        message
      };
    } else {
      throw new Error(result.message);
    }
    
  } catch (error) {
    console.error('Custom auth flow failed:', error);
    throw error;
  }
}
```

### Error Handling

```typescript
import { 
  WalletNotFoundError, 
  UserRejectedError, 
  WalletConnectionError 
} from '@keypass/login-sdk';

async function robustAuthentication() {
  try {
    const result = await loginWithPolkadot();
    return result;
  } catch (error) {
    if (error instanceof WalletNotFoundError) {
      // No wallet installed
      showInstallWalletModal();
    } else if (error instanceof UserRejectedError) {
      // User cancelled
      showMessage('Authentication cancelled by user');
    } else if (error instanceof WalletConnectionError) {
      // Connection failed
      showMessage('Failed to connect to wallet. Please try again.');
    } else {
      // Unknown error
      console.error('Unexpected error:', error);
      showMessage('An unexpected error occurred');
    }
  }
}
```

---

## Option B: Example-Based Integration

### Using the React Boilerplate

#### 1. Copy the React Example

```bash
# Copy the entire React boilerplate to your project
cp -r examples/react-boilerplate/* your-project/

# Install dependencies
cd your-project
npm install

# Start development server
npm start
```

#### 2. Integrate Advanced Features

- **DID Creation Wizard**: Use `<DIDWizard ... />` for onboarding and identity setup
- **Credential Dashboard**: Use `<CredentialSection ... />` and `<SBTSection ... />` for displaying credentials and badges
- **zkProof Generator**: Use `<ZKProofGenerator ... />` for privacy-preserving proof flows
- **Fixed-stepper UI**: All wizards use a consistent, accessible stepper for user guidance
- **Privacy Controls**: Credential and proof flows include selective disclosure and sharing options

#### 3. Customize the React Example

```typescript
// Customize the App.tsx component
import React, { useState } from 'react';
import './App.css';

// Keep the wallet detection functions from the example
const detectPolkadotWallets = async () => {
  // Copy implementation from examples/react-boilerplate/src/App.tsx
};

const detectEthereumWallets = async () => {
  // Copy implementation from examples/react-boilerplate/src/App.tsx
};

// Customize the main component
function YourApp() {
  // Copy state management from the example
  const [currentView, setCurrentView] = useState('login');
  const [selectedChainType, setSelectedChainType] = useState(null);
  // ... other state variables
  
  // Customize the UI to match your brand
  const renderLogin = () => (
    <div className="your-login-section">
      <h1>Your App Name</h1>
      <p>Connect your wallet to get started</p>
      
      {/* Copy button logic from example */}
      <button onClick={() => handleChainSelection('polkadot')}>
        Connect Polkadot Wallet
      </button>
      <button onClick={() => handleChainSelection('ethereum')}>
        Connect Ethereum Wallet
      </button>
    </div>
  );
  
  // Copy and customize other render functions
  return (
    <div className="your-app">
      {/* Your customized UI */}
    </div>
  );
}
```

#### 4. Customize Styling

```css
/* Copy base styles from examples/react-boilerplate/src/App.css */
/* Then customize colors, fonts, etc. */

.your-login-section {
  /* Your custom styling */
  background: linear-gradient(135deg, #your-primary-color 0%, #your-secondary-color 100%);
  /* Keep the functional CSS from the example */
}

.your-app {
  /* Your app-specific styling */
}
```

### Using the Vanilla Boilerplate

#### 1. Copy the Vanilla Example

```bash
# Copy the vanilla example
cp examples/vanilla-boilerplate/index.html your-project/

# Serve the file
cd your-project
python3 -m http.server 8000
```

#### 2. Customize the Vanilla Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Your App - Wallet Authentication</title>
    <!-- Copy the core CSS from the example -->
    <style>
        /* Copy styles from examples/vanilla-boilerplate/index.html */
        /* Customize colors, fonts, layout */
        
        body {
            /* Your custom styling */
            font-family: your-font-family;
            background: your-background;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Your App Name</h1>
        <!-- Copy the UI structure from the example -->
        <!-- Customize text, layout, branding -->
    </div>
    
    <script>
        // Copy all the JavaScript functions from the example
        // Customize as needed for your app
        
        const detectPolkadotWallets = async () => {
            // Copy from examples/vanilla-boilerplate/index.html
        };
        
        const authenticateWithPolkadot = async (account) => {
            // Copy and customize authentication logic
        };
        
        // ... rest of the JavaScript
    </script>
</body>
</html>
```

---

## Option C: Backend Integration

### Backend Setup

#### 1. Start the Backend Server

```bash
# From the KeyPass repository root
node proxy-server.cjs
# Server runs on http://localhost:5000
```

#### 2. Configure Frontend Proxy

**For React (vite.config.ts):**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

**For Vanilla JavaScript (package.json):**
```json
{
  "proxy": "http://localhost:5000"
}
```

#### 3. Use Backend Endpoints

```typescript
// Fetch credentials from backend
async function fetchCredentials() {
  try {
    const response = await fetch('/api/credentials');
    const credentials = await response.json();
    return credentials;
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    return [];
  }
}

// Fetch credential offers
async function fetchOffers() {
  try {
    const response = await fetch('/api/offers');
    const offers = await response.json();
    return offers;
  } catch (error) {
    console.error('Failed to fetch offers:', error);
    return [];
  }
}

// Fetch credential requests
async function fetchRequests() {
  try {
    const response = await fetch('/api/requests');
    const requests = await response.json();
    return requests;
  } catch (error) {
    console.error('Failed to fetch requests:', error);
    return [];
  }
}

// Verify signature with backend
async function verifySignature(signature: string, message: string, address: string) {
  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature, message, address })
    });
    
    const result = await response.json();
    return result.verified;
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}
```

### Backend Customization

#### 1. Add Custom Endpoints

```javascript
// In proxy-server.cjs
app.get('/api/custom-endpoint', (req, res) => {
  res.json({ message: 'Custom endpoint response' });
});

app.post('/api/custom-action', (req, res) => {
  const { data } = req.body;
  // Your custom logic here
  res.json({ success: true, result: 'Custom action completed' });
});
```

#### 2. Integrate with External Services

```javascript
// Add new proxy routes
app.use('/api/external-service', createProxyMiddleware({
  target: 'https://api.external-service.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/external-service': ''
  }
}));
```

#### 3. Add Database Integration

```javascript
// Example with a simple database
const credentials = [];

app.get('/api/credentials', (req, res) => {
  res.json(credentials);
});

app.post('/api/credentials', (req, res) => {
  const newCredential = req.body;
  credentials.push(newCredential);
  res.json({ success: true, credential: newCredential });
});
```

### Backend Environment Configuration

```bash
# .env file for backend
PORT=5000
ETHEREUM_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
POLKADOT_RPC_URL=https://rpc.polkadot.io
CORS_ORIGIN=http://localhost:3000
```

---

## Option D: Hybrid Integration

### Use Core SDK + Selected Example Components + Backend

#### 1. Extract and Use Advanced Components
- **DIDWizard**: For multi-step DID creation
- **CredentialSection/SBTSection**: For credential and badge display
- **ZKProofGenerator**: For privacy-preserving proof generation

#### 2. Compose with Custom Logic and Backend
- Use your own state management, routing, or UI framework
- Connect example components to your backend or custom flows
- Extend or override steps, privacy settings, or credential types as needed
- Use backend for API management and external service integration

#### 3. Example Hybrid Setup

```typescript
// Custom app with backend integration
import { DIDWizard } from './components/DIDWizard';
import { CredentialSection } from './components/CredentialSection';

function HybridApp() {
  const [credentials, setCredentials] = useState([]);
  
  // Use backend for credential data
  useEffect(() => {
    fetch('/api/credentials')
      .then(res => res.json())
      .then(setCredentials);
  }, []);
  
  return (
    <div>
      <DIDWizard onComplete={handleDIDCreation} />
      <CredentialSection credentials={credentials} />
    </div>
  );
}
```

---

## Server Setup

### Development Setup

```bash
# Clone the KeyPass repository
git clone https://github.com/uliana1one/keypass.git
cd keypass

# Install dependencies
npm install

# Start the server
npm start
# Server available at http://localhost:3000
```

### Backend Development Setup

```bash
# Start the backend proxy server
node proxy-server.cjs
# Backend available at http://localhost:5000

# In another terminal, start the frontend
cd examples/react-boilerplate
npm start
# Frontend available at http://localhost:3000
```

### Production Setup

```bash
# Build the server
npm run build

# Start production server
NODE_ENV=production npm start
```

### Backend Production Setup

```bash
# Start backend in production
NODE_ENV=production PORT=5000 node proxy-server.cjs

# Or use PM2 for process management
pm2 start proxy-server.cjs --name keypass-backend
```

### Docker Setup

```bash
# Build and run with Docker
docker build -t keypass-server .
docker run -p 3000:3000 keypass-server

# For backend
docker build -f Dockerfile.server -t keypass-backend .
docker run -p 5000:5000 keypass-backend
```

### Environment Variables

```bash
# .env file for main server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-app.com

# .env file for backend
PORT=5000
ETHEREUM_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
POLKADOT_RPC_URL=https://rpc.polkadot.io
```

---

## Testing Your Integration

### Test Wallet Connections

```typescript
// Test script
import { connectWallet } from '@keypass/login-sdk';

async function testWalletConnection() {
  try {
    const adapter = await connectWallet();
    console.log('✅ Wallet connected:', adapter.getProvider());
    
    const accounts = await adapter.getAccounts();
    console.log('✅ Accounts found:', accounts.length);
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testWalletConnection();
```

### Test Authentication Flow

```typescript
import { loginWithPolkadot } from '@keypass/login-sdk';

async function testAuth() {
  try {
    const result = await loginWithPolkadot();
    console.log('✅ Authentication successful:', result.did);
    
    // Test server verification
    const response = await fetch('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: result.message,
        signature: result.signature,
        address: result.address
      })
    });
    
    const verification = await response.json();
    console.log('✅ Server verification:', verification.status);
    
  } catch (error) {
    console.error('❌ Authentication failed:', error);
  }
}
```

### Test Backend Integration

```typescript
// Test backend endpoints
async function testBackend() {
  try {
    // Test credentials endpoint
    const credentials = await fetch('/api/credentials');
    console.log('✅ Credentials endpoint:', await credentials.json());
    
    // Test offers endpoint
    const offers = await fetch('/api/offers');
    console.log('✅ Offers endpoint:', await offers.json());
    
    // Test requests endpoint
    const requests = await fetch('/api/requests');
    console.log('✅ Requests endpoint:', await requests.json());
    
  } catch (error) {
    console.error('❌ Backend test failed:', error);
  }
}

testBackend();
```

---

## Deployment Checklist

### Before Deployment

- [ ] **Test all wallet types** your users might have
- [ ] **Test on mobile devices** if you support mobile
- [ ] **Verify HTTPS setup** (required for wallet extensions)
- [ ] **Test error scenarios** (no wallet, user rejection, etc.)
- [ ] **Verify server endpoint** is accessible from your domain
- [ ] **Check CORS configuration** for your domain
- [ ] **Test backend endpoints** and proxy configuration
- [ ] **Verify external API keys** are configured correctly

### Backend Deployment Checklist

- [ ] **Configure environment variables** for production
- [ ] **Set up API keys** for external services
- [ ] **Test proxy routes** and external service integration
- [ ] **Configure CORS** for your frontend domain
- [ ] **Set up monitoring** and logging
- [ ] **Test rate limiting** and security measures

### Security Considerations

- [ ] **Enable HTTPS** in production
- [ ] **Configure CORS** properly
- [ ] **Validate all inputs** server-side  
- [ ] **Implement rate limiting** on verification endpoint
- [ ] **Use secure headers** (already included in server)
- [ ] **Monitor for suspicious activity**
- [ ] **Secure API keys** and sensitive configuration
- [ ] **Validate backend requests** and responses

### Performance Optimization

- [ ] **Minimize bundle size** if using custom integration
- [ ] **Implement loading states** for better UX
- [ ] **Add retry logic** for network failures
- [ ] **Cache wallet detection** results where appropriate
- [ ] **Optimize backend responses** and caching
- [ ] **Monitor API response times** and external service performance

This integration guide now covers advanced identity, credential, and privacy flows, backend integration, and provides multiple paths to implement KeyPass authentication and credential management based on your specific needs and technical requirements. 