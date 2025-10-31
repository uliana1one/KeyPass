#!/usr/bin/env node

/**
 * Quick KILT Integration Test
 * 
 * Minimal test script that verifies the KILT integration works.
 * Run with: node quick-kilt-test.js
 */

import { 
  KiltAdapter, 
  createKILTDID, 
  resolveDID, 
  checkDIDExists 
} from 'keypass-login-sdk';

async function quickTest() {
  console.log('🧪 Quick KILT Test\n');

  try {
    // 1. Connect
    console.log('1️⃣ Connecting to KILT...');
    const kiltAdapter = new KiltAdapter();
    await kiltAdapter.connect('peregrine');
    console.log('✅ Connected to KILT Peregrine\n');

    // 2. Wallet
    console.log('2️⃣ Connecting wallet...');
    await kiltAdapter.enable();
    const accounts = await kiltAdapter.getAccounts();
    const address = accounts[0].address;
    console.log(`✅ Wallet connected: ${address.slice(0, 10)}...\n`);

    // 3. Balance
    console.log('3️⃣ Checking balance...');
    const balance = await kiltAdapter.checkBalance(address);
    console.log(`✅ Balance: ${balance.currentBalance} KILT`);
    
    if (!balance.hasSufficientBalance) {
      console.log(`❌ Insufficient balance! Get tokens from: https://faucet.peregrine.kilt.io/`);
      return;
    }
    console.log('');

    // 4. Create DID
    console.log('4️⃣ Creating on-chain DID (will prompt for signature)...');
    const did = await createKILTDID(address, kiltAdapter);
    console.log(`✅ DID created: ${did}\n`);

    // 5. Wait and resolve
    console.log('5️⃣ Resolving DID from blockchain...');
    await new Promise(r => setTimeout(r, 8000)); // Wait for confirmation
    const didDoc = await resolveDID(did);
    console.log(`✅ DID resolved with ${didDoc.verificationMethod?.length || 0} keys\n`);

    // 6. Verify existence
    console.log('6️⃣ Verifying DID exists...');
    const exists = await checkDIDExists(did);
    console.log(`✅ DID exists on blockchain: ${exists}\n`);

    console.log('🎉 ALL TESTS PASSED! KILT integration is working! 🎉');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    
    if (error.message.includes('User rejected')) {
      console.log('💡 You cancelled the transaction - try again');
    } else if (error.message.includes('extension')) {
      console.log('💡 Install Polkadot.js extension or Talisman wallet');
    } else if (error.message.includes('balance')) {
      console.log('💡 Get tokens from: https://faucet.peregrine.kilt.io/');
    }
  }
}

quickTest();
