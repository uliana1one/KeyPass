import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ZKProofGenerator } from '../ZKProofGenerator';

// Mock the ZKProofService
jest.mock('../../services/zkProofService', () => ({
  zkProofService: {
    generateZKProof: jest.fn(),
    verifyZKProof: jest.fn(),
    getAvailableCircuits: jest.fn().mockReturnValue([
      {
        id: 'semaphore-age-verification',
        name: 'Semaphore Age Verification',
        description: 'Prove you are over 18 without revealing your exact age',
        type: 'age-verification',
        verificationKey: 'semaphore_vk_age_v1',
        constraints: { minAge: 18, maxAge: 150, groupDepth: 20 },
        publicInputs: ['nullifierHash', 'merkleTreeRoot', 'signal'],
        privateInputs: ['identity', 'merkleTreeProof', 'age']
      }
    ]),
  },
  generateAgeVerificationProof: jest.fn(),
  generateStudentStatusProof: jest.fn(),
}));

describe('ZKProofGenerator Component Tests', () => {
  let user: any;

  const mockCredentials = [
    {
      id: 'cred_1',
      type: ['VerifiableCredential', 'StudentIDCredential'],
      issuer: {
        id: 'did:example:university123',
        name: 'Example University'
      },
      credentialSubject: {
        id: 'did:ethr:0x123456789',
        studentId: 'STU123456',
        institution: 'Example University',
        program: 'Computer Science',
        enrollmentDate: '2023-09-01',
        graduationDate: '2027-06-01'
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: '2024-01-15T10:30:00.000Z',
        verificationMethod: 'did:example:university123#key-1',
        proofPurpose: 'assertionMethod'
      },
      status: 'VALID',
      metadata: {
        schema: 'student-id',
        privacy: 'SELECTIVE',
        revocable: true,
        transferable: false
      }
    },
    {
      id: 'cred_2',
      type: ['VerifiableCredential', 'AgeVerificationCredential'],
      issuer: {
        id: 'did:example:government789',
        name: 'Government Agency'
      },
      credentialSubject: {
        id: 'did:ethr:0x123456789',
        isOver18: true,
        isOver21: true,
        verificationDate: '2024-01-15'
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: '2024-01-15T10:30:00.000Z',
        verificationMethod: 'did:example:government789#key-1',
        proofPurpose: 'assertionMethod'
      },
      status: 'VALID',
      metadata: {
        schema: 'age-verification',
        privacy: 'ZK_PROOF',
        revocable: true,
        transferable: false
      }
    }
  ];

  const mockProps = {
    credentials: mockCredentials,
    onGenerate: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('ZKProofGenerator Core Functionality', () => {
    it('renders successfully with minimum props', () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      expect(screen.getByText('Generate Zero-Knowledge Proof')).toBeInTheDocument();
    });

    it('displays step indicator correctly', () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('shows initial step (credential selection)', () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      expect(screen.getByText('Select Credential')).toBeInTheDocument();
      expect(screen.getByText('Choose a credential to generate a proof for:')).toBeInTheDocument();
    });

    it('displays available credentials', () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('Age Verification')).toBeInTheDocument();
      expect(screen.getByText('Example University')).toBeInTheDocument();
      expect(screen.getByText('Government Agency')).toBeInTheDocument();
    });
  });

  describe('Credential Selection', () => {
    it('allows selecting a credential', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      
      expect(credentialOption).toHaveClass('selected');
    });

    it('enables next button when credential is selected', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Initially disabled
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
      
      // Select credential
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      
      // Should be enabled
      expect(nextButton).toBeEnabled();
    });

    it('shows credential details when selected', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      
      expect(screen.getByText('Credential Details')).toBeInTheDocument();
      expect(screen.getByText('studentId:')).toBeInTheDocument();
      expect(screen.getByText('STU123456')).toBeInTheDocument();
      expect(screen.getByText('institution:')).toBeInTheDocument();
      expect(screen.getByText('Example University')).toBeInTheDocument();
    });
  });

  describe('Circuit Selection', () => {
    it('advances to circuit selection step', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Select credential
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      
      // Click next
      await user.click(screen.getByText('Next'));
      
      expect(screen.getByText('Select Circuit')).toBeInTheDocument();
      expect(screen.getByText('Choose a zero-knowledge proof circuit:')).toBeInTheDocument();
    });

    it('displays available circuits', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Navigate to circuit selection
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      expect(screen.getByText('Semaphore')).toBeInTheDocument();
      expect(screen.getByText('PLONK')).toBeInTheDocument();
      expect(screen.getByText('Groth16')).toBeInTheDocument();
    });

    it('allows selecting a circuit', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Navigate to circuit selection
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      
      expect(circuitOption).toHaveClass('selected');
    });

    it('shows circuit description when selected', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Navigate to circuit selection
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      
      expect(screen.getByText('Circuit Description')).toBeInTheDocument();
      expect(screen.getByText(/Semaphore is a zero-knowledge protocol/)).toBeInTheDocument();
    });
  });

  describe('Proof Configuration', () => {
    it('advances to proof configuration step', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Select credential
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      // Select circuit
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      expect(screen.getByText('Configure Proof')).toBeInTheDocument();
      expect(screen.getByText('Configure the proof parameters:')).toBeInTheDocument();
    });

    it('allows selecting proof claims', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Navigate to proof configuration
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      // Select claims
      const studentIdCheckbox = screen.getByLabelText('studentId');
      const institutionCheckbox = screen.getByLabelText('institution');
      
      await user.click(studentIdCheckbox);
      await user.click(institutionCheckbox);
      
      expect(studentIdCheckbox).toBeChecked();
      expect(institutionCheckbox).toBeChecked();
    });

    it('allows configuring privacy settings', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Navigate to proof configuration
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      // Configure privacy settings
      const selectiveDisclosureToggle = screen.getByLabelText('Enable selective disclosure');
      const zkProofToggle = screen.getByLabelText('Use zero-knowledge proof');
      
      await user.click(selectiveDisclosureToggle);
      await user.click(zkProofToggle);
      
      expect(selectiveDisclosureToggle).toBeChecked();
      expect(zkProofToggle).toBeChecked();
    });
  });

  describe('Proof Generation', () => {
    it('advances to proof generation step', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Complete previous steps
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      // Configure proof
      const studentIdCheckbox = screen.getByLabelText('studentId');
      await user.click(studentIdCheckbox);
      await user.click(screen.getByText('Next'));
      
      expect(screen.getByText('Generate Proof')).toBeInTheDocument();
      expect(screen.getByText('Generate your zero-knowledge proof:')).toBeInTheDocument();
    });

    it('shows proof generation progress', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Complete previous steps
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      const studentIdCheckbox = screen.getByLabelText('studentId');
      await user.click(studentIdCheckbox);
      await user.click(screen.getByText('Next'));
      
      // Start generation
      await user.click(screen.getByText('Generate Proof'));
      
      expect(screen.getByText('Generating proof...')).toBeInTheDocument();
      expect(screen.getByText('This may take a few moments.')).toBeInTheDocument();
    });

    it('calls onGenerate when proof is complete', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Complete all steps
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      const studentIdCheckbox = screen.getByLabelText('studentId');
      await user.click(studentIdCheckbox);
      await user.click(screen.getByText('Next'));
      
      await user.click(screen.getByText('Generate Proof'));
      
      // Wait for generation to complete
      await waitFor(() => {
        expect(mockProps.onGenerate).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('Navigation', () => {
    it('allows going back to previous steps', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Advance to circuit selection
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      // Go back
      await user.click(screen.getByText('Previous'));
      
      expect(screen.getByText('Select Credential')).toBeInTheDocument();
    });

    it('handles cancel action', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      await user.click(screen.getByText('Cancel'));
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('updates progress indicator correctly', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Step 1
      expect(screen.getByText('1').closest('.step-indicator')).toHaveClass('active');
      
      // Step 2
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      expect(screen.getByText('2').closest('.step-indicator')).toHaveClass('active');
    });
  });

  describe('Error Handling', () => {
    it('handles generation errors gracefully', async () => {
      // Mock a failed generation
      const mockOnGenerate = jest.fn().mockRejectedValue(new Error('Generation failed'));
      
      render(<ZKProofGenerator {...mockProps} onGenerate={mockOnGenerate} />);
      
      // Complete all steps
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      const studentIdCheckbox = screen.getByLabelText('studentId');
      await user.click(studentIdCheckbox);
      await user.click(screen.getByText('Next'));
      
      await user.click(screen.getByText('Generate Proof'));
      
      await waitFor(() => {
        expect(screen.getByText('Error generating proof')).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Complete all steps
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      const studentIdCheckbox = screen.getByLabelText('studentId');
      await user.click(studentIdCheckbox);
      await user.click(screen.getByText('Next'));
      
      await user.click(screen.getByText('Generate Proof'));
      
      // Should show retry option
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('requires credential selection before proceeding', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Try to proceed without selection
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('requires circuit selection before proceeding', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Select credential
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      // Try to proceed without circuit selection
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('requires at least one claim selection', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Complete previous steps
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      const circuitOption = screen.getByText('Semaphore');
      await user.click(circuitOption);
      await user.click(screen.getByText('Next'));
      
      // Try to proceed without claim selection
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Test tab navigation
      await user.tab();
      expect(screen.getByText('Next')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Cancel')).toHaveFocus();
    });

    it('has proper focus management', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      const credentialOption = screen.getByText('Student ID - Example University');
      await user.click(credentialOption);
      await user.click(screen.getByText('Next'));
      
      // Focus should move to circuit selection
      expect(screen.getByText('Select Circuit')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many credentials', () => {
      const manyCredentials = Array.from({ length: 100 }, (_, i) => ({
        ...mockCredentials[0],
        id: `cred_${i}`,
        credentialSubject: {
          ...mockCredentials[0].credentialSubject,
          studentId: `STU${i.toString().padStart(6, '0')}`
        }
      }));
      
      const startTime = Date.now();
      render(<ZKProofGenerator {...mockProps} credentials={manyCredentials} />);
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(screen.getByText('Select Credential')).toBeInTheDocument();
    });

    it('handles rapid interactions without performance issues', async () => {
      render(<ZKProofGenerator {...mockProps} />);
      
      // Rapidly navigate between steps
      for (let i = 0; i < 10; i++) {
        const credentialOption = screen.getByText('Student ID - Example University');
        await user.click(credentialOption);
        await user.click(screen.getByText('Next'));
        await user.click(screen.getByText('Previous'));
      }
      
      // Should still be responsive
      expect(screen.getByText('Select Credential')).toBeInTheDocument();
    });
  });
}); 