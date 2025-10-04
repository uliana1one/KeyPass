# Deployment Scripts

This directory contains deployment scripts for SBT (Soulbound Token) contracts on Moonbeam networks.

## Files

### `deploySBT.ts`
TypeScript deployment script with full type safety and modern ES modules support.

### `deploySBT.js`
JavaScript deployment script for environments that don't support TypeScript.

## Usage

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Private Key** for deployment
3. **Moonbeam Testnet Tokens** (DEV tokens for Moonbase Alpha)
4. **MoonScan API Key** (optional, for contract verification)

### Environment Variables

#### Required
- `PRIVATE_KEY` - Private key for deployment (without 0x prefix)

#### Optional
- `NETWORK` - Target network (default: moonbase-alpha)
- `MOONSCAN_API_KEY` - API key for contract verification
- `GAS_LIMIT` - Custom gas limit for deployment
- `GAS_PRICE` - Custom gas price in wei
- `MAX_FEE_PER_GAS` - EIP-1559 max fee per gas
- `MAX_PRIORITY_FEE_PER_GAS` - EIP-1559 priority fee

### Deployment Commands

#### Using TypeScript (Recommended)
```bash
# Set environment variables
export PRIVATE_KEY="your_private_key_here"
export MOONSCAN_API_KEY="your_api_key_here"  # Optional

# Deploy to Moonbase Alpha (testnet)
npm run deploy:sbt

# Or run directly
npx ts-node scripts/deploySBT.ts

# Deploy to specific network
NETWORK=moonbase-alpha npx ts-node scripts/deploySBT.ts
```

#### Using JavaScript
```bash
# Set environment variables
export PRIVATE_KEY="your_private_key_here"
export MOONSCAN_API_KEY="your_api_key_here"  # Optional

# Deploy to Moonbase Alpha (testnet)
node scripts/deploySBT.js

# Deploy to specific network
NETWORK=moonbase-alpha node scripts/deploySBT.js
```

### Supported Networks

#### Moonbase Alpha (Testnet)
- **Chain ID**: 1287
- **RPC URL**: https://rpc.api.moonbase.moonbeam.network
- **Explorer**: https://moonbase.moonscan.io
- **Currency**: DEV
- **Faucet**: https://faucet.moonbase.moonbeam.network

#### Moonbeam (Mainnet)
- **Chain ID**: 1284
- **RPC URL**: https://rpc.api.moonbeam.network
- **Explorer**: https://moonscan.io
- **Currency**: GLMR

#### Moonriver (Mainnet)
- **Chain ID**: 1285
- **RPC URL**: https://rpc.api.moonriver.moonbeam.network
- **Explorer**: https://moonriver.moonscan.io
- **Currency**: MOVR

## Configuration

### Default Constructor Arguments
- **Name**: "KeyPass SBT"
- **Symbol**: "KPASS"
- **Base URI**: "https://api.keypass.com/metadata/"

### Gas Settings
- **Default Gas Limit**: 3,000,000
- **Default Gas Price**: 1 Gwei
- **EIP-1559 Support**: Yes

## Output

### Success Output
```
🎯 SBT Contract Deployment Script
=====================================
🌐 Network: moonbase-alpha
📝 Contract: SBTSimple
🔧 Verification: Enabled
💾 Save Config: Yes
🔍 Verbose: Yes

🔑 Wallet created: 0x1234...5678
💰 Wallet balance: 1.5 DEV
📋 Deployment configuration: {
  name: 'KeyPass SBT',
  symbol: 'KPASS',
  baseURI: 'https://api.keypass.com/metadata/',
  owner: '0x1234...5678'
}
⏳ Deploying contract...
✅ Contract deployed successfully!
📍 Contract address: 0xabcd...efgh
🔗 Transaction hash: 0x1234...5678
📦 Block number: 12345678
⛽ Gas used: 1800000
💰 Deployment cost: 0.0018 DEV
🔍 Explorer: https://moonbase.moonscan.io/address/0xabcd...efgh
✅ Configuration saved to: /path/to/config/deployments.json
⏱️  Deployment completed in 45.67 seconds

🎉 Deployment completed successfully!
📍 Contract: 0xabcd...efgh
🔗 Transaction: 0x1234...5678
✅ Contract verified: https://moonbase.moonscan.io/address/0xabcd...efgh#code
```

