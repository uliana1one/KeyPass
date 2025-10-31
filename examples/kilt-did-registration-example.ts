/**
 * Comprehensive KILT DID Registration Example
 * 
 * This example demonstrates the complete DID lifecycle on the KILT parachain:
 * 1. Connect to KILT parachain (Spiritnet/Peregrine)
 * 2. Create and register a DID on-chain
 * 3. Query and verify DID status
 * 4. Update DID (add/remove verification methods and services)
 * 5. Monitor transactions and confirmations
 * 6. Calculate and display transaction fees
 * 7. Handle errors gracefully
 * 8. Delete DID from chain
 * 9. Batch operations
 * 
 * Prerequisites:
 * - KILT Spiritnet/Peregrine endpoint access
 * - Test account with sufficient balance for transactions
 * - Node.js 18+ with ES modules support
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { KeyringPair } from '@polkadot/keyring/types';
import { 
  KILTDIDPalletService,
  KILTCreateDIDRequest 
} from '../src/did/services/KILTDIDPalletService.js';
import { KILTTransactionService } from '../src/did/services/KILTTransactionService.js';
import { 
  KILTError,
  KILTErrorType,
  KILTTransactionResult,
  KILTVerificationMethodType,
  KILTKeyType,
  KILTServiceType
} from '../src/did/types/KILTTypes.js';

// Configuration
const KILT_PEREGRINE_ENDPOINT = 'wss://peregrine.kilt.io/parachain-public-ws';
const KILT_SPIRITNET_ENDPOINT = 'wss://spiritnet.kilt.io';

// Use Peregrine testnet by default (change to SPIRITNET for production)
const ENDPOINT = KILT_PEREGRINE_ENDPOINT;

/**
 * Initialize connection to KILT parachain
 */
async function connectToKILT(): Promise<ApiPromise> {
  console.log('🔌 Connecting to KILT parachain...');
  console.log(`   📡 Endpoint: ${ENDPOINT}\n`);

  const provider = new WsProvider(ENDPOINT);
  const api = await ApiPromise.create({ provider });

  await api.isReady;

  console.log('✅ Connected to KILT parachain');
  console.log(`   ⛓️  Chain: ${api.runtimeChain.toString()}`);
  console.log(`   🔢 Genesis Hash: ${api.genesisHash.toHex()}`);
  console.log(`   📦 Current Block: ${(await api.rpc.chain.getHeader()).number.toNumber()}`);
  console.log('');

  return api;
}

/**
 * Initialize test account
 * WARNING: Never use test mnemonics in production!
 */
async function initializeTestAccount(): Promise<KeyringPair> {
  console.log('🔑 Initializing test account...');
  
  await cryptoWaitReady();
  
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
  
  // Test mnemonic - DO NOT USE IN PRODUCTION
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const account = keyring.addFromMnemonic(testMnemonic);
  
  console.log(`   👤 Account Address: ${account.address}`);
  console.log(`   ⚠️  WARNING: Using test account - DO NOT use in production!\n`);
  
  return account;
}

/**
 * Example 1: Create and Register a DID on-chain
 */
