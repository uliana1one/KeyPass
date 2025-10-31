# 🧪 **Testing Your Real Blockchain Implementation**

## **Quick Start Testing Guide**

Since contract deployment requires additional setup, here's how to test the real implementation with the current setup:

### **1. Test Wallet Connection (Real)**

1. **Start the application:**
   ```bash
   cd /Users/jane/KeyPass/examples/react-boilerplate
   npm start
   ```

2. **Connect a real wallet:**
   - Install **MetaMask** or **Talisman** browser extension
   - Add Moonbase Alpha testnet to your wallet:
     - Network Name: `Moonbase Alpha`
     - RPC URL: `https://rpc.api.moonbase.moonbeam.network`
     - Chain ID: `1287`
     - Currency Symbol: `DEV`
     - Block Explorer: `https://moonbase.moonscan.io`

3. **Get testnet tokens:**
   - Visit [Moonbase Alpha Faucet](https://faucet.moonbase.moonbeam.network/)
   - Request DEV tokens for your wallet address

### **2. Test Real Blockchain Features**

#### **A. Wallet Detection (Real)**
- ✅ **Test**: The app should detect your connected wallet
- ✅ **Expected**: Real wallet address displayed
- ✅ **Real**: Uses `window.ethereum` and `window.injectedWeb3`

#### **B. Gas Estimation (Real)**
- ✅ **Test**: Click "Estimate Gas" in any transaction
- ✅ **Expected**: Real gas prices from Moonbase Alpha network
- ✅ **Real**: Calls `provider.getFeeData()` for live gas prices

#### **C. Balance Checking (Real)**
- ✅ **Test**: Try to mint an SBT without sufficient balance
- ✅ **Expected**: Error message showing required vs available balance
- ✅ **Real**: Calls `provider.getBalance()` for wallet balance

#### **D. Transaction Monitoring (Real)**
- ✅ **Test**: Monitor any blockchain transaction
- ✅ **Expected**: Real transaction status updates
- ✅ **Real**: Listens to blockchain events and confirms transactions

### **3. Test Mock vs Real Detection**

The app automatically detects if you're using a mock adapter:

```typescript
// Real implementation is used when:
if (this.adapter.constructor.name === 'MockMoonbeamAdapter') {
  return this.mockMintSBT(contractAddress, params, signer, onProgress);
}
// Otherwise uses real blockchain implementation
return this.realMintSBT(contractAddress, params, signer, onProgress);
```

### **4. Test IPFS Integration (Real)**

To test real IPFS:

1. **Get Pinata API keys:**
   - Sign up at [Pinata.cloud](https://pinata.cloud)
   - Create API keys in your dashboard

2. **Add to environment:**
   ```bash
   # Add to .env file
   REACT_APP_PINATA_API_KEY=your_api_key_here
   REACT_APP_PINATA_SECRET_KEY=your_secret_key_here
   ```

3. **Test metadata upload:**
   - ✅ **Test**: Upload SBT metadata
   - ✅ **Expected**: Real IPFS hash returned
   - ✅ **Real**: Calls Pinata API for actual IPFS storage

### **5. Test Error Handling (Real)**

- ✅ **Test**: Try operations with insufficient gas
- ✅ **Test**: Try operations with wrong network
- ✅ **Test**: Try operations with invalid addresses
- ✅ **Expected**: Comprehensive error messages with retry logic

### **6. Test Network Switching (Real)**

- ✅ **Test**: Switch between Moonbase Alpha and Moonbeam
- ✅ **Expected**: Different RPC endpoints and chain IDs
- ✅ **Real**: Uses different network configurations

## **🔍 How to Verify It's Real**

### **Check Browser Console**
Look for these real blockchain indicators:

```javascript
// Real gas estimation
console.log('[SBTMintingService] Gas estimate:', gasEstimate);

// Real balance check
console.log('[SBTMintingService] Balance check passed: 0.5 ETH');

// Real transaction monitoring
console.log('[BlockchainMonitor] Transaction confirmed:', {
  hash: '0x...',
  blockNumber: 1234567,
  gasUsed: '21000'
});
```

### **Check Network Tab**
- Real RPC calls to `https://rpc.api.moonbase.moonbeam.network`
- Real transaction hashes (not mock ones)
- Real gas prices and fee data

### **Check Transaction Details**
- Real block numbers
- Real gas usage
- Real confirmation counts
- Real transaction hashes

## **🚀 Next Steps for Full Testing**

1. **Deploy Contracts** (requires additional setup):
   ```bash
   # Get a private key with testnet funds
   export PRIVATE_KEY="your_private_key_here"
   
   # Deploy DID Registry
   npx hardhat run scripts/deploy-did-registry.js --network moonbase
   
   # Deploy SBT Contract
   npx hardhat run scripts/deploy-sbt-contract.js --network moonbase
   ```

2. **Update Environment Variables**:
   ```bash
   # Add deployed contract addresses to .env
   REACT_APP_DID_CONTRACT_ADDRESS=0x...
   REACT_APP_SBT_CONTRACT_ADDRESS=0x...
   ```

3. **Test Full Flow**:
   - Create real DID
   - Mint real SBT
   - Verify on blockchain explorer

## **🎯 Current Status**

✅ **Real Features Working:**
- Wallet connection and detection
- Gas estimation with real network data
- Balance checking
- Transaction monitoring
- Error handling with retry logic
- Network switching
- IPFS integration (with API keys)

⏳ **Requires Contract Deployment:**
- DID creation/management
- SBT minting
- Contract interactions

The application is **already using real blockchain features** where possible, and will automatically use real implementations once contracts are deployed!
