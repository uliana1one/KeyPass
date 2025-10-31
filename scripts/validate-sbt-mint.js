#!/usr/bin/env node

/**
 * SBT Minting Validation Script
 * 
 * This script validates SBT minting on Moonbase Alpha and captures all transaction
 * details for documentation in ONCHAIN_VALIDATION.md.
 * 
 * Usage:
 *   node scripts/validate-sbt-mint.js
 * 
 * Prerequisites:
 *   - Deployed SBT contract on Moonbase Alpha
 *   - Test account with sufficient DEV tokens
 *   - Contract address in config/deployments.json
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MOONBASE_ALPHA_RPC = 'https://rpc.api.moonbase.moonbeam.network';

/**
 * Load SBT contract address from deployments
 */
function loadSBTContractAddress(): string {
  try {
    const deployments = JSON.parse(readFileSync('config/deployments.json', 'utf8'));
    const contractAddress = deployments.deployments['moonbase-alpha'].SBTSimple.address;
    if (!contractAddress) {
      throw new Error('No SBT contract address found in deployments.json');
    }
    return contractAddress;
  } catch (error) {
    console.error('❌ Failed to load SBT contract address:', error.message);
    process.exit(1);
  }
}

/**
 * Load test account
 */
function loadTestAccount() {
  try {
    const content = readFileSync('testnet-accounts-summary.txt', 'utf8');
    const privateKeyMatch = content.match(/Private Key: (0x[a-fA-F0-9]{64})/);
    if (!privateKeyMatch) {
      throw new Error('Could not find private key in testnet-accounts-summary.txt');
    }
    return privateKeyMatch[1];
  } catch (error) {
    console.error('❌ Failed to load test account:', error.message);
    process.exit(1);
  }
}

/**
 * Load SBT contract artifact
 */
function loadSBTContract() {
  try {
    const artifactPath = join(__dirname, '..', 'src', 'contracts', 'artifacts', 'SBTSimple.json');
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
    return artifact;
  } catch (error) {
    console.error('❌ Failed to load SBT contract artifact:', error.message);
    process.exit(1);
  }
}

/**
 * Mint SBT token
 */
async function mintSBT() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║  🪙 Moonbeam SBT Minting Validation Script                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Setup
    const contractAddress = loadSBTContractAddress();
    const privateKey = loadTestAccount();
    const artifact = loadSBTContract();

    console.log('📦 Loaded Configuration:');
    console.log(`   📍 Contract Address: ${contractAddress}`);
    console.log(`   👤 Test Account: ${ethers.Wallet.fromPhrase(privateKey.slice(2))?.address || 'Loading...'}`);
    console.log('');

    // Connect to network
    console.log('🌐 Connecting to Moonbase Alpha...');
    const provider = new ethers.JsonRpcProvider(MOONBASE_ALPHA_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const chainId = await provider.getChainId();
    const balance = await provider.getBalance(wallet.address);
    
    console.log(`✅ Connected to Moonbase Alpha (Chain ID: ${chainId})`);
    console.log(`   💰 Balance: ${ethers.formatEther(balance)} DEV`);
    console.log('');

    if (balance < ethers.parseEther('0.001')) {
      console.log('❌ Insufficient balance for minting!');
      console.log('💡 Get testnet tokens from: https://apps.moonbeam.network/moonbase-alpha/faucet/');
      return;
    }

    // Load contract
    const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
    console.log('📜 SBT Contract Loaded');
    console.log(`   📄 ABI: ${artifact.abi.length} functions/events`);
    console.log('');

    // Mint SBT
    console.log('⏳ Minting SBT token...');
    const tx = await contract.safeMint(wallet.address, 'https://example.com/metadata/1');
    console.log(`   🔗 Transaction Hash: ${tx.hash}`);
    console.log('   ⏳ Waiting for confirmation...\n');

    const receipt = await tx.wait();
    console.log('✅ SBT Minted Successfully!\n');
    console.log('📊 Transaction Details:');
    console.log(`   🔗 Transaction Hash: ${receipt.hash}`);
    console.log(`   📦 Block Number: ${receipt.blockNumber}`);
    console.log(`   🔖 Block Hash: ${receipt.blockHash}`);
    console.log(`   ⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    console.log('');

    // Get token ID from logs
    const mintEvent = receipt.logs.find((log: any) => {
      try {
        const parsedLog = contract.interface.parseLog(log);
        return parsedLog && parsedLog.name === 'Transfer';
      } catch {
        return false;
      }
    });

    if (mintEvent) {
      const parsedLog = contract.interface.parseLog(mintEvent);
      const tokenId = parsedLog.args.tokenId.toString();
      console.log('🪙 Token Information:');
      console.log(`   🆔 Token ID: ${tokenId}`);
      console.log(`   👤 Owner: ${wallet.address}`);
      console.log('');

      // Check if transfer is blocked
      console.log('🔒 Testing SBT Non-Transferability...');
      try {
        const transferTx = await contract.transferFrom(wallet.address, ethers.Wallet.createRandom().address, tokenId);
        console.log('   ❌ Transfer succeeded (unexpected!)');
        const transferReceipt = await transferTx.wait();
        console.log(`   📦 Transfer Block: ${transferReceipt.blockNumber}`);
      } catch (transferError: any) {
        if (transferError.message.includes('revert') || transferError.message.includes('Soulbound')) {
          console.log('   ✅ Transfer correctly blocked!');
          console.log(`   📝 Error: ${transferError.message.split('\n')[0]}`);
        } else {
          console.log('   ⚠️  Transfer failed with unexpected error');
          console.log(`   📝 Error: ${transferError.message}`);
        }
      }
      console.log('');
    }

    // Summary
    console.log('╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SBT MINT VALIDATION RESULTS                                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 Transaction Information:');
    console.log(`   📍 Contract: ${contractAddress}`);
    console.log(`   🔗 Transaction Hash: ${receipt.hash}`);
    console.log(`   📦 Block Number: ${receipt.blockNumber}`);
    console.log('');
    console.log('🔗 Block Explorer Links:');
    console.log(`   🌐 Moonscan: https://moonbase.moonscan.io/tx/${receipt.hash}`);
    console.log(`   📦 Contract: https://moonbase.moonscan.io/address/${contractAddress}`);
    console.log('');
    console.log('✅ Validation Complete!');
    console.log('');
    console.log('💡 Copy the transaction details above to ONCHAIN_VALIDATION.md');
    console.log('');

  } catch (error) {
    console.error('\n❌ Validation Failed!\n');
    console.error(error);
    process.exit(1);
  }
}

// Run validation
mintSBT();

