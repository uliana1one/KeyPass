# API Reference

This document provides a comprehensive reference for all public APIs in the KeyPass Login SDK.

## Type Definitions

### Common Types

```typescript
type EventHandler = (...args: any[]) => void;
type ChainType = 'polkadot' | 'ethereum';

interface WalletAccount {
  address: string;
  name?: string;
  source: 'polkadot-js' | 'talisman' | 'walletconnect' | 'metamask' | 'ethereum';
}

interface LoginResult {
  address: string;    // Wallet address (Polkadot SS58 or Ethereum hex)
  signature: string;  // Message signature
  message: string;    // Signed message
  did: string;        // Generated DID
  issuedAt: string;   // ISO timestamp
  nonce: string;      // UUID nonce
  chainType: ChainType; // Chain type for this login
}

interface VerificationRequest {
  message: string;    // The message that was signed
  signature: string;  // The signature in hex format (0x-prefixed)
  address: string;    // The wallet address that signed the message
  chainType?: ChainType; // Optional explicit chain type
}

interface VerificationResponse {
  status: 'success' | 'error';
  message: string;    // Success or error message
  did?: string;       // The DID associated with the address (if valid)
  code: string;       // Error code for client handling
  data?: {            // Additional response data
    chainType: ChainType; // Detected or specified chain type
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

interface EthereumDIDProvider extends DIDProvider, DIDResolver {
  // Ethereum-specific DID operations using did:ethr method
}

interface PolkadotDIDProvider extends DIDProvider, DIDResolver {
  // Polkadot-specific DID operations using did:key method
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
function connectWallet(chainType?: ChainType): Promise<WalletAdapter>
```

Main entry point for wallet connection. This function attempts to connect to available wallets based on the specified chain type or in priority order:

**For Polkadot (`chainType: 'polkadot'`):**
1. Polkadot.js extension
2. Talisman wallet
3. WalletConnect

**For Ethereum (`chainType: 'ethereum'`):**
1. MetaMask
2. WalletConnect
3. Other injected Ethereum providers

**Auto-detection (no chainType specified):**
Attempts connection in order of priority across all supported wallets.

#### Parameters
- `chainType` (optional): Specify 'polkadot' or 'ethereum' to connect to chain-specific wallets

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

Entry point for Polkadot wallet authentication. This function orchestrates the Polkadot login flow:
1. Connects to a Polkadot wallet using `connectWallet('polkadot')`
2. Gets the user's accounts
3. Generates a login message with a nonce
4. Signs the message using SR25519
5. Verifies the signature
6. Creates a Polkadot DID for the address

#### Parameters
- `retryCount` (optional): Number of retry attempts for network errors (default: 1)

#### Returns
```typescript
interface LoginResult {
  address: string;      // Polkadot SS58 address
  signature: string;    // SR25519 signature
  message: string;      // Signed message
  did: string;          // Polkadot DID (did:key format)
  issuedAt: string;     // ISO timestamp
  nonce: string;        // UUID nonce
  chainType: 'polkadot'; // Chain type
}
```

### `loginWithEthereum`

```typescript
function loginWithEthereum(retryCount?: number): Promise<LoginResult>
```

Entry point for Ethereum wallet authentication. This function orchestrates the Ethereum login flow:
1. Connects to an Ethereum wallet using `connectWallet('ethereum')`
2. Gets the user's accounts
3. Generates a login message with a nonce
4. Signs the message using ECDSA (secp256k1)
5. Verifies the signature
6. Creates an Ethereum DID for the address

#### Parameters
- `retryCount` (optional): Number of retry attempts for network errors (default: 1)

#### Returns
```typescript
interface LoginResult {
  address: string;      // Ethereum hex address
  signature: string;    // ECDSA signature
  message: string;      // Signed message
  did: string;          // Ethereum DID (did:ethr format)
  issuedAt: string;     // ISO timestamp
  nonce: string;        // UUID nonce
  chainType: 'ethereum'; // Chain type
}
```

#### Example
```typescript
try {
  const result = await loginWithEthereum();
  console.log('Logged in as:', result.address);
  console.log('DID:', result.did);
  console.log('Chain:', result.chainType); // 'ethereum'
} catch (error) {
  if (error instanceof WalletNotFoundError) {
    console.error('Please install MetaMask or another Ethereum wallet');
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

## Verification Services

### `UnifiedVerificationService`

```typescript
class UnifiedVerificationService {
  constructor();
  
