#!/usr/bin/env node

/**
 * Setup Testnet Accounts Script
 * 
 * Generates test accounts for KILT and Moonbeam testnets.
 * ⚠️  WARNING: These are TEST ACCOUNTS ONLY - Never use for real funds!
 */

import { Wallet } from 'ethers';
import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate, cryptoWaitReady } from '@polkadot/util-crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateAccounts() {
  console.log('🔐 Generating Test Accounts for Integration Tests\n');
  console.log('⚠️  WARNING: These are TEST ACCOUNTS ONLY!');
  console.log('⚠️  NEVER send real funds to these addresses!\n');

  // Wait for crypto libraries
  await cryptoWaitReady();

  // Generate KILT account
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📡 KILT Test Account (Peregrine Testnet)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const kiltMnemonic = mnemonicGenerate(12);
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
  const kiltAccount = keyring.addFromMnemonic(kiltMnemonic);

  console.log(`Address:  ${kiltAccount.address}`);
  console.log(`Mnemonic: ${kiltMnemonic}`);
  console.log('\n💰 Get KILT tokens: https://faucet.peregrine.kilt.io/');
  console.log(`   Enter address: ${kiltAccount.address}`);
  console.log('   Click "Request tokens" and wait ~1 minute\n');

  // Generate Moonbeam account
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌙 Moonbeam Test Account (Moonbase Alpha)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const moonbeamWallet = Wallet.createRandom();

  console.log(`Address:     ${moonbeamWallet.address}`);
  console.log(`Private Key: ${moonbeamWallet.privateKey}`);
  console.log(`Mnemonic:    ${moonbeamWallet.mnemonic.phrase}`);
  console.log('\n💰 Get DEV tokens: https://apps.moonbeam.network/moonbase-alpha/faucet/');
  console.log(`   Enter address: ${moonbeamWallet.address}`);
  console.log('   Complete CAPTCHA and click "Request tokens"\n');

  // Create .env.integration file
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Creating .env.integration file');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const envContent = `# Integration Test Environment Variables
# Generated: ${new Date().toISOString()}
# ⚠️  WARNING: TEST ACCOUNTS ONLY - Never use for real funds!

ENABLE_INTEGRATION_TESTS=true

# KILT Configuration (Peregrine Testnet)
KILT_WSS_ADDRESS="wss://peregrine.kilt.io/parachain-public-ws"
KILT_TESTNET_MNEMONIC="${kiltMnemonic}"

# Moonbeam Configuration (Moonbase Alpha)
MOONBEAM_RPC_URL="https://rpc.api.moonbase.moonbeam.network"
MOONBEAM_PRIVATE_KEY="${moonbeamWallet.privateKey}"

# Optional: IPFS Configuration
# PINATA_API_KEY="your_pinata_api_key"
# PINATA_API_SECRET="your_pinata_api_secret"
`;

  const envPath = path.join(__dirname, '..', '.env.integration');
  fs.writeFileSync(envPath, envContent);

  console.log(`✅ Created: ${envPath}\n`);

  // Create a summary file
  const summaryContent = `# Test Account Summary
Generated: ${new Date().toISOString()}

## KILT Account (Peregrine Testnet)
Address: ${kiltAccount.address}
Mnemonic: ${kiltMnemonic}
Faucet: https://faucet.peregrine.kilt.io/

## Moonbeam Account (Moonbase Alpha)  
Address: ${moonbeamWallet.address}
Private Key: ${moonbeamWallet.privateKey}
Mnemonic: ${moonbeamWallet.mnemonic.phrase}
Faucet: https://apps.moonbeam.network/moonbase-alpha/faucet/

## ⚠️  IMPORTANT SECURITY NOTES
- These are TEST ACCOUNTS ONLY
- NEVER send real funds to these addresses
- NEVER use these credentials on mainnet
- Rotate these credentials regularly
- Keep this file PRIVATE (it's in .gitignore)

## Next Steps

1. Request testnet tokens from faucets (links above)
2. Wait ~1 minute for tokens to arrive
3. Run tests:
   \`\`\`bash
   source .env.integration
   npm run test:integration:coverage
   \`\`\`

4. Verify you have tokens:
   - KILT: Check balance at https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fperegrine.kilt.io#/accounts
   - Moonbeam: Check balance at https://moonbase.moonscan.io/address/${moonbeamWallet.address}
`;

  const summaryPath = path.join(__dirname, '..', 'testnet-accounts-summary.txt');
  fs.writeFileSync(summaryPath, summaryContent);

  console.log(`✅ Created: ${summaryPath}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Next Steps');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1. Request tokens from faucets (see URLs above)');
  console.log('2. Wait ~1 minute for tokens to arrive');
  console.log('3. Run integration tests:\n');
  console.log('   source .env.integration');
  console.log('   npm run test:integration:coverage\n');

  console.log('📊 View account summary:');
  console.log(`   cat ${summaryPath}\n`);

  console.log('✅ Setup complete!\n');
}

generateAccounts().catch((error) => {
  console.error('❌ Error generating accounts:', error);
  process.exit(1);
});


