# Docker Testing Guide for KeyPass SDK

This guide provides instructions for running the KeyPass SDK test suite in Docker containers.

## Docker Setup

### 1. Verification Server Dockerfile

Create `Dockerfile.server`:
```dockerfile
# Use Node.js 16 as base image
FROM node:16-alpine

# Install dependencies for @polkadot/util-crypto
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose server port
EXPOSE 3001

# Start server
CMD ["npm", "run", "start:server"]
```

### 2. Test Runner Dockerfile

Create `Dockerfile.test`:
```dockerfile
# Use Node.js 16 as base image
FROM node:16-alpine

# Install dependencies for browser testing
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++

# Set environment variables for Chrome
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Default command (can be overridden)
CMD ["npm", "test"]
```

### 3. Docker Compose Configuration

Create `docker-compose.test.yml`:
```yaml
version: '3.8'

services:
  # Verification server
  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=test
      - PORT=3001
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3001/health"]
      interval: 5s
      timeout: 3s
      retries: 3

  # Test runner
  test:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - NODE_ENV=test
      - VERIFICATION_API_URL=http://server:3001/api
      - DEBUG=keypass:*
    depends_on:
      server:
        condition: service_healthy
    volumes:
      - ./test-results:/app/test-results
    command: >
      sh -c "npm test &&
             npm test -- --testPathPattern=src/__tests__/integration.test.ts &&
             npm test -- --testPathPattern=src/__tests__/walletConnector.test.ts"
```

### 4. Test Scripts

Update `package.json`:
```json
{
  "scripts": {
    "test:docker": "docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test",
    "test:docker:cleanup": "docker-compose -f docker-compose.test.yml down -v",
    "test:unit": "jest",
    "test:integration": "jest --testPathPattern=src/__tests__/integration.test.ts",
    "test:wallet": "jest --testPathPattern=src/__tests__/walletConnector.test.ts"
  }
}
```

## Running Tests in Docker

### 1. Run All Tests

```bash
# Run all tests in Docker
npm run test:docker

# Clean up containers after tests
npm run test:docker:cleanup
```

### 2. Run Specific Test Suites

```bash
# Run only unit tests
docker-compose -f docker-compose.test.yml run --rm test npm run test:unit

# Run only integration tests
docker-compose -f docker-compose.test.yml run --rm test npm run test:integration

# Run only wallet connector tests
docker-compose -f docker-compose.test.yml run --rm test npm run test:wallet

# Run tests for a specific layer
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern=src/adapters
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern=src/accounts
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern=src/message
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern=src/did
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern=src/server
```

### 3. Debug Tests

```bash
# Run tests with debug logging
docker-compose -f docker-compose.test.yml run --rm test npm test -- --debug

# Run specific test with debug
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern=walletConnector --debug

# Run tests with specific test pattern
docker-compose -f docker-compose.test.yml run --rm test npm test -- --testPathPattern=verification
```

## CI/CD Pipeline

### 1. GitHub Actions Workflow

Create `.github/workflows/docker-test.yml`:
```yaml
name: Docker Tests

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
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v1
      
    - name: Run tests in Docker
      run: |
        docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test
        
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v2
      with:
        name: test-results
        path: test-results/
        
    - name: Cleanup
      if: always()
      run: docker-compose -f docker-compose.test.yml down -v
```

### 2. Test Results

The test results will be available in the `test-results` directory:
```
test-results/
├── unit/
│   ├── coverage/
│   └── test-report.json
└── integration/
    └── test-report.json
```

## Best Practices

### 1. Container Configuration

- Use multi-stage builds for smaller images
- Implement proper health checks
- Set appropriate resource limits
- Use environment variables for configuration
- Mount volumes for test results

### 2. Test Isolation

- Each test suite runs in its own container
- Tests don't interfere with each other
- Clean up resources after tests
- Use unique ports for each service
- Implement proper service dependencies

### 3. Security

- Run containers with non-root user
- Scan images for vulnerabilities
- Use secrets for sensitive data
- Implement proper network isolation
- Follow security best practices

## Troubleshooting

### 1. Common Issues

#### Container Startup Failures
```bash
# Check container logs
docker-compose -f docker-compose.test.yml logs server

# Check container status
docker-compose -f docker-compose.test.yml ps

# Check container health
docker inspect keypass-server | grep Health
```

#### Test Failures
```bash
# Run tests with debug logging
docker-compose -f docker-compose.test.yml run --rm test npm test -- --debug

# Check test logs
docker-compose -f docker-compose.test.yml logs test

# Access test container
docker-compose -f docker-compose.test.yml exec test sh
```

### 2. Debug Mode

Enable debug mode in Docker:
```bash
# Run with debug logging
DEBUG=keypass:* docker-compose -f docker-compose.test.yml up

# Run specific service with debug
docker-compose -f docker-compose.test.yml run --rm test DEBUG=keypass:wallet npm test
```

### 3. Cleanup

```bash
# Remove all containers and volumes
docker-compose -f docker-compose.test.yml down -v

# Remove unused images
docker image prune -f

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f
``` 