# Testing On-Chain Features Through React Boilerplate

## 🎯 Overview

The React boilerplate at `http://localhost:3001` is now running and you can test **real on-chain functionality** directly through the UI!

---

## ✅ **What You Can Test On-Chain**

### **1. Multi-Chain Wallet Authentication** 🔐
- **Ethereum:** Real MetaMask wallet connection
- **Polkadot:** Real Polkadot.js extension connection
- **KILT:** Real KILT Spiritnet connection

### **2. DID Creation** 🆔
- **KILT:** Create real DIDs on KILT Spiritnet
- **Moonbeam:** Create DIDs on Moonbase Alpha
- **Verification:** View transaction hashes on block explorers

### **3. SBT Minting** 🎨
- **Moonbeam:** Mint real ERC-721 SBT tokens
- **IPFS Metadata:** Upload token metadata to IPFS
- **Transaction Monitoring:** Track real blockchain confirmations

### **4. Complete Flow** 🔄
- End-to-end: DID → SBT → Verification
- Real transactions on testnets
- Gas estimation and fee calculation

---

## 🚀 **How to Test On-Chain Features**

### **Step 1: Access the React App**

Open your browser to:
```
http://localhost:3001
```

### **Step 2: Test Wallet Authentication**

#### **Option A: Ethereum/Moonbeam (Recommended for SBT)**
1. Click **"🔷 Login with Ethereum"** button
2. **Connect MetaMask** when prompted
3. **Select testnet account** with Moonbase Alpha configured
4. **Approve connection**
5. You'll see your address and DID info

#### **Option B: KILT/Polkadot (For KILT DID)**
1. Click **"🟣 Login with Polkadot"** button
2. **Connect Polkadot.js extension**
3. **Select account** 
4. **Approve connection**

### **Step 3: Test DID Creation**

After authentication:

1. Click **"Create DID"** button in the profile section
2. Choose your DID options:
   - Verification methods
   - Service endpoints
3. Click **"Confirm & Create"**
4. **Wait for transaction confirmation**
5. **Copy transaction hash** from the success message

**Verify on blockchain:**
- **KILT DID:** Check https://spiritnet.subscan.io/extrinsic/YOUR_TX_HASH
- **Moonbeam DID:** Check https://moonbase.moonscan.io/tx/YOUR_TX_HASH

### **Step 4: Test SBT Minting**

1. Click **"Complete Flow Demo"** button
2. Or click **"Mint SBT"** in the SBT section
3. Fill in SBT metadata:
   - Name
   - Description
   - Attributes
4. Click **"Mint SBT"**
5. **Approve transaction** in MetaMask
6. **Wait for confirmation**
7. **Copy transaction hash**

**Verify on blockchain:**
- View on Moonbase Alpha: https://moonbase.moonscan.io/tx/YOUR_TX_HASH

### **Step 5: Test Complete Flow**

1. Click **"Complete Flow Demo"** button
2. This will run the entire flow:
   - DID creation
   - Metadata upload to IPFS
   - SBT minting
   - Verification
3. Watch the **step-by-step progress**
4. See **real transaction hashes**
5. View **gas costs**

---

## 🔍 **What You'll See in Real On-Chain Tests**

### **In the UI:**
```
✅ Step 1: DID Creation
  Transaction: 0xabc123def456...
  DID: did:moonbeam:0xYourAddress
  Status: Confirmed ✓

✅ Step 2: Metadata Upload
  IPFS Hash: QmYourMetadataHash...
  Status: Uploaded ✓

✅ Step 3: SBT Minting
  Transaction: 0x789ghi012jkl...
  Token ID: 1
  Status: Confirmed ✓

✅ Step 4: Verification
  SBT Verified on-chain ✓
```

### **Real Transaction Hashes:**

You can verify these on block explorers:

**KILT Transactions:**
```
Example Hash: 0x1234567890abcdef...
Explorer: https://spiritnet.subscan.io/extrinsic/0x1234...
```

**Moonbeam Transactions:**
```
Example Hash: 0xabcdef1234567890...
Explorer: https://moonbase.moonscan.io/tx/0xabcd...
```

---

## ⚙️ **Configuration for On-Chain Testing**

### **For Moonbeam SBT Testing:**

Add to `examples/react-boilerplate/.env`:

```bash
# Moonbeam Configuration
REACT_APP_MOONBEAM_RPC_URL=https://rpc.api.moonbase.moonbeam.network
REACT_APP_SBT_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Enable real blockchain operations
REACT_APP_ENABLE_REAL_DATA=true
```

### **For KILT DID Testing:**

```bash
# KILT Configuration
REACT_APP_ENABLE_KILT=true
REACT_APP_KILT_NETWORK=spiritnet
REACT_APP_KILT_WSS_ENDPOINT=wss://spiritnet.kilt.io
```

### **Get Test Tokens:**

1. **Moonbeam DEV tokens:** https://apps.moonbeam.network/moonbase-alpha/faucet/
2. **KILT tokens:** https://faucet.kilt.io/

---

## 🎯 **Quick Test Checklist**

- [ ] Open http://localhost:3001
- [ ] Connect MetaMask with Moonbase Alpha network
- [ ] Get DEV tokens from faucet
- [ ] Click "Complete Flow Demo"
- [ ] Watch real transactions execute
- [ ] Copy transaction hash
- [ ] Verify on block explorer
- [ ] See your DID and SBT on-chain!

---

## 🐛 **Troubleshooting**

### **"No transactions showing"**
- Make sure you're connected to the correct network
- Check you have test tokens
- Verify environment variables are set

### **"Transaction fails"**
- Check you have enough gas
- Verify contract address is correct
- Ensure network is synced

### **"MetaMask not connecting"**
- Refresh the page
- Check MetaMask is installed
- Make sure Moonbase Alpha is added as network

---

## 📊 **Expected Results**

### **On-Chain Verification:**

✅ **DID Creation:**
- Transaction appears on block explorer
- DID resolves to your address
- Verification methods visible

✅ **SBT Minting:**
- Transaction confirmed on-chain
- Token ID assigned
- Metadata retrievable from IPFS
- Token non-transferable (SBT property)

✅ **Gas Costs:**
- Real gas prices from network
- Actual transaction fees
- Gas estimation working correctly

---

## 🎉 **Success Indicators**

When on-chain testing works, you'll see:

1. ✅ Real transaction hashes (not mock)
2. ✅ Block confirmation numbers
3. ✅ Actual gas costs in DEV tokens
4. ✅ Transaction links to block explorers
5. ✅ DIDs and SBTs visible on-chain
6. ✅ IPFS metadata accessible

---

## 📝 **Next Steps After Testing**

After successful on-chain tests:

1. **Verify transactions** on block explorers
2. **Check your account** on testnet explorers
3. **Try different scenarios** (KILT DID, multiple SBTs)
4. **Test error cases** (insufficient gas, network errors)
5. **Monitor performance** in the Performance Monitor

**Happy on-chain testing!** 🚀

