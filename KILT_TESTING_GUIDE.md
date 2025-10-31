# 🧪 KILT Integration Live Testing Guide

Test the complete KILT DID integration with real blockchain interaction on KILT Peregrine testnet.

## 🚀 Quick Start

### Option 1: Node.js Command Line Test
```bash
# Install dependencies
npm install keypass-login-sdk

# Run the test script
node test-kilt-integration.js
```

### Option 2: Browser Interactive Test
```bash
# Serve the HTML file (required for wallet connection)
npx http-server . -p 8080 --cors

# Open in browser (HTTPS required for wallet connection)
# If testing locally, use: https://localhost:8080/test-kilt-browser.html
```

## 📋 Prerequisites

### 1. Install a Polkadot Wallet
Choose one of these browser extensions:
- **[Polkadot.js Extension](https://polkadot.js.org/extension/)** (Recommended)
- **[Talisman Wallet](https://talisman.xyz/)**

### 2. Get KILT Testnet Tokens
1. Go to **[KILT Peregrine Faucet](https://faucet.peregrine.kilt.io/)**
2. Enter your KILT address
3. Request testnet tokens (you need ~0.1 KILT for DID registration)

### 3. Setup Your Wallet
1. Create or import a KILT account in your wallet
2. Make sure you're connected to the **KILT Peregrine** network
3. Verify you have testnet tokens in your account

## 🧩 What Each Test Does

### ✅ **Connection Test**
- Connects to KILT Peregrine testnet
- Verifies blockchain connectivity
- Shows chain information (genesis hash, version)

### ✅ **Wallet Integration Test**
- Enables wallet extension
- Gets your accounts
- Shows connected wallet info

### ✅ **Balance Check Test**
- Queries your KILT token balance
- Verifies you have enough tokens for DID registration
- Shows minimum required amount (0.001 KILT)

### ✅ **On-Chain DID Creation Test**
- **This is the main test!** 
- Creates a real DID on KILT blockchain
- Requires wallet signature (you'll see a popup)
- Registers the DID on-chain with your keys

### ✅ **Blockchain Resolution Test**
- Queries the DID from the actual blockchain
- Tests the universal DID resolver
- Shows verification methods and keys from on-chain data

### ✅ **Existence Verification Test**
- Confirms the DID exists on the blockchain
- Tests the existence checking functionality

## 🎯 Expected Results

If everything works, you should see:

```
🎉 KILT Integration Test: ALL TESTS PASSED! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KILT Connection: Connected to KILT Peregrine
✅ Wallet Integration: Polkadot-js wallet connected  
✅ Balance Check: 1.0000 KILT tokens
✅ On-Chain DID Creation: did:kilt:4abc123...
✅ Blockchain Resolution: blockchain source
✅ DID Existence Check: Confirmed
✅ Factory Methods: Working
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🐛 Common Issues & Solutions

### ❌ "No extension found"
**Problem:** Wallet extension not installed  
**Solution:** Install [Polkadot.js Extension](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/)

### ❌ "Insufficient balance" 
**Problem:** Not enough KILT tokens  
**Solution:** Get tokens from [KILT Faucet](https://faucet.peregrine.kilt.io/)

### ❌ "User rejected"
**Problem:** You cancelled the transaction in wallet  
**Solution:** This is normal - just try again and approve the transaction

### ❌ "Network error"
**Problem:** Connection issues to KILT network  
**Solution:** Check internet connection, try again in a few minutes

### ❌ "HTTPS required" (Browser test)
**Problem:** Wallet extensions require HTTPS  
**Solution:** Use `https://localhost:8080` or deploy to HTTPS server

### ❌ "DID not found after creation"
**Problem:** Blockchain confirmation takes time  
**Solution:** Wait 30-60 seconds and try the resolution test again

## 🔧 Advanced Testing

### Test Different Networks
```javascript
// Connect to different KILT networks
await kiltAdapter.connect('peregrine');  // Testnet (default)
await kiltAdapter.connect('spiritnet');  // Mainnet (requires real KILT)
```

### Test Balance Requirements
```javascript
// Check different balance thresholds
const balance = await kiltAdapter.checkBalance(address, BigInt('2000000000000')); // 0.002 KILT
```

### Test DID Resolution Sources
```javascript
// Get detailed resolution metadata
const { document, metadata } = await resolveKILTDIDWithMetadata(did);
console.log('Resolution source:', metadata.source); // 'blockchain' or 'constructed'
```

## 📊 Performance Benchmarks

Expected execution times on KILT Peregrine:
- **Connection**: ~2-3 seconds
- **Wallet Enable**: ~1-2 seconds  
- **Balance Check**: ~1-2 seconds
- **DID Creation**: ~15-30 seconds (includes blockchain confirmation)
- **DID Resolution**: ~2-4 seconds
- **Existence Check**: ~1-2 seconds

Total test time: **~30-45 seconds**

## 🎯 What This Proves

These tests verify that:
1. ✅ **KILT parachain integration works** - Real blockchain connection
2. ✅ **Wallet signing is seamless** - Polkadot.js/Talisman integration  
3. ✅ **On-chain DID registration works** - Real blockchain transactions
4. ✅ **DID resolution from blockchain** - Queries actual on-chain data
5. ✅ **Balance checking works** - Pre-transaction validation
6. ✅ **Error handling is robust** - Graceful failure handling
7. ✅ **Unified API works** - Single interface for all operations

## 🔗 Next Steps

After successful testing:
1. **Integrate into your app** - Use the same API calls in your application
2. **Switch to mainnet** - Change network to 'spiritnet' for production
3. **Add UI integration** - Build user interfaces around these API calls
4. **Deploy your app** - The KILT integration is production-ready!

---

## 📚 API Reference Quick Start

```javascript
import { 
  KiltAdapter, 
  createKILTDID, 
  resolveDID, 
  checkDIDExists,
  DIDFactory 
} from 'keypass-login-sdk';

// Basic usage
const kiltAdapter = new KiltAdapter();
await kiltAdapter.connect('peregrine');
await kiltAdapter.enable();

const address = (await kiltAdapter.getAccounts())[0].address;
const did = await createKILTDID(address, kiltAdapter);
const didDoc = await resolveDID(did);
const exists = await checkDIDExists(did);
```

**🎉 Happy testing! The KILT integration is ready for production use.**
