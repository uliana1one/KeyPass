# 🚀 KeyPass Examples & Tutorials

Welcome to the **KeyPass Examples** directory! Here you'll find complete, working examples and boilerplates to help you integrate multi-chain authentication into your applications.

## 📁 Available Examples

### 🔷 [React Boilerplate](./react-boilerplate/)
**Complete React application with TypeScript**
- ✅ **Wallet & Account Selection**: Choose your preferred wallet and account
- ✅ Modern React 18 with TypeScript
- ✅ Beautiful UI with animations and responsive design
- ✅ Multi-chain authentication (Polkadot + Ethereum)
- ✅ Production-ready build system
- ✅ Comprehensive error handling
- ✅ Easy customization and theming

**Perfect for:** Production applications, React developers, TypeScript projects

```bash
cd examples/react-boilerplate
npm install
npm start
```

### 🌟 [Vanilla JavaScript Boilerplate](./vanilla-boilerplate/)
**Single-file HTML demo with zero dependencies**
- ✅ **Wallet & Account Selection**: Interactive wallet and account picker
- ✅ No build tools or frameworks required
- ✅ Pure HTML, CSS, and JavaScript
- ✅ Glassmorphism design with animations
- ✅ Mobile-responsive interface
- ✅ Educational code comments
- ✅ Easy to understand and modify

**Perfect for:** Beginners, quick prototypes, learning purposes

```bash
# Just open the file in your browser!
open examples/vanilla-boilerplate/index.html
```

### 📄 [Ethereum Login Example](./ethereum-login.html)
**Simple Ethereum-only authentication demo**
- ✅ Focused on Ethereum ecosystem
- ✅ MetaMask integration example
- ✅ Basic HTML/JavaScript implementation
- ✅ Educational comments and explanations

**Perfect for:** Ethereum-specific projects, learning Ethereum auth

## 🎯 Choose Your Starting Point

### 👨‍💻 **For Experienced Developers**
→ Start with [**React Boilerplate**](./react-boilerplate/) for a full-featured, production-ready foundation

### 🌱 **For Beginners**
→ Start with [**Vanilla JavaScript Boilerplate**](./vanilla-boilerplate/) to understand the fundamentals

### ⚡ **For Quick Prototypes**
→ Use [**Vanilla JavaScript Boilerplate**](./vanilla-boilerplate/) for rapid development without setup

### 🔷 **For Ethereum-Only Projects**
→ Check out [**Ethereum Login Example**](./ethereum-login.html) for a focused implementation

## 🛠️ What You'll Learn

### Core Concepts
- **Wallet & Account Selection** with multiple wallet support
- **Multi-chain authentication** with Polkadot and Ethereum
- **Wallet integration** with browser extensions
- **DID (Decentralized Identity)** creation and management
- **Secure session management** and logout flows
- **Error handling** for wallet connection issues

### Technical Skills
- **Frontend integration** with KeyPass SDK
- **Responsive UI design** for Web3 applications
- **State management** for authentication flows
- **Security best practices** for Web3 apps
- **Production deployment** considerations

## 🚀 Quick Start Guide

### 1. **Choose Your Example**
Pick the example that best matches your experience level and project needs.

