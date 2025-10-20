#!/usr/bin/env node

import { ApiPromise, WsProvider } from '@polkadot/api';

async function checkBalance() {
  const address = '4q1LY1GB7VoN6aSvNKagRYTrZCi9oytxwUsjN3JM6yKabR6p';
  
  console.log('🔍 Checking KILT balance...');
  console.log(`Address: ${address}\n`);

  try {
    // Connect to KILT Peregrine testnet
    const provider = new WsProvider('wss://peregrine.kilt.io/parachain-public-ws');
    const api = await ApiPromise.create({ provider });

    console.log('✅ Connected to KILT Peregrine testnet');
    
    // Get account info
    const { data: balance } = await api.query.system.account(address);
    
    // Convert from smallest unit to KILT
    const free = balance.free.toBigInt();
    const reserved = balance.reserved.toBigInt();
    const frozen = balance.frozen ? balance.frozen.toBigInt() : 0n;
    
    const freeKilt = Number(free) / 1e15; // KILT has 15 decimals
    const reservedKilt = Number(reserved) / 1e15;
    const frozenKilt = Number(frozen) / 1e15;
    const totalKilt = Number(free + reserved) / 1e15;

    console.log('\n💰 Balance:');
    console.log(`   Free:     ${freeKilt.toFixed(4)} KILT`);
    console.log(`   Reserved: ${reservedKilt.toFixed(4)} KILT`);
    console.log(`   Frozen:   ${frozenKilt.toFixed(4)} KILT`);
    console.log(`   Total:    ${totalKilt.toFixed(4)} KILT\n`);

    if (totalKilt > 0) {
      console.log('✅ Tokens received! You can run the tests now.');
      console.log('\nRun: source .env.integration && npm run test:integration:coverage');
    } else {
      console.log('⏳ No tokens yet. Please:');
      console.log('   1. Visit: https://faucet.peregrine.kilt.io/');
      console.log(`   2. Enter: ${address}`);
      console.log('   3. Click "Request tokens"');
      console.log('   4. Wait 1-2 minutes and check again\n');
    }

    await api.disconnect();
    process.exit(totalKilt > 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBalance();