  verifySignature(request: VerificationRequest): Promise<VerificationResponse>;
}
```

The unified verification service that automatically detects chain type and routes to the appropriate verification method.

#### Methods

##### `verifySignature`
```typescript
verifySignature(request: VerificationRequest): Promise<VerificationResponse>
```

Verifies a signature against a message and address with automatic chain detection:

- **Auto-detection**: Determines chain type from address format
  - SS58 addresses (47-48 chars, base58): Routes to Polkadot verification
  - Hex addresses (42 chars, 0x prefix): Routes to Ethereum verification
- **Explicit chain type**: Use `chainType` parameter to override detection
- **Unified response**: Returns consistent response format with chain metadata

**Example:**
```typescript
const service = new UnifiedVerificationService();

// Auto-detection based on address format
const result = await service.verifySignature({
  message: "KeyPass Login\nIssued At: 2024-01-01T00:00:00.000Z\nNonce: abc123\nAddress: 0x742d35...",
  signature: "0x1234...",
  address: "0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b"
});

console.log(result.data.chainType); // 'ethereum'
```

### `EthereumVerificationService`

```typescript
class EthereumVerificationService {
  constructor();
  
  verifySignature(request: VerificationRequest): Promise<VerificationResponse>;
  private verifyEthereumSignature(message: string, signature: string, address: string): boolean;
  private validateEthereumAddress(address: string): boolean;
  private validateSignatureFormat(signature: string): boolean;
}
```

Specialized service for Ethereum signature verification using ECDSA.

#### Methods

##### `verifySignature`
```typescript
verifySignature(request: VerificationRequest): Promise<VerificationResponse>
```

Verifies Ethereum signatures with comprehensive validation:
- **ECDSA Verification**: Uses ethers.js for cryptographic verification
- **Address Validation**: Validates Ethereum address format (0x + 40 hex chars)
- **Signature Validation**: Validates signature format (65 bytes/130 hex chars)
- **Message Security**: 5-minute expiration, 256-character limit
- **DID Creation**: Automatic Ethereum DID generation for verified addresses

### `PolkadotVerificationService` (Legacy)

```typescript
class PolkadotVerificationService {
  constructor();
  
  verifySignature(request: VerificationRequest): Promise<VerificationResponse>;
  rebuildMessage(address: string, nonce: string, issuedAt: string): Promise<string>;
}
```

Legacy Polkadot-specific verification service. **Recommended to use `UnifiedVerificationService` instead.**

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

**Unified multi-chain signature verification endpoint** that automatically detects chain type and verifies signatures for both Polkadot and Ethereum.

#### Request Body
```typescript
{
  message: string;      // The message that was signed
  signature: string;    // The signature in hex format (0x-prefixed)
  address: string;      // The wallet address that signed the message
  chainType?: string;   // Optional: 'polkadot' | 'ethereum' (auto-detected if not provided)
}
```

#### Response
```typescript
{
  status: 'success' | 'error';
  message: string;      // Success or error message
  code: string;         // Error code if applicable
  did?: string;         // The DID associated with the address (if valid)
  data?: {              // Additional response metadata
    chainType: 'polkadot' | 'ethereum'; // Detected or specified chain type
  };
}
```

#### Chain Detection

The endpoint automatically detects the chain type based on address format:

- **Polkadot**: SS58 addresses (47-48 characters, base58 encoded)
  - Example: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
  - Uses SR25519 signature verification
  - Creates `did:key` format DIDs

- **Ethereum**: Hex addresses (42 characters, 0x prefix)
  - Example: `0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b`
  - Uses ECDSA signature verification
  - Creates `did:ethr` format DIDs

#### Example Requests

**Polkadot Verification:**
```bash
curl -X POST /api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "KeyPass Login\nIssued At: 2024-01-01T00:00:00.000Z\nNonce: abc123\nAddress: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "signature": "0x1234...",
    "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  }'
```

**Ethereum Verification:**
```bash
curl -X POST /api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "KeyPass Login\nIssued At: 2024-01-01T00:00:00.000Z\nNonce: abc123\nAddress: 0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b",
    "signature": "0x5678...",
    "address": "0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b"
  }'
```

#### Security Features
- **CORS Support**: Configurable cross-origin resource sharing
- **Request Size Limits**: 10KB maximum request body size
- **Rate Limiting Ready**: Built-in support for rate limiting middleware
- **Security Headers**: Comprehensive security header implementation
- **Input Validation**: Strict message and signature format validation
- **Time-based Expiration**: 5-minute message expiration window

#### Security Headers
The server includes the following security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Access-Control-Allow-Origin: *` (configurable)
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization` 