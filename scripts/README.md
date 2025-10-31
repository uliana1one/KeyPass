# KeyPass Deployment Scripts

This directory contains deployment and utility scripts for the KeyPass project.

## SBT Contract Deployment

### Overview

The `deploySBT.ts` script deploys the SBT (Soulbound Token) contract to Moonbeam networks with full blockchain integration, verification support, and configuration management.

### Features

- ✅ **Real Moonbeam Deployment**: Deploy to testnet (Moonbase Alpha) or mainnet (Moonbeam/Moonriver)
- ✅ **Contract Verification**: Optional contract verification on Moonbeam explorer
- ✅ **Configuration Management**: Automatic saving of deployment artifacts and addresses
- ✅ **Multi-Network Support**: Seamless switching between testnet and mainnet
- ✅ **Gas Optimization**: Configurable gas limits and EIP-1559 support
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Type Safety**: Full TypeScript type safety with proper Moonbeam types

### Prerequisites

1. **Node.js**: Version 18+ with ESM support
2. **Dependencies**: Install project dependencies
   ```bash
   npm install
   ```
3. **Private Key**: Deployment wallet private key
4. **Network Funds**: Sufficient DEV (testnet) or GLMR/MOVR (mainnet) tokens
5. **Moonscan API Key** (optional): For contract verification

### Environment Variables

Create a `.env` file or set these environment variables:

#### Required

- `PRIVATE_KEY`: Private key for deployment wallet (with 0x prefix)

#### Optional

- `NETWORK`: Target network (default: `moonbase-alpha`)
  - `moonbase-alpha`: Moonbeam testnet
  - `moonbeam`: Moonbeam mainnet
  - `moonriver`: Moonriver (Kusama)
  
- `MOONSCAN_API_KEY`: API key for contract verification on Moonscan

- `CONTRACT_NAME`: Custom contract name (default: `KeyPass SBT`)
- `CONTRACT_SYMBOL`: Custom contract symbol (default: `KPASS`)
- `BASE_URI`: Base URI for token metadata (default: `https://api.keypass.com/metadata/`)

- `GAS_LIMIT`: Custom gas limit (optional)
- `GAS_PRICE`: Custom gas price in wei (optional)
- `MAX_FEE_PER_GAS`: EIP-1559 max fee per gas in wei (optional)
- `MAX_PRIORITY_FEE_PER_GAS`: EIP-1559 priority fee in wei (optional)

### Usage

#### TypeScript Execution

```bash
# Deploy to testnet (default)
PRIVATE_KEY=0x... npx ts-node scripts/deploySBT.ts

# Deploy to mainnet with verification
PRIVATE_KEY=0x... NETWORK=moonbeam MOONSCAN_API_KEY=... npx ts-node scripts/deploySBT.ts

# Custom contract configuration
PRIVATE_KEY=0x... CONTRACT_NAME="My SBT" CONTRACT_SYMBOL="MSBT" npx ts-node scripts/deploySBT.ts
```

#### JavaScript Execution

```bash
# First compile TypeScript
npm run build

# Then run the compiled JavaScript
PRIVATE_KEY=0x... node dist/scripts/deploySBT.js
```

#### NPM Script (if configured in package.json)

```bash
npm run deploy:sbt
```

### Deployment Output

The script provides comprehensive deployment information:

```
🎯 SBT Contract Deployment Script
=====================================
🌐 Network: moonbase-alpha
📝 Contract: SBTSimple
🏷️  Name: KeyPass SBT
🔤 Symbol: KPASS
🌐 Base URI: https://api.keypass.com/metadata/
🔧 Verification: Enabled
💾 Save Config: Yes
🔍 Verbose: Yes

🔑 Wallet created: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7
💰 Wallet balance: 10.5 DEV
🚀 Starting SBT contract deployment to moonbase-alpha...
📋 Deployment configuration: {
  name: 'KeyPass SBT',
  symbol: 'KPASS',
  baseURI: 'https://api.keypass.com/metadata/',
  owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
}
⏳ Deploying contract...
✅ Contract deployed successfully!
📍 Contract address: 0x1234567890123456789012345678901234567890
🔗 Transaction hash: 0xabcdef...
📦 Block number: 1234567
⛽ Gas used: 2500000
💰 Deployment cost: 0.05 DEV
🔍 Explorer: https://moonbase.moonscan.io/address/0x1234567890123456789012345678901234567890
✅ Configuration saved to: /path/to/config/deployments.json
⏱️  Deployment completed in 45.32 seconds

🎉 Deployment completed successfully!
```

### Configuration Files

#### Deployment Artifacts

Deployment information is saved to `config/deployments.json`:

```json
{
  "deployments": {
    "moonbase-alpha": {
      "SBTSimple": {
        "address": "0x1234567890123456789012345678901234567890",
        "deployedAt": "2024-10-09T12:34:56.789Z",
        "transactionHash": "0xabcdef...",
        "blockNumber": 1234567,
        "verified": false,
        "constructorArgs": {
          "name": "KeyPass SBT",
          "symbol": "KPASS",
          "baseURI": "https://api.keypass.com/metadata/"
        },
        "gasUsed": "2500000",
        "deploymentCost": "50000000000000000"
      }
    }
  },
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2024-10-09T12:34:56.789Z",
    "description": "SBT Contract Deployment Configuration"
  }
}
```

