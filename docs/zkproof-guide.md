# ZK-Proof User Guide

## Overview

ZK-proofs (zero-knowledge proofs) allow you to prove that you meet certain requirements (like being over 18 or a student) without revealing your private data. KeyPass uses the **Semaphore protocol** to generate these privacy-preserving proofs from your verifiable credentials.

## What Are ZK-Proofs?

Traditional verification requires showing your full credential, exposing sensitive information. ZK-proofs let you:
- ✅ **Prove eligibility** (age, membership, status) without showing exact values
- ✅ **Maintain privacy** by not revealing your identity or personal details
- ✅ **Prevent tracking** through unique nullifiers for each proof
- ✅ **Selective disclosure** of only the fields you choose

## Quick Start

### Generate an Age Verification Proof

```typescript
import { generateAgeVerificationProof } from './services/zkProofService';

// You have a credential with age information
const ageCredential = {
  id: 'cred-1',
  type: ['VerifiableCredential', 'AgeCredential'],
  credentialSubject: { age: 22 },
  issuer: { name: 'Government' },
  issuanceDate: '2024-01-15'
};

// Generate proof that you're over 18
const proof = await generateAgeVerificationProof([ageCredential], 18);

console.log('Proof generated!');
console.log('Type:', proof.type); // 'semaphore'
console.log('Circuit:', proof.circuit); // 'semaphore-age-verification'
console.log('Public Signals:', proof.publicSignals);
```

### Verify a Proof

```typescript
import { zkProofService } from './services/zkProofService';

// Verify the proof
const expectedSignal = proof.publicSignals[2];
const isValid = await zkProofService.verifyZKProof(
  proof, 
  expectedSignal,
  'semaphore-age-verification'
);

console.log('Proof verified:', isValid ? 'Valid ✅' : 'Invalid ❌');
```

### Generate a Student Status Proof

```typescript
import { generateStudentStatusProof } from './services/zkProofService';

const studentCredential = {
  id: 'cred-2',
  type: ['VerifiableCredential', 'StudentCredential'],
  credentialSubject: { studentId: 'S12345' },
  issuer: { name: 'University' },
  issuanceDate: '2024-01-15'
};

// Prove student status without revealing your student ID
const proof = await generateStudentStatusProof([studentCredential], 'student');
```

## Supported Proof Types

### 1. Age Verification

Prove you meet minimum age requirements without revealing your exact age.

**Requirements:**
- Credential with `age`, `birthDate`, or `dateOfBirth` field
- Or credential type containing "Age"

**Example:**
```typescript
const ageCred = {
  credentialSubject: { birthDate: '2000-05-15' },
  // ... other fields
};

const proof = await generateAgeVerificationProof([ageCred], 21);
// Proves age >= 21 without showing exact age
```

### 2. Membership Proof

Prove membership in a group without revealing your identity.

**Requirements:**
- Credential with `membershipId`, `employeeId`, `studentId`, or `organizationId`
- Or credential type containing "Membership", "Employee", or "Student"

**Example:**
```typescript
const memberCred = {
  credentialSubject: { organizationId: 'org-123' },
  // ... other fields
};

const proof = await generateStudentStatusProof([memberCred], 'org-123');
// Proves membership without showing who you are
```

## Advanced Usage

### Custom Proof Generation

```typescript
import { zkProofService } from './services/zkProofService';

// Manually specify circuit and inputs
const proof = await zkProofService.generateZKProof(
  'semaphore-age-verification', // Circuit ID
  { minAge: 21 },               // Public inputs
  [ageCredential]                // Your credentials
);
```

### Check Available Circuits

```typescript
const circuits = zkProofService.getAvailableCircuits();

circuits.forEach(circuit => {
  console.log(`${circuit.name}: ${circuit.description}`);
  console.log('Public inputs:', circuit.publicInputs);
  console.log('Private inputs:', circuit.privateInputs);
});
```

### View Group Statistics

```typescript
const stats = await zkProofService.getGroupStats('semaphore-age-verification');

console.log('Group Stats:');
console.log('- Members:', stats.memberCount);
console.log('- Depth:', stats.depth);
console.log('- Group ID:', stats.groupId);
```

### Generate Identity from Wallet

```typescript
import { zkProofService } from './services/zkProofService';

// Connect your wallet
const wallet = {
  address: '0x...',
  signMessage: async (msg: string) => {
    // Your wallet sign implementation
  }
};

// Generate deterministic Semaphore identity
const { identity, commitment } = await zkProofService.generateSemaphoreIdentity(wallet);
console.log('Identity commitment:', commitment);
```

### Export and Share Proofs

```typescript
// Export as JSON for sharing
const proofJson = JSON.stringify(proof, null, 2);
console.log(proofJson);

// Download proof file
const blob = new Blob([proofJson], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `zk-proof-${Date.now()}.json`;
a.click();
```

## How It Works

### Proof Generation Flow

1. **Identity Creation**: Your credential data generates a unique identity commitment
2. **Group Membership**: Identity is added to a Semaphore group (age, student, etc.)
3. **Merkle Proof**: A proof of group membership is generated
4. **Signal Generation**: Circuit-specific signal created from your credential data
5. **Nullifier**: Unique external nullifier prevents replay attacks
6. **Proof**: Groth16 zk-SNARK proof generated

### Verification Flow

1. **Parse Proof**: Extract proof components
2. **Check Group**: Verify proof against known group root
3. **Verify Signal**: Validate expected message/signal
4. **Verify Cryptography**: Run Groth16 verification
5. **Result**: Return valid/invalid

## Troubleshooting

### "No age-related credential found"

**Problem**: Your credential doesn't have age information.

**Solution**: Ensure your credential has one of:
- `credentialSubject.age` field
- `credentialSubject.birthDate` field  
- `credentialSubject.dateOfBirth` field
- A `type` array containing "Age"

### "Circuit not found"

**Problem**: Using an unsupported circuit ID.

**Solution**: Use one of the supported circuits:
- `semaphore-age-verification`
- `semaphore-membership-proof`

### "ZK-proof generation failed"

**Problem**: General proof generation error.

**Solution**: 
- Check credential data is valid
- Ensure required fields are present
- Try mock mode first: `zkProofService` defaults to mock mode for development

### Proof Generation Takes Too Long

**Problem**: Real proof generation can take 2-5 seconds.

**Solution**: 
- This is normal for production proofs
- For development, use mock mode (default)
- Show user "Generating..." progress indicator

### "Cannot read properties of undefined"

**Problem**: Missing credential fields.

**Solution**: Ensure credentials have required structure:
- `id`
- `type` (array)
- `credentialSubject` (object)
- `issuer` (object with at least `name`)
- `issuanceDate`

## Privacy Benefits

### What's Public

- **Circuit Type**: Which proof you're generating (age verification, membership)
- **Public Signals**: Predefined outputs like "isValid" or "isMember"
- **Group Root**: Root of the Merkle tree (not member list)

### What's Private

- **Your Exact Data**: Age, student ID, membership ID
- **Your Identity**: Who you are in the group
- **Credential Details**: Specific credential contents
- **Internal Values**: Merkle tree path, intermediate hashes

### Selective Disclosure

You control what's revealed:
- ✅ Show only that you meet requirements
- ✅ Hide specific values you don't want shared
- ✅ Generate unique proofs for each verification
- ✅ Prevent tracking through nullifier system

## Security Considerations

### Nullifiers

Each proof generates a unique nullifier to prevent double-spending. Verifiers can track used nullifiers to ensure proofs aren't reused.

### Group Membership

Proofs only work if your identity is in the appropriate group. Groups must be properly managed and updated.

### Credential Validation

Always validate credentials before accepting them for proof generation. Check issuer, expiration, and revocation status.

## Performance Tips

### Caching

Identities and groups are cached automatically:
- ✅ Same credential = same identity commitment
- ✅ Groups reused across multiple proofs
- ✅ Faster subsequent proof generation

### Mock Mode for Development

Use mock mode for faster iteration:
```typescript
// Mock mode is default - no configuration needed
const proof = await generateAgeVerificationProof(credentials, 18);
// Returns valid proof structure in ~2 seconds
```

### Production Setup

Enable real proofs when deploying:
```typescript
import { ZKProofService } from './services/zkProofService';

const zkService = new ZKProofService({
  enableRealProofs: true,
  disableMockFallback: false
});

const proof = await zkService.generateZKProof(/* ... */);
```

## Best Practices

1. **Validate First**: Always check credential data before generating proofs
2. **Handle Errors**: Provide user-friendly error messages
3. **Show Progress**: Indicate proof generation is in progress
4. **Cache When Possible**: Reuse identities and groups
5. **Test Thoroughly**: Use mock mode during development
6. **Privacy First**: Only reveal minimum necessary information
7. **Verify on Server**: Don't trust client-side verification only

## Examples

See complete working examples in:
- **React Demo**: `examples/react-boilerplate/` - Full UI implementation
- **Tests**: `examples/react-boilerplate/src/services/__tests__/` - Unit and integration tests
- **Implementation Doc**: `examples/react-boilerplate/ZK_PROOF_IMPLEMENTATION.md` - Technical details

## Next Steps

- Read the [ZK-Proof API Reference](./zkproof-api.md)
- Follow the [Integration Tutorial](./zkproof-integration-tutorial.md)
- Check [Limitations and Security](./zkproof-limitations.md)

