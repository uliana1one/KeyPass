# Testing Guide for KeyPass

## Overview

KeyPass implements a comprehensive testing strategy to ensure reliability and maintainability of the codebase. The testing suite combines unit tests, integration tests, and end-to-end tests, utilizing Jest as the primary testing framework. The test suite is designed to validate both the core functionality and the integration points of the wallet authentication system.

## Test Structure

The tests are organized in a hierarchical structure:

```
KeyPass/
├── __tests__/                    # Root test directory
│   ├── integration/             # Integration test suites
│   │   ├── integration.test.ts  # Core integration tests
│   │   └── walletConnector.test.ts
│   └── e2e/                     # End-to-end test suites
│       └── authentication.test.ts
├── src/
│   ├── adapters/               # Wallet adapter implementations
│   │   └── __tests__/         # Unit tests for adapters
│   ├── accounts/              # Account management
│   │   └── __tests__/        # Unit tests for account handling
│   ├── config/               # Configuration management
│   │   └── __tests__/       # Unit tests for configuration
│   ├── did/                 # DID (Decentralized Identifier) handling
│   │   └── __tests__/      # Unit tests for DID operations
│   ├── errors/             # Error handling
│   │   └── __tests__/     # Unit tests for error classes
│   ├── message/           # Message handling
│   │   └── __tests__/    # Unit tests for message operations
│   ├── server/           # Server implementation
│   │   └── __tests__/   # Unit tests for server components
│   └── types/           # Type definitions
```

## Test Categories

### Unit Tests
Located in `src/*/__tests__/` directories, these tests focus on individual components:
- Wallet adapters (Polkadot.js, Talisman)
- Account management and selection
- Configuration validation
- DID operations and validation
- Error handling and custom error classes
- Message signing and verification
- Server endpoints and middleware

### Integration Tests
Located in `__tests__/integration/`, these tests verify component interactions:
- Wallet connector integration and adapter selection
- Authentication flow including wallet connection, account selection, and message signing
- Concurrent operations (multiple login attempts and wallet connections)
- Integration between wallet adapters, authentication service, and verification service
- Error handling across component boundaries (wallet not found, user rejection, verification failures)

The integration tests focus on ensuring that different components of the system work together correctly, with particular attention to error cases and concurrent operations.

### End-to-End Tests
Located in `__tests__/e2e/`, these tests validate critical system flows:
- Complete authentication process including wallet connection and message signing
- DID (Decentralized Identifier) creation and resolution
- DID document generation and verification
- Integration between wallet adapters, authentication, and DID services

Note: The current e2e test suite focuses on the core authentication and DID flows. Additional user interaction scenarios and real-world usage patterns may be added in future iterations.

## Running Tests

### Local Development
```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test files or directories
npm test -- --testPathPattern=src/adapters     # Run adapter tests
npm test -- --testPathPattern=src/accounts     # Run account tests
npm test -- --testPathPattern=src/server       # Run server tests
npm test -- --testPathPattern=__tests__/integration  # Run integration tests
npm test -- --testPathPattern=__tests__/e2e    # Run e2e tests
```

### Docker Environment
For running tests in a Docker environment, we provide a comprehensive setup that ensures consistent test execution across different environments. This includes a verification server, test runner with browser testing capabilities, and proper test isolation.

For detailed instructions on:
- Docker setup and configuration
- Available test commands
- Test results handling
- Troubleshooting
- Best practices

Please refer to the [Docker Testing Guide](docs/docker-testing.md).

## Test Configuration

### Jest Configuration
The Jest setup (`jest.config.js`) includes:
- TypeScript support via `ts-jest` preset
- JSDOM test environment for browser API simulation
- Module path alias `@/` mapping to `src/`
- Custom setup file (`jest.setup.js`) for test environment preparation
- Test path ignore patterns for `node_modules`, `dist`, and `.d.ts` files
- Isolated modules for TypeScript transformation

### Test Environment
The test environment (`jest.setup.js`) provides:
- TextEncoder/TextDecoder polyfills (required for JSDOM)
- Mock implementation of `window.injectedWeb3` for wallet testing


## Continuous Integration

The CI pipeline uses GitHub Actions to run tests in a Docker environment:

1. **Test Execution**
   - Runs on every push to main and pull requests
   - Uses Docker containers for consistent test environment
   - Runs all test suites (unit, integration, wallet connector)
   - Generates coverage reports in `test-results/coverage`

2. **Test Environment**
   - Uses Node.js 20 in Docker containers
   - Includes verification server and test runner containers
   - Mounts test results directory for artifact collection
   - Uses GitHub Actions for container orchestration

3. **Test Results**
   - Test results are stored in `test-results` directory
   - Coverage reports are generated using Jest
   - Results are uploaded as GitHub Actions artifacts
   - Test logs are available in GitHub Actions workflow

For detailed CI configuration, see the [Docker Testing Guide](docs/docker-testing.md).

## Troubleshooting

Common issues and solutions:

1. **Test Environment Issues**
   - Ensure all dependencies are installed
   - Check Jest configuration
   - Verify environment variables
   - Check wallet provider availability
   - Verify DID resolution service status
   - Check network connectivity

2. **Mocking Problems**
   - Verify mock implementations
   - Check mock reset timing
   - Ensure proper mock scope
   - Verify wallet provider mocks
   - Check DID resolution mocks
   - Verify message signing mocks

3. **Async Test Failures**
   - Check promise handling
   - Verify timeout settings
   - Ensure proper async/await usage
   - Check wallet connection timeouts
   - Verify DID resolution timeouts
   - Test message signing timeouts

4. **Wallet-Specific Issues**
   - Wallet provider not found
   - Connection timeout
   - Account selection failure
   - Message signing rejection
   - Network disconnection
   - DID resolution failure
   - Invalid wallet state

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Maintain consistent naming conventions
3. Include appropriate test coverage
4. Document any new testing patterns
5. Update this guide if introducing new testing approaches
6. Add wallet-specific test cases
7. Include DID-related test scenarios
8. Test error handling paths
9. Verify concurrent operations
10. Add appropriate timeouts

Remember: Good tests are as important as the code they test. They provide confidence in The implementation and help prevent regressions, especially in critical wallet authentication and DID operations.