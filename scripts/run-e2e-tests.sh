#!/bin/bash

# E2E Test Runner Script
# This script runs the SBT minting end-to-end tests with proper environment setup

set -e  # Exit on any error

echo "=== SBT Minting E2E Test Runner ==="
echo "Timestamp: $(date)"
echo ""

# Check if .env.e2e exists
if [ ! -f ".env.e2e" ]; then
    echo "❌ Error: .env.e2e file not found"
    echo "Please copy env.e2e.template to .env.e2e and configure it:"
    echo "  cp env.e2e.template .env.e2e"
    echo "  nano .env.e2e"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables from .env.e2e..."
source .env.e2e

# Validate required environment variables
echo "🔍 Validating environment configuration..."

if [ -z "$TEST_PRIVATE_KEY" ]; then
    echo "❌ Error: TEST_PRIVATE_KEY is required"
    exit 1
fi

if [ -z "$TEST_RECIPIENT" ]; then
    echo "⚠️  Warning: TEST_RECIPIENT not set, will use wallet address"
fi

echo "✅ Environment configuration validated"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build
echo "✅ Build completed"
echo ""

# Run E2E tests
echo "🧪 Running SBT minting E2E tests..."
echo ""

# Run the specific SBT E2E test
npm run test:sbt:e2e

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All E2E tests passed successfully!"
    echo ""
    echo "📊 Test Results:"
    echo "  - Check test-results/e2e/ for detailed reports"
    echo "  - Check console output for transaction details"
    echo "  - Verify transactions on Moonbase Alpha explorer"
    echo ""
    echo "🔗 Explorer Links:"
    echo "  - Moonbase Alpha: https://moonbase.moonscan.io/"
    echo "  - Network: Moonbase Alpha (Chain ID: 1287)"
    echo ""
else
    echo ""
    echo "❌ E2E tests failed!"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  1. Check wallet balance (need at least 0.1 DEV)"
    echo "  2. Verify TEST_PRIVATE_KEY is correct"
    echo "  3. Check network connectivity"
    echo "  4. Review test logs for specific errors"
    echo ""
    echo "📚 Documentation: src/__tests__/integration/README.md"
    exit 1
fi

echo "=== E2E Test Runner Completed ==="
