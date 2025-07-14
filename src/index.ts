import { connectWallet } from './walletConnector.js';
import { buildLoginMessage } from './message/messageBuilder.js';
import messageFormat from '../config/messageFormat.json';
import { WalletConnectionError } from './errors/WalletErrors.js';
import { PolkadotDIDProvider } from './did/UUIDProvider.js';
import { VerificationService } from './server/verificationService.js';
import { EthereumAdapter } from './adapters/EthereumAdapter.js';
import { EthereumDIDProvider } from './did/EthereumDIDProvider.js';

// Simple UUID generator for browser compatibility
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Re-export connectWallet
export { connectWallet };

/**
 * Result of a successful login operation with Polkadot.
 * Contains all necessary information for authentication and verification.
 */
export interface LoginResult {
  /** The Polkadot address of the logged-in account */
  address: string;
  /** The signature of the login message */
  signature: string;
  /** The message that was signed */
  message: string;
  /** The DID (Decentralized Identifier) associated with the address */
  did: string;
  /** ISO timestamp when the login was issued */
  issuedAt: string;
  /** Unique nonce used to prevent replay attacks */
  nonce: string;
}

/**
 * Main function to handle login with Polkadot.
 * This function orchestrates the entire login flow:
 * 1. Connects to the wallet (Polkadot.js or Talisman)
 * 2. Gets the user's accounts
 * 3. Generates a login message with a nonce
 * 4. Signs the message
 * 5. Verifies the signature
 * 6. Creates a DID for the address
 *
 * The function includes automatic retry logic for network errors.
 *
 * @param retryCount - Number of retry attempts for network errors (default: 1)
 * @returns Promise resolving to a LoginResult object containing all login data
 * @throws {WalletNotFoundError} If no wallet is found
 * @throws {UserRejectedError} If the user rejects any wallet operation
 * @throws {WalletConnectionError} If wallet connection fails
 * @throws {MessageValidationError} If message validation fails
 * @throws {InvalidSignatureError} If signature verification fails
 *
 * @example
 * ```typescript
 * try {
 *   const result = await loginWithPolkadot();
 *   console.log('Logged in as:', result.address);
 *   console.log('DID:', result.did);
 * } catch (error) {
 *   if (error instanceof WalletNotFoundError) {
 *     console.error('Please install a Polkadot wallet');
 *   }
 * }
 * ```
 */
export async function loginWithPolkadot(retryCount = 1): Promise<LoginResult> {
  let lastError: Error | null = null;
  const verificationService = new VerificationService();

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const adapter = await connectWallet();
      const accounts = await adapter.getAccounts();
      if (!accounts.length) {
        throw new WalletConnectionError('No accounts found');
      }
      const address = accounts[0].address;
      const nonce = generateUUID();
      const issuedAt = new Date().toISOString();
      const message = await buildLoginMessage({
        template: messageFormat.template,
        address,
        nonce,
        issuedAt,
      });
      const signature = await adapter.signMessage(message);

      // Verify the signature
      const verificationResult = await verificationService.verifySignature({
        address,
        message,
        signature,
      });

      if (verificationResult.status === 'error') {
        throw new Error(verificationResult.message);
      }

      const didProvider = new PolkadotDIDProvider();
      const did = await didProvider.createDid(address);

      return {
        address,
        signature,
        message,
        did,
        issuedAt,
        nonce,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this wasn't the last attempt and we got a network error, wait and retry
      if (attempt < retryCount && lastError.message.includes('Network error')) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
        continue;
      }

      // If we get here, either it's the last attempt or it's not a network error
      throw lastError;
    }
  }

  // This should never happen due to the throw in the loop, but TypeScript needs it
  throw lastError || new Error('Login failed');
}

/**
 * Authenticates a user with their Ethereum wallet (MetaMask, etc.)
 * @returns Promise resolving to authentication data including address, signature, and DID
 */
export async function loginWithEthereum(): Promise<LoginResult> {
  const adapter = new EthereumAdapter();
  const didProvider = new EthereumDIDProvider();

  try {
    // Enable wallet connection
    await adapter.enable();

    // Get accounts
    const accounts = await adapter.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const account = accounts[0];
    
    // Set the current address for signing
    adapter.setCurrentAddress(account.address);

    // Generate login message data
    const issuedAt = new Date().toISOString();
    const nonce = generateUUID();

    // Build the message
    const message = await buildLoginMessage({
      template: messageFormat.template,
      issuedAt,
      nonce,
      address: account.address,
    });

    // Sign the message
    const signature = await adapter.signMessage(message);

    // Create DID
    const did = await didProvider.createDid(account.address);

    return {
      address: account.address,
      signature,
      message,
      did,
      issuedAt,
      nonce,
    };
  } finally {
    await adapter.disconnect();
  }
}
