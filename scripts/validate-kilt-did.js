#!/usr/bin/env node

/**
 * KILT DID Validation Script
 * 
 * This script validates KILT DID creation and resolution on-chain.
 * It creates a DID on KILT Peregrine testnet and captures all transaction details
 * for documentation in ONCHAIN_VALIDATION.md.
 * 
 * Usage:
 *   node scripts/validate-kilt-did.js
 * 
 * Prerequisites:
 *   - Test account with sufficient KILT tokens
 *   - Test account mnemonic in testnet-accounts-summary.txt
 *   - KILT Peregrine endpoint access
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { KeyringPair } from '@polkadot/keyring/types';
import { readFileSync } from 'fs';
import { 
  KILTDIDPalletService,
  KILTCreateDIDRequest 
} from '../src/did/services/KILTDIDPalletService.js';
import { KILTTransactionService } from '../src/did/services/KILTTransactionService.js';
import { 
  KILTVerificationMethodType,
  KILTKeyType,
  KILTServiceType
} from '../src/did/types/KILTTypes.js';

// Configuration
const KILT_PEREGRINE_ENDPOINT = 'wss://peregrine.kilt.io/parachain-public-ws';

/**
 * Load test account from testnet-accounts-summary.txt
 */
function loadTestAccount(): string {
  try {
    const content = readFileSync('testnet-accounts-summary.txt', 'utf8');
    const mnemonicMatch = content.match(/Mnemonic: ([a-z\s]+)/);
    if (!mnemonicMatch) {
      throw new Error('Could not find mnemonic in testnet-accounts-summary.txt');
    }
    return mnemonicMatch[1].trim();
  } catch (error) {
    console.error('❌ Failed to load test account:', error.message);
    process.exit(1);
  }
}

/**
 * Initialize connection to KILT parachain
 */
async function connectToKILT(): Promise<ApiPromise> {
  console.log('🔌 Connecting to KILT Peregrine testnet...');
  console.log(`   📡 Endpoint: ${KILT_PEREGRINE_ENDPOINT}\n`);

  const provider = new WsProvider(KILT_PEREGRINE_ENDPOINT);
  const api = await ApiPromise.create({ provider });

  await api.isReady;

  console.log('✅ Connected to KILT parachain');
  console.log(`   ⛓️  Chain: ${api.runtimeChain.toString()}`);
  console.log(`   📦 Current Block: ${(await api.rpc.chain.getHeader()).number.toNumber()}\n`);

  return api;
}

/**
 * Initialize test account
 */
async function initializeTestAccount(): Promise<KeyringPair> {
  console.log('🔑 Initializing test account...');
  
  await cryptoWaitReady();
  
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
  const mnemonic = loadTestAccount();
  const account = keyring.addFromMnemonic(mnemonic);
  
  console.log(`   👤 Account Address: ${account.address}\n`);
  
  return account;
}

/**
 * Create DID on-chain
 */
async function createKILTDID(
  api: ApiPromise,
  account: KeyringPair
): Promise<{ did: string; result: any }> {
  console.log('📝 Creating DID on KILT parachain...\n');

  try {
    const transactionService = new KILTTransactionService(api);
    const palletService = new KILTDIDPalletService(api, transactionService);

    const did = `did:kilt:${account.address}`;
    console.log(`🆔 DID to create: ${did}\n`);

    // Prepare DID creation request
    const createRequest: KILTCreateDIDRequest = {
      did,
      verificationMethods: [
        {
          id: `${did}#authentication`,
          type: KILTVerificationMethodType.SR25519_2020,
          controller: did,
          publicKeyMultibase: account.publicKey.toString(),
          keyType: KILTKeyType.SR25519
        }
      ],
      services: [
        {
          id: `${did}#kilt-service`,
          type: KILTServiceType.KILT_CREDENTIAL_REGISTRY,
          serviceEndpoint: 'https://example.com/credentials'
        }
      ],
      controller: account.address,
      metadata: {
        createdBy: 'KeyPass SDK',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };

    console.log('📋 DID Creation Request Prepared');
    console.log('⏳ Submitting transaction to blockchain...\n');

    // Calculate estimated fees
    const createExtrinsic = api.tx.did.create(
      createRequest.did,
      createRequest.verificationMethods || [],
      createRequest.services || [],
      createRequest.controller || account.address,
      createRequest.metadata || {}
    );

    const paymentInfo = await createExtrinsic.paymentInfo(account);
    console.log(`💰 Estimated Fee: ${paymentInfo.partialFee.toHuman()}\n`);

    // Submit transaction
    const result = await palletService.createDID(createRequest, account);

    console.log('✅ DID Created Successfully!\n');
    console.log('📊 Transaction Details:');
    console.log(`   🔗 Transaction Hash: ${result.transactionHash}`);
    console.log(`   📦 Block Number: ${result.blockNumber || 'Pending'}`);
    console.log(`   🔖 Block Hash: ${result.blockHash || 'Pending'}`);
    console.log(`   🎯 Success: ${result.success}`);
    console.log(`   📝 Events: ${result.events?.length || 0} event(s) emitted\n`);

    if (result.events && result.events.length > 0) {
      console.log('📜 Transaction Events:');
      result.events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.section}.${event.method}`);
      });
      console.log('');
    }

    return { did, result };

  } catch (error) {
    console.error('\n❌ DID Creation Failed!\n');
    throw error;
  }
}

/**
 * Resolve DID from blockchain
 */
async function resolveKILTDID(
  api: ApiPromise,
  did: string
): Promise<any> {
  console.log('🔍 Resolving DID from blockchain...\n');
  console.log(`🆔 DID: ${did}\n`);

  try {
    // Extract address from DID
    const address = did.replace('did:kilt:', '');
    
    // Query DID from chain
    const didQueryResult = await api.query.did.did(address);
    
    console.log('📊 Query Result:');
    if (didQueryResult.isEmpty) {
      console.log('   ⚠️  DID not found on-chain');
      return null;
    }
    
    const didDetails = didQueryResult.toHuman();
    console.log(JSON.stringify(didDetails, null, 2));
    console.log('');
    
    return didDetails;

  } catch (error) {
    console.error('\n❌ DID Resolution Failed!\n');
    console.error(error);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 KeyPass KILT DID Validation Script                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('');

  let api: ApiPromise | null = null;

  try {
    // Initialize connection and account
    api = await connectToKILT();
    const account = await initializeTestAccount();

    // Check account balance
    const balance = await api.query.system.account(account.address);
    console.log('💰 Account Balance:');
    console.log(`   Free: ${(balance as any).data.free.toHuman()}`);
    console.log(`   Reserved: ${(balance as any).data.reserved.toHuman()}\n`);

    // Create DID
    const { did, result } = await createKILTDID(api, account);

    // Wait for finalization
    console.log('⏳ Waiting for blockchain finalization...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Resolve DID
    const resolvedDoc = await resolveKILTDID(api, did);

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ KILT DID VALIDATION RESULTS                                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 DID Information:');
    console.log(`   🆔 DID: ${did}`);
    console.log(`   📝 Transaction Hash: ${result.transactionHash}`);
    console.log(`   📦 Block Number: ${result.blockNumber}`);
    console.log(`   🔗 Block Hash: ${result.blockHash}`);
    console.log('');
    console.log('🔗 Block Explorer Links:');
    console.log(`   🌐 Polkadot.js: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fperegrine.kilt.io#/explorer/query/${result.blockNumber}`);
    console.log(`   🔍 Peregrine Explorer: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fperegrine.kilt.io%2Fparachain-public-ws#/explorer/query/${result.blockNumber}`);
    console.log('');
    console.log('✅ Validation Complete!');
    console.log('');
    console.log('💡 Copy the transaction details above to ONCHAIN_VALIDATION.md');
    console.log('');

  } catch (error) {
    console.error('\n❌ Validation Failed!\n');
    console.error(error);
    process.exit(1);
  } finally {
    if (api) {
      await api.disconnect();
      console.log('👋 Disconnected from KILT network');
    }
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Validation interrupted by user');
  process.exit(0);
});

// Run validation
main();

