/**
 * SBT Contract Types and Constants
 * 
 * This module provides TypeScript types, interfaces, and constants for
 * SBT (Soulbound Token) contract interactions.
 */

/**
 * SBT Contract ABI - ERC-721 based with soulbound modifications
 */
export const SBTContractABI = [
  // ERC-721 Standard Methods
  {
    inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
    name: 'safeMint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'string', name: 'uri', type: 'string' },
    ],
    name: 'mint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'tokenByIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // SBT-Specific Methods
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'revoke',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'isRevoked',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'tokensOfOwner',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getTokenMetadata',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'string', name: 'image', type: 'string' },
          { internalType: 'string', name: 'external_url', type: 'string' },
          { internalType: 'string[]', name: 'attributes', type: 'string[]' },
        ],
        internalType: 'struct SBTContract.TokenMetadata',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'approved', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
    ],
    name: 'TokenRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'tokenURI', type: 'string' },
    ],
    name: 'TokenMinted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'TokenBurned',
    type: 'event',
  },
] as const;

/**
 * SBT Contract Address type
 */
export type SBTContractAddress = `0x${string}`;

/**
 * SBT Mint Parameters interface
 */
export interface SBTMintParams {
  /** Recipient address for the SBT */
  to: SBTContractAddress;
  /** Token metadata URI (optional) */
  tokenURI?: string;
  /** Token metadata object (optional, will be converted to URI) */
  metadata?: SBTTokenMetadata;
  /** Gas limit for the transaction (optional) */
  gasLimit?: bigint;
  /** Gas price for the transaction (optional) */
  gasPrice?: bigint;
  /** Maximum fee per gas (EIP-1559, optional) */
  maxFeePerGas?: bigint;
  /** Maximum priority fee per gas (EIP-1559, optional) */
  maxPriorityFeePerGas?: bigint;
  /** Transaction value in wei (optional) */
  value?: bigint;
}

/**
 * SBT Token Metadata interface
 */
export interface SBTTokenMetadata {
  /** Token name */
  name: string;
  /** Token description */
  description: string;
  /** Token image URI */
  image: string;
  /** External URL for additional information */
  external_url?: string;
  /** Token attributes */
  attributes?: SBTTokenAttribute[];
  /** Additional properties */
  [key: string]: any;
}

/**
 * SBT Token Attribute interface
 */
export interface SBTTokenAttribute {
  /** Attribute trait type */
  trait_type: string;
  /** Attribute value */
  value: string | number | boolean;
  /** Display type for the attribute */
  display_type?: string;
  /** Maximum value for numeric attributes */
  max_value?: number;
}

/**
 * SBT Events interface
 */
export interface SBTEvents {
  /** Transfer event */
  Transfer: {
    from: SBTContractAddress;
    to: SBTContractAddress;
    tokenId: bigint;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
  };
  
  /** Approval event */
  Approval: {
    owner: SBTContractAddress;
    approved: SBTContractAddress;
    tokenId: bigint;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
  };
  
  /** ApprovalForAll event */
  ApprovalForAll: {
    owner: SBTContractAddress;
    operator: SBTContractAddress;
    approved: boolean;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
  };
  
  /** TokenRevoked event */
  TokenRevoked: {
    tokenId: bigint;
    reason: string;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
  };
  
  /** TokenMinted event */
  TokenMinted: {
    to: SBTContractAddress;
    tokenId: bigint;
    tokenURI: string;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
  };
  
  /** TokenBurned event */
  TokenBurned: {
    from: SBTContractAddress;
    tokenId: bigint;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
  };
}

/**
 * SBT Contract Error Types
 */
export enum SBTContractErrorType {
  /** Contract not found or invalid address */
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  /** Invalid contract address format */
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  /** Contract method call failed */
  METHOD_CALL_FAILED = 'METHOD_CALL_FAILED',
  /** Transaction failed */
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  /** Insufficient gas */
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  /** Insufficient funds */
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  /** Token not found */
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  /** Unauthorized operation */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** Token already exists */
  TOKEN_EXISTS = 'TOKEN_EXISTS',
  /** Token is revoked */
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  /** Invalid token ID */
  INVALID_TOKEN_ID = 'INVALID_TOKEN_ID',
  /** Invalid recipient address */
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  /** Contract not deployed */
  CONTRACT_NOT_DEPLOYED = 'CONTRACT_NOT_DEPLOYED',
  /** Network error */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** RPC error */
  RPC_ERROR = 'RPC_ERROR',
  /** Event parsing error */
  EVENT_PARSING_ERROR = 'EVENT_PARSING_ERROR',
  /** Metadata parsing error */
  METADATA_PARSING_ERROR = 'METADATA_PARSING_ERROR',
}

/**
 * SBT Contract Error interface
 */
export interface SBTContractErrorInterface {
  /** Error code */
  code: SBTContractErrorType;
  /** Error message */
  message: string;
  /** Contract address where error occurred */
  contractAddress?: SBTContractAddress;
  /** Method name where error occurred */
  method?: string;
  /** Token ID related to error (if applicable) */
  tokenId?: bigint;
  /** Transaction hash (if applicable) */
  transactionHash?: string;
  /** Block number (if applicable) */
  blockNumber?: number;
  /** Original error object */
  originalError?: Error;
}

/**
 * SBT Contract Method Names
 */
export enum SBTContractMethod {
  // ERC-721 Standard Methods
  SAFE_MINT = 'safeMint',
  MINT = 'mint',
  BURN = 'burn',
  OWNER_OF = 'ownerOf',
  TOKEN_URI = 'tokenURI',
  BALANCE_OF = 'balanceOf',
  TRANSFER_FROM = 'transferFrom',
  APPROVE = 'approve',
  GET_APPROVED = 'getApproved',
  IS_APPROVED_FOR_ALL = 'isApprovedForAll',
  SET_APPROVAL_FOR_ALL = 'setApprovalForAll',
  NAME = 'name',
  SYMBOL = 'symbol',
  TOTAL_SUPPLY = 'totalSupply',
  TOKEN_OF_OWNER_BY_INDEX = 'tokenOfOwnerByIndex',
  TOKEN_BY_INDEX = 'tokenByIndex',
  
  // SBT-Specific Methods
  REVOKE = 'revoke',
  IS_REVOKED = 'isRevoked',
  TOKENS_OF_OWNER = 'tokensOfOwner',
  GET_TOKEN_METADATA = 'getTokenMetadata',
}

/**
 * SBT Contract Event Names
 */
export enum SBTContractEvent {
  TRANSFER = 'Transfer',
  APPROVAL = 'Approval',
  APPROVAL_FOR_ALL = 'ApprovalForAll',
  TOKEN_REVOKED = 'TokenRevoked',
  TOKEN_MINTED = 'TokenMinted',
  TOKEN_BURNED = 'TokenBurned',
}

/**
 * SBT Contract Deployment Configuration
 */
export interface SBTContractDeploymentConfig {
  /** Contract name */
  name: string;
  /** Contract symbol */
  symbol: string;
  /** Base URI for token metadata */
  baseURI?: string;
  /** Maximum supply (optional) */
  maxSupply?: bigint;
  /** Contract owner address */
  owner: SBTContractAddress;
  /** Gas limit for deployment */
  gasLimit?: bigint;
  /** Gas price for deployment */
  gasPrice?: bigint;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: bigint;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: bigint;
  /** Deployment value in wei */
  value?: bigint;
}

/**
 * SBT Contract Deployment Result
 */
export interface SBTContractDeploymentResult {
  /** Deployed contract address */
  contractAddress: SBTContractAddress;
  /** Deployment transaction hash */
  transactionHash: string;
  /** Block number where contract was deployed */
  blockNumber: number;
  /** Gas used for deployment */
  gasUsed: bigint;
  /** Total deployment cost in wei */
  deploymentCost: bigint;
  /** Contract creation code hash */
  creationCodeHash?: string;
  /** Runtime code hash */
  runtimeCodeHash?: string;
}

/**
 * SBT Contract Configuration
 */
export interface SBTContractConfig {
  /** Contract address */
  address: SBTContractAddress;
  /** Contract ABI */
  abi: typeof SBTContractABI;
  /** Network chain ID */
  chainId: number;
  /** Contract name */
  name?: string;
  /** Contract symbol */
  symbol?: string;
  /** Base URI for metadata */
  baseURI?: string;
  /** Maximum supply */
  maxSupply?: bigint;
  /** Contract owner */
  owner?: SBTContractAddress;
}

/**
 * SBT Contract Query Options
 */
export interface SBTContractQueryOptions {
  /** Block number to query (optional) */
  blockNumber?: number;
  /** Block tag to query (optional) */
  blockTag?: 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized';
  /** Gas limit for the query */
  gasLimit?: bigint;
  /** Timeout for the query in milliseconds */
  timeout?: number;
}

/**
 * SBT Contract Transaction Options
 */
export interface SBTContractTransactionOptions {
  /** Gas limit for the transaction */
  gasLimit?: bigint;
  /** Gas price for the transaction */
  gasPrice?: bigint;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: bigint;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: bigint;
  /** Transaction value in wei */
  value?: bigint;
  /** Transaction timeout in milliseconds */
  timeout?: number;
  /** Number of confirmations to wait for */
  confirmations?: number;
}

/**
 * SBT Contract Event Filter
 */
export interface SBTContractEventFilter {
  /** Event name */
  event: SBTContractEvent;
  /** Filter by specific contract address */
  contractAddress?: SBTContractAddress;
  /** Filter by block range */
  fromBlock?: number | 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized';
  /** Filter by block range */
  toBlock?: number | 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized';
  /** Filter by specific topics */
  topics?: (string | string[])[];
  /** Maximum number of events to return */
  limit?: number;
}

/**
 * SBT Contract Event Subscription
 */
export interface SBTContractEventSubscription {
  /** Subscription ID */
  id: string;
  /** Event filter */
  filter: SBTContractEventFilter;
  /** Event callback function */
  callback: (event: any) => void;
  /** Subscription active status */
  active: boolean;
  /** Created timestamp */
  createdAt: number;
}
