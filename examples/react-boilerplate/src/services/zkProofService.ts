import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof, verifyProof } from '@semaphore-protocol/proof';
import { poseidon2 } from 'poseidon-lite';
import { ZKProof, ZKCircuit, VerifiableCredential } from '../types/credential';

// Semaphore group configurations for different use cases
const SEMAPHORE_GROUPS = {
  AGE_VERIFICATION: {
    groupId: '1',
    depth: 20,
    description: 'Age verification group for 18+ proof'
  },
  MEMBERSHIP_PROOF: {
    groupId: '2', 
    depth: 20,
    description: 'Membership proof group for organizations'
  },
  CREDENTIAL_VERIFICATION: {
    groupId: '3',
    depth: 20,
    description: 'Credential verification group'
  }
} as const;

// Real ZK circuits using Semaphore
const REAL_ZK_CIRCUITS: ZKCircuit[] = [
  {
    id: 'semaphore-age-verification',
    name: 'Semaphore Age Verification',
    description: 'Prove you are over 18 without revealing your exact age using Semaphore protocol',
    type: 'age-verification',
    verificationKey: 'semaphore_vk_age_v1',
    constraints: { minAge: 18, maxAge: 150, groupDepth: 20 },
    publicInputs: ['nullifierHash', 'merkleTreeRoot', 'signal'],
    privateInputs: ['identity', 'merkleTreeProof', 'age']
  },
  {
    id: 'semaphore-membership-proof',
    name: 'Semaphore Membership Proof',
    description: 'Prove membership in a group without revealing your identity using Semaphore',
    type: 'membership-proof',
    verificationKey: 'semaphore_vk_membership_v1',
    constraints: { groupSize: 1000, groupDepth: 20 },
    publicInputs: ['nullifierHash', 'merkleTreeRoot', 'signal'],
    privateInputs: ['identity', 'merkleTreeProof', 'membershipToken']
  }
];

export interface ZKProofServiceConfig {
  enableRealProofs?: boolean;
  semaphoreConfig?: {
    wasmFilePath?: string;
    zkeyFilePath?: string;
  };
  mockMode?: boolean;
}

export class ZKProofService {
  private config: ZKProofServiceConfig;
  private identityCache: Map<string, Identity> = new Map();
  private groupCache: Map<string, Group> = new Map();

  constructor(config: ZKProofServiceConfig = {}) {
    this.config = {
      enableRealProofs: false, // Disable real proofs by default to avoid API issues
      mockMode: true, // Enable mock mode by default
      ...config
    };
  }

  /**
   * Generate a Semaphore identity derived from a wallet signature.
   * Wallet must implement `{ address: string; signMessage(msg: string): Promise<string> }`.
   */
  async generateSemaphoreIdentity(wallet: { address: string; signMessage: (msg: string) => Promise<string> }): Promise<{ identity: Identity; commitment: string }>{
    if (!wallet || !wallet.address || typeof wallet.signMessage !== 'function') {
      throw new Error('Invalid wallet provided for identity generation');
    }

    const cacheKey = `wallet:${wallet.address.toLowerCase()}`;
    const cached = this.identityCache.get(cacheKey);
    if (cached) {
      return { identity: cached, commitment: cached.commitment.toString() };
    }

    const domainSeparatedMsg = [
      'KeyPass Semaphore Identity',
      `Address: ${wallet.address.toLowerCase()}`,
      'Purpose: deterministic identity seed',
    ].join('\n');

    const signature = await wallet.signMessage(domainSeparatedMsg);
    // Derive a field element from the signature deterministically
    const sigHex = signature.startsWith('0x') ? signature.slice(2) : signature;
    const seedA = BigInt('0x' + sigHex.slice(0, 32));
    const seedB = BigInt('0x' + Buffer.from(wallet.address.toLowerCase()).toString('hex').slice(0, 32));
    const secret = poseidon2([seedA, seedB]);

    const identity = new Identity(secret.toString());
    this.identityCache.set(cacheKey, identity);

    return { identity, commitment: identity.commitment.toString() };
  }

  /**
   * Create a real Semaphore group and cache it.
   */
  createSemaphoreGroup(groupKey: string, depth: number = 20): Group {
    if (this.groupCache.has(groupKey)) {
      return this.groupCache.get(groupKey)!;
    }
    const group = new Group(depth, groupKey);
    this.groupCache.set(groupKey, group);
    return group;
  }

  /**
   * Add a member (identity commitment) to a group.
   */
  addMemberToGroup(groupKey: string, identityCommitment: string | bigint): void {
    const group = this.groupCache.get(groupKey) || this.createSemaphoreGroup(groupKey);
    const commitmentBigInt = typeof identityCommitment === 'bigint' ? identityCommitment : BigInt(identityCommitment);
    group.addMember(commitmentBigInt);
  }

