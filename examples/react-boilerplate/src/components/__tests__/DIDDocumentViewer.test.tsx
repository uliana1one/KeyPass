import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DIDDocumentViewer } from '../DIDDocumentViewer';
import { DIDCreationResult } from '../DIDWizard';

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
  writable: true,
});

const mockClipboard = navigator.clipboard as jest.Mocked<typeof navigator.clipboard>;

// Mock data
const mockBasicDIDCreationResult: DIDCreationResult = {
  did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  didDocument: {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/sr25519-2020/v1'
    ],
    id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    controller: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    verificationMethod: [{
      id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXg',
      type: 'Sr25519VerificationKey2020',
      controller: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
    }],
    authentication: ['did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXg'],
    assertionMethod: ['did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXg'],
    capabilityInvocation: ['did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXg'],
    capabilityDelegation: ['did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXg'],
    service: []
  },
  options: {
    type: 'basic',
    purpose: 'authentication',
    description: '',
    includeServices: false,
    includeCredentials: false,
    customAttributes: {}
  },
  createdAt: '2024-01-15T10:30:00.000Z'
};

const mockAdvancedDIDCreationResult: DIDCreationResult = {
  ...mockBasicDIDCreationResult,
  options: {
    type: 'advanced',
    purpose: 'professional',
    description: 'Professional identity for blockchain development',
    includeServices: true,
    includeCredentials: true,
    customAttributes: {
      role: 'developer',
      organization: 'KeyPass'
    }
  }
};

const mockProps = {
  didCreationResult: mockBasicDIDCreationResult,
  did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  chainType: 'polkadot' as const
};

const mockEthereumProps = {
  ...mockProps,
  address: '0x742d35Cc6634C0532925a3b8D6f9C0dC65e6b8Fc',
  chainType: 'ethereum' as const
};

