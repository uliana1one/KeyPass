export { EthereumDIDProvider } from './EthereumDIDProvider.js';
export { PolkadotDIDProvider } from './UUIDProvider.js';
export { KILTDIDProvider } from './KILTDIDProvider.js';

// Export types without conflicts
export type { DIDDocument, DIDProvider, DIDResolver, Service } from './types.js';
export type { VerificationMethod } from './types.js';
export { VERIFICATION_METHOD_TYPES, MULTIBASE_PREFIXES } from './verification.js';

// Export KILT-specific types
export * from './types/KILTTypes.js';

// Unified DID creation API
import { EthereumDIDProvider } from './EthereumDIDProvider.js';
import { PolkadotDIDProvider } from './UUIDProvider.js';
import { KILTDIDProvider } from './KILTDIDProvider.js';
import type { DIDDocument } from './types/DIDDocument.js';
import { MoonbeamDIDProvider } from './providers/MoonbeamDIDProvider.js';

/**
 * Options for unified DID creation
 */
export interface CreateDIDOptions {
  /** Specific DID method to use. If not provided, auto-detects from address */
  method?: 'ethr' | 'key' | 'kilt' | 'moonbeam';
  /** Additional options for DID creation */
  options?: {
    /** Whether to create DID on-chain (for KILT) */
    onChain?: boolean;
    /** Additional method-specific options */
    [key: string]: unknown;
  };
  /** Blockchain adapter (required for some chains) */
  adapter?: any;
}

/**
 * Unified DID creation result
 */
export interface CreateDIDResult {
  /** The created DID identifier */
  did: string;
  /** The DID method used */
  method: 'ethr' | 'key' | 'kilt' | 'moonbeam';
  /** The DID document (if available) */
  document?: DIDDocument;
}

/**
 * Creates a DID for any supported blockchain with automatic chain detection.
 * Supports: ethereum (did:ethr), polkadot (did:key), KILT (did:kilt), moonbeam (did:moonbeam)
 * 
 * @param address - The blockchain address to create DID for
 * @param options - DID creation options
 * @returns Promise resolving to the created DID result
 * 
 * @example
 * ```typescript
 * // Auto-detect and create off-chain DID
 * const result = await createDID('0x742d35Cc...'); // Returns did:ethr
 * 
 * // Create on-chain KILT DID
 * const kiltResult = await createDID(address, { 
 *   method: 'kilt', 
 *   adapter: kiltAdapter,
 *   onChain: true 
 * });
 * ```
 */
export async function createDID(
  address: string,
  options: CreateDIDOptions = {}
): Promise<CreateDIDResult> {
  let method: 'ethr' | 'key' | 'kilt' | 'moonbeam' = options.method || detectDIDMethod(address);

  switch (method) {
    case 'ethr': {
      const provider = new EthereumDIDProvider();
      const did = await provider.createDid(address);
      return { did, method };
    }
    case 'key': {
      const provider = new PolkadotDIDProvider();
      const did = await provider.createDid(address);
      return { did, method };
    }
    case 'kilt': {
      const provider = options.adapter 
        ? new KILTDIDProvider(options.adapter)
        : new KILTDIDProvider();
      
      // Check if on-chain registration is requested
      if (options.options?.onChain === true) {
        console.log('[createDID] Creating on-chain KILT DID...');
        const result = await provider.registerDidOnchain({}, address);
        return { 
          did: result.did, 
          method,
          document: result.didDocument 
        };
      } else {
        // Create off-chain DID (default)
        const did = await provider.createDid(address);
        return { did, method };
      }
    }
    case 'moonbeam': {
      if (!options.adapter) {
        throw new Error('Moonbeam adapter required for did:moonbeam.');
      }
      const provider = new MoonbeamDIDProvider(options.adapter);
      const did = await provider.createDid(address);
      return { did, method };
    }
    default:
      throw new Error(`Unsupported DID method: ${method}`);
  }
}

/**
 * Detects the appropriate DID method from an address format.
 */
function detectDIDMethod(address: string): 'ethr' | 'key' | 'kilt' | 'moonbeam' {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address');
  }

  const trimmed = address.trim();
  // Ethereum/Moonbeam addresses (0x...)
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 'ethr'; // Default to ethr, can be overridden with options.method
  }
  // SS58 addresses (Polkadot, KILT)
  if (/^[0-9A-HJ-NP-Za-km-z]{47,48}$/.test(trimmed)) {
    return 'kilt'; // Default to KILT for SS58
  }
  return 'key';
}

/**
 * Resolves a DID to its DID document. Automatically detects the DID method
 * and uses the appropriate resolver.
 * 
 * @param did - The DID to resolve (e.g., 'did:ethr:0x123...', 'did:kilt:4abc...', etc.)
 * @returns Promise resolving to the DID document
 * @throws Error if the DID cannot be resolved
 * 
 * @example
 * ```typescript
 * import { resolveDID } from 'keypass-login-sdk';
 * 
 * const didDoc = await resolveDID('did:kilt:4abc123...');
 * console.log('Resolved DID:', didDoc.id);
 * console.log('Public keys:', didDoc.verificationMethod);
 * ```
 */