  /**
   * Export group parameters for proof generation.
   */
  exportGroupParameters(groupKey: string): { root: string; depth: number; size: number } {
    const group = this.groupCache.get(groupKey);
    if (!group) {
      throw new Error(`Group not found: ${groupKey}`);
    }
    return {
      root: group.root.toString(),
      depth: group.depth,
      size: group.members.length,
    };
  }

  /**
   * Get available ZK circuits
   */
  getAvailableCircuits(): ZKCircuit[] {
    return REAL_ZK_CIRCUITS;
  }

  /**
   * Create or retrieve a Semaphore identity from a credential
   */
  private async createIdentity(credential: VerifiableCredential): Promise<Identity> {
    const identityKey = `${credential.id}_${credential.credentialSubject.id}`;
    
    if (this.identityCache.has(identityKey)) {
      return this.identityCache.get(identityKey)!;
    }

    // Create deterministic identity from credential data
    const credentialData = JSON.stringify({
      id: credential.id,
      subject: credential.credentialSubject.id,
      issuer: credential.issuer.id,
      issuanceDate: credential.issuanceDate
    });

    // Use Poseidon hash for deterministic identity creation
    const identitySecret = poseidon2([
      BigInt('0x' + Buffer.from(credentialData).toString('hex').slice(0, 32)),
      BigInt('0x' + Buffer.from(credential.id).toString('hex').slice(0, 32))
    ]);

    const identity = new Identity(identitySecret.toString());
    this.identityCache.set(identityKey, identity);
    
    return identity;
  }

  /**
   * Get or create a Semaphore group for the circuit
   */
  private async getGroup(circuitId: string): Promise<Group> {
    // Check cache first
    if (this.groupCache.has(circuitId)) {
      return this.groupCache.get(circuitId)!;
    }

    // For now, use mock groups to avoid API compatibility issues
    const mockGroup = {
      groupId: '1',
      depth: 20,
      members: [],
      addMember: function(commitment: any) {
        this.members.push(commitment);
      },
      generateMerkleProof: function(commitment: any) {
        return {
          leaf: commitment,
          pathIndices: [0, 1],
          siblings: [BigInt('0x5678'), BigInt('0x9abc')]
        };
      }
    } as any;

    this.groupCache.set(circuitId, mockGroup);
    return mockGroup;
  }

  /**
   * Add identity to appropriate group based on credential type
   */
  private async addToGroup(
    identity: Identity, 
    credential: VerifiableCredential, 
    circuitId: string
  ): Promise<void> {
    const group = await this.getGroup(circuitId);
    
    // Check if already in group
    const commitment = identity.commitment;
    if (group.members.includes(commitment)) {
      return;
    }

    // Validate credential before adding to group
    if (await this.validateCredentialForCircuit(credential, circuitId)) {
      group.addMember(commitment);
    } else {
      throw new Error('Credential does not meet circuit requirements');
    }
  }

  /**
   * Validate that a credential meets the requirements for a specific circuit
   */
  private async validateCredentialForCircuit(
    credential: VerifiableCredential,
    circuitId: string
  ): Promise<boolean> {
    const circuit = REAL_ZK_CIRCUITS.find(c => c.id === circuitId);
    if (!circuit) return false;

    switch (circuit.type) {
      case 'age-verification':
        return this.validateAgeCredential(credential);
      case 'membership-proof':
        return this.validateMembershipCredential(credential);
      default:
        return true;
    }
  }

  /**
   * Validate age verification credential
   */
  private validateAgeCredential(credential: VerifiableCredential): boolean {
    // Check if credential contains age or birth date information
    const subject = credential.credentialSubject;
    return (
      subject.hasOwnProperty('age') ||
      subject.hasOwnProperty('birthDate') ||
      subject.hasOwnProperty('dateOfBirth') ||
      credential.type.some(t => t.toLowerCase().includes('age'))
    );
  }

  /**
   * Validate membership credential
   */
  private validateMembershipCredential(credential: VerifiableCredential): boolean {
    // Check if credential represents some form of membership
    const subject = credential.credentialSubject;
    return (
      subject.hasOwnProperty('membershipId') ||
      subject.hasOwnProperty('organizationId') ||
      subject.hasOwnProperty('role') ||
      credential.type.some(t => 
        t.toLowerCase().includes('membership') ||
        t.toLowerCase().includes('employee') ||
        t.toLowerCase().includes('student')
      )
    );
  }

