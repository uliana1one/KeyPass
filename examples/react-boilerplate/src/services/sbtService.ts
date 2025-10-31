import { SBTToken, SBTVerificationStatus } from '../components/SBTCard';
import { API_CONFIG, REAL_SBT_CONTRACTS } from '../config/api';
import { ethers } from 'ethers';

export interface SBTServiceConfig {
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableTestMode?: boolean;
  enableRealData?: boolean;
  enableMinting?: boolean;
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
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
}

export interface SBTMintResult {
  success: boolean;
  tokenId: string;
  txHash?: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  metadataUri: string;
  contractAddress: string;
  recipient: string;
  mintedAt: string;
}

export type SBTMintStatus = 'pending' | 'idle' | 'preparing' | 'minting' | 'confirming' | 'success' | 'error';

export interface SBTMintingStatus {
  status: SBTMintStatus;
  result?: SBTMintResult;
  error?: string;
  message?: string;
  progress?: number;
  transactionHash?: string;
}


export class SBTService {
  private config: SBTServiceConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private provider?: ethers.JsonRpcProvider;

  constructor(config: SBTServiceConfig = {}) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      enableTestMode: false,
      enableRealData: true,
      enableMinting: true,
      ...config
    };

      this.initializeProvider();
  }

  private initializeProvider(): void {
    if (this.config.moonbeamConfig?.rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(this.config.moonbeamConfig.rpcUrl);
      console.log('[SBTService] Provider initialized for:', this.config.moonbeamConfig.network);
    }
  }

  /**
   * Detect if an address is Ethereum or Polkadot format
   */
  private detectAddressType(address: string): 'ethereum' | 'polkadot' | 'unknown' {
    if (address.startsWith('0x') && address.length === 42) {
      return 'ethereum';
    } else if (address.startsWith('1') && address.length >= 32) {
      return 'polkadot';
    }
    return 'unknown';
  }

  /**
   * Fetch SBT tokens for a wallet address
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

    try {
      console.log('Fetching REAL SBT data for wallet:', walletAddress);
      
      // Detect address type
      const addressType = this.detectAddressType(walletAddress);
      console.log('Detected address type:', addressType);
      
      let allTokens: SBTToken[] = [];
      
      if (addressType === 'ethereum') {
        // For Ethereum addresses, try to fetch from known SBT contracts
        for (const contractAddress of REAL_SBT_CONTRACTS.ethereum) {
          try {
            const contractTokens = await this.queryERC721Contract(
              contractAddress,
              walletAddress,
              'ethereum'
            );
            allTokens.push(...contractTokens);
          } catch (error) {
            console.warn(`Failed to query contract ${contractAddress}:`, error);
          }
        }
      }

      // If no tokens found, return empty array (no mock data)
      console.log('Total tokens found:', allTokens.length);

      // Cache the results
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: allTokens,
          timestamp: Date.now()
        });
      }

      return allTokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }
  }

  /**
   * Query an ERC-721 contract for tokens owned by an address
   */
  private async queryERC721Contract(
    contractAddress: string,
    walletAddress: string,
    network: string
  ): Promise<SBTToken[]> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const contract = new ethers.Contract(
        contractAddress,
        [
          'function balanceOf(address owner) view returns (uint256)',
          'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
          'function tokenURI(uint256 tokenId) view returns (string)',
          'function name() view returns (string)',
          'function symbol() view returns (string)'
        ],
        this.provider
      );

      const balance = await contract.balanceOf(walletAddress);
      const tokens: SBTToken[] = [];

      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          const tokenURI = await contract.tokenURI(tokenId);
          
          tokens.push({
            id: tokenId.toString(),
            name: `SBT #${tokenId}`,
            description: 'Soulbound Token',
            image: '',
            contractAddress,
            tokenURI,
            network,
            verificationStatus: 'verified' as SBTVerificationStatus,
            issuer: contractAddress,
            issuerName: 'Unknown Issuer',
            issuedAt: new Date().toISOString(),
            expiresAt: undefined,
            chainId: '1287', // Moonbase Alpha
            chainType: 'moonbeam',
            tokenStandard: 'ERC-721',
            revocable: false,
            metadata: {
              name: `SBT #${tokenId}`,
              description: 'Soulbound Token',
              image: ''
            }
          });
        } catch (error) {
          console.warn(`Failed to fetch token ${i} from contract ${contractAddress}:`, error);
        }
      }

      return tokens;
    } catch (error) {
      console.error(`Error querying contract ${contractAddress}:`, error);
      return [];
    }
  }

  /**
   * Get provider status
   */
  getProviderStatus(): { connected: boolean; network?: string; chainId?: number } {
    return {
      connected: !!this.provider,
      network: this.config.moonbeamConfig?.network,
      chainId: this.config.moonbeamConfig?.chainId
    };
  }

  /**
   * Check if minting is available
   */
  isMintingAvailable(): boolean {
    return (this.config.enableMinting ?? false) && !!this.provider;
  }

  /**
   * Get minting status
   */
  getMintingStatus(): SBTMintingStatus {
    return {
      status: 'pending'
    };
  }

  /**
   * Subscribe to minting status updates
   */
  onMintingStatusUpdate(callback: (status: SBTMintingStatus) => void): () => void {
    // For now, return a no-op unsubscribe function
    return () => {};
  }

  /**
   * Set contract address
   */
  setContract(contractAddress: string): void {
    // Store contract address for future use
    console.log('Contract address set:', contractAddress);
  }

  /**
   * Reset minting status
   */
  resetMintingStatus(): void {
    console.log('Minting status reset');
  }

  /**
   * Connect provider
   */
  async connectProvider(signer: ethers.Signer): Promise<boolean> {
    try {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
      await this.provider.getNetwork();
      console.log('[SBTService] Provider connected successfully');
      return true;
    } catch (error) {
      console.error('[SBTService] Failed to connect provider:', error);
      return false;
    }
  }

  /**
   * Disconnect provider
   */
  async disconnectProvider(): Promise<void> {
      console.log('[SBTService] Provider disconnected');
  }
  /**
   * Mint a new SBT
   */
  async mintSBT(request: SBTMintRequest, signer: ethers.Signer): Promise<SBTMintResult> {
    try {
    if (!this.config.enableMinting) {
      throw new Error('SBT minting is disabled');
    }

      console.log('Minting SBT:', request);

      const contract = new ethers.Contract(
        request.contractAddress,
        [
          'function mintSBT(address to, string memory metadataUri) external',
          'event SBTMinted(address indexed to, uint256 indexed tokenId, string metadataUri, uint256 timestamp)'
        ],
        signer
      );

      // For now, use a placeholder metadata URI
      const metadataUri = request.metadata ? JSON.stringify(request.metadata) : '';

      const tx = await contract.mintSBT(request.recipient, metadataUri);
      const receipt = await tx.wait();

      if (receipt && receipt.logs) {
        const log = receipt.logs.find((log: any) => log.topics[0] === contract.interface.getEvent('SBTMinted')?.topicHash);
        if (log) {
          const parsedLog = contract.interface.parseLog(log);
          const tokenId = parsedLog?.args.tokenId.toString();
          return {
            success: true,
            tokenId,
            txHash: receipt.hash,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber || 0,
            gasUsed: receipt.gasUsed || BigInt(0),
            metadataUri: metadataUri,
            contractAddress: request.contractAddress,
            recipient: request.recipient,
            mintedAt: new Date().toISOString()
          };
        }
      }

      return {
        success: true,
        tokenId: 'unknown',
        txHash: receipt.hash,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber || 0,
        gasUsed: receipt.gasUsed || BigInt(0),
        metadataUri: metadataUri,
        contractAddress: request.contractAddress,
        recipient: request.recipient,
        mintedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error minting SBT:', error);
      return {
        success: false,
        tokenId: '',
        txHash: '',
        transactionHash: '',
        blockNumber: 0,
        gasUsed: BigInt(0),
        metadataUri: '',
        contractAddress: request.contractAddress,
        recipient: request.recipient,
        mintedAt: new Date().toISOString()
      };
    }
  }
}

// Export a default instance with Moonbeam configuration
export const sbtService = new SBTService({
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableTestMode: false, // DISABLED - Use real data
  enableRealData: true, // ENABLED - Fetch real blockchain data
  enableMinting: true,
  moonbeamConfig: {
    rpcUrl: process.env.REACT_APP_MOONBEAM_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network',
    network: process.env.REACT_APP_MOONBEAM_NETWORK || 'moonbase-alpha',
    chainId: parseInt(process.env.REACT_APP_MOONBEAM_CHAIN_ID || '1287')
  }
}); 