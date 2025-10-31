export { EthereumDIDProvider } from './EthereumDIDProvider';
export { PolkadotDIDProvider } from './UUIDProvider';
export { KILTDIDProvider } from './KILTDIDProvider';

// Export types without conflicts
export type { DIDDocument, DIDProvider, DIDResolver, Service } from './types';
export type { VerificationMethod } from './types';
export { VERIFICATION_METHOD_TYPES, MULTIBASE_PREFIXES } from './verification';

// Export KILT-specific types
export * from './types/KILTTypes';
