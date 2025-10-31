# 🔑 Setting Up Test Address for Real KILT On-Chain Testing

## The Test Address

**Address**: `4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN`  
**Balance**: **50 KILT tokens** ✅  
**Network**: KILT Peregrine Testnet  
**Status**: Ready for extensive testing  

## 🚨 Important: You Need Wallet Access

To use this address for real on-chain DID registration, you need:

### Option 1: Import This Address (If you have credentials)
If you have the **private key** or **seed phrase** for this address:

1. **Install Wallet Extension**:
   - [Polkadot.js Extension](https://polkadot.js.org/extension/) (Recommended)
   - [Talisman Wallet](https://talisman.xyz/)

2. **Import the Address**:
   ```
   1. Open wallet extension
   2. Click "Import account from pre-existing seed"
   3. Enter the seed phrase/private key
   4. Set network to "KILT Peregrine"
   5. Save as "KILT Test Account"
   ```

3. **Run Real Test**:
   ```bash
   node test-real-kilt-onchain.js
   ```

### Option 2: Use Your Own Address (Alternative)
If you don't have access to the test address, use your own:

1. **Get Your Address Tokens**:
   - Go to [KILT Faucet](https://faucet.peregrine.kilt.io/)
   - Enter your KILT address
   - Request testnet tokens

2. **Modify Test Script**:
   ```javascript
   // Change this line in test-real-kilt-onchain.js:
   const TEST_ADDRESS = 'YOUR_KILT_ADDRESS_HERE';
   ```

3. **Run Test**:
   ```bash
   node test-real-kilt-onchain.js
   ```

## 🧪 What the Real Test Will Do

When you run `test-real-kilt-onchain.js`, it will:

### ✅ **Phase 1: Verification**
- Connect to KILT Peregrine testnet
- Verify the address has 50 KILT tokens
- Confirm wallet extension is installed
- Check address is available for signing

### ✅ **Phase 2: Real Transaction**
- Create a DID registration transaction
- **Prompt you to sign in your wallet** 🔐
- Submit transaction to KILT blockchain
- Wait for blockchain confirmation

### ✅ **Phase 3: Verification**
- Query the DID from the blockchain
- Confirm it was registered successfully
- Display transaction hash and block info

## 🎯 Expected Output (Success)

```bash
🔥 REAL KILT ON-CHAIN DID TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Address: 4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN
Expected Balance: 50 KILT tokens
Network: KILT Peregrine Testnet
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Step 1: Connecting to KILT Peregrine...
✅ Connected to KILT Peregrine

💰 Step 2: Verifying balance...
✅ Current balance: 50.000000 KILT
✅ Sufficient for DID registration: Yes

🔐 Step 3: Connecting to wallet extension...
✅ Found 1 wallet extension(s)
✅ Found 3 account(s) in wallet
✅ Target address found: KILT Test Account

📝 Step 4: Preparing DID registration...
✅ DID Identifier: did:kilt:4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN

✍️ Step 5: Preparing transaction signature...
✅ Signer ready

⛓️ Step 6: Creating DID on KILT blockchain...
🚨 This will prompt you to sign a transaction in your wallet!
📡 Submitting transaction to KILT blockchain...
📊 Transaction status: Ready
📊 Transaction status: InBlock
⛓️ Transaction included in block: 0x1234...
📊 Transaction status: Finalized
✅ Transaction finalized: 0x5678...
📋 Event: did.DIDCreated [...]

🎉 SUCCESS! DID created on KILT blockchain!
✅ Transaction Hash: 0xabcd...
✅ Block Hash: 0x5678...

🔍 Step 7: Verifying DID on blockchain...
✅ DID successfully registered on KILT blockchain!
📄 DID: did:kilt:4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 REAL KILT ON-CHAIN TEST RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KILT Network Connection: Working
✅ Balance Verification: 50.000000 KILT
✅ Wallet Extension: Connected
✅ Address Access: Available in wallet
✅ Transaction Signing: Working
✅ Blockchain Submission: Successful
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 KILT INTEGRATION IS PRODUCTION READY! 🚀
```

## 🐛 Troubleshooting

### ❌ "Test address not found in wallet"
**Problem**: The address isn't imported in your wallet  
**Solution**: Import the address using seed phrase/private key

### ❌ "No wallet extension found"
**Problem**: No wallet extension installed  
**Solution**: Install Polkadot.js or Talisman extension

### ❌ "User rejected"
**Problem**: You cancelled the transaction  
**Solution**: Run again and click "Sign" in the wallet popup

### ❌ "Insufficient balance"
**Problem**: Not enough KILT tokens  
**Solution**: Get tokens from [KILT Faucet](https://faucet.peregrine.kilt.io/)

## 💡 Pro Tips

1. **Test Safely**: This is testnet - no real value at risk
2. **Multiple Tests**: With 50 KILT, you can test extensively  
3. **Monitor Transactions**: Use [KILT Subscan](https://kilt.subscan.io/) to view transactions
4. **Save Results**: The test outputs transaction hashes for reference

## 🎯 Next Steps After Successful Test

1. ✅ **Confirm Production Readiness**: Real blockchain integration working
2. ✅ **Deploy to Mainnet**: Switch network to 'spiritnet' for production
3. ✅ **Integrate into Apps**: Use the same API in your applications
4. ✅ **Scale Testing**: Test with multiple addresses and scenarios

---

## 🚀 Ready to Test?

```bash
# Run the real on-chain test
node test-real-kilt-onchain.js
```

**This will create a REAL DID on the KILT blockchain using REAL tokens!** 🔥
