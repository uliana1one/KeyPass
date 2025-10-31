#!/usr/bin/env node

/**
 * KILT Balance Checker
 * 
 * Check the balance of any KILT address without needing wallet connection
 */

import { KiltAdapter } from './dist/adapters/KiltAdapter.js';

async function checkBalance(address) {
  console.log('💰 KILT Balance Checker\n');
  
  try {
    console.log(`🔍 Checking balance for: ${address}`);
    console.log('📡 Connecting to KILT Peregrine testnet...\n');
    
    // Initialize KILT adapter and connect
    const kiltAdapter = new KiltAdapter();
    const chainInfo = await kiltAdapter.connect('peregrine');
    
    console.log(`✅ Connected to ${chainInfo.chainName}`);
    console.log(`   Network: ${chainInfo.runtime}`);
    console.log(`   Version: ${chainInfo.version}\n`);
    
    // Check balance (no wallet connection needed for read-only operations)
    console.log('💰 Querying balance...');
    const balanceInfo = await kiltAdapter.checkBalance(address);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 BALANCE INFORMATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Address: ${address}`);
    console.log(`Current Balance: ${balanceInfo.currentBalance} KILT`);
    console.log(`Minimum Required: ${balanceInfo.minimumRequired} KILT`);
    console.log(`Sufficient for DID: ${balanceInfo.hasSufficientBalance ? '✅ Yes' : '❌ No'}`);
    console.log(`Preserving Existential Deposit: ${balanceInfo.preservingExistentialDeposit ? '✅ Yes' : '⚠️ No'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Additional context
    if (balanceInfo.hasSufficientBalance) {
      console.log('\n✅ This address has enough KILT tokens to register a DID on-chain');
    } else {
      console.log('\n❌ This address needs more KILT tokens for DID registration');
      console.log('💡 Get testnet tokens from: https://faucet.peregrine.kilt.io/');
    }
    
    if (!balanceInfo.preservingExistentialDeposit) {
      console.log('⚠️  Warning: Balance is close to existential deposit minimum');
    }
    
    // Parse balance to show more details
    const balanceFloat = parseFloat(balanceInfo.currentBalance);
    if (balanceFloat > 0) {
      console.log(`\n📈 Balance Details:`);
      console.log(`   • In KILT: ${balanceFloat.toFixed(4)} KILT`);
      console.log(`   • In planck (smallest unit): ${(balanceFloat * 1e15).toFixed(0)} planck`);
      
      if (balanceFloat >= 0.1) {
        const possibleDIDs = Math.floor(balanceFloat / 0.001);
        console.log(`   • Estimated DIDs you can create: ~${possibleDIDs}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Failed to check balance:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('Invalid')) {
      console.log('\n💡 Make sure the address is a valid KILT SS58 address');
    } else if (error.message.includes('Network')) {
      console.log('\n💡 Network connection issue - try again in a moment');
    }
  }
}

// Get address from command line argument or use the provided one
const address = process.argv[2] || '4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN';

checkBalance(address);