### Network Information

| Network | Chain ID | RPC URL | Explorer | Token |
|---------|----------|---------|----------|-------|
| Moonbase Alpha | 1287 | https://rpc.api.moonbase.moonbeam.network | https://moonbase.moonscan.io | DEV |
| Moonbeam | 1284 | https://rpc.api.moonbeam.network | https://moonscan.io | GLMR |
| Moonriver | 1285 | https://rpc.api.moonriver.moonbeam.network | https://moonriver.moonscan.io | MOVR |

### Contract Verification

To enable contract verification:

1. **Get Moonscan API Key**:
   - Visit [Moonbase Moonscan](https://moonbase.moonscan.io/apis) (testnet)
   - Or [Moonscan](https://moonscan.io/apis) (mainnet)
   - Create an account and generate an API key

2. **Set Environment Variable**:
   ```bash
   export MOONSCAN_API_KEY=your_api_key_here
   ```

3. **Deploy with Verification**:
   ```bash
   PRIVATE_KEY=0x... MOONSCAN_API_KEY=... npx ts-node scripts/deploySBT.ts
   ```

### Security Best Practices

1. **Private Key Management**:
   - Never commit private keys to version control
   - Use environment variables or secure key management systems
   - Use a dedicated deployment wallet with limited funds

2. **Testnet First**:
   - Always test on Moonbase Alpha testnet first
   - Verify all functionality before mainnet deployment
   - The script includes a 5-second warning for mainnet deployments

3. **Gas Configuration**:
   - Monitor gas prices before deployment
   - Use reasonable gas limits to avoid failed transactions
   - Consider EIP-1559 parameters for better fee management

### Troubleshooting

#### "Insufficient balance" Error

Ensure your wallet has enough tokens for deployment:
- **Moonbase Alpha**: Get free DEV tokens from [Moonbase Faucet](https://faucet.moonbeam.network/)
- **Moonbeam/Moonriver**: Ensure sufficient GLMR/MOVR balance

#### "Network Error" or Connection Issues

- Check your internet connection
- Verify RPC URLs are accessible
- Try again if network is temporarily unavailable

#### "Invalid private key" Error

- Ensure private key is in correct format (with or without 0x prefix)
- Verify private key corresponds to an account with sufficient balance

#### TypeScript Compilation Errors

Some errors from `node_modules/@polkadot` are expected and don't affect functionality:
```bash
# These are external library issues and can be ignored
node_modules/@polkadot/...
```

Project-specific errors will be shown and should be fixed.

### Programmatic Usage

You can also use the deployment function programmatically:

```typescript
import { deploySBTContract, DeploymentConfig } from './scripts/deploySBT';

const config: DeploymentConfig = {
  network: 'moonbase-alpha',
  privateKey: '0x...',
  contractName: 'SBTSimple',
  constructorArgs: {
    name: 'My SBT',
    symbol: 'MSBT',
    baseURI: 'https://api.example.com/metadata/'
  },
  enableVerification: true,
  moonScanApiKey: '...',
  saveConfig: true,
  verbose: true
};

const result = await deploySBTContract(config);

if (result.success) {
  console.log('Deployed at:', result.contractAddress);
} else {
  console.error('Deployment failed:', result.error);
}
```

### Support

For issues or questions:
1. Check this README for common solutions
2. Review deployment logs for specific error messages
3. Consult the [Moonbeam documentation](https://docs.moonbeam.network/)
4. Open an issue in the KeyPass repository

## Onchain Validation Scripts

The KeyPass project includes scripts for validating and documenting onchain operations. See [VALIDATION_README.md](./VALIDATION_README.md) for detailed information.

### Quick Usage

```bash
# Validate KILT DID operations
npm run validate:kilt

# Validate SBT minting operations
npm run validate:sbt

# Validate ZK-proof generation
npm run validate:zk

# Run all validations
npm run validate:all
```

### What They Do

- **validate-kilt-did.js**: Creates and resolves KILT DIDs on Peregrine testnet
- **validate-sbt-mint.js**: Mints SBT tokens and verifies non-transferability
- **validate-zkproof.js**: Generates and verifies zero-knowledge proofs

All scripts output transaction details for documentation in `ONCHAIN_VALIDATION.md`.

## Other Scripts

### E2E Tests

```bash
# Run end-to-end tests
./scripts/run-e2e-tests.sh
```

### Production Verification

```bash
# Verify production deployment
node scripts/production-verification.js
```

### E2E Setup Validation

```bash
# Validate E2E test setup
node scripts/validate-e2e-setup.js
```

## Development

### Adding New Scripts

1. Create a new TypeScript file in this directory
2. Add proper type definitions
3. Include comprehensive error handling
4. Document usage in this README
5. Add npm script to `package.json` if needed

### Testing Scripts Locally

```bash
# Compile TypeScript
npm run build

# Test deployment (testnet only!)
PRIVATE_KEY=0x... NETWORK=moonbase-alpha npx ts-node scripts/deploySBT.ts
```

## License

See the main project LICENSE file.
