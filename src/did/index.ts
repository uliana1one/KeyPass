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
import { MoonbeamDIDProvider } from './providers/MoonbeamDIDProvider.js';

/**
 * Options for unified DID creation
 */
export interface CreateDIDOptions {
  /** Specific DID method to use. If not provided, auto-detects from address */
  method?: 'ethr' | 'key' | 'kilt' | 'moonbeam';
  /** Additional options for DID creation */
  options?: Record<string, unknown>;
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
      const did = await provider.createDid(address);
      return { did, method };
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
