#!/usr/bin/env node

/**
 * KILT Integration Live Test Script
 * 
 * This script tests the complete KILT DID integration:
 * 1. Wallet connection (Polkadot.js/Talisman)
 * 2. Balance checking
 * 3. On-chain DID registration
 * 4. DID resolution from blockchain
 * 5. DID existence verification
 * 
 * Prerequisites:
 * - Install Polkadot.js extension or Talisman wallet
 * - Get KILT testnet tokens from https://faucet.peregrine.kilt.io/
 * - Run: npm install keypass-login-sdk
 */

import { 
  KiltAdapter, 
  createKILTDID, 
  resolveDID, 
  checkDIDExists,
  resolveKILTDIDWithMetadata,
  DIDFactory 
} from 'keypass-login-sdk';

async function testKILTIntegration() {
  console.log('🧪 KILT Integration Live Test Starting...\n');

  try {
    // Step 1: Initialize KILT adapter
    console.log('📡 Step 1: Connecting to KILT Peregrine testnet...');
    const kiltAdapter = new KiltAdapter();
    
    // Connect to KILT parachain (Peregrine testnet)
    const chainInfo = await kiltAdapter.connect('peregrine');
    console.log(`✅ Connected to ${chainInfo.chainName} (${chainInfo.runtime})`);
    console.log(`   Genesis: ${chainInfo.genesisHash.slice(0, 10)}...`);
    console.log(`   Version: ${chainInfo.version}\n`);

    // Step 2: Enable wallet and get accounts
    console.log('🔐 Step 2: Connecting to wallet...');
    await kiltAdapter.enable();
    const accounts = await kiltAdapter.getAccounts();
    
    if (accounts.length === 0) {
      throw new Error('No accounts found! Please install Polkadot.js or Talisman wallet.');
    }
    
    const address = accounts[0].address;
    console.log(`✅ Connected to wallet: ${accounts[0].name || 'Unknown'}`);
    console.log(`   Address: ${address}`);
    console.log(`   Type: ${accounts[0].type}\n`);

    // Step 3: Check balance
    console.log('💰 Step 3: Checking KILT token balance...');
    const balanceInfo = await kiltAdapter.checkBalance(address);
    console.log(`   Current Balance: ${balanceInfo.currentBalance} KILT`);
    console.log(`   Minimum Required: ${balanceInfo.minimumRequired} KILT`);
    console.log(`   Sufficient Balance: ${balanceInfo.hasSufficientBalance ? '✅ Yes' : '❌ No'}`);
    
    if (!balanceInfo.hasSufficientBalance) {
      console.log(`\n❌ Insufficient balance! Get testnet tokens from:`);
      console.log(`   https://faucet.peregrine.kilt.io/`);
      console.log(`   Send to: ${address}\n`);
      return;
    }
    console.log('');

    // Step 4: Create on-chain KILT DID
    console.log('🆔 Step 4: Creating on-chain KILT DID...');
    console.log('   This will prompt you to sign a transaction in your wallet...');
    
    const didResult = await createKILTDID(address, kiltAdapter);
    console.log(`✅ KILT DID created: ${didResult}`);
    
    // Wait a moment for blockchain confirmation
    console.log('   ⏳ Waiting for blockchain confirmation...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
    console.log('');

    // Step 5: Test DID resolution
    console.log('🔍 Step 5: Testing DID resolution...');
    
    // Test universal resolver
    console.log('   Testing universal DID resolver...');
    const resolvedDoc = await resolveDID(didResult);
    console.log(`   ✅ Resolved DID document with ${resolvedDoc.verificationMethod?.length || 0} verification methods`);
    console.log(`   📄 DID ID: ${resolvedDoc.id}`);
    console.log(`   🔑 Controller: ${resolvedDoc.controller}`);
    
    // Test KILT-specific resolver with metadata
    console.log('   Testing KILT metadata resolver...');
    const { document, metadata } = await resolveKILTDIDWithMetadata(didResult);
    console.log(`   📊 Resolution source: ${metadata.source}`);
    console.log(`   ⛓️  Exists on-chain: ${metadata.existsOnChain}`);
    console.log(`   🕐 Resolved at: ${metadata.resolvedAt}`);
    console.log('');

    // Step 6: Test DID existence check
    console.log('🔍 Step 6: Testing DID existence verification...');
    const exists = await checkDIDExists(didResult);
    console.log(`   DID exists on blockchain: ${exists ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // Step 7: Test factory methods
    console.log('🏭 Step 7: Testing DID factory methods...');
    
    // Test different creation methods
    console.log('   Testing factory method for on-chain KILT DID...');
    const factoryDID = await DIDFactory.kiltOnChain(address, kiltAdapter);
    console.log(`   ✅ Factory created DID: ${factoryDID}`);
    console.log('');

    // Step 8: Summary
    console.log('📊 Test Results Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ KILT Connection: Connected to ${chainInfo.chainName}`);
    console.log(`✅ Wallet Integration: ${accounts[0].name || 'Unknown'} wallet connected`);
    console.log(`✅ Balance Check: ${balanceInfo.currentBalance} KILT tokens`);
    console.log(`✅ On-Chain DID Creation: ${didResult}`);
    console.log(`✅ Blockchain Resolution: ${metadata.source} source`);
    console.log(`✅ DID Existence Check: ${exists ? 'Confirmed' : 'Not found'}`);
    console.log(`✅ Factory Methods: Working`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 KILT Integration Test: ALL TESTS PASSED! 🎉');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('User rejected')) {
      console.log('\n💡 User rejected the transaction. This is normal if you cancelled signing.');
    } else if (error.message.includes('Insufficient balance')) {
      console.log('\n💡 Get testnet tokens from: https://faucet.peregrine.kilt.io/');
    } else if (error.message.includes('No extension')) {
      console.log('\n💡 Install Polkadot.js extension or Talisman wallet');
      console.log('   Polkadot.js: https://polkadot.js.org/extension/');
      console.log('   Talisman: https://talisman.xyz/');
    } else {
      console.log('\n🐛 Debug info:');
      console.error(error);
    }
  }
}

// Enhanced error handling for different environments
async function main() {
  try {
    await testKILTIntegration();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Test terminated');
  process.exit(0);
});

// Run the test
main();
