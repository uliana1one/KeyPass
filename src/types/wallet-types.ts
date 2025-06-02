/**
 * Enum representing different types of blockchain wallets supported by the system.
 * This enum is used to distinguish between different wallet implementations and protocols.
 * 
 * @enum {string}
 */
export const WalletType = {
  /** Polkadot wallet (e.g., Polkadot.js, Talisman) */
  POLKADOT: 'polkadot',
  /** Ethereum wallet (e.g., MetaMask, Coinbase Wallet) */
  ETHEREUM: 'ethereum',
  /** WalletConnect protocol for connecting to various wallets */
  WALLETCONNECT: 'walletconnect'
} as const;

/**
 * Type representing the possible values of the WalletType enum.
 * This ensures type safety when using wallet types throughout the application.
 */
export type WalletType = typeof WalletType[keyof typeof WalletType];

/**
 * Enum representing common Ethereum network chain IDs.
 * These values are used to identify different Ethereum networks when connecting
 * to Ethereum wallets.
 * 
 * @enum {number}
 */
export const EthereumChainId = {
  /** Ethereum Mainnet */
  MAINNET: 1,
  /** Sepolia Testnet */
  SEPOLIA: 11155111,
  /** Polygon Mainnet */
  POLYGON: 137,
  /** Mumbai Testnet (Polygon) */
  MUMBAI: 80001,
  /** Goerli Testnet */
  GOERLI: 5
} as const;

/**
 * Type representing the possible values of the EthereumChainId enum.
 * This ensures type safety when using chain IDs throughout the application.
 */
export type EthereumChainId = typeof EthereumChainId[keyof typeof EthereumChainId];

/**
 * Union type representing all supported wallet types in the system.
 * This type is used to ensure type safety when handling different wallet types
 * throughout the application.
 * 
 * @example
 * ```typescript
 * function connectWallet(type: SupportedWalletType) {
 *   switch (type) {
 *     case WalletType.POLKADOT:
 *       // Handle Polkadot wallet
 *       break;
 *     case WalletType.ETHEREUM:
 *       // Handle Ethereum wallet
 *       break;
 *     case WalletType.WALLETCONNECT:
 *       // Handle WalletConnect
 *       break;
 *   }
 * }
 * ```
 */
export type SupportedWalletType = WalletType;

/**
 * Interface representing the base configuration for any wallet connection.
 * This can be extended by specific wallet implementations to include
 * additional configuration options.
 */
export interface WalletConfig {
  /** The type of wallet to connect to */
  type: SupportedWalletType;
  /** Optional chain ID for Ethereum-based wallets */
  chainId?: EthereumChainId;
  /** Optional timeout in milliseconds for wallet operations */
  timeout?: number;
} 