# Real Data Setup Guide

This guide will help you configure the SBT service to fetch real Soulbound Token data from actual blockchain sources.

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp env-template.txt .env
   ```

2. **Add your API keys to the `.env` file**

3. **Restart the development server:**
   ```bash
   npm start
   ```

## Required API Keys

### 1. Etherscan API Key (Free)
- **Purpose:** Fetch ERC-721 transfers from Ethereum blockchain
- **Get it:** https://etherscan.io/apis
- **Rate limit:** 5 calls/sec for free tier
- **Setup:**
  1. Go to https://etherscan.io/apis
  2. Sign up for a free account
  3. Create a new API key
  4. Add to `.env`: `REACT_APP_ETHERSCAN_API_KEY=YourKeyHere`

### 2. Alchemy API Keys (Free)
- **Purpose:** Enhanced NFT data from Ethereum and Polygon
- **Get it:** https://www.alchemy.com/
- **Rate limit:** 330M compute units/month for free tier
- **Setup:**
  1. Go to https://www.alchemy.com/
  2. Create a free account
  3. Create apps for both Ethereum and Polygon mainnets
  4. Add to `.env`:
     ```
     REACT_APP_ALCHEMY_ETHEREUM_API_KEY=YourEthereumKey
     REACT_APP_ALCHEMY_POLYGON_API_KEY=YourPolygonKey
     ```

### 3. The Graph API Key (Optional)
- **Purpose:** Indexed blockchain data
- **Get it:** https://thegraph.com/
- **Setup:**
  1. Go to https://thegraph.com/
  2. Create a free account
  3. Get your API key
  4. Add to `.env`: `REACT_APP_THEGRAPH_API_KEY=YourKeyHere`

## What Data Sources Are Used

### 1. Ethereum Blockchain
- **Etherscan API:** ERC-721 transfers and token metadata
- **Alchemy API:** Enhanced NFT data with metadata
- **Known SBT Contracts:** Direct contract queries for specific SBTs

### 2. Polygon Blockchain
- **Alchemy API:** NFT data from Polygon mainnet
- **Known SBT Contracts:** Polygon-based SBT contracts

### 3. SBT Registries
- **Gitcoin Passport:** Identity verification SBTs
- **Ethereum Foundation:** Official Ethereum SBTs
- **Custom Registries:** Additional SBT sources

## Testing Real Data

### 1. Test Wallet Addresses
Add these to your `.env` file for testing:
```
REACT_APP_TEST_WALLET_1=0x1234567890123456789012345678901234567890
REACT_APP_TEST_WALLET_2=0xabcdef1234567890abcdef1234567890abcdef12
```

### 2. Known SBT Holders
These wallets are known to have SBTs:
- Gitcoin Passport holders: Check https://passport.gitcoin.co/
- Ethereum Foundation contributors
- Major DAO participants

### 3. Browser Console Monitoring
Open browser dev tools and check the console for:
- API call logs
- Token discovery results
- Error messages

## Troubleshooting

### Common Issues

1. **"API key invalid" errors**
   - Verify your API keys are correct
   - Check if you've exceeded rate limits
   - Ensure keys are properly added to `.env`

2. **No tokens found**
   - The wallet might not have any SBTs
   - Try with known SBT holder addresses
   - Check console for API errors

3. **CORS errors**
   - Some APIs require server-side calls
   - Use a proxy or backend service for production

### Rate Limiting

- **Etherscan:** 5 calls/sec (free tier)
- **Alchemy:** 330M compute units/month (free tier)
- **The Graph:** Varies by plan

### Fallback Behavior

If real data fetching fails, the service will:
1. Log errors to console
2. Return empty results
3. Not crash the application

## Production Considerations

### 1. Environment Variables
- Never commit API keys to version control
- Use environment variables in production
- Rotate keys regularly

### 2. Rate Limiting
- Implement caching to reduce API calls
- Monitor usage to stay within limits
- Consider paid tiers for higher limits

### 3. Error Handling
- Implement retry logic for failed requests
- Show user-friendly error messages
- Log errors for debugging

### 4. Caching
- Cache results to improve performance
- Set appropriate cache timeouts
- Clear cache when needed

## Example .env File

```env
# API Keys for Real SBT Data Fetching
REACT_APP_ETHERSCAN_API_KEY=YourEtherscanApiKey123
REACT_APP_ALCHEMY_ETHEREUM_API_KEY=YourAlchemyEthereumKey456
REACT_APP_ALCHEMY_POLYGON_API_KEY=YourAlchemyPolygonKey789
REACT_APP_THEGRAPH_API_KEY=YourTheGraphApiKey012

# Test wallet addresses
REACT_APP_TEST_WALLET_1=0x1234567890123456789012345678901234567890
REACT_APP_TEST_WALLET_2=0xabcdef1234567890abcdef1234567890abcdef12
```

## Next Steps

1. **Get API keys** from the services above
2. **Add them to your `.env` file**
3. **Restart the development server**
4. **Test with known SBT holder addresses**
5. **Monitor console logs for API activity**

The system will now fetch real SBT data from actual blockchain sources! 