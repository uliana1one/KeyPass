import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CredentialCard } from '../CredentialCard';

describe('CredentialCard Component Tests', () => {
  let user: any;

  const mockCredential = {
    id: 'cred_1',
    type: ['VerifiableCredential', 'StudentIDCredential'],
    issuer: {
      id: 'did:example:university123',
      name: 'Example University',
      logo: 'https://example.com/logo.png'
    },
    issuanceDate: '2024-01-15T10:30:00.000Z',
    expirationDate: '2025-01-15T10:30:00.000Z',
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
      proofPurpose: 'assertionMethod',
      zkProof: undefined
    },
    status: 'VALID',
    metadata: {
      schema: 'student-id',
      privacy: 'SELECTIVE',
      revocable: true,
      transferable: false
    }
  };

  const mockZKCredential = {
    ...mockCredential,
    id: 'cred_zk_1',
    type: ['VerifiableCredential', 'AgeVerificationCredential'],
    issuer: {
      id: 'did:example:government789',
      name: 'Government Agency',
      logo: 'https://gov.com/logo.png'
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
      proofPurpose: 'assertionMethod',
      zkProof: {
        type: 'semaphore',
        proof: 'zk_proof_123',
        publicSignals: ['signal1', 'signal2'],
        verificationKey: 'verification_key_123',
        circuit: 'age-verification'
      }
    },
    metadata: {
      schema: 'age-verification',
      privacy: 'ZK_PROOF',
      revocable: true,
      transferable: false
    }
  };

  const mockProps = {
    credential: mockCredential,
    onShare: jest.fn(),
    onRevoke: jest.fn(),
    onViewDetails: jest.fn(),
    compact: false
  };

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('CredentialCard Core Functionality', () => {
    it('renders successfully with minimum props', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('Example University')).toBeInTheDocument();
    });

    it('displays credential information correctly', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('Example University')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('STU123456')).toBeInTheDocument();
    });

    it('shows credential status correctly', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('VALID')).toBeInTheDocument();
    });

    it('displays issuer logo when available', () => {
      render(<CredentialCard {...mockProps} />);
      
      const logo = screen.getByAltText('Example University');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('handles missing issuer logo gracefully', () => {
      const credentialWithoutLogo = {
        ...mockCredential,
        issuer: {
          ...mockCredential.issuer,
          logo: undefined
        }
      };
      
      render(<CredentialCard {...mockProps} credential={credentialWithoutLogo} />);
      
      expect(screen.getByText('Example University')).toBeInTheDocument();
      expect(screen.queryByAltText('Example University')).not.toBeInTheDocument();
    });
  });

  describe('Credential Actions', () => {
    it('displays action buttons when showActions is true', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Revoke')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
    });

    it('handles view details action', async () => {
      render(<CredentialCard {...mockProps} />);
      
      await user.click(screen.getByText('View'));
      
      expect(mockProps.onViewDetails).toHaveBeenCalledWith(mockCredential);
    });

    it('handles share action', async () => {
      render(<CredentialCard {...mockProps} />);
      
      await user.click(screen.getByText('Share'));
      
      expect(mockProps.onShare).toHaveBeenCalledWith(mockCredential.id);
    });

    it('handles revoke action', async () => {
      render(<CredentialCard {...mockProps} />);
      
      await user.click(screen.getByText('Revoke'));
      
      expect(mockProps.onRevoke).toHaveBeenCalledWith(mockCredential.id);
    });

    it('does not show revoke button for non-revocable credentials', () => {
      const nonRevocableCredential = {
        ...mockCredential,
        metadata: {
          ...mockCredential.metadata,
          revocable: false
        }
      };
      
      render(<CredentialCard {...mockProps} credential={nonRevocableCredential} />);
      
      expect(screen.queryByText('Revoke')).not.toBeInTheDocument();
    });

    it('handles privacy controls toggle', async () => {
      render(<CredentialCard {...mockProps} />);
      
      await user.click(screen.getByText('Privacy'));
      
      // Should show privacy controls
      expect(screen.getByText('Privacy Controls')).toBeInTheDocument();
    });
  });

  describe('Privacy Controls', () => {
    it('shows privacy controls when toggled', async () => {
      render(<CredentialCard {...mockProps} />);
      
      await user.click(screen.getByText('Privacy'));
      
      expect(screen.getByText('Privacy Controls')).toBeInTheDocument();
      expect(screen.getByText('Selective Disclosure')).toBeInTheDocument();
    });

    it('handles selective disclosure toggle', async () => {
      render(<CredentialCard {...mockProps} />);
      
      await user.click(screen.getByText('Privacy'));
      
      const selectiveDisclosureToggle = screen.getByLabelText('Enable selective disclosure');
      await user.click(selectiveDisclosureToggle);
      
      expect(selectiveDisclosureToggle).toBeChecked();
    });

    it('handles ZK-proof toggle', async () => {
      render(<CredentialCard {...mockProps} credential={mockZKCredential} />);
      
      await user.click(screen.getByText('Privacy'));
      
      const zkProofToggle = screen.getByLabelText('Use zero-knowledge proof');
      await user.click(zkProofToggle);
      
      expect(zkProofToggle).toBeChecked();
    });

    it('shows privacy level indicator', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('SELECTIVE')).toBeInTheDocument();
    });

    it('shows ZK-proof indicator for ZK credentials', () => {
      render(<CredentialCard {...mockProps} credential={mockZKCredential} />);
      
      expect(screen.getByText('ZK_PROOF')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode correctly', () => {
      render(<CredentialCard {...mockProps} compact={true} />);
      
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('Example University')).toBeInTheDocument();
      
      // Should not show action buttons in compact mode
      expect(screen.queryByText('View')).not.toBeInTheDocument();
      expect(screen.queryByText('Share')).not.toBeInTheDocument();
      expect(screen.queryByText('Revoke')).not.toBeInTheDocument();
      expect(screen.queryByText('Privacy')).not.toBeInTheDocument();
    });

    it('shows essential information in compact mode', () => {
      render(<CredentialCard {...mockProps} compact={true} />);
      
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('Example University')).toBeInTheDocument();
      expect(screen.getByText('VALID')).toBeInTheDocument();
    });
  });

  describe('ZK-Proof Credentials', () => {
    it('displays ZK-proof credentials correctly', () => {
      render(<CredentialCard {...mockProps} credential={mockZKCredential} />);
      
      expect(screen.getByText('Age Verification')).toBeInTheDocument();
      expect(screen.getByText('Government Agency')).toBeInTheDocument();
      expect(screen.getByText('ZK_PROOF')).toBeInTheDocument();
    });

    it('shows ZK-proof details when expanded', async () => {
      render(<CredentialCard {...mockProps} credential={mockZKCredential} />);
      
      await user.click(screen.getByText('Privacy'));
      
      expect(screen.getByText('ZK-Proof Details')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('semaphore')).toBeInTheDocument();
      expect(screen.getByText('Circuit:')).toBeInTheDocument();
      expect(screen.getByText('age-verification')).toBeInTheDocument();
    });

    it('displays ZK-proof public signals', async () => {
      render(<CredentialCard {...mockProps} credential={mockZKCredential} />);
      
      await user.click(screen.getByText('Privacy'));
      
      expect(screen.getByText('Public Signals:')).toBeInTheDocument();
      expect(screen.getByText('signal1')).toBeInTheDocument();
      expect(screen.getByText('signal2')).toBeInTheDocument();
    });
  });

  describe('Credential Status', () => {
    it('displays valid status correctly', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('VALID')).toBeInTheDocument();
    });

    it('displays expired status correctly', () => {
      const expiredCredential = {
        ...mockCredential,
        status: 'EXPIRED'
      };
      
      render(<CredentialCard {...mockProps} credential={expiredCredential} />);
      
      expect(screen.getByText('EXPIRED')).toBeInTheDocument();
    });

    it('displays revoked status correctly', () => {
      const revokedCredential = {
        ...mockCredential,
        status: 'REVOKED'
      };
      
      render(<CredentialCard {...mockProps} credential={revokedCredential} />);
      
      expect(screen.getByText('REVOKED')).toBeInTheDocument();
    });

    it('applies correct styling for different statuses', () => {
      const { rerender } = render(<CredentialCard {...mockProps} />);
      
      // Valid status
      expect(screen.getByText('VALID').closest('.status-indicator')).toHaveClass('status-valid');
      
      // Expired status
      const expiredCredential = { ...mockCredential, status: 'EXPIRED' };
      rerender(<CredentialCard {...mockProps} credential={expiredCredential} />);
      expect(screen.getByText('EXPIRED').closest('.status-indicator')).toHaveClass('status-expired');
      
      // Revoked status
      const revokedCredential = { ...mockCredential, status: 'REVOKED' };
      rerender(<CredentialCard {...mockProps} credential={revokedCredential} />);
      expect(screen.getByText('REVOKED').closest('.status-indicator')).toHaveClass('status-revoked');
    });
  });

  describe('Credential Metadata', () => {
    it('displays credential metadata correctly', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('Privacy:')).toBeInTheDocument();
      expect(screen.getByText('SELECTIVE')).toBeInTheDocument();
      expect(screen.getByText('Revocable:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('shows transferable status', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('Transferable:')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('displays issuance and expiration dates', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('Issued:')).toBeInTheDocument();
      expect(screen.getByText('Expires:')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    });
  });

  describe('Credential Subject Data', () => {
    it('displays credential subject fields correctly', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByText('studentId:')).toBeInTheDocument();
      expect(screen.getByText('STU123456')).toBeInTheDocument();
      expect(screen.getByText('institution:')).toBeInTheDocument();
      expect(screen.getByText('Example University')).toBeInTheDocument();
      expect(screen.getByText('program:')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
    });

    it('handles different data types correctly', () => {
      const credentialWithMixedData = {
        ...mockCredential,
        credentialSubject: {
          ...mockCredential.credentialSubject,
          isActive: true,
          gpa: 3.8,
          courses: ['CS101', 'CS102', 'CS103']
        }
      };
      
      render(<CredentialCard {...mockProps} credential={credentialWithMixedData} />);
      
      expect(screen.getByText('isActive:')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('gpa:')).toBeInTheDocument();
      expect(screen.getByText('3.8')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('expands and collapses credential details', async () => {
      render(<CredentialCard {...mockProps} />);
      
      // Initially collapsed
      expect(screen.queryByText('Credential Details')).not.toBeInTheDocument();
      
      // Expand
      await user.click(screen.getByText('Student ID'));
      
      expect(screen.getByText('Credential Details')).toBeInTheDocument();
      
      // Collapse
      await user.click(screen.getByText('Student ID'));
      
      expect(screen.queryByText('Credential Details')).not.toBeInTheDocument();
    });

    it('shows hover effects', async () => {
      render(<CredentialCard {...mockProps} />);
      
      const card = screen.getByText('Student ID').closest('.credential-card');
      
      // Simulate hover
      fireEvent.mouseEnter(card!);
      
      // Should show action buttons on hover
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('handles keyboard navigation', async () => {
      render(<CredentialCard {...mockProps} />);
      
      const card = screen.getByText('Student ID').closest('.credential-card');
      card!.focus();
      
      expect(card).toHaveFocus();
      
      // Test tab navigation
      await user.tab();
      expect(screen.getByText('View')).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('handles missing credential data gracefully', () => {
      const incompleteCredential = {
        id: 'cred_incomplete',
        type: ['VerifiableCredential'],
        issuer: { name: 'Unknown Issuer' },
        credentialSubject: { id: 'did:example:123' },
        proof: { type: 'Ed25519Signature2020' },
        status: 'VALID',
        metadata: {}
      };
      
      render(<CredentialCard {...mockProps} credential={incompleteCredential} />);
      
      expect(screen.getByText('Unknown Issuer')).toBeInTheDocument();
    });

    it('handles malformed dates gracefully', () => {
      const credentialWithInvalidDate = {
        ...mockCredential,
        issuanceDate: 'invalid-date',
        expirationDate: 'invalid-date'
      };
      
      render(<CredentialCard {...mockProps} credential={credentialWithInvalidDate} />);
      
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      // Should not crash on invalid dates
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<CredentialCard {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /view credential/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share credential/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /revoke credential/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<CredentialCard {...mockProps} />);
      
      const card = screen.getByText('Student ID').closest('.credential-card');
      card!.focus();
      
      // Test arrow key navigation
      fireEvent.keyDown(card!, { key: 'ArrowRight' });
      expect(screen.getByText('View')).toHaveFocus();
    });

    it('has proper focus management', async () => {
      render(<CredentialCard {...mockProps} />);
      
      await user.click(screen.getByText('Privacy'));
      
      // Privacy controls should be focusable
      const privacyControls = screen.getByText('Privacy Controls');
      expect(privacyControls).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large credential data', () => {
      const largeCredential = {
        ...mockCredential,
        credentialSubject: {
          ...mockCredential.credentialSubject,
          // Add many fields to test performance
          ...Array.from({ length: 50 }, (_, i) => ({ [`field${i}`]: `value${i}` })).reduce((acc, field) => ({ ...acc, ...field }), {})
        }
      };
      
      const startTime = Date.now();
      render(<CredentialCard {...mockProps} credential={largeCredential} />);
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(screen.getByText('Student ID')).toBeInTheDocument();
    });

    it('handles rapid interactions without performance issues', async () => {
      render(<CredentialCard {...mockProps} />);
      
      // Rapidly toggle privacy controls
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByText('Privacy'));
        await user.click(screen.getByText('Privacy'));
      }
      
      // Should still be responsive
      expect(screen.getByText('Student ID')).toBeInTheDocument();
    });
  });
}); 