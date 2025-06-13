# Testing Guide for KeyPass Boilerplate

This guide provides step-by-step instructions for running and testing the KeyPass boilerplate project.

## Prerequisites

Before you begin, ensure you have:

1. Node.js v20 or later installed (required for the library)
   ```bash
   node --version  # Should show v20.x or higher
   ```

2. npm v10.2.4 or later (recommended for stability)
   ```bash
   npm --version  # Should show 10.2.4 or higher
   ```

3. Git installed and configured
   ```bash
   git --version
   ```

4. A modern web browser (Chrome, Firefox, or Edge recommended)
   - Chrome/Edge: Install [Polkadot.js Extension](https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd)
   - Firefox: Install [Polkadot.js Extension](https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/)

5. A WalletConnect project ID (optional for initial testing)
   - Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Sign up and create a new project
   - Copy your project ID

## Step-by-Step Setup

### 1. Set Up the Library Locally

Since the library is in development and not published to npm, we need to set it up locally:

```bash
# Make sure you're in the main library directory
cd /Users/admin/KeyPass  # Adjust path as needed

# Verify you're in the right directory
ls package.json  # Should show the library's package.json

# Install dependencies with specific npm version
npm install -g npm@10.2.4
npm install

# Build the library
npm run build

# Verify the build
ls dist  # Should show built files including walletConnector.js

# Create a local link to the library
npm link
```

### 2. Set Up the Boilerplate

```bash
# Go to the boilerplate directory
cd examples/boilerplate

# Verify you're in the boilerplate directory
pwd  # Should end with /keypass/examples/boilerplate
ls   # Should show package.json and other project files

# Remove any existing node_modules and lock file
rm -rf node_modules package-lock.json

# Install dependencies
npm install

# Link to the local library
npm link @keypass/login-sdk

# Verify the link
npm ls @keypass/login-sdk  # Should show the local version
```

If you see any errors during installation:
```bash
# Try clearing npm cache and reinstalling
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm link @keypass/login-sdk  # Re-link the library

# If you still have issues, try:
cd ../..  # Go back to main library directory
npm run build
npm link
cd examples/boilerplate
npm link @keypass/login-sdk
```

### 3. Configure Environment

Create a new `.env` file in the boilerplate directory:

```bash
# Create .env file
cat > .env << EOL
# Required: Get your project ID from https://cloud.walletconnect.com/
WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Wallet connection timeout in milliseconds
WALLET_TIMEOUT=30000

# Optional: Maximum age of authentication messages in milliseconds
MAX_MESSAGE_AGE_MS=300000

# Optional: Override default API endpoint
AUTH_ENDPOINT=http://localhost:3000/api/auth/login

# Optional: Enable debug logging
DEBUG=keypass:*
EOL
```

> **Note**: For initial testing, you can use a placeholder project ID. The wallet connection will still work with Polkadot.js extension, but WalletConnect features will be limited.

### 4. Start Development Server

```bash
# Verify vite is installed locally
npm list vite

# Start the development server using npx (recommended)
npx vite

# Or use the full path
./node_modules/.bin/vite
```

The application should now be running at http://localhost:3000

### 5. Verify Setup

1. Open your browser to http://localhost:3000
2. Open browser developer tools (F12)
3. Check the console for any errors
4. Verify that the page loads without errors

If you see any errors:
```bash
# Check if the library is linked correctly
npm ls @keypass/login-sdk

# If the link is broken, try relinking
cd ../..  # Go back to the main library directory
npm run build
npm link
cd examples/boilerplate
npm link @keypass/login-sdk

# Check for TypeScript errors
npx tsc --noEmit
```

## Testing Different Scenarios

### 1. Basic Wallet Connection

1. Open http://localhost:3000 in your browser
2. Click "Connect Wallet"
3. Select your wallet (Polkadot.js or Talisman)
4. Approve the connection request
5. Verify that your account address is displayed

Expected Result:
- Wallet connection dialog appears
- Account address is displayed after connection
- No error messages

### 2. Multiple Account Selection

1. Connect your wallet
2. Open your wallet extension
3. Switch to a different account
4. Verify the UI updates

Expected Result:
- UI updates to show the new account
- Connection remains stable

### 3. Disconnection

1. Click the "Disconnect" button
2. Verify the wallet disconnects
3. Try reconnecting

Expected Result:
- Wallet disconnects cleanly
- UI returns to initial state
- Can reconnect successfully

### 4. Session Management

1. Connect your wallet
2. Leave the page open for a while
3. Try performing an action after some time

Expected Result:
- Session remains active
- Can perform actions without reconnecting
- Session expiry handled gracefully

