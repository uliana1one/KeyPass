# KeyPass Demo - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Install Dependencies

```bash
cd examples/react-boilerplate
npm install
```

### 2. Start the Demo

```bash
npm start
```

Opens at http://localhost:3000

### 3. Try It Out

1. Click "Login with Ethereum" or "Login with Polkadot"
2. Connect your wallet (MetaMask or Polkadot.js)
3. Follow the DID creation wizard
4. Explore SBT minting and credentials

---

## 🎯 What Works

✅ **Multi-chain authentication** - Connect with any supported wallet  
✅ **DID creation** - Full wizard with multiple DID types  
✅ **SBT minting** - UI for creating soulbound tokens  
✅ **Credential dashboard** - View verifiable credentials  
✅ **zk-Proof demo** - Privacy-preserving proofs  

---

## 📱 Features to Test

### Login Flow
- Choose chain (Polkadot/Ethereum/KILT)
- Select wallet extension
- Authenticate with signature

### DID Management
- Create DID with wizard
- Configure DID properties
- View DID document

### Credentials
- Browse credential offers
- View existing credentials
- Generate zk-proofs

### SBT Tokens
- View token collection
- Mint new tokens
- Check token metadata

---

## 🔧 Environment (Optional)

The demo works without configuration (mock mode). For real blockchain:

Create `.env`:
```env
REACT_APP_MOONBEAM_RPC_URL=https://rpc.api.moonbase.moonbeam.network
REACT_APP_SBT_CONTRACT_ADDRESS=0x...
REACT_APP_KILT_WSS_ENDPOINT=wss://spiritnet.kilt.io
```

---

**That's it! The demo is fully functional.** 🚀

