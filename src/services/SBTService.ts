/**
 * SBT (Soulbound Token) Service Layer
 * 
 * This service provides functionality to fetch SBTs from blockchain networks,
 * with caching, error handling, and support for multiple chains.
 * 
 * @see ../types/sbt.ts
 */

import {
  SBTToken,
  SBTCollection,
  SBTChainType,
  SBTTokenStandard,
  SBTVerificationStatus,
  SBTFilterOptions,
  SBTQueryResult,
  SBTVerificationRequest,
  SBTVerificationResult,
  SBTIssuanceRequest,
} from '../types/sbt.js';
import { SBTMintingService, SBTMintingResult, SBTMintingServiceError } from './SBTMintingService.js';
import { MoonbeamAdapter } from '../adapters/MoonbeamAdapter.js';
import { SBTContractAddress } from '../contracts/types/SBTContractTypes.js';
import { Signer } from 'ethers';

/**
 * Interface for blockchain provider configuration
 */
export interface BlockchainProviderConfig {
  /** Provider URL (e.g., RPC endpoint) */
  url: string;
  /** Chain ID */
  chainId: string;
  /** Chain type */
  chainType: SBTChainType;
  /** API key for the provider (optional) */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retries for failed requests */
  maxRetries?: number;
}

/**
 * Interface for cache configuration
 */
export interface CacheConfig {
  /** Cache TTL in milliseconds */
  ttl: number;
  /** Maximum number of items in cache */
  maxSize: number;
  /** Whether to enable cache */
  enabled: boolean;
}

/**
 * Interface for SBT minting request
 */
export interface SBTMintRequest {
  /** Contract address to mint from */
  contractAddress: SBTContractAddress;
  /** Recipient address */
  recipient: SBTContractAddress;
  /** Token metadata */
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number | boolean;
    }>;
  };
  /** Token metadata URI (alternative to metadata object) */
  tokenURI?: string;
  /** Gas limit for the transaction */
  gasLimit?: bigint;
  /** Gas price for the transaction */
  gasPrice?: bigint;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: bigint;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: bigint;
}

/**
 * Interface for SBT minting result
 */
export interface SBTMintResult {
  /** Token ID of the minted SBT */
  tokenId: string;
  /** Transaction hash */
  transactionHash: string;
  /** Block number where transaction was mined */
  blockNumber: number;
  /** Gas used for the transaction */
  gasUsed: bigint;
  /** Metadata URI of the minted token */
  metadataUri: string;
  /** Contract address */
  contractAddress: SBTContractAddress;
  /** Recipient address */
  recipient: SBTContractAddress;
  /** Timestamp when the token was minted */
  mintedAt: string;
}

/**
 * Interface for SBT service configuration
 */
export interface SBTServiceConfig {
  /** Blockchain provider configurations */
  providers: Record<SBTChainType, BlockchainProviderConfig>;
  /** Cache configuration */
  cache: CacheConfig;
  /** Default timeout for requests */
  defaultTimeout: number;
  /** Whether to enable debug logging */
  debug: boolean;
  /** Moonbeam adapter configuration */
  moonbeamAdapter?: {
    /** RPC URL for Moonbeam network */
    rpcUrl: string;
    /** Network name */
    network: string;
    /** Chain ID */
    chainId: number;
  };
}

/**
 * Custom error for SBT service operations
 */
export class SBTServiceError extends Error {
  public readonly code: string;
  public readonly chainType?: SBTChainType;
  public readonly contractAddress?: string;

  constructor(
    message: string,
    code: string,
    chainType?: SBTChainType,
    contractAddress?: string
  ) {
    super(message);
    this.name = 'SBTServiceError';
    this.code = code;
    this.chainType = chainType;
    this.contractAddress = contractAddress;
  }
}

/**
 * Cache implementation for SBT data
 */
class SBTCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(config: CacheConfig) {
    this.ttl = config.ttl;
    this.maxSize = config.maxSize;
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T): void {
    // Evict oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Blockchain provider interface
 */
interface BlockchainProvider {
  /**
   * Get SBT tokens for an address
   */
  getTokens(address: string, options?: SBTFilterOptions): Promise<SBTToken[]>;

  /**
   * Get SBT collections for an address
   */
  getCollections(address: string): Promise<SBTCollection[]>;

  /**
   * Get token metadata
   */
  getTokenMetadata(tokenId: string, contractAddress: string): Promise<any>;

  /**
   * Verify token ownership
   */
  verifyTokenOwnership(tokenId: string, address: string, contractAddress: string): Promise<boolean>;

  /**
   * Get token balance
   */
  getTokenBalance(address: string, contractAddress: string): Promise<number>;
}

/**
 * Moonbeam blockchain provider implementation
 */
class MoonbeamProvider implements BlockchainProvider {
  private readonly config: BlockchainProviderConfig;
  private readonly debug: boolean;

  constructor(config: BlockchainProviderConfig, debug: boolean = false) {
    this.config = config;
    this.debug = debug;
  }

  private async _simulateOrFetch<T>(value: T): Promise<T> {
    return value;
  }

  async getTokens(address: string, options?: SBTFilterOptions): Promise<SBTToken[]> {
    try {
      if (this.debug) {
        console.debug(`[MoonbeamProvider] Fetching tokens for address: ${address}`);
      }
      // Simulate fetch
      return await this._simulateOrFetch([]);
    } catch (error) {
      throw new SBTServiceError(
        `Failed to fetch tokens from Moonbeam: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MOONBEAM_FETCH_ERROR',
        SBTChainType.MOONBEAM
      );
    }
  }

  async getCollections(address: string): Promise<SBTCollection[]> {
    try {
      if (this.debug) {
        console.debug(`[MoonbeamProvider] Fetching collections for address: ${address}`);
      }
      // Simulate fetch
      return await this._simulateOrFetch([]);
    } catch (error) {
      throw new SBTServiceError(
        `Failed to fetch collections from Moonbeam: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MOONBEAM_COLLECTIONS_ERROR',
        SBTChainType.MOONBEAM
      );
    }
  }

  async getTokenMetadata(tokenId: string, contractAddress: string): Promise<any> {
    try {
      if (this.debug) {
        console.debug(`[MoonbeamProvider] Fetching metadata for token ${tokenId} at ${contractAddress}`);
      }
      // Simulate fetch
      return await this._simulateOrFetch({});
    } catch (error) {
      throw new SBTServiceError(
        `Failed to fetch token metadata from Moonbeam: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MOONBEAM_METADATA_ERROR',
        SBTChainType.MOONBEAM,
        contractAddress
      );
    }
  }

  async verifyTokenOwnership(tokenId: string, address: string, contractAddress: string): Promise<boolean> {
    try {
      if (this.debug) {
        console.debug(`[MoonbeamProvider] Verifying ownership of token ${tokenId} for ${address}`);
      }
      // Simulate fetch
      return await this._simulateOrFetch(true);
    } catch (error) {
      throw new SBTServiceError(
        `Failed to verify token ownership on Moonbeam: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MOONBEAM_OWNERSHIP_ERROR',
        SBTChainType.MOONBEAM,
        contractAddress
      );
    }
  }

  async getTokenBalance(address: string, contractAddress: string): Promise<number> {
    try {
      if (this.debug) {
        console.debug(`[MoonbeamProvider] Getting token balance for ${address} at ${contractAddress}`);
      }
      // Simulate fetch
      return await this._simulateOrFetch(0);
    } catch (error) {
      throw new SBTServiceError(
        `Failed to get token balance from Moonbeam: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MOONBEAM_BALANCE_ERROR',
        SBTChainType.MOONBEAM,
        contractAddress
      );
    }
  }
}

/**
 * Main SBT Service class
 */
export class SBTService {
  private readonly config: SBTServiceConfig;
  private readonly cache: SBTCache;
  private readonly providers: Map<SBTChainType, BlockchainProvider>;
  private readonly mintingService: SBTMintingService | null = null;
  private readonly moonbeamAdapter: MoonbeamAdapter | null = null;

  constructor(config: SBTServiceConfig) {
    this.config = config;
    this.cache = new SBTCache(config.cache);
    this.providers = new Map();

    // Initialize Moonbeam adapter and minting service if configured
    if (config.moonbeamAdapter) {
      try {
        // Import MoonbeamNetwork enum synchronously
        const { MoonbeamNetwork } = require('../config/moonbeamConfig.js');
        
        // Map network name to MoonbeamNetwork enum
        let network: any = MoonbeamNetwork.MOONBASE_ALPHA; // default
        if (config.moonbeamAdapter.network === 'moonbeam') {
          network = MoonbeamNetwork.MOONBEAM;
        } else if (config.moonbeamAdapter.network === 'moonriver') {
          network = MoonbeamNetwork.MOONRIVER;
        }
        
        this.moonbeamAdapter = new MoonbeamAdapter(network);
        
        this.mintingService = new SBTMintingService(this.moonbeamAdapter, {}, config.debug);

        if (config.debug) {
          console.debug('[SBTService] Moonbeam adapter and minting service initialized');
        }
      } catch (error) {
        if (config.debug) {
          console.warn('[SBTService] Failed to initialize Moonbeam adapter:', error);
        }
      }
    }

    // Initialize providers
    Object.entries(config.providers).forEach(([chainType, providerConfig]) => {
      // Skip undefined provider configs
      if (!providerConfig) {
        if (config.debug) {
          console.warn(`[SBTService] Skipping undefined provider config for chain type: ${chainType}`);
        }
        return;
      }

      switch (chainType as SBTChainType) {
        case SBTChainType.MOONBEAM:
          this.providers.set(
            SBTChainType.MOONBEAM,
            new MoonbeamProvider(providerConfig, config.debug)
          );
          break;
        // Add other chain providers here
        default:
          if (config.debug) {
            console.warn(`[SBTService] No provider implementation for chain type: ${chainType}`);
          }
      }
    });
  }

  /**
   * Get SBT tokens for an address with caching and error handling
   */
  async getTokens(address: string, options?: SBTFilterOptions): Promise<SBTToken[]> {
    const cacheKey = `tokens:${address}:${JSON.stringify(options || {})}`;
    
    try {
      // Check cache first
      if (this.config.cache.enabled) {
        const cached = this.cache.get<SBTToken[]>(cacheKey);
        if (cached) {
          if (this.config.debug) {
            console.debug(`[SBTService] Cache hit for tokens: ${address}`);
          }
          return cached;
        }
      }

      if (this.config.debug) {
        console.debug(`[SBTService] Fetching tokens for address: ${address}`);
      }

      // Fetch from all available chains
      const allTokens: SBTToken[] = [];
      
      for (const [chainType, provider] of this.providers) {
        try {
          const tokens = await provider.getTokens(address, options);
          allTokens.push(...tokens);
        } catch (error) {
          if (this.config.debug) {
            console.warn(`[SBTService] Failed to fetch tokens from ${chainType}:`, error);
          }
          // Continue with other providers
        }
      }

      // Apply filters if provided
      const filteredTokens = this.applyFilters(allTokens, options);

      // Cache the result
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, filteredTokens);
      }

      return filteredTokens;
    } catch (error) {
      throw new SBTServiceError(
        `Failed to get tokens for address ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOKENS_FETCH_ERROR'
      );
    }
  }

  /**
   * Get SBT collections for an address
   */
  async getCollections(address: string): Promise<SBTCollection[]> {
    const cacheKey = `collections:${address}`;
    
    try {
      // Check cache first
      if (this.config.cache.enabled) {
        const cached = this.cache.get<SBTCollection[]>(cacheKey);
        if (cached) {
          if (this.config.debug) {
            console.debug(`[SBTService] Cache hit for collections: ${address}`);
          }
          return cached;
        }
      }

      if (this.config.debug) {
        console.debug(`[SBTService] Fetching collections for address: ${address}`);
      }

      // Fetch from all available chains
      const allCollections: SBTCollection[] = [];
      
      for (const [chainType, provider] of this.providers) {
        try {
          const collections = await provider.getCollections(address);
          allCollections.push(...collections);
        } catch (error) {
          if (this.config.debug) {
            console.warn(`[SBTService] Failed to fetch collections from ${chainType}:`, error);
          }
          // Continue with other providers
        }
      }

      // Cache the result
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, allCollections);
      }

      return allCollections;
    } catch (error) {
      throw new SBTServiceError(
        `Failed to get collections for address ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'COLLECTIONS_FETCH_ERROR'
      );
    }
  }

  /**
   * Verify SBT token
   */
  async verifyToken(request: SBTVerificationRequest): Promise<SBTVerificationResult> {
    try {
      if (this.config.debug) {
        console.debug(`[SBTService] Verifying token: ${request.tokenId}`);
      }

      // Find the appropriate provider for the chain
      // For now, we'll map chainId to chainType - in a real implementation,
      // you'd want a proper mapping or include chainType in the request
      let chainType: SBTChainType;
      switch (request.chainId) {
        case '1284': // Moonbeam
          chainType = SBTChainType.MOONBEAM;
          break;
        case '1': // Ethereum mainnet
          chainType = SBTChainType.ETHEREUM;
          break;
        case '0': // Polkadot
          chainType = SBTChainType.POLKADOT;
          break;
        case '2': // Kusama
          chainType = SBTChainType.KUSAMA;
          break;
        default:
          return {
            success: false,
            status: SBTVerificationStatus.FAILED,
            verifiedAt: new Date().toISOString(),
            error: `Unsupported chain ID: ${request.chainId}`,
          };
      }

      const provider = this.providers.get(chainType);
      if (!provider) {
        return {
          success: false,
          status: SBTVerificationStatus.FAILED,
          verifiedAt: new Date().toISOString(),
          error: `No provider available for chain type: ${chainType}`,
        };
      }

      // Verify token ownership
      const isOwner = await provider.verifyTokenOwnership(
        request.tokenId,
        request.contractAddress, // This should be the owner address
        request.contractAddress
      );

      return {
        success: isOwner,
        status: isOwner ? SBTVerificationStatus.VERIFIED : SBTVerificationStatus.FAILED,
        verifiedAt: new Date().toISOString(),
        proof: request.proof,
      };
    } catch (error) {
      return {
        success: false,
        status: SBTVerificationStatus.FAILED,
        verifiedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenId: string, contractAddress: string, chainType: SBTChainType): Promise<any> {
    const cacheKey = `metadata:${chainType}:${contractAddress}:${tokenId}`;
    
    try {
      // Check cache first
      if (this.config.cache.enabled) {
        const cached = this.cache.get<any>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const provider = this.providers.get(chainType);
      if (!provider) {
        throw new SBTServiceError(
          `No provider available for chain type: ${chainType}`,
          'PROVIDER_NOT_FOUND'
        );
      }

      const metadata = await provider.getTokenMetadata(tokenId, contractAddress);

      // Cache the result
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, metadata);
      }

      return metadata;
    } catch (error) {
      throw new SBTServiceError(
        `Failed to get token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'METADATA_FETCH_ERROR',
        chainType,
        contractAddress
      );
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    if (this.config.debug) {
      console.debug('[SBTService] Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return this.cache.getStats();
  }

  /**
   * Mint SBT token using real blockchain integration
   */
  async mintSBT(
    request: SBTMintRequest,
    signer: Signer
  ): Promise<SBTMintResult> {
    try {
      if (!this.mintingService) {
        throw new SBTServiceError(
          'SBT minting service is not available. Please configure Moonbeam adapter.',
          'MINTING_SERVICE_NOT_AVAILABLE'
        );
      }

      if (!this.moonbeamAdapter) {
        throw new SBTServiceError(
          'Moonbeam adapter is not available. Please configure Moonbeam adapter.',
          'MOONBEAM_ADAPTER_NOT_AVAILABLE'
        );
      }

      if (this.config.debug) {
        console.debug('[SBTService] Starting SBT minting process...');
        console.debug('[SBTService] Mint request:', {
          contractAddress: request.contractAddress,
          recipient: request.recipient,
          hasMetadata: !!request.metadata,
          hasTokenURI: !!request.tokenURI,
        });
      }

      // Convert SBTMintRequest to SBTMintParams format expected by SBTMintingService
      const mintParams = {
        to: request.recipient,
        tokenURI: request.tokenURI,
        metadata: request.metadata,
        gasLimit: request.gasLimit,
        gasPrice: request.gasPrice,
        maxFeePerGas: request.maxFeePerGas,
        maxPriorityFeePerGas: request.maxPriorityFeePerGas,
      };

      // Call the real minting service
      const result: SBTMintingResult = await this.mintingService.mintSBT(
        request.contractAddress,
        mintParams,
        signer
      );

      if (this.config.debug) {
        console.debug('[SBTService] SBT minting completed successfully:', {
          tokenId: result.tokenId,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
        });
      }

      // Convert SBTMintingResult to SBTMintResult format
      const mintResult: SBTMintResult = {
        tokenId: result.tokenId.toString(),
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        metadataUri: result.metadataUri,
        contractAddress: result.contractAddress,
        recipient: result.recipient,
        mintedAt: result.mintedAt,
      };

      return mintResult;
    } catch (error) {
      // Handle SBTMintingServiceError specifically
      if (error instanceof SBTMintingServiceError) {
        throw new SBTServiceError(
          `SBT minting failed: ${error.message}`,
          'MINTING_FAILED',
          SBTChainType.MOONBEAM,
          request.contractAddress
        );
      }

      // Handle other errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new SBTServiceError(
        `SBT minting failed: ${errorMessage}`,
        'MINTING_FAILED',
        SBTChainType.MOONBEAM,
        request.contractAddress
      );
    }
  }

  /**
   * Check if SBT minting is available
   */
  isMintingAvailable(): boolean {
    return this.mintingService !== null && this.moonbeamAdapter !== null;
  }

  /**
   * Get Moonbeam adapter status
   */
  getMoonbeamAdapterStatus(): {
    available: boolean;
    connected: boolean;
    network?: string;
  } {
    if (!this.moonbeamAdapter) {
      return {
        available: false,
        connected: false,
      };
    }

    return {
      available: true,
      connected: this.moonbeamAdapter.isConnected(),
      network: this.moonbeamAdapter.getCurrentNetwork(),
    };
  }

  /**
   * Connect to Moonbeam network
   */
  async connectToMoonbeam(): Promise<boolean> {
    if (!this.moonbeamAdapter) {
      throw new SBTServiceError(
        'Moonbeam adapter is not available',
        'MOONBEAM_ADAPTER_NOT_AVAILABLE'
      );
    }

    try {
      await this.moonbeamAdapter.connect();
      
      if (this.config.debug) {
        console.debug('[SBTService] Connected to Moonbeam network');
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new SBTServiceError(
        `Failed to connect to Moonbeam: ${errorMessage}`,
        'MOONBEAM_CONNECTION_FAILED'
      );
    }
  }

  /**
   * Disconnect from Moonbeam network
   */
  async disconnectFromMoonbeam(): Promise<void> {
    if (!this.moonbeamAdapter) {
      return;
    }

    try {
      await this.moonbeamAdapter.disconnect();
      
      if (this.config.debug) {
        console.debug('[SBTService] Disconnected from Moonbeam network');
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn('[SBTService] Error disconnecting from Moonbeam:', error);
      }
    }
  }

  /**
   * Apply filters to tokens
   */
  private applyFilters(tokens: SBTToken[], options?: SBTFilterOptions): SBTToken[] {
    if (!options) return tokens;

    return tokens.filter(token => {
      // Filter by collection ID
      if (options.collectionId && token.collectionId !== options.collectionId) {
        return false;
      }

      // Filter by issuer
      if (options.issuer && token.issuer !== options.issuer) {
        return false;
      }

      // Filter by verification status
      if (options.verificationStatus && token.verificationStatus !== options.verificationStatus) {
        return false;
      }

      // Filter by chain type
      if (options.chainType && token.chainType !== options.chainType) {
        return false;
      }

      // Filter by tags
      if (options.tags && options.tags.length > 0) {
        if (!token.tags || !options.tags.some(tag => token.tags!.includes(tag))) {
          return false;
        }
      }

      // Filter by attribute
      if (options.attribute) {
        if (!token.attributes || !token.attributes.some(attr => 
          attr.trait_type === options.attribute!.trait_type && 
          attr.value === options.attribute!.value
        )) {
          return false;
        }
      }

      // Filter revoked tokens
      if (!options.includeRevoked && token.verificationStatus === SBTVerificationStatus.REVOKED) {
        return false;
      }

      // Filter expired tokens
      if (!options.includeExpired && token.expiresAt && new Date(token.expiresAt) < new Date()) {
        return false;
      }

      return true;
    });
  }
}

export { MoonbeamProvider, SBTCache }; 