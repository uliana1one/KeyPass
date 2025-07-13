// API Configuration for real SBT data fetching
export const API_CONFIG = {
  // Etherscan API for Ethereum ERC-721 transfers
  etherscan: {
    apiKey: process.env.REACT_APP_ETHERSCAN_API_KEY || 'YourEtherscanApiKey',
    baseUrl: 'https://api.etherscan.io/api',
    endpoints: {
      nftTransfers: '/api?module=account&action=tokennfttx',
      tokenMetadata: '/api?module=token&action=tokeninfo',
    }
  },

  // Alchemy API for enhanced NFT data
  alchemy: {
    ethereum: {
      apiKey: process.env.REACT_APP_ALCHEMY_ETHEREUM_API_KEY || 'YourAlchemyEthereumKey',
      baseUrl: 'https://eth-mainnet.g.alchemy.com/v2',
    },
    polygon: {
      apiKey: process.env.REACT_APP_ALCHEMY_POLYGON_API_KEY || 'YourAlchemyPolygonKey',
      baseUrl: 'https://polygon-mainnet.g.alchemy.com/v2',
    }
  },

  // The Graph for indexed blockchain data
  theGraph: {
    ethereum: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
    polygon: 'https://api.thegraph.com/subgraphs/name/maticnetwork/mainnet-root-subgraphs',
  },

  // Known SBT registries and indexers
  sbtRegistries: {
    ethereumFoundation: 'https://api.ethereum.org',
    // Add more SBT registries as they become available
  }
};

// Real SBT contract addresses
export const REAL_SBT_CONTRACTS = {
  ethereum: [
    '0x4c8d2e60863e8d7e1033eda2b3d8d5c5d6b8b8b8', // Example SBT contract
    '0x1234567890123456789012345678901234567890', // Placeholder for testing
  ],
  polygon: [
    '0x1234567890123456789012345678901234567890', // Polygon SBT contracts
  ]
};

// Test wallet addresses that have SBTs (for testing purposes)
export const TEST_WALLETS_WITH_SBTS = [
  '0x1234567890123456789012345678901234567890', // Replace with real addresses
  '0xabcdef1234567890abcdef1234567890abcdef12',
  // Add more test wallets here
];

// ERC-721 ABI for SBT contracts
export const ERC721_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "index", "type": "uint256"}
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "type": "function"
  }
]; 