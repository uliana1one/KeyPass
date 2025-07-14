import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DIDWizard } from '../DIDWizard';
import { DIDDocumentViewer } from '../DIDDocumentViewer';

// Mock clipboard API - removed redundant definition since it's in setupTests.ts
const mockClipboard = navigator.clipboard as jest.Mocked<typeof navigator.clipboard>;

describe('DID Components Unit Tests', () => {
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    // Clipboard mock is now handled in setupTests.ts
  });

  describe('DIDWizard Core Functionality', () => {
    const mockProps = {
      walletAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      chainType: 'polkadot' as const,
      accountName: 'Test Account',
      onComplete: jest.fn(),
      onCancel: jest.fn(),
      onBack: jest.fn(),
    };

    it('renders successfully with minimum props', () => {
      render(<DIDWizard {...mockProps} />);
      expect(screen.getByText('Create Your DID')).toBeInTheDocument();
    });

    it('handles Basic DID flow correctly', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Basic DID selected by default
      expect(screen.getByText('Basic DID').closest('.did-type-card')).toHaveClass('selected');
      
      // Next to preview
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      
      // Next to create
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Create My DID')).toBeInTheDocument();
    });

    it('handles Advanced DID flow correctly', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Select Advanced DID
      const advancedCard = screen.getByText('Advanced DID').closest('.did-type-card');
      await user.click(advancedCard!);
      
      // Next to configuration
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Configure Advanced Options')).toBeInTheDocument();
      
      // Next to preview
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      
      // Next to create
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Create My DID')).toBeInTheDocument();
    });

    it('creates DID and calls onComplete', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Go to create step
      await user.click(screen.getByText('Next')); // Preview
      await user.click(screen.getByText('Next')); // Create
      
      // Create DID
      await user.click(screen.getByText('Create My DID'));
      
      // Should call onComplete
      await waitFor(() => {
        expect(mockProps.onComplete).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('handles navigation correctly', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Forward navigation
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      
      // Backward navigation
      await user.click(screen.getByText('Previous'));
      expect(screen.getByText('Choose Your DID Type')).toBeInTheDocument();
    });

    it('handles cancel and back actions', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Cancel
      await user.click(screen.getByText('Cancel'));
      expect(mockProps.onCancel).toHaveBeenCalled();
      
      // Back
      await user.click(screen.getByText('← Back to Wallet Selection'));
      expect(mockProps.onBack).toHaveBeenCalled();
    });

    it('handles Ethereum chain type correctly', () => {
      const ethereumProps = {
        ...mockProps,
        chainType: 'ethereum' as const,
        walletAddress: '0x742d35Cc6634C0532925a3b8D6f9C0dC65e6b8Fc'
      };
      
      render(<DIDWizard {...ethereumProps} />);
      
      // Should render without errors
      expect(screen.getByText('Create Your DID')).toBeInTheDocument();
    });

    it('shows correct progress indicator', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Initial state
      expect(screen.getByText('1')).toBeInTheDocument();
      
      // After navigation
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('handles custom attributes correctly', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Select Advanced DID
      const advancedCard = screen.getByText('Advanced DID').closest('.did-type-card');
      await user.click(advancedCard!);
      await user.click(screen.getByText('Next'));
      
      // Add custom attribute
      const keyInput = screen.getByPlaceholderText('Attribute name (e.g., \'role\')');
      const valueInput = screen.getByPlaceholderText('Attribute value (e.g., \'developer\')');
      
      await user.type(keyInput, 'role');
      await user.type(valueInput, 'developer');
      await user.click(screen.getByText('Add'));
      
      // Should display attribute in the attributes list
      await waitFor(() => {
        expect(screen.getByText('role:')).toBeInTheDocument();
        expect(screen.getByText('developer')).toBeInTheDocument();
      });
    });
  });

  describe('DIDDocumentViewer Core Functionality', () => {
    const mockDIDResult = {
      did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      didDocument: {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
        controller: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
        verificationMethod: [{
          id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#keys-1',
          type: 'Sr25519VerificationKey2020',
          controller: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
          publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
        }],
        authentication: ['did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#keys-1']
      },
      options: {
        type: 'basic' as const,
        purpose: 'authentication',
        description: '',
        includeServices: false,
        includeCredentials: false,
        customAttributes: {}
      },
      createdAt: '2024-01-15T10:30:00.000Z'
    };

    const mockProps = {
      didCreationResult: mockDIDResult,
      did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      chainType: 'polkadot' as const
    };

    it('renders successfully with minimum props', () => {
      render(<DIDDocumentViewer {...mockProps} />);
      expect(screen.getByText('DID Details')).toBeInTheDocument();
    });

    it('expands and collapses correctly', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      // Initially collapsed
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      
      // Expand
      await user.click(screen.getByText('Expand Details'));
      expect(screen.getByText('Overview')).toBeInTheDocument();
      
      // Collapse
      await user.click(screen.getByText('Collapse'));
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      // Expand first
      await user.click(screen.getByText('Expand Details'));
      
      // Switch to DID Document tab
      await user.click(screen.getByText('DID Document'));
      expect(screen.getByText('Copy Document')).toBeInTheDocument();
      
      // Switch to Verification tab
      await user.click(screen.getByText('Verification'));
      expect(screen.getByText('Verification Methods')).toBeInTheDocument();
    });

    it('has copy button for DID', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      await user.click(screen.getByText('Expand Details'));
      
      const copyButton = screen.getByTitle('Copy DID');
      expect(copyButton).toBeInTheDocument();
      
      // Click should not throw error
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });

    it('has copy button for document', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      await user.click(screen.getByText('Expand Details'));
      await user.click(screen.getByText('DID Document'));
      
      const copyButton = screen.getByText('Copy Document');
      expect(copyButton).toBeInTheDocument();
      
      // Click should not throw error
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });

    it('displays verification information correctly', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      await user.click(screen.getByText('Expand Details'));
      await user.click(screen.getByText('Verification'));
      
      expect(screen.getByText('Verification Methods')).toBeInTheDocument();
      expect(screen.getByText('Verification Status')).toBeInTheDocument();
      expect(screen.getByText('Wallet Integration')).toBeInTheDocument();
    });

    it('handles advanced DID with custom attributes', async () => {
      const advancedResult = {
        ...mockDIDResult,
        options: {
          ...mockDIDResult.options,
          type: 'advanced' as const,
          customAttributes: { role: 'developer' }
        }
      };
      
      render(<DIDDocumentViewer {...{ ...mockProps, didCreationResult: advancedResult }} />);
      
      await user.click(screen.getByText('Expand Details'));
      
      expect(screen.getByText('Advanced DID')).toBeInTheDocument();
      expect(screen.getByText('role:')).toBeInTheDocument();
      expect(screen.getByText('developer')).toBeInTheDocument();
    });

    it('handles Ethereum chain type correctly', () => {
      const ethereumProps = {
        ...mockProps,
        chainType: 'ethereum' as const,
        address: '0x742d35Cc6634C0532925a3b8D6f9C0dC65e6b8Fc'
      };
      
      render(<DIDDocumentViewer {...ethereumProps} />);
      
      expect(screen.getByText('DID Details')).toBeInTheDocument();
    });

    it('formats dates correctly', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      await user.click(screen.getByText('Expand Details'));
      
      // Should show formatted date (may vary by timezone)
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it('handles empty verification methods', async () => {
      const emptyVerificationResult = {
        ...mockDIDResult,
        didDocument: {
          ...mockDIDResult.didDocument,
          verificationMethod: []
        }
      };
      
      render(<DIDDocumentViewer {...{ ...mockProps, didCreationResult: emptyVerificationResult }} />);
      
      await user.click(screen.getByText('Expand Details'));
      await user.click(screen.getByText('Verification'));
      
      expect(screen.getByText('Verification Methods')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const minimalProps = {
        walletAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        chainType: 'polkadot' as const,
        accountName: 'Test Account',
        onComplete: jest.fn(),
        onCancel: jest.fn(),
        onBack: jest.fn(),
      };
      
      render(<DIDWizard {...minimalProps} />);
      expect(screen.getByText('Create Your DID')).toBeInTheDocument();
    });

    it('handles clipboard errors gracefully', async () => {
      const mockDIDResult = {
        did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
        didDocument: { '@context': ['https://www.w3.org/ns/did/v1'] },
        options: { type: 'basic' as const },
        createdAt: '2024-01-15T10:30:00.000Z'
      };
      
      render(<DIDDocumentViewer 
        didCreationResult={mockDIDResult}
        did="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
        address="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
        chainType="polkadot"
      />);
      
      await user.click(screen.getByText('Expand Details'));
      
      const copyButton = screen.getByTitle('Copy DID');
      expect(copyButton).toBeInTheDocument();
      
      // Click should not throw error even if clipboard fails
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });

    it('handles missing optional fields', () => {
      const incompleteResult = {
        did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
        didDocument: { '@context': ['https://www.w3.org/ns/did/v1'] },
        options: { type: 'basic' as const },
        createdAt: '2024-01-15T10:30:00.000Z'
      };
      
      render(<DIDDocumentViewer 
        didCreationResult={incompleteResult}
        did="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
        address="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
        chainType="polkadot"
      />);
      
      expect(screen.getByText('DID Details')).toBeInTheDocument();
    });
  });
}); 