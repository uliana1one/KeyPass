const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Deploying Soulbound Token Contract to Moonbeam...');
  
  // Get the contract factory
  const SoulboundToken = await ethers.getContractFactory('SoulboundToken');
  
  // Deploy the contract with name and symbol
  console.log('📝 Deploying contract...');
  const sbtContract = await SoulboundToken.deploy(
    'KeyPass Soulbound Token',
    'KP-SBT'
  );
  
  // Wait for deployment
  await sbtContract.waitForDeployment();
  
  const contractAddress = await sbtContract.getAddress();
  console.log('✅ Soulbound Token deployed to:', contractAddress);
  
  // Save contract address to .env
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add SBT contract address
  if (envContent.includes('REACT_APP_SBT_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(
      /REACT_APP_SBT_CONTRACT_ADDRESS=.*/,
      `REACT_APP_SBT_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\nREACT_APP_SBT_CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('📝 Updated .env file with contract address');
  
  // Verify contract on Moonbeam explorer
  console.log('🔍 Contract verification:');
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Explorer: https://moonbase.moonscan.io/address/${contractAddress}`);
  
  // Test minting a sample SBT
  console.log('🧪 Testing contract functionality...');
  try {
    const [deployer] = await ethers.getSigners();
    console.log('   Deployer address:', deployer.address);
    
    // Mint a test SBT
    const testMetadataUri = 'https://gateway.pinata.cloud/ipfs/QmTest123';
    const mintTx = await sbtContract.mintSBT(deployer.address, testMetadataUri);
    await mintTx.wait();
    
    const totalSupply = await sbtContract.getTotalSupply();
    console.log('   Total supply after test mint:', totalSupply.toString());
    
    const ownerTokens = await sbtContract.getOwnerTokens(deployer.address);
    console.log('   Owner tokens:', ownerTokens.map(t => t.toString()));
    
    console.log('✅ Contract test successful!');
  } catch (error) {
    console.error('❌ Contract test failed:', error.message);
  }
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
