import { 
  VerifiableCredential, 
  CredentialRequest, 
  CredentialOffer, 
  CredentialPresentation,
  ZKProof,
  ZKCircuit,
  CredentialStatus,
  RequestStatus,
  OfferStatus,
  PrivacyLevel 
} from '../types/credential';
import { zkProofService } from './zkProofService';

// Mock ZK-Proof circuits for demonstration
const MOCK_ZK_CIRCUITS: ZKCircuit[] = [
  {
    id: 'age-verification-circuit',
    name: 'Age Verification',
    description: 'Prove you are over a certain age without revealing exact age',
    type: 'age-verification',
    verificationKey: 'vk_age_123456789',
    constraints: { minAge: 18, maxAge: 150 },
    publicInputs: ['minAge', 'isValid'],
    privateInputs: ['actualAge', 'birthDate']
  },
  {
    id: 'membership-proof-circuit',
    name: 'Membership Proof',
    description: 'Prove membership in a group without revealing identity',
    type: 'membership-proof',
    verificationKey: 'vk_membership_987654321',
    constraints: { groupSize: 1000 },
    publicInputs: ['groupId', 'isMember'],
    privateInputs: ['memberId', 'membershipProof']
  }
];

// Mock credential schemas
const CREDENTIAL_SCHEMAS = {
  'student-id': {
    id: 'student-id',
    name: 'Student ID Credential',
    description: 'Academic institution student identification',
    type: 'StudentIDCredential',
    version: '1.0',
    properties: {
      studentId: { type: 'string', description: 'Student ID number', privacy: 'selective' as PrivacyLevel },
      institution: { type: 'string', description: 'Educational institution', privacy: 'public' as PrivacyLevel },
      program: { type: 'string', description: 'Study program', privacy: 'public' as PrivacyLevel },
      enrollmentDate: { type: 'date', description: 'Enrollment date', privacy: 'selective' as PrivacyLevel },
      graduationDate: { type: 'date', description: 'Expected graduation', privacy: 'selective' as PrivacyLevel },
      gpa: { type: 'number', description: 'Grade point average', privacy: 'zero-knowledge' as PrivacyLevel }
    },
    required: ['studentId', 'institution', 'program']
  },
  'age-verification': {
    id: 'age-verification',
    name: 'Age Verification Credential',
    description: 'Proof of age for age-restricted services',
    type: 'AgeVerificationCredential',
    version: '1.0',
    properties: {
      isOver18: { type: 'boolean', description: 'Is over 18 years old', privacy: 'zero-knowledge' as PrivacyLevel },
      isOver21: { type: 'boolean', description: 'Is over 21 years old', privacy: 'zero-knowledge' as PrivacyLevel },
      verificationDate: { type: 'date', description: 'Verification date', privacy: 'public' as PrivacyLevel }
    },
    required: ['isOver18', 'verificationDate']
  }
};

export interface CredentialServiceConfig {
  enableZKProofs?: boolean;
  enableMockData?: boolean;
  zkProofProvider?: 'semaphore' | 'plonk' | 'groth16';
}

export class CredentialService {
  private config: CredentialServiceConfig;
  private cache: Map<string, any> = new Map();

  constructor(config: CredentialServiceConfig = {}) {
    this.config = {
      enableZKProofs: true,
      enableMockData: false, // DISABLED - Use real data
      zkProofProvider: 'semaphore',
      ...config
    };
  }

