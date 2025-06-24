# SBT Testing Guide

This guide explains how to test the Soulbound Token (SBT) functionality even if you don't have real SBT tokens.

## Testing Modes Available

The SBT system provides three different modes for testing:

### 1. **Demo Mode** (Default)
- **Purpose**: UI demonstration with static data
- **Data**: 6 predefined sample tokens
- **Use Case**: Show the interface and user experience
- **No API calls**: Completely static

### 2. **Test Mode** (Recommended for Development)
- **Purpose**: Simulate real API calls with realistic data
- **Data**: Dynamically generated based on wallet address
- **Use Case**: Test the real data flow without API keys
- **Features**: 
  - Simulates API delays (500-1500ms)
  - Generates different token counts per wallet
  - Realistic metadata and attributes
  - Various verification statuses

### 3. **Real Mode** (Production)
- **Purpose**: Fetch actual blockchain data
- **Data**: Real SBT tokens from blockchains
- **Use Case**: Production environment
- **Requirements**: API keys and configuration

## How to Test Without Real SBTs

### Method 1: Use Test Mode (Recommended)

1. **Start the React app:**
   ```bash
   cd examples/react-boilerplate
   npm start
   ```

2. **Connect any wallet** (Ethereum or Polkadot)

3. **Click "Switch Mode"** to cycle through modes:
   - Demo → Test → Real → Demo

4. **Test Mode Features:**
   - Different wallet addresses show different tokens
   - Realistic API delays simulate network requests
   - Token count varies based on wallet address hash
   - Includes Gitcoin Passport, Developer Certifications, DAO tokens, etc.

### Method 2: Use Known SBT Contract Addresses

Some real SBT contracts you can test with:

