/**
 * Moonbeam Configuration
 * 
 * This module provides configuration management for Moonbeam blockchain integration,
 * including network endpoints, contract addresses, and transaction parameters.
 */

/**
 * Moonbeam network types
 */
export enum MoonbeamNetwork {
  /** Moonbeam mainnet */
  MAINNET = 'mainnet',
  /** Moonbase Alpha testnet */
  MOONBASE_ALPHA = 'moonbase-alpha',
  /** Moonriver (Kusama parachain) */
  MOONRIVER = 'moonriver',
}

/**
 * Moonbeam network configuration
 */
export interface MoonbeamNetworkConfig {
  /** Network name */
  name: string;
  /** Chain ID */
  chainId: number;
  /** RPC endpoint */
  rpcUrl: string;
  /** WebSocket endpoint */
  wsUrl: string;
  /** Block explorer URL */
  explorerUrl: string;
  /** Native token symbol */
  nativeToken: string;
  /** Native token decimals */
  nativeTokenDecimals: number;
  /** Gas price in wei */
  gasPrice: string;
  /** Maximum gas limit */
  maxGasLimit: string;
  /** Block confirmation time in seconds */
  blockTime: number;
}

/**
 * SBT contract configuration
 */
export interface MoonbeamSBTConfig {
  /** Default SBT contract address */
  defaultSBTContract?: string;
  /** SBT contract ABI */
  sbtContractABI: any[];
  /** Metadata storage configuration */
  metadataStorage: {
    /** IPFS gateway URL */
    ipfsGateway: string;
    /** Pinata API key (optional) */
    pinataApiKey?: string;
    /** Pinata secret (optional) */
    pinataSecret?: string;
  };
}

/**
 * Transaction configuration
 */
export interface MoonbeamTransactionConfig {
  /** Default gas limit */
  defaultGasLimit: string;
  /** Gas price multiplier */
  gasPriceMultiplier: number;
  /** Transaction timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Confirmation blocks */
  confirmationBlocks: number;
}

/**
 * Error codes for Moonbeam operations
 */
export enum MoonbeamErrorCode {
  NETWORK_ERROR = 'MOONBEAM_NETWORK_ERROR',
  CONTRACT_ERROR = 'MOONBEAM_CONTRACT_ERROR',
  TRANSACTION_ERROR = 'MOONBEAM_TRANSACTION_ERROR',
  METADATA_ERROR = 'MOONBEAM_METADATA_ERROR',
  VALIDATION_ERROR = 'MOONBEAM_VALIDATION_ERROR',
  IPFS_ERROR = 'MOONBEAM_IPFS_ERROR',
  DID_CREATION_FAILED = 'MOONBEAM_DID_CREATION_FAILED',
  WALLET_ERROR = 'MOONBEAM_WALLET_ERROR',
}

/**
 * Error messages for Moonbeam operations
 */
export const MoonbeamErrorMessages = {
  [MoonbeamErrorCode.NETWORK_ERROR]: 'Network connection error',
  [MoonbeamErrorCode.CONTRACT_ERROR]: 'Smart contract interaction error',
  [MoonbeamErrorCode.TRANSACTION_ERROR]: 'Transaction processing error',
  [MoonbeamErrorCode.METADATA_ERROR]: 'Metadata processing error',
  [MoonbeamErrorCode.VALIDATION_ERROR]: 'Input validation error',
  [MoonbeamErrorCode.IPFS_ERROR]: 'IPFS storage error',
  [MoonbeamErrorCode.DID_CREATION_FAILED]: 'DID creation failed',
  [MoonbeamErrorCode.WALLET_ERROR]: 'Wallet operation error',
} as const;

/**
 * Moonbeam configuration manager
 */
export class MoonbeamConfigManager {
  private static instance: MoonbeamConfigManager;
  private config: MoonbeamConfiguration;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): MoonbeamConfigManager {
    if (!MoonbeamConfigManager.instance) {
      MoonbeamConfigManager.instance = new MoonbeamConfigManager();
    }
    return MoonbeamConfigManager.instance;
  }

  /**
   * Get current configuration
   */
  public getConfig(): MoonbeamConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<MoonbeamConfiguration>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Set current network
   */
  public setCurrentNetwork(network: MoonbeamNetwork): void {
    this.config.network.current = network;
  }

  /**
   * Get current network configuration
   */
  public getCurrentNetworkConfig(): MoonbeamNetworkConfig {
    return this.config.network.networks[this.config.network.current];
  }

  /**
   * Get SBT configuration
   */
  public getSBTConfig(): MoonbeamSBTConfig {
    return this.config.sbt;
  }

  /**
   * Get transaction configuration
   */
  public getTransactionConfig(): MoonbeamTransactionConfig {
    return this.config.transaction;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): MoonbeamConfiguration {
    return {
      network: {
        current: MoonbeamNetwork.MOONBASE_ALPHA,
        networks: {
          [MoonbeamNetwork.MAINNET]: {
            name: 'Moonbeam Mainnet',
            chainId: 1284,
            rpcUrl: 'https://rpc.api.moonbeam.network',
            wsUrl: 'wss://wss.api.moonbeam.network',
            explorerUrl: 'https://moonscan.io',
            nativeToken: 'GLMR',
            nativeTokenDecimals: 18,
            gasPrice: '1000000000', // 1 gwei
            maxGasLimit: '30000000',
            blockTime: 12,
          },
          [MoonbeamNetwork.MOONBASE_ALPHA]: {
            name: 'Moonbase Alpha',
            chainId: 1287,
            rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
            wsUrl: 'wss://wss.api.moonbase.moonbeam.network',
            explorerUrl: 'https://moonbase.moonscan.io',
            nativeToken: 'DEV',
            nativeTokenDecimals: 18,
            gasPrice: '1000000000', // 1 gwei
            maxGasLimit: '30000000',
            blockTime: 12,
          },
          [MoonbeamNetwork.MOONRIVER]: {
            name: 'Moonriver',
            chainId: 1285,
            rpcUrl: 'https://rpc.api.moonriver.moonbeam.network',
            wsUrl: 'wss://wss.api.moonriver.moonbeam.network',
            explorerUrl: 'https://moonriver.moonscan.io',
            nativeToken: 'MOVR',
            nativeTokenDecimals: 18,
            gasPrice: '1000000000', // 1 gwei
            maxGasLimit: '30000000',
            blockTime: 12,
          },
        },
      },
      sbt: {
        defaultSBTContract: '0x0000000000000000000000000000000000000000', // Placeholder
        sbtContractABI: this.getDefaultSBTABI(),
        metadataStorage: {
          ipfsGateway: 'https://gateway.pinata.cloud/ipfs/',
          pinataApiKey: process.env.PINATA_API_KEY,
          pinataSecret: process.env.PINATA_SECRET,
        },
      },
      transaction: {
        defaultGasLimit: '300000',
        gasPriceMultiplier: 1.2,
        timeout: 60000,
        maxRetries: 3,
        retryDelay: 1000,
        confirmationBlocks: 1,
      },
    };
  }

  /**
   * Get default SBT contract ABI
   */
  private getDefaultSBTABI(): any[] {
    return [
      {
        inputs: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'string', name: 'tokenURI', type: 'string' },
        ],
        name: 'mintSBT',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
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
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint256', name: 'index', type: 'uint256' },
        ],
        name: 'tokenOfOwnerByIndex',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
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
        inputs: [
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'address', name: 'to', type: 'address' },
        ],
        name: 'transferSBT',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'revokeSBT',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
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
          { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
        ],
        name: 'SBTRevoked',
        type: 'event',
      },
    ];
  }
}

/**
 * Main Moonbeam configuration interface
 */
export interface MoonbeamConfiguration {
  network: {
    current: MoonbeamNetwork;
    networks: Record<MoonbeamNetwork, MoonbeamNetworkConfig>;
  };
  sbt: MoonbeamSBTConfig;
  transaction: MoonbeamTransactionConfig;
}

export { MoonbeamConfigManager as default };
