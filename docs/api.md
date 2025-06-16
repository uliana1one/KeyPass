# API Reference

This document provides a comprehensive reference for all APIs in the KeyPass Login SDK. **Important**: This documentation distinguishes between **Core SDK APIs** (available when you install the library) and **Example Implementation APIs** (available in the boilerplate examples).

## Architecture Clarification

### **Core SDK APIs** (`@keypass/login-sdk`)
These functions are available when you install the library via npm. They provide the authentication logic and wallet connection functionality.

### **Example Implementation APIs** (Boilerplate Code)
These functions and interfaces are implemented in the React and Vanilla JavaScript examples. They provide UI components and wallet selection workflows.

---

## Core SDK APIs

### `loginWithPolkadot`

```typescript
function loginWithPolkadot(options?: LoginOptions): Promise<AuthenticationResult>
```

Authenticates a user with a Polkadot wallet. Auto-selects the first available wallet and account if no specific selection is provided.

**Parameters:**
- `options` (optional): Configuration options for the login process

**Returns:** Promise that resolves to an `AuthenticationResult`

**Example:**
```typescript
import { loginWithPolkadot } from '@keypass/login-sdk';

try {
  const result = await loginWithPolkadot();
  console.log('Authenticated:', result.did);
} catch (error) {
  console.error('Authentication failed:', error);
}
```

### `loginWithEthereum`

```typescript
function loginWithEthereum(options?: LoginOptions): Promise<AuthenticationResult>
```

Authenticates a user with an Ethereum wallet. Auto-selects the first available wallet and account if no specific selection is provided.

**Parameters:**
- `options` (optional): Configuration options for the login process

**Returns:** Promise that resolves to an `AuthenticationResult`

**Example:**
```typescript
import { loginWithEthereum } from '@keypass/login-sdk';

try {
  const result = await loginWithEthereum();
  console.log('Authenticated:', result.did);
} catch (error) {
  console.error('Authentication failed:', error);
}
```

### `connectWallet`

```typescript
function connectWallet(chainType: ChainType, walletId?: string): Promise<WalletAdapter>
```

Connects to a specific wallet or auto-detects available wallets.

**Parameters:**
- `chainType`: Either 'polkadot' or 'ethereum'
- `walletId` (optional): Specific wallet identifier

**Returns:** Promise that resolves to a `WalletAdapter`

---

## Example Implementation APIs

These APIs are implemented in the boilerplate examples and show how to build wallet selection UI around the Core SDK.

### `detectPolkadotWallets` (Example Implementation)

```typescript
// Available in: examples/react-boilerplate/src/utils/walletDetection.ts
// Available in: examples/vanilla-boilerplate/index.html

async function detectPolkadotWallets(): Promise<Wallet[]>
```

Detects all available Polkadot wallet extensions in the browser.

**Returns:** Array of detected wallets with their availability status

**Example Usage:**
```typescript
// This is example code - copy from the boilerplates
const wallets = await detectPolkadotWallets();
wallets.forEach(wallet => {
  console.log(`${wallet.name}: ${wallet.available ? 'Available' : 'Not Available'}`);
});
```

### `detectEthereumWallets` (Example Implementation)

```typescript
// Available in: examples/react-boilerplate/src/utils/walletDetection.ts
// Available in: examples/vanilla-boilerplate/index.html

async function detectEthereumWallets(): Promise<Wallet[]>
```

Detects all available Ethereum wallet providers in the browser.

**Returns:** Array of detected wallets with their availability status

### `getPolkadotAccounts` (Example Implementation)

```typescript
// Available in: examples/react-boilerplate/src/utils/accountSelection.ts
// Available in: examples/vanilla-boilerplate/index.html

async function getPolkadotAccounts(wallet: Wallet): Promise<Account[]>
```

Retrieves all accounts from a connected Polkadot wallet.

**Parameters:**
- `wallet`: The wallet object from `detectPolkadotWallets()`

**Returns:** Array of accounts with addresses and metadata

### `getEthereumAccounts` (Example Implementation)

```typescript
// Available in: examples/react-boilerplate/src/utils/accountSelection.ts
// Available in: examples/vanilla-boilerplate/index.html

async function getEthereumAccounts(wallet: Wallet): Promise<Account[]>
```

Retrieves all accounts from a connected Ethereum wallet.

**Parameters:**
- `wallet`: The wallet object from `detectEthereumWallets()`

**Returns:** Array of accounts with addresses and metadata

---

## Usage Examples

### Core SDK Only (Minimal Integration)

```typescript
import { loginWithPolkadot, loginWithEthereum } from '@keypass/login-sdk';

// Simple authentication - auto-selects first available wallet/account
async function authenticateUser(chainType: 'polkadot' | 'ethereum') {
  try {
    const result = chainType === 'polkadot' 
      ? await loginWithPolkadot()
      : await loginWithEthereum();
    
    console.log('User authenticated:', result.did);
    return result;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```

### Example Implementation Pattern (Full UI)

```typescript
// This pattern is implemented in the boilerplates
// Copy the relevant functions from examples/

import { loginWithPolkadot } from '@keypass/login-sdk';
// Import detection functions from examples
import { detectPolkadotWallets, getPolkadotAccounts } from './walletDetection';

async function authenticateWithWalletSelection() {
  try {
    // 1. Detect available wallets (from examples)
    const wallets = await detectPolkadotWallets();
    
    // 2. Let user select wallet (implement UI)
    const selectedWallet = await showWalletSelectionUI(wallets);
    
    // 3. Get accounts from selected wallet (from examples)
    const accounts = await getPolkadotAccounts(selectedWallet);
    
    // 4. Let user select account (implement UI)
    const selectedAccount = await showAccountSelectionUI(accounts);
    
    // 5. Authenticate with Core SDK
    const result = await loginWithPolkadot({
      wallet: selectedWallet,
      account: selectedAccount
    });
    
    return result;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```

### Server Verification

```typescript
// Server-side verification (Node.js)
import { verifySignature } from '@keypass/login-sdk/server';

app.post('/api/verify', async (req, res) => {
  try {
    const { signature, message, address, chainType } = req.body;
    
    const isValid = await verifySignature({
      signature,
      message,
      address,
      chainType
    });
    
    if (isValid) {
      // Create session, store user data, etc.
      res.json({ success: true, verified: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Migration Guide

### From Basic to Wallet Selection

If you're currently using the Core SDK directly and want to add wallet selection:

```typescript
// Before: Direct Core SDK usage
const result = await loginWithPolkadot();

// After: Add wallet selection (copy functions from examples)
const wallets = await detectPolkadotWallets(); // From examples
const selectedWallet = await showWalletPicker(wallets); // Your UI
const accounts = await getPolkadotAccounts(selectedWallet); // From examples
const selectedAccount = await showAccountPicker(accounts); // Your UI
const result = await loginWithPolkadot({ wallet: selectedWallet, account: selectedAccount });
```

### Integration Approaches

1. **Copy Complete Examples**: Use React or Vanilla boilerplates as starting point
2. **Extract Functions**: Copy specific functions from examples into your project
3. **Core SDK Only**: Use authentication functions directly without wallet selection UI

---

**Note**: The wallet detection and account selection functions are implemented in the example boilerplates. Copy the relevant code from `examples/react-boilerplate/` or `examples/vanilla-boilerplate/` to use these features in your application. 