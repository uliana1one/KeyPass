/**
 * Connect to KILT Peregrine Testnet
 * 
 * This script shows how to connect to wss://peregrine.kilt.io
 * and check your account balance.
 */

import { ApiPromise, WsProvider } from '@polkadot/api';

async function connectToKiltPeregrine() {
  console.log('🔗 Connecting to KILT Peregrine...');
  
  try {
    // Connect to KILT Peregrine testnet
    const provider = new WsProvider('wss://peregrine.kilt.io');
    const api = await ApiPromise.create({ provider });
    
    console.log('✅ Connected to KILT Peregrine testnet');
    
    // Get chain info
    const chain = await api.rpc.system.chain();
    const version = await api.rpc.system.version();
    
    console.log(`📡 Chain: ${chain}`);
    console.log(`🔧 Version: ${version}`);
    
    // Get latest block
    const blockHash = await api.rpc.chain.getBlockHash();
    const block = await api.rpc.chain.getBlock(blockHash);
    
    console.log(`📦 Latest block: ${blockHash}`);
    console.log(`🔢 Block number: ${block.block.header.number}`);
    
    // Check your account balance
    const address = '4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN';
    const { data: balance } = await api.query.system.account(address);
    
    const freePilt = Number(balance.free.toBigInt()) / 1e15;
    console.log(`💰 Your balance: ${freePilt.toFixed(4)} PILT`);
    
    if (freePilt === 0) {
      console.log('\n💡 To get PILT tokens:');
      console.log('1. Visit: https://polkadot.js.org/apps/');
      console.log('2. Connect to: wss://peregrine.kilt.io');
      console.log('3. Go to Accounts → Faucet');
      console.log(`4. Enter: ${address}`);
    }
    
    await api.disconnect();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

// Run the connection
connectToKiltPeregrine();
