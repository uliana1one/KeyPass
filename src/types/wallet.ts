export interface WalletAccount {
  address: string;
  name?: string;
  type?: string;
}

/**
 * Represents a KeyPass authentication session with all necessary data for verification
 */
export interface KeyPassAuthSession {
  did: string;
  account: WalletAccount;
  message: string;
  signature: string;
  nonce: string;
  issuedAt: string;
  timestamp: number;
}

/**
 * Represents a stored KeyPass session for session management
 */
export interface KeyPassSession {
  did: string;
  account: WalletAccount;
  timestamp: number;
} 