# SBT Contract Artifacts

This directory contains compiled contract artifacts, deployment configurations, and verification data for the SBT (Soulbound Token) contracts on Moonbeam networks.

## Files Overview

### `SBTSimple.json`
Complete contract artifact containing:
- **ABI**: Application Binary Interface for the SBT contract
- **Bytecode**: Compiled contract bytecode for deployment
- **Deployed Bytecode**: Runtime bytecode after deployment
- **Metadata**: Compilation metadata and source information
- **Link References**: External library references (if any)

### `bytecode.json`
Contract bytecode information including:
- **Bytecode**: Raw bytecode for deployment
- **Deployed Bytecode**: Runtime bytecode
- **Compiler Version**: Solidity compiler version used
- **Optimization Settings**: Compiler optimization configuration
- **Gas Estimates**: Estimated gas costs for contract operations
- **Size Information**: Contract size metrics

### `deployment-configs.json`
Network-specific deployment configurations:
- **Network Configurations**: Settings for Moonbase Alpha, Moonbeam, and Moonriver
- **Gas Settings**: Gas limits, prices, and EIP-1559 parameters
- **Verification Settings**: Contract verification configuration
- **Environment Variables**: Required and optional environment variables
- **Default Values**: Default deployment parameters

### `verification-data.json`
Contract verification templates and data:
- **Verification Templates**: API templates for different networks
- **Source Code**: Contract source code for verification
- **Verification History**: Track of verification attempts
- **Status Codes**: Verification status definitions
- **Results**: Standard verification result formats

## Usage

### Deployment
```typescript
import { SBTContractFactory } from '../SBTContractFactory.js';
import deploymentConfigs from './deployment-configs.json';

const factory = new SBTContractFactory(adapter);
const config = deploymentConfigs.networks['moonbase-alpha'];
const result = await factory.deployContract(config, signer);
```

### Verification
```typescript
import verificationData from './verification-data.json';

const verificationResult = await factory.verifyContract(
  contractAddress,
  verificationData.sourceCode.SBTSimple.source,
  constructorArgs,
  'moonbase-alpha'
);
```

### Bytecode Access
```typescript
import bytecodeData from './bytecode.json';

const bytecode = bytecodeData.SBTSimple.bytecode;
const gasEstimate = bytecodeData.SBTSimple.gasEstimate.deployment;
```

## Network Support

### Moonbase Alpha (Testnet)
- **Chain ID**: 1287
- **RPC**: https://rpc.api.moonbase.moonbeam.network
- **Explorer**: https://moonbase.moonscan.io
- **Currency**: DEV

### Moonbeam (Mainnet)
- **Chain ID**: 1284
- **RPC**: https://rpc.api.moonbeam.network
- **Explorer**: https://moonscan.io
- **Currency**: GLMR

### Moonriver (Mainnet)
- **Chain ID**: 1285
- **RPC**: https://rpc.api.moonriver.moonbeam.network
- **Explorer**: https://moonriver.moonscan.io
- **Currency**: MOVR

## Environment Variables

### Required
- `PRIVATE_KEY`: Private key for deployment
- `MOONSCAN_API_KEY`: API key for contract verification

### Optional
- `GAS_LIMIT`: Custom gas limit for deployment
- `GAS_PRICE`: Custom gas price
- `MAX_FEE_PER_GAS`: EIP-1559 max fee per gas
- `MAX_PRIORITY_FEE_PER_GAS`: EIP-1559 priority fee

## Contract Features

### SBT Implementation
- **ERC-721 Compatible**: Standard NFT interface
- **Soulbound**: Non-transferable tokens
- **Mint/Burn**: Token lifecycle management
- **Metadata Support**: IPFS and HTTP metadata URIs
- **Access Control**: Owner-only minting

### Security Features
- **Transfer Prevention**: Blocks token transfers
- **Owner Control**: Restricted minting permissions
- **Burn Authorization**: Owner or token holder can burn
- **Metadata Validation**: URI format validation

## Gas Estimates

### Deployment
- **Estimated Gas**: ~1,800,000 gas
- **Cost (Moonbase)**: ~0.0018 DEV
- **Cost (Moonbeam)**: ~0.0018 GLMR

### Operations
- **Mint**: ~80,000 gas
- **Burn**: ~45,000 gas
- **Transfer**: 0 gas (blocked)

## Verification Process

1. **Deploy Contract**: Deploy to target network
2. **Wait for Indexing**: Allow 30-60 seconds for explorer indexing
3. **Submit Verification**: Send source code and constructor args
4. **Monitor Status**: Check verification status via API
5. **Confirm Success**: Verify contract appears on explorer

## Troubleshooting

### Common Issues
- **Gas Estimation Failed**: Use default gas limits
- **Verification Timeout**: Increase verification delay
- **Constructor Args Error**: Check argument encoding
- **Source Code Mismatch**: Ensure exact source code match

### Support
For issues with contract deployment or verification, check:
1. Network connectivity
2. Gas price settings
3. API key validity
4. Source code accuracy

## Updates

When updating contract artifacts:
1. Update version numbers in metadata
2. Update timestamps
3. Test deployment on testnet first
4. Update documentation
5. Notify team of changes

## Security Notes

- Keep private keys secure
- Use testnet for development
- Verify contracts before mainnet deployment
- Monitor gas prices for cost optimization
- Backup deployment configurations
