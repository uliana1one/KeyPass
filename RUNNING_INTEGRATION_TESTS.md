# Running Integration Tests with Coverage

## 📊 Overview

The integration tests validate the complete KeyPass flow: **KILT DID Registration → Moonbeam SBT Minting → Cross-Chain Verification**. These tests use **real blockchain testnets** and are **production-ready**.

---

## ⚠️ Important: Tests Are Skipped by Default

Integration tests are **skipped** unless you explicitly enable them with:
```bash
ENABLE_INTEGRATION_TESTS=true
```

This is intentional to avoid:
- ❌ Accidentally using testnet tokens
- ❌ Slow CI/CD pipelines
- ❌ Network dependency failures in unit tests

---

## 🚀 Quick Start (3 Steps)

### Step 1: Setup Environment

Create `.env.integration` file:

```bash
cat > .env.integration <<'EOF'
# Enable integration tests
ENABLE_INTEGRATION_TESTS=true

# KILT Configuration
KILT_WSS_ADDRESS="wss://peregrine.kilt.io/parachain-public-ws"
KILT_TESTNET_MNEMONIC="your twelve word mnemonic phrase here"

# Moonbeam Configuration  
MOONBEAM_RPC_URL="https://rpc.api.moonbase.moonbeam.network"
MOONBEAM_PRIVATE_KEY="0x...your_private_key"
EOF
```

### Step 2: Get Testnet Tokens

**KILT (Peregrine):**
- Visit: https://faucet.peregrine.kilt.io/
- Request test tokens

**Moonbeam (Moonbase Alpha):**
- Visit: https://apps.moonbeam.network/moonbase-alpha/faucet/
- Request DEV tokens

### Step 3: Deploy SBT Contract

```bash
npm run deploy:sbt:testnet
```

---

## 🧪 Running Tests

### Option 1: Using npm Script (Recommended)

```bash
# Load environment and run with coverage
source .env.integration
npm run test:integration:coverage
```

### Option 2: Using Shell Script

```bash
# Script checks everything for you
./scripts/run-integration-tests.sh
```

### Option 3: Manual Command

```bash
# Export all variables
export ENABLE_INTEGRATION_TESTS=true
export KILT_WSS_ADDRESS="wss://peregrine.kilt.io/parachain-public-ws"
export KILT_TESTNET_MNEMONIC="your twelve words..."
export MOONBEAM_RPC_URL="https://rpc.api.moonbase.moonbeam.network"
export MOONBEAM_PRIVATE_KEY="0x..."

# Run tests
npm test -- --testPathPattern=CompleteFlow --coverage
```

---

## 📊 Understanding Test Results

### ✅ Successful Run

```
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        180.543s

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |   92.5  |   87.3   |   94.1  |   93.2  |                   
----------|---------|----------|---------|---------|-------------------
```

**Performance Summary:**
- ✅ DID Registration: ~1-2 seconds
- ✅ SBT Minting: ~15-30 seconds  
- ✅ Total Flow: ~20-60 seconds
- ✅ Success Rate: 100%

### ⚠️ Tests Skipped

```
Test Suites: 1 skipped, 0 of 1 total
Tests:       15 skipped, 15 total

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |       0 |        0 |       0 |       0 |                   
----------|---------|----------|---------|---------|-------------------
```

**Why?** `ENABLE_INTEGRATION_TESTS` is not set to `true`.

**Fix:** Set the environment variable and try again.

---

## 📈 Coverage Report

After running tests, open the HTML coverage report:

```bash
open coverage/lcov-report/index.html
```

### Coverage Goals

| Metric | Target | Notes |
|--------|--------|-------|
| Statement Coverage | 90%+ | Core logic coverage |
| Branch Coverage | 85%+ | Error path coverage |
| Function Coverage | 90%+ | All exported functions |
| Line Coverage | 90%+ | Overall coverage |

---

## 🧪 Test Breakdown (15 Tests)

### Complete Flow (3 tests)
```typescript
✅ Full DID → SBT → Verification flow
✅ DID with verification methods  
✅ Multiple SBT mints for same DID
```

### Transaction Monitoring (3 tests)
```typescript
✅ KILT transaction monitoring
✅ Moonbeam transaction monitoring
✅ Cross-chain transaction history
```

### Error Handling (3 tests)
```typescript
✅ Invalid DID format handling
✅ Insufficient gas error handling
✅ Network disconnection handling
```

### Performance & Reliability (3 tests)
```typescript
✅ Time constraint validation (<5s DID, <2min total)
✅ Success rate validation (>80%)
✅ Concurrent operation handling
```

### System Health (2 tests)
```typescript
✅ System metrics reporting
✅ Error detection and categorization
```