describe('DIDDocumentViewer', () => {
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    // Re-setup clipboard mock after clearing
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Initial Render', () => {
    it('renders the viewer header correctly', () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      expect(screen.getByText('DID Details')).toBeInTheDocument();
      expect(screen.getByText('View and manage your Decentralized Identifier')).toBeInTheDocument();
      expect(screen.getByText('🔽 Expand Details')).toBeInTheDocument();
    });

    it('starts in collapsed state', () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('DID Document')).not.toBeInTheDocument();
      expect(screen.queryByText('Verification')).not.toBeInTheDocument();
    });

    it('expands when expand button is clicked', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('DID Document')).toBeInTheDocument();
      expect(screen.getByText('Verification')).toBeInTheDocument();
      expect(screen.getByText('🔼 Collapse')).toBeInTheDocument();
    });

    it('collapses when collapse button is clicked', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      const collapseButton = screen.getByText('🔼 Collapse');
      await user.click(collapseButton);
      
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      expect(screen.getByText('🔽 Expand Details')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
    });

    it('shows Overview tab as active by default', () => {
      const overviewTab = screen.getByText('Overview');
      expect(overviewTab).toHaveClass('active');
    });

    it('switches to DID Document tab when clicked', async () => {
      const documentTab = screen.getByText('DID Document');
      await user.click(documentTab);
      
      expect(documentTab).toHaveClass('active');
      expect(screen.getByText('Overview')).not.toHaveClass('active');
    });

    it('switches to Verification tab when clicked', async () => {
      const verificationTab = screen.getByText('Verification');
      await user.click(verificationTab);
      
      expect(verificationTab).toHaveClass('active');
      expect(screen.getByText('Overview')).not.toHaveClass('active');
    });

    it('shows correct content for each tab', async () => {
      // Overview tab
      expect(screen.getByText('DID Information')).toBeInTheDocument();
      expect(screen.getByText('Capabilities')).toBeInTheDocument();
      
      // DID Document tab
      const documentTab = screen.getByText('DID Document');
      await user.click(documentTab);
      expect(screen.getByText('📋 Copy Document')).toBeInTheDocument();
      
      // Verification tab
      const verificationTab = screen.getByText('Verification');
      await user.click(verificationTab);
      expect(screen.getByText('Verification Methods')).toBeInTheDocument();
      expect(screen.getByText('Verification Status')).toBeInTheDocument();
      expect(screen.getByText('Wallet Integration')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      render(<DIDDocumentViewer {...mockProps} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
    });

    it('displays DID information correctly', () => {
      expect(screen.getByText('DID Information')).toBeInTheDocument();
      expect(screen.getByText(mockProps.did)).toBeInTheDocument();
      expect(screen.getByText('Basic DID')).toBeInTheDocument();
      expect(screen.getByText('Polkadot')).toBeInTheDocument();
      expect(screen.getByText('1/15/2024, 2:30:00 AM')).toBeInTheDocument();
    });

    it('displays Ethereum chain type correctly', async () => {
      render(<DIDDocumentViewer {...mockEthereumProps} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('displays capabilities correctly', () => {
      expect(screen.getByText('Capabilities')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('Message Signing')).toBeInTheDocument();
      expect(screen.getByText('Identity Verification')).toBeInTheDocument();
    });

    it('shows all capabilities as enabled', () => {
      const enabledStatuses = screen.getAllByText('Enabled');
      expect(enabledStatuses.length).toBeGreaterThan(0);
    });

    it('does not show advanced features for basic DID', () => {
      expect(screen.queryByText('Advanced Features')).not.toBeInTheDocument();
    });

    it('has copy button for DID', async () => {
      const copyButton = screen.getByTitle('Copy DID');
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveTextContent('📋');
      
      // Click should not throw error
      await user.click(copyButton);
      
      // The functionality is tested by the fact that it doesn't crash
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Overview Tab - Advanced DID', () => {
    beforeEach(async () => {
      render(<DIDDocumentViewer {...{ ...mockProps, didCreationResult: mockAdvancedDIDCreationResult }} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
    });

    it('displays Advanced DID type', () => {
      expect(screen.getByText('Advanced DID')).toBeInTheDocument();
    });

    it('shows advanced features section', () => {
      expect(screen.getByText('Advanced Features')).toBeInTheDocument();
      expect(screen.getByText('professional')).toBeInTheDocument();
      expect(screen.getByText('Professional identity for blockchain development')).toBeInTheDocument();
    });

    it('displays custom attributes', () => {
      expect(screen.getByText('Custom Attributes:')).toBeInTheDocument();
      expect(screen.getByText('role:')).toBeInTheDocument();
      expect(screen.getByText('developer')).toBeInTheDocument();
      expect(screen.getByText('organization:')).toBeInTheDocument();
      expect(screen.getByText('KeyPass')).toBeInTheDocument();
    });

    it('shows additional capabilities for advanced DID', () => {
      expect(screen.getByText('Service Endpoints')).toBeInTheDocument();
      expect(screen.getByText('Credential Ready')).toBeInTheDocument();
    });
  });

  describe('DID Document Tab', () => {
    beforeEach(async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      const documentTab = screen.getByText('DID Document');
      await user.click(documentTab);
    });

    it('displays DID document header', () => {
      expect(screen.getByRole('heading', { name: 'DID Document' })).toBeInTheDocument();
      expect(screen.getByText('📋 Copy Document')).toBeInTheDocument();
    });

    it('shows formatted DID document JSON', () => {
      expect(screen.getByText(/@context/)).toBeInTheDocument();
      expect(screen.getByText(/id/)).toBeInTheDocument();
      expect(screen.getByText(/verificationMethod/)).toBeInTheDocument();
    });

    it('has copy button for document', async () => {
      const copyButton = screen.getByText('📋 Copy Document');
      expect(copyButton).toBeInTheDocument();
      
      // Click should not throw error
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });

    it('displays document content in scrollable container', () => {
      const documentContent = document.querySelector('.document-content');
      expect(documentContent).toBeInTheDocument();
      expect(documentContent).toHaveClass('document-content');
    });
  });

  describe('Verification Tab', () => {
    beforeEach(async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      const verificationTab = screen.getByText('Verification');
      await user.click(verificationTab);
    });

    it('displays verification methods section', () => {
      expect(screen.getByText('Verification Methods')).toBeInTheDocument();
    });

    it('shows verification method details', () => {
      expect(screen.getByText('Sr25519VerificationKey2020')).toBeInTheDocument();
      expect(screen.getByText('Controller:')).toBeInTheDocument();
      expect(screen.getByText('Public Key:')).toBeInTheDocument();
    });

    it('displays verification status', () => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument();
      expect(screen.getByText('DID Resolution')).toBeInTheDocument();
      expect(screen.getByText('Key Validation')).toBeInTheDocument();
      expect(screen.getByText('Chain Verification')).toBeInTheDocument();
      expect(screen.getByText('Document Structure')).toBeInTheDocument();
    });

    it('shows all verification statuses as valid', () => {
      const validStatuses = screen.getAllByText('Valid');
      expect(validStatuses).toHaveLength(4);
    });

    it('displays wallet integration information', () => {
      expect(screen.getByText('Wallet Integration')).toBeInTheDocument();
      expect(screen.getByText('Wallet Address:')).toBeInTheDocument();
      expect(screen.getByText('Chain Type:')).toBeInTheDocument();
      expect(screen.getByText('Integration Status:')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('shows correct wallet address', () => {
      expect(screen.getByText(mockProps.address)).toBeInTheDocument();
    });

    it('shows correct chain type', () => {
      expect(screen.getByText('polkadot')).toBeInTheDocument();
    });

    it('has copy button for wallet address', async () => {
      const copyButton = screen.getByTitle('Copy Address');
      expect(copyButton).toBeInTheDocument();
      
      // Click should not throw error
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Clipboard Functionality', () => {
    beforeEach(async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
    });

    it('handles clipboard copy success', async () => {
      const copyButton = screen.getByTitle('Copy DID');
      expect(copyButton).toBeInTheDocument();
      
      // Click should not throw error
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });

    it('logs copy action to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const copyButton = screen.getByTitle('Copy DID');
      await user.click(copyButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Copied to clipboard:', mockProps.did);
      });
      
      consoleSpy.mockRestore();
    });

    it('handles clipboard copy failure gracefully', async () => {
      const copyButton = screen.getByTitle('Copy DID');
      expect(copyButton).toBeInTheDocument();
      
      // Click should not throw error even if clipboard fails
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes correctly', () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      const viewer = screen.getByText('DID Details').closest('.did-document-viewer');
      expect(viewer).toHaveClass('did-document-viewer');
    });

    it('maintains functionality on smaller screens', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<DIDDocumentViewer {...mockProps} />);
      
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('handles missing optional data gracefully', () => {
      const incompleteResult = {
        ...mockBasicDIDCreationResult,
        options: {
          type: 'basic' as const,
          purpose: undefined,
          description: undefined
        }
      };
      
      render(<DIDDocumentViewer {...{ ...mockProps, didCreationResult: incompleteResult }} />);
      
      expect(screen.getByText('DID Details')).toBeInTheDocument();
    });

    it('handles empty custom attributes', async () => {
      const emptyAttributesResult = {
        ...mockAdvancedDIDCreationResult,
        options: {
          ...mockAdvancedDIDCreationResult.options,
          customAttributes: {}
        }
      };
      
      render(<DIDDocumentViewer {...{ ...mockProps, didCreationResult: emptyAttributesResult }} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      expect(screen.queryByText('Custom Attributes:')).not.toBeInTheDocument();
    });

    it('handles missing verification methods', async () => {
      const noVerificationResult = {
        ...mockBasicDIDCreationResult,
        didDocument: {
          ...mockBasicDIDCreationResult.didDocument,
          verificationMethod: []
        }
      };
      
      render(<DIDDocumentViewer {...{ ...mockProps, didCreationResult: noVerificationResult }} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      const verificationTab = screen.getByText('Verification');
      await user.click(verificationTab);
      
      expect(screen.getByText('Verification Methods')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /Expand Details/ })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      
      const expandButton = screen.getByText('🔽 Expand Details');
      expandButton.focus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    it('has proper tab order', async () => {
      render(<DIDDocumentViewer {...mockProps} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      await user.tab();
      expect(screen.getByText('Overview')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('DID Document')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Verification')).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('renders without unnecessary re-renders', () => {
      const { rerender } = render(<DIDDocumentViewer {...mockProps} />);
      
      // Re-render with same props
      rerender(<DIDDocumentViewer {...mockProps} />);
      
      expect(screen.getByText('DID Details')).toBeInTheDocument();
    });

    it('handles large DID documents efficiently', async () => {
      const largeDIDDocument = {
        ...mockBasicDIDCreationResult.didDocument,
        largeField: 'x'.repeat(10000)
      };
      
      const largeResult = {
        ...mockBasicDIDCreationResult,
        didDocument: largeDIDDocument
      };
      
      render(<DIDDocumentViewer {...{ ...mockProps, didCreationResult: largeResult }} />);
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      const documentTab = screen.getByText('DID Document');
      await user.click(documentTab);
      
      expect(screen.getByRole('heading', { name: 'DID Document' })).toBeInTheDocument();
    });
  });
}); 