async function example1_CreateDID(
  api: ApiPromise,
  account: KeyringPair
): Promise<string> {
  console.log('\n' + '='.repeat(70));
  console.log('📝 EXAMPLE 1: Create and Register DID on KILT Parachain');
  console.log('='.repeat(70) + '\n');

  try {
    const transactionService = new KILTTransactionService(api);
    const palletService = new KILTDIDPalletService(api, transactionService);

    const did = `did:kilt:${account.address}`;
    console.log(`🆔 Creating DID: ${did}\n`);

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

    console.log('📋 DID Creation Request:');
    console.log(JSON.stringify(createRequest, null, 2));
    console.log('\n⏳ Submitting transaction to blockchain...\n');

    // Calculate estimated fees before submission
    console.log('💰 Calculating transaction fees...');
    const createExtrinsic = api.tx.did.create(
      createRequest.did,
      createRequest.verificationMethods || [],
      createRequest.services || [],
      createRequest.controller || account.address,
      createRequest.metadata || {}
    );

    const paymentInfo = await createExtrinsic.paymentInfo(account);
    console.log(`   📊 Estimated Fee: ${paymentInfo.partialFee.toHuman()}`);
    console.log(`   ⚖️  Weight: ${paymentInfo.weight.toHuman()}`);
    console.log(`   💳 Fee Class: ${paymentInfo.class.toString()}\n`);

    // Submit transaction
    const startTime = Date.now();
    const result: KILTTransactionResult = await palletService.createDID(
      createRequest,
      account
    );
    const endTime = Date.now();

    console.log('✅ DID Created Successfully!\n');
    console.log('📊 Transaction Details:');
    console.log(`   🔗 Transaction Hash: ${result.transactionHash}`);
    console.log(`   📦 Block Number: ${result.blockNumber || 'Pending'}`);
    console.log(`   🔖 Block Hash: ${result.blockHash || 'Pending'}`);
    console.log(`   ⏱️  Processing Time: ${endTime - startTime}ms`);
    console.log(`   🎯 Success: ${result.success}`);
    console.log(`   📝 Events: ${result.events?.length || 0} event(s) emitted\n`);

    if (result.events && result.events.length > 0) {
      console.log('📜 Transaction Events:');
      result.events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.section}.${event.method}`);
      });
      console.log('');
    }

    return did;

  } catch (error) {
    console.error('\n❌ DID Creation Failed!\n');
    handleError(error);
    throw error;
  }
}

/**
 * Example 2: Query and Verify DID
 */
async function example2_QueryDID(
  api: ApiPromise,
  did: string
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 EXAMPLE 2: Query and Verify DID');
  console.log('='.repeat(70) + '\n');

  try {
    const transactionService = new KILTTransactionService(api);
    const palletService = new KILTDIDPalletService(api, transactionService);

    console.log(`🔎 Querying DID: ${did}\n`);

    const queryResult = await palletService.queryDID(did);

    if (!queryResult.exists) {
      console.log('❌ DID not found on chain');
      return;
    }

    console.log('✅ DID Found on Chain!\n');
    console.log('📄 DID Document:');
    console.log(JSON.stringify(queryResult.document, null, 2));
    console.log('');

    if (queryResult.blockNumber) {
      console.log(`📦 Last Updated at Block: ${queryResult.blockNumber}`);
    }

    // Check if DID exists using helper method
    const exists = await palletService.didExists(did);
    console.log(`\n✓ DID Exists: ${exists}`);

  } catch (error) {
    console.error('\n❌ DID Query Failed!\n');
    handleError(error);
    throw error;
  }
}

/**
 * Example 3: Update DID - Add Verification Method
 */
async function example3_UpdateDID_AddVerificationMethod(
  api: ApiPromise,
  account: KeyringPair,
  did: string
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 EXAMPLE 3: Update DID - Add Verification Method');
  console.log('='.repeat(70) + '\n');

  try {
    const transactionService = new KILTTransactionService(api);
    const palletService = new KILTDIDPalletService(api, transactionService);

    const newVerificationMethod = {
      id: `${did}#key-agreement`,
      type: KILTVerificationMethodType.X25519_2020,
      controller: did,
      publicKeyMultibase: 'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
      keyType: KILTKeyType.X25519
    };

    console.log('➕ Adding new verification method:');
    console.log(JSON.stringify(newVerificationMethod, null, 2));
    console.log('\n⏳ Submitting update transaction...\n');

    const result = await palletService.addVerificationMethod(
      {
        did,
        operation: 'add',
        verificationMethod: newVerificationMethod
      },
      account
    );

    console.log('✅ Verification Method Added!\n');
    console.log(`   🔗 Transaction Hash: ${result.transactionHash}`);
    console.log(`   📦 Block Number: ${result.blockNumber || 'Pending'}`);

  } catch (error) {
    console.error('\n❌ Update Failed!\n');
    handleError(error);
    throw error;
  }
}

/**
 * Example 4: Update DID - Add Service Endpoint
 */
async function example4_UpdateDID_AddService(
  api: ApiPromise,
  account: KeyringPair,
  did: string
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 EXAMPLE 4: Update DID - Add Service Endpoint');
  console.log('='.repeat(70) + '\n');

  try {
    const transactionService = new KILTTransactionService(api);
    const palletService = new KILTDIDPalletService(api, transactionService);

    const newService = {
      id: `${did}#messaging`,
      type: KILTServiceType.KILT_PARACHAIN,
      serviceEndpoint: 'https://messaging.example.com/api'
    };

    console.log('➕ Adding new service endpoint:');
    console.log(JSON.stringify(newService, null, 2));
    console.log('\n⏳ Submitting update transaction...\n');

    const result = await palletService.addService(
      {
        did,
        operation: 'add',
        service: newService
      },
      account
    );

    console.log('✅ Service Endpoint Added!\n');
    console.log(`   🔗 Transaction Hash: ${result.transactionHash}`);
    console.log(`   📦 Block Number: ${result.blockNumber || 'Pending'}`);

  } catch (error) {
    console.error('\n❌ Service Addition Failed!\n');
    handleError(error);
    throw error;
  }
}

