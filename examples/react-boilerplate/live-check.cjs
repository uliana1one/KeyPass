const { ethers } = require('ethers');

async function liveCheckContracts() {
  try {
    console.log('🔍 Live Contract Verification');
    console.log('================================');
    
    // Connect to Moonbase Alpha
    const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');
    
    // Contract addresses
    const didContractAddress = '0x237A636ccdD38cb8Fb19849AB24dF5E7dbcB03e0';
    const sbtContractAddress = '0x0A6582FE7B47c55d26655A47e5a3bda626Bab898';
    const walletAddress = '0x1Ce01152C9DA643c96c93Ef1510cEc4b8D6142f2';
    
    console.log('📋 Checking wallet balance...');
    const balance = await provider.getBalance(walletAddress);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} DEV`);
    
    console.log('\n📋 Checking DID Registry Contract...');
    const didCode = await provider.getCode(didContractAddress);
    if (didCode === '0x') {
      console.log('❌ DID Registry contract not found');
    } else {
      console.log('✅ DID Registry contract is deployed');
      console.log(`📍 Address: ${didContractAddress}`);
    }
    
    console.log('\n📋 Checking SBT Contract...');
    const sbtCode = await provider.getCode(sbtContractAddress);
    if (sbtCode === '0x') {
      console.log('❌ SBT contract not found');
    } else {
      console.log('✅ SBT contract is deployed');
      console.log(`📍 Address: ${sbtContractAddress}`);
    }
    
    console.log('\n📋 Checking recent transactions...');
    const blockNumber = await provider.getBlockNumber();
    console.log(`🔢 Current block: ${blockNumber}`);
    
    // Check last few blocks for our transactions
    for (let i = 0; i < 3; i++) {
      const block = await provider.getBlock(blockNumber - i, true);
      if (block && block.transactions) {
        const ourTxs = block.transactions.filter(tx => 
          tx.from === walletAddress || 
          tx.to === didContractAddress || 
          tx.to === sbtContractAddress
        );
        
        if (ourTxs.length > 0) {
          console.log(`\n🔍 Block ${blockNumber - i}:`);
          ourTxs.forEach(tx => {
            console.log(`  📝 ${tx.hash} - ${tx.from === walletAddress ? 'From us' : 'To our contract'}`);
          });
        }
      }
    }
    
    console.log('\n🌐 Explorer Links:');
    console.log(`DID Registry: https://moonbase.moonscan.io/address/${didContractAddress}`);
    console.log(`SBT Contract: https://moonbase.moonscan.io/address/${sbtContractAddress}`);
    console.log(`Your Wallet: https://moonbase.moonscan.io/address/${walletAddress}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

liveCheckContracts();
