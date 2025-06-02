# KeyPass Protocol Specifications

This document details the core protocols and algorithms used in the KeyPass Login SDK. It serves as a technical specification for implementers and security auditors.

## Table of Contents
1. [Authentication Protocol](#authentication-protocol)
2. [DID Protocol](#did-protocol)
3. [Message Protocol](#message-protocol)
4. [Signature Protocol](#signature-protocol)
5. [Wallet Connection Protocol](#wallet-connection-protocol)
6. [Security Protocols](#security-protocols)

## Authentication Protocol

### Overview
The authentication protocol implements a challenge-response system using cryptographic signatures to verify wallet ownership.

### Flow
1. **Challenge Generation**
   ```
   Client -> Server: Request login challenge
   Server:
     - Generates UUID nonce
     - Creates timestamp
     - Builds message template
     - Returns: { nonce, message, timestamp }
   ```

2. **Signature Request**
   ```
   Client:
     - Connects to wallet
     - Displays message to user
     - Requests signature
   Wallet:
     - Signs message using sr25519/ed25519
     - Returns signature
   ```

3. **Verification**
   ```
   Client -> Server: { message, signature, address }
   Server:
     - Validates message format
     - Verifies signature
     - Creates/retrieves DID
     - Returns: { status, did, session }
   ```

### Message Format
```
"Sign this message to authenticate with KeyPass\n\n" +
"Address: {address}\n" +
"Nonce: {nonce}\n" +
"Issued At: {timestamp}\n" +
"Purpose: Authentication"
```

## DID Protocol

### did:key Method Implementation

#### DID Creation
1. **Input**: Polkadot address (public key)
2. **Process**:
   ```
   address -> public key bytes -> multibase base58btc -> did:key:z{multibase}
   ```
3. **Format**: `did:key:z{multibase-encoded-public-key}`

#### DID Document Generation
```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2018/v1"
  ],
  "id": "did:key:z...",
  "controller": "did:key:z...",
  "verificationMethod": [{
    "id": "did:key:z...#keys-1",
    "type": "Ed25519VerificationKey2018",
    "controller": "did:key:z...",
    "publicKeyMultibase": "z..."
  }],
  "authentication": ["did:key:z...#keys-1"],
  "assertionMethod": ["did:key:z...#keys-1"],
  "capabilityInvocation": ["did:key:z...#keys-1"],
  "capabilityDelegation": ["did:key:z...#keys-1"]
}
```

### Capability Verification
1. **Authentication**: Required for all operations
2. **Assertion**: Required for signing messages
3. **Invocation**: Required for DID updates
4. **Delegation**: Required for capability delegation

## Message Protocol

### Message Construction
1. **Template System**
   - Base template format:
     ```
     KeyPass Login
     Issued At: {timestamp}
     Nonce: {nonce}
     Address: {address}
     ```
   - Variables:
     - `{timestamp}`: ISO 8601 format in UTC
     - `{nonce}`: UUID v4
     - `{address}`: Valid Polkadot address
   - Maximum length: 256 characters
   - Line endings: `\n` (LF) or `\r\n` (CRLF)
   - No trailing newline
   - No extra whitespace between lines

2. **Nonce Generation**
   ```typescript
   function generateNonce(): string {
     return crypto.randomUUID();
   }
   ```

3. **Timestamp Format**
   - Must be a valid ISO 8601 date string that can be parsed by JavaScript's Date constructor
   - Recommended format: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., "2024-03-20T12:00:00.000Z")
   - Must be within 5 minutes of server time
   - No future timestamps (with 1-minute clock skew allowance)
   - Must be in UTC timezone (recommended to use 'Z' suffix)
   - Examples of valid formats:
     ```
     "2024-03-20T12:00:00.000Z"  // Full ISO format with milliseconds
     "2024-03-20T12:00:00Z"      // ISO format without milliseconds
     "2024-03-20T12:00:00+00:00" // ISO format with explicit UTC offset
     ```
   - Examples of invalid formats:
     ```
     "invalid-date"              // Not a valid date string
     "2024-03-20 12:00:00"      // Missing timezone
     "2024/03/20 12:00:00"      // Wrong date separator
     ```

### Validation Rules
1. **Message Format**
   - Must start with exactly "KeyPass Login"
   - Must contain exactly 4 lines in the specified order:
     1. "KeyPass Login"
     2. "Issued At: {timestamp}"
     3. "Nonce: {nonce}"
     4. "Address: {address}"
   - No extra lines or content
   - No special characters except newlines
   - No trailing or leading whitespace
   - No empty lines between content

2. **Timestamp Validation**
   - Must be valid ISO 8601 format
   - Must be within 5 minutes of server time
   - No future timestamps (with 1-minute clock skew allowance)
   - No expired timestamps
   - Must be in UTC timezone

3. **Nonce Validation**
   - Must be valid UUID v4 format
   - One-time use
   - 5-minute expiration
   - No special characters
   - Case-insensitive

4. **Address Validation**
   - Must be a valid Polkadot address
   - Must match the address in the verification request
   - SS58 format
   - Valid checksum
   - Valid network prefix

### Error Codes
The following error codes are returned for message validation failures:
- `INVALID_MESSAGE_FORMAT`: Message doesn't match required format
- `MESSAGE_EXPIRED`: Message timestamp is older than 5 minutes
- `MESSAGE_FUTURE`: Message timestamp is in the future
- `MESSAGE_TOO_LONG`: Message exceeds 256 characters
- `VERIFICATION_FAILED`: Message tampering detected

### Example
```typescript
// Valid message format
const validMessage = 
  "KeyPass Login\n" +
  "Issued At: 2024-03-20T12:00:00.000Z\n" +
  "Nonce: 123e4567-e89b-12d3-a456-426614174000\n" +
  "Address: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

// Invalid message format (missing required fields)
const invalidMessage = 
  "KeyPass Login\n" +
  "Issued At: 2024-03-20T12:00:00.000Z\n" +
  "Address: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

// Invalid message format (extra content)
const invalidMessageExtra = 
  "KeyPass Login\n" +
  "Issued At: 2024-03-20T12:00:00.000Z\n" +
  "Nonce: 123e4567-e89b-12d3-a456-426614174000\n" +
  "Address: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\n" +
  "Extra Line";
```

## Signature Protocol

### Supported Algorithms
1. **sr25519 (Primary)**
   - Used for Polkadot.js and Talisman
   - 64-byte signature
   - 32-byte public key

2. **ed25519 (Fallback)**
   - Used for WalletConnect
   - 64-byte signature
   - 32-byte public key

### Verification Process
1. **Signature Format**
   - Hex-encoded (0x-prefixed)
   - 128 characters (64 bytes)
   - No whitespace

2. **Verification Steps**
   ```
   1. Decode signature from hex
   2. Extract public key from address
   3. Verify signature using appropriate algorithm
   4. Validate message format
   5. Check timestamp and nonce
   ```

3. **Error Handling**
   - Invalid signature format
   - Signature verification failure
   - Algorithm mismatch
   - Message tampering

## Wallet Connection Protocol

### Wallet Detection
1. **Priority Order**
   ```
   1. Polkadot.js extension (polkadot-js)
   2. Talisman extension (talisman)
   3. WalletConnect (wallet-connect)
   ```

2. **Detection Process**
   ```typescript
   // Each adapter implements its own detection logic
   class PolkadotJsAdapter {
     async enable(): Promise<void> {
       const injectedWindow = window as Window & InjectedWindow;
       if (injectedWindow.injectedWeb3?.[POLKADOT_EXTENSION_NAME]) {
         await this.enableProvider(POLKADOT_EXTENSION_NAME);
         return;
       }
       throw new WalletNotFoundError('Polkadot.js');
     }
   }

   class TalismanAdapter {
     async enable(): Promise<void> {
       const injectedWindow = window as Window & InjectedWindow;
       // Try Talisman first
       if (injectedWindow.injectedWeb3?.[TALISMAN_EXTENSION_NAME]) {
         await this.enableProvider(TALISMAN_EXTENSION_NAME);
         return;
       }
       // Fallback to WalletConnect
       if (injectedWindow.injectedWeb3?.[WALLET_CONNECT_NAME]) {
         await this.enableProvider(WALLET_CONNECT_NAME);
         return;
       }
       throw new WalletNotFoundError('Talisman');
     }
   }

   class WalletConnectAdapter {
     constructor(config: WalletConnectConfig) {
       // Requires project ID and metadata
       if (!config.projectId) {
         throw new ConfigurationError('WalletConnect project ID is required');
       }
       this.initializeProvider();
     }
   }
   ```

3. **Provider Detection**
   - Uses `window.injectedWeb3` to detect available wallet extensions
   - Each adapter checks for its specific provider name
   - WalletConnect requires explicit configuration
   - Adapters can implement fallback strategies (e.g., Talisman falls back to WalletConnect)

4. **Error Handling**
   - `WalletNotFoundError`: When no compatible wallet is found
   - `ConfigurationError`: When required configuration is missing
   - `UserRejectedError`: When user rejects connection
   - `TimeoutError`: When connection request times out
   - `WalletConnectionError`: For other connection failures

### Connection States
1. **Disconnected**
   - No active connection
   - No session data

2. **Connecting**
   - Wallet selection
   - Permission request
   - Account selection

3. **Connected**
   - Active session
   - Account selected
   - Ready for signing

4. **Error**
   - Connection failed
   - User rejected
   - Timeout

### Session Management
1. **Timeout**
   - Default: 30 seconds
   - Configurable per wallet
   - Auto-disconnect on timeout

2. **Reconnection**
   - Automatic retry (3 attempts)
   - Exponential backoff
   - User notification

## Security Protocols

### Rate Limiting
1. **Request Limits**
   - 100 requests per minute per IP
   - 1000 requests per hour per IP
   - 10000 requests per day per IP

2. **Implementation**
   ```typescript
   interface RateLimit {
     windowMs: number;
     max: number;
     message: string;
     statusCode: number;
   }
   ```

### Input Validation
1. **Address Validation**
   - SS58 format
   - Checksum verification
   - Network prefix check

2. **Message Validation**
   - Length limits
   - Format verification
   - Variable validation

3. **Signature Validation**
   - Format verification
   - Length checks
   - Algorithm validation

### Attack Prevention
1. **Replay Attacks**
   - Nonce expiration
   - One-time use nonces
   - Timestamp validation

2. **Man-in-the-Middle**
   - TLS 1.3 required
   - HSTS headers
   - Certificate pinning

3. **Brute Force**
   - Rate limiting
   - Exponential backoff
   - Account locking

### Session Security
1. **Headers**
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   ```

2. **Token Management**
   - Short-lived tokens
   - Secure storage
   - Automatic rotation

3. **Error Handling**
   - Generic error messages
   - No stack traces
   - Logging of security events 