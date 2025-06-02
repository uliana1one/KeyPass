# Docker Testing Guide for KeyPass SDK

This guide provides instructions for running the KeyPass SDK test suite in Docker containers.

## Docker Setup

### 1. Verification Server Dockerfile

Create `Dockerfile.server`:
```dockerfile
# Build stage
FROM node:20-slim AS builder

# Install dependencies for @polkadot/util-crypto and git
RUN apt-get update && \
    apt-get install -y python3 make g++ wget ca-certificates git && \
    rm -rf /var/lib/apt/lists/*

# Configure git
RUN git config --global --add safe.directory /app && \
    git config --global user.email "docker@example.com" && \
    git config --global user.name "Docker Build"

# Create app directory
WORKDIR /app

# Create .npmrc with specific configuration
RUN echo "registry=https://registry.npmjs.org/" > .npmrc && \
    echo "fetch-retries=5" >> .npmrc && \
    echo "fetch-retry-mintimeout=20000" >> .npmrc && \
    echo "fetch-retry-maxtimeout=120000" >> .npmrc && \
    echo "network-timeout=300000" >> .npmrc && \
    echo "strict-ssl=true" >> .npmrc && \
    echo "audit=false" >> .npmrc && \
    echo "fund=false" >> .npmrc && \
    echo "loglevel=verbose" >> .npmrc

# Copy package files
COPY package*.json ./

# Install specific npm version known to handle integrity well
RUN npm install -g npm@10.2.4

# Install dependencies with specific memory limits
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Clean install with git available
RUN npm cache clean --force && \
    rm -f package-lock.json && \
    npm install --package-lock-only && \
    npm ci --no-audit --verbose

# Production stage
FROM node:20-slim

# Install runtime dependencies only
RUN apt-get update && \
    apt-get install -y wget curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose server port
EXPOSE 3000

# Add healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f -X POST -H "Content-Type: application/json" -d '{"message":"healthcheck","signature":"0x123","address":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"}' http://localhost:3000/api/verify || exit 1

# Start server
CMD ["npm", "run", "start"]
```

### 2. Test Runner Dockerfile

Create `Dockerfile.test`:
```dockerfile
# Use Node.js 20 as base image
FROM node:20-alpine

# Install dependencies for browser testing and @polkadot/util-crypto
RUN apk update && \
    apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++ \
    wget \
    git && \
    # Configure git
    git config --global --add safe.directory /app && \
    git config --global user.email "docker@example.com" && \
    git config --global user.name "Docker Build"

# Set environment variables for Chrome
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create app directory
WORKDIR /app

# Create .npmrc with specific configuration
RUN echo "registry=https://registry.npmjs.org/" > .npmrc && \
    echo "fetch-retries=5" >> .npmrc && \
    echo "fetch-retry-mintimeout=20000" >> .npmrc && \
    echo "fetch-retry-maxtimeout=120000" >> .npmrc && \
    echo "network-timeout=300000" >> .npmrc && \
    echo "strict-ssl=true" >> .npmrc && \
    echo "audit=false" >> .npmrc && \
    echo "fund=false" >> .npmrc && \
    echo "loglevel=verbose" >> .npmrc

# Copy package files
COPY package*.json ./

# Install specific npm version known to handle integrity well
RUN npm install -g npm@10.2.4

# Install dependencies with specific memory limits
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Clean install with git available
RUN npm cache clean --force && \
    rm -f package-lock.json && \
    npm install --package-lock-only && \
    npm ci --no-audit --verbose

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create test results directory
RUN mkdir -p /app/test-results

# Default command (can be overridden)
CMD ["npm", "test"]
```

### 3. Docker Compose Configuration

Create `docker-compose.test.yml`:
```yaml
services:
  # Verification server
  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - PORT=3000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

  # Test runner
  test:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - NODE_ENV=test
      - VERIFICATION_API_URL=http://server:3000/api
      - DEBUG=keypass:*
    depends_on:
      server:
        condition: service_healthy
    volumes:
      - ./test-results:/app/test-results
    command: npm test -- --coverage --coverageReporters='json-summary' --coverageReporters='text' --coverageDirectory='./test-results/coverage'
```

### 4. Test Scripts

Update `package.json` to include:
```json
{
  "scripts": {
    "test:docker": "docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test",
    "test:docker:cleanup": "docker-compose -f docker-compose.test.yml down -v",
  }
}
```

## Running Tests in Docker

Note: Make sure to start Docker on your computer before running the commands. 

### 1. Run All Tests

```bash
# Run all tests in Docker
npm run test:docker

# Clean up containers after tests
npm run test:docker:cleanup
```


### Test Results

The test results will be available in the `test-results` directory. This directory is automatically created when running tests through Docker or GitHub Actions. 

Note: The test-results directory is mounted as a volume in the Docker container, so results persist after the container stops. You can find the results in the `test-results` directory at the root of the project.

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