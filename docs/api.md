# API Reference

This document provides a comprehensive reference for all APIs in the KeyPass Login SDK. **Important**: This documentation distinguishes between **Core SDK APIs** (available when you install the library) and **Example Implementation APIs** (available in the boilerplate examples).

## 🏗️ Architecture Clarification

### **Core SDK APIs** (`@keypass/login-sdk`)
These functions are available when you install the library via npm. They provide the authentication logic and wallet connection functionality.

### **Example Implementation APIs** (Boilerplate Code)
These functions and interfaces are implemented in the React and Vanilla JavaScript examples. They provide UI components and wallet selection workflows.

---

## 🔧 Core SDK APIs

### `loginWithPolkadot`

```typescript
function loginWithPolkadot(retryCount?: number): Promise<LoginResult>
```

Complete Polkadot authentication flow with automatic wallet detection and connection.

#### Parameters
- `retryCount` (optional): Number of retry attempts for network errors (default: 1)

#### Returns
```typescript
interface LoginResult {
  address: string;         // The Polkadot address of the logged-in account
  signature: string;       // The signature of the login message
  message: string;         // The message that was signed
  did: string;            // The DID associated with the address
  issuedAt: string;       // ISO timestamp when the login was issued
  nonce: string;          // Unique nonce used to prevent replay attacks
}
```

### `loginWithEthereum`

```typescript
function loginWithEthereum(): Promise<LoginResult>
```

Complete Ethereum authentication flow with MetaMask or other Ethereum wallet detection.

#### Returns
Same `LoginResult` interface as `loginWithPolkadot`.

### `connectWallet`

```typescript
function connectWallet(): Promise<WalletAdapter>
```

Connects to the first available wallet (Polkadot.js, Talisman, or WalletConnect) in priority order.

#### Returns
```typescript
interface WalletAdapter {
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
  disconnect(): Promise<void>;
  validateAddress(address: string): Promise<boolean>;
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;
}
```

### Core SDK Types

```typescript
interface WalletAccount {
  address: string;         // Wallet address
  name?: string;          // Account name/label  
  source: string;         // Wallet source identifier
}

// Error classes available in the core SDK
class WalletNotFoundError extends Error
class UserRejectedError extends Error  
class WalletConnectionError extends Error
class MessageValidationError extends Error
class AddressValidationError extends Error
```

---

## 🎨 Example Implementation APIs

**Note**: These APIs are implemented in the boilerplate examples (`examples/react-boilerplate` and `examples/vanilla-boilerplate`). Copy these implementations to your project if you want similar functionality.

### Wallet Detection Functions (Example Implementation)

```typescript
// Available in examples/react-boilerplate/src/App.tsx
function detectPolkadotWallets(): Promise<Wallet[]>
function detectEthereumWallets(): Promise<Wallet[]>
```

### Account Management (Example Implementation)

```typescript
// Available in examples/react-boilerplate/src/App.tsx  
function getPolkadotAccounts(wallet: Wallet): Promise<Account[]>
function getEthereumAccounts(wallet: Wallet): Promise<Account[]>
```

### Authentication Functions (Example Implementation)

```typescript
// Available in examples/react-boilerplate/src/App.tsx
function authenticateWithPolkadot(account: Account): Promise<LoginResult>
function authenticateWithEthereum(account: Account): Promise<LoginResult>
```

### Example Implementation Types

```typescript
// These interfaces are defined in the example boilerplates
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

interface LoginResult {
  address: string;
  did: string;
  chainType: string;
  signature: string;
  message: string;
  issuedAt: string;
  nonce: string;
  accountName: string;
}
```

---

## 🔌 Server API

### Verification Endpoint

**POST** `/api/verify`

Verifies wallet signatures and returns associated DIDs.

#### Request Body
```typescript
interface VerificationRequest {
  message: string;    // The message that was signed
  signature: string;  // The signature in hex format (0x-prefixed)  
  address: string;    // The wallet address that signed the message
}
```

#### Response
```typescript
interface VerificationResponse {
  status: 'success' | 'error';
  message: string;
  code?: string;      // Error code if applicable
  did?: string;       // The DID associated with the address (if valid)
}
```

---

## 🚀 Usage Examples

### Using Core SDK Only (No UI)

```typescript
import { loginWithPolkadot, loginWithEthereum } from '@keypass/login-sdk';

// Basic Polkadot authentication
try {
  const result = await loginWithPolkadot();
  console.log('Logged in:', result.address);
  console.log('DID:', result.did);
} catch (error) {
  console.error('Login failed:', error);
}

// Basic Ethereum authentication  
try {
  const result = await loginWithEthereum();
  console.log('Logged in:', result.address);
  console.log('DID:', result.did);
} catch (error) {
  console.error('Login failed:', error);
}
```

### Using Core SDK with Custom Wallet Selection

```typescript
import { connectWallet } from '@keypass/login-sdk';

// Connect to wallet and get accounts
const adapter = await connectWallet();
const accounts = await adapter.getAccounts();

// Let user choose account (implement your own UI)
const selectedAccount = await showAccountSelector(accounts);

// Sign message with selected account
const message = "Login to my app";
const signature = await adapter.signMessage(message);
```

### Using Example Implementation (With UI)

```typescript
// Copy the code from examples/react-boilerplate/src/App.tsx
// This includes full wallet selection UI:

// 1. Chain selection (Polkadot vs Ethereum)
// 2. Wallet detection and selection  
// 3. Account selection from wallet
// 4. Authentication with selected account
// 5. Error handling and loading states
```

---

## 🔄 Migration Guide

### If you want the documented "selectWallet" functionality:

The wallet selection features mentioned in earlier documentation are implemented in the examples. To use them:

1. **Copy from Examples**: Take the wallet detection and selection code from `examples/react-boilerplate/src/App.tsx`
2. **Customize**: Modify the UI to match your application's design
3. **Integrate**: Use the core SDK functions (`connectWallet`, `loginWithPolkadot`, etc.) for the actual authentication

### Creating your own selectWallet function:

```typescript
// Example implementation based on the boilerplate code
async function selectWallet(chainType: 'polkadot' | 'ethereum') {
  let wallets;
  
  if (chainType === 'polkadot') {
    wallets = await detectPolkadotWallets(); // Copy from examples
  } else {
    wallets = await detectEthereumWallets(); // Copy from examples  
  }
  
  // Show wallet selection UI (implement your own)
  const selectedWallet = await showWalletSelectionUI(wallets);
  
  // Get accounts from selected wallet
  const accounts = chainType === 'polkadot' 
    ? await getPolkadotAccounts(selectedWallet)
    : await getEthereumAccounts(selectedWallet);
    
  // Show account selection UI (implement your own)
  const selectedAccount = await showAccountSelectionUI(accounts);
  
  return { wallet: selectedWallet, account: selectedAccount };
}
```

---

## ❓ FAQ

**Q: Where is the `selectWallet()` function?**
A: It's implemented in the example boilerplates. Copy the implementation from `examples/react-boilerplate/src/App.tsx` or `examples/vanilla-boilerplate/index.html`.

**Q: Why aren't the UI functions in the core SDK?**
A: The core SDK focuses on authentication logic, while UI implementations are provided as examples. This allows maximum flexibility for different frontend frameworks and design systems.

**Q: Can I use the core SDK with my own UI?**
A: Yes! Use functions like `connectWallet()`, `loginWithPolkadot()`, and `loginWithEthereum()` and build your own wallet selection interface.

**Q: How do I implement wallet selection like in the examples?**
A: Copy the relevant functions from the boilerplate code and customize the UI components to match your application's design. 