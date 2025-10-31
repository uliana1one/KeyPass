# Mock Mode Configuration for KILT Development

## 🚧 **Faucet Issues - Using Mock Mode**

Since the KILT Peregrine faucet is showing "Insufficient balance" errors, we can continue development using mock implementations.

### **Environment Setup**

Create a `.env` file in the react-boilerplate directory:

```env
# Mock Mode Configuration
REACT_APP_USE_MOCK_MODE=true
REACT_APP_MOCK_KILT_ADDRESS=4sKPg7zJ2YaZPM2g6j5ZNux782TEyDanfHoLTey79B7G6Dek
REACT_APP_MOCK_MOONBEAM_ADDRESS=0x51e28136DF692FA4913Ce48c48D99D6201EC410b

# Real blockchain endpoints (for when faucet works)
REACT_APP_KILT_WSS_ADDRESS=wss://peregrine.kilt.io
REACT_APP_MOONBEAM_RPC_URL=https://rpc.api.moonbase.moonbeam.network

# Mock SBT Contract
REACT_APP_MOCK_SBT_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### **Mock Service Implementation**

The React boilerplate will automatically detect `REACT_APP_USE_MOCK_MODE=true` and use mock implementations that simulate:

- ✅ KILT DID registration
- ✅ Moonbeam SBT minting  
- ✅ Transaction monitoring
- ✅ Gas estimation
- ✅ Error handling

### **Benefits of Mock Mode**

1. **No testnet tokens required**
2. **Instant development**
3. **Predictable behavior**
4. **Easy testing**
5. **Same UI/UX as real implementation**

### **Switching to Real Mode**

When the faucet is working again:

1. **Remove** `REACT_APP_USE_MOCK_MODE=true`
2. **Add real credentials**:
   ```env
   REACT_APP_KILT_TESTNET_MNEMONIC=your twelve word mnemonic
   REACT_APP_MOONBEAM_PRIVATE_KEY=0xyourprivatekey
   REACT_APP_SBT_CONTRACT_ADDRESS=0xYourRealContractAddress
   ```

### **Testing Mock Mode**

```bash
cd examples/react-boilerplate
npm start
```

The app will show:
- ✅ Mock DID creation
- ✅ Mock SBT minting
- ✅ Mock transaction monitoring
- ✅ All error handling examples

### **Faucet Status Monitoring**

Check faucet status periodically:
```bash
# Check if faucet is working
curl -X POST https://faucet.peregrine.kilt.io/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address":"4sKPg7zJ2YaZPM2g6j5ZNux782TEyDanfHoLTey79B7G6Dek"}'
```

### **Alternative: Use Different Testnet**

If KILT Peregrine continues having issues, consider:
- **KILT Spiritnet** (mainnet) - requires real KILT tokens
- **Local KILT node** - run your own testnet
- **Other Polkadot parachains** - for testing similar functionality

---

**Recommendation**: Use mock mode for now to continue development, and switch to real blockchain when the faucet is restored.
