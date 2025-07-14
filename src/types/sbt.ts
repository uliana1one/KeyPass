/**
 * SBT (Soulbound Token) Types and Interfaces
 * 
 * This module defines TypeScript interfaces for Soulbound Tokens following
 * industry best practices and W3C standards for verifiable credentials.
 * 
 * @see https://w3c-ccg.github.io/vc-ed-models/
 * @see https://eips.ethereum.org/EIPS/eip-721
 */

/**
 * Enum representing supported blockchain networks for SBTs
 */
export const SBTChainType = {
  /** Ethereum Mainnet */
  ETHEREUM: 'ethereum',
  /** Moonbeam (Ethereum-compatible Polkadot parachain) */
  MOONBEAM: 'moonbeam',
  /** Polkadot mainnet */
  POLKADOT: 'polkadot',
  /** Kusama network */
  KUSAMA: 'kusama',
} as const;

export type SBTChainType = (typeof SBTChainType)[keyof typeof SBTChainType];

/**
 * Enum representing SBT token standards
 */
export const SBTTokenStandard = {
  /** ERC-721 Non-Transferable (Soulbound) */
  ERC721_SOULBOUND: 'erc721-soulbound',
  /** ERC-1155 Non-Transferable */
  ERC1155_SOULBOUND: 'erc1155-soulbound',
  /** Polkadot NFT standard */
  POLKADOT_NFT: 'polkadot-nft',
} as const;

export type SBTTokenStandard = (typeof SBTTokenStandard)[keyof typeof SBTTokenStandard];

/**
 * Enum representing verification status of SBTs
 */
export const SBTVerificationStatus = {
  /** Token is verified and valid */
  VERIFIED: 'verified',
  /** Token is pending verification */
  PENDING: 'pending',
  /** Token verification failed */
  FAILED: 'failed',
  /** Token is revoked */
  REVOKED: 'revoked',
  /** Token verification status unknown */
  UNKNOWN: 'unknown',
} as const;

export type SBTVerificationStatus = (typeof SBTVerificationStatus)[keyof typeof SBTVerificationStatus];

/**
 * Interface representing SBT token attributes following ERC-721 metadata standards
 * @see https://eips.ethereum.org/EIPS/eip-721
 */
export interface SBTTokenAttribute {
  /** The trait type (e.g., "Student Status", "Age Group") */
  trait_type: string;
  /** The trait value (e.g., "Active", "18-25") */
  value: string | number | boolean;
  /** Optional display type for the trait */
  display_type?: string;
  /** Optional maximum value for numeric traits */
  max_value?: number;
}

/**
 * Interface representing SBT token metadata following ERC-721 standards
 */
export interface SBTTokenMetadata {
  /** Token name */
  name: string;
  /** Token description */
  description: string;
  /** Token image URI */
  image: string;
  /** Token external URI for additional information */
  external_url?: string;
  /** Token attributes/traits */
  attributes?: SBTTokenAttribute[];
  /** Token background color (hex) */
  background_color?: string;
  /** Token animation URL (for animated tokens) */
  animation_url?: string;
  /** Token YouTube URL */
  youtube_url?: string;
  /** Additional metadata */
  [key: string]: any;
}

/**
 * Interface representing an SBT token following industry best practices
 */
export interface SBTToken {
  /** Unique token identifier */
  id: string;
  /** Token name */
  name: string;
  /** Token description */
  description: string;
  /** Token image URI */
  image: string;
  /** Token issuer (DID or address) */
  issuer: string;
  /** Token issuer name for display */
  issuerName: string;
  /** Token issuance timestamp (ISO 8601) */
  issuedAt: string;
  /** Token expiration timestamp (ISO 8601, optional) */
  expiresAt?: string;
  /** Blockchain network */
  chainId: string;
  /** Chain type */
  chainType: SBTChainType;
  /** Smart contract address */
  contractAddress: string;
  /** Token standard */
  tokenStandard: SBTTokenStandard;
  /** Token metadata URI */
  tokenUri?: string;
  /** Token metadata */
  metadata?: SBTTokenMetadata;
  /** Verification status */
  verificationStatus: SBTVerificationStatus;
  /** Token attributes for filtering and display */
  attributes?: SBTTokenAttribute[];
  /** Whether the token is revocable */
  revocable: boolean;
  /** Revocation timestamp if revoked (ISO 8601) */
  revokedAt?: string;
  /** Token collection ID */
  collectionId?: string;
  /** Token rarity score (0-100) */
  rarityScore?: number;
  /** Token tags for categorization */
  tags?: string[];
  /** Additional properties */
  [key: string]: any;
}

