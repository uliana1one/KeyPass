# SBT Minting E2E Integration Tests

This directory contains end-to-end integration tests for the SBT minting functionality. These tests use real Moonbase Alpha testnet to validate the complete minting flow.

## Overview

The E2E tests cover:
- **Contract Deployment**: Deploy SBT contracts to Moonbase Alpha
- **Full Minting Flow**: Complete SBT minting with real blockchain transactions
- **Error Scenarios**: Handle various failure modes
- **Transaction Confirmation**: Verify transaction inclusion and event emission
- **Test Data Cleanup**: Proper resource cleanup after tests

## Prerequisites

### 1. Test Environment Setup

```bash
# Copy the environment template
cp env.e2e.template .env.e2e

# Edit .env.e2e with your test configuration
nano .env.e2e
```

### 2. Required Environment Variables

```bash
# Required: Private key for test wallet
TEST_PRIVATE_KEY=your_test_wallet_private_key_here

# Optional: Recipient address (defaults to test wallet)
TEST_RECIPIENT=0x1234567890123456789012345678901234567890

# Optional: Test timeout (default: 5 minutes)
TEST_TIMEOUT=300000
```

### 3. Test Wallet Setup

1. **Create a test wallet** or use an existing one
2. **Get testnet DEV tokens** from [Moonbase Alpha Faucet](https://faucet.moonbeam.network/)
3. **Ensure minimum balance** of 0.1 DEV for contract deployment and minting

### 4. Network Access

- **Moonbase Alpha RPC**: `https://rpc.api.moonbase.moonbeam.network`
- **Chain ID**: 1287
- **Explorer**: [Moonbase Alpha Moonscan](https://moonbase.moonscan.io/)

## Running E2E Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run SBT-Specific E2E Tests
```bash
npm run test:sbt:e2e
```

### Run with Watch Mode
```bash
npm run test:e2e:watch
```

### Run with Coverage
```bash
npm run test:e2e:coverage
```

### Run All Tests (Unit + E2E)
```bash
npm run test:all
```

## Test Structure

### 1. Contract Deployment Tests
- Deploy SBT contract to Moonbase Alpha
- Verify contract deployment
- Submit contract for verification on block explorer

### 2. Full SBT Minting Flow
- Connect to deployed contract
- Estimate gas for minting transaction
- Execute minting with real blockchain transaction
- Verify token ownership and metadata
- Validate metadata accessibility

### 3. Error Scenario Tests
- Invalid contract addresses
- Insufficient gas scenarios
- Invalid recipient addresses
- Network disconnection handling
- Contract method failures

### 4. Transaction Confirmation Tests
- Verify transaction inclusion in blockchain
- Wait for transaction confirmation
- Handle transaction timeouts
- Retry failed transactions with backoff

### 5. Test Data Cleanup
- Disconnect services
- Clean up test resources
- Generate test reports

## Test Configuration

### Jest Configuration
- **Config File**: `jest.e2e.config.js`
- **Test Timeout**: 5 minutes (300,000ms)
- **Max Workers**: 1 (sequential execution)
- **Test Environment**: Node.js

### Test Setup Files
- **Global Setup**: `src/__tests__/setup/global-setup.ts`
- **Global Teardown**: `src/__tests__/setup/global-teardown.ts`
- **Test Setup**: `src/__tests__/setup/e2e-setup.ts`
- **Results Processor**: `src/__tests__/setup/test-results-processor.ts`

## Test Data Management

### Automatic Cleanup
- Services are disconnected after each test
- Test resources are cleaned up automatically
- No persistent test data remains

### Test Isolation
- Each test runs independently
- No shared state between tests
- Fresh contract deployment for each test run

### Resource Management
- Proper connection/disconnection of services
- Memory cleanup with garbage collection
- Timeout management for long-running operations

## Monitoring and Debugging

### Test Output
- **Verbose Logging**: Detailed test execution logs
- **Performance Metrics**: Test duration and performance data
- **Error Details**: Comprehensive error reporting

### Test Reports
- **JUnit XML**: `test-results/e2e/junit.xml`
- **Detailed JSON**: `test-results/e2e/detailed-report.json`
- **Console Summary**: Real-time test progress

### Debugging Tips
1. **Check Wallet Balance**: Ensure sufficient DEV tokens
2. **Verify Network**: Confirm Moonbase Alpha connectivity
3. **Review Logs**: Check detailed test execution logs
4. **Block Explorer**: Verify transactions on Moonscan

## Troubleshooting

### Common Issues

#### 1. Insufficient Balance
```
Error: Insufficient balance. Need at least 0.1 DEV
```
**Solution**: Get more testnet DEV from the faucet

#### 2. Network Connection Issues
```
Error: Failed to connect to Moonbase Alpha
```
**Solution**: Check internet connection and RPC endpoint

#### 3. Transaction Timeout
```
Error: Transaction timeout
```
**Solution**: Increase `TEST_TIMEOUT` or check network congestion

#### 4. Invalid Private Key
```
Error: Invalid wallet configuration
```
**Solution**: Verify `TEST_PRIVATE_KEY` format and validity

### Environment Issues

#### Missing Environment Variables
```bash
# Check required variables
echo $TEST_PRIVATE_KEY
echo $TEST_RECIPIENT
```

#### Network Configuration
```bash
# Test network connectivity
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://rpc.api.moonbase.moonbeam.network
```

## Best Practices

### 1. Test Environment
- Use dedicated test wallets
- Keep test data separate from production
- Regular cleanup of test resources

### 2. Test Execution
- Run E2E tests in CI/CD pipelines
- Monitor test execution time
- Set appropriate timeouts

### 3. Error Handling
- Comprehensive error scenarios
- Graceful failure handling
- Proper resource cleanup on errors

### 4. Documentation
- Keep test documentation updated
- Document test environment setup
- Record known issues and solutions

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    TEST_PRIVATE_KEY: ${{ secrets.TEST_PRIVATE_KEY }}
    TEST_RECIPIENT: ${{ secrets.TEST_RECIPIENT }}
```

### Docker Integration
```bash
# Run E2E tests in Docker
docker run --env-file .env.e2e keypass-sdk npm run test:e2e
```

## Contributing

When adding new E2E tests:
1. Follow the existing test structure
2. Add proper cleanup and error handling
3. Update documentation
4. Ensure tests are isolated and reliable
5. Add appropriate timeouts for long-running operations

## Support

For issues with E2E tests:
1. Check the troubleshooting section
2. Review test logs and reports
3. Verify environment configuration
4. Check network connectivity and wallet balance
