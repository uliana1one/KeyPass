/**
 * Metadata Service
 * 
 * Service for handling SBT metadata creation, validation, IPFS uploads,
 * URI management, schema validation, and caching.
 */

import { createHelia } from 'helia';
import { UnixFS } from 'ipfs-unixfs';
import { 
  SBTTokenMetadata, 
  SBTTokenAttribute,
  SBTContractAddress 
} from '../contracts/types/SBTContractTypes.js';
import { MoonbeamErrorCode } from '../config/moonbeamConfig.js';
import { WalletError } from '../errors/WalletErrors.js';

/**
 * Custom error for Metadata Service operations
 */
export class MetadataServiceError extends WalletError {
  public readonly code: MoonbeamErrorCode;
  public readonly operation?: string;
  public readonly metadata?: any;

  constructor(
    message: string,
    code: MoonbeamErrorCode,
    operation?: string,
    metadata?: any,
    details?: any
  ) {
    super(message, code);
    this.code = code;
    this.operation = operation;
    this.metadata = metadata;
  }
}

/**
 * Interface for metadata validation result
 */
export interface MetadataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  schemaVersion?: string;
}

/**
 * Interface for IPFS upload result
 */
export interface IPFSUploadResult {
  cid: string;
  uri: string;
  size: number;
  uploadedAt: string;
  pinStatus?: 'pinned' | 'pending' | 'failed';
}

/**
 * Interface for metadata retrieval result
 */
export interface MetadataRetrievalResult {
  metadata: SBTTokenMetadata;
  uri: string;
  cid: string;
  size: number;
  retrievedAt: string;
  cached: boolean;
}

/**
 * Interface for cached metadata entry
 */
export interface CachedMetadataEntry {
  metadata: SBTTokenMetadata;
  uri: string;
  cid: string;
  size: number;
  cachedAt: string;
  accessCount: number;
  lastAccessed: string;
}

/**
 * Interface for metadata service configuration
 */
export interface MetadataServiceConfig {
  ipfsGateway: string;
  cacheSize: number;
  cacheTTL: number; // Time to live in milliseconds
  retryAttempts: number;
  retryDelay: number;
  validateSchema: boolean;
  pinMetadata: boolean;
}

/**
 * Default metadata service configuration
 */
const DEFAULT_CONFIG: MetadataServiceConfig = {
  ipfsGateway: 'https://ipfs.io/ipfs/',
  cacheSize: 1000,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  retryAttempts: 3,
  retryDelay: 1000,
  validateSchema: true,
  pinMetadata: false,
};

/**
 * SBT Metadata Schema for validation
 */
const SBT_METADATA_SCHEMA = {
  type: 'object',
  required: ['name', 'description', 'image'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    description: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
    image: {
      type: 'string',
      pattern: '^(https?://|ipfs://).*',
    },
    external_url: {
      type: 'string',
      pattern: '^https?://.*',
    },
    attributes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['trait_type', 'value'],
        properties: {
          trait_type: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
          },
          value: {
            oneOf: [
              { type: 'string', maxLength: 100 },
              { type: 'number' },
              { type: 'boolean' },
            ],
          },
          display_type: {
            type: 'string',
            enum: ['string', 'number', 'boost_number', 'boost_percentage', 'date'],
          },
          max_value: {
            type: 'number',
          },
        },
      },
    },
  },
};

/**
 * Metadata Service
 */
export class MetadataService {
  private ipfs: any;
  private unixfs: UnixFS | null = null;
  private config: MetadataServiceConfig;
  private cache: Map<string, CachedMetadataEntry>;
  private debugMode: boolean;