/**
 * Interface representing an SBT collection
 */
export interface SBTCollection {
  /** Unique collection identifier */
  id: string;
  /** Collection name */
  name: string;
  /** Collection description */
  description: string;
  /** Collection image URI */
  image: string;
  /** Collection banner image URI */
  bannerImage?: string;
  /** Collection issuer (DID or address) */
  issuer: string;
  /** Collection issuer name for display */
  issuerName: string;
  /** Smart contract address */
  contractAddress: string;
  /** Blockchain network */
  chainId: string;
  /** Chain type */
  chainType: SBTChainType;
  /** Token standard */
  tokenStandard: SBTTokenStandard;
  /** Total supply of tokens in collection */
  totalSupply: number;
  /** Number of unique holders */
  uniqueHolders: number;
  /** Collection creation timestamp (ISO 8601) */
  createdAt: string;
  /** Collection verification status */
  verificationStatus: SBTVerificationStatus;
  /** Collection tags for categorization */
  tags?: string[];
  /** Collection website URL */
  website?: string;
  /** Collection social media links */
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    github?: string;
  };
  /** Collection tokens */
  tokens: SBTToken[];
}

/**
 * Interface representing SBT issuance request
 */
export interface SBTIssuanceRequest {
  /** Recipient address */
  recipientAddress: string;
  /** Collection ID */
  collectionId: string;
  /** Token metadata */
  metadata: SBTTokenMetadata;
  /** Issuance timestamp (ISO 8601) */
  issuedAt: string;
  /** Expiration timestamp (ISO 8601, optional) */
  expiresAt?: string;
  /** Whether the token is revocable */
  revocable?: boolean;
  /** Token tags */
  tags?: string[];
}

/**
 * Interface representing SBT verification request
 */
export interface SBTVerificationRequest {
  /** Token ID */
  tokenId: string;
  /** Contract address */
  contractAddress: string;
  /** Chain ID */
  chainId: string;
  /** Verification proof (optional for zk-proofs) */
  proof?: string;
}

/**
 * Interface representing SBT verification result
 */
export interface SBTVerificationResult {
  /** Whether verification was successful */
  success: boolean;
  /** Verification status */
  status: SBTVerificationStatus;
  /** Verification timestamp (ISO 8601) */
  verifiedAt: string;
  /** Verification proof */
  proof?: string;
  /** Error message if verification failed */
  error?: string;
}

/**
 * Interface representing SBT filter options for querying
 */
export interface SBTFilterOptions {
  /** Filter by collection ID */
  collectionId?: string;
  /** Filter by issuer */
  issuer?: string;
  /** Filter by verification status */
  verificationStatus?: SBTVerificationStatus;
  /** Filter by chain type */
  chainType?: SBTChainType;
  /** Filter by tags */
  tags?: string[];
  /** Filter by attribute */
  attribute?: {
    trait_type: string;
    value: string | number | boolean;
  };
  /** Whether to include revoked tokens */
  includeRevoked?: boolean;
  /** Whether to include expired tokens */
  includeExpired?: boolean;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Interface representing SBT query result with pagination
 */
export interface SBTQueryResult {
  /** List of SBT tokens */
  tokens: SBTToken[];
  /** Total count of tokens matching the filter */
  totalCount: number;
  /** Current page number */
  page: number;
  /** Number of tokens per page */
  pageSize: number;
  /** Whether there are more results */
  hasMore: boolean;
} 