import { KiltAdapter } from '../src/adapters/KiltAdapter.js';

/**
 * Example demonstrating KILT parachain connection capability
 */
async function demonstrateKiltConnection() {
  console.log('🚀 Starting KILT parachain connection demo...');
  
  const kiltAdapter = new KiltAdapter();
  
  try {
    // Step 1: Connect to KILT spiritnet
    console.log('📡 Connecting to KILT spiritnet...');
    const chainInfo = await kiltAdapter.connect();
    
    console.log('✅ Connected to KILT parachain!');
    console.log('Chain Info:', {
      name: chainInfo.name,
      network: chainInfo.network,
      version: chainInfo.version,
      runtime: chainInfo.runtime,
      ss58Format: chainInfo.ss58Format,
      genesisHash: chainInfo.genesisHash.substring(0, 20) + '...',
    });

    // Step 2: Enable KILT wallet extension
    console.log('\n🔐 Enabling KILT wallet extension...');
    await kiltAdapter.enable();
    console.log('✅ KILT wallet enabled!');

    // Step 3: Get accounts
    console.log('\n📋 Getting KILT accounts...');
    const accounts = await kiltAdapter.getAccounts();
    
    if (accounts.length > 0) {
      console.log(`✅ Found ${accounts.length} KILT account(s):`);
      accounts.forEach((account, index) => {
        console.log(`  ${index + 1}. ${account.name} - ${account.address}`);
      });

      // Step 4: Sign a test message
      console.log('\n✍️ Testing message signing...');
      const testMessage = 'Hello from KeyPass KILT integration!';
      console.log(`Signing message: "${testMessage}"`);
      
      try {
        const signature = await kiltAdapter.signMessage(testMessage);
        console.log('✅ Message signed successfully!');
        console.log('Signature:', signature.substring(0, 20) + '...');
        
        // Step 5: Validate address format
        console.log('\n🔍 Validating KILT address format...');
        const isValid = await kiltAdapter.validateAddress(accounts[0].address);
        console.log(`✅ Address validation: ${isValid ? 'Valid' : 'Invalid'}`);
        
      } catch (signError) {
        console.log('❌ Signing failed:', signError.message);
      }
    } else {
      console.log('❌ No KILT accounts found. Please create an account in the KILT wallet.');
    }

    // Step 6: Disconnect
    console.log('\n🔌 Disconnecting from KILT parachain...');
    await kiltAdapter.disconnect();
    console.log('✅ Disconnected successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('KILT Extension')) {
      console.log('\n💡 Note: Please install the KILT wallet browser extension to use KILT accounts.');
      console.log('   Download from: https://www.kilt.io/products/wallet');
    }
    
    if (error.message.includes('connection')) {
      console.log('\n💡 Note: Make sure you have internet connectivity and the KILT spiritnet is accessible.');
    }
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateKiltConnection()
    .then(() => {
      console.log('\n🎉 KILT demo completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateKiltConnection };
