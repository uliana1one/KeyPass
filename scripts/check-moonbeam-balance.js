#!/usr/bin/env node

import { ethers } from 'ethers';

async function checkBalance() {
  const address = '0x2bd536440C77CFB8B81fA931aFF11Bb095AD82C8';
  
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