#### Gitcoin Passport SBT
- **Contract**: `0x2d9d94729448f6c9d0c26d3629f0d50b9b299264`
- **Network**: Ethereum Mainnet
- **Description**: Decentralized identity verification
- **How to get**: Visit [Gitcoin Passport](https://passport.gitcoin.co/)

#### Other Known SBTs
- **Ethereum Foundation**: Various developer certifications
- **DAO Governance**: Participation tokens from major DAOs
- **DeFi Protocols**: Contributor recognition tokens

### Method 3: Create Your Own Test SBTs

#### Option A: Deploy Test SBT Contract
```solidity
// Simple SBT contract for testing
contract TestSBT is ERC721 {
    constructor() ERC721("Test SBT", "TSBT") {}
    
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
```

#### Option B: Use Testnet
- Deploy SBT contracts on Sepolia or Mumbai testnet
- Use testnet wallets for free testing
- No real value at risk

## Testing Scenarios

### 1. **Basic Functionality Testing**

**Test Case**: Verify UI components work correctly
```typescript
// Test with different wallet addresses
const testWallets = [
  '0x1234567890123456789012345678901234567890',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0x9876543210987654321098765432109876543210'
];

// Each should show different tokens in test mode
```

### 2. **Error Handling Testing**

**Test Case**: Verify error states work
```typescript
// Test with invalid wallet addresses
const invalidWallets = [
  '0x123', // Too short
  'invalid-address', // Invalid format
  '0x0000000000000000000000000000000000000000' // Zero address
];
```

### 3. **Performance Testing**

**Test Case**: Verify loading states and caching
```typescript
// Test refresh functionality
// Test cache behavior
// Test concurrent requests
```

### 4. **Data Validation Testing**

**Test Case**: Verify token data structure
```typescript
// Check required fields
// Validate data types
// Test edge cases (empty strings, null values, etc.)
```

## Test Data Examples

### Sample Test Tokens Generated

#### Gitcoin Passport
```json
{
  "id": "test_1_789012",
  "name": "Gitcoin Passport",
  "description": "Decentralized identity verification for the Gitcoin ecosystem",
  "issuer": "0x2d9d94729448f6c9d0c26d3629f0d50b9b299264",
  "issuerName": "Gitcoin Foundation",
  "verificationStatus": "verified",
  "attributes": [
    {"trait_type": "Score", "value": 45},
    {"trait_type": "Stamps", "value": 12},
    {"trait_type": "Level", "value": "Gold"}
  ]
}
```

#### Developer Certification
```json
{
  "id": "test_2_789012",
  "name": "Ethereum Developer Certification",
  "description": "Certified Ethereum smart contract developer",
  "issuer": "0x1234567890123456789012345678901234567890",
  "issuerName": "Ethereum Foundation",
  "verificationStatus": "verified",
  "attributes": [
    {"trait_type": "Level", "value": "Advanced"},
    {"trait_type": "Skills", "value": "Solidity, DeFi, Smart Contracts"},
    {"trait_type": "Experience", "value": "3+ years"}
  ]
}
```

## Testing Checklist

### ✅ UI/UX Testing
- [ ] Cards display correctly with all information
- [ ] Loading states work properly
- [ ] Empty states show when no tokens
- [ ] Error states display user-friendly messages
- [ ] Responsive design works on mobile
- [ ] Hover effects and animations work

### ✅ Functionality Testing
- [ ] Token refresh works
- [ ] Mode switching works
- [ ] Token click handlers work
- [ ] Caching works correctly
- [ ] Error handling works

### ✅ Data Testing
- [ ] Token data is valid
- [ ] Attributes display correctly
- [ ] Verification statuses show proper colors
- [ ] Dates format correctly
- [ ] Images load or show placeholders

### ✅ Performance Testing
- [ ] Loading times are reasonable
- [ ] No memory leaks
- [ ] Cache improves performance
- [ ] Large token lists handle well

## Debugging Tips

### 1. **Check Console Logs**
```javascript
// Enable debug logging
console.log('SBT fetch started:', { walletAddress, mode });
console.log('SBT fetch completed:', { tokenCount, duration });
```

### 2. **Test Different Wallet Addresses**
```javascript
// Test with various address formats
const testAddresses = [
  '0x1234567890123456789012345678901234567890',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0x0000000000000000000000000000000000000001'
];
```

### 3. **Monitor Network Requests**
- Open browser DevTools
- Check Network tab for API calls
- Verify request/response formats

### 4. **Test Error Scenarios**
```javascript
// Simulate network errors
// Test with invalid API responses
// Check timeout handling
```

## Integration Testing

### 1. **With Real Wallets**
- Connect MetaMask or Polkadot.js
- Test with actual wallet addresses
- Verify data consistency

### 2. **With Backend Services**
- Test API integration
- Verify data transformation
- Check error handling

### 3. **With Other Components**
- Test wallet connection flow
- Verify data persistence
- Check state management

## Performance Benchmarks

### Expected Performance
- **Initial Load**: < 2 seconds
- **Refresh**: < 1 second (with cache)
- **Mode Switch**: < 500ms
- **Token Click**: < 100ms

### Memory Usage
- **Base Memory**: ~5MB
- **Per 100 Tokens**: +2MB
- **Cache Size**: Max 50 wallets

## Troubleshooting Common Issues

### 1. **No Tokens Showing**
- Check wallet connection
- Verify mode selection
- Check console for errors
- Test with different wallet address

### 2. **Slow Loading**
- Check network connectivity
- Verify API endpoints
- Check cache configuration
- Monitor browser performance

### 3. **UI Not Updating**
- Check React state updates
- Verify component re-renders
- Check for JavaScript errors
- Clear browser cache

### 4. **API Errors**
- Check API key configuration
- Verify endpoint URLs
- Check rate limits
- Test with different networks

## Future Testing Enhancements

### 1. **Automated Testing**
```typescript
// Unit tests for SBT service
describe('SBTService', () => {
  it('should fetch tokens in test mode', async () => {
    const service = new SBTService({ enableTestMode: true });
    const tokens = await service.getTokens('0x123...');
    expect(tokens.length).toBeGreaterThan(0);
  });
});
```

### 2. **E2E Testing**
```typescript
// End-to-end tests
describe('SBT Integration', () => {
  it('should display tokens after wallet connection', async () => {
    // Connect wallet
    // Wait for tokens to load
    // Verify UI updates
  });
});
```

### 3. **Load Testing**
- Test with large token collections
- Simulate concurrent users
- Monitor performance under load

---

This testing guide provides comprehensive coverage for testing SBT functionality without requiring real tokens. The test mode is particularly useful for development and demonstration purposes. 