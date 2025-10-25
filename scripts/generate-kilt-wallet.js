#!/usr/bin/env node

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function generateKiltWallet() {
  console.log('🔑 Generating new KILT wallet...\n');
  
  await cryptoWaitReady();
  
  // Create keyring with KILT SS58 format (38)
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
  
  // Generate new account
  const account = keyring.addFromUri('//Alice', { name: 'KILT Test Account' });
  
  console.log('✅ New KILT wallet generated:');
  console.log(`📍 Address: ${account.address}`);
  console.log(`🔐 Public Key: ${account.publicKey}`);
  console.log(`📝 Name: ${account.meta.name}`);
  console.log(`🏷️  SS58 Format: 38 (KILT)`);
  
  console.log('\n🚰 Now try the faucets with this new address:');
  console.log(`1. Spiritnet: https://faucet.kilt.io/`);
  console.log(`2. Peregrine: https://faucet.peregrine.kilt.io/`);
  console.log(`3. Address: ${account.address}`);
  
  console.log('\n💡 Alternative: Try Discord/Telegram communities:');
  console.log('- KILT Discord: Ask in #testnet channel');
  console.log('- KILT Telegram: Ask for testnet tokens');
  
  return account.address;
}

generateKiltWallet().catch(console.error);
