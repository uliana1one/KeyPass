#!/usr/bin/env node

/**
 * Test script to verify real blockchain integration
 * Run with: node test-integration.js
 */

const { ethers } = require('ethers');

// Test configuration
const MOONBASE_RPC_URL = 'https://rpc.api.moonbase.moonbeam.network';
const TEST_ADDRESS = '0x277D2d189e0caAaa60910b9Dec3f77c0d6Dcdb6d'; // Your test address

async function testMoonbeamConnection() {
  console.log('🧪 Testing Moonbeam Integration...\n');
  
  try {
    // Test 1: Basic RPC Connection
    console.log('1️⃣ Testing RPC connection...');
    const provider = new ethers.JsonRpcProvider(MOONBASE_RPC_URL);
    const network = await provider.getNetwork();
    console.log(`✅ Connected to ${network.name} (Chain ID: ${network.chainId})`);
    
    // Test 2: Get latest block
    console.log('\n2️⃣ Testing block retrieval...');
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Latest block: ${blockNumber}`);
    
    // Test 3: Get balance
    console.log('\n3️⃣ Testing balance check...');
    const balance = await provider.getBalance(TEST_ADDRESS);
    const balanceInDev = ethers.formatEther(balance);
    console.log(`✅ Balance for ${TEST_ADDRESS}: ${balanceInDev} DEV`);
    
    // Test 4: Get gas price
    console.log('\n4️⃣ Testing gas price...');
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;
    console.log(`✅ Gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    
    console.log('\n🎉 All Moonbeam integration tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up your .env file with:');
    console.log('   REACT_APP_MOONBEAM_RPC_URL=https://rpc.api.moonbase.moonbeam.network');
    console.log('   REACT_APP_SBT_CONTRACT_ADDRESS=0xYourContractAddress');
    console.log('   REACT_APP_PINATA_API_KEY=your-pinata-key (optional)');
    console.log('2. Run: npm start');
    console.log('3. Connect your MetaMask to Moonbase Alpha');
    console.log('4. Try the Complete Flow Demo!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify the RPC URL is correct');
    console.log('3. Make sure you have DEV tokens for testing');
    process.exit(1);
  }
}

// Run the test
testMoonbeamConnection();
