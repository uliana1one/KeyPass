/**
 * Example demonstrating KILT DID registration with blockchain integration
 * 
 * This example shows how to:
 * 1. Create a KILT DID registration request
 * 2. Register the DID on the KILT parachain
 * 3. Handle registration responses and errors
 * 4. Verify the registered DID
 */

import { KILTDIDProvider } from '../src/did/KILTDIDProvider.js';
import { KiltAdapter } from '../src/adapters/KiltAdapter.js';
import { 
  KILTCreateDIDRequest,
  KILTDIDStatus 
} from '../src/did/types/KILTTypes.js';

async function exampleKILTDIDRegistration() {
  console.log('🚀 KILT DID Registration Example\n');

  try {
    // Initialize KILT adapter and DID provider
    const kiltAdapter = new KiltAdapter();
    const didProvider = new KILTDIDProvider(kiltAdapter);

    // Example KILT address (in production, this would come from user's wallet)
    const kiltAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

    console.log(`📋 Preparing registration request for address: ${kiltAddress}`);

    // Define DID creation request
    const createRequest: KILTCreateDIDRequest = {
      accountAddress: kiltAddress,
      controller: kiltAddress, // DID is controlled by the account
      
      // Optional: Add verification methods (these will be auto-generated if not provided)
      verificationMethods: [],
      
      // Optional: Add services
      services: [
        {
          id: `${kiltAddress}#kilt-service`,
          type: 'KiltParachainService',
          serviceEndpoint: 'wss://spiritnet.kilt.io',
        },
      ],
      
      // Additional metadata
      metadata: {
        createdBy: 'KeyPass SDK Example',
        version: '1.0',
        environment: 'development',
      },
      
      // Optional: Different fee payer (defaults to accountAddress)
      feePayer: kiltAddress,
    };

    console.log('🔧 Request details:', JSON.stringify(createRequest, null, 2));
    console.log('\n⏳ Registering DID on KILT parachain...\n');

    // Register the DID on the blockchain
    const registrationResult = await didProvider.registerDIDOnChain(createRequest);

    console.log('✅ KILT DID Registration Successful!\n');
    console.log('📊 Registration Results:');
    console.log(`   🆔 DID: ${registrationResult.did}`);
    console.log(`   📈 Status: ${registrationResult.status}`);
    console.log(`   🔗 Transaction Hash: ${registrationResult.transactionResult.transactionHash}`);
    console.log(`   📦 Block Number: ${registrationResult.transactionResult.blockNumber}`);
    console.log(`   💰 Fee Paid: ${registrationResult.transactionResult.fee.amount} ${registrationResult.transactionResult.fee.currency}`);
    console.log(`   ⏰ Timestamp: ${registrationResult.transactionResult.timestamp}`);
    
    console.log('\n📄 DID Document:');
    console.log(JSON.stringify(registrationResult.didDocument, null, 2));

    console.log('\n🔍 Verifying DID onchain...');
    
    // Verify the DID is active on chain
    const isVerified = await didProvider.verifyOnchain(registrationResult.did);
    
    if (isVerified) {
      console.log('✅ DID verification successful - DID is active on KILT parachain');
    } else {
      console.log('❌ DID verification failed - Please check parachain connection');
    }

    console.log('\n🎯 DID Registration Complete!\n');

    // Example of fetching key agreement keys
    console.log('🔑 Generating additional keys...');
    const authKey = await didProvider.generateKeyAgreementKey();
    const agreementKey = await didProvider.generateKeyAgreementKey();
    
    console.log(`   🔐 Authentication Key: ${authKey}`);
    console.log(`   🤝 Key Agreement Key: ${agreementKey}`);

    return registrationResult;

  } catch (error) {
    console.error('\n❌ Registration Error:');
    
    if (error.name === 'KILTError') {
      console.error(`   🚨 Error Code: ${error.code}`);
      console.error(`   📝 Message: ${error.message}`);
      
      if (error.transactionHash) {
        console.error(`   🔗 Transaction Hash: ${error.transactionHash}`);
      }
      
      if (error.blockNumber !== undefined) {
        console.error(`   📦 Block Number: ${error.blockNumber}`);
      }
      
      if (error.parachainInfo) {
        console.error(`   🌐 Network: ${error.parachainInfo.network}`);
        console.error(`   ⛓️ Chain: ${error.parachainInfo.chainName}`);
      }
    } else {
      console.error(`   📝 Error: ${error.message}`);
      console.error(`   🔍 Stack: ${error.stack}`);
    }

    throw error;
  }
}

// Example transaction submission workflow
async function exampleTransactionSubmission() {
  console.log('\n🔄 Transaction Submission Example\n');

  try {
    const didProvider = new KILTDIDProvider();
    const mockExtrinsics = [
      { method: 'system.remark', args: ['test'] },
    ] as any;

    console.log('📤 Submitting transaction...');
    const submissionResult = await didProvider.submitTransaction(mockExtrinsics, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

    console.log('✅ Transaction Submitted:');
    console.log(`   🔗 Hash: ${submissionResult.transactionHash}`);
    console.log(`   📦 Block: ${submissionResult.blockNumber}`);
    console.log(`   ⏰ Timestamp: ${submissionResult.timestamp}`);

    console.log('\n⏳ Waiting for confirmation...');
    const confirmation = await didProvider.waitForConfirmation(submissionResult.transactionHash);
    
    console.log('✅ Confirmation Received:');
    console.log(`   📦 Final Block: ${confirmation.blockNumber}`);
    console.log(`   🔗 Block Hash: ${confirmation.blockHash}`);

  } catch (error) {
    console.error('❌ Transaction Error:', error.message);
    throw error;
  }
}

// Example key generation workflow
async function exampleKeyGeneration() {
  console.log('\n🔑 Key Generation Example\n');

  try {
    const didProvider = new KILTDIDProvider();

    console.log('🎲 Generating secure keys...');
    const keys = await Promise.all([
      didProvider.generateKeyAgreementKey(),
      didProvider.generateKeyAgreementKey(),
      didProvider.generateKeyAgreementKey(),
    ]);

    console.log('✅ Generated Keys:');
    keys.forEach((key, index) => {
      console.log(`   🔐 Key ${index + 1}: ${key}`);
    });

    // Verify all keys are different and well-formed
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size === keys.length) {
      console.log('✅ All keys are unique');
    } else {
      console.log('❌ Some keys are duplicates');
    }

  } catch (error) {
    console.error('❌ Key Generation Error:', error.message);
    throw error;
  }
}

// Main execution function
async function main() {
  console.log('🌟 KeyPass KILT DID Registration Examples\n');
  
  try {
    // Run main registration example
    await exampleKILTDIDRegistration();
    
    // Run transaction submission example  
    await exampleTransactionSubmission();
    
    // Run key generation example
    await exampleKeyGeneration();
    
    console.log('\n🎊 All examples completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Example execution failed:', error);
    process.exit(1);
  }
}

// Export functions for potential reuse
export {
  exampleKILTDIDRegistration,
  exampleTransactionSubmission,
  exampleKeyGeneration,
};

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}


