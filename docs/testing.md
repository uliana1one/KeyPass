# Testing Guide for KeyPass

## Overview

KeyPass implements a comprehensive testing strategy to ensure reliability and maintainability of the codebase, including **wallet and account selection**, **DID creation**, **SBT/credential display**, and **zero-knowledge proof (zkProof) flows**. The testing suite combines unit tests, integration tests, and end-to-end tests, utilizing Jest as the primary testing framework. The test suite validates both core functionality and the new interactive wallet selection, credential, and privacy features.

## New Features & Testing Additions

### DID Explorer Dashboard
- **DID Creation Wizard**: Tested via unit and integration tests for all wizard steps, including type selection, advanced configuration, preview, and creation.
- **DID Document Viewer**: Tests cover tabbed navigation, document rendering, copy-to-clipboard, and verification status display.
- **Integration Flow**: E2E tests validate the full user journey from wallet connection to DID creation and profile display.
- **Test Files**: See `examples/react-boilerplate/src/components/__tests__/DIDWizard.test.tsx`, `DIDWizard.integration.test.tsx`, and `DIDDocumentViewer.test.tsx`.

### zkProof Credential Demo
- **Credential Display & Issuance**: Unit and integration tests for credential cards, request wizard, and offer management.
- **ZK-Proof Generation**: Tests for proof generation (Semaphore, PLONK, Groth16), configuration, and verification flows.
- **Privacy Controls**: Tests for selective disclosure, privacy settings, and credential sharing.
- **Test Files**: See `examples/react-boilerplate/src/components/__tests__/ZKProofGenerator.test.tsx`, `CredentialSection.tsx`, and `services/__tests__/zkProofService.test.ts`.

### SBT/Badge Display
- **SBT Grid and Card Components**: Unit tests for SBT rendering, metadata, and status indicators.
- **Mode Switching**: Tests for demo, test, and real SBT data modes.
- **Test Files**: See `examples/react-boilerplate/src/components/SBTGrid.tsx`, `SBTCard.tsx`, and related test files.

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
└── examples/
    └── react-boilerplate/
        └── src/components/__tests__/   # UI and integration tests for dashboard, credentials, zkProofs
```

## Test Categories

### Unit Tests
Located in `src/*/__tests__/` and `examples/react-boilerplate/src/components/__tests__/`, these tests focus on individual components:
- Wallet adapters (Polkadot.js, Talisman)
- Account management and selection
- DID creation wizard and document viewer
- Credential cards, SBT cards, and privacy controls
- ZKProof generator and configuration
- Error handling and custom error classes
- Message signing and verification
- Server endpoints and middleware

### Integration Tests
Located in `__tests__/integration/` and `examples/react-boilerplate/src/components/__tests__/`, these tests verify component interactions:
- Wallet connector integration and adapter selection
- Authentication flow including wallet connection, account selection, and message signing
- DID creation and dashboard integration
- Credential issuance, offer management, and SBT display
- ZKProof generation and verification flows
- Error handling across component boundaries (wallet not found, user rejection, verification failures)

### End-to-End Tests
Located in `__tests__/e2e/`, these tests validate critical system flows:
- Complete authentication process including wallet connection and message signing
- DID (Decentralized Identifier) creation and resolution
- DID document generation and verification
- Credential request, issuance, and sharing
- ZKProof generation, verification, and presentation
- SBT minting and display

Note: The current e2e test suite focuses on the core authentication, DID, credential, and zkProof flows. Additional user interaction scenarios and real-world usage patterns may be added in future iterations.

## CI/CD Pipeline

The CI pipeline uses GitHub Actions to run tests in a Docker environment:

1. **Test Execution**
   - Runs on every push to main and pull requests
   - Uses Docker containers for consistent test environment
   - Runs all test suites (unit, integration, wallet connector, dashboard, credential, zkProof)
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
npm test -- --testPathPattern=examples/react-boilerplate/src/components/__tests__  # Run dashboard/credential/zkProof tests
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

## Expanded Test Coverage

- **DID Creation**: All wizard steps, error handling, and document rendering
- **Credential Issuance & Display**: Request, offer, sharing, and revocation flows
- **SBT/Badge Display**: Grid, card, and status indicator rendering
- **zkProof Generation**: Circuit selection, proof creation, verification, and privacy controls
- **UI/UX**: Responsive layouts, accessibility, and error states
- **Privacy & Security**: Selective disclosure, credential privacy settings, and secure proof sharing

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

Remember: Good tests are as important as the code they test. They provide confidence in the implementation and help prevent regressions, especially in critical wallet authentication, DID, credential, and zkProof operations.