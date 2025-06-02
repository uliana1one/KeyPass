# API Reference

This document provides a comprehensive reference for all public APIs in the KeyPass Login SDK.

## Type Definitions

### Common Types

```typescript
type EventHandler = (...args: any[]) => void;

interface WalletAccount {
  address: string;
  name?: string;
  source: 'polkadot-js' | 'talisman' | 'walletconnect';
}

interface LoginResult {
  address: string;    // Polkadot address
  signature: string;  // Message signature
  message: string;    // Signed message
  did: string;        // Generated DID
  issuedAt: string;   // ISO timestamp
  nonce: string;      // UUID nonce
}

interface VerificationRequest {
  message: string;    // The message that was signed
  signature: string;  // The signature in hex format (0x-prefixed)
  address: string;    // The Polkadot address that signed the message
}

interface VerificationResponse {
  status: 'success' | 'error';
  message: string;    // Success or error message
  did?: string;       // The DID associated with the address (if valid)
  code: string;       // Error code for client handling
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

interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
}

interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

interface DIDProvider {
  createDid(address: string): Promise<string>;
  createDIDDocument(address: string): Promise<DIDDocument>;
}

interface DIDResolver {
  resolve(did: string): Promise<DIDDocument>;
  extractAddress(did: string): Promise<string>;
}

interface WalletAdapter {
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
  disconnect(): Promise<void>;
  on(event: string, callback: EventHandler): void;
  off(event: string, callback: EventHandler): void;
}

interface WalletConnectConfig {
  projectId: string;           // WalletConnect project ID
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  relayUrl?: string;          // Optional custom relay URL
  chainId?: string;           // Default chain ID
  sessionTimeout?: number;    // Session timeout in milliseconds
}
```

## Main Functions

### `connectWallet`

```typescript
function connectWallet(): Promise<WalletAdapter>
```

Main entry point for wallet connection. This function attempts to connect to available wallets in priority order:
1. Polkadot.js extension
2. Talisman wallet
3. WalletConnect

#### Returns
Returns a `WalletAdapter` instance that implements the wallet connection interface.

#### Throws
- `WalletNotFoundError`: If no wallet is found
- `UserRejectedError`: If the user rejects any wallet operation
- `WalletConnectionError`: If wallet connection fails
- `TimeoutError`: If connection request times out

### `loginWithPolkadot`

```typescript
function loginWithPolkadot(retryCount?: number): Promise<LoginResult>
```

Main entry point for wallet authentication. This function orchestrates the entire login flow:
1. Connects to the wallet using `connectWallet()`
2. Gets the user's accounts
3. Generates a login message with a nonce
4. Signs the message
5. Verifies the signature
6. Creates a DID for the address

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

#### Throws
- `WalletNotFoundError`: If no wallet is found
- `UserRejectedError`: If the user rejects any wallet operation
- `WalletConnectionError`: If wallet connection fails
- `MessageValidationError`: If message validation fails
- `InvalidSignatureError`: If signature verification fails

#### Example
```typescript
try {
  const result = await loginWithPolkadot();
  console.log('Logged in as:', result.address);
  console.log('DID:', result.did);
} catch (error) {
  if (error instanceof WalletNotFoundError) {
    console.error('Please install a Polkadot wallet');
  }
}
```

## Wallet Adapters

### `PolkadotJsAdapter`

```typescript
class PolkadotJsAdapter implements WalletAdapter {
  constructor();
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
  disconnect(): Promise<void>;
  on(event: string, callback: EventHandler): void;
  off(event: string, callback: EventHandler): void;
}
```

The PolkadotJsAdapter handles connection, account listing, and message signing for the official Polkadot.js wallet extension.

### `TalismanAdapter`

```typescript
class TalismanAdapter implements WalletAdapter {
  constructor();
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
  disconnect(): Promise<void>;
  on(event: string, callback: EventHandler): void;
  off(event: string, callback: EventHandler): void;
}
```

The TalismanAdapter handles connection, account listing, and message signing for the Talisman wallet extension.

### `WalletConnectAdapter`

```typescript
class WalletConnectAdapter implements WalletAdapter {
  constructor(config: WalletConnectConfig);
  enable(): Promise<void>;
  getAccounts(): Promise<WalletAccount[]>;
  signMessage(message: string): Promise<string>;
  getProvider(): string | null;
  disconnect(): Promise<void>;
  on(event: string, callback: EventHandler): void;
  off(event: string, callback: EventHandler): void;
}
```

The WalletConnectAdapter handles connection, account listing, and message signing through the WalletConnect protocol. It supports connecting to any wallet that implements the WalletConnect standard.

#### Configuration

The WalletConnect adapter requires a project ID from WalletConnect Cloud. Set this in your environment:

```bash
# .env
WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your project ID from https://cloud.walletconnect.com/

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

Provider for creating and managing Polkadot DIDs. Implements the did:key method for Polkadot addresses.

#### Methods

##### `createDid`
```typescript
createDid(address: string): Promise<string>
```
Creates a DID for a Polkadot address in the format `did:key:<multibase-encoded-public-key>`.

##### `createDIDDocument`
```typescript
createDIDDocument(address: string): Promise<DIDDocument>
```
Creates a DID document for a Polkadot address with verification methods and capabilities.

##### `resolve`
```typescript
resolve(did: string): Promise<DIDDocument>
```
Resolves a DID to its DID document. Throws an error if the DID cannot be resolved.

##### `extractAddress`
```typescript
extractAddress(did: string): Promise<string>
```
Extracts the Polkadot address from a DID. Throws an error if the address cannot be extracted.

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
Verifies a signature against a message and address. Returns a response with status and optional DID.

##### `rebuildMessage`
```typescript
rebuildMessage(address: string, nonce: string, issuedAt: string): Promise<string>
```
Rebuilds a login message using the template system.

## Error Types

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

class WalletConnectionError extends Error {
  constructor(message: string);
}

class ConfigurationError extends Error {
  constructor(message: string);
}

class InvalidSignatureError extends Error {
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
const MAX_REQUEST_SIZE = '10kb'; // Maximum request body size
```

## Server API

### POST /api/verify

Verifies a Polkadot wallet signature and returns the associated DID.

#### Request Body
```typescript
{
  message: string;    // The message that was signed
  signature: string;  // The signature in hex format (0x-prefixed)
  address: string;    // The Polkadot address that signed the message
}
```

#### Response
```typescript
{
  status: 'success' | 'error';
  message: string;    // Success or error message
  code: string;       // Error code if applicable
  did?: string;       // The DID associated with the address (if valid)
}
```

#### Security Headers
The server includes the following security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` 