### Error Output
```
❌ Deployment failed: Insufficient balance. Need at least 0.01 DEV for deployment.
💥 Deployment failed!
❌ Error: Insufficient balance. Need at least 0.01 DEV for deployment.
```

## Configuration File

The script automatically saves deployment information to `config/deployments.json`:

```json
{
  "deployments": {
    "moonbase-alpha": {
      "SBTSimple": {
        "address": "0xabcd...efgh",
        "deployedAt": "2024-01-15T10:30:00.000Z",
        "transactionHash": "0x1234...5678",
        "blockNumber": 12345678,
        "verified": true,
        "verificationId": "verify_1234567890",
        "constructorArgs": {
          "name": "KeyPass SBT",
          "symbol": "KPASS",
          "baseURI": "https://api.keypass.com/metadata/"
        },
        "gasUsed": "1800000",
        "deploymentCost": "1800000000000000"
      }
    }
  },
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "description": "SBT Contract Deployment Configuration"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Insufficient Balance
```
❌ Insufficient balance. Need at least 0.01 DEV for deployment.
```
**Solution**: Get testnet tokens from the Moonbase Alpha faucet.

#### 2. Invalid Private Key
```
❌ Failed to create wallet: invalid private key
```
**Solution**: Ensure private key is valid and properly formatted.

#### 3. Network Connection Issues
```
❌ Deployment failed: network error
```
**Solution**: Check internet connection and RPC endpoint availability.

#### 4. Gas Estimation Failed
```
❌ Deployment failed: gas estimation failed
```
**Solution**: Increase gas limit or check contract bytecode.

#### 5. Verification Failed
```
⚠️ Contract verification failed or is pending
```
**Solution**: Check MoonScan API key and try manual verification.

### Debug Mode

Enable verbose logging by setting environment variable:
```bash
export NODE_ENV=development
```

### Manual Verification

If automatic verification fails, you can manually verify the contract:

1. Go to the explorer (e.g., https://moonbase.moonscan.io)
2. Navigate to your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Fill in the verification form with:
   - Contract address
   - Compiler version: 0.8.19
   - License: MIT
   - Source code (from `src/contracts/SBTSimple.sol`)
   - Constructor arguments (encoded)

## Security Notes

- **Never commit private keys** to version control
- **Use testnet** for development and testing
- **Verify contracts** before mainnet deployment
- **Monitor gas prices** for cost optimization
- **Backup deployment configurations**

## Support

For issues with deployment:

1. Check the troubleshooting section above
2. Verify environment variables are set correctly
3. Ensure sufficient balance for deployment
4. Check network connectivity
5. Review error messages for specific issues

## Examples

### Basic Deployment
```bash
export PRIVATE_KEY="0x1234567890abcdef..."
node scripts/deploySBT.js
```

### Custom Gas Settings
```bash
export PRIVATE_KEY="0x1234567890abcdef..."
export GAS_LIMIT="4000000"
export GAS_PRICE="2000000000"
node scripts/deploySBT.js
```

### EIP-1559 Deployment
```bash
export PRIVATE_KEY="0x1234567890abcdef..."
export MAX_FEE_PER_GAS="3000000000"
export MAX_PRIORITY_FEE_PER_GAS="2000000000"
node scripts/deploySBT.js
```

### Production Deployment
```bash
export PRIVATE_KEY="0x1234567890abcdef..."
export NETWORK="moonbeam"
export MOONSCAN_API_KEY="your_api_key"
export NODE_ENV="production"
node scripts/deploySBT.js
```
