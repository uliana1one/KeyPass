# API Reference

This document provides a comprehensive reference for all public APIs in the KeyPass Login SDK.

## Main Functions

### `loginWithPolkadot`

```typescript
function loginWithPolkadot(retryCount?: number): Promise<LoginResult>
```

Main entry point for wallet authentication.

#### Parameters
- `retryCount` (optional): Number of retry attempts for network errors (default: 1)

#### Returns
```typescript
interface LoginResult {
  address: string;    // Polkadot address
  signature: string;  // Message signature
  message: string;    // Signed message
  did: string;        // Generated DID
  issuedAt: string;   // ISO timestamp
  nonce: string;      // UUID nonce
}
```

#### Example
```typescript
const result = await loginWithPolkadot();
console.log('Login successful:', {
  address: result.address,
  did: result.did
});
```

## Wallet Adapters

### `WalletAdapter` Interface

```typescript
interface WalletAdapter {
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
}
```

### `PolkadotJsAdapter`

```typescript
class PolkadotJsAdapter implements WalletAdapter {
  constructor();
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
}
```

### `TalismanAdapter`

```typescript
class TalismanAdapter implements WalletAdapter {
  constructor();
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
}
```

## DID Provider

### `PolkadotDIDProvider`

```typescript
class PolkadotDIDProvider implements DIDProvider, DIDResolver {
  constructor();
  
  createDid(address: string): Promise<string>;
  createDIDDocument(address: string): Promise<DIDDocument>;
  resolve(did: string): Promise<DIDDocument>;
  extractAddress(did: string): Promise<string>;
}
```

#### Methods

##### `createDid`
```typescript
createDid(address: string): Promise<string>
```
Creates a DID for a Polkadot address.

##### `createDIDDocument`
```typescript
createDIDDocument(address: string): Promise<DIDDocument>
```
Creates a DID document for a Polkadot address.

##### `resolve`
```typescript
resolve(did: string): Promise<DIDDocument>
```
Resolves a DID to its DID document.

##### `extractAddress`
```typescript
extractAddress(did: string): Promise<string>
```
Extracts the Polkadot address from a DID.

## Verification Service

### `VerificationService`

```typescript
class VerificationService {
  constructor();
  
  verifySignature(request: VerificationRequest): Promise<VerificationResponse>;
  rebuildMessage(address: string, nonce: string, issuedAt: string): Promise<string>;
}
```

#### Methods

##### `verifySignature`
```typescript
verifySignature(request: VerificationRequest): Promise<VerificationResponse>
```
Verifies a signature against a message and address.

##### `rebuildMessage`
```typescript
rebuildMessage(address: string, nonce: string, issuedAt: string): Promise<string>
```
Rebuilds a login message using the template system.

## Type Definitions

### Request Types

```typescript
interface VerificationRequest {
  message: string;    // The message that was signed
  signature: string;  // The signature in hex format (0x-prefixed)
  address: string;    // The Polkadot address that signed the message
}

interface VerificationResponse {
  status: 'success' | 'error';
  message: string;
  did?: string;
  code: string;
}

interface WalletAccount {
  address: string;
  meta?: {
    name?: string;
    source?: string;
  };
}

interface DIDDocument {
  '@context': string[];
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: Service[];
}
```

### Error Types

```typescript
class WalletNotFoundError extends Error {
  constructor(walletName: string);
}

class UserRejectedError extends Error {
  constructor(operation: string);
}

class TimeoutError extends Error {
  constructor(operation: string);
}

class MessageValidationError extends Error {
  constructor(message: string);
}

class AddressValidationError extends Error {
  constructor(message: string);
}
```

## Constants

### Error Codes

```typescript
const ERROR_CODES = {
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_JSON: 'INVALID_JSON',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  INVALID_SIGNATURE_FORMAT: 'INVALID_SIGNATURE_FORMAT',
  INVALID_SIGNATURE_LENGTH: 'INVALID_SIGNATURE_LENGTH',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  MESSAGE_EXPIRED: 'MESSAGE_EXPIRED',
  MESSAGE_FUTURE: 'MESSAGE_FUTURE',
  DID_CREATION_FAILED: 'DID_CREATION_FAILED'
} as const;
```

### Configuration

```typescript
const WALLET_TIMEOUT = 30000; // 30 seconds
const MAX_MESSAGE_LENGTH = 256;
const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000; // 5 minutes
``` 