  /**
   * Get all credentials for a DID
   */
  async getCredentials(did: string): Promise<VerifiableCredential[]> {
    if (this.config.enableMockData) {
      return this.getMockCredentials(did);
    }

    try {
      const response = await fetch(`/api/credentials/${did}`);
      const rawText = await response.text();
      console.log('[API] /api/credentials:', rawText);
      if (!response.ok) throw new Error('Failed to fetch credentials');
      try {
        const json = JSON.parse(rawText);
        console.log('[API] Parsed credentials JSON:', json);
        return json;
      } catch (parseErr) {
        console.error('[API] Error parsing credentials JSON:', parseErr);
        throw parseErr;
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return [];
    }
  }

  /**
   * Get pending credential requests
   */
  async getCredentialRequests(did: string): Promise<CredentialRequest[]> {
    if (this.config.enableMockData) {
      return this.getMockCredentialRequests(did);
    }

    try {
      const response = await fetch(`/api/credential-requests/${did}`);
      const rawText = await response.text();
      console.log('[API] /api/credential-requests:', rawText);
      if (!response.ok) throw new Error('Failed to fetch credential requests');
      try {
        const json = JSON.parse(rawText);
        console.log('[API] Parsed credential requests JSON:', json);
        return json;
      } catch (parseErr) {
        console.error('[API] Error parsing credential requests JSON:', parseErr);
        throw parseErr;
      }
    } catch (error) {
      console.error('Error fetching credential requests:', error);
      return [];
    }
  }


  /**
   * Get available credential offers
   */
  async getCredentialOffers(did: string): Promise<CredentialOffer[]> {
    if (this.config.enableMockData) {
      return this.getMockCredentialOffers(did);
    }

    try {
      const response = await fetch(`/api/credential-offers/${did}`);
      const rawText = await response.text();
      console.log('[API] /api/credential-offers:', rawText);
      if (!response.ok) throw new Error('Failed to fetch credential offers');
      try {
        const json = JSON.parse(rawText);
        console.log('[API] Parsed credential offers JSON:', json);
        return json;
      } catch (parseErr) {
        console.error('[API] Error parsing credential offers JSON:', parseErr);
        throw parseErr;
      }
    } catch (error) {
      console.error('Error fetching credential offers:', error);
      return [];
    }
  }

  /**
   * Request a new credential
   */
  async requestCredential(
    did: string, 
    credentialType: string, 
    requiredClaims: string[],
    privacyRequirements: { zkProofRequired: boolean; selectiveDisclosure: boolean }
  ): Promise<CredentialRequest> {
    const request: CredentialRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: [credentialType],
      requiredClaims,
      purpose: 'Identity verification',
      requestedBy: {
        id: did,
        name: 'User',
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: RequestStatus.PENDING,
      privacyRequirements: {
        ...privacyRequirements,
        minimumDisclosure: requiredClaims
      }
    };

    if (this.config.enableMockData) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return request;
    }

    try {
      const response = await fetch('/api/credential-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) throw new Error('Failed to create credential request');
      return await response.json();
    } catch (error) {
      console.error('Error requesting credential:', error);
      throw error;
    }
  }

  /**
   * Accept a credential offer
   */
  async acceptCredentialOffer(offerId: string, did: string): Promise<VerifiableCredential> {
    if (this.config.enableMockData) {
      // Simulate credential issuance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ['VerifiableCredential', 'StudentIDCredential'],
        issuer: {
          id: 'did:example:university123',
          name: 'Example University'
        },
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        credentialSubject: {
          id: did,
          studentId: 'STU123456',
          institution: 'Example University',
          program: 'Computer Science',
          enrollmentDate: '2023-09-01',
          graduationDate: '2027-06-01'
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          verificationMethod: 'did:example:university123#key-1',
          proofPurpose: 'assertionMethod'
        },
        status: CredentialStatus.VALID,
        metadata: {
          schema: 'student-id',
          privacy: PrivacyLevel.SELECTIVE,
          revocable: true,
          transferable: false
        }
      };
    }

    try {
      const response = await fetch(`/api/credential-offers/${offerId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did })
      });
      
      if (!response.ok) throw new Error('Failed to accept credential offer');
      return await response.json();
    } catch (error) {
      console.error('Error accepting credential offer:', error);
      throw error;
    }
  }

  /**
   * Create a verifiable presentation with ZK-proofs
   */
  async createPresentation(
    credentials: VerifiableCredential[],
    challenge: string,
    domain: string,
    selectiveDisclosure?: Record<string, string[]>,
    zkProofRequirements?: { circuit: string; publicInputs: Record<string, any> }
  ): Promise<CredentialPresentation> {
    let zkProof: ZKProof | undefined;

    if (zkProofRequirements && this.config.enableZKProofs) {
      zkProof = await this.generateZKProof(
        zkProofRequirements.circuit,
        zkProofRequirements.publicInputs,
        credentials
      );
    }

    const presentation: CredentialPresentation = {
      id: `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ['VerifiablePresentation'],
      verifiableCredential: credentials,
      proof: {
        type: zkProof ? 'ZKProof' : 'Ed25519Signature2020',
        created: new Date().toISOString(),
        challenge,
        domain,
        proofPurpose: 'authentication',
        verificationMethod: credentials[0]?.credentialSubject.id + '#key-1',
        zkProof
      },
      holder: credentials[0]?.credentialSubject.id || '',
      verifier: domain
    };

    return presentation;
  }

  /**
   * Generate ZK-proof for credential claims
   */
  async generateZKProof(
    circuitId: string,
    publicInputs: Record<string, any>,
    credentials: VerifiableCredential[]
  ): Promise<ZKProof> {
    if (this.config.enableZKProofs) {
      return await zkProofService.generateZKProof(circuitId, publicInputs, credentials);
    }

    // Fallback to mock implementation
    const circuit = MOCK_ZK_CIRCUITS.find(c => c.id === circuitId);
    if (!circuit) {
      throw new Error(`ZK circuit not found: ${circuitId}`);
    }

    // Simulate ZK-proof generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      type: this.config.zkProofProvider || 'semaphore',
      proof: `zk_proof_${Math.random().toString(36).substr(2, 20)}`,
      publicSignals: Object.values(publicInputs).map(String),
      verificationKey: circuit.verificationKey,
      circuit: circuitId
    };
  }

