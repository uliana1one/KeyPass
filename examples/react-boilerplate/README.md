# 🔐 KeyPass React Boilerplate

A complete, ready-to-use React application demonstrating **multi-chain authentication** with KeyPass SDK for both Polkadot and Ethereum ecosystems.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

1. **Node.js 16+** installed ([Download here](https://nodejs.org/))
2. **A wallet extension** installed:
   - **For Polkadot**: [Polkadot.js Extension](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/)
   - **For Ethereum**: [MetaMask](https://metamask.io/) or another Ethereum wallet

### Installation & Setup

1. **Clone and navigate to this directory:**
   ```bash
   cd examples/react-boilerplate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

That's it! 🎉 You now have a working multi-chain authentication demo.

## 📱 What You'll See

### Login Screen
- **Beautiful gradient interface** with chain selection
- **Polkadot login button** (🟣) - connects to Polkadot.js/Talisman
- **Ethereum login button** (🔷) - connects to MetaMask/other Ethereum wallets
- **Prerequisites checklist** with helpful links
- **Real-time error handling** and loading states

### After Authentication
- **User profile display** with authenticated wallet information
- **Chain badge** showing which blockchain was used
- **Wallet address** in the appropriate format (SS58 or hex)
- **DID (Decentralized Identifier)** for the authenticated user
- **Login timestamp** and session information
- **Logout functionality** to clear the session

## 🔧 Customization Guide

### Adding Real KeyPass Integration

Currently, this demo uses mock functions. To integrate with the real KeyPass SDK:

1. **Install KeyPass SDK:**
   ```bash
   npm install @keypass/login-sdk
   ```

2. **Replace mock functions in `src/App.tsx`:**
   ```typescript
   // Remove these mock functions:
   // const mockLoginWithPolkadot = async () => { ... }
   // const mockLoginWithEthereum = async () => { ... }

   // Add real imports:
   import { loginWithPolkadot, loginWithEthereum } from '@keypass/login-sdk';

   // Update the handlers:
   const handlePolkadotLogin = async () => {
     setLoading(true);
     setError(null);
     try {
       const result = await loginWithPolkadot(); // Real function
       setLoginResult(result);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Login failed');
     } finally {
       setLoading(false);
     }
   };
   ```

### Styling Customization

The app uses CSS custom properties for easy theming. Edit `src/App.css`:

```css
/* Change the gradient background */
body {
  background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}

/* Customize button colors */
.login-button.polkadot {
  background: linear-gradient(135deg, #your-polkadot-color1, #your-polkadot-color2);
}

.login-button.ethereum {
  background: linear-gradient(135deg, #your-ethereum-color1, #your-ethereum-color2);
}
```

### Adding More Chains

To add support for additional blockchains:

1. **Add new login function:**
   ```typescript
   const handleNewChainLogin = async () => {
     // Implementation for new chain
   };
   ```

2. **Add new button:**
   ```jsx
   <button 
     className="login-button new-chain"
     onClick={handleNewChainLogin}
     disabled={loading}
   >
     🔗 Login with NewChain
   </button>
   ```

3. **Add corresponding CSS styles**

## 🏗️ Project Structure

```
react-boilerplate/
├── public/
│   └── index.html          # Main HTML template
├── src/
│   ├── App.tsx            # Main React component
│   ├── App.css            # Styling and animations
│   └── index.tsx          # React entry point
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## 🔐 Security Features Demonstrated

- **Wallet Connection Security**: Proper error handling for wallet connection failures
- **Chain-Specific Authentication**: Different authentication flows for different blockchains
- **Session Management**: Secure login/logout functionality
- **Error Boundaries**: Comprehensive error handling and user feedback
- **HTTPS Requirements**: Production-ready security considerations

## 🛠️ Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

## 🌐 Production Deployment

### Environment Requirements

1. **HTTPS Required**: Web3 wallets require HTTPS in production
2. **CORS Configuration**: Ensure your backend allows requests from your domain
3. **Wallet Extensions**: Users must have appropriate wallet extensions installed

### Build for Production

```bash
npm run build
```

This creates a `build/` directory with optimized production files.

### Deployment Options

- **Vercel**: `npm i -g vercel && vercel`
- **Netlify**: Drag and drop the `build/` folder
- **GitHub Pages**: Use `gh-pages` package
- **Traditional hosting**: Upload `build/` contents to your web server

## 🐛 Troubleshooting

### Common Issues

1. **"Wallet not found" error**
   - Ensure the appropriate wallet extension is installed
   - Try refreshing the page after installing the extension

2. **Connection timeout**
   - Check if the wallet extension is unlocked
   - Verify the wallet has accounts available

3. **HTTPS errors in production**
   - Ensure your site is served over HTTPS
   - Check that wallet extensions allow your domain

4. **Styling issues**
   - Clear browser cache
   - Check for CSS conflicts with other stylesheets

### Getting Help

- 📖 [KeyPass Documentation](../../docs/)
- 🐛 [Report Issues](https://github.com/uliana1one/keypass/issues)
- 💬 [Community Discussions](https://github.com/uliana1one/keypass/discussions)

## 📄 License

This boilerplate is part of the KeyPass project and is licensed under the Apache License 2.0.

---

**Happy coding!** 🚀 This boilerplate gives you everything you need to start building multi-chain authentication into your React applications. 