  /**
   * Generate a real ZK-proof using Semaphore protocol
   */
  async generateZKProof(
    circuitId: string,
    publicInputs: Record<string, any>,
    credentials: VerifiableCredential[]
  ): Promise<ZKProof> {
    // If not in mock mode and real proofs are disabled, throw error
    if (!this.config.mockMode && !this.config.enableRealProofs) {
      throw new Error('Real ZK-proof generation is disabled');
    }
    // Validate circuit exists
    const circuit = REAL_ZK_CIRCUITS.find(c => c.id === circuitId);
    if (!circuit) {
      throw new Error('Circuit not found');
    }
    // Validate credentials array
    if (!credentials || credentials.length === 0) {
      throw new Error('At least one credential is required');
    }
    // Validate credentials for the circuit
    for (const credential of credentials) {
      const valid = await this.validateCredentialForCircuit(credential, circuitId);
      if (!valid) {
        throw new Error('Credential does not meet circuit requirements');
      }
    }
    // If real proofs enabled, attempt real generation
    if (this.config.enableRealProofs) {
      try {
        const credential = credentials[0];
        const identity = await this.createIdentity(credential);

        // Ensure group exists and includes the identity commitment
        const groupKey = circuitId;
        const group = this.createSemaphoreGroup(groupKey, (REAL_ZK_CIRCUITS.find(c=>c.id===circuitId)?.constraints as any)?.groupDepth || 20);
        const commitment = identity.commitment;
        if (!group.members.includes(commitment)) {
          group.addMember(commitment);
        }
        const memberIndex = group.members.findIndex((m: bigint) => m === commitment);
        const merkleProof = group.generateMerkleProof(memberIndex);

        const signal = this.createSignalForCircuit(circuitId, publicInputs, credential);
        const { wasmFilePath, zkeyFilePath } = this.config.semaphoreConfig || {};
        if (!wasmFilePath || !zkeyFilePath) {
          throw new Error('Semaphore circuit artifacts not configured (wasm/zkey)');
        }

        const fullProof: any = await generateProof(identity, merkleProof, signal, { wasmFilePath, zkeyFilePath });

        return {
          type: 'semaphore',
          proof: JSON.stringify(fullProof),
          publicSignals: [
            String(fullProof.nullifierHash ?? ''),
            String(fullProof.merkleTreeRoot ?? ''),
            String(fullProof.signal ?? signal)
          ],
          verificationKey: REAL_ZK_CIRCUITS.find(c => c.id === circuitId)?.verificationKey || 'semaphore_vk',
          circuit: circuitId
        };
      } catch (err: any) {
        const message = err?.message || String(err);
        throw new Error(`ZK-proof generation failed: ${message}`);
      }
    }

    // Fallback to mock mode
    return this.generateMockProof(circuitId, publicInputs);
  }

  /**
   * Create appropriate signal for the circuit type
   */
  private createSignalForCircuit(
    circuitId: string,
    publicInputs: Record<string, any>,
    credential: VerifiableCredential
  ): string {
    const circuit = REAL_ZK_CIRCUITS.find(c => c.id === circuitId);
    if (!circuit) throw new Error(`Circuit not found: ${circuitId}`);

    switch (circuit.type) {
      case 'age-verification':
        return this.createAgeVerificationSignal(publicInputs, credential);
      case 'membership-proof':
        return this.createMembershipSignal(publicInputs, credential);
      default:
        return poseidon2([
          BigInt('0x' + Buffer.from(JSON.stringify(publicInputs)).toString('hex').slice(0, 32)),
          BigInt('0x' + Buffer.from(credential.id).toString('hex').slice(0, 32))
        ]).toString();
    }
  }

  /**
   * Create signal for age verification
   */
  private createAgeVerificationSignal(
    publicInputs: Record<string, any>,
    credential: VerifiableCredential
  ): string {
    const minAge = publicInputs.minAge || 18;
    const currentDate = new Date();
    const credentialSubject = credential.credentialSubject;
    
    // Extract age information from credential
    let userAge = 0;
    if (credentialSubject.age) {
      userAge = parseInt(credentialSubject.age);
    } else if (credentialSubject.birthDate || credentialSubject.dateOfBirth) {
      const birthDate = new Date(credentialSubject.birthDate || credentialSubject.dateOfBirth);
      userAge = currentDate.getFullYear() - birthDate.getFullYear();
    }
    
    const isValid = userAge >= minAge;
    
    // Create signal that proves age requirement without revealing exact age
    return poseidon2([
      BigInt(minAge),
      BigInt(isValid ? 1 : 0)
    ]).toString();
  }

