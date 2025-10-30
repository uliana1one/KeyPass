# KeyPass Demo Instructions

## 🎯 What You'll See

This demo showcases KeyPass functionality:
1. **On-Chain KILT DID** - Real blockchain DID registration
2. **Wallet Authentication** - Polkadot + Ethereum wallet login
3. **SBT Minting** - Soulbound token creation on Moonbeam

## 🚀 Start the Demo

```bash
cd examples/react-boilerplate
npm install
PORT=3001 npm start
```

Open: http://localhost:3001

## 📱 Prerequisites

### For KILT DID Demo:
1. Install [Polkadot.js Extension](https://polkadot.js.org/extension/)
2. Add KILT account with testnet tokens
3. Get tokens: https://faucet.kilt.io/

### For Moonbeam SBT Demo:
1. Install [MetaMask](https://metamask.io/)
2. Add Moonbase Alpha network
3. Get DEV tokens: https://apps.moonbeam.network/moonbase-alpha/faucet/

## 🎮 Demo Flow

### 1. Login with Wallet
- Click "Login with Polkadot" or "Login with Ethereum"
- Select your wallet extension
- Choose an account
- Sign the message
- ✅ You're logged in!

### 2. Create On-Chain KILT DID
- Click "🔗 On-Chain DID Demo" button
- Click "Create On-Chain KILT DID"
- Approve wallet transaction
- ✅ DID registered on KILT blockchain!
- View transaction on [Subscan](https://spiritnet.subscan.io)

### 3. View Your DID
- See your DID document
- Check verification methods
- View on-chain status

### 4. Mint SBT (optional)
- Navigate to SBT section
- Mint test soulbound token
- ✅ Token minted on Moonbeam!

## ✨ Key Features Demonstrated

- ✅ Multi-chain wallet authentication
- ✅ On-chain DID creation (KILT)
- ✅ DID resolution from blockchain
- ✅ SBT minting (Moonbeam)
- ✅ Professional UI/UX

## 🔍 Verify It's Real

### Check KILT DID on Explorer:
```
https://spiritnet.subscan.io/account/YOUR_ADDRESS
```

### Check Moonbeam SBT:
```
https://moonbase.moonscan.io/address/YOUR_ADDRESS
```

## 📊 What This Proves

- **Real blockchain integration** - Not mocks or simulators
- **Cross-chain compatibility** - Polkadot + Ethereum
- **Production-ready SDK** - Used by demo app
- **User-friendly** - No crypto complexity for end users

## 🎓 Technical Details

- **Tech Stack**: React, TypeScript, Polkadot.js, ethers.js
- **Blockchains**: KILT Spiritnet, Moonbeam Moonbase Alpha
- **Wallets**: Polkadot.js, Talisman, MetaMask
- **SDK**: `keypass-login-sdk` (published on npm)

