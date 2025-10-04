import { SBTToken, SBTVerificationStatus } from '../components/SBTCard';
import { API_CONFIG, REAL_SBT_CONTRACTS, ERC721_ABI } from '../config/api';
import { ethers } from 'ethers';

// Real blockchain RPC endpoints
const RPC_ENDPOINTS = {
  ethereum: {
    mainnet: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    sepolia: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
  },
  polygon: {
    mainnet: 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY'
  },
  // Add more chains as needed
};

// SBT Registry endpoints (examples)
const SBT_REGISTRIES = {
  ethereum: 'https://api.soulbound.xyz/v1', // Example SBT registry
  polygon: 'https://api.polygon-sbt.xyz/v1',
  // You might also use The Graph for indexed data
  theGraph: 'https://api.thegraph.com/subgraphs/name/sbt-registry'
};

// Test wallet addresses that have SBTs (for testing purposes)
const TEST_WALLETS_WITH_SBTS = [
  '0x1234567890123456789012345678901234567890', // Replace with real addresses
  '0xabcdef1234567890abcdef1234567890abcdef12',
  // Add more test wallets here
];

export interface SBTServiceConfig {
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableTestMode?: boolean; // Enable test mode for development
  enableRealData?: boolean; // Enable real data fetching
  enableMinting?: boolean; // Enable SBT minting functionality
  moonbeamConfig?: {
    rpcUrl: string;
    network: string;
    chainId: number;
  };
}

export interface SBTMintRequest {
  contractAddress: string;
  recipient: string;
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number | boolean;
    }>;
  };
  tokenURI?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface SBTMintResult {
  tokenId: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  metadataUri: string;
  contractAddress: string;
  recipient: string;
  mintedAt: string;
}

export interface SBTMintStatus {
  status: 'idle' | 'preparing' | 'minting' | 'confirming' | 'success' | 'error';
  progress?: number;
  message?: string;
  error?: string;
  transactionHash?: string;
  result?: SBTMintResult;
}

export class SBTService {
  private config: SBTServiceConfig;
  private cache: Map<string, { data: SBTToken[]; timestamp: number }> = new Map();
  private mintingStatus: SBTMintStatus = { status: 'idle' };
  private mintingListeners: Array<(status: SBTMintStatus) => void> = [];
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;

