# Complete Flow Integration Tests

## Overview

The `CompleteFlow.test.ts` file contains comprehensive end-to-end integration tests that validate the entire KeyPass system working together with real KILT and Moonbeam blockchains.

## What's Tested

### 🔄 **Complete Flow** (3 tests)
1. **Full DID → SBT → Verification Flow**
   - Registers DID on KILT
   - Mints SBT on Moonbeam
   - Verifies cross-chain linkage
   - Measures performance

2. **DID with Verification Methods**
   - Tests DID creation with cryptographic keys
   - Validates verification method structure

3. **Multiple SBT Mints**
   - Mints 3 SBTs for the same DID
   - Tests nonce management
   - Verifies unique token IDs

### 📊 **Transaction Monitoring** (3 tests)
1. **KILT Transaction Monitoring**
   - Tracks DID operations
   - Calculates success metrics

2. **Moonbeam Transaction Monitoring**
   - Monitors SBT minting
   - Tracks gas usage
   - Measures performance

3. **Cross-Chain History**
   - Validates transaction history tracking
   - Tests filtering by blockchain

### 🚫 **Error Handling** (3 tests)
1. **Invalid DID Format**
   - Tests validation of DID strings

2. **Insufficient Gas**
   - Tests gas limit errors
   - Validates error messaging

3. **Network Health**
   - Checks blockchain connectivity
   - Monitors network status

### ⚡ **Performance & Reliability** (3 tests)
1. **Time Constraints**
   - Validates operations complete within limits
   - DID operations < 5 seconds

2. **Success Rate**
   - Ensures > 80% success rate
   - Tracks reliability metrics

3. **Concurrent Operations**
   - Tests 3 parallel DID operations
   - Validates thread safety

### 📈 **System Health** (2 tests)
1. **System Metrics**
   - Reports accurate latency
   - Tracks gas consumption

2. **Error Reporting**
   - Tests error detection
   - Validates error categorization

### 📊 **Performance Summary** (1 test)
- Generates comprehensive performance report
- Shows timing for all operations
- Displays success rates
- Reports health status

---

## Total: 15 Test Cases ✅

---

## Prerequisites

### 1. Environment Variables

Create a `.env.integration` file:

```bash
# Enable integration tests
ENABLE_INTEGRATION_TESTS=true

# KILT Configuration
KILT_WSS_ADDRESS="wss://peregrine.kilt.io/parachain-public-ws"
KILT_TESTNET_MNEMONIC="your twelve word mnemonic phrase here for testing"

# Moonbeam Configuration
MOONBEAM_RPC_URL="https://rpc.api.moonbase.moonbeam.network"
MOONBEAM_PRIVATE_KEY="0x...your_private_key_with_DEV_tokens"

# Optional: IPFS (if testing metadata uploads)
PINATA_API_KEY="your_pinata_api_key"
PINATA_API_SECRET="your_pinata_secret"
```

### 2. Testnet Tokens

#### KILT (Peregrine) Tokens:
1. Visit: https://faucet.peregrine.kilt.io/
2. Enter your KILT address
3. Request test tokens

#### Moonbeam (Moonbase Alpha) DEV Tokens:
1. Visit: https://apps.moonbeam.network/moonbase-alpha/faucet/
2. Connect wallet or enter address
3. Request DEV tokens

### 3. Deployed SBT Contract

Deploy the SBT contract to Moonbase Alpha:

```bash
npm run deploy:sbt:testnet
```

This will save the contract address to `config/deployments.json`.

---

## Running the Tests

### Run Complete Flow Tests

```bash
# Load environment variables
source .env.integration

# Run the integration tests
npm test -- --testPathPattern=CompleteFlow

# Run with verbose output
npm test -- --testPathPattern=CompleteFlow --verbose

# Run with coverage
npm test -- --testPathPattern=CompleteFlow --coverage
```

### Run Specific Test Suites

```bash
# Only complete flow tests
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Complete Flow"

# Only transaction monitoring tests
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Transaction Monitoring"

# Only error handling tests
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Error Handling"

# Only performance tests
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Performance"
```

---

## Test Timeouts

Tests have extended timeouts for blockchain operations:

- **Default Test Timeout**: 10 minutes (600,000ms)
- **Setup Timeout**: 10 minutes
- **Cleanup Timeout**: 1 minute

Blockchain operations can be slow on testnets, especially during peak usage.

---

## Expected Output

### Successful Run

```
🚀 Setting up Complete Flow Integration Tests...

📡 Connecting to KILT testnet...
✅ KILT connected: 4r1WkS8...

📡 Connecting to Moonbeam testnet...
✅ Moonbeam connected: 0x1234...

🔧 Initializing services...
✅ SBT Contract: 0xB63E1e...
✅ All services initialized

Complete Flow Integration Tests
  Complete Flow: DID → SBT → Verification
    ✓ should complete full flow: DID registration → SBT minting → verification
    ✓ should handle DID registration with verification methods
    ✓ should handle multiple SBT mints for same DID
  Transaction Monitoring
    ✓ should monitor KILT DID operations
    ✓ should monitor Moonbeam SBT transactions
    ✓ should track transaction history across both chains
  Error Handling
    ✓ should handle invalid DID format gracefully
    ✓ should handle insufficient gas errors
    ✓ should handle network disconnection gracefully
  Performance and Reliability
    ✓ should complete flow within acceptable time limits
    ✓ should maintain high success rate across operations
    ✓ should handle concurrent operations safely
  System Health and Metrics
    ✓ should report accurate system metrics
    ✓ should detect and report errors appropriately
  Performance Summary
    ✓ should generate comprehensive performance report

🧹 Cleaning up...
✅ Cleanup complete

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Time:        180.5s
```

---

## Performance Metrics

The tests track and report:

### Timing Metrics
- **DID Registration**: ~500-2000ms
- **SBT Minting**: ~10-30 seconds
- **Verification**: ~100-500ms
- **Total Flow**: < 2 minutes

### Success Metrics
- **KILT Success Rate**: > 80%
- **Moonbeam Success Rate**: > 80%
- **Overall Success Rate**: > 85%

### Resource Metrics
- **Gas Usage**: Per transaction
- **Transaction Costs**: In DEV tokens
- **Latency**: P50, P95, P99 percentiles

---

## Troubleshooting

### Test Skipped

```
⚠️ Integration tests skipped. Set ENABLE_INTEGRATION_TESTS=true to enable.
```

**Solution**: Set `ENABLE_INTEGRATION_TESTS=true` in your environment.

### No Deployed Contract

```
Error: No deployed SBT contract found. Run: npm run deploy:sbt:testnet
```

**Solution**: Deploy the SBT contract first.

### Insufficient Funds

```
Error: insufficient funds for gas * price + value
```

**Solution**: Get more testnet tokens from the faucets.

### Connection Timeout

```
Error: Connection timeout after 60000ms
```

**Solutions**:
- Check your internet connection
- Verify RPC endpoints are accessible
- Try a different RPC endpoint
- Testnet might be experiencing issues

### Transaction Timeout

```
Error: Transaction confirmation timeout
```

**Solutions**:
- Testnet might be congested
- Increase gas price
- Retry the test
- Check testnet status

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Integration Tests
        env:
          ENABLE_INTEGRATION_TESTS: true
          KILT_WSS_ADDRESS: ${{ secrets.KILT_WSS_ADDRESS }}
          KILT_TESTNET_MNEMONIC: ${{ secrets.KILT_TESTNET_MNEMONIC }}
          MOONBEAM_RPC_URL: ${{ secrets.MOONBEAM_RPC_URL }}
          MOONBEAM_PRIVATE_KEY: ${{ secrets.MOONBEAM_PRIVATE_KEY }}
        run: npm test -- --testPathPattern=CompleteFlow
```

---

## Test Coverage Goals

- **Statement Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 90%
- **Line Coverage**: > 90%

---

## Contributing

When adding new test cases:

1. Follow the existing structure
2. Use descriptive test names
3. Add appropriate timeouts
4. Include console logging for visibility
5. Measure and report performance
6. Handle errors gracefully
7. Clean up resources in `afterAll`

---

## Related Documentation

- [KILT DID Integration](../../did/README.md)
- [Moonbeam SBT Integration](../../contracts/README.md)
- [Blockchain Monitor](../../monitoring/README.md)
- [Error Handling](../../errors/README.md)

---

**Last Updated**: October 19, 2025  
**Test Count**: 15 test cases  
**Status**: ✅ Production-Ready