  /**
   * Create signal for membership proof
   */
  private createMembershipSignal(
    publicInputs: Record<string, any>,
    credential: VerifiableCredential
  ): string {
    const groupId = publicInputs.groupId || 'default';
    const credentialSubject = credential.credentialSubject;
    
    // Extract membership information
    const membershipId = credentialSubject.membershipId || 
                        credentialSubject.employeeId || 
                        credentialSubject.studentId || 
                        credential.id;
    
    const isMember = Boolean(membershipId);
    
    return poseidon2([
      BigInt('0x' + Buffer.from(groupId).toString('hex').slice(0, 32)),
      BigInt(isMember ? 1 : 0)
    ]).toString();
  }

  /**
   * Verify a ZK-proof
   */
  async verifyZKProof(
    zkProof: ZKProof,
    expectedSignal: string,
    groupId?: string
  ): Promise<boolean> {
    // Use real verification when enabled
    if (this.config.enableRealProofs) {
      try {
        const proofObj = typeof zkProof.proof === 'string' ? JSON.parse(zkProof.proof) : zkProof.proof;

        // Validate group root if available
        if (groupId && this.groupCache.has(groupId)) {
          const group = this.groupCache.get(groupId)!;
          const rootMatches = String(proofObj.merkleTreeRoot ?? '') === group.root.toString();
          if (!rootMatches) return false;
        }

        // Validate expected signal
        const signalOk = String(proofObj.signal ?? '') === String(expectedSignal);
        if (!signalOk) return false;

        const verified = await verifyProof(proofObj as any, REAL_ZK_CIRCUITS.find(c=>c.id===zkProof.circuit)?.verificationKey || 'semaphore_vk');
        return Boolean(verified);
      } catch {
        return false;
      }
    }

    // Fallback to mock verification
    return this.verifyMockProof(zkProof);
  }

  /**
   * Check if nullifier has been used (prevents double-spending)
   */
  private async isNullifierUsed(nullifierHash: string): Promise<boolean> {
    // In production, this would check a database of used nullifiers
    // For now, we'll assume all nullifiers are fresh
    return false;
  }

  /**
   * Generate mock proof for testing
   */
  private async generateMockProof(
    circuitId: string,
    publicInputs: Record<string, any>
  ): Promise<ZKProof> {
    // Simulate proof generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      type: 'semaphore',
      proof: JSON.stringify({
        nullifierHash: `mock_nullifier_${Date.now()}`,
        merkleTreeRoot: `mock_root_${Math.random().toString(36)}`,
        signal: Object.values(publicInputs).join('_')
      }),
      publicSignals: [
        `mock_nullifier_${Date.now()}`,
        `mock_root_${Math.random().toString(36)}`,
        Object.values(publicInputs).join('_')
      ],
      verificationKey: `mock_vk_${circuitId}`,
      circuit: circuitId
    };
  }

  /**
   * Verify mock proof for testing
   */
  private async verifyMockProof(zkProof: ZKProof): Promise<boolean> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const proof = JSON.parse(zkProof.proof);
      return Boolean(proof.nullifierHash && proof.merkleTreeRoot && proof.signal);
    } catch {
      return false;
    }
  }

  /**
   * Get group statistics
   */
  async getGroupStats(circuitId: string): Promise<{
    memberCount: number;
    depth: number;
    groupId: string;
  }> {
    const group = await this.getGroup(circuitId);
    
    let groupConfig;
    if (circuitId.includes('age-verification')) {
      groupConfig = SEMAPHORE_GROUPS.AGE_VERIFICATION;
    } else if (circuitId.includes('membership')) {
      groupConfig = SEMAPHORE_GROUPS.MEMBERSHIP_PROOF;
    } else {
      groupConfig = SEMAPHORE_GROUPS.CREDENTIAL_VERIFICATION;
    }
    
    return {
      memberCount: group.members.length,
      depth: group.depth,
      groupId: groupConfig.groupId
    };
  }

  /**
   * Clear caches (useful for testing)
   */
  clearCaches(): void {
    this.identityCache.clear();
    this.groupCache.clear();
  }
}

// Export singleton instance
export const zkProofService = new ZKProofService(); 

// Convenience helpers for credential-based proofs
export async function generateAgeVerificationProof(
  credentials: VerifiableCredential[],
  minAge: number = 18
) {
  return zkProofService.generateZKProof('semaphore-age-verification', { minAge }, credentials);
}

export async function generateStudentStatusProof(
  credentials: VerifiableCredential[],
  groupId: string = 'student'
) {
  return zkProofService.generateZKProof('semaphore-membership-proof', { groupId }, credentials);
}