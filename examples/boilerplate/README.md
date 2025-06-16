# KeyPass Boilerplate Example

This boilerplate demonstrates how to integrate **wallet selection functionality** with the KeyPass Core SDK. It shows how to build a complete wallet authentication experience with React, TypeScript, and modern UI patterns.

## 🏗️ What This Example Provides

### **Frontend Implementation Features**
- ✅ **Complete wallet selection flow**: Chain → Wallet → Account selection
- ✅ **Multi-chain support**: Polkadot and Ethereum authentication
- ✅ **Professional UI**: Modern glassmorphism design with animations
- ✅ **Comprehensive error handling**: User-friendly error messages and retry logic
- ✅ **Responsive design**: Works on desktop and mobile devices

### **Core SDK Integration**
- ✅ **Uses KeyPass Core SDK**: Integrates authentication functions underneath the UI
- ✅ **Server verification**: Demonstrates signature verification with KeyPass server
- ✅ **Session management**: Shows how to handle login/logout flows

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** 
- **KeyPass Server** running (for signature verification)
- **Wallet Extensions**:
  - [Polkadot.js Extension](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/)
  - [MetaMask](https://metamask.io/) or another Ethereum wallet

### Installation & Setup

1. **Start the KeyPass Server** (from the main project directory):
```bash
cd ../../  # Go to main KeyPass directory
npm install
npm start
# Server starts on http://localhost:3000
```

2. **Run this example**:
```bash
cd examples/boilerplate
npm install
npm start
# Example starts on http://localhost:3001
```

3. **Open your browser** and navigate to `http://localhost:3001`

## 🎯 How It Works

### **Authentication Flow**
1. **Chain Selection**: User chooses Polkadot or Ethereum
2. **Wallet Detection**: Automatically detects installed wallet extensions
3. **Wallet Selection**: User selects preferred wallet from available options
4. **Account Selection**: User chooses specific account from wallet
5. **Authentication**: Signs message and verifies with KeyPass server

### **Implementation Architecture**
```
┌─────────────────────────────────────┐
│        This Example                 │
├─────────────────────────────────────┤
│  • React Components                │
│  • Wallet Selection UI             │
│  • Account Selection UI            │
│  • Error Handling                  │
│  • State Management                │
├─────────────────────────────────────┤
│       KeyPass Core SDK              │ ← npm install @keypass/login-sdk
│  • loginWithPolkadot()             │
│  • loginWithEthereum()             │
│  • Wallet Adapters                 │
│  • Server Communication            │
└─────────────────────────────────────┘
```

## 📁 Project Structure

```
examples/boilerplate/
├── src/
│   ├── components/
│   │   ├── WalletSelection.tsx     # Wallet selection UI component
│   │   ├── AccountSelection.tsx    # Account selection UI component
│   │   └── ErrorMessage.tsx        # Error handling component
│   ├── hooks/
│   │   ├── useWalletDetection.ts   # Wallet detection logic
│   │   └── useAuthentication.ts    # Authentication state management
│   ├── types/
│   │   └── wallet.ts               # TypeScript type definitions
│   ├── utils/
│   │   ├── walletDetection.ts      # Wallet detection functions
│   │   └── authentication.ts       # Authentication helpers
│   ├── App.tsx                     # Main application component
│   └── main.tsx                    # Application entry point
├── public/                         # Static assets
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
└── README.md                       # This file
```

## 🔧 Key Implementation Details

### **Wallet Detection Pattern**
```typescript
// Example of wallet detection implementation
const detectPolkadotWallets = async (): Promise<Wallet[]> => {
  const wallets: Wallet[] = [];
  
  if (window.injectedWeb3) {
    const extensions = Object.keys(window.injectedWeb3);
    
    for (const extensionName of extensions) {
      const extension = window.injectedWeb3[extensionName];
      
      wallets.push({
        id: extensionName,
        name: getWalletDisplayName(extensionName),
        status: extension.enable ? 'Available' : 'Not Compatible',
        available: extension.enable !== undefined,
        extension: extension
      });
    }
  }
  
  return wallets;
};
```

### **Account Selection Pattern**
```typescript
// Example of account fetching implementation
const getPolkadotAccounts = async (wallet: Wallet): Promise<Account[]> => {
  const injectedExtension = await wallet.extension.enable('KeyPass Demo');
  const accounts = await injectedExtension.accounts.get();
  
  return accounts.map(account => ({
    address: account.address,
    name: account.name || 'Unnamed Account',
    meta: account.meta,
    injectedExtension: injectedExtension
  }));
};
```

### **Core SDK Integration**
```typescript
// How this example uses Core SDK after wallet selection
import { loginWithPolkadot, loginWithEthereum } from '@keypass/login-sdk';

// After user selects wallet and account, authenticate with Core SDK
const authenticateWithSelectedAccount = async (account: Account) => {
  try {
    if (currentChainType === 'polkadot') {
      const result = await loginWithPolkadot(/* account details */);
      return result;
    } else {
      const result = await loginWithEthereum(/* account details */);
      return result;
    }
  } catch (error) {
    handleAuthenticationError(error);
  }
};
```

## 🎨 Customization Guide

### **1. Modify Wallet Selection UI**
Edit `src/components/WalletSelection.tsx` to customize:
- Visual styling and animations
- Wallet logos and branding
- Layout and responsive behavior

### **2. Add New Wallet Support**
Extend `src/utils/walletDetection.ts`:
```typescript
// Add support for new wallets
if (extensionName === 'your-custom-wallet') {
  displayName = 'Your Custom Wallet';
  // Add custom detection logic
}
```

### **3. Customize Error Handling**
Modify `src/components/ErrorMessage.tsx`:
- Custom error messages
- Error recovery flows
- User guidance for common issues

### **4. Styling Customization**
The example uses Tailwind CSS:
- Update `tailwind.config.js` for custom themes
- Modify component styles in individual `.tsx` files
- Add custom CSS in `src/index.css`

## 🛡️ Security Considerations

### **Production Checklist**
- [ ] **HTTPS required**: Deploy with SSL certificate
- [ ] **Environment variables**: Store sensitive data securely
- [ ] **CORS configuration**: Properly configure API endpoints
- [ ] **Input validation**: Validate all user inputs and wallet responses
- [ ] **Error handling**: Don't expose sensitive information in error messages

### **Best Practices Implemented**
- ✅ **No private key storage**: Never stores or transmits private keys
- ✅ **Message signing**: Uses secure message signing patterns
- ✅ **Server verification**: Validates signatures on server side
- ✅ **Session management**: Proper login/logout flows

## 🐛 Troubleshooting

### **Common Issues**

#### Server Connection Problems
```bash
# Ensure KeyPass server is running
cd ../../  # Go to main KeyPass directory
npm start
# Should show: "Server running on port 3000"
```

#### Port Conflicts
```bash
# If port 3001 is busy, use different port
PORT=3002 npm start
```

#### Wallet Detection Issues
- **Install wallet extensions**: Ensure Polkadot.js, Talisman, or MetaMask are installed
- **Refresh page**: After installing new wallet extensions
- **Check browser console**: Look for error messages and extension injection

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Learning Resources

### **Understanding the Code**
1. **Start with** `src/App.tsx` - Main application logic
2. **Study** `src/utils/walletDetection.ts` - Wallet detection patterns
3. **Review** `src/hooks/useAuthentication.ts` - State management patterns
4. **Examine** component files for UI implementation details

### **Next Steps**
- **Customize** the UI to match your brand
- **Add** additional wallet support
- **Integrate** with your existing application
- **Deploy** to production with proper security measures

### **Related Documentation**
- 📘 [Main KeyPass Documentation](../../docs/) - Core SDK API reference
- 🔗 [Wallet Selection Guide](../WALLET_SELECTION.md) - Implementation patterns
- 📄 [Examples Overview](../README.md) - All available examples

## 🚀 Deployment

### **Development Deployment**
```bash
npm run build
npm run preview
```

### **Production Deployment**
```bash
# Build for production
npm run build

# Deploy to your hosting platform
# The build files will be in the `dist/` directory
```

### **Environment Variables**
Create `.env.local` for local development:
```env
VITE_KEYPASS_SERVER_URL=http://localhost:3000
```

## 🤝 Contributing

Found an issue or want to improve this example?

1. **Fork** the repository
2. **Make** your changes
3. **Test** thoroughly
4. **Submit** a pull request with detailed description

## 📞 Support

- 💬 [GitHub Discussions](https://github.com/uliana1one/keypass/discussions)
- 🐛 [Issue Tracker](https://github.com/uliana1one/keypass/issues)
- 📖 [Documentation](../../docs/)

---

**Ready to customize?** 🎉 This boilerplate provides a solid foundation for building wallet selection experiences. Copy the patterns, customize the UI, and integrate with your application! 