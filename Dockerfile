# Multi-stage build for KeyPass
FROM node:20-slim AS base

# Install system dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ wget ca-certificates git curl && \
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

# Install specific npm version
RUN npm install -g npm@10.2.4

# Set memory limits for Node.js
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies
RUN npm ci --no-audit --verbose

# Build stage
FROM base AS builder

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y wget curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy React boilerplate example
COPY --from=builder /app/examples/react-boilerplate ./examples/react-boilerplate

# Create necessary directories
RUN mkdir -p /app/logs

# Expose server port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["npm", "run", "start"] 