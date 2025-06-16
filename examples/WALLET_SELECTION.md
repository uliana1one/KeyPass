# Wallet Selection Implementation Guide

## Overview

This guide explains **how the wallet selection functionality is implemented** in the KeyPass examples. The wallet selection features are **frontend implementations** built on top of the KeyPass Core SDK, not core SDK functionality itself.

## 🏗️ Architecture Understanding

### **What's Implemented Where**

```
┌─────────────────────────────────────┐
│     Example Frontend Code          │ ← This Guide Covers
├─────────────────────────────────────┤
│  • detectPolkadotWallets()         │
│  • detectEthereumWallets()          │
│  • getPolkadotAccounts()           │
│  • getEthereumAccounts()           │
│  • Wallet selection UI             │
│  • Account selection UI            │
├─────────────────────────────────────┤
│      KeyPass Core SDK               │ ← Used by Examples
├─────────────────────────────────────┤
│  • loginWithPolkadot()             │
│  • loginWithEthereum()             │
│  • connectWallet()                 │
│  • WalletAdapter interfaces        │
└─────────────────────────────────────┘
```

### **Key Distinction**
- **Core SDK**: Provides authentication functions that auto-connect to first available wallet
- **Examples**: Implement UI layers that let users choose wallets and accounts before calling Core SDK functions

## ✨ Features Implemented in Examples

### 🔗 Multi-Wallet Detection

**Polkadot Ecosystem Detection:**
- ✅ Polkadot.js Extension detection
- ✅ Talisman Wallet detection
- ✅ Generic Polkadot extension detection (`window.injectedWeb3`)
- ✅ Installation status checking

**Ethereum Ecosystem Detection:**
- ✅ MetaMask detection (`window.ethereum.isMetaMask`)
- ✅ Trust Wallet detection (`window.ethereum.isTrust`)
- ✅ Coinbase Wallet detection (`window.ethereum.isCoinbaseWallet`)
- ✅ Generic Ethereum provider detection (`window.ethereum`)

### 👤 Account Selection Implementation

- ✅ **Account enumeration**: List all accounts from connected wallet
- ✅ **Account metadata display**: Show names and addresses clearly
- ✅ **Interactive selection**: Click to choose specific account
- ✅ **Account validation**: Ensure selected account exists and is accessible

### 🎨 User Experience Patterns

- ✅ **Step-by-step flow**: Chain → Wallet → Account → Authentication
- ✅ **Visual feedback**: Highlighted selections and loading states
- ✅ **Error handling**: User-friendly error messages and retry logic
- ✅ **Responsive design**: Mobile-friendly wallet selection interfaces
- ✅ **Back navigation**: Easy navigation between selection steps

## 🔧 Implementation Details

### 1. Chain Selection (Example Implementation)

```javascript
// Implemented in examples - not core SDK
function handleChainSelection(chainType) {
  currentChainType = chainType;
  loadWallets(chainType);
  showWalletSelection(chainType);
}
```

### 2. Wallet Detection (Example Implementation)

```javascript
// Polkadot wallet detection - implemented in examples
const detectPolkadotWallets = async () => {
  const wallets = [];
  
  // Wait for extensions to inject
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (window.injectedWeb3) {
    const extensions = Object.keys(window.injectedWeb3);
    
    for (const extensionName of extensions) {
      const extension = window.injectedWeb3[extensionName];
      let displayName = extensionName;
      
      // Map extension names to user-friendly names
      if (extensionName === 'polkadot-js') {
        displayName = 'Polkadot.js Extension';
      } else if (extensionName === 'talisman') {
        displayName = 'Talisman';
      }
      
      wallets.push({
        id: extensionName,
        name: displayName,
        status: extension.enable ? 'Available' : 'Not Compatible',
        available: extension.enable !== undefined,
        extension: extension
      });
    }
  }
  
  return wallets;
};

// Ethereum wallet detection - implemented in examples  
const detectEthereumWallets = async () => {
  const wallets = [];
  
  if (window.ethereum) {
    let walletName = 'Ethereum Wallet';
    
    // Detect specific wallet types
    if (window.ethereum.isMetaMask) {
      walletName = 'MetaMask';
    } else if (window.ethereum.isTrust) {
      walletName = 'Trust Wallet';
    } else if (window.ethereum.isCoinbaseWallet) {
      walletName = 'Coinbase Wallet';
    }
    
    wallets.push({
      id: 'ethereum',
      name: walletName,
      status: 'Available',
      available: true,
      provider: window.ethereum
    });
  }
  
  return wallets;
};
```

