#!/usr/bin/env node

/**
 * Environment setup script for React boilerplate
 * Run with: node setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envTemplate = `# Moonbeam Configuration
REACT_APP_MOONBEAM_RPC_URL=https://rpc.api.moonbase.moonbeam.network
REACT_APP_SBT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# IPFS Configuration (Optional)
REACT_APP_PINATA_API_KEY=your-pinata-api-key
REACT_APP_PINATA_SECRET=your-pinata-secret

# Development Configuration
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG_MODE=true
`;

function setupEnvironment() {
  console.log('🔧 Setting up environment for React boilerplate...\n');
  
  try {
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      console.log('📄 .env file already exists');
      const existingContent = fs.readFileSync(envPath, 'utf8');
      console.log('Current content:');
      console.log(existingContent);
      console.log('\n✅ Environment is already configured!');
    } else {
      // Create .env file
      fs.writeFileSync(envPath, envTemplate);
      console.log('✅ Created .env file with default configuration');
      console.log('\n📋 Next steps:');
      console.log('1. Update REACT_APP_SBT_CONTRACT_ADDRESS with your deployed contract');
      console.log('2. Add REACT_APP_PINATA_API_KEY if you want real IPFS integration');
      console.log('3. Run: npm start');
    }
    
    console.log('\n🧪 Test the integration:');
    console.log('node test-integration.js');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupEnvironment();