  constructor(config: SBTServiceConfig = {}) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      enableTestMode: false,
      enableRealData: true,
      enableMinting: true,
      ...config
    };

    // Initialize provider if Moonbeam config is provided
    if (this.config.moonbeamConfig && this.config.enableMinting) {
      this.initializeProvider();
    }
  }

  /**
   * Detect if an address is Ethereum or Polkadot format
   */
  private detectAddressType(address: string): 'ethereum' | 'polkadot' | 'unknown' {
    // Ethereum addresses start with 0x and are 42 characters long
    if (address.startsWith('0x') && address.length === 42) {
      return 'ethereum';
    }
    
    // Polkadot addresses are typically 47-48 characters and don't start with 0x
    if (address.length >= 47 && address.length <= 48 && !address.startsWith('0x')) {
      return 'polkadot';
    }
    
    return 'unknown';
  }

  /**
   * Fetch SBT tokens for a wallet address across multiple chains
   */
  async getTokens(walletAddress: string): Promise<SBTToken[]> {
    const cacheKey = `tokens_${walletAddress}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout!) {
        return cached.data;
      }
    }

    // Test mode: Return realistic test data for development
    if (this.config.enableTestMode) {
      return this.getTestTokens(walletAddress);
    }

    try {
      console.log('Fetching real SBT data for wallet:', walletAddress);
      
      // Detect address type to determine which APIs to call
      const addressType = this.detectAddressType(walletAddress);
      console.log('Detected address type:', addressType);
      
      let allTokens: SBTToken[] = [];
      
      if (addressType === 'ethereum') {
        // For Ethereum addresses, fetch from Ethereum APIs
        const [ethereumTokens, registryTokens] = await Promise.allSettled([
          this.fetchEthereumTokens(walletAddress),
          this.fetchFromRegistry(walletAddress)
        ]);

        if (ethereumTokens.status === 'fulfilled') {
          allTokens.push(...ethereumTokens.value);
          console.log('Ethereum tokens found:', ethereumTokens.value.length);
        }
        
        if (registryTokens.status === 'fulfilled') {
          allTokens.push(...registryTokens.value);
          console.log('Registry tokens found:', registryTokens.value.length);
        }
      } else if (addressType === 'polkadot') {
        // For Polkadot addresses, only fetch from registry (no Ethereum APIs)
        const registryTokens = await this.fetchFromRegistry(walletAddress);
        allTokens.push(...registryTokens);
        console.log('Registry tokens found:', registryTokens.length);
      } else {
        console.warn('Unknown address format, skipping API calls');
        return [];
      }

      // Remove duplicates based on token ID
      const uniqueTokens = this.deduplicateTokens(allTokens);
      console.log('Total unique tokens found:', uniqueTokens.length);

      // Cache the results
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: uniqueTokens,
          timestamp: Date.now()
        });
      }

      return uniqueTokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }
  }

  /**
   * Fetch SBT tokens from Ethereum blockchain
   */
  private async fetchEthereumTokens(walletAddress: string): Promise<SBTToken[]> {
    try {
      // Validate that this is an Ethereum address
      if (this.detectAddressType(walletAddress) !== 'ethereum') {
        console.log('Skipping Ethereum API calls for non-Ethereum address:', walletAddress);
        return [];
      }

      const tokens: SBTToken[] = [];

      // Method 1: Query known SBT contracts
      for (const contractAddress of REAL_SBT_CONTRACTS.ethereum) {
        try {
          const contractTokens = await this.queryERC721Contract(
            contractAddress,
            walletAddress,
            'ethereum'
          );
          tokens.push(...contractTokens);
        } catch (error) {
          console.warn(`Failed to query contract ${contractAddress}:`, error);
        }
      }

      // Method 2: Use Etherscan API to find all ERC-721 transfers
      try {
        const etherscanTokens = await this.fetchFromEtherscan(walletAddress);
        tokens.push(...etherscanTokens);
      } catch (error) {
        console.warn('Failed to fetch from Etherscan:', error);
      }

      // Method 3: Use Alchemy API for enhanced NFT data
      try {
        const alchemyTokens = await this.fetchFromAlchemy(walletAddress, 'ethereum');
        tokens.push(...alchemyTokens);
      } catch (error) {
        console.warn('Failed to fetch from Alchemy Ethereum:', error);
      }

      return tokens;
    } catch (error) {
      console.error('Error fetching Ethereum tokens:', error);
      return [];
    }
  }

  /**
   * Fetch SBT tokens from Polygon blockchain
   */
  private async fetchPolygonTokens(walletAddress: string): Promise<SBTToken[]> {
    try {
      // Validate that this is an Ethereum address (Polygon uses same format)
      if (this.detectAddressType(walletAddress) !== 'ethereum') {
        console.log('Skipping Polygon API calls for non-Ethereum address:', walletAddress);
        return [];
      }

      const tokens: SBTToken[] = [];

      // Method 1: Query known SBT contracts
      for (const contractAddress of REAL_SBT_CONTRACTS.polygon) {
        try {
          const contractTokens = await this.queryERC721Contract(
            contractAddress,
            walletAddress,
            'polygon'
          );
          tokens.push(...contractTokens);
        } catch (error) {
          console.warn(`Failed to query contract ${contractAddress}:`, error);
        }
      }

      // Method 2: Use Alchemy API for enhanced NFT data
      try {
        const alchemyTokens = await this.fetchFromAlchemy(walletAddress, 'polygon');
        tokens.push(...alchemyTokens);
      } catch (error) {
        console.warn('Failed to fetch from Alchemy Polygon:', error);
      }

      return tokens;
    } catch (error) {
      console.error('Error fetching Polygon tokens:', error);
      return [];
    }
  }

  /**
   * Query a specific ERC-721 contract for tokens owned by the wallet
   */
  private async queryERC721Contract(
    contractAddress: string,
    walletAddress: string,
    chainType: string
  ): Promise<SBTToken[]> {
    try {
      // For now, we'll simulate the contract query since we don't have Web3.js installed
      // In a real implementation, you would use:
      // const web3 = new Web3(RPC_ENDPOINTS[chainType].mainnet);
      // const contract = new web3.eth.Contract(ERC721_ABI, contractAddress);
      
      console.log(`Querying contract ${contractAddress} for wallet ${walletAddress}`);
      // Remove Gitcoin Passport simulation
      return [];
    } catch (error) {
      console.error(`Error querying contract ${contractAddress}:`, error);
      return [];
    }
  }

  /**
   * Fetch tokens from Etherscan API
   */
  private async fetchFromEtherscan(walletAddress: string): Promise<SBTToken[]> {
    try {
      // Check if API key is placeholder
      if (API_CONFIG.etherscan.apiKey === 'YourEtherscanApiKey') {
        console.log('⚠️  Etherscan: Using placeholder API key. Get free key at https://etherscan.io/apis');
        return [];
      }
      
      const url = `${API_CONFIG.etherscan.baseUrl}?module=account&action=tokennfttx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${API_CONFIG.etherscan.apiKey}`;
      
      console.log('🔍 Fetching from Etherscan...');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('🔑 Etherscan: Invalid API key. Please add real key to .env file');
        } else {
          console.warn(`⚠️  Etherscan: HTTP ${response.status} - ${response.statusText}`);
        }
        return [];
      }
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        // Filter for SBT contracts
        const sbtTransfers = data.result.filter((tx: any) => 
          this.isSBTContract(tx.contractAddress)
        );
        
        console.log(`✅ Etherscan: Found ${sbtTransfers.length} SBT transfers`);
        
        return sbtTransfers.map((tx: any) => this.buildTokenFromTransfer(tx));
      } else if (data.message) {
        console.warn(`⚠️  Etherscan: ${data.message}`);
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching from Etherscan:', error);
      return [];
    }
  }

  /**
   * Fetch tokens from Alchemy API
   */
  private async fetchFromAlchemy(walletAddress: string, network: 'ethereum' | 'polygon'): Promise<SBTToken[]> {
    try {
      const config = API_CONFIG.alchemy[network];
      
      // Check if API key is placeholder
      if (config.apiKey === 'YourAlchemyEthereumKey' || config.apiKey === 'YourAlchemyPolygonKey') {
        console.log(`⚠️  Alchemy ${network}: Using placeholder API key. Get real key at https://www.alchemy.com/`);
        return [];
      }
      
      const url = `${config.baseUrl}/${config.apiKey}/getNFTs/?owner=${walletAddress}`;
      
      console.log(`🔍 Fetching from Alchemy ${network}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn(`🔑 Alchemy ${network}: Invalid API key. Please add real key to .env file`);
        } else {
          console.warn(`⚠️  Alchemy ${network}: HTTP ${response.status} - ${response.statusText}`);
        }
        return [];
      }
      
      const data = await response.json();
      
      if (data.ownedNfts) {
        // Filter for SBT contracts
        const sbtNfts = data.ownedNfts.filter((nft: any) => 
          this.isSBTContract(nft.contract.address)
        );
        
        console.log(`✅ Alchemy ${network}: Found ${sbtNfts.length} SBT NFTs`);
        
        return sbtNfts.map((nft: any) => this.buildTokenFromAlchemy(nft, network));
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error fetching from Alchemy ${network}:`, error);
      return [];
    }
  }

  /**
   * Fetch tokens from SBT registry
   */
  private async fetchFromRegistry(walletAddress: string): Promise<SBTToken[]> {
    try {
      const tokens: SBTToken[] = [];

      // Disabled: Gitcoin Passport registry fetch (endpoint down or not required)
      // try {
      //   const url = `${API_CONFIG.sbtRegistries.gitcoinPassport}/registry/${walletAddress}`;
      //   console.log('[SBTService] Fetching Gitcoin Passport registry:', url);
      //   const response = await fetch(url);
      //   if (response.ok) {
      //     const data = await response.json();
      //     if (data && data.items) {
      //       const passportTokens = data.items.map((item: any) => this.buildTokenFromRegistry(item, 'gitcoin'));
      //       tokens.push(...passportTokens);
      //     }
      //   } else {
      //     console.warn(`[SBTService] Gitcoin registry fetch failed: HTTP ${response.status} ${response.statusText}`);
      //   }
      // } catch (error) {
      //   console.error('[SBTService] Failed to fetch from Gitcoin registry:', error);
      // }

      return tokens;
    } catch (error) {
      console.error('Error fetching from registry:', error);
      return [];
    }
  }

  /**
   * Check if a contract address is a known SBT contract
   */
  private isSBTContract(contractAddress: string): boolean {
    const allContracts = [
      ...REAL_SBT_CONTRACTS.ethereum,
      ...REAL_SBT_CONTRACTS.polygon
    ];
    return allContracts.includes(contractAddress.toLowerCase());
  }

  /**
   * Build token from transfer data
   */
  private buildTokenFromTransfer(transfer: any): SBTToken {
    return {
      id: `${transfer.contractAddress}_${transfer.tokenID}`,
      name: transfer.tokenName || 'Unknown SBT',
      description: 'Soulbound Token from blockchain transfer',
      image: '', // Would need to fetch from tokenURI
      issuer: transfer.contractAddress,
      issuerName: 'Unknown Issuer',
      issuedAt: new Date(parseInt(transfer.timeStamp) * 1000).toISOString(),
      chainId: '1',
      chainType: 'Ethereum',
      contractAddress: transfer.contractAddress,
      tokenStandard: 'ERC-721',
      verificationStatus: 'verified' as SBTVerificationStatus,
      revocable: false
    };
  }

  /**
   * Build token from Alchemy NFT data
   */
  private buildTokenFromAlchemy(nft: any, network: string): SBTToken {
    return {
      id: `${nft.contract.address}_${nft.id.tokenId}`,
      name: nft.title || 'Unknown SBT',
      description: nft.description || 'Soulbound Token from Alchemy',
      image: nft.media?.[0]?.gateway || '',
      issuer: nft.contract.address,
      issuerName: 'Unknown Issuer',
      issuedAt: new Date().toISOString(), // Alchemy doesn't provide issuance date
      chainId: network === 'ethereum' ? '1' : '137',
      chainType: network === 'ethereum' ? 'Ethereum' : 'Polygon',
      contractAddress: nft.contract.address,
      tokenStandard: 'ERC-721',
      verificationStatus: 'verified' as SBTVerificationStatus,
      revocable: false
    };
  }

  /**
   * Build token from registry data
   */
  private buildTokenFromRegistry(registryToken: any, source: string): SBTToken {
    return {
      id: registryToken.id || `registry_${source}_${Date.now()}`,
      name: registryToken.name || 'Registry SBT',
      description: registryToken.description || 'Soulbound Token from registry',
      image: registryToken.image || '',
      issuer: registryToken.issuer || 'Unknown',
      issuerName: registryToken.issuerName || 'Unknown Issuer',
      issuedAt: registryToken.issuedAt || new Date().toISOString(),
      expiresAt: registryToken.expiresAt,
      chainId: registryToken.chainId || '1',
      chainType: registryToken.chainType || 'Ethereum',
      contractAddress: registryToken.contractAddress || '',
      tokenStandard: registryToken.tokenStandard || 'ERC-721',
      verificationStatus: registryToken.verificationStatus || 'verified' as SBTVerificationStatus,
      attributes: registryToken.attributes || [],
      revocable: registryToken.revocable || false,
      revokedAt: registryToken.revokedAt,
      tags: registryToken.tags || []
    };
  }

  /**
   * Remove duplicate tokens based on ID
   */
  private deduplicateTokens(tokens: SBTToken[]): SBTToken[] {
    const seen = new Set();
    return tokens.filter(token => {
      const duplicate = seen.has(token.id);
      seen.add(token.id);
      return !duplicate;
    });
  }

  /**
   * Get realistic test tokens for development
   */
  private async getTestTokens(walletAddress: string): Promise<SBTToken[]> {
    // Simulate API delay
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    return new Promise<SBTToken[]>(resolve => {
      setTimeout(() => {
        const testTokens: SBTToken[] = [
          // Removed Gitcoin Passport SBT
          {
            id: `test_2_${walletAddress.slice(-6)}`,
            name: 'Ethereum Developer Certification',
            description: 'Certified Ethereum smart contract developer with expertise in Solidity and DeFi protocols.',
            image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=300&fit=crop',
            issuer: '0x1234567890123456789012345678901234567890',
            issuerName: 'Ethereum Foundation',
            issuedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            chainId: '1',
            chainType: 'Ethereum',
            contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            tokenStandard: 'ERC-721',
            verificationStatus: 'verified' as SBTVerificationStatus,
            attributes: [
              { trait_type: 'Level', value: 'Advanced' },
              { trait_type: 'Skills', value: 'Solidity, DeFi, Smart Contracts' },
              { trait_type: 'Experience', value: '3+ years' }
            ],
            revocable: true,
            tags: ['Developer', 'Certification', 'Ethereum']
          }
        ];

        // Randomly add more tokens based on wallet address
        const walletHash = walletAddress.slice(-8);
        const tokenCount = parseInt(walletHash, 16) % 5 + 1;

        if (tokenCount > 2) {
          testTokens.push({
            id: `test_3_${walletAddress.slice(-6)}`,
            name: 'DAO Governance Participant',
            description: 'Active participant in DAO governance with voting power and proposal creation rights.',
            image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
            issuer: '0x5678901234567890123456789012345678901234',
            issuerName: 'DAO Collective',
            issuedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
            chainId: '1',
            chainType: 'Ethereum',
            contractAddress: '0xef1234567890abcdef1234567890abcdef123456',
            tokenStandard: 'ERC-721',
            verificationStatus: 'pending' as SBTVerificationStatus,
            attributes: [
              { trait_type: 'Voting Power', value: Math.floor(Math.random() * 1000) + 100 },
              { trait_type: 'Proposals Created', value: Math.floor(Math.random() * 10) + 1 },
              { trait_type: 'Participation Rate', value: `${Math.floor(Math.random() * 40) + 60}%` }
            ],
            revocable: true,
            tags: ['DAO', 'Governance', 'Voting']
          });
        }

        resolve(testTokens);
      }, delay);
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Initialize blockchain provider
   */
  private initializeProvider(): void {
    if (!this.config.moonbeamConfig) {
      console.warn('[SBTService] No Moonbeam config provided for minting');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(this.config.moonbeamConfig.rpcUrl);
      console.log('[SBTService] Provider initialized for', this.config.moonbeamConfig.network);
    } catch (error) {
      console.error('[SBTService] Failed to initialize provider:', error);
    }
  }

  /**
   * Set contract for minting operations
   */
  setContract(contractAddress: string): void {
    if (!this.provider) {
      console.warn('[SBTService] Provider not initialized');
      return;
    }

    try {
      // Basic ERC-721 ABI for minting
      const abi = [
        'function mint(address to, string memory uri) external returns (uint256)',
        'function safeMint(address to, string memory uri) external returns (uint256)',
        'function ownerOf(uint256 tokenId) external view returns (address)',
        'function tokenURI(uint256 tokenId) external view returns (string)',
        'function totalSupply() external view returns (uint256)',
        'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      ];

      this.contract = new ethers.Contract(contractAddress, abi, this.provider);
      console.log('[SBTService] Contract set:', contractAddress);
    } catch (error) {
      console.error('[SBTService] Failed to set contract:', error);
    }
  }

  /**
   * Mint SBT token with real blockchain integration
   */
  async mintSBT(
    request: SBTMintRequest,
    signer: ethers.Signer
  ): Promise<SBTMintResult> {
    if (!this.config.enableMinting) {
      throw new Error('SBT minting is disabled');
    }

    if (!this.contract) {
      throw new Error('Contract not set. Call setContract() first.');
    }

    try {
      // Update status to preparing
      this.updateMintingStatus({
        status: 'preparing',
        progress: 10,
        message: 'Preparing minting transaction...'
      });

      // Connect contract to signer
      const contractWithSigner = this.contract.connect(signer);

      // Prepare metadata URI
      let metadataUri = request.tokenURI;
      if (request.metadata && !request.tokenURI) {
        // In a real implementation, you would upload metadata to IPFS
        // For now, we'll create a simple data URI
        metadataUri = `data:application/json,${encodeURIComponent(JSON.stringify(request.metadata))}`;
      }

      if (!metadataUri) {
        throw new Error('No metadata URI provided');
      }

      // Update status to minting
      this.updateMintingStatus({
        status: 'minting',
        progress: 30,
        message: 'Submitting minting transaction...'
      });

      // Estimate gas
      const gasEstimate = await (contractWithSigner as any).mint.estimateGas(
        request.recipient,
        metadataUri,
        {
          gasLimit: request.gasLimit,
          gasPrice: request.gasPrice,
          maxFeePerGas: request.maxFeePerGas,
          maxPriorityFeePerGas: request.maxPriorityFeePerGas,
        }
      );

      // Execute minting transaction
      const tx = await (contractWithSigner as any).mint(request.recipient, metadataUri, {
        gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
        gasPrice: request.gasPrice,
        maxFeePerGas: request.maxFeePerGas,
        maxPriorityFeePerGas: request.maxPriorityFeePerGas,
      });

      // Update status with transaction hash
      this.updateMintingStatus({
        status: 'confirming',
        progress: 60,
        message: 'Waiting for transaction confirmation...',
        transactionHash: tx.hash
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      // Find the Transfer event to get the token ID
      const transferEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === 'Transfer' && parsed.args.from === ethers.ZeroAddress;
        } catch {
          return false;
        }
      });

      if (!transferEvent) {
        throw new Error('No Transfer event found in transaction');
      }

      const parsedEvent = this.contract.interface.parseLog(transferEvent);
      const tokenId = parsedEvent!.args.tokenId.toString();

      // Update status to success
      const result: SBTMintResult = {
        tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        metadataUri,
        contractAddress: request.contractAddress,
        recipient: request.recipient,
        mintedAt: new Date().toISOString(),
      };

      this.updateMintingStatus({
        status: 'success',
        progress: 100,
        message: 'SBT minted successfully!',
        result
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateMintingStatus({
        status: 'error',
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * Get current minting status
   */
  getMintingStatus(): SBTMintStatus {
    return { ...this.mintingStatus };
  }

  /**
   * Subscribe to minting status updates
   */
  onMintingStatusUpdate(callback: (status: SBTMintStatus) => void): () => void {
    this.mintingListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.mintingListeners.indexOf(callback);
      if (index > -1) {
        this.mintingListeners.splice(index, 1);
      }
    };
  }

  /**
   * Update minting status and notify listeners
   */
  private updateMintingStatus(status: Partial<SBTMintStatus>): void {
    this.mintingStatus = { ...this.mintingStatus, ...status };
    
    // Notify all listeners
    this.mintingListeners.forEach(callback => {
      try {
        callback({ ...this.mintingStatus });
      } catch (error) {
        console.error('[SBTService] Error in status update callback:', error);
      }
    });
  }

  /**
   * Reset minting status
   */
  resetMintingStatus(): void {
    this.mintingStatus = { status: 'idle' };
    this.updateMintingStatus({});
  }

  /**
   * Check if minting is available
   */
  isMintingAvailable(): boolean {
    return !!(this.config.enableMinting && this.provider !== null && this.contract !== null);
  }

  /**
   * Get provider status
   */
  getProviderStatus(): {
    available: boolean;
    connected: boolean;
    network?: string;
  } {
    if (!this.provider || !this.config.moonbeamConfig) {
      return {
        available: false,
        connected: false,
      };
    }

    return {
      available: true,
      connected: true, // JsonRpcProvider is always "connected"
      network: this.config.moonbeamConfig.network,
    };
  }

  /**
   * Connect to provider (for wallet connection)
   */
  async connectProvider(signer: ethers.Signer): Promise<boolean> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      // Test connection
      await this.provider.getNetwork();
      console.log('[SBTService] Provider connected successfully');
      return true;
    } catch (error) {
      console.error('[SBTService] Failed to connect provider:', error);
      return false;
    }
  }

  /**
   * Disconnect from provider
   */
  async disconnectProvider(): Promise<void> {
    if (this.provider) {
      // JsonRpcProvider doesn't need explicit disconnection
      console.log('[SBTService] Provider disconnected');
    }
  }
}

// Export a default instance with Moonbeam configuration
export const sbtService = new SBTService({
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableTestMode: false,
  enableRealData: true,
  enableMinting: true,
  moonbeamConfig: {
    rpcUrl: process.env.REACT_APP_MOONBEAM_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network',
    network: process.env.REACT_APP_MOONBEAM_NETWORK || 'moonbase-alpha',
    chainId: parseInt(process.env.REACT_APP_MOONBEAM_CHAIN_ID || '1287'),
  },
}); 