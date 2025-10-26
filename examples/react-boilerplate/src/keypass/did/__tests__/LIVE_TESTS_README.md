# KILT DID Live Integration Tests

This directory contains live integration tests for the KILTDIDProvider that test against the real KILT Spiritnet testnet.

## Overview

The live tests (`KILTDIDProvider.live.test.ts`) provide comprehensive testing against the actual KILT blockchain network, including:

- Real DID creation and resolution
- Real blockchain connectivity testing
- Real address validation
- Real transaction preparation (without actual submission)
- Network performance testing
- Error handling with real network conditions

## Prerequisites

### Required
- Internet connection
- Access to KILT Spiritnet testnet
- Node.js environment with Jest

### Optional
- `TEST_WALLET_MNEMONIC` environment variable for wallet-based tests
- Test wallet with KILT tokens (for actual transaction testing)

## Running Live Tests

### Enable Live Tests
Set the environment variable to enable live testing:
```bash
export ENABLE_LIVE_TESTS=true
```

### Run All Live Tests
```bash
# Using the dedicated npm script (recommended)
ENABLE_LIVE_TESTS=true npm run test:integration:kilt

# Or using the full jest command
ENABLE_LIVE_TESTS=true npm test -- --testPathPattern=KILTDIDProvider.live
```

### Run with Verbose Output
```bash
# Using the dedicated npm script
ENABLE_LIVE_TESTS=true npm run test:integration:kilt -- --verbose

# Or using the full jest command
ENABLE_LIVE_TESTS=true npm test -- --testPathPattern=KILTDIDProvider.live --verbose
```

### Run Specific Test Suites
```bash
# Network connectivity tests only
ENABLE_LIVE_TESTS=true npm run test:integration:kilt -- --testNamePattern="Network Connectivity"

# DID creation tests only
ENABLE_LIVE_TESTS=true npm run test:integration:kilt -- --testNamePattern="DID Creation"
```

## Test Categories

### 1. Network Connectivity Tests
- Connection to KILT Spiritnet
- Network verification
- Disconnection handling

### 2. DID Creation and Format Tests
- Valid KILT DID creation
- DID document generation
- DID resolution

### 3. Address Validation Tests
- KILT address format validation
- Address extraction from DIDs
- Onchain verification (for registered DIDs)

### 4. DID Document Structure Tests
- Proper KILT context validation
- Verification method creation
- Key agreement key generation

### 5. Error Handling Tests
- Invalid DID format handling
- Network error handling
- Malformed input handling

### 6. Performance Tests
- DID resolution timing
- Concurrent operation handling

### 7. Wallet-Based Tests (Optional)
- Requires `TEST_WALLET_MNEMONIC` environment variable
- Tests with real wallet integration
- Transaction preparation testing

### 8. Configuration Tests
- KILT configuration validation
- Network switching tests

### 9. Integration Tests
- Complete DID lifecycle testing
- DID document updates

### 10. Edge Cases and Error Scenarios
- Long address handling
- Special character handling
- Consistency across operations

## Test Data Cleanup

The live tests include comprehensive cleanup mechanisms:

- **Automatic Cleanup**: Each test cleans up after itself
- **Global Cleanup**: `afterAll` hook cleans up all test data
- **Test Data Tracking**: All created DIDs, addresses, and transactions are tracked
- **Safe Cleanup**: Cleanup operations are wrapped in try-catch blocks

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ENABLE_LIVE_TESTS` | Enable live testing | Yes | `false` |
| `TEST_WALLET_MNEMONIC` | Wallet mnemonic for wallet tests | No | None |
| `CI` | CI environment detection | No | `false` |

## Test Configuration

The tests use the following configuration:

```typescript
const TEST_CONFIG = {
  network: 'spiritnet',
  timeout: 60000, // 60 seconds
  cleanupTimeout: 30000, // 30 seconds
  testAddresses: [
    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Alice
    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', // Bob
  ],
};
```

## Expected Results

### Successful Test Run
```
✅ Connected to KILT Spiritnet (spiritnet)
   Version: 11603
   SS58 Format: 38
   Genesis Hash: 0x411f057b9107718c9624d6aa4a3f23c1653898297f3d4d529d9bb6511a39dd21

✅ Created DID: did:kilt:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
✅ Created DID document with 1 verification methods
✅ Resolved DID: did:kilt:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
✅ Address validation: NOT REGISTERED (expected for test addresses)
```

### Test Results Summary
- **Network Connectivity**: ✅ All tests pass
- **DID Operations**: ✅ All tests pass
- **Address Validation**: ✅ All tests pass
- **Error Handling**: ✅ All tests pass
- **Performance**: ✅ All tests pass

## Troubleshooting

### Connection Issues
If tests fail to connect to KILT Spiritnet:
- Check internet connection
- Verify KILT network status
- Check firewall settings for WebSocket connections

### Test Failures
If specific tests fail:
- Check console output for detailed error messages
- Verify test addresses are valid
- Ensure proper environment variable setup

### Performance Issues
If tests timeout:
- Increase timeout values in test configuration
- Check network latency to KILT endpoints
- Run tests individually to isolate issues

## Security Considerations

- **No Real Tokens**: Tests use well-known test addresses that don't require real tokens
- **No Private Keys**: No private keys are used in tests
- **Testnet Only**: All tests run against testnet, never mainnet
- **Cleanup**: All test data is properly cleaned up

## Integration with CI/CD

To run live tests in CI/CD:

```yaml
# GitHub Actions example
- name: Run Live Tests
  run: ENABLE_LIVE_TESTS=true npm run test:integration:kilt
  env:
    ENABLE_LIVE_TESTS: true
```

Note: Live tests are automatically skipped in CI environments unless explicitly enabled.

## Contributing

When adding new live tests:

1. Follow the existing test structure
2. Include proper cleanup in `afterEach` hooks
3. Use descriptive test names
4. Add appropriate timeouts for network operations
5. Include error handling for network failures
6. Document any new environment variables

## Support

For issues with live tests:
- Check the test output for specific error messages
- Verify network connectivity to KILT Spiritnet
- Ensure all prerequisites are met
- Review the troubleshooting section above
