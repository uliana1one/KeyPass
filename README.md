# KeyPass - Multi-Chain Authentication SDK

KeyPass is a secure authentication SDK for blockchain-based applications. It provides a simple way to implement wallet-based authentication with support for both **Polkadot** and **Ethereum** ecosystems.

## Features

- **Multi-Chain Support**: Polkadot and Ethereum wallet authentication
- **Unified Verification**: Single API endpoint for all supported chains
- **Automatic Chain Detection**: Smart routing based on address format
- **Secure Wallet Integration**: Support for Polkadot.js, Talisman, and Ethereum wallets
- **Server-Side Verification**: ECDSA and SR25519 signature verification
- **DID Integration**: Decentralized Identifier support for both chains
- **Message Signing and Verification**: Secure message-based authentication
- **zk-Proofs**: Privacy-preserving credential verification using Semaphore protocol
- **Soulbound Tokens**: SBT minting and management on multiple chains
- **Verifiable Credentials**: Full VC support with selective disclosure
- **Automatic Retry**: Network error recovery
- **Security Best Practices**: Built-in security measures
- **Comprehensive Error Handling**: Detailed error types and recovery
- **Session Management**: Secure session utilities
- **Message Validation**: Input sanitization and validation

## Supported Chains

### Polkadot Ecosystem
- **Signature Algorithm**: SR25519
- **Address Format**: SS58 (e.g., `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`)
- **Supported Wallets**: Polkadot.js, Talisman
- **DID Method**: `did:key` with multibase encoding

### Ethereum Ecosystem  
- **Signature Algorithm**: ECDSA (secp256k1)
- **Address Format**: Hex (e.g., `0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b`)
- **Supported Wallets**: MetaMask, WalletConnect, and other Ethereum wallets
- **DID Method**: `did:ethr` with Ethereum addresses

## Installation

