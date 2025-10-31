# ZK-Proof Integration Tutorial

Complete step-by-step guide for integrating zero-knowledge proofs into your KeyPass application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Install Dependencies](#step-1-install-dependencies)
4. [Step 2: Understand Semaphore Concepts](#step-2-understand-semaphore-concepts)
5. [Step 3: Basic Integration](#step-3-basic-integration)
6. [Step 4: Add UI Components](#step-4-add-ui-components)
7. [Step 5: Handle Verification](#step-5-handle-verification)
8. [Step 6: Production Setup](#step-6-production-setup)
9. [Flow Diagrams](#flow-diagrams)
10. [Common Use Cases](#common-use-cases)

---

## Overview

This tutorial walks through integrating Semaphore-based zk-proofs into a React application, enabling users to prove age or membership status without revealing private data.

**What You'll Build:**
- Age verification proof generation
- Student status proof generation
- Proof verification
- UI with loading states and error handling
- Export and sharing functionality

---

## Prerequisites

- Node.js 18+ installed
- React application (or React boilerplate from `examples/react-boilerplate`)
- Understanding of TypeScript and React hooks
- Basic knowledge of zero-knowledge proofs

---

## Step 1: Install Dependencies

Install Semaphore protocol packages and poseidon hashing:

```bash
npm install @semaphore-protocol/identity @semaphore-protocol/group @semaphore-protocol/proof poseidon-lite
```

**Package Versions:**
- `@semaphore-protocol/*`: `^4.11.1`
- `poseidon-lite`: `^0.3.0`

---

## Step 2: Understand Semaphore Concepts

### Identity
A private/public key pair derived deterministically from data (wallet signature or credential).

```typescript
// Identity commitment (public)
const commitment = identity.commitment; // BigInt

// Generated from wallet signature or credential data
```

### Group
A Merkle tree containing identity commitments.

```typescript
// Create group
const group = new Group([]);

// Add members
group.addMember(BigInt('123456'));

// Get Merkle tree root
const root = group.root; // Public root
```

### Proof
A zk-SNARK proving group membership without revealing which member.

**Components:**
- `nullifierHash` - Unique hash preventing reuse
- `merkleTreeRoot` - Group root being proved
- `signal` - Public message/data
- `proof` - Groth16 zk-SNARK proof object

---

## Step 3: Basic Integration

### 3.1 Import the Service

```typescript
import { zkProofService, generateAgeVerificationProof, generateStudentStatusProof } from './services/zkProofService';
```

### 3.2 Prepare a Credential

Ensure your credential has the required structure:

```typescript
const ageCredential: VerifiableCredential = {
  id: 'cred-1',
  type: ['VerifiableCredential', 'AgeCredential'],
  credentialSubject: {
    id: 'did:example:user1',
    age: 22  // Or birthDate: '2000-05-15'
  },
  issuer: {
    id: 'issuer-1',
    name: 'Government'
  },
  issuanceDate: '2024-01-15',
  proof: {
    type: 'Ed25519Signature2020',
    created: '2024-01-15',
    verificationMethod: 'did:example:issuer#key1',
    proofPurpose: 'assertionMethod',
    jws: '...'
  },
  status: 'valid',
  metadata: {
    schema: 'https://schema.org/credential',
    privacy: 'zero-knowledge',
    revocable: true,
    transferable: false
  }
};
```

### 3.3 Generate Proof

```typescript
// Age verification
const proof = await generateAgeVerificationProof([ageCredential], 18);

// Result:
// {
//   type: 'semaphore',
//   circuit: 'semaphore-age-verification',
//   proof: '{"pi_a":[...],"pi_b":[...],"pi_c":[...],"protocol":"groth16"}',
//   publicSignals: ['nullifierHash', 'merkleRoot', 'signal'],
//   verificationKey: 'semaphore_vk_age_v1'
// }
```

### 3.4 Verify Proof

```typescript
const expectedSignal = proof.publicSignals[2];
const isValid = await zkProofService.verifyZKProof(
  proof,
  expectedSignal,
  'semaphore-age-verification'
);

console.log('Valid:', isValid); // true or false
```

---

## Step 4: Add UI Components

### 4.1 Create Proof Generation Button

```typescript
import { useState } from 'react';

function ZKProofButton({ credentials }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proof, setProof] = useState(null);

  const handleGenerateProof = async () => {
    try {
      setIsGenerating(true);
      
      // Find age credential
      const ageCred = credentials.find(
        c => c.credentialSubject.age || 
             c.credentialSubject.birthDate ||
             c.credentialSubject.dateOfBirth
      );
      
      if (!ageCred) {
        alert('No age credential found');
        return;
      }
      
      // Generate proof
      const generatedProof = await generateAgeVerificationProof([ageCred], 18);
      setProof(generatedProof);
      
    } catch (error) {
      console.error('Proof generation failed:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleGenerateProof}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating... (≈2-5s)' : 'Generate Age Proof'}
      </button>
      
      {proof && (
        <div className="proof-result">
          <h4>Latest Proof</h4>
          <p>Type: {proof.type}</p>
          <p>Circuit: {proof.circuit}</p>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(proof, null, 2))}>
            Copy JSON
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4.2 Add Verification Display

```typescript
const [verification, setVerification] = useState(null);

const handleVerifyProof = async (proof) => {
  const expectedSignal = proof.publicSignals[2];
  const isValid = await zkProofService.verifyZKProof(
    proof,
    expectedSignal,
    'semaphore-age-verification'
  );
  
  setVerification({
    ok: isValid,
    timestamp: new Date().toISOString()
  });
};

// In JSX:
{verification && (
  <div style={{ color: verification.ok ? 'green' : 'red' }}>
    Verification: {verification.ok ? '✅ Valid' : '❌ Invalid'}
    <small> {new Date(verification.timestamp).toLocaleTimeString()}</small>
  </div>
)}
```

### 4.3 Add Export Functionality

```typescript
const handleExportProof = (proof) => {
  const blob = new Blob(
    [JSON.stringify(proof, null, 2)], 
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zk-proof-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// In JSX:
<button onClick={() => handleExportProof(proof)}>
  Download JSON
</button>
```

---

## Step 5: Handle Verification

### 5.1 Display Verification Status

```typescript
import { generateAgeVerificationProof, zkProofService } from './services/zkProofService';

function AgeVerificationProof() {
  const [proof, setProof] = useState(null);
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerateAndVerify = async (credentials) => {
    try {
      setError(null);
      
      // Generate
      const generatedProof = await generateAgeVerificationProof(credentials, 18);
      setProof(generatedProof);
      
      // Verify
      const expectedSignal = generatedProof.publicSignals[2];
      const isValid = await zkProofService.verifyZKProof(
        generatedProof,
        expectedSignal,
        'semaphore-age-verification'
      );
      
      setVerification({ ok: isValid });
      
    } catch (err) {
      setError(err.message);
      setVerification({ ok: false, message: err.message });
    }
  };

  return (
    <div>
      <button onClick={() => handleGenerateAndVerify(credentials)}>
        Generate & Verify Proof
      </button>
      
      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}
      
      {proof && (
        <div className="proof-info">
          <p>Circuit: {proof.circuit}</p>
          <p>Verification: {verification?.ok ? '✅ Valid' : '❌ Invalid'}</p>
        </div>
      )}
    </div>
  );
}
```

### 5.2 Add Selective Disclosure UI

```typescript
function SelectiveDisclosureCheckbox({ field, onChange, checked }) {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(field, e.target.checked)}
      />
      {field}
    </label>
  );
}

function DisclosureSelector({ credentials }) {
  const [selectedFields, setSelectedFields] = useState({});
  
  if (!credentials.length) return null;
  
  const fields = Object.keys(credentials[0].credentialSubject || {});
  
  return (
    <div>
      <h4>Select fields to disclose:</h4>
      {fields.map(field => (
        <SelectiveDisclosureCheckbox
          key={field}
          field={field}
          checked={!!selectedFields[field]}
          onChange={(field, checked) => 
            setSelectedFields({...selectedFields, [field]: checked})
          }
        />
      ))}
    </div>
  );
}
```

---

## Step 6: Production Setup

### 6.1 Configure for Production

```typescript
import { ZKProofService } from './services/zkProofService';

// Create production service instance
const productionZKService = new ZKProofService({
  enableRealProofs: true,
  disableMockFallback: false,
  semaphoreConfig: {
    wasmFilePath: '/assets/semaphore.wasm',
    zkeyFilePath: '/assets/semaphore.zkey'
  }
});

// Export or use in your app
export { productionZKService };
```

### 6.2 Add Environment Variables

Create `.env.production`:

```bash
REACT_APP_ENABLE_REAL_ZK_PROOFS=true
REACT_APP_SEMAPHORE_WASM_PATH=/assets/semaphore.wasm
REACT_APP_SEMAPHORE_ZKEY_PATH=/assets/semaphore.zkey
```

### 6.3 Conditional Configuration

```typescript
const zkService = new ZKProofService({
  enableRealProofs: process.env.REACT_APP_ENABLE_REAL_ZK_PROOFS === 'true',
  semaphoreConfig: {
    wasmFilePath: process.env.REACT_APP_SEMAPHORE_WASM_PATH,
    zkeyFilePath: process.env.REACT_APP_SEMAPHORE_ZKEY_PATH
  }
});
```

---

## Flow Diagrams

### Age Verification Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Age Verification Flow                      │
└─────────────────────────────────────────────────────────────┘

1. User has age credential
   │
   ├─── credentialSubject.age: 22
   ├─── OR credentialSubject.birthDate: '2000-05-15'
   └─── OR type includes "AgeCredential"

2. User clicks "Generate Age Proof"
   │
   ├─── UI: Show loading spinner
   ├─── UI: Display "Generating... (≈2-5s)"

3. Backend generates proof
   │
   ├─── Extract age data from credential
   ├─── Create/retrieve Semaphore identity
   ├─── Add identity to age verification group
   ├─── Generate Merkle proof
   ├─── Create signal from age + minAge comparison
   ├─── Compute external nullifier
   ├─── Run Groth16 proof generation (2-5s)
   └─── Return ZKProof object

4. Proof generated
   │
   ├─── proof.type: 'semaphore'
   ├─── proof.circuit: 'semaphore-age-verification'
   ├─── proof.publicSignals: [nullifier, root, signal]
   └─── proof.proof: serialized Groth16 proof

5. Automatic verification
   │
   ├─── Extract expectedSignal from proof.publicSignals[2]
   ├─── Call verifyZKProof()
   ├─── Parse proof JSON
   ├─── Check group root (if available)
   ├─── Verify signal matches expected
   ├─── Run Semaphore verifyProof()
   └─── Return boolean

6. Display result
   │
   ├─── UI: Hide loading spinner
   ├─── UI: Show "Latest Proof" panel
   ├─── UI: Display verification status (✅/❌)
   ├─── UI: Show public signals
   ├─── UI: Provide "Copy JSON" button
   └─── UI: Provide "Download JSON" button

7. User exports proof (optional)
   │
   ├─── Click "Copy JSON" → Clipboard
   └─── Click "Download JSON" → File download
```

### Student Status Verification Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 Student Status Verification Flow               │
└─────────────────────────────────────────────────────────────┘

1. User has student credential
   │
   ├─── credentialSubject.studentId: 'S12345'
   ├─── OR credentialSubject.organizationId
   └─── OR type includes "StudentCredential"

2. User clicks "Prove Student Status"
   │
   └─── Same as age verification flow...

3. Differences
   │
   ├─── Circuit: 'semaphore-membership-proof'
   ├─── Group: membership proof group
   ├─── Signal: groupId + isMember boolean
   └─── Verification key: semaphore_vk_membership_v1

4. SBT ownership check (optional)
   │
   ├─── Check if studentId exists in credential
   ├─── Verify against SBT contract (future enhancement)
   └─── Display "SBT Ownership: Confirmed/Unknown"
```

### Proof Verification Flow (Verifier Side)

```
┌─────────────────────────────────────────────────────────────┐
│                    Proof Verification Flow                     │
└─────────────────────────────────────────────────────────────┘

Verifier receives proof from user
   │
   ├─── Parse JSON string to proof object
   │
   ├─── Extract components:
   │   ├─── nullifierHash (check if already used)
   │   ├─── merkleTreeRoot (validate against known root)
   │   ├─── signal (validate expected message)
   │   └─── proof (Groth16 zk-SNARK)
   │
   ├─── Validation checks:
   │   ├─── Circuit ID matches expected type
   │   ├─── Group root exists and is current
   │   ├─── Signal matches expected value
   │   ├─── Nullifier not previously used
   │   └─── Expiration not reached
   │
   ├─── Cryptographic verification:
   │   ├─── Parse proof.pi_a, pi_b, pi_c
   │   ├─── Load verification key
   │   ├─── Run Groth16 verification
   │   └─── Check all constraints pass
   │
   └─── Return result
       ├─── Valid: Grant access/service
       └─── Invalid: Reject and log

Store nullifier (prevent reuse)
   └─── Add nullifierHash to used set
```

---

## Common Use Cases

### Use Case 1: Age-Gated Access

**Scenario:** Restrict access to 18+ content.

```typescript
async function checkAgeRequirement(userCredential: VerifiableCredential) {
  try {
    // Generate age verification proof
    const proof = await generateAgeVerificationProof([userCredential], 18);
    
    // Send to server for verification
    const response = await fetch('/api/verify-age', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof })
    });
    
    const { isValid, granted } = await response.json();
    
    if (isValid && granted) {
      // User is 18+, grant access
      return { authorized: true };
    } else {
      return { authorized: false, reason: 'Age requirement not met' };
    }
  } catch (error) {
    return { authorized: false, error: error.message };
  }
}
```

### Use Case 2: Anonymous Group Membership

**Scenario:** Prove membership without revealing identity.

```typescript
async function proveMembership(userCredential: VerifiableCredential, groupId: string) {
  const proof = await generateStudentStatusProof([userCredential], groupId);
  
  // User can prove membership without revealing who they are
  console.log('Membership proven anonymously');
  console.log('Group:', groupId);
  console.log('Proof ID:', proof.publicSignals[0]); // nullifierHash
  
  return proof;
}
```

### Use Case 3: Privacy-Preserving Voting

**Scenario:** Vote in a group poll without revealing your vote or identity.

```typescript
async function castAnonymousVote(
  membershipCredential: VerifiableCredential,
  voteChoice: string
) {
  // 1. Generate membership proof
  const proof = await generateStudentStatusProof([membershipCredential], 'voter-group');
  
  // 2. Encode vote in signal
  const voteSignal = poseidon2([BigInt(voteChoice), proof.publicSignals[2]]);
  
  // 3. Submit anonymously
  await fetch('/api/vote', {
    method: 'POST',
    body: JSON.stringify({ 
      proof: { ...proof, publicSignals: [...proof.publicSignals, voteSignal] }
    })
  });
  
  // Identity remains unknown, vote choice hidden
}
```

---

## Testing

### Unit Tests

```typescript
import { zkProofService, generateAgeVerificationProof } from './services/zkProofService';

describe('Age Verification', () => {
  it('generates valid proof', async () => {
    const cred = {
      credentialSubject: { age: 22 },
      // ... other fields
    };
    
    const proof = await generateAgeVerificationProof([cred], 18);
    
    expect(proof.type).toBe('semaphore');
    expect(proof.circuit).toBe('semaphore-age-verification');
    expect(proof.publicSignals).toHaveLength(3);
  });
  
  it('verifies proof correctly', async () => {
    const proof = // ... generated proof
    
    const isValid = await zkProofService.verifyZKProof(
      proof,
      proof.publicSignals[2]
    );
    
    expect(isValid).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('ZK Proof UI Integration', () => {
  it('handles full flow', async () => {
    const { getByText, getByRole } = render(<ZKProofSection />);
    
    // Click generate button
    fireEvent.click(getByRole('button', { name: /generate age proof/i }));
    
    // Wait for generation
    await waitFor(() => {
      expect(getByText(/latest proof/i)).toBeInTheDocument();
    });
    
    // Verify result displays
    expect(getByText(/semaphore-age-verification/)).toBeInTheDocument();
  });
});
```

---

## Best Practices

1. **Always validate credentials** before proof generation
2. **Show loading states** during generation (2-5 seconds)
3. **Handle errors gracefully** with user-friendly messages
4. **Cache proofs** when appropriate (same credential + params)
5. **Use mock mode** during development for speed
6. **Enable real proofs** only in production
7. **Verify on server** for security-critical applications
8. **Store nullifiers** to prevent double-spending
9. **Log verification attempts** for audit trail
10. **Provide clear feedback** to users throughout the flow

---

## Troubleshooting

### Issue: "Circuit not found"

**Solution:** Use supported circuit IDs:
- `semaphore-age-verification`
- `semaphore-membership-proof`

### Issue: "No age-related credential found"

**Solution:** Ensure credential has:
- `credentialSubject.age` (number), or
- `credentialSubject.birthDate` (string), or
- `credentialSubject.dateOfBirth` (string), or
- Type array including "Age"

### Issue: Proof generation times out

**Solution:**
- Check circuit parameters are valid
- Ensure credential data is complete
- Try mock mode first to isolate issue
- Increase timeout if needed

### Issue: Verification always returns false

**Solution:**
- Verify proof was generated correctly
- Check expectedSignal matches publicSignals[2]
- Ensure group root is current
- Confirm proof hasn't been reused

---

## Next Steps

- Review [API Reference](./zkproof-api.md) for detailed method docs
- See [User Guide](./zkproof-guide.md) for usage examples
- Check [Limitations](./zkproof-limitations.md) for constraints
- Read [Implementation Docs](../examples/react-boilerplate/ZK_PROOF_IMPLEMENTATION.md) for technical details

---

## Resources

- [Semaphore Protocol Docs](https://semaphore.appliedzkp.org/)
- [Groth16 zk-SNARKs](https://z.cash/technology/zksnarks/)
- [Poseidon Hash](https://www.poseidon-hash.info/)
- [Verifiable Credentials Spec](https://www.w3.org/TR/vc-data-model/)