  /**
   * Verify a ZK-proof
   */
  async verifyZKProof(zkProof: ZKProof, expectedSignal?: string): Promise<boolean> {
    if (this.config.enableZKProofs) {
      return await zkProofService.verifyZKProof(zkProof, expectedSignal || '');
    }

    // Fallback to mock verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic validation for mock proofs
    return Boolean(zkProof.proof && zkProof.publicSignals.length > 0);
  }

  /**
   * Get available ZK circuits
   */
  getAvailableZKCircuits(): ZKCircuit[] {
    if (this.config.enableZKProofs) {
      return zkProofService.getAvailableCircuits();
    }
    return MOCK_ZK_CIRCUITS;
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialId: string, reason: string): Promise<void> {
    if (this.config.enableMockData) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    try {
      const response = await fetch(`/api/credentials/${credentialId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) throw new Error('Failed to revoke credential');
    } catch (error) {
      console.error('Error revoking credential:', error);
      throw error;
    }
  }

  // Mock data generators
  private getMockCredentials(did: string): VerifiableCredential[] {
    return [
      {
        id: 'cred_student_123',
        type: ['VerifiableCredential', 'StudentIDCredential'],
        issuer: {
          id: 'did:example:university123',
          name: 'Example University',
          logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop'
        },
        issuanceDate: '2023-09-01T00:00:00Z',
        expirationDate: '2027-06-01T00:00:00Z',
        credentialSubject: {
          id: did,
          studentId: 'STU123456',
          institution: 'Example University',
          program: 'Computer Science',
          enrollmentDate: '2023-09-01',
          graduationDate: '2027-06-01',
          gpa: 3.8
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: '2023-09-01T00:00:00Z',
          verificationMethod: 'did:example:university123#key-1',
          proofPurpose: 'assertionMethod',
          jws: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSJ9...'
        },
        status: CredentialStatus.VALID,
        metadata: {
          schema: 'student-id',
          privacy: PrivacyLevel.SELECTIVE,
          revocable: true,
          transferable: false
        }
      },
      {
        id: 'cred_age_456',
        type: ['VerifiableCredential', 'AgeVerificationCredential'],
        issuer: {
          id: 'did:example:government789',
          name: 'Digital Identity Authority',
          logo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop'
        },
        issuanceDate: '2024-01-15T00:00:00Z',
        expirationDate: '2029-01-15T00:00:00Z',
        credentialSubject: {
          id: did,
          isOver18: true,
          isOver21: true,
          verificationDate: '2024-01-15'
        },
        proof: {
          type: 'ZKProof',
          created: '2024-01-15T00:00:00Z',
          verificationMethod: 'did:example:government789#key-1',
          proofPurpose: 'assertionMethod',
          zkProof: {
            type: 'semaphore',
            proof: 'zk_proof_age_verification_123',
            publicSignals: ['1', '1'], // isOver18, isOver21
            verificationKey: 'vk_age_123456789',
            circuit: 'age-verification-circuit'
          }
        },
        status: CredentialStatus.VALID,
        metadata: {
          schema: 'age-verification',
          privacy: PrivacyLevel.ZERO_KNOWLEDGE,
          revocable: false,
          transferable: false
        }
      }
    ];
  }

  private getMockCredentialRequests(did: string): CredentialRequest[] {
    return [
      {
        id: 'req_employment_789',
        type: ['EmploymentCredential'],
        requiredClaims: ['employer', 'position', 'startDate', 'salary'],
        purpose: 'Loan application verification',
        requestedBy: {
          id: 'did:example:bank456',
          name: 'Example Bank',
          logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop'
        },
        createdAt: '2024-01-20T10:00:00Z',
        expiresAt: '2024-01-27T10:00:00Z',
        status: RequestStatus.PENDING,
        privacyRequirements: {
          zkProofRequired: true,
          selectiveDisclosure: true,
          minimumDisclosure: ['employer', 'position']
        }
      }
    ];
  }

  private getMockCredentialOffers(did: string): CredentialOffer[] {
    return [
      {
        id: 'offer_certification_101',
        type: ['CertificationCredential'],
        issuer: {
          id: 'did:example:certorg123',
          name: 'Blockchain Certification Authority',
          logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&h=100&fit=crop',
          trustScore: 95
        },
        credentialSubject: {
          certification: 'Certified Blockchain Developer',
          level: 'Advanced',
          skills: ['Solidity', 'Smart Contracts', 'DeFi'],
          examScore: 92
        },
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: {
          verificationMethod: 'exam-completion',
          proofOfControl: true,
          additionalVerification: ['identity-check']
        },
        status: OfferStatus.PENDING
      }
    ];
  }
}

export const credentialService = new CredentialService(); 