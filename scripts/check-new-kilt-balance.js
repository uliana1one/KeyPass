#!/usr/bin/env node

import { ApiPromise, WsProvider } from '@polkadot/api';

async function checkNewKiltBalance() {
  const address = '4siJtc4dYq2gPre8Xj6KJcSjVAdi1gmjctUzjf3AwrtNnhvy';
  
  console.log('🔍 Checking new KILT wallet balance...');
  console.log(`Address: ${address}\n`);

  try {
    // Connect to KILT Spiritnet
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
      console.log('✅ Tokens found! You can now run KILT tests.');
      console.log('🚀 Run: npm test -- --testPathPattern=kilt');
    } else {
      console.log('❌ Still no tokens. Try:');
      console.log('1. Discord: https://discord.gg/kilt');
      console.log('2. Telegram: Ask for testnet tokens');
      console.log('3. Forum: https://forum.kilt.io/');
    }

    await api.disconnect();
    process.exit(totalKilt > 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkNewKiltBalance();
