#!/usr/bin/env node

import { ApiPromise, WsProvider } from '@polkadot/api';

async function checkSpiritnet() {
  console.log('🔗 Checking KILT Spiritnet connection...');
  
  try {
    const provider = new WsProvider('wss://spiritnet.kilt.io');
    const api = await ApiPromise.create({ provider });
    
    console.log('✅ Connected to KILT Spiritnet');
    
    const chain = await api.rpc.system.chain();
    const version = await api.rpc.system.version();
    
    console.log(`📡 Chain: ${chain}`);
    console.log(`🔧 Version: ${version}`);
    
    await api.disconnect();
    
  } catch (error) {
    console.error('❌ Spiritnet connection failed:', error.message);
  }
}

checkSpiritnet();
