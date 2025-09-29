export { EthereumDIDProvider } from './EthereumDIDProvider.js';
export { PolkadotDIDProvider } from './UUIDProvider.js';
export { KILTDIDProvider } from './KILTDIDProvider.js';

// Export types without conflicts
export type { DIDDocument, DIDProvider, DIDResolver, Service } from './types.js';
export type { VerificationMethod } from './types.js';
export { VERIFICATION_METHOD_TYPES, MULTIBASE_PREFIXES } from './verification.js';
