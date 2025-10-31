const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Deploying DID Registry Contract to Moonbeam...');
  
  // Get the contract factory
  const DIDRegistry = await ethers.getContractFactory('DIDRegistry');
  
  // Deploy the contract
  console.log('📝 Deploying contract...');
  const didRegistry = await DIDRegistry.deploy();
  
  // Wait for deployment
  await didRegistry.waitForDeployment();
  
  const contractAddress = await didRegistry.getAddress();
  console.log('✅ DID Registry deployed to:', contractAddress);
  
  // Save contract address to .env
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add DID contract address
  if (envContent.includes('REACT_APP_DID_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(
      /REACT_APP_DID_CONTRACT_ADDRESS=.*/,
      `REACT_APP_DID_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\nREACT_APP_DID_CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('📝 Updated .env file with contract address');
  
  // Verify contract on Moonbeam explorer
  console.log('🔍 Contract verification:');
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Explorer: https://moonbase.moonscan.io/address/${contractAddress}`);
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