[![npm version](https://badge.fury.io/js/keypass-login-sdk.svg)](https://badge.fury.io/js/keypass-login-sdk)
[![npm](https://img.shields.io/npm/dt/keypass-login-sdk.svg)](https://www.npmjs.com/package/keypass-login-sdk)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/uliana1one/keypass)

**KeyPass is now available on npm!** 🎉

**🚀 Try the Live Demo:** [keypass-react-demo.vercel.app](https://keypass-react-demo.vercel.app)

### Method 1: Install from npm (Recommended)

```bash
npm install keypass-login-sdk
```

Or with yarn:
```bash
yarn add keypass-login-sdk
```

**Package Links:**
- 📦 [npm Package](https://www.npmjs.com/package/keypass-login-sdk)
- 📊 [Package Stats](https://npm-stat.com/charts.html?package=keypass-login-sdk)
- 🔍 [Package Info](https://npmjs.com/package/keypass-login-sdk)

### Method 2: Local Development Testing

For local development and testing, there are several alternative ways to use the package:

### Method 1: Using npm link (Recommended for local development)

This method is fully supported and recommended for local development:

1. Clone the repository:
```bash
git clone https://github.com/uliana1one/keypass.git
cd keypass
```

2. Install dependencies:
```bash
npm install
```

3. Build the package:
```bash
npm run build
```

4. Link it to your project:
```bash
npm link
```

5. In your project directory:
```bash
npm link keypass-login-sdk
```

### Method 3: Using Git URL (For testing in other projects)

> **Note**: Alternative method for testing with the latest development version.

In your project's `package.json`:
```json
{
  "dependencies": {
    "keypass-login-sdk": "github:uliana1one/keypass"
  }
}
```

### Method 4: Using Local Path (For testing in other projects)

> **Note**: Alternative method for testing with local development version.

In your project's `package.json`:
```json
{
  "dependencies": {
    "keypass-login-sdk": "file:../path/to/keypass"
  }
}
```

> **Recommendation**: For production use, install directly from npm (Method 1). For local development and testing of unreleased features, use npm link (Method 2) or other development methods.

## Docker & AWS ECR Deployment

KeyPass includes Docker support for containerized deployment to AWS ECR and other container platforms.

### Prerequisites

1. **AWS CLI** - Install and configure with your credentials
   ```bash
   # Install AWS CLI (macOS)
   brew install awscli
   
   # Install AWS CLI (Ubuntu/Debian)
   sudo apt-get update && sudo apt-get install awscli
   
   # Configure AWS CLI
   aws configure
   ```

2. **Docker** - Install Docker Desktop or Docker Engine
   ```bash
   # Install Docker Desktop (macOS/Windows)
   # Download from https://www.docker.com/products/docker-desktop/
   
   # Install Docker Engine (Ubuntu)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

3. **AWS ECR Repository** - Create the repository in AWS ECR
   ```bash
   # Create ECR repository (if not already created)
   aws ecr create-repository --repository-name keypass --region us-east-2
   ```

### Deployment Options

#### Option 1: Automated Deployment Script (Recommended)

Use the provided deployment script for a streamlined experience:

```bash
# Make the script executable
chmod +x scripts/deploy-to-ecr.sh

# Deploy with latest version
./scripts/deploy-to-ecr.sh

# Deploy with specific version
./scripts/deploy-to-ecr.sh v1.0.0
```

#### Option 2: Manual Deployment Commands

If you prefer manual control, follow these steps:

1. **Authenticate with AWS ECR:**
   ```bash
   aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 887637206351.dkr.ecr.us-east-2.amazonaws.com
   ```

2. **Build the Docker image:**
   ```bash
   docker build -t keypass .
   ```

3. **Tag the image for ECR:**
   ```bash
   docker tag keypass:latest 887637206351.dkr.ecr.us-east-2.amazonaws.com/keypass:latest
   ```

4. **Push to ECR:**
   ```bash
   docker push 887637206351.dkr.ecr.us-east-2.amazonaws.com/keypass:latest
   ```

### Docker Configuration

The project includes:

- **`Dockerfile`** - Multi-stage build optimized for production
- **`.dockerignore`** - Excludes unnecessary files to reduce build size
- **`scripts/deploy-to-ecr.sh`** - Automated deployment script

### Running the Container

After deployment, you can run the container locally:

```bash
# Pull the image from ECR
docker pull 887637206351.dkr.ecr.us-east-2.amazonaws.com/keypass:latest

# Run the container
docker run -p 3000:3000 887637206351.dkr.ecr.us-east-2.amazonaws.com/keypass:latest

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  887637206351.dkr.ecr.us-east-2.amazonaws.com/keypass:latest
```

### AWS ECS/Fargate Deployment

Use the ECR image URI for deployment to AWS ECS or Fargate:

```
Image URI: 887637206351.dkr.ecr.us-east-2.amazonaws.com/keypass:latest
```

### Troubleshooting

**AWS Authentication Issues:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Reconfigure AWS CLI
aws configure
```

**Docker Build Issues:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t keypass .
```

**ECR Push Issues:**
```bash
# Re-authenticate with ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 887637206351.dkr.ecr.us-east-2.amazonaws.com

# Check ECR repository exists
aws ecr describe-repositories --repository-names keypass --region us-east-2
```

## Quick Start

Here are examples of how to use KeyPass with different blockchain networks:

### Polkadot Authentication

```typescript
import { loginWithPolkadot } from 'keypass-login-sdk';

async function handlePolkadotLogin() {
  try {
    const result = await loginWithPolkadot();
    console.log('Logged in as:', result.address);
    console.log('DID:', result.did);
    
    // Store auth data in your preferred storage solution
    localStorage.setItem('polkadot-auth', JSON.stringify(result));
  } catch (error) {
    if (error.code === 'WALLET_NOT_FOUND') {
      console.error('Please install a Polkadot wallet');
    } else if (error.code === 'USER_REJECTED') {
      console.error('Login was rejected by user');
    } else {
      console.error('Login failed:', error.message);
    }
  }
}
```

### Ethereum Authentication

```typescript
import { loginWithEthereum } from 'keypass-login-sdk';

async function handleEthereumLogin() {
  try {
    const result = await loginWithEthereum();
    console.log('Logged in as:', result.address);
    console.log('DID:', result.did);
    
    // Store auth data in your preferred storage solution
    localStorage.setItem('ethereum-auth', JSON.stringify(result));
  } catch (error) {
    if (error.code === 'WALLET_NOT_FOUND') {
      console.error('Please install MetaMask or another Ethereum wallet');
    } else if (error.code === 'USER_REJECTED') {
      console.error('Login was rejected by user');
    } else {
      console.error('Login failed:', error.message);
    }
  }
}
```

### Server-Side Verification

The SDK provides a unified verification endpoint that automatically detects the chain type:

```typescript
// Server-side verification (Node.js/Express)
import { UnifiedVerificationService } from 'keypass-login-sdk/server';

const verificationService = new UnifiedVerificationService();

app.post('/api/verify', async (req, res) => {
  try {
    const { message, signature, address } = req.body;
    
    // Automatically detects chain type from address format
    const result = await verificationService.verifySignature({
      message,
      signature, 
      address
    });
    
    if (result.status === 'success') {
      console.log('Verified DID:', result.did);
      console.log('Chain type:', result.data.chainType); // 'polkadot' or 'ethereum'
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Zero-Knowledge Proofs

Prove age or membership without revealing private data:

```typescript
import { generateAgeVerificationProof } from '@keypass/login-sdk';

// Generate age verification proof
const ageCred = {
  credentialSubject: { age: 22 },
  // ... other credential fields
};

const proof = await generateAgeVerificationProof([ageCred], 18);

// Result proves age >= 18 without revealing exact age
console.log('Proof verified:', proof.type); // 'semaphore'
console.log('Public signals:', proof.publicSignals);

// Export proof for verification
const proofJson = JSON.stringify(proof, null, 2);
```

**Privacy Benefits:**
- ✅ Prove eligibility without showing exact values
- ✅ Prevent tracking through nullifiers
- ✅ Selective disclosure of only necessary fields
- ✅ Anonymous group membership verification

## Documentation

For detailed documentation, please refer to:

- [Integration Guide](./docs/integration.md) - Complete guide for integrating KeyPass into your application
- [API Reference](./docs/api.md) - Detailed API documentation
- [ZK-Proof User Guide](./docs/zkproof-guide.md) - Privacy-preserving credential verification
- [ZK-Proof API Reference](./docs/zkproof-api.md) - Complete ZK-proof API docs
- [ZK-Proof Integration Tutorial](./docs/zkproof-integration-tutorial.md) - Step-by-step zk-proof setup
- [Security Guide](./docs/security.md) - Security best practices and considerations
- [Onchain Validation](./ONCHAIN_VALIDATION.md) - Public proof of all onchain operations and transactions

## Key Features

### 1. Multi-Chain Wallet Integration
- **Polkadot**: Polkadot.js and Talisman wallet support
- **Ethereum**: MetaMask, WalletConnect, and other Ethereum wallets
- **Automatic Detection**: Smart wallet detection and connection
- **Account Management**: Multi-account support across chains
- **Message Signing**: Chain-specific message signing protocols
- **Connection State Management**: Robust connection handling

### 2. Unified Server-Side Verification
- **Multi-Chain Support**: Single endpoint for Polkadot and Ethereum
- **Automatic Chain Detection**: Routes based on address format
- **ECDSA Verification**: Ethereum signature verification using ethers.js
- **SR25519 Verification**: Polkadot signature verification
- **Message Validation**: Format and security validation
- **DID Integration**: Automatic DID creation for verified addresses

### 3. Security
- **Server-Side Signature Verification**: Cryptographic signature validation
- **Message Validation and Sanitization**: Input security measures
- **Nonce-Based Replay Attack Prevention**: UUID-based nonces
- **Time-Based Expiration**: 5-minute message expiration window
- **Rate Limiting Support**: Built-in protection mechanisms
- **Secure Session Management**: Best-practice session handling

### 4. Error Handling & Reliability
- **Comprehensive Error Types**: Detailed error classification
- **Automatic Retry**: Network error recovery with exponential backoff
- **User-Friendly Messages**: Clear error communication
- **Detailed Logging**: Security-focused error logging
- **Chain-Specific Errors**: Tailored error handling per blockchain

### 5. DID Support
- **Multi-Chain DIDs**: Support for both Polkadot and Ethereum
- **Polkadot DIDs**: `did:key` method with multibase encoding
- **Ethereum DIDs**: `did:ethr` method with Ethereum addresses
- **DID Resolution**: Resolve DIDs to addresses and documents
- **DID Document Management**: Complete DID document creation

### 6. Zero-Knowledge Proofs
- **Privacy-Preserving Verification**: Prove requirements without revealing data
- **Age Verification**: Prove age ≥ X without showing exact age
- **Membership Proof**: Prove group membership without revealing identity
- **Semaphore Protocol**: Industry-standard zk-SNARK proofs
- **Selective Disclosure**: Control which fields are revealed
- **Mock Mode**: Fast development with simulated proofs

## Prerequisites

Before using KeyPass, ensure:

1. **HTTPS Required**: Your application is served over HTTPS
2. **Wallet Installation**: Users have appropriate wallets installed:
   - **For Polkadot**: [Polkadot.js](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/) wallet
   - **For Ethereum**: [MetaMask](https://metamask.io/) or other Ethereum-compatible wallets
3. **Backend Setup**: Your backend implements the unified verification endpoint
4. **Secure Storage**: You have a secure storage solution for session management
5. **CORS Configuration**: Proper CORS setup for cross-origin requests

## Security Considerations

KeyPass implements several security measures:

1. **Message Validation**
   - All messages are validated and sanitized
   - Nonce-based replay attack prevention
   - Timestamp-based expiration

2. **Signature Verification**
   - Server-side signature verification
   - Rate limiting support
   - Message age validation

3. **Session Management**
   - Secure session storage
   - Session expiration
   - Proper cleanup on logout

4. **Error Handling**
   - Comprehensive error types
   - Proper error recovery
   - Security-focused logging


## Support

For issues and feature requests, please visit our [GitHub repository](https://github.com/uliana1one/keypass).

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.