## Troubleshooting

### Common Issues and Solutions

#### 1. Module Import Issues

Symptoms:
- "The requested module does not provide an export named X" error
- "Cannot find module" error
- White screen with no errors

Solutions:
```bash
# 1. Verify the library build
cd ../..  # Go to main library directory
ls dist    # Should show built files
npm run build  # Rebuild if needed

# 2. Check the import path in your component
# The correct import should be:
import { connectWallet } from '@keypass/login-sdk/dist/walletConnector';

# 3. Verify Vite configuration
# Make sure vite.config.ts includes:
optimizeDeps: {
  include: ['@keypass/login-sdk'],
  esbuildOptions: {
    target: 'es2020',
  },
},
build: {
  target: 'es2020',
  commonjsOptions: {
    include: [/@keypass\/login-sdk/, /node_modules/],
    transformMixedEsModules: true,
  },
}
```

#### 2. Library Not Found or Link Issues

Symptoms:
- "Cannot find module '@keypass/login-sdk'" error
- npm link not working
- Changes not reflecting

Solutions:
```bash
# 1. Verify library build
cd ../..  # Go to main library directory
ls dist    # Should show built files
npm run build  # Rebuild if needed

# 2. Check library link
npm ls -g @keypass/login-sdk  # Should show the global link
cd examples/boilerplate
npm ls @keypass/login-sdk     # Should show the local link

# 3. Fix broken links
cd ../..  # Go to main library directory
npm unlink  # Remove global link
npm link    # Create new global link
cd examples/boilerplate
npm unlink @keypass/login-sdk  # Remove local link
npm link @keypass/login-sdk    # Create new local link
```

#### 3. Build Issues

Symptoms:
- TypeScript errors
- Build failures
- Missing type definitions

Solutions:
```bash
# 1. Clean and rebuild
cd ../..  # Go to main library directory
rm -rf dist
npm run build

# 2. Check TypeScript
npx tsc --noEmit

# 3. Verify types
ls dist/types  # Should show .d.ts files
```

#### 4. Wallet Connection Issues

Symptoms:
- Wallet not found
- Connection timeout
- No accounts available

Solutions:
1. **Wallet Not Found**
   - Ensure the Polkadot.js extension is installed
   - Check if the extension is enabled
   - Try refreshing the page
   - Check browser console for errors

2. **Connection Timeout**
   - Check internet connection
   - Verify wallet extension is responsive
   - Increase timeout in .env:
     ```
     WALLET_TIMEOUT=60000  # Increase to 60 seconds
     ```

3. **No Accounts Available**
   - Open your wallet extension
   - Verify you have accounts created
   - Try creating a new account
   - Check if the wallet is unlocked

### Debugging Tips

1. Enable Debug Logging:
```bash
# Add to .env file:
DEBUG=keypass:*
```

2. Check Browser Console:
- Open Developer Tools (F12)
- Look for errors in Console tab
- Check Network tab for API calls

3. Verify Environment:
```bash
# Check if environment variables are loaded
console.log(import.meta.env)
```

4. Test Wallet Connection:
```typescript
// In browser console:
const wallet = await window.injectedWeb3['polkadot-js'].enable('KeyPass Demo')
console.log(await wallet.getAccounts())
```

## Next Steps

After testing the basic functionality:

1. Try implementing custom wallet selection
2. Add authentication flow
3. Implement session persistence
4. Add error recovery mechanisms
5. Test with different networks

For more advanced testing scenarios, refer to the [Integration Guide](../docs/integration.md) and [API Reference](../docs/api.md).

### Polyfills for Node.js Modules in Browser

If you see errors like `global is not defined` or `util.inherits is not a function`, you need to polyfill Node.js core modules for browser compatibility:

1. Install the required package:

```bash
npm install --save-dev vite-plugin-node-polyfills
```

2. Update your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports
      protocolImports: true,
      // Polyfills to include
      include: ['util', 'buffer', 'process', 'stream', 'crypto', 'events'],
    }),
  ],
  optimizeDeps: {
    include: ['@keypass/login-sdk'],
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      include: [/@keypass\/login-sdk/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
});
```

3. Clean and reinstall dependencies:

```bash
# Remove existing dependencies
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Start the development server
npm run dev
```

This configuration will properly polyfill Node.js built-in modules in the browser environment, resolving common errors like:
- `util.inherits is not a function`
- `global is not defined`
- `process is not defined`
- Other Node.js core module related errors

If you still encounter issues after applying these changes:
1. Clear your browser cache
2. Restart the development server
3. Check the browser console for any remaining errors
4. Verify that all dependencies are installed correctly with `npm ls`