### Performance Summary (1 test)
```typescript
✅ Comprehensive performance report
```

---

## 🔍 Troubleshooting

### Problem: Tests Skipped

```
Test Suites: 1 skipped
```

**Solution:**
```bash
export ENABLE_INTEGRATION_TESTS=true
npm run test:integration:coverage
```

### Problem: No Deployed Contract

```
Error: No deployed SBT contract found
```

**Solution:**
```bash
npm run deploy:sbt:testnet
```

### Problem: Insufficient Funds

```
Error: insufficient funds for gas * price + value
```

**Solution:**
- Get more testnet tokens from faucets
- Check wallet balance

### Problem: Connection Timeout

```
Error: Connection timeout after 60000ms
```

**Solutions:**
- Check internet connection
- Verify RPC endpoints are accessible
- Try different RPC endpoint
- Check testnet status

### Problem: Transaction Timeout

```
Error: Transaction confirmation timeout
```

**Solutions:**
- Testnet might be congested
- Increase gas price
- Retry the test
- Check block explorer

---

## 🎯 Running Specific Test Suites

```bash
# Complete flow only
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Complete Flow"

# Transaction monitoring
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Monitoring"

# Error handling
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Error"

# Performance tests
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Performance"

# With coverage for specific suite
source .env.integration
npm test -- \
  --testPathPattern=CompleteFlow \
  --testNamePattern="Complete Flow" \
  --coverage
```

---

## 🔐 Security Notes

### ⚠️ Never Commit Secrets

```bash
# Add to .gitignore (already done)
.env.integration
.env.local
.env*.local
```

### ✅ Use Test Accounts Only

- Never use mainnet private keys
- Never use accounts with real funds
- Create dedicated test accounts

### 🔒 Best Practices

```bash
# 1. Use separate test mnemonic
KILT_TESTNET_MNEMONIC="test test test..." # Different from mainnet

# 2. Use dedicated test wallet
MOONBEAM_PRIVATE_KEY="0x..." # Testnet only

# 3. Rotate keys regularly
# Create new test accounts every few months
```

---

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Deploy SBT Contract
        env:
          MOONBEAM_RPC_URL: ${{ secrets.MOONBEAM_RPC_URL }}
          MOONBEAM_PRIVATE_KEY: ${{ secrets.MOONBEAM_PRIVATE_KEY }}
        run: npm run deploy:sbt:testnet
      
      - name: Run Integration Tests
        env:
          ENABLE_INTEGRATION_TESTS: true
          KILT_WSS_ADDRESS: ${{ secrets.KILT_WSS_ADDRESS }}
          KILT_TESTNET_MNEMONIC: ${{ secrets.KILT_TESTNET_MNEMONIC }}
          MOONBEAM_RPC_URL: ${{ secrets.MOONBEAM_RPC_URL }}
          MOONBEAM_PRIVATE_KEY: ${{ secrets.MOONBEAM_PRIVATE_KEY }}
        run: npm run test:integration:coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: integration
```

### GitLab CI Example

```yaml
integration-tests:
  stage: test
  image: node:18
  
  variables:
    ENABLE_INTEGRATION_TESTS: "true"
  
  before_script:
    - npm ci
    - npm run deploy:sbt:testnet
  
  script:
    - npm run test:integration:coverage
  
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

---

## 📚 Related Documentation

- [Integration Test README](src/__tests__/integration/README.md)
- [Implementation Summary](COMPLETE_FLOW_IMPLEMENTATION.md)
- [KILT DID Provider](src/did/README.md)
- [Moonbeam SBT Contract](src/contracts/README.md)
- [Blockchain Monitor](src/monitoring/README.md)

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Setup
npm run deploy:sbt:testnet

# Run tests
source .env.integration
npm run test:integration:coverage

# View coverage
open coverage/lcov-report/index.html

# Run specific suite
npm test -- --testPathPattern=CompleteFlow --testNamePattern="Complete Flow"
```

### Essential Files

```
.env.integration              # Your secrets (not committed)
scripts/run-integration-tests.sh  # Automated test runner
package.json                  # npm scripts
src/__tests__/integration/    # Test files
config/deployments.json       # Deployed contracts
```

### Essential Environment Variables

```bash
ENABLE_INTEGRATION_TESTS=true      # Enable tests
KILT_WSS_ADDRESS="wss://..."       # KILT endpoint
KILT_TESTNET_MNEMONIC="..."        # KILT test account
MOONBEAM_RPC_URL="https://..."     # Moonbeam endpoint
MOONBEAM_PRIVATE_KEY="0x..."       # Moonbeam test key
```

---

**Last Updated**: October 19, 2025  
**Status**: ✅ Production-Ready  
**Test Count**: 15 comprehensive tests  
**Coverage Target**: 90%+

