# ZK-Proof Implementation Documentation

## Overview

This document describes the implementation of real zero-knowledge proof functionality using the Semaphore protocol in the KeyPass DID + SBT Dashboard.

## Architecture

### Core Components

1. **ZKProofService** (`src/services/zkProofService.ts`)
   - Main service for generating and verifying ZK-proofs
   - Integrates with Semaphore protocol
   - Supports both real proofs and mock mode for testing

2. **CredentialService Integration** (`src/services/credentialService.ts`)
   - Extended to use ZK-proof service
   - Provides seamless integration with existing credential management

3. **Type System** (`src/types/credential.ts`)
   - Extended with ZK-proof types and interfaces
   - Supports multiple proof types (Semaphore, PLONK, Groth16)

## Semaphore Protocol Integration

### Dependencies
```json
{
  "@semaphore-protocol/identity": "^3.x.x",
  "@semaphore-protocol/group": "^3.x.x", 
  "@semaphore-protocol/proof": "^3.x.x",
  "poseidon-lite": "^1.x.x",
  "snarkjs": "^0.7.x"
}
```

### Group Configuration
Three predefined Semaphore groups for different use cases:

- **AGE_VERIFICATION** (Group ID: 1) - For age verification proofs
- **MEMBERSHIP_PROOF** (Group ID: 2) - For membership verification
- **CREDENTIAL_VERIFICATION** (Group ID: 3) - General credential proofs

### Identity Creation
- Deterministic identity generation from credential data
- Uses Poseidon hash for secure identity derivation
- Caches identities for performance

## Supported ZK Circuits

### 1. Age Verification Circuit
- **Circuit ID**: `semaphore-age-verification`
- **Purpose**: Prove age requirements without revealing exact age
- **Public Inputs**: `minAge`, `isValid`
- **Private Inputs**: `identity`, `merkleTreeProof`, `age`
- **Validation**: Requires credentials with age, birthDate, or age-related types

### 2. Membership Proof Circuit
- **Circuit ID**: `semaphore-membership-proof`
- **Purpose**: Prove membership without revealing identity
- **Public Inputs**: `groupId`, `isMember`
- **Private Inputs**: `identity`, `merkleTreeProof`, `membershipToken`
- **Validation**: Requires credentials with membership-related fields

## API Reference

### ZKProofService Methods

#### `generateZKProof(circuitId, publicInputs, credentials)`
Generates a zero-knowledge proof for given credentials.

```typescript
const proof = await zkProofService.generateZKProof(
  'semaphore-age-verification',
  { minAge: 18 },
  [ageCredential]
);
```

#### `verifyZKProof(zkProof, expectedSignal)`
Verifies a zero-knowledge proof.

```typescript
const isValid = await zkProofService.verifyZKProof(proof, expectedSignal);
```

#### `getAvailableCircuits()`
Returns available ZK circuits.

```typescript
const circuits = zkProofService.getAvailableCircuits();
```

#### `getGroupStats(circuitId)`
Returns statistics for a Semaphore group.

```typescript
const stats = await zkProofService.getGroupStats('semaphore-age-verification');
```

### Configuration Options

```typescript
interface ZKProofServiceConfig {
  enableRealProofs?: boolean;    // Enable real ZK-proof generation
  mockMode?: boolean;            // Use mock mode for testing
  semaphoreConfig?: {
    wasmFilePath?: string;       // Path to Semaphore WASM file
    zkeyFilePath?: string;       // Path to Semaphore proving key
  };
}
```

## Usage Examples

### Age Verification
```typescript
// Generate age proof
const ageProof = await credentialService.generateZKProof(
  'semaphore-age-verification',
  { minAge: 21 },
  [userAgeCredential]
);

// Verify proof
const isValid = await credentialService.verifyZKProof(ageProof);
```

### Membership Proof
```typescript
// Generate membership proof
const membershipProof = await credentialService.generateZKProof(
  'semaphore-membership-proof',
  { groupId: 'employees' },
  [employeeCredential]
);

// Create verifiable presentation with ZK-proof
const presentation = await credentialService.createPresentation(
  [employeeCredential],
  'challenge-123',
  'https://verifier.example.com',
  undefined,
  {
    circuit: 'semaphore-membership-proof',
    publicInputs: { groupId: 'employees' }
  }
);
```

## Testing

### Test Structure
- **Unit Tests**: `src/services/__tests__/zkProofService.test.ts`
- **Integration Tests**: `src/services/__tests__/credentialService.integration.test.ts`

### Mock Implementation
For testing purposes, the service provides mock ZK-proofs that simulate the real proof structure without requiring actual cryptographic computation.

### Test Coverage
- Circuit validation
- Credential validation
- Proof generation and verification
- Error handling
- Caching behavior
- Performance testing

## Security Considerations

### Privacy Protection
- Uses Semaphore's nullifier system to prevent double-spending
- Generates unique nullifiers for each proof
- Supports selective disclosure of credential fields

### Cryptographic Security
- Poseidon hash function for efficient zk-SNARK compatibility
- Merkle tree proofs for group membership
- Groth16 proof system (via Semaphore)

### Input Validation
- Validates credentials against circuit requirements
- Checks for required fields and credential types
- Prevents invalid proof generation

## Performance Optimizations

### Caching
- Identity caching for repeated credential use
- Group caching for circuit reuse
- Merkle proof caching

### Async Operations
- Non-blocking proof generation
- Concurrent proof verification
- Background group updates

## Deployment Considerations

### Browser Compatibility
- WebAssembly support required for Semaphore
- Large WASM files may impact initial load time
- Consider lazy loading for ZK components

### Production Setup
```typescript
const zkService = new ZKProofService({
  enableRealProofs: true,
  mockMode: false,
  semaphoreConfig: {
    wasmFilePath: '/assets/semaphore.wasm',
    zkeyFilePath: '/assets/semaphore.zkey'
  }
});
```

### Environment Variables
```bash
REACT_APP_ZK_PROOFS_ENABLED=true
REACT_APP_ZK_MOCK_MODE=false
REACT_APP_SEMAPHORE_WASM_PATH=/assets/semaphore.wasm
REACT_APP_SEMAPHORE_ZKEY_PATH=/assets/semaphore.zkey
```

## Future Enhancements

### Additional Circuits
- Range proofs for numerical values
- Set membership proofs
- Threshold signatures
- Anonymous credentials

### Protocol Upgrades
- Integration with newer Semaphore versions
- Support for custom circuits
- Circuit parameter updates

### Performance Improvements
- Circuit compilation optimization
- Proof batching
- Hardware acceleration support

## Troubleshooting

### Common Issues

1. **Worker Not Defined Error**
   - Solution: Update Jest configuration to mock Worker
   - Add polyfills for Node.js environments

2. **WASM Loading Failures**
   - Check WASM file accessibility
   - Verify CORS headers for WASM files
   - Ensure proper MIME types

3. **Proof Generation Timeouts**
   - Increase timeout values
   - Check circuit parameters
   - Verify credential validation

### Debug Mode
Enable debug logging:
```typescript
const zkService = new ZKProofService({
  enableRealProofs: true,
  debug: true
});
```

## Conclusion

This ZK-proof implementation provides production-ready zero-knowledge functionality for the KeyPass ecosystem, enabling privacy-preserving credential verification while maintaining security and performance standards. 