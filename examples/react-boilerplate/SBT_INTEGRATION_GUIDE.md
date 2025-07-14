# SBT Integration Guide

This guide explains how the Soulbound Token (SBT) system works and how to integrate real blockchain data fetching.

## Current Implementation

The current implementation shows **demo data** to demonstrate the UI components. To fetch real SBT tokens from actual blockchains, you need to configure the SBT service with real API keys and endpoints.

## How Real SBT Fetching Works

### 1. Multi-Source Data Aggregation

The `SBTService` fetches tokens from multiple sources:

```typescript
// Fetch from multiple sources in parallel
const [ethereumTokens, polygonTokens, registryTokens] = await Promise.allSettled([
  this.fetchEthereumTokens(walletAddress),
  this.fetchPolygonTokens(walletAddress),
  this.fetchFromRegistry(walletAddress)
]);
```

### 2. Data Sources

#### A. Direct Blockchain Queries
- **Ethereum**: Query known SBT contracts via Web3.js/Ethers.js
- **Polygon**: Similar approach for Polygon network
- **Other EVM chains**: Extensible for any EVM-compatible chain

#### B. Blockchain APIs
- **Etherscan API**: Get all ERC-721 transfers for a wallet
- **Alchemy API**: Enhanced NFT data and metadata
- **The Graph**: Indexed blockchain data

#### C. SBT Registries
- **SBT Registry APIs**: Centralized SBT databases
- **Custom Indexers**: Specialized SBT tracking services

### 3. Configuration Required

To enable real data fetching, you need to configure these in `src/services/sbtService.ts`:

```typescript
const RPC_ENDPOINTS = {
  ethereum: {
    mainnet: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY',
    sepolia: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY'
  },
  polygon: {
    mainnet: 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY'
  }
};

const SBT_REGISTRIES = {
  ethereum: 'https://api.soulbound.xyz/v1', // Replace with real registry
  polygon: 'https://api.polygon-sbt.xyz/v1',
  theGraph: 'https://api.thegraph.com/subgraphs/name/sbt-registry'
};
```

## Required API Keys

### 1. Alchemy API
- **Purpose**: RPC endpoints for Ethereum and Polygon
- **Sign up**: https://www.alchemy.com/
- **Cost**: Free tier available

### 2. Etherscan API
- **Purpose**: Get ERC-721 transfer history
- **Sign up**: https://etherscan.io/apis
- **Cost**: Free tier available

### 3. The Graph
- **Purpose**: Indexed blockchain data
- **Sign up**: https://thegraph.com/
- **Cost**: Free tier available

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install web3 ethers @alchemy/sdk
```

### Step 2: Configure Environment Variables

Create `.env` file:

```env
REACT_APP_ALCHEMY_ETHEREUM_API_KEY=your_alchemy_key
REACT_APP_ALCHEMY_POLYGON_API_KEY=your_alchemy_key
REACT_APP_ETHERSCAN_API_KEY=your_etherscan_key
REACT_APP_SBT_REGISTRY_URL=https://api.soulbound.xyz/v1
```

### Step 3: Update SBT Service

Uncomment and configure the real implementation in `src/services/sbtService.ts`:

```typescript
// Example: Real ERC-721 contract query
private async queryERC721Contract(
  contractAddress: string,
  walletAddress: string,
  chainType: string
): Promise<SBTToken[]> {
  const web3 = new Web3(RPC_ENDPOINTS[chainType].mainnet);
  const contract = new web3.eth.Contract(ERC721_ABI, contractAddress);
  
  // Get balance
  const balance = await contract.methods.balanceOf(walletAddress).call();
  
  // Get token IDs
  const tokenIds = [];
  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.methods.tokenOfOwnerByIndex(walletAddress, i).call();
    tokenIds.push(tokenId);
  }
  
  // Get token URIs and metadata
  const tokens = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const tokenURI = await contract.methods.tokenURI(tokenId).call();
      const metadata = await this.fetchMetadata(tokenURI);
      return this.buildTokenFromMetadata(tokenId, contractAddress, metadata, chainType);
    })
  );

  return tokens;
}
```

### Step 4: Add Known SBT Contracts

Update the list of known SBT contracts:

```typescript
private isSBTContract(contractAddress: string): boolean {
  const knownSBTContracts = [
    '0x1234567890123456789012345678901234567890', // Real SBT contract
    '0xabcdef1234567890abcdef1234567890abcdef12', // Another SBT contract
    // Add more known SBT contract addresses
  ];
  return knownSBTContracts.includes(contractAddress.toLowerCase());
}
```

## SBT Contract Standards

### ERC-721 SBTs
Most SBTs are implemented as ERC-721 tokens with additional restrictions:

```solidity
// Example SBT contract interface
interface ISoulboundToken {
    function mint(address to, uint256 tokenId) external;
    function burn(uint256 tokenId) external;
    function transfer(address from, address to, uint256 tokenId) external;
    function isRevocable() external view returns (bool);
    function revoke(uint256 tokenId) external;
}
```

### ERC-1155 SBTs
Some SBTs use ERC-1155 for batch operations:

```solidity
interface ISoulboundToken1155 {
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts) external;
    function burnBatch(uint256[] memory ids, uint256[] memory amounts) external;
}
```

## Verification Methods

### 1. On-Chain Verification
- Check token ownership on blockchain
- Verify contract is a known SBT contract
- Validate token metadata

### 2. Off-Chain Verification
- SBT registry verification
- Issuer signature verification
- Third-party attestation

### 3. Hybrid Verification
- Combine on-chain and off-chain data
- Cross-reference multiple sources
- Use consensus mechanisms

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const tokens = await sbtService.getTokens(walletAddress);
  return tokens;
} catch (error) {
  console.error('Error fetching SBT tokens:', error);
  
  // Fallback to cached data
  const cachedTokens = sbtService.getCachedTokens(walletAddress);
  if (cachedTokens.length > 0) {
    return cachedTokens;
  }
  
  // Show user-friendly error
  throw new Error('Unable to fetch Soulbound Tokens. Please try again later.');
}
```

## Performance Optimization

### 1. Caching
- Cache token data for 5 minutes
- Implement cache invalidation
- Use localStorage for persistent cache

### 2. Parallel Fetching
- Fetch from multiple sources simultaneously
- Use Promise.allSettled for resilience
- Implement retry logic

### 3. Pagination
- Implement pagination for large token collections
- Use cursor-based pagination
- Lazy load token details

## Security Considerations

### 1. API Key Security
- Store API keys in environment variables
- Use API key rotation
- Implement rate limiting

### 2. Data Validation
- Validate all incoming data
- Sanitize user inputs
- Check for malicious contracts

### 3. Privacy
- Minimize data collection
- Implement data retention policies
- Use secure communication (HTTPS)

## Testing

### 1. Unit Tests
```typescript
describe('SBTService', () => {
  it('should fetch tokens from multiple sources', async () => {
    const service = new SBTService();
    const tokens = await service.getTokens('0x123...');
    expect(tokens).toBeDefined();
    expect(tokens.length).toBeGreaterThan(0);
  });
});
```

### 2. Integration Tests
- Test with real wallet addresses
- Verify data consistency across sources
- Test error scenarios

### 3. Performance Tests
- Measure fetch times
- Test with large token collections
- Monitor memory usage

## Monitoring and Analytics

### 1. Metrics to Track
- Token fetch success rate
- Response times by data source
- Cache hit rates
- Error rates by source

### 2. Logging
```typescript
console.log('SBT fetch started', { walletAddress, timestamp });
console.log('SBT fetch completed', { 
  walletAddress, 
  tokenCount: tokens.length, 
  duration: Date.now() - startTime 
});
```

## Future Enhancements

### 1. Multi-Chain Support
- Add support for more chains (Solana, Cardano, etc.)
- Implement chain-specific optimizations
- Cross-chain token verification

### 2. Advanced Features
- Token expiration tracking
- Automatic refresh on token changes
- Push notifications for new tokens

### 3. Integration Options
- Webhook support for real-time updates
- API endpoints for external integrations
- SDK for easy integration

## Troubleshooting

### Common Issues

1. **No tokens found**
   - Check if wallet has SBTs
   - Verify API keys are correct
   - Check network connectivity

2. **Slow loading**
   - Implement caching
   - Use parallel fetching
   - Optimize API calls

3. **API rate limits**
   - Implement rate limiting
   - Use multiple API keys
   - Add retry logic

### Debug Mode

Enable debug logging:

```typescript
const service = new SBTService({
  enableDebug: true,
  logLevel: 'verbose'
});
```

## Support

For questions or issues:
- Check the console for error messages
- Review API documentation
- Test with known wallet addresses
- Verify network connectivity

---

This guide provides a comprehensive overview of integrating real SBT data fetching. The current implementation shows demo data, but the infrastructure is in place to fetch real blockchain data once configured with proper API keys and endpoints. 