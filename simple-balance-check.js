#!/usr/bin/env node

/**
 * Simple KILT Balance Checker
 * 
 * Direct balance check using Polkadot API without TypeScript compilation
 */

import { ApiPromise, WsProvider } from '@polkadot/api';

async function checkKILTBalance(address) {
  console.log('💰 Simple KILT Balance Checker\n');
  
  let api = null;
  
  try {
    console.log(`🔍 Checking balance for: ${address}`);
    console.log('📡 Connecting to KILT Peregrine testnet...\n');
    
    // Connect directly to KILT Peregrine
    const wsProvider = new WsProvider('wss://peregrine.kilt.io');
    api = await ApiPromise.create({ provider: wsProvider });
    
    // Wait for connection
    await api.isReady;
    
    const chainInfo = await api.rpc.system.chain();
    const chainVersion = await api.rpc.system.version();
    
    console.log(`✅ Connected to ${chainInfo.toString()}`);
    console.log(`   Version: ${chainVersion.toString()}\n`);
    
    // Query account balance
    console.log('💰 Querying balance...');
    const accountInfo = await api.query.system.account(address);
    
    // Extract balance information
    const accountData = accountInfo.data || accountInfo;
    const freeBalance = accountData.free?.toBigInt() || BigInt(0);
    const reservedBalance = accountData.reserved?.toBigInt() || BigInt(0);
    const frozenBalance = accountData.frozen?.toBigInt() || BigInt(0);
    
    // Convert from planck to KILT (1 KILT = 10^15 planck)
    const KILT_DECIMALS = BigInt(10) ** BigInt(15);
    const freeKILT = Number(freeBalance) / Number(KILT_DECIMALS);
    const reservedKILT = Number(reservedBalance) / Number(KILT_DECIMALS);
    const frozenKILT = Number(frozenBalance) / Number(KILT_DECIMALS);
    const totalKILT = freeKILT + reservedKILT;
    
    // KILT requirements
    const existentialDeposit = 0.0001; // 0.0001 KILT
    const didRegistrationFee = 0.001; // ~0.001 KILT for DID registration
    const hasSufficientBalance = freeKILT >= didRegistrationFee;
    const preservingExistentialDeposit = (freeKILT - didRegistrationFee) >= existentialDeposit;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 KILT BALANCE INFORMATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Address: ${address}`);
    console.log(`Free Balance: ${freeKILT.toFixed(6)} KILT`);
    console.log(`Reserved Balance: ${reservedKILT.toFixed(6)} KILT`);
    console.log(`Frozen Balance: ${frozenKILT.toFixed(6)} KILT`);
    console.log(`Total Balance: ${totalKILT.toFixed(6)} KILT`);
    console.log('');
    
    console.log('🎯 DID REGISTRATION STATUS:');
    console.log(`Required for DID: ${didRegistrationFee} KILT`);
    console.log(`Sufficient Balance: ${hasSufficientBalance ? '✅ Yes' : '❌ No'}`);
    console.log(`Preserves Existential Deposit: ${preservingExistentialDeposit ? '✅ Yes' : '⚠️ No'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Additional insights
    if (freeKILT === 0) {
      console.log('\n❌ No KILT tokens found!');
      console.log('💡 Get testnet tokens from: https://faucet.peregrine.kilt.io/');
    } else if (hasSufficientBalance) {
      console.log('\n✅ This address has enough KILT tokens to register a DID on-chain!');
      const possibleDIDs = Math.floor(freeKILT / didRegistrationFee);
      console.log(`📈 Estimated DIDs you can create: ~${possibleDIDs}`);
    } else {
      console.log('\n❌ Insufficient balance for DID registration');
      const needed = (didRegistrationFee - freeKILT).toFixed(6);
      console.log(`💡 Need ${needed} more KILT tokens`);
      console.log('💡 Get testnet tokens from: https://faucet.peregrine.kilt.io/');
    }
    
    if (!preservingExistentialDeposit && hasSufficientBalance) {
      console.log('⚠️ Warning: DID registration would consume existential deposit');
      console.log('💡 Consider getting more tokens to maintain account');
    }
    
    // Raw data for debugging
    console.log('\n🔧 Raw Balance Data:');
    console.log(`Free (planck): ${freeBalance.toString()}`);
    console.log(`Reserved (planck): ${reservedBalance.toString()}`);
    console.log(`Frozen (planck): ${frozenBalance.toString()}`);
    
  } catch (error) {
    console.error('\n❌ Failed to check balance:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('Invalid')) {
      console.log('\n💡 Make sure the address is a valid KILT SS58 address');
      console.log('💡 KILT addresses typically start with "4" and are 47-48 characters long');
    } else if (error.message.includes('connect')) {
      console.log('\n💡 Network connection issue - check internet and try again');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Connection timeout - KILT network may be slow, try again');
    }
    
    console.log('\n🐛 Full error for debugging:');
    console.error(error);
  } finally {
    if (api) {
      try {
        await api.disconnect();
        console.log('\n👋 Disconnected from KILT network');
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }
}

// Get address from command line argument
const address = process.argv[2];

if (!address) {
  console.log('❌ Please provide a KILT address');
  console.log('Usage: node simple-balance-check.js <KILT_ADDRESS>');
  console.log('Example: node simple-balance-check.js 4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN');
  process.exit(1);
}

// Validate address format (basic check)
if (!address.match(/^4[0-9A-HJ-NP-Za-km-z]{46,47}$/)) {
  console.log('⚠️ Warning: Address format looks unusual for KILT');
  console.log('KILT addresses typically start with "4" and are 47-48 characters long');
  console.log('Proceeding anyway...\n');
}

checkKILTBalance(address);