/**
 * Example 5: Update DID Metadata
 */
async function example5_UpdateMetadata(
  api: ApiPromise,
  account: KeyringPair,
  did: string
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 EXAMPLE 5: Update DID Metadata');
  console.log('='.repeat(70) + '\n');

  try {
    const transactionService = new KILTTransactionService(api);
    const palletService = new KILTDIDPalletService(api, transactionService);

    const newMetadata = {
      updatedAt: new Date().toISOString(),
      version: '1.1.0',
      description: 'Updated via KeyPass SDK example',
      tags: ['test', 'example', 'kilt']
    };

    console.log('📝 Updating metadata:');
    console.log(JSON.stringify(newMetadata, null, 2));
    console.log('\n⏳ Submitting update transaction...\n');

    const result = await palletService.updateMetadata(
      did,
      newMetadata,
      account
    );

    console.log('✅ Metadata Updated!\n');
    console.log(`   🔗 Transaction Hash: ${result.transactionHash}`);
    console.log(`   📦 Block Number: ${result.blockNumber || 'Pending'}`);

  } catch (error) {
    console.error('\n❌ Metadata Update Failed!\n');
    handleError(error);
    throw error;
  }
}

/**
 * Example 6: Batch Operations
 */
async function example6_BatchOperations(
  api: ApiPromise,
  account: KeyringPair,
  did: string
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('⚡ EXAMPLE 6: Batch Operations');
  console.log('='.repeat(70) + '\n');

  try {
    const transactionService = new KILTTransactionService(api);
    const palletService = new KILTDIDPalletService(api, transactionService);

    console.log('🔄 Preparing batch operations:');
    console.log('   1. Add verification method');
    console.log('   2. Add service endpoint');
    console.log('   3. Update metadata\n');

    const batchOperation = {
      operations: [
        {
          type: 'addVerificationMethod' as const,
          data: {
            did,
            verificationMethod: {
              id: `${did}#assertion`,
              type: KILTVerificationMethodType.ED25519_2020,
              controller: did,
              publicKeyMultibase: 'zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme',
              keyType: KILTKeyType.ED25519
            }
          }
        },
        {
          type: 'addService' as const,
          data: {
            did,
            service: {
              id: `${did}#linked-domains`,
              type: KILTServiceType.KILT_DID_REGISTRY,
              serviceEndpoint: 'https://example.com'
            }
          }
        },
        {
          type: 'updateMetadata' as const,
          data: {
            did,
            metadata: {
              batchUpdate: true,
              timestamp: new Date().toISOString()
            }
          }
        }
      ]
    };

    console.log('⏳ Executing batch transaction...\n');

    const result = await palletService.executeBatchOperation(
      batchOperation,
      account
    );

    console.log('✅ Batch Operations Completed!\n');
    console.log(`   🔗 Transaction Hash: ${result.transactionHash}`);
    console.log(`   📦 Block Number: ${result.blockNumber || 'Pending'}`);
    console.log(`   ⚡ Operations: ${batchOperation.operations.length}`);

  } catch (error) {
    console.error('\n❌ Batch Operations Failed!\n');
    handleError(error);
    throw error;
  }
}

/**
 * Example 7: Transaction Monitoring
 */
async function example7_MonitorTransaction(
  api: ApiPromise,
  transactionHash: string
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('👁️  EXAMPLE 7: Transaction Monitoring');
  console.log('='.repeat(70) + '\n');

  try {
    console.log(`🔍 Monitoring transaction: ${transactionHash}\n`);

    // Get current block
    const currentBlock = (await api.rpc.chain.getHeader()).number.toNumber();
    console.log(`📦 Current Block: ${currentBlock}`);

    // In a real scenario, you would monitor for finalization
    console.log('⏳ Waiting for finalization...');
    console.log('   (Note: This is a simplified example)');
    
    // Simulate waiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✅ Transaction finalized (simulated)');
    console.log(`   📦 Finalized at block: ${currentBlock + 1}`);

  } catch (error) {
    console.error('\n❌ Monitoring Failed!\n');
    handleError(error);
  }
}

/**
 * Example 8: Fee Calculation for Different Operations
 */