  constructor(config: Partial<MetadataServiceConfig> = {}, debugMode: boolean = false) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.debugMode = debugMode;
    this.initializeIPFS();
  }

  /**
   * Initialize IPFS client
   */
  private async initializeIPFS(): Promise<void> {
    try {
      if (this.debugMode) {
        console.log('[MetadataService] Initializing IPFS client...');
      }

      this.ipfs = await createHelia();
      this.unixfs = new UnixFS(this.ipfs);

      if (this.debugMode) {
        console.log('[MetadataService] IPFS client initialized successfully');
      }
    } catch (error) {
      const errorMessage = `Failed to initialize IPFS client: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[MetadataService] IPFS initialization error:', error);
      }

      throw new MetadataServiceError(
        errorMessage,
        MoonbeamErrorCode.IPFS_ERROR,
        'initializeIPFS',
        undefined,
        error
      );
    }
  }

  /**
   * Create SBT metadata with validation
   */
  public createMetadata(
    name: string,
    description: string,
    image: string,
    attributes: SBTTokenAttribute[] = [],
    externalUrl?: string
  ): SBTTokenMetadata {
    try {
      if (this.debugMode) {
        console.log('[MetadataService] Creating metadata:', { name, description, image });
      }

      const metadata: SBTTokenMetadata = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
        attributes: attributes.map(attr => ({
          trait_type: attr.trait_type.trim(),
          value: attr.value,
          display_type: attr.display_type,
          max_value: attr.max_value,
        })),
      };

      if (externalUrl) {
        metadata.external_url = externalUrl.trim();
      }

      // Validate metadata if schema validation is enabled
      if (this.config.validateSchema) {
        const validation = this.validateMetadata(metadata);
        if (!validation.isValid) {
          throw new MetadataServiceError(
            `Metadata validation failed: ${validation.errors.join(', ')}`,
            MoonbeamErrorCode.VALIDATION_ERROR,
            'createMetadata',
            metadata
          );
        }

        if (validation.warnings.length > 0 && this.debugMode) {
          console.warn('[MetadataService] Metadata validation warnings:', validation.warnings);
        }
      }

      if (this.debugMode) {
        console.log('[MetadataService] Metadata created successfully');
      }

      return metadata;
    } catch (error) {
      if (error instanceof MetadataServiceError) {
        throw error;
      }

      const errorMessage = `Failed to create metadata: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[MetadataService] Metadata creation error:', error);
      }

      throw new MetadataServiceError(
        errorMessage,
        MoonbeamErrorCode.VALIDATION_ERROR,
        'createMetadata',
        { name, description, image, attributes, externalUrl },
        error
      );
    }
  }

  /**
   * Validate metadata against SBT schema
   */
  public validateMetadata(metadata: SBTTokenMetadata): MetadataValidationResult {
    try {
      if (this.debugMode) {
        console.log('[MetadataService] Validating metadata...');
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required fields
      if (!metadata.name || metadata.name.trim().length === 0) {
        errors.push('Name is required and cannot be empty');
      } else if (metadata.name.length > 100) {
        errors.push('Name must be 100 characters or less');
      }

      if (!metadata.description || metadata.description.trim().length === 0) {
        errors.push('Description is required and cannot be empty');
      } else if (metadata.description.length > 500) {
        errors.push('Description must be 500 characters or less');
      }

      if (!metadata.image || metadata.image.trim().length === 0) {
        errors.push('Image is required and cannot be empty');
      } else if (!this.isValidUrl(metadata.image)) {
        errors.push('Image must be a valid HTTP/HTTPS or IPFS URL');
      }

      // Validate external URL if provided
      if (metadata.external_url) {
        if (!this.isValidUrl(metadata.external_url)) {
          errors.push('External URL must be a valid HTTP/HTTPS URL');
        }
      }

      // Validate attributes
      if (metadata.attributes) {
        if (!Array.isArray(metadata.attributes)) {
          errors.push('Attributes must be an array');
        } else {
          metadata.attributes.forEach((attr, index) => {
            if (!attr.trait_type || attr.trait_type.trim().length === 0) {
              errors.push(`Attribute ${index}: trait_type is required`);
            } else if (attr.trait_type.length > 50) {
              errors.push(`Attribute ${index}: trait_type must be 50 characters or less`);
            }

            if (attr.value === undefined || attr.value === null) {
              errors.push(`Attribute ${index}: value is required`);
            }

            if (attr.display_type && !['string', 'number', 'boost_number', 'boost_percentage', 'date'].includes(attr.display_type)) {
              warnings.push(`Attribute ${index}: display_type should be one of: string, number, boost_number, boost_percentage, date`);
            }

            if (attr.max_value !== undefined && typeof attr.max_value !== 'number') {
              errors.push(`Attribute ${index}: max_value must be a number`);
            }
          });
        }
      }

      const isValid = errors.length === 0;

      if (this.debugMode) {
        console.log('[MetadataService] Metadata validation result:', { isValid, errors, warnings });
      }

      return {
        isValid,
        errors,
        warnings,
        schemaVersion: '1.0.0',
      };
    } catch (error) {
      const errorMessage = `Failed to validate metadata: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[MetadataService] Metadata validation error:', error);
      }

      throw new MetadataServiceError(
        errorMessage,
        MoonbeamErrorCode.VALIDATION_ERROR,
        'validateMetadata',
        metadata,
        error
      );
    }
  }

  /**
   * Upload metadata to IPFS with retry logic
   */
  public async uploadMetadataToIPFS(metadata: SBTTokenMetadata): Promise<IPFSUploadResult> {
    try {
      if (!this.ipfs || !this.unixfs) {
        await this.initializeIPFS();
      }

      if (this.debugMode) {
        console.log('[MetadataService] Uploading metadata to IPFS...');
      }

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          // Convert metadata to JSON string
          const metadataJson = JSON.stringify(metadata, null, 2);
          const metadataBytes = new TextEncoder().encode(metadataJson);

          // Upload to IPFS
          const cid = await this.ipfs!.addBytes(metadataBytes);
          const uri = `ipfs://${cid}`;
          
          const result: IPFSUploadResult = {
            cid: cid.toString(),
            uri,
            size: metadataBytes.length,
            uploadedAt: new Date().toISOString(),
            pinStatus: this.config.pinMetadata ? 'pinned' : 'pending',
          };

          if (this.debugMode) {
            console.log('[MetadataService] Metadata uploaded successfully:', result);
          }

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          
          if (this.debugMode) {
            console.warn(`[MetadataService] Upload attempt ${attempt} failed:`, lastError.message);
          }

          // Wait before retry (exponential backoff)
          if (attempt < this.config.retryAttempts) {
            const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed
      throw new MetadataServiceError(
        `Failed to upload metadata to IPFS after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
        MoonbeamErrorCode.IPFS_ERROR,
        'uploadMetadataToIPFS',
        metadata,
        lastError
      );
    } catch (error) {
      if (error instanceof MetadataServiceError) {
        throw error;
      }

      const errorMessage = `Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[MetadataService] IPFS upload error:', error);
      }

      throw new MetadataServiceError(
        errorMessage,
        MoonbeamErrorCode.IPFS_ERROR,
        'uploadMetadataToIPFS',
        metadata,
        error
      );
    }
  }

  /**
   * Retrieve metadata from IPFS URI with caching
   */
  public async retrieveMetadata(uri: string): Promise<MetadataRetrievalResult> {
    try {
      if (this.debugMode) {
        console.log('[MetadataService] Retrieving metadata from URI:', uri);
      }

      // Check cache first
      const cachedEntry = this.cache.get(uri);
      if (cachedEntry && this.isCacheEntryValid(cachedEntry)) {
        // Update access statistics
        cachedEntry.accessCount++;
        cachedEntry.lastAccessed = new Date().toISOString();

        if (this.debugMode) {
          console.log('[MetadataService] Metadata retrieved from cache');
        }

        return {
          metadata: cachedEntry.metadata,
          uri: cachedEntry.uri,
          cid: cachedEntry.cid,
          size: cachedEntry.size,
          retrievedAt: new Date().toISOString(),
          cached: true,
        };
      }

      // Retrieve from IPFS
      const cid = this.extractCIDFromURI(uri);
      if (!cid) {
        throw new MetadataServiceError(
          'Invalid IPFS URI format',
          MoonbeamErrorCode.VALIDATION_ERROR,
          'retrieveMetadata',
          { uri }
        );
      }

      const metadataBytes = await this.retrieveFromIPFS(cid);
      const metadataJson = new TextDecoder().decode(metadataBytes);
      const metadata: SBTTokenMetadata = JSON.parse(metadataJson);

      // Cache the retrieved metadata
      this.cacheMetadata(uri, cid, metadata, metadataBytes.length);

      if (this.debugMode) {
        console.log('[MetadataService] Metadata retrieved from IPFS');
      }

      return {
        metadata,
        uri,
        cid,
        size: metadataBytes.length,
        retrievedAt: new Date().toISOString(),
        cached: false,
      };
    } catch (error) {
      if (error instanceof MetadataServiceError) {
        throw error;
      }

      const errorMessage = `Failed to retrieve metadata: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[MetadataService] Metadata retrieval error:', error);
      }

      throw new MetadataServiceError(
        errorMessage,
        MoonbeamErrorCode.IPFS_ERROR,
        'retrieveMetadata',
        { uri },
        error
      );
    }
  }

  /**
   * Retrieve data from IPFS with retry logic
   */
  private async retrieveFromIPFS(cid: string): Promise<Uint8Array> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        if (!this.ipfs) {
          await this.initializeIPFS();
        }

        const data = await this.ipfs!.get(cid);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (this.debugMode) {
          console.warn(`[MetadataService] IPFS retrieval attempt ${attempt} failed:`, lastError.message);
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new MetadataServiceError(
      `Failed to retrieve data from IPFS after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
      MoonbeamErrorCode.IPFS_ERROR,
      'retrieveFromIPFS',
      { cid },
      lastError
    );
  }

  /**
   * Cache metadata entry
   */
  private cacheMetadata(uri: string, cid: string, metadata: SBTTokenMetadata, size: number): void {
    // Check cache size limit
    if (this.cache.size >= this.config.cacheSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CachedMetadataEntry = {
      metadata,
      uri,
      cid,
      size,
      cachedAt: new Date().toISOString(),
      accessCount: 1,
      lastAccessed: new Date().toISOString(),
    };

    this.cache.set(uri, entry);

    if (this.debugMode) {
      console.log('[MetadataService] Metadata cached:', { uri, cid });
    }
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isCacheEntryValid(entry: CachedMetadataEntry): boolean {
    const now = new Date().getTime();
    const cachedAt = new Date(entry.cachedAt).getTime();
    return (now - cachedAt) < this.config.cacheTTL;
  }

  /**
   * Extract CID from IPFS URI
   */
  private extractCIDFromURI(uri: string): string | null {
    const ipfsMatch = uri.match(/^ipfs:\/\/(.+)$/);
    if (ipfsMatch) {
      return ipfsMatch[1];
    }

    // Handle gateway URLs
    const gatewayMatch = uri.match(/\/ipfs\/(.+)$/);
    if (gatewayMatch) {
      return gatewayMatch[1];
    }

    return null;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      if (url.startsWith('ipfs://')) {
        return true;
      }
      
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get metadata service status
   */
  public getStatus(): {
    ipfsInitialized: boolean;
    cacheSize: number;
    cacheEntries: number;
    config: MetadataServiceConfig;
    debugMode: boolean;
  } {
    return {
      ipfsInitialized: !!this.ipfs && !!this.unixfs,
      cacheSize: this.config.cacheSize,
      cacheEntries: this.cache.size,
      config: { ...this.config },
      debugMode: this.debugMode,
    };
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number;
    totalAccessCount: number;
    averageAccessCount: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccessCount = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const averageAccessCount = entries.length > 0 ? totalAccessCount / entries.length : 0;
    
    const sortedEntries = entries.sort((a, b) => 
      new Date(a.cachedAt).getTime() - new Date(b.cachedAt).getTime()
    );

    return {
      totalEntries: entries.length,
      totalAccessCount,
      averageAccessCount,
      oldestEntry: sortedEntries.length > 0 ? sortedEntries[0].cachedAt : null,
      newestEntry: sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].cachedAt : null,
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    
    if (this.debugMode) {
      console.log('[MetadataService] Cache cleared');
    }
  }

  /**
   * Set debug mode
   */
  public setDebugMode(debug: boolean): void {
    this.debugMode = debug;
    
    if (this.debugMode) {
      console.log('[MetadataService] Debug mode enabled');
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MetadataServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.debugMode) {
      console.log('[MetadataService] Configuration updated:', newConfig);
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.ipfs) {
        await this.ipfs.stop();
        this.ipfs = null;
        this.unixfs = null;
      }

      this.cache.clear();

      if (this.debugMode) {
        console.log('[MetadataService] Resources cleaned up successfully');
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('[MetadataService] Cleanup error:', error);
      }
    }
  }
}
