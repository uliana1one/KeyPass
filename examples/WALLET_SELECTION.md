# Wallet and Account Selection Guide

## Overview

Both KeyPass boilerplates now support **wallet and account selection**, allowing users to choose which wallet extension and which specific account to use for authentication. This provides much more flexibility and control over the authentication process.

## Features

### 🔗 Multi-Wallet Support

**Polkadot Ecosystem:**
- Polkadot.js Extension
- Talisman Wallet
- SubWallet
- Any compatible Polkadot extension

**Ethereum Ecosystem:**
- MetaMask
- Trust Wallet
- Coinbase Wallet
- Any compatible Ethereum wallet

### 👤 Account Selection

- View all available accounts in your selected wallet
- Choose which specific account to authenticate with
- See account names and addresses clearly
- Support for multiple accounts per wallet

### 🎨 User Experience

- **Step-by-step flow**: Chain → Wallet → Account → Authentication
- **Visual feedback**: Selected items are highlighted
- **Error handling**: Clear messages for missing wallets or failed connections
- **Responsive design**: Works on desktop and mobile
- **Back navigation**: Easy to go back and change selections

## How It Works

### 1. Chain Selection
Users first choose between Polkadot and Ethereum chains.

### 2. Wallet Detection
The app automatically detects all available wallet extensions:
- Shows wallet names and availability status
- Indicates if wallets are installed but not compatible
- Provides installation links for missing wallets

### 3. Wallet Selection
Users click on their preferred wallet:
- Only available wallets are clickable
- Selected wallet is highlighted
- App requests permission to connect

### 4. Account Selection
Once connected, users see all accounts:
- Account addresses are displayed in monospace font
- Account names (if available) are shown
- Users click to select their preferred account

### 5. Authentication
Final step signs a message with the selected account:
- Creates a unique login message
- Requests signature from the selected account
- Displays authentication result with account details

## Code Structure

### Vanilla JavaScript Implementation

```javascript
// State management
let currentChainType = null;
let selectedWallet = null;
let selectedAccount = null;
let availableWallets = [];
let availableAccounts = [];

// Wallet detection
async function detectPolkadotWallets() { /* ... */ }
async function detectEthereumWallets() { /* ... */ }

// Account fetching
async function getPolkadotAccounts(wallet) { /* ... */ }
async function getEthereumAccounts(wallet) { /* ... */ }

// Authentication
async function authenticateWithPolkadot(account) { /* ... */ }
async function authenticateWithEthereum(account) { /* ... */ }
```

### React Implementation

```typescript
// State management with hooks
const [currentView, setCurrentView] = useState<'login' | 'wallet-selection' | 'profile'>('login');
const [currentChainType, setCurrentChainType] = useState<'polkadot' | 'ethereum' | null>(null);
const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

// TypeScript interfaces
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
```

## UI Components

### Wallet Grid
```css
.wallet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.wallet-option {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}
```

### Account List
```css
.account-list {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.account-option {
  padding: 15px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
```

## Error Handling

### Common Error Scenarios

1. **No Wallets Detected**
   - Shows installation instructions
   - Provides direct links to wallet downloads

2. **Wallet Connection Failed**
   - Clear error messages
   - Suggests troubleshooting steps

3. **No Accounts Found**
   - Prompts user to create accounts in their wallet
   - Explains account setup process

4. **Signature Rejected**
   - Handles user rejection gracefully
   - Allows retry without full restart

### Error Messages

```javascript
// Example error handling
try {
  const accounts = await getPolkadotAccounts(wallet);
  if (accounts.length === 0) {
    throw new Error('No accounts found. Please create an account in your wallet.');
  }
} catch (error) {
  if (error.code === 4001) {
    showError('User rejected the connection request');
  } else {
    showError(`Failed to get accounts: ${error.message}`);
  }
}
```

## Security Considerations

### Message Signing
Each authentication creates a unique message:
```javascript
const message = `KeyPass Login
Issued At: ${new Date().toISOString()}
Nonce: ${Math.random().toString(36).substring(7)}
Address: ${account.address}`;
```

### Permission Handling
- Requests minimal necessary permissions
- Only accesses selected accounts
- No persistent storage of sensitive data
- Clear permission requests to users

## Browser Compatibility

### Supported Browsers
- Chrome/Chromium (recommended)
- Firefox
- Safari (with limitations)
- Edge

### Extension Requirements
- Polkadot.js Extension 0.44.1+
- Talisman 1.0.0+
- MetaMask 10.0.0+
- Modern browser with extension support

## Testing

### Manual Testing Steps

1. **Install Test Wallets**
   ```bash
   # Install browser extensions:
   # - Polkadot.js Extension
   # - Talisman (optional)
   # - MetaMask
   ```

2. **Create Test Accounts**
   - Create at least 2 accounts in each wallet
   - Give accounts descriptive names
   - Ensure accounts have different addresses

3. **Test Flow**
   - Select Polkadot → Choose wallet → Select account → Sign
   - Select Ethereum → Choose wallet → Select account → Sign
   - Test with multiple accounts
   - Test error scenarios (reject signature, etc.)

### Automated Testing
```javascript
// Example test structure
describe('Wallet Selection', () => {
  test('detects available wallets', async () => {
    const wallets = await detectPolkadotWallets();
    expect(wallets.length).toBeGreaterThan(0);
  });
  
  test('handles wallet selection', async () => {
    const wallet = availableWallets[0];
    await handleWalletSelection(wallet);
    expect(selectedWallet).toBe(wallet);
  });
});
```

## Customization

### Adding New Wallets

To support additional wallets, extend the detection functions:

```javascript
async function detectPolkadotWallets() {
  // ... existing code ...
  
  // Add new wallet detection
  if (extensionName === 'nova-wallet') {
    displayName = 'Nova Wallet';
  } else if (extensionName === 'fearless-wallet') {
    displayName = 'Fearless Wallet';
  }
  
  // ... rest of function
}
```

### Styling Customization

Override CSS variables for consistent theming:

```css
:root {
  --wallet-bg: rgba(255, 255, 255, 0.03);
  --wallet-border: rgba(255, 255, 255, 0.1);
  --wallet-hover: rgba(59, 130, 246, 0.1);
  --wallet-selected: rgba(59, 130, 246, 0.2);
}
```

## Troubleshooting

### Common Issues

1. **"No wallets detected"**
   - Ensure wallet extensions are installed
   - Refresh the page after installing
   - Check browser extension permissions

2. **"Failed to get accounts"**
   - Create accounts in your wallet first
   - Ensure wallet is unlocked
   - Check wallet permissions for the site

3. **"Signing failed"**
   - Don't reject the signature request
   - Ensure account has sufficient permissions
   - Try refreshing and reconnecting

### Debug Mode

Enable debug mode by opening browser console:

```javascript
// Access debug functions
window.KeyPassDemo.selectedWallet();
window.KeyPassDemo.selectedAccount();
window.KeyPassDemo.currentUser();
```

## Migration from Previous Version

If upgrading from the previous version:

1. **No breaking changes** - existing functionality preserved
2. **Enhanced UX** - users now get wallet/account selection
3. **Same API** - authentication results have same structure
4. **Additional data** - results now include `accountName` field

### Before (automatic selection):
```javascript
// Old: Used first available wallet and account
const result = await loginWithPolkadot();
```

### After (user selection):
```javascript
// New: User chooses wallet and account through UI
// Same result structure, but with user choice
const result = await authenticateWithPolkadot(selectedAccount);
```

## Next Steps

- **Multi-chain support**: Connect to multiple chains simultaneously
- **Account management**: Switch accounts without full reconnection
- **Wallet preferences**: Remember user's preferred wallet
- **Advanced permissions**: Fine-grained permission control
- **Hardware wallet support**: Ledger and other hardware wallets

## Support

For issues or questions:
- Check the troubleshooting section above
- Open an issue on GitHub
- Review browser console for error details
- Test with different wallets/accounts to isolate issues 