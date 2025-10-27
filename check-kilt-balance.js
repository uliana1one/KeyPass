#!/usr/bin/env node

import { ApiPromise, WsProvider } from '@polkadot/api';

async function checkBalance() {
  const address = '4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN';
  
  console.log('🔍 Checking KILT Peregrine balance...');
  console.log(`Address: ${address}\n`);

  try {
    // Connect to KILT Peregrine testnet
    const provider = new WsProvider('wss://peregrine.kilt.io/parachain-public-ws');
    const api = await ApiPromise.create({ provider });

    console.log('✅ Connected to KILT Peregrine testnet');
    
    // Get account info
    const accountInfo = await api.query.system.account(address);
    
    // Convert from smallest unit to PILT (Peregrine KILT)
    const free = accountInfo.data.free.toBigInt();
    const reserved = accountInfo.data.reserved.toBigInt();
    const miscFrozen = accountInfo.data.frozen?.toBigInt() || 0n;
    
    const freeKilt = Number(free) / 1e15; // KILT has 15 decimals
    const reservedKilt = Number(reserved) / 1e15;
    const frozenKilt = Number(miscFrozen) / 1e15;
    const totalKilt = Number(free + reserved) / 1e15;

    console.log('\n💰 Balance:');
    console.log(`   Free:     ${freeKilt.toFixed(4)} PILT`);
    console.log(`   Reserved: ${reservedKilt.toFixed(4)} PILT`);
    console.log(`   Frozen:   ${frozenKilt.toFixed(4)} PILT`);
    console.log(`   Total:    ${totalKilt.toFixed(4)} PILT\n`);

    if (totalKilt > 0) {
      console.log('✅ Tokens received! You can now use this account.');
      console.log('\n💡 Next steps:');
      console.log('   1. Update your .env with the mnemonic');
      console.log('   2. Test KILT DID operations in the boilerplate');
    } else {
      console.log('⏳ No tokens yet. Please:');
      console.log('   1. Visit: https://faucet.peregrine.kilt.io/');
      console.log(`   2. Enter: ${address}`);
      console.log('   3. Click "Request tokens"');
      console.log('   4. Wait 1-2 minutes and check again\n');
    }

    await api.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkBalance();

