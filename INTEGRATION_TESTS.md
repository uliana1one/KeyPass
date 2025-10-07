# KILT Integration Tests

## Overview

The KILT integration tests (`KILT.integration.test.ts`) test real blockchain operations against the KILT Peregrine testnet. These tests verify that the KeyPass SDK can successfully interact with a live KILT blockchain.

## Prerequisites

### 1. **KILT Testnet Tokens**

You need testnet KILT tokens to run these tests. Get free tokens from the faucet:

🚰 **KILT Faucet**: https://faucet.peregrine.kilt.io/

### 2. **Test Account Mnemonic** (Optional)

The tests can auto-generate a test account, but if you want to reuse an account with existing tokens:

```bash
export KILT_TEST_MNEMONIC="your twelve word mnemonic phrase here..."
```

### 3. **Network Connectivity**

- Stable internet connection required
- Access to `wss://peregrine.kilt.io` (KILT testnet)
- No firewall blocking WebSocket connections

---

## Running Integration Tests

### Method 1: Enable via Environment Variable

```bash
# Enable integration tests
export RUN_INTEGRATION_TESTS=true

# Run with extended timeout (60 seconds per test)
npm test -- KILT.integration.test.ts --testTimeout=60000
```

### Method 2: One-Line Command

```bash
RUN_INTEGRATION_TESTS=true npm test -- KILT.integration.test.ts --testTimeout=60000
```

### Method 3: With Custom Mnemonic

```bash
export KILT_TEST_MNEMONIC="your twelve word mnemonic here"
export RUN_INTEGRATION_TESTS=true
npm test -- KILT.integration.test.ts --testTimeout=60000
```

---

## What Gets Tested

### ✅ Network Connection (3 tests)
- Connect to KILT Peregrine testnet
- Retrieve network statistics
- Validate KILT address format

### ✅ Account & Balance (2 tests)
- Retrieve account nonce
- Check account balance

### ✅ DID Operations (7 tests)
- Check DID existence before registration
- Register new DID on-chain
- Resolve registered DID
- Query DID document from chain
- Add verification method to DID
- Add service endpoint to DID
- Update DID document

### ✅ Transaction Monitoring (3 tests)
- Estimate gas for transactions
- Get pending transactions
- Retrieve chain information

### ✅ Error Handling (3 tests)
- Handle invalid DID resolution
- Handle non-existent DID
- Handle network disconnection

### ✅ Performance Metrics (2 tests)
- Measure DID resolution time
- Measure network stat retrieval time

**Total: 20 integration tests**

---

## Expected Test Duration

| Test Category | Estimated Time |
|--------------|----------------|
| Network Connection | ~45 seconds |
| Account & Balance | ~30 seconds |
| DID Operations | ~4-5 minutes |
| Transaction Monitoring | ~30 seconds |
| Error Handling | ~45 seconds |
| Performance Metrics | ~25 seconds |
| **Total** | **~7-8 minutes** |

*Times may vary based on network conditions and blockchain congestion*

---

## Test Output Example

```
🔧 Setting up KILT integration test environment...
🔑 Test mnemonic: abandon abandon aband...
👤 Test account address: 4rPsjQFisBd2cZvS1...
✅ Test environment ready

🌐 Connecting to KILT testnet...
✅ Connected to: KILT Peregrine
📡 Network: peregrine

📊 Current block: 3458291
📊 Finalized block: 3458288

💰 Account balance: 1.5000 KILT

📝 Registering DID on KILT testnet...
✅ DID registered: did:kilt:4rPsjQFisBd2cZvS1...
📜 Transaction hash: 0x123456...
🔗 Block number: 3458295
```

---

## Handling Common Issues

### ❌ "Insufficient balance" Error

**Problem**: Your test account doesn't have enough KILT tokens.

**Solution**: 
1. Visit https://faucet.peregrine.kilt.io/
2. Enter your test account address (shown in test output)
3. Request testnet tokens
4. Wait 1-2 minutes for tokens to arrive
5. Re-run the tests

### ❌ "Connection timeout" Error

**Problem**: Can't connect to KILT testnet.

**Solutions**:
- Check your internet connection
- Verify firewall isn't blocking WebSocket connections
- Try again later (testnet may be temporarily unavailable)
- Check KILT status: https://status.kilt.io/

