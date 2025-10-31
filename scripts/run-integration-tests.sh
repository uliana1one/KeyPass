#!/bin/bash

# Script to run integration tests with coverage
# Usage: ./scripts/run-integration-tests.sh

set -e

echo "🚀 KeyPass Integration Tests with Coverage"
echo ""

# Check if .env.integration exists
if [ ! -f .env.integration ]; then
  echo "❌ Error: .env.integration file not found!"
  echo ""
  echo "📝 Create .env.integration with the following variables:"
  echo ""
  cat << 'EOF'
ENABLE_INTEGRATION_TESTS=true
KILT_WSS_ADDRESS="wss://peregrine.kilt.io/parachain-public-ws"
KILT_TESTNET_MNEMONIC="your twelve word mnemonic"
MOONBEAM_RPC_URL="https://rpc.api.moonbase.moonbeam.network"
MOONBEAM_PRIVATE_KEY="0x..."
EOF
  echo ""
  exit 1
fi

# Load environment variables
echo "📂 Loading .env.integration..."
export $(cat .env.integration | grep -v '^#' | xargs)

# Verify required variables
echo "✅ Checking required environment variables..."
required_vars=(
  "ENABLE_INTEGRATION_TESTS"
  "KILT_WSS_ADDRESS"
  "KILT_TESTNET_MNEMONIC"
  "MOONBEAM_RPC_URL"
  "MOONBEAM_PRIVATE_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
  echo "❌ Error: Missing required environment variables:"
  for var in "${missing_vars[@]}"; do
    echo "   - $var"
  done
  exit 1
fi

echo "✅ All required variables set"
echo ""

# Check if SBT contract is deployed
echo "🔍 Checking for deployed SBT contract..."
if [ ! -f config/deployments.json ]; then
  echo "⚠️  Warning: No deployments.json found"
  echo "   Run: npm run deploy:sbt:testnet"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Run the tests
echo "🧪 Running integration tests with coverage..."
echo ""

npm test -- \
  --testPathPattern=CompleteFlow \
  --coverage \
  --coveragePathIgnorePatterns="/node_modules/" \
  --collectCoverageFrom="src/__tests__/integration/**/*.ts" \
  --verbose

echo ""
echo "✅ Tests complete!"

