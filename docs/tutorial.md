# KeyPass Login SDK Tutorial

This tutorial will guide you through integrating the KeyPass Login SDK into your React application, from basic setup to advanced features. We'll start with a working example and build from there.

## What is KeyPass?

KeyPass is a simple SDK that allows users to connect their blockchain wallets (like Polkadot.js, Talisman, etc.) to your web application. Think of it as a "Connect Wallet" button that works with multiple wallet types.

## Prerequisites

Before you begin, make sure you have:

1. **Node.js** (v14 or later) - [Download here](https://nodejs.org/)
2. **A code editor** (VS Code recommended)
3. **Basic knowledge of React and TypeScript** (don't worry, we'll explain as we go!)
4. **A wallet extension installed** (like Polkadot.js extension for testing)

## Quick Start with Boilerplate

The fastest way to get started is using our boilerplate project:

### Step 1: Get the Boilerplate

If you have access to the KeyPass repository:

```bash
# Navigate to the boilerplate
cd examples/boilerplate

# Install dependencies
npm install
```

If you're starting from scratch, you can create a new Vite + React project and follow the setup below.

### Step 2: Environment Setup

Create a `.env` file in your project root. This file stores configuration that shouldn't be shared publicly:

```bash
# Optional: WalletConnect Project ID (only needed for WalletConnect support)
# Get one at https://cloud.walletconnect.com/
WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Customize timeouts (in milliseconds)
WALLET_TIMEOUT=30000
MAX_MESSAGE_AGE_MS=300000
```

> **Beginner Note**: Environment variables are like settings for your app. The `.env` file keeps them organized and separate from your code.

### Step 3: Run the Application

```bash
# Start the development server
npm run dev
```

Open your browser to `http://localhost:5173` and you should see the KeyPass demo app!

## Understanding the Boilerplate

Let's break down what the boilerplate does and how you can customize it.

### Project Structure

```
your-project/
├── src/
│   ├── components/
│   │   └── WalletConnect.tsx    # Main wallet connection component
│   ├── App.tsx                  # Your main app component
│   ├── main.tsx                # App entry point
│   └── index.css               # Styles
├── .env                        # Environment variables
├── package.json               # Dependencies and scripts
├── vite.config.ts            # Build configuration
└── tsconfig.json            # TypeScript configuration
```

### The Main App Component

Here's what `App.tsx` looks like:

```tsx
import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';

function App() {
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);

  const handleConnect = (accounts: string[]) => {
    console.log('Connected accounts:', accounts);
    setConnectedAccounts(accounts);
  };

  const handleError = (error: Error) => {
    console.error('Wallet connection error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          KeyPass Demo
        </h1>
        <WalletConnect
          onConnect={handleConnect}
          onError={handleError}
        />
      </div>
    </div>
  );
}

export default App;
```

> **Beginner Note**: This is a React component. The `useState` hook stores data (like connected accounts), and the `handleConnect` function runs when a wallet connects successfully.

## Building Your Own Wallet Connection

Now let's create a simple wallet connection component from scratch:

### Step 1: Basic Wallet Connection

Create a new file `src/components/SimpleWallet.tsx`:

```tsx
import React, { useState } from 'react';
import { connectWallet } from '@keypass/login-sdk/dist/walletConnector';

interface SimpleWalletProps {
  onConnect: (accounts: string[]) => void;
}

export function SimpleWallet({ onConnect }: SimpleWalletProps) {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      // Show loading state
      setIsConnecting(true);
      setError(null);
      
      // Connect to wallet
      const wallet = await connectWallet();
      
      // Get available accounts
      const walletAccounts = await wallet.getAccounts();
      const accountAddresses = walletAccounts.map(acc => acc.address);
      
      // Update state
      setAccounts(accountAddresses);
      onConnect(accountAddresses);
      
    } catch (err) {
      // Handle errors
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      // Hide loading state
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
      
      {accounts.length === 0 ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div>
          <p className="text-green-600 mb-2">✅ Wallet Connected!</p>
          <div className="text-sm">
            <strong>Accounts:</strong>
            <ul className="mt-1">
              {accounts.map(account => (
                <li key={account} className="truncate">
                  {account}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}
```

> **Beginner Note**: This component uses `async/await` to handle the wallet connection. The `try/catch` block handles any errors that might occur.

### Step 2: Use Your Component

Replace the WalletConnect import in your `App.tsx`:

```tsx
import { SimpleWallet } from './components/SimpleWallet';

// In your return statement:
<SimpleWallet onConnect={handleConnect} />
```

## How Wallet Connection Works

Here's what happens when a user clicks "Connect Wallet":

1. **Detection**: The SDK looks for installed wallet extensions
2. **Selection**: If multiple wallets are found, it picks the best one
3. **Connection**: The wallet opens and asks the user to approve the connection
4. **Accounts**: Once approved, the SDK gets the user's wallet accounts
5. **Callback**: Your `onConnect` function is called with the account addresses

## Common Setup Issues

### Issue 1: "connectWallet is not defined"

**Problem**: Wrong import path
```tsx
// ❌ Wrong
import { connectWallet } from '@keypass/login-sdk';

// ✅ Correct
import { connectWallet } from '@keypass/login-sdk/dist/walletConnector';
```

### Issue 2: "Buffer is not defined" or similar errors

**Problem**: Missing browser polyfills. Update your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['util', 'buffer', 'process', 'stream', 'crypto', 'events'],
    }),
  ],
  // ... rest of config
})
```

Make sure to install the polyfills:
```bash
npm install --save-dev vite-plugin-node-polyfills
npm install util
```

### Issue 3: "No wallet found"

**Problem**: No wallet extension is installed
**Solution**: Install a wallet extension like:
- [Polkadot.js extension](https://polkadot.js.org/extension/)
- [Talisman](https://talisman.xyz/)

## Next Steps

Now that you have basic wallet connection working:

1. **Style it**: Customize the appearance with CSS or Tailwind
2. **Add features**: Handle wallet disconnection, multiple wallets
3. **Authentication**: Use the connected wallet for user authentication
4. **Error handling**: Add better error messages and retry logic

Check out the complete boilerplate (`examples/boilerplate/src/components/WalletConnect.tsx`) to see a full-featured implementation with:
- Multiple wallet support
- Account selection modal
- Automatic reconnection
- Session management
- Better error handling

## Understanding the Full Boilerplate

The boilerplate includes a more sophisticated `WalletConnect` component. Here are the key features:

### Multiple Wallet Support
- Connects to any available wallet automatically
- Handles multiple connected wallets
- Account selection modal when multiple accounts are available

### Error Handling
```tsx
try {
  const wallet = await connectWallet();
  // ... handle success
} catch (error) {
  if (error.message.includes('No wallet')) {
    setError('Please install a wallet extension');
  } else {
    setError('Connection failed. Please try again.');
  }
}
```

### Session Management
- Automatically checks if wallets are still connected
- Handles wallet disconnection gracefully
- Maintains connection state across page refreshes

## Advanced Features

Now that you understand the basics, let's explore some advanced features you can implement.

### Adding Wallet Disconnection

Let's enhance our simple wallet component to handle disconnection:

```tsx
import React, { useState } from 'react';
import { connectWallet } from '@keypass/login-sdk/dist/walletConnector';
import type { WalletAdapter } from '@keypass/login-sdk/dist/adapters/types';

interface AdvancedWalletProps {
  onConnect: (accounts: string[]) => void;
  onDisconnect: () => void;
}

export function AdvancedWallet({ onConnect, onDisconnect }: AdvancedWalletProps) {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const connectedWallet = await connectWallet();
      const walletAccounts = await connectedWallet.getAccounts();
      const accountAddresses = walletAccounts.map(acc => acc.address);
      
      setWallet(connectedWallet);
      setAccounts(accountAddresses);
      onConnect(accountAddresses);
      
      // Listen for wallet events
      connectedWallet.on('disconnect', handleDisconnect);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (wallet) {
      try {
        await wallet.disconnect();
      } catch (err) {
        console.error('Disconnect error:', err);
      }
    }
    
    setWallet(null);
    setAccounts([]);
    onDisconnect();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Advanced Wallet Connection</h2>
      
      {accounts.length === 0 ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div>
          <p className="text-green-600 mb-4">✅ Wallet Connected!</p>
          <div className="text-sm mb-4">
            <strong>Connected Accounts:</strong>
            <ul className="mt-1 space-y-1">
              {accounts.map(account => (
                <li key={account} className="p-2 bg-gray-50 rounded truncate">
                  {account}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}
```

### Handling Multiple Accounts

When a wallet has multiple accounts, you might want to let users choose which one to use:

```tsx
interface Account {
  address: string;
  name?: string;
}

export function AccountSelector({ accounts, onSelect }: {
  accounts: Account[];
  onSelect: (account: string) => void;
}) {
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Select Account</h3>
      <select
        value={selectedAccount}
        onChange={(e) => setSelectedAccount(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      >
        <option value="">Choose an account...</option>
        {accounts.map(account => (
          <option key={account.address} value={account.address}>
            {account.name || account.address}
          </option>
        ))}
      </select>
      <button
        onClick={() => onSelect(selectedAccount)}
        disabled={!selectedAccount}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Use This Account
      </button>
    </div>
  );
}
```

### Better Error Handling

Let's create a helper function to handle common wallet errors with user-friendly messages:

```tsx
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('no wallet') || message.includes('not found')) {
      return 'No wallet extension found. Please install Polkadot.js or Talisman.';
    }
    
    if (message.includes('rejected') || message.includes('cancelled')) {
      return 'Connection was cancelled. Please try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Connection timed out. Please check your wallet and try again.';
    }
    
    if (message.includes('already connected')) {
      return 'This wallet is already connected.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

// Usage in your component
const handleConnect = async () => {
  try {
    setIsConnecting(true);
    setError(null);
    
    const wallet = await connectWallet();
    // ... rest of connection logic
    
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setIsConnecting(false);
  }
};
```

### Loading States and User Feedback

Good user experience means showing what's happening. Here's a more detailed loading component:

```tsx
interface LoadingButtonProps {
  isLoading: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function LoadingButton({ isLoading, onClick, children, disabled }: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

### Persisting Connection State

You might want to remember if a user was connected when they return to your app:

```tsx
const [isInitialized, setIsInitialized] = useState(false);

// Check for existing connection on app load
useEffect(() => {
  const checkExistingConnection = async () => {
    const savedConnection = localStorage.getItem('wallet_connected');
    if (savedConnection) {
      try {
        // Try to reconnect
        await handleConnect();
      } catch (error) {
        // If reconnection fails, clear saved state
        localStorage.removeItem('wallet_connected');
      }
    }
    setIsInitialized(true);
  };

  checkExistingConnection();
}, []);

// Save connection state when connecting
const handleConnect = async () => {
  try {
    // ... connection logic
    localStorage.setItem('wallet_connected', 'true');
  } catch (error) {
    localStorage.removeItem('wallet_connected');
    throw error;
  }
};

// Clear connection state when disconnecting
const handleDisconnect = async () => {
  // ... disconnection logic
  localStorage.removeItem('wallet_connected');
};
```

## Best Practices

### 1. **Start Simple, Add Complexity Gradually**
- Begin with basic wallet connection (like our `SimpleWallet` component)
- Add features one at a time (disconnection, multiple accounts, etc.)
- Test each feature thoroughly before adding the next

### 2. **User Experience First**
```tsx
// ✅ Good: Clear loading states
<button disabled={isConnecting}>
  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
</button>

// ❌ Bad: No feedback
<button onClick={handleConnect}>Connect Wallet</button>
```

### 3. **Handle Errors Gracefully**
```tsx
// ✅ Good: User-friendly error messages
if (error.message.includes('No wallet found')) {
  setError('Please install a wallet extension like Polkadot.js');
}

// ❌ Bad: Technical error messages
setError(error.message); // "WalletNotConnectedError: Extension not found"
```

### 4. **Test with Real Wallets**
- Install Polkadot.js extension for testing
- Try connecting and disconnecting multiple times
- Test with different wallet states (locked, unlocked, no accounts)
- Test on different browsers

### 5. **Follow the Boilerplate Pattern**
The boilerplate at `examples/boilerplate` shows the recommended patterns:
- Component structure
- Error handling
- State management
- User interface design

## Next Steps

### 1. **Explore the Full Boilerplate**
Take a deep dive into the complete boilerplate implementation:
```bash
cd examples/boilerplate
npm install
npm run dev
```

The boilerplate includes:
- Multi-wallet support
- Account selection modal
- Dark mode toggle
- Comprehensive error handling
- Session persistence
- Production-ready styling

### 2. **Add Authentication**
Once you have wallet connection working, you might want to:
- Use wallet addresses for user identification
- Implement message signing for authentication
- Create user sessions
- Build user profiles

### 3. **Customize the UI**
Make it match your application:
- Update colors and fonts
- Add your branding
- Integrate with your existing design system
- Add animations and transitions

### 4. **Learn More**
Check out the other documentation:
- [API Reference](./api.md) - Complete API documentation
- [Integration Guide](./integration.md) - Advanced integration patterns
- [Architecture Documentation](./architecture.md) - How the SDK works internally

### 5. **Common Next Features**
Real applications often need:
- User authentication with wallet signatures
- Transaction signing
- Multi-chain support
- Mobile wallet support

## Troubleshooting

### Common Issues and Solutions

**"connectWallet is not defined"**
```tsx
// Make sure you're using the correct import path
import { connectWallet } from '@keypass/login-sdk/dist/walletConnector';
```

**"Buffer is not defined"**
```bash
# Install the required polyfills
npm install --save-dev vite-plugin-node-polyfills
npm install util

# Update your vite.config.ts with the polyfills
```

**"No wallet found"**
- Install a wallet extension (Polkadot.js, Talisman)
- Make sure the extension is enabled
- Try refreshing the page

**"Connection rejected"**
- Make sure you approve the connection in your wallet
- Check if the wallet is unlocked
- Try connecting again

**"Account not found after connecting"**
- Create accounts in your wallet extension
- Make sure accounts are not hidden/disabled
- Check wallet settings

## Getting Help

### 1. **Check the Examples**
- Look at the working boilerplate in `examples/boilerplate`
- Compare your code with the working examples
- Try running the boilerplate first

### 2. **Documentation**
- [API Reference](./api.md) - Complete API documentation
- [Integration Guide](./integration.md) - Advanced integration patterns
- [Architecture Documentation](./architecture.md) - How the SDK works

### 3. **Community Support**
- Visit our [GitHub repository](https://github.com/uliana1one/keypass)
- Open an issue for bugs or feature requests
- Check existing issues for solutions

## What You've Learned

Congratulations! You now know how to:

✅ Set up a React project with KeyPass SDK  
✅ Connect to blockchain wallets  
✅ Handle multiple accounts  
✅ Manage errors gracefully  
✅ Provide good user experience  
✅ Build production-ready wallet integration  

You're ready to build amazing dApps with KeyPass! 🚀

## License

Apache License 2.0 - see [LICENSE](../LICENSE) for details. 