### 2. **Install Prerequisites**
- **Node.js 16+** (for React boilerplate)
- **Wallet Extensions**:
  - [Polkadot.js Extension](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/)
  - [MetaMask](https://metamask.io/) or another Ethereum wallet

### 3. **Start the KeyPass Server**
The examples require the KeyPass backend server to be running for authentication:

```bash
# From the root KeyPass directory
cd /Users/jane/KeyPass
npm start
```

The server will start on port 3000 and show:
```
Server running on port 3000
Verification endpoint available at http://0.0.0.0:3000/api/verify
```

### 4. **Run the Example**

#### For React Boilerplate:
```bash
cd examples/react-boilerplate
npm install
npm start
```

#### For Vanilla JavaScript Boilerplate:
```bash
# Navigate to the vanilla boilerplate directory
cd /Users/jane/KeyPass/examples/vanilla-boilerplate

# Start a local HTTP server (choose an available port)
python3 -m http.server 8006
```

Then open `http://localhost:8006` in your browser.

**Note**: If port 8006 is busy, try other ports like 8001, 8002, 8003, etc.

### 5. **Customize for Your Needs**
Each example includes detailed customization guides.

## 🔐 Security Considerations

### Production Checklist
- [ ] **HTTPS Required**: All Web3 wallets require HTTPS in production
- [ ] **CORS Configuration**: Ensure proper CORS headers for API calls
- [ ] **Input Validation**: Validate all wallet responses on the server
- [ ] **Session Security**: Implement secure session management
- [ ] **Error Handling**: Never expose sensitive information in error messages

### Best Practices
- **Never store private keys** in your application
- **Always validate signatures** on the server side
- **Use HTTPS** for all production deployments
- **Implement proper logout** functionality
- **Handle wallet disconnection** gracefully

## 🌐 Deployment Options

### Static Hosting (Recommended for demos)
- **Vercel**: `npm i -g vercel && vercel`
- **Netlify**: Drag and drop build folder
- **GitHub Pages**: Push to repository with GitHub Actions
- **Traditional hosting**: Upload build files to web server

### Full-Stack Deployment
- **Vercel + API Routes**: Full-stack React with serverless functions
- **Netlify + Functions**: JAMstack with serverless backend
- **Traditional hosting**: Separate frontend and backend deployment

## 🐛 Common Issues & Solutions

### Server Setup Issues

#### KeyPass Server Already Running
If you see "Something is already running on port 3000", you can:
```bash
# Kill the existing process
lsof -ti:3000 | xargs kill -9

# Or start on a different port
PORT=3001 npm start
```

#### Vanilla Boilerplate Directory Not Found
Make sure you're using the full path:
```bash
# ❌ Wrong (from KeyPass root)
cd vanilla-boilerplate

# ✅ Correct (full path)
cd /Users/jane/KeyPass/examples/vanilla-boilerplate
```

#### Port Already in Use
If your chosen port is busy, try different ports:
```bash
# Try different ports until one works
python3 -m http.server 8001
python3 -m http.server 8002
python3 -m http.server 8006
```

#### Server Shows Directory Listing Instead of HTML
This is normal! Click on `index.html` in the directory listing, or navigate directly to:
```
http://localhost:8006/index.html
```

### Wallet Connection Issues
```javascript
// Always check if wallet is available
if (!window.ethereum) {
    throw new Error('Please install MetaMask or another Ethereum wallet');
}

// Handle user rejection
try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
} catch (error) {
    if (error.code === 4001) {
        throw new Error('User rejected the connection request');
    }
    throw error;
}
```

### HTTPS Requirements
```bash
# For local development with HTTPS
npm install -g local-ssl-proxy
local-ssl-proxy --source 3001 --target 3000
# Now access https://localhost:3001
```

### CORS Issues
```javascript
// Server-side CORS configuration
app.use(cors({
    origin: ['https://yourdomain.com', 'https://localhost:3001'],
    credentials: true
}));
```

## 📚 Learning Path

### Beginner Path
1. **Start** with [Vanilla JavaScript Boilerplate](./vanilla-boilerplate/)
2. **Understand** the authentication flow and UI patterns
3. **Experiment** with customizations and styling
4. **Move to** [React Boilerplate](./react-boilerplate/) when ready

### Advanced Path
1. **Start** with [React Boilerplate](./react-boilerplate/)
2. **Integrate** with your existing React application
3. **Add** server-side verification using KeyPass server SDK
4. **Deploy** to production with proper security measures

## 🤝 Contributing

Found an issue or want to improve an example?

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b improve-react-example`
3. **Make** your changes with clear commit messages
4. **Test** your changes thoroughly
5. **Submit** a pull request with a detailed description

### Example Improvement Ideas
- Add more blockchain support (Solana, Cosmos, etc.)
- Create framework-specific examples (Vue.js, Angular, Svelte)
- Add advanced features (multi-signature, social recovery)
- Improve accessibility and internationalization
- Add comprehensive testing examples

## 📖 Additional Resources

### Documentation
- 📘 [Main KeyPass Documentation](../docs/)
- 🔧 [API Reference](../docs/api/)
- 🛡️ [Security Guide](../docs/security/)
- 🔗 [Wallet & Account Selection Guide](./WALLET_SELECTION.md)

### Community
- 💬 [GitHub Discussions](https://github.com/uliana1one/keypass/discussions)
- 🐛 [Issue Tracker](https://github.com/uliana1one/keypass/issues)
- 📧 [Contact Support](mailto:support@keypass.dev)

### External Resources
- 🟣 [Polkadot.js Documentation](https://polkadot.js.org/docs/)
- 🔷 [Ethereum Development Resources](https://ethereum.org/developers/)
- 🌐 [Web3 Best Practices](https://consensys.github.io/smart-contract-best-practices/)

---

**Happy coding!** 🎉 These examples provide everything you need to start building secure, multi-chain authentication into your applications. Choose your starting point and begin your Web3 journey today! 