export async function resolveDID(did: string): Promise<DIDDocument> {
  if (!did || typeof did !== 'string') {
    throw new Error('Invalid DID: must be a non-empty string');
  }

  const parts = did.split(':');
  if (parts.length < 3 || parts[0] !== 'did') {
    throw new Error('Invalid DID format: must start with "did:" followed by method');
  }

  const method = parts[1];

  try {
    switch (method) {
      case 'ethr': {
        const ethProvider = new EthereumDIDProvider();
        return await ethProvider.resolve(did);
      }

      case 'key': {
        const polkadotProvider = new PolkadotDIDProvider();
        return await polkadotProvider.resolve(did);
      }

      case 'kilt': {
        const kiltProvider = new KILTDIDProvider();
        return await kiltProvider.resolve(did);
      }

      case 'moonbeam': {
        // For now, treat moonbeam DIDs similar to ethereum
        const ethProvider = new EthereumDIDProvider();
        return await ethProvider.resolve(did);
      }

      default:
        throw new Error(`Unsupported DID method: ${method}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to resolve DID ${did}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Resolves a KILT DID with additional metadata about resolution source.
 * 
 * @param did - The KILT DID to resolve
 * @returns Promise resolving to DID document with metadata
 */
export async function resolveKILTDIDWithMetadata(did: string): Promise<{
  document: DIDDocument;
  metadata: {
    source: 'blockchain' | 'constructed';
    existsOnChain: boolean;
    resolvedAt: string;
  };
}> {
  const kiltProvider = new KILTDIDProvider();
  return await kiltProvider.resolveWithMetadata(did);
}

/**
 * Checks if a DID exists on its respective blockchain.
 * 
 * @param did - The DID to check
 * @returns Promise resolving to true if the DID exists on-chain
 */
export async function checkDIDExists(did: string): Promise<boolean> {
  if (!did || typeof did !== 'string') {
    return false;
  }

  const parts = did.split(':');
  if (parts.length < 3 || parts[0] !== 'did') {
    return false;
  }

  const method = parts[1];

  try {
    switch (method) {
      case 'kilt': {
        const kiltProvider = new KILTDIDProvider();
        return await kiltProvider.existsOnChain(did);
      }

      case 'ethr':
      case 'key':
      case 'moonbeam':
        // These methods don't have on-chain registries in our current implementation
        return false;

      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Creates an on-chain KILT DID with seamless wallet integration.
 * This is a convenience function for KILT DID registration.
 * 
 * @param address - The KILT account address
 * @param kiltAdapter - The KILT adapter instance
 * @returns Promise resolving to the registered DID identifier
 * @throws Error if registration fails
 * 
 * @example
 * ```typescript
 * import { KiltAdapter } from 'keypass-login-sdk';
 * 
 * const kiltAdapter = new KiltAdapter();
 * await kiltAdapter.enable();
 * 
 * const did = await createKILTDID(address, kiltAdapter);
 * console.log('Registered KILT DID:', did);
 * ```
 */
export async function createKILTDID(address: string, kiltAdapter: any): Promise<string> {
  try {
    const result = await createDID(address, {
      method: 'kilt',
      adapter: kiltAdapter,
      options: { onChain: true }
    });
    
    return result.did;
  } catch (error) {
    throw new Error(
      `Failed to create on-chain KILT DID: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convenience function to create DIDs with better type safety.
 * Provides chain-specific overloads for better developer experience.
 */
export const DIDFactory = {
  /**
   * Creates an Ethereum DID (did:ethr)
   */
  ethereum: async (address: string): Promise<string> => {
    const result = await createDID(address, { method: 'ethr' });
    return result.did;
  },

  /**
   * Creates a Polkadot DID (did:key)
   */
  polkadot: async (address: string): Promise<string> => {
    const result = await createDID(address, { method: 'key' });
    return result.did;
  },

  /**
   * Creates a KILT DID (did:kilt) - off-chain by default
   */
  kilt: async (address: string, adapter?: any): Promise<string> => {
    const result = await createDID(address, { method: 'kilt', adapter });
    return result.did;
  },

  /**
   * Creates an on-chain KILT DID (did:kilt) with blockchain registration
   */
  kiltOnChain: async (address: string, adapter: any): Promise<string> => {
    const result = await createDID(address, { 
      method: 'kilt', 
      adapter,
      options: { onChain: true } 
    });
    return result.did;
  },

  /**
   * Creates a Moonbeam DID (did:moonbeam)
   */
  moonbeam: async (address: string, adapter: any): Promise<string> => {
    const result = await createDID(address, { method: 'moonbeam', adapter });
    return result.did;
  },
};
