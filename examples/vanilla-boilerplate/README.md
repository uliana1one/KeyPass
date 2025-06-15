# 🔐 KeyPass Vanilla JavaScript Boilerplate

A **zero-dependency**, single-file HTML demo showcasing **multi-chain authentication** with KeyPass SDK for both Polkadot and Ethereum ecosystems.

Perfect for beginners or when you need a simple, lightweight implementation without any build tools or frameworks.

## 🚀 Quick Start

### Prerequisites

1. **A wallet extension** installed:
   - **For Polkadot**: [Polkadot.js Extension](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/)
   - **For Ethereum**: [MetaMask](https://metamask.io/) or another Ethereum wallet

### Running the Demo

**Option 1: Direct File Opening**
1. Simply open `index.html` in your web browser
2. That's it! No installation required 🎉

**Option 2: Local Server (Recommended for development)**
```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)
npx serve .

# Using PHP (if installed)
php -S localhost:8000
```

Then navigate to [http://localhost:8000](http://localhost:8000)

## 📱 What You'll See

### Beautiful Interface
- **Animated gradient background** with glassmorphism design
- **Responsive layout** that works on desktop, tablet, and mobile
- **Smooth animations** and hover effects
- **Real-time loading states** and error handling

### Login Flow
1. **Chain Selection**: Choose between Polkadot (🟣) or Ethereum (🔷)
2. **Wallet Connection**: Simulated connection to wallet extensions
3. **Authentication Success**: Display user profile with wallet information
4. **Session Management**: Logout functionality to clear session

### After Authentication
- **Chain Badge**: Visual indicator of which blockchain was used
- **Wallet Address**: Full address in appropriate format (SS58 or hex)
- **DID**: Decentralized Identifier for the authenticated user
- **Login Timestamp**: When the authentication occurred
- **Logout Button**: Clear session and return to login screen

## 🔧 Customization Guide

### Adding Real KeyPass Integration

Currently uses mock functions. To integrate with real KeyPass SDK:

1. **Include KeyPass SDK** (add to `<head>` section):
   ```html
   <script src="https://unpkg.com/@keypass/login-sdk@latest/dist/keypass.min.js"></script>
   ```

2. **Replace mock functions** in the `<script>` section:
   ```javascript
   // Remove these mock functions:
   // async function mockLoginWithPolkadot() { ... }
   // async function mockLoginWithEthereum() { ... }

   // Use real KeyPass functions:
   async function handlePolkadotLogin() {
       setLoading(true);
       hideError();
       
       try {
           const result = await KeyPass.loginWithPolkadot(); // Real function
           showProfile(result);
       } catch (error) {
           showError(error.message || 'Polkadot login failed');
       } finally {
           setLoading(false);
       }
   }
   ```

### Styling Customization

All styles are contained in the `<style>` section. Easy to customize:

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

/* Modify the animated title */
h1 {
    background: linear-gradient(45deg, #color1, #color2, #color3, #color4);
}
```

### Adding More Chains

To support additional blockchains:

1. **Add new button** in the HTML:
   ```html
   <button class="login-button new-chain" id="newChainBtn">
       🔗 Login with NewChain
   </button>
   ```

2. **Add corresponding styles**:
   ```css
   .login-button.new-chain {
       background: linear-gradient(135deg, #new-color1, #new-color2);
   }
   ```

3. **Add event handler** in JavaScript:
   ```javascript
   async function handleNewChainLogin() {
       // Implementation for new chain
   }
   
   document.getElementById('newChainBtn').addEventListener('click', handleNewChainLogin);
   ```

## 🏗️ File Structure

```
vanilla-boilerplate/
├── index.html          # Complete single-file application
└── README.md          # This file
```

**Everything is in one file!** 📄
- HTML structure
- CSS styling with animations
- JavaScript functionality
- Mock data for demonstration

## 🔐 Security Features Demonstrated

- **Wallet Connection Security**: Proper error handling for connection failures
- **Chain-Specific Authentication**: Different flows for different blockchains
- **Session Management**: Secure login/logout functionality
- **Error Boundaries**: Comprehensive error handling and user feedback
- **Input Validation**: Proper validation of wallet responses
- **HTTPS Considerations**: Production-ready security notes

## 🌐 Production Deployment

### Environment Requirements

1. **HTTPS Required**: Web3 wallets require HTTPS in production
2. **CORS Configuration**: Ensure your server allows wallet extension requests
3. **Wallet Extensions**: Users must have appropriate extensions installed

### Deployment Options

**Static Hosting (Recommended):**
- **GitHub Pages**: Upload `index.html` to a repository
- **Netlify**: Drag and drop the file
- **Vercel**: Deploy with a single command
- **Traditional hosting**: Upload to any web server

**CDN Deployment:**
```bash
# Example with Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir .
```

## 🐛 Troubleshooting

### Common Issues

1. **"Wallet not found" error**
   - Ensure the appropriate wallet extension is installed
   - Try refreshing the page after installing the extension
   - Check browser console for detailed error messages

2. **Styling issues**
   - Clear browser cache
   - Check for browser compatibility (modern browsers required)
   - Verify CSS custom properties support

3. **JavaScript errors**
   - Open browser developer tools (F12)
   - Check the Console tab for error messages
   - Ensure JavaScript is enabled in your browser

4. **HTTPS errors in production**
   - Ensure your site is served over HTTPS
   - Check that wallet extensions allow your domain

### Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

**Required Features:**
- CSS Custom Properties
- ES6+ JavaScript features
- Fetch API
- Async/Await

### Debugging Tools

The demo exposes debugging functions to the global scope:

```javascript
// In browser console:
KeyPassDemo.currentUser()           // Get current user data
KeyPassDemo.showProfile(userData)   // Manually show profile
KeyPassDemo.showLogin()             // Return to login screen
```

## 📚 Learning Resources

### Understanding the Code

**HTML Structure:**
- Semantic HTML5 elements
- Accessible form controls
- Responsive meta tags

**CSS Features:**
- CSS Grid and Flexbox
- Custom properties (CSS variables)
- Keyframe animations
- Media queries for responsiveness
- Glassmorphism design patterns

**JavaScript Concepts:**
- Async/await for handling promises
- DOM manipulation and event handling
- State management with closures
- Error handling with try/catch
- Module pattern for organization

### Next Steps

1. **Learn React**: Try the [React boilerplate](../react-boilerplate/) for a more advanced implementation
2. **Explore KeyPass**: Read the [main documentation](../../docs/) for full API reference
3. **Build Your App**: Use this as a starting point for your own project

## 📄 License

This boilerplate is part of the KeyPass project and is licensed under the Apache License 2.0.

---

**Perfect for beginners!** 🌟 This single-file demo gives you everything you need to understand multi-chain authentication without any complexity. 