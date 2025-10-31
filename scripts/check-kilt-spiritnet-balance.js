#!/usr/bin/env node

import { ApiPromise, WsProvider } from '@polkadot/api';

async function checkSpiritnetBalance() {
  const address = '4rYsZriJdnxToKXraGajbzL93st2LFq2BqcRZPuuw92tEUty';
  
  console.log('🔍 Checking KILT Spiritnet balance...');
  console.log(`Address: ${address}\n`);

  try {
    // Connect to KILT Spiritnet (mainnet)
    const provider = new WsProvider('wss://spiritnet.kilt.io');
    const api = await ApiPromise.create({ provider });

    console.log('✅ Connected to KILT Spiritnet');
    
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
      console.log('✅ Tokens found! You can use this address for real blockchain integration.');
    } else {
      console.log('❌ No tokens on Spiritnet either.');
    }

    await api.disconnect();
    process.exit(totalKilt > 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSpiritnetBalance();
