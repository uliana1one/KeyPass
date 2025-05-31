# KeyPass SDK Testing Guide

This guide provides comprehensive instructions for testing the KeyPass SDK across all layers and components.

## Prerequisites

### 1. Development Environment Setup

```bash
# Install Node.js 16+ and npm
brew install node@16  # macOS
# or
nvm install 16       # Using nvm

# Install global dependencies
npm install -g jest ts-jest @types/jest supertest @testing-library/react @testing-library/jest-dom

# Install browser testing tools
npm install -g puppeteer playwright
```

### 2. Project Dependencies

```bash
# Install testing dependencies
npm install --save-dev \
  jest \
  ts-jest \
  @types/jest \
  supertest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  msw \
  puppeteer \
  playwright \
  k6 \
  @types/supertest
```

### 3. Browser Extensions

1. Install Polkadot.js Extension:
   - [Chrome Web Store](https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd)
   - [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/)

2. Install Talisman Wallet:
   - [Chrome Web Store](https://chrome.google.com/webstore/detail/talisman-wallet/fijngjblinghdangmhdebgkphdefofeb)
   - [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/talisman-wallet/)

## Running Tests

### 1. Unit Tests

#### Layer 0: Project Scaffold Tests
```bash
# Run all unit tests
npm test

# Run specific layer tests
npm test -- --testPathPattern=src/config
npm test -- --testPathPattern=src/adapters
npm test -- --testPathPattern=src/accounts
npm test -- --testPathPattern=src/message
npm test -- --testPathPattern=src/did
npm test -- --testPathPattern=src/server

# Run tests with coverage
npm test -- --coverage
```

#### Layer 1: Wallet Adapter Tests
```bash
# Test Polkadot.js Adapter
npm test -- --testPathPattern=src/adapters/PolkadotJsAdapter.test.ts

# Test Talisman Adapter
npm test -- --testPathPattern=src/adapters/TalismanAdapter.test.ts

# Test adapter error handling
npm test -- --testPathPattern=src/adapters/__tests__/errorHandling.test.ts
```

#### Layer 2: Account Layer Tests
```bash
# Test account selection
npm test -- --testPathPattern=src/accounts/AccountSelector.test.ts

# Test account validation
npm test -- --testPathPattern=src/accounts/__tests__/validation.test.ts
```

#### Layer 3: Message Layer Tests
```bash
# Test message building
npm test -- --testPathPattern=src/message/messageBuilder.test.ts

# Test message validation
npm test -- --testPathPattern=src/message/__tests__/validation.test.ts
```

#### Layer 4: DID Layer Tests
```bash
# Test DID creation
npm test -- --testPathPattern=src/did/UUIDProvider.test.ts

# Test DID document generation
npm test -- --testPathPattern=src/did/__tests__/document.test.ts
```

#### Layer 5: Server Layer Tests
```bash
# Test verification service
npm test -- --testPathPattern=src/server/verificationService.test.ts

# Test API endpoints
npm test -- --testPathPattern=src/server/__tests__/api.test.ts
```

### 2. Integration Tests

#### Client-Server Integration
```bash
# Run all integration tests
npm run test:integration

# Run specific integration scenarios
npm run test:integration -- --testPathPattern=login
npm run test:integration -- --testPathPattern=verification
npm run test:integration -- --testPathPattern=session
```

#### Wallet Integration Tests
```bash
# Test with Polkadot.js wallet
npm run test:integration -- --testPathPattern=wallet/polkadot

# Test with Talisman wallet
npm run test:integration -- --testPathPattern=wallet/talisman

# Test wallet switching
npm run test:integration -- --testPathPattern=wallet/switch
```

### 3. End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific browser tests
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:safari

# Run specific feature tests
npm run test:e2e -- --testPathPattern=login
npm run test:e2e -- --testPathPattern=verification
```

## Performance Testing

### 1. Load Testing with k6

Create `tests/performance/verification.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up
    { duration: '1m', target: 20 },  // Stay
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

export default function () {
  const payload = {
    message: 'KeyPass Login\nIssued At: 2024-03-20T12:00:00Z\nNonce: test\nAddress: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    signature: '0x' + '1'.repeat(128),
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
  };

  const response = http.post('http://localhost:3001/api/verify', JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

Run the load test:
```bash
k6 run tests/performance/verification.js
```

### 2. Browser Performance Testing

```bash
# Run Lighthouse tests
npm run test:lighthouse

# Run Web Vitals tests
npm run test:web-vitals
```

## Browser Compatibility Testing

### 1. Manual Testing Matrix

| Browser | Version | Polkadot.js | Talisman |
|---------|---------|-------------|-----------|
| Chrome  | Latest  | ✓          | ✓        |
| Firefox | Latest  | ✓          | ✓        |
| Safari  | Latest  | ✓          | ✓        |
| Edge    | Latest  | ✓          | ✓        |

### 2. Automated Browser Testing

```bash
# Run cross-browser tests
npm run test:browsers

# Test specific browser
npm run test:browser -- --browser=chrome
npm run test:browser -- --browser=firefox
npm run test:browser -- --browser=safari
```

## Troubleshooting Guide

### 1. Common Test Failures

#### Wallet Connection Failures
```bash
# Error: Wallet not found
Solution:
1. Ensure wallet extension is installed
2. Check if wallet is enabled for test domain
3. Verify wallet is unlocked
4. Check browser console for extension errors

# Error: Connection timeout
Solution:
1. Increase timeout in test configuration
2. Check network connectivity
3. Verify wallet extension is responsive
```

#### Verification Failures
```bash
# Error: Invalid signature
Solution:
1. Check message format matches template
2. Verify signature format (0x prefix, correct length)
3. Ensure address matches signer
4. Check timestamp is within valid range

# Error: DID creation failed
Solution:
1. Verify address format
2. Check network connectivity
3. Ensure DID provider is properly configured
```

#### Integration Test Failures
```bash
# Error: Server not responding
Solution:
1. Check if server is running
2. Verify port configuration
3. Check for port conflicts
4. Ensure proper CORS configuration

# Error: Test timeout
Solution:
1. Increase test timeout
2. Check for long-running operations
3. Verify network performance
4. Check for resource leaks
```

### 2. Debug Mode

Enable debug logging for tests:
```bash
# Run tests with debug logging
DEBUG=keypass:* npm test

# Run specific test with debug
DEBUG=keypass:wallet npm test -- --testPathPattern=wallet
```

### 3. Test Environment Setup

```bash
# Reset test environment
npm run test:reset

# Setup test wallets
npm run test:setup-wallets

# Generate test data
npm run test:generate-data
```

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:
```yaml
name: KeyPass SDK Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm test
      
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Run performance tests
      run: k6 run tests/performance/verification.js
      
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Best Practices

1. **Test Organization**
   - Group tests by layer
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Keep tests independent

2. **Mocking**
   - Mock external dependencies
   - Use consistent mock data
   - Reset mocks between tests
   - Verify mock interactions

3. **Performance**
   - Run performance tests regularly
   - Monitor response times
   - Set appropriate thresholds
   - Test under load

4. **Security**
   - Test error handling
   - Verify input validation
   - Check authentication flows
   - Test session management

5. **Maintenance**
   - Update test data regularly
   - Review test coverage
   - Remove obsolete tests
   - Document test scenarios 