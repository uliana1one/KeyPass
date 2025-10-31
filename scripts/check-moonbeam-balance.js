#!/usr/bin/env node

import { ethers } from 'ethers';

async function checkBalance() {
  const privateKey = process.env.MOONBEAM_PRIVATE_KEY || '0x41c11df12f3ae8c7f88a6e06c5cd80db928ab2ca949e728d809de4b75630678d';
  const wallet = new ethers.Wallet(privateKey);
  const address = wallet.address;
  
  console.log('🔍 Checking Moonbeam balance...');
  console.log(`Address: ${address}\n`);

  try {
    // Connect to Moonbase Alpha
    const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');

    console.log('✅ Connected to Moonbase Alpha');
    
    // Get balance
    const balance = await provider.getBalance(address);
    const balanceDev = ethers.formatEther(balance);
    const balanceNumber = parseFloat(balanceDev);

    console.log('\n💰 Balance:');
    console.log(`   ${balanceNumber.toFixed(4)} DEV\n`);

    if (balanceNumber > 0) {
      console.log('✅ Tokens received! You can run the tests now.');
      console.log('\nRun: source .env.integration && npm run test:integration:coverage');
    } else {
      console.log('⏳ No tokens yet. Please:');
      console.log('   1. Visit: https://apps.moonbeam.network/moonbase-alpha/faucet/');
      console.log(`   2. Enter: ${address}`);
      console.log('   3. Complete CAPTCHA');
      console.log('   4. Click "Request tokens"');
      console.log('   5. Wait 1-2 minutes and check again\n');
    }

    process.exit(balanceNumber > 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBalance();