### ❌ "Transaction failed" Error

**Problem**: Transaction couldn't be submitted.

**Possible Causes**:
- Network congestion
- Nonce conflicts (if running tests multiple times quickly)
- Insufficient gas

**Solutions**:
- Wait 30 seconds and retry
- Increase `--testTimeout` value
- Check account balance

### ⚠️ "DID already exists" Warning

**Info**: Your test account already has a registered DID from previous test runs.

**This is normal!** The tests will:
- Skip the registration step
- Continue with DID resolution and updates
- Use the existing DID for remaining tests

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:  # Allow manual trigger

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        env:
          RUN_INTEGRATION_TESTS: true
          KILT_TEST_MNEMONIC: ${{ secrets.KILT_TEST_MNEMONIC }}
        run: npm test -- KILT.integration.test.ts --testTimeout=60000
```

### GitLab CI Example

```yaml
integration-tests:
  stage: test
  only:
    - schedules
  script:
    - npm ci
    - export RUN_INTEGRATION_TESTS=true
    - npm test -- KILT.integration.test.ts --testTimeout=60000
  variables:
    KILT_TEST_MNEMONIC: $KILT_TEST_MNEMONIC
```

---

## Skipping Integration Tests

By default, integration tests are **skipped** unless explicitly enabled. This prevents them from running during regular unit test execution.

To run **only unit tests** (skip integration):

```bash
npm test  # Integration tests automatically skipped
```

To run **all tests including integration**:

```bash
RUN_INTEGRATION_TESTS=true npm test
```

---

## Cost Estimation

### Testnet Token Usage

| Operation | Estimated Cost | Times Run |
|-----------|---------------|-----------|
| DID Registration | ~0.1 KILT | 1x |
| Add Verification Method | ~0.05 KILT | 1x |
| Add Service Endpoint | ~0.05 KILT | 1x |
| Update DID Document | ~0.05 KILT | 1x |
| **Total per test run** | **~0.25 KILT** | - |

💡 **Tip**: Request 1-2 KILT from the faucet to run tests multiple times.

---

## Development Tips

### Running Individual Test Suites

```bash
# Only network tests
RUN_INTEGRATION_TESTS=true npm test -- KILT.integration.test.ts -t "Network Connection"

# Only DID operations
RUN_INTEGRATION_TESTS=true npm test -- KILT.integration.test.ts -t "DID Operations"

# Only error handling
RUN_INTEGRATION_TESTS=true npm test -- KILT.integration.test.ts -t "Error Handling"
```

### Verbose Output

```bash
RUN_INTEGRATION_TESTS=true npm test -- KILT.integration.test.ts --verbose --testTimeout=60000
```

### Watch Mode for Development

```bash
RUN_INTEGRATION_TESTS=true npm test -- KILT.integration.test.ts --watch --testTimeout=60000
```

---

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never use mainnet mnemonics** - Integration tests only use Peregrine testnet
2. **Don't commit mnemonics** - Use environment variables, never hardcode
3. **Testnet tokens only** - These tokens have no real-world value
4. **Public testnet** - All data is publicly visible on the blockchain
5. **Rotate test accounts** - Generate new test accounts periodically

---

## Troubleshooting

### Enable Debug Logging

```bash
DEBUG=kilt:* RUN_INTEGRATION_TESTS=true npm test -- KILT.integration.test.ts --testTimeout=60000
```

### Check KILT Network Status

- Status page: https://status.kilt.io/
- Block explorer: https://polkadot.js.org/apps/?rpc=wss://peregrine.kilt.io
- Telemetry: https://telemetry.polkadot.io/

### Manual Verification

Test your connection manually:

```bash
npm run test:connection
# or
node -e "import('https://spiritnet.kilt.io').then(r => console.log('Connected!'))"
```

---

## Support

- **KILT Discord**: https://discord.gg/kilt
- **Documentation**: https://docs.kilt.io/
- **GitHub Issues**: Open an issue in this repository

---

## Summary

Integration tests provide confidence that KeyPass SDK works correctly with real KILT blockchain infrastructure. Run them:

✅ **Before releases** - Verify everything works end-to-end  
✅ **In CI/CD** - Catch regressions early  
✅ **During development** - Test new features against real blockchain  
✅ **After upgrades** - Ensure compatibility with network updates