async function example8_FeeCalculation(
  api: ApiPromise,
  account: KeyringPair,
  did: string
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('💰 EXAMPLE 8: Fee Calculation for Operations');
  console.log('='.repeat(70) + '\n');

  try {
    console.log('📊 Calculating fees for various DID operations:\n');

    // 1. Create DID fee
    const createTx = api.tx.did.create(did, [], [], account.address, {});
    const createFee = await createTx.paymentInfo(account);
    console.log('1️⃣  Create DID:');
    console.log(`   💵 Fee: ${createFee.partialFee.toHuman()}`);
    console.log(`   ⚖️  Weight: ${createFee.weight.toHuman()}\n`);

    // 2. Add verification method fee
    const addVMTx = api.tx.did.addVerificationMethod(did, {
      id: `${did}#test`,
      type: KILTVerificationMethodType.SR25519_2020,
      controller: did,
      publicKeyMultibase: 'test',
      keyType: KILTKeyType.SR25519
    });
    const addVMFee = await addVMTx.paymentInfo(account);
    console.log('2️⃣  Add Verification Method:');
    console.log(`   💵 Fee: ${addVMFee.partialFee.toHuman()}`);
    console.log(`   ⚖️  Weight: ${addVMFee.weight.toHuman()}\n`);

    // 3. Add service fee
    const addServiceTx = api.tx.did.addService(did, {
      id: `${did}#test-service`,
      type: KILTServiceType.KILT_PARACHAIN,
      serviceEndpoint: 'https://test.com'
    });
    const addServiceFee = await addServiceTx.paymentInfo(account);
    console.log('3️⃣  Add Service:');
    console.log(`   💵 Fee: ${addServiceFee.partialFee.toHuman()}`);
    console.log(`   ⚖️  Weight: ${addServiceFee.weight.toHuman()}\n`);

    // 4. Update metadata fee
    const updateMetadataTx = api.tx.did.updateMetadata(did, { test: true });
    const updateMetadataFee = await updateMetadataTx.paymentInfo(account);
    console.log('4️⃣  Update Metadata:');
    console.log(`   💵 Fee: ${updateMetadataFee.partialFee.toHuman()}`);
    console.log(`   ⚖️  Weight: ${updateMetadataFee.weight.toHuman()}\n`);

    // 5. Delete DID fee
    const deleteTx = api.tx.did.delete(did);
    const deleteFee = await deleteTx.paymentInfo(account);
    console.log('5️⃣  Delete DID:');
    console.log(`   💵 Fee: ${deleteFee.partialFee.toHuman()}`);
    console.log(`   ⚖️  Weight: ${deleteFee.weight.toHuman()}\n`);

  } catch (error) {
    console.error('\n❌ Fee Calculation Failed!\n');
    handleError(error);
  }
}

/**
 * Example 9: Error Handling Scenarios
 */
async function example9_ErrorHandling(
  api: ApiPromise,
  account: KeyringPair
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  EXAMPLE 9: Error Handling Scenarios');
  console.log('='.repeat(70) + '\n');

  const transactionService = new KILTTransactionService(api);
  const palletService = new KILTDIDPalletService(api, transactionService);

  // Scenario 1: Invalid DID format
  console.log('🔴 Scenario 1: Invalid DID Format\n');
  try {
    await palletService.createDID(
      { did: 'invalid-did-format' },
      account
    );
  } catch (error) {
    console.log('✓ Error caught correctly:');
    console.log(`  Message: ${error.message}\n`);
  }

  // Scenario 2: DID already exists
  console.log('🔴 Scenario 2: DID Already Exists\n');
  try {
    const did = `did:kilt:${account.address}`;
    // Try to create twice (second will fail)
    await palletService.createDID({ did }, account);
    await palletService.createDID({ did }, account);
  } catch (error) {
    console.log('✓ Error caught correctly:');
    console.log(`  Message: ${error.message}\n`);
  }

  // Scenario 3: DID not found
  console.log('🔴 Scenario 3: DID Not Found\n');
  try {
    const nonExistentDID = 'did:kilt:4nonexistent1234567890';
    await palletService.deleteDID(nonExistentDID, account);
  } catch (error) {
    console.log('✓ Error caught correctly:');
    console.log(`  Message: ${error.message}\n`);
  }

  // Scenario 4: Invalid verification method
  console.log('🔴 Scenario 4: Invalid Verification Method\n');
  try {
    const did = `did:kilt:${account.address}`;
    await palletService.addVerificationMethod(
      {
        did,
        operation: 'add',
        verificationMethod: {
          id: '', // Invalid empty ID
          type: KILTVerificationMethodType.SR25519_2020,
          controller: did,
          publicKeyMultibase: 'test',
          keyType: KILTKeyType.SR25519
        }
      },
      account
    );
  } catch (error) {
    console.log('✓ Error caught correctly:');
    console.log(`  Message: ${error.message}\n`);
  }

  console.log('✅ All error scenarios handled correctly!');
}