### 3. Account Fetching (Example Implementation)

```javascript
// Polkadot account fetching - implemented in examples
const getPolkadotAccounts = async (wallet) => {
  try {
    const injectedExtension = await wallet.extension.enable('KeyPass Demo');
    const accounts = await injectedExtension.accounts.get();
    
    return accounts.map(account => ({
      address: account.address,
      name: account.name || 'Unnamed Account',
      meta: account.meta,
      injectedExtension: injectedExtension
    }));
  } catch (error) {
    throw new Error(`Failed to get accounts: ${error.message}`);
  }
};

// Ethereum account fetching - implemented in examples
const getEthereumAccounts = async (wallet) => {
  try {
    const accounts = await wallet.provider.request({
      method: 'eth_requestAccounts'
    });
    
    return accounts.map((address, index) => ({
      address: address,
      name: `Account ${index + 1}`,
      provider: wallet.provider
    }));
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    }
    throw new Error(`Failed to get accounts: ${error.message}`);
  }
};
```

### 4. Authentication Integration (How Examples Use Core SDK)

```javascript
// How examples integrate with Core SDK
const authenticateWithPolkadot = async (account) => {
  try {
    // Example implementation: Create message and sign with selected account
    const message = `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: ${Math.random().toString(36).substring(7)}\nAddress: ${account.address}`;
    
    const signature = await account.injectedExtension.signer.signRaw({
      address: account.address,
      data: message,
      type: 'bytes'
    });

    return {
      address: account.address,
      did: `did:key:${account.address}`,
      chainType: 'polkadot',
      signature: signature.signature,
      message: message,
      issuedAt: new Date().toISOString(),
      nonce: Math.random().toString(36).substring(7),
      accountName: account.name
    };
  } catch (error) {
    throw new Error(`Signing failed: ${error.message}`);
  }
};

// Alternative: Using Core SDK directly (simpler, no wallet selection)
import { loginWithPolkadot } from '@keypass/login-sdk';
const result = await loginWithPolkadot(); // Auto-selects first available wallet/account
```

## 🎨 UI Implementation Patterns

### React Implementation Structure

```typescript
// State management for wallet selection
interface Wallet {
  id: string;
  name: string;
  status: string;
  available: boolean;
  extension?: any;
  provider?: any;
}

interface Account {
  address: string;
  name: string;
  meta?: any;
  injectedExtension?: any;
  provider?: any;
}

// Component state
const [currentView, setCurrentView] = useState<'login' | 'wallet-selection' | 'profile'>('login');
const [currentChainType, setCurrentChainType] = useState<'polkadot' | 'ethereum' | null>(null);
const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);
const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
```

### Vanilla JavaScript Implementation

```javascript
// Global state management
let currentChainType = null;
let selectedWallet = null;
let selectedAccount = null;
let availableWallets = [];
let availableAccounts = [];

// UI manipulation functions
function showWalletSelection(chainType) {
  document.getElementById('walletSelection').classList.add('show');
  document.getElementById('walletSelectionTitle').textContent = 
    `Choose Your ${chainType === 'polkadot' ? 'Polkadot' : 'Ethereum'} Wallet`;
}

function renderWalletOptions(wallets) {
  const container = document.getElementById('walletOptions');
  container.innerHTML = '';
  
  wallets.forEach(wallet => {
    const walletElement = createWalletElement(wallet);
    container.appendChild(walletElement);
  });
}
```

## 🔧 Styling Implementation

### CSS for Wallet Selection UI

```css
.wallet-selection {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.wallet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.wallet-option {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.wallet-option:hover:not(.disabled) {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
}

.wallet-option.selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.2);
}

.account-list {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.account-option {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.account-option:hover {
  background: rgba(255, 255, 255, 0.05);
}

.account-option.selected {
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
}
```

## 🛡️ Error Handling Patterns

### Common Error Scenarios

```javascript
// No wallets detected
if (availableWallets.length === 0) {
  showError('No wallets detected. Please install a supported wallet extension.');
  showInstallationLinks();
}

// Wallet connection failed
try {
  const accounts = await getPolkadotAccounts(wallet);
} catch (error) {
  if (error.message.includes('User rejected')) {
    showError('Connection cancelled by user');
  } else if (error.message.includes('Not found')) {
    showError('Wallet not found. Please ensure it is installed and enabled.');
  } else {
    showError(`Connection failed: ${error.message}`);
  }
}

// No accounts available
if (accounts.length === 0) {
  showError('No accounts found. Please create an account in your wallet first.');
  showAccountCreationGuide();
}

// Signature rejection
try {
  const signature = await signMessage(message, account);
} catch (error) {
  if (error.code === 4001 || error.message.includes('User rejected')) {
    showError('Signature cancelled by user');
  } else {
    showError(`Signing failed: ${error.message}`);
  }
}
```

### User-Friendly Error Messages

```javascript
const errorMessages = {
  NO_WALLETS: 'No wallet extensions found. Please install Polkadot.js, Talisman, or MetaMask.',
  WALLET_LOCKED: 'Your wallet appears to be locked. Please unlock it and try again.',
  NO_ACCOUNTS: 'No accounts found in your wallet. Please create an account first.',
  USER_REJECTED: 'You cancelled the request. Click connect to try again.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please refresh the page and try again.'
};
```

## 🧪 Testing the Implementation

### Manual Testing Checklist

```javascript
// Test wallet detection
□ Install Polkadot.js extension and verify detection
□ Install Talisman and verify detection  
□ Install MetaMask and verify detection
□ Test with no wallets installed
□ Test with wallets installed but locked

// Test account selection
□ Create multiple accounts in each wallet
□ Verify all accounts are displayed
□ Test account selection flow
□ Test with wallet that has no accounts

// Test authentication flow
□ Complete full flow: chain → wallet → account → auth
□ Test signature approval and rejection
□ Test back navigation between steps
□ Test error recovery flows
```

### Integration Testing

```javascript
// Test Core SDK integration
describe('Wallet Selection Integration', () => {
  test('uses Core SDK after wallet selection', async () => {
    // Mock wallet selection
    const selectedAccount = await selectAccountFromUI();
    
    // Verify Core SDK is called correctly
    const result = await authenticateWithPolkadot(selectedAccount);
    expect(result.address).toBe(selectedAccount.address);
  });
});
```

## 🔄 Migration and Customization

### From Core SDK Only to Wallet Selection

```javascript
// Before: Direct Core SDK usage
import { loginWithPolkadot } from '@keypass/login-sdk';
const result = await loginWithPolkadot(); // Auto-selects first wallet/account

// After: Add wallet selection layer
import { detectPolkadotWallets, getPolkadotAccounts } from './walletSelection';

const wallets = await detectPolkadotWallets();
const selectedWallet = await showWalletPicker(wallets);
const accounts = await getPolkadotAccounts(selectedWallet);
const selectedAccount = await showAccountPicker(accounts);
const result = await authenticateWithPolkadot(selectedAccount);
```

### Adding Custom Wallet Support

```javascript
// Extend wallet detection for custom wallets
const detectPolkadotWallets = async () => {
  // ... existing detection logic ...
  
  // Add custom wallet detection
  if (window.customWallet && window.customWallet.polkadot) {
    wallets.push({
      id: 'custom-wallet',
      name: 'Custom Wallet',
      status: 'Available',
      available: true,
      extension: window.customWallet.polkadot
    });
  }
  
  return wallets;
};
```

## 📚 Implementation Resources

### **Copy-Paste Ready Code**
- **React Implementation**: `examples/react-boilerplate/src/App.tsx`
- **Vanilla Implementation**: `examples/vanilla-boilerplate/index.html`
- **Styling**: Both examples include complete CSS implementations

### **Customization Points**
- **Wallet detection logic**: Add or remove wallet types
- **UI styling**: Customize colors, layouts, animations
- **Error messages**: Modify text and error handling flows
- **Account display**: Customize how accounts are shown to users

### **Integration with Core SDK**
- **Authentication**: Examples show how to use Core SDK after wallet selection
- **Error handling**: How to handle Core SDK errors in UI context
- **Server communication**: How examples verify signatures with KeyPass server

---

**Important**: This guide covers **frontend implementation patterns**. The actual wallet communication and authentication logic is handled by the KeyPass Core SDK. These examples show you how to build user-friendly interfaces around the Core SDK functionality. 