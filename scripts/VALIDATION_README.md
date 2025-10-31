# Onchain Validation Scripts

This directory contains scripts for validating and documenting onchain operations performed as part of the KeyPass project.

## Overview

These scripts generate public proof of onchain operations including:
- **KILT DID Creation and Resolution**: Register and resolve DIDs on KILT Peregrine testnet
- **Moonbeam SBT Minting**: Mint Soulbound Tokens and verify non-transferability
- **Zero-Knowledge Proof Generation**: Generate and verify ZK proofs

All scripts output detailed transaction information that can be copied to `ONCHAIN_VALIDATION.md` for public documentation.

## Quick Start

### Prerequisites

1. **Testnet Accounts**: Test accounts should be populated in `testnet-accounts-summary.txt`:
   ```bash
   # Generate test accounts if needed
   npm run setup:testnet
   ```

2. **Testnet Tokens**: Ensure you have sufficient balance:
   ```bash
   # Check balances
   npm run check:balances
   ```

3. **Dependencies**: Install project dependencies:
   ```bash
   npm install
   ```

### Running Validation Scripts

#### Individual Validations

```bash
# Validate KILT DID operations
npm run validate:kilt

# Validate SBT minting operations
npm run validate:sbt

# Validate ZK-proof generation
npm run validate:zk
```

#### Run All Validations

```bash
# Run all validation scripts in sequence
npm run validate:all
```

## Script Details

### `validate-kilt-did.js`

**Purpose**: Creates and resolves KILT DIDs on-chain.

**Network**: KILT Peregrine Testnet (`wss://peregrine.kilt.io/parachain-public-ws`)

**What it does**:
1. Connects to KILT Peregrine testnet
2. Loads test account from `testnet-accounts-summary.txt`
3. Creates a DID on-chain using the KILT DID pallet
4. Captures transaction hash, block number, and block hash
5. Resolves the DID from the blockchain
6. Outputs detailed information for documentation

**Output Example**:
```
📋 DID Information:
   🆔 DID: did:kilt:4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN
   📝 Transaction Hash: 0x...
   📦 Block Number: 12345
   🔗 Block Hash: 0x...

🔗 Block Explorer Links:
   🌐 Polkadot.js: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fperegrine.kilt.io#/explorer/query/12345
   🔍 Peregrine Explorer: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fperegrine.kilt.io%2Fparachain-public-ws#/explorer/query/12345
```

### `validate-sbt-mint.js`

**Purpose**: Mints SBT tokens on Moonbase Alpha and verifies non-transferability.

**Network**: Moonbase Alpha Testnet

**Prerequisites**:
- SBT contract deployed (see `config/deployments.json`)
- Test account with DEV tokens

**What it does**:
1. Loads SBT contract address from `config/deployments.json`
2. Loads test account from `testnet-accounts-summary.txt`
3. Connects to Moonbase Alpha
4. Mints an SBT token to the test account
5. Attempts to transfer the token (should fail)
6. Captures all transaction details
7. Outputs Moonscan links for verification

**Output Example**:
```
📋 Transaction Information:
   📍 Contract: 0xB63E1e058c46a5eb9dDfC87f3380A37C606E5F65
   🔗 Transaction Hash: 0x...
   📦 Block Number: 67890
   🪙 Token ID: 1

🔗 Block Explorer Links:
   🌐 Moonscan: https://moonbase.moonscan.io/tx/0x...
   📦 Contract: https://moonbase.moonscan.io/address/0xB63E1e058c46a5eb9dDfC87f3380A37C606E5F65
```

### `validate-zkproof.js`

**Purpose**: Generates and verifies zero-knowledge proofs.

**Circuit**: Semaphore v4

**What it does**:
1. Creates mock credentials (age and student status)
2. Generates a test wallet for identity
3. Initializes the zkProofService
4. Generates an age verification proof
5. Verifies the proof
6. Outputs proof details and verification results

**Output Example**:
```
📋 Proof Information:
   🔐 Proof Type: semaphore
   🎯 Circuit: age-verification
   ✅ Verification: Valid
   📝 Public Signals: 4

🔐 Privacy Properties:
   ✅ Age verified without revealing exact age
   ✅ Identity commitment maintained
   ✅ Zero-knowledge property preserved
```

## Documentation Workflow

### Adding Validation Evidence to ONCHAIN_VALIDATION.md

1. **Run Validation Script**:
   ```bash
   npm run validate:kilt
   ```

2. **Copy Output**: The script outputs formatted information ready for documentation

3. **Update ONCHAIN_VALIDATION.md**: 
   - Find the relevant section (KILT DID, SBT, or ZK-Proof)
   - Replace placeholder transaction hashes with actual hashes
   - Replace placeholder block numbers with actual values
   - Update status indicators from `⏳ Pending` to `✅ Verified`
   - Add block explorer links

4. **Example Update**:
   ```markdown
   **Transaction Hash**: `0xabc123...` *(was: `0x0000...`)*
   **Block Number**: `12345` *(was: `-`)*
   **Status**: ✅ Verified *(was: ⏳ Pending)*
   ```

## Troubleshooting

### KILT DID Script

**Error**: "Insufficient balance"
- **Solution**: Get KILT testnet tokens from https://faucet.peregrine.kilt.io/

**Error**: "No mnemonic found in testnet-accounts-summary.txt"
- **Solution**: Run `npm run setup:testnet` to generate test accounts

**Error**: "DID creation failed"
- **Solution**: Check that you have sufficient balance and network connection

### SBT Minting Script

**Error**: "No SBT contract address found"
- **Solution**: Deploy SBT contract using `npm run deploy:sbt:testnet`

**Error**: "Insufficient balance"
- **Solution**: Get DEV tokens from https://apps.moonbeam.network/moonbase-alpha/faucet/

**Error**: "Contract not found"
- **Solution**: Verify contract address in `config/deployments.json`

### ZK-Proof Script

**Error**: "Cannot find module zkProofService"
- **Solution**: Ensure React boilerplate dependencies are installed

**Error**: "Proof generation failed"
- **Solution**: This is expected in mock mode; real proofs require Semaphore circuit artifacts

## Integration with CI/CD

These scripts can be integrated into CI/CD pipelines for automated validation:

```yaml
# Example GitHub Actions workflow
- name: Validate Onchain Operations
  run: |
    npm run validate:all
    # Parse output and update ONCHAIN_VALIDATION.md
```

## Security Notes

⚠️ **Important**: 
- These scripts use testnet accounts and tokens only
- Never commit private keys or mnemonics to version control
- The `testnet-accounts-summary.txt` file is in `.gitignore`
- All validation is performed on test networks (Peregrine, Moonbase Alpha)

## References

- **ONCHAIN_VALIDATION.md**: Main documentation file
- **testnet-accounts-summary.txt**: Test account credentials
- **config/deployments.json**: Deployment addresses and transaction hashes
- **README.md**: Project overview and setup instructions

## Support

For issues or questions:
1. Check `ONCHAIN_VALIDATION.md` for current status
2. Review script output for detailed error messages
3. Verify testnet account balances
4. Check network connectivity and RPC endpoints