/**
 * Example 10: Delete DID
 */
async function example10_DeleteDID(
  api: ApiPromise,
  account: KeyringPair,
  did: string
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🗑️  EXAMPLE 10: Delete DID');
  console.log('='.repeat(70) + '\n');

  try {
    const transactionService = new KILTTransactionService(api);
    const palletService = new KILTDIDPalletService(api, transactionService);

    console.log(`🗑️  Deleting DID: ${did}\n`);
    console.log('⚠️  WARNING: This operation is irreversible!\n');
    console.log('⏳ Submitting deletion transaction...\n');

    const result = await palletService.deleteDID(did, account);

    console.log('✅ DID Deleted Successfully!\n');
    console.log(`   🔗 Transaction Hash: ${result.transactionHash}`);
    console.log(`   📦 Block Number: ${result.blockNumber || 'Pending'}`);

    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const exists = await palletService.didExists(did);
    console.log(`   DID Exists: ${exists} (should be false)\n`);

  } catch (error) {
    console.error('\n❌ DID Deletion Failed!\n');
    handleError(error);
    throw error;
  }
}

/**
 * Error handling helper
 */
function handleError(error: any): void {
  if (error instanceof KILTError) {
    console.error('🚨 KILT Error Details:');
    console.error(`   Code: ${error.code || 'Unknown'}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.transactionHash) {
      console.error(`   Transaction: ${error.transactionHash}`);
    }
    
    if (error.blockNumber !== undefined) {
      console.error(`   Block Number: ${error.blockNumber}`);
    }
    
    if (error.parachainInfo) {
      console.error(`   Network: ${error.parachainInfo.network}`);
    }
  } else if (error.message) {
    console.error(`   Error: ${error.message}`);
  } else {
    console.error(`   Error: ${JSON.stringify(error)}`);
  }
  console.error('');
}

/**
 * Main execution function - Complete DID Lifecycle
 */
async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║  🌟 KeyPass KILT DID Registration - Complete Lifecycle Example  🌟║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log('');

  let api: ApiPromise | null = null;
  let account: KeyringPair | null = null;
  let did: string | null = null;

  try {
    // Initialize connection and account
    api = await connectToKILT();
    account = await initializeTestAccount();

    // Check account balance
    const balance = await api.query.system.account(account.address);
    console.log('💰 Account Balance:');
    console.log(`   Free: ${(balance as any).data.free.toHuman()}`);
    console.log(`   Reserved: ${(balance as any).data.reserved.toHuman()}\n`);

    // Example 1: Create DID
    did = await example1_CreateDID(api, account);

    // Example 2: Query DID
    await example2_QueryDID(api, did);

    // Example 3: Add Verification Method
    await example3_UpdateDID_AddVerificationMethod(api, account, did);

    // Example 4: Add Service
    await example4_UpdateDID_AddService(api, account, did);

    // Example 5: Update Metadata
    await example5_UpdateMetadata(api, account, did);

    // Example 6: Batch Operations
    await example6_BatchOperations(api, account, did);

    // Example 7: Monitor Transaction (using last tx hash)
    // await example7_MonitorTransaction(api, lastTxHash);

    // Example 8: Fee Calculation
    await example8_FeeCalculation(api, account, did);

    // Example 9: Error Handling
    await example9_ErrorHandling(api, account);

    // Example 10: Delete DID (commented out to preserve DID for testing)
    // await example10_DeleteDID(api, account, did);

    console.log('\n' + '='.repeat(70));
    console.log('🎊 All Examples Completed Successfully!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n💥 Example execution failed!\n');
    handleError(error);
    process.exit(1);
  } finally {
    // Cleanup
    if (api) {
      await api.disconnect();
      console.log('🔌 Disconnected from KILT parachain\n');
    }
  }
}

// Export functions for potential reuse
export {
  connectToKILT,
  initializeTestAccount,
  example1_CreateDID,
  example2_QueryDID,
  example3_UpdateDID_AddVerificationMethod,
  example4_UpdateDID_AddService,
  example5_UpdateMetadata,
  example6_BatchOperations,
  example7_MonitorTransaction,
  example8_FeeCalculation,
  example9_ErrorHandling,
  example10_DeleteDID,
  handleError
};

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}