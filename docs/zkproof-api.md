# ZK-Proof API Reference

Complete API documentation for the KeyPass zk-proof service using Semaphore protocol v4.

## Table of Contents

- [ZKProofService Class](#zkproofservice-class)
- [Configuration](#configuration)
- [Core Methods](#core-methods)
- [Helper Functions](#helper-functions)
- [Type Definitions](#type-definitions)
- [Examples](#examples)

---

## ZKProofService Class

The main service class for generating and verifying zero-knowledge proofs.

```typescript
import { ZKProofService } from '@keypass/login-sdk';
// Or from local imports:
import { zkProofService } from './services/zkProofService';
```

### Constructor

```typescript
constructor(config?: ZKProofServiceConfig)
```

Creates a new ZKProofService instance with optional configuration.

**Configuration Options:**

```typescript
interface ZKProofServiceConfig {
  /** Enable real Semaphore zk-SNARK proof generation (default: false) */
  enableRealProofs?: boolean;
  
  /** Configuration for Semaphore circuit artifacts */
  semaphoreConfig?: {
    /** Path to WASM file for the circuit */
    wasmFilePath?: string;
    /** Path to zkey proving key file */
    zkeyFilePath?: string;
  };
  
  /** When real proofs are disabled, return mock instead of throwing */
  disableMockFallback?: boolean;
  
  /** Backward-compat: when false, do not allow mock path in service */
  mockMode?: boolean;
}
```

**Example:**
```typescript
// Default: mock mode for development
const mockService = new ZKProofService();

// Production: real proofs enabled
const productionService = new ZKProofService({
  enableRealProofs: true,
  semaphoreConfig: {
    wasmFilePath: '/assets/semaphore.wasm',
    zkeyFilePath: '/assets/semaphore.zkey'
  }
});
```

---

## Core Methods

### `generateZKProof()`

Generates a zero-knowledge proof from credentials using a specified circuit.

```typescript
async generateZKProof(
  circuitId: string,
  publicInputs: Record<string, any>,
  credentials: VerifiableCredential[]
): Promise<ZKProof>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `circuitId` | `string` | ✅ | Circuit identifier (e.g., `'semaphore-age-verification'`) |
| `publicInputs` | `Record<string, any>` | ✅ | Public inputs for the circuit (e.g., `{ minAge: 18 }`) |
| `credentials` | `VerifiableCredential[]` | ✅ | Array of verifiable credentials (must have compatible data) |

**Returns:** `Promise<ZKProof>` - Generated proof object

**Throws:**
- `Error('Circuit not found')` - Invalid circuit ID
- `Error('At least one credential is required')` - Empty credentials array
- `Error('Credential does not meet circuit requirements')` - Invalid credential data
- `Error('ZK-proof generation failed: ...')` - Generation error

**Example:**
```typescript
const proof = await zkProofService.generateZKProof(
  'semaphore-age-verification',
  { minAge: 21 },
  [ageCredential]
);

console.log(proof.type);          // 'semaphore'
console.log(proof.circuit);       // 'semaphore-age-verification'
console.log(proof.publicSignals); // ['nullifierHash', 'merkleRoot', 'signal']
```

---

### `verifyZKProof()`

Verifies a zero-knowledge proof.

```typescript
async verifyZKProof(
  zkProof: ZKProof,
  expectedSignal: string,
  groupId?: string
): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `zkProof` | `ZKProof` | ✅ | Proof object to verify |
| `expectedSignal` | `string` | ✅ | Expected message/signal from proof |
| `groupId` | `string` | ❌ | Optional group ID for root validation |

**Returns:** `Promise<boolean>` - `true` if valid, `false` otherwise

**Example:**
```typescript
const isValid = await zkProofService.verifyZKProof(
  proof,
  proof.publicSignals[2],  // Use signal from publicSignals
  'semaphore-age-verification'
);

if (isValid) {
  console.log('✅ Proof verified successfully');
} else {
  console.log('❌ Proof verification failed');
}
```

---

### `getAvailableCircuits()`

Returns all available ZK circuits.

```typescript
getAvailableCircuits(): ZKCircuit[]
```

**Returns:** Array of circuit definitions

**Example:**
```typescript
const circuits = zkProofService.getAvailableCircuits();

circuits.forEach(circuit => {
  console.log(`${circuit.name}: ${circuit.description}`);
  console.log('Public inputs:', circuit.publicInputs);
});
```

---

### `getGroupStats()`

Retrieves statistics for a Semaphore group.

```typescript
async getGroupStats(circuitId: string): Promise<{
  memberCount: number;
  depth: number;
  groupId: string;
}>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `circuitId` | `string` | ✅ | Circuit ID to get group stats for |

**Returns:** Group statistics object

**Example:**
```typescript
const stats = await zkProofService.getGroupStats('semaphore-age-verification');

console.log('Members:', stats.memberCount);
console.log('Depth:', stats.depth);
console.log('Group ID:', stats.groupId);
```

---

### `generateSemaphoreIdentity()`

Generates a Semaphore identity from a wallet signature.

```typescript
async generateSemaphoreIdentity(
  wallet: { 
    address: string; 
    signMessage: (msg: string) => Promise<string> 
  }
): Promise<{ identity: Identity; commitment: string }>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | `Wallet` | ✅ | Wallet with `address` and `signMessage` method |

**Returns:** Identity object and commitment string

**Example:**
```typescript
const wallet = {
  address: '0x1234...',
  signMessage: async (msg) => await metaMask.request({ 
    method: 'personal_sign', 
    params: [msg, address] 
  })
};

const { identity, commitment } = await zkProofService.generateSemaphoreIdentity(wallet);
console.log('Identity commitment:', commitment);
```

---

### `createSemaphoreGroup()`

Creates or retrieves a Semaphore group.

```typescript
createSemaphoreGroup(groupKey: string, depth?: number): Group
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupKey` | `string` | ✅ | Unique identifier for the group |
| `depth` | `number` | ❌ | Merkle tree depth (default: 20) |

**Returns:** Group instance

**Example:**
```typescript
const group = zkProofService.createSemaphoreGroup('age-verification-group', 20);
zkProofService.addMemberToGroup('age-verification-group', BigInt('123456'));
```

---

### `addMemberToGroup()`

Adds a member to a Semaphore group.

```typescript
addMemberToGroup(
  groupKey: string, 
  identityCommitment: string | bigint
): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupKey` | `string` | ✅ | Group identifier |
| `identityCommitment` | `string \| bigint` | ✅ | Identity commitment to add |

**Example:**
```typescript
zkProofService.addMemberToGroup('student-group', commitment);
```

---

### `exportGroupParameters()`

Exports group parameters for proof generation.

```typescript
exportGroupParameters(groupKey: string): {
  root: string;
  depth: number;
  size: number;
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupKey` | `string` | ✅ | Group identifier |

**Returns:** Group parameters

**Example:**
```typescript
const params = zkProofService.exportGroupParameters('age-verification-group');
console.log('Root:', params.root);
console.log('Size:', params.size);
```

---

### `clearCaches()`

Clears identity and group caches.

```typescript
clearCaches(): void
```

**Example:**
```typescript
zkProofService.clearCaches(); // Useful for testing
```

---

## Helper Functions

### `generateAgeVerificationProof()`

Convenience function for generating age verification proofs.

```typescript
async function generateAgeVerificationProof(
  credentials: VerifiableCredential[],
  minAge: number = 18
): Promise<ZKProof>
```

**Example:**
```typescript
import { generateAgeVerificationProof } from './services/zkProofService';

const proof = await generateAgeVerificationProof([ageCred], 21);
```

---

### `generateStudentStatusProof()`

Convenience function for generating student status proofs.

```typescript
async function generateStudentStatusProof(
  credentials: VerifiableCredential[],
  groupId: string = 'student'
): Promise<ZKProof>
```

**Example:**
```typescript
import { generateStudentStatusProof } from './services/zkProofService';

const proof = await generateStudentStatusProof([studentCred], 'university-123');
```

---

## Type Definitions

### `ZKProof`

The primary proof object returned by generation methods.

```typescript
interface ZKProof {
  /** Proof type: 'semaphore', 'plonk', or 'groth16' */
  type: 'semaphore' | 'plonk' | 'groth16';
  
  /** Serialized proof string (JSON) */
  proof: string;
  
  /** Public signals array: [nullifierHash, merkleTreeRoot, signal] */
  publicSignals: string[];
  
  /** Verification key identifier */
  verificationKey: string;
  
  /** Circuit identifier */
  circuit: string;
}
```

---

### `ZKCircuit`

Circuit definition for available proof types.

```typescript
interface ZKCircuit {
  /** Unique circuit identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Circuit description */
  description: string;
  
  /** Circuit type */
  type: 'age-verification' | 'membership-proof' | 'range-proof' | 'equality-proof';
  
  /** Verification key */
  verificationKey: string;
  
  /** Circuit constraints */
  constraints: Record<string, any>;
  
  /** List of public inputs */
  publicInputs: string[];
  
  /** List of private inputs */
  privateInputs: string[];
}
```

---

### `VerifiableCredential`

Standard W3C verifiable credential structure.

```typescript
interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
    logo?: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
    zkProof?: ZKProof;
    kiltProof?: KiltProof;
  };
  status: CredentialStatus;
  metadata: {
    schema: string;
    privacy: PrivacyLevel;
    revocable: boolean;
    transferable: boolean;
    chainType?: 'polkadot' | 'ethereum' | 'kilt';
  };
}
```

---

## Supported Circuits

### Age Verification Circuit

**Circuit ID:** `semaphore-age-verification`

**Public Inputs:** `['nullifierHash', 'merkleTreeRoot', 'signal']`

**Private Inputs:** `['identity', 'merkleTreeProof', 'age']`

**Constraints:**
- `minAge: 18` (minimum age requirement)
- `maxAge: 150` (maximum age)
- `groupDepth: 20` (Merkle tree depth)

**Required Credential Fields:**
- `credentialSubject.age` (number) OR
- `credentialSubject.birthDate` (string) OR
- `credentialSubject.dateOfBirth` (string) OR
- Type array containing "Age"

**Example:**
```typescript
const ageCred = {
  credentialSubject: { age: 25 },
  // ... other fields
};

const proof = await generateAgeVerificationProof([ageCred], 18);
```

---

### Membership Proof Circuit

**Circuit ID:** `semaphore-membership-proof`

**Public Inputs:** `['nullifierHash', 'merkleTreeRoot', 'signal']`

**Private Inputs:** `['identity', 'merkleTreeProof', 'membershipToken']`

**Constraints:**
- `groupSize: 1000` (maximum group size)
- `groupDepth: 20` (Merkle tree depth)

**Required Credential Fields:**
- `credentialSubject.membershipId` OR
- `credentialSubject.employeeId` OR
- `credentialSubject.studentId` OR
- `credentialSubject.organizationId` OR
- Type array containing "Membership", "Employee", or "Student"

**Example:**
```typescript
const studentCred = {
  credentialSubject: { studentId: 'S12345' },
  // ... other fields
};

const proof = await generateStudentStatusProof([studentCred], 'university');
```

---

## Complete Examples

### Age Verification Flow

```typescript
import { generateAgeVerificationProof, zkProofService } from './services/zkProofService';

// Step 1: Prepare credential
const ageCredential = {
  id: 'cred-1',
  type: ['VerifiableCredential', 'AgeCredential'],
  credentialSubject: { 
    id: 'did:example:user1',
    birthDate: '2000-05-15' 
  },
  issuer: { id: 'gov', name: 'Government' },
  issuanceDate: '2024-01-15',
  proof: { /* ... */ },
  status: 'valid',
  metadata: { /* ... */ }
};

// Step 2: Generate proof
const proof = await generateAgeVerificationProof([ageCredential], 21);

// Step 3: Verify proof
const expectedSignal = proof.publicSignals[2];
const isValid = await zkProofService.verifyZKProof(
  proof, 
  expectedSignal,
  'semaphore-age-verification'
);

console.log('Proof valid:', isValid); // true
```

### Membership Verification Flow

```typescript
import { generateStudentStatusProof } from './services/zkProofService';

const studentCred = {
  id: 'cred-2',
  type: ['VerifiableCredential', 'StudentCredential'],
  credentialSubject: { 
    id: 'did:example:user1',
    studentId: 'S12345'
  },
  issuer: { id: 'uni', name: 'University' },
  issuanceDate: '2024-01-15',
  proof: { /* ... */ },
  status: 'valid',
  metadata: { /* ... */ }
};

const proof = await generateStudentStatusProof([studentCred], 'university-123');
```

### Advanced: Custom Circuit Usage

```typescript
import { zkProofService } from './services/zkProofService';

// Get available circuits
const circuits = zkProofService.getAvailableCircuits();

// Select a circuit
const ageCircuit = circuits.find(c => c.id === 'semaphore-age-verification');

// Generate with specific inputs
const proof = await zkProofService.generateZKProof(
  'semaphore-age-verification',
  { minAge: 18 },
  [credential]
);

// Export group stats
const stats = await zkProofService.getGroupStats('semaphore-age-verification');
console.log(`Group has ${stats.memberCount} members`);
```

### Production Setup

```typescript
import { ZKProofService } from './services/zkProofService';

// Configure for production
const zkService = new ZKProofService({
  enableRealProofs: true,
  disableMockFallback: false,
  semaphoreConfig: {
    wasmFilePath: '/assets/semaphore.wasm',
    zkeyFilePath: '/assets/semaphore.zkey'
  }
});

// Use the configured service
const proof = await zkService.generateZKProof(/* ... */);
```

---

## Error Handling

### Circuit Not Found

```typescript
try {
  const proof = await zkProofService.generateZKProof('invalid-circuit', {}, []);
} catch (error) {
  if (error.message === 'Circuit not found') {
    console.error('Invalid circuit ID');
  }
}
```

### Credential Validation Failed

```typescript
try {
  const proof = await generateAgeVerificationProof([badCred], 18);
} catch (error) {
  if (error.message.includes('does not meet circuit requirements')) {
    console.error('Credential missing required age data');
  }
}
```

### Generation Failure

```typescript
try {
  const proof = await zkProofService.generateZKProof(/* ... */);
} catch (error) {
  console.error('ZK-proof generation failed:', error.message);
  // Implement fallback or retry logic
}
```

---

## Mock vs Real Modes

### Mock Mode (Default - Development)

```typescript
// No configuration needed - automatically uses mock mode
const proof = await generateAgeVerificationProof([cred], 18);
// Returns valid proof structure in ~2 seconds
// No actual cryptographic computation
```

**When to use:** Development, testing, prototyping

### Real Mode (Production)

```typescript
const service = new ZKProofService({
  enableRealProofs: true,
  semaphoreConfig: {
    wasmFilePath: '/assets/semaphore.wasm',
    zkeyFilePath: '/assets/semaphore.zkey'
  }
});

const proof = await service.generateZKProof(/* ... */);
// Generates real zk-SNARK proof using Groth16
// Takes 2-5 seconds with WASM/WASM optimization
```

**When to use:** Production, security-critical applications

---

## Performance Characteristics

| Operation | Mock Mode | Real Mode |
|-----------|-----------|-----------|
| Proof Generation | ~2s | ~2-5s |
| Verification | ~500ms | ~1-2s |
| Identity Creation | Instant | Instant |
| Group Updates | Instant | Instant |

---

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)  
- ✅ Safari (latest with WASM support)
- ⚠️ Older browsers may require polyfills
- ❌ No WebAssembly support = cannot run real mode

---

## See Also

- [ZK-Proof User Guide](./zkproof-guide.md) - Usage and examples
- [Integration Tutorial](./zkproof-integration-tutorial.md) - Step-by-step setup
- [Limitations and Security](./zkproof-limitations.md) - Constraints and warnings

