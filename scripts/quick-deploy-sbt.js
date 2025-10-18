import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deploy() {
  console.log('🚀 Deploying SBTSimple contract to Moonbase Alpha...\n');

  // Setup provider and wallet
  const rpcUrl = 'https://rpc.api.moonbase.moonbeam.network';
  const privateKey = process.env.MOONBEAM_PRIVATE_KEY || '0x06cd7c4ce1de70b26606a136483a8b690e776ad9504a41185202eb8168bb478b';
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`📝 Deploying from: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} DEV\n`);
  
  // Load contract artifact
  const artifactPath = path.join(__dirname, '..', 'src', 'contracts', 'artifacts', 'SBTSimple.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  console.log(`📦 Contract bytecode loaded (${artifact.bytecode.length} characters)`);
  console.log(`📜 ABI loaded (${artifact.abi.length} functions/events)\n`);
  
  // Create contract factory
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  // Constructor args
  const name = 'Test SBT';
  const symbol = 'TSBT';
  const baseURI = 'https://test.example.com/metadata/';
  
  console.log('⏳ Deploying contract...');
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Base URI: ${baseURI}\n`);
  
  // Deploy
  const contract = await factory.deploy(name, symbol, baseURI);
  
  console.log(`📝 Transaction hash: ${contract.deploymentTransaction().hash}`);
  console.log('⏳ Waiting for confirmation...\n');
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log('✅ Contract deployed successfully!');
  console.log(`📍 Address: ${address}\n`);
  
  // Save to config
  const configDir = path.join(__dirname, '..', 'config');
  const configPath = path.join(configDir, 'deployments.json');
  
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  if (!config['moonbase-alpha']) {
    config['moonbase-alpha'] = {};
  }
  
  config['moonbase-alpha'].SBTSimple = {
    address: address,
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    transactionHash: contract.deploymentTransaction().hash
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log(`💾 Deployment info saved to ${configPath}`);
  console.log('\n🎉 Deployment complete!');
  
  return address;
}

deploy()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });

