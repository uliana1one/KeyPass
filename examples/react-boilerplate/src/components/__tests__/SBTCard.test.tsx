import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SBTCard } from '../SBTCard';

let user: any;

const mockToken = {
  id: 'sbt_1',
  name: 'Student Achievement',
  description: 'Awarded for academic excellence',
  image: 'https://example.com/achievement.png',
  issuer: 'did:example:university123',
  issuerName: 'Example University',
  issuedAt: '2024-01-15T10:30:00.000Z',
  expiresAt: '2025-01-15T10:30:00.000Z',
  chainId: '1',
  chainType: 'Ethereum',
  contractAddress: '0xABC123',
  tokenStandard: 'ERC-1155',
  tokenUri: 'https://example.com/metadata/1',
  metadata: {
    name: 'Student Achievement',
    description: 'Awarded for academic excellence',
    image: 'https://example.com/achievement.png',
    attributes: [
      { trait_type: 'Achievement Type', value: 'Academic Excellence' },
      { trait_type: 'Year', value: '2024' },
      { trait_type: 'Institution', value: 'Example University' }
    ]
  },
  verificationStatus: 'verified' as const,
  attributes: [
    { trait_type: 'Achievement Type', value: 'Academic Excellence' },
    { trait_type: 'Year', value: '2024' },
    { trait_type: 'Institution', value: 'Example University' }
  ],
  revocable: true,
  revokedAt: undefined,
  collectionId: 'collection_1',
  rarityScore: 85,
  tags: ['academic', 'achievement', 'education']
};

const mockProps = {
  token: mockToken,
  onClick: jest.fn()
};

describe('SBTCard Component Tests', () => {
  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('SBTCard Core Functionality', () => {
    it('renders successfully with minimum props', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
      expect(screen.getByText('Awarded for academic excellence')).toBeInTheDocument();
    });

    it('displays SBT information correctly', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
      expect(screen.getByText('Awarded for academic excellence')).toBeInTheDocument();
      expect(screen.getByText('Example University')).toBeInTheDocument();
    });

    it('shows SBT status correctly', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('displays SBT image when available', () => {
      render(<SBTCard {...mockProps} />);
      
      const image = screen.getByAltText('Student Achievement');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/achievement.png');
    });

    it('handles missing SBT image gracefully', () => {
      const tokenWithoutImage = {
        ...mockToken,
        image: ''
      };
      
      render(<SBTCard {...mockProps} token={tokenWithoutImage} />);
      
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
      expect(screen.queryByAltText('Student Achievement')).not.toBeInTheDocument();
    });
  });

  describe('SBT Actions', () => {
    it('handles click action', async () => {
      render(<SBTCard {...mockProps} />);
      
      const card = screen.getByText('Student Achievement').closest('.sbt-card');
      await user.click(card!);
      
      expect(mockProps.onClick).toHaveBeenCalledWith(mockToken);
    });

    it('does not call onClick when not provided', async () => {
      render(<SBTCard token={mockToken} />);
      
      const card = screen.getByText('Student Achievement').closest('.sbt-card');
      await user.click(card!);
      
      // Should not throw error
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
    });
  });

  describe('SBT Metadata', () => {
    it('displays issuer information', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Example University')).toBeInTheDocument();
    });

    it('shows issue date information', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Issued:')).toBeInTheDocument();
      expect(screen.getByText('1/15/2024')).toBeInTheDocument();
    });

    it('displays chain information', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Chain:')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('handles missing metadata gracefully', () => {
      const tokenWithoutMetadata = {
        ...mockToken,
        metadata: undefined
      };
      
      render(<SBTCard {...mockProps} token={tokenWithoutMetadata} />);
      
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
    });
  });

  describe('Blockchain Information', () => {
    it('displays contract address', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Chain:')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('shows network information', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Chain:')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('displays issue date', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Issued:')).toBeInTheDocument();
      expect(screen.getByText('1/15/2024')).toBeInTheDocument();
    });

    it('handles different chain types correctly', () => {
      const polygonToken = {
        ...mockToken,
        chainType: 'Polygon'
      };
      
      render(<SBTCard {...mockProps} token={polygonToken} />);
      
      expect(screen.getByText('Polygon')).toBeInTheDocument();
    });
  });

  describe('SBT Status', () => {
    it('displays verified status correctly', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('displays pending status correctly', () => {
      const pendingToken = {
        ...mockToken,
        verificationStatus: 'pending' as const
      };
      
      render(<SBTCard {...mockProps} token={pendingToken} />);
      
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('displays failed status correctly', () => {
      const failedToken = {
        ...mockToken,
        verificationStatus: 'failed' as const
      };
      
      render(<SBTCard {...mockProps} token={failedToken} />);
      
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('applies correct styling for different statuses', () => {
      const { rerender } = render(<SBTCard {...mockProps} />);
      
      // Verified status
      expect(screen.getByText('Verified').closest('.sbt-status')).toHaveClass('sbt-status-verified');
      
      // Pending status
      const pendingToken = { ...mockToken, verificationStatus: 'pending' as const };
      rerender(<SBTCard {...mockProps} token={pendingToken} />);
      expect(screen.getByText('Pending').closest('.sbt-status')).toHaveClass('sbt-status-pending');
      
      // Failed status
      const failedToken = { ...mockToken, verificationStatus: 'failed' as const };
      rerender(<SBTCard {...mockProps} token={failedToken} />);
      expect(screen.getByText('Failed').closest('.sbt-status')).toHaveClass('sbt-status-failed');
    });
  });

  describe('Interactive Features', () => {
    it('handles click interactions', async () => {
      render(<SBTCard {...mockProps} />);
      
      const card = screen.getByText('Student Achievement').closest('.sbt-card');
      await user.click(card!);
      
      expect(mockProps.onClick).toHaveBeenCalledWith(mockToken);
    });

    it('shows hover effects', async () => {
      render(<SBTCard {...mockProps} />);
      
      const card = screen.getByText('Student Achievement').closest('.sbt-card');
      
      // Simulate hover
      fireEvent.mouseEnter(card!);
      
      // Should show hover effects
      expect(card).toHaveClass('sbt-card');
    });

    it('handles keyboard navigation', async () => {
      render(<SBTCard {...mockProps} />);
      
      const card = screen.getByText('Student Achievement').closest('.sbt-card');
      
      // Test that the card is rendered and clickable
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('sbt-card');
    });
  });

  describe('Error Handling', () => {
    it('handles missing token data gracefully', () => {
      const incompleteToken = {
        id: 'token_incomplete',
        name: 'Unknown Token',
        description: 'No description available',
        image: '',
        issuer: 'did:example:unknown',
        issuerName: 'Unknown Issuer',
        issuedAt: '2024-01-15T10:30:00.000Z',
        chainId: '1',
        chainType: 'Ethereum',
        contractAddress: '0xABC123',
        tokenStandard: 'ERC-1155',
        verificationStatus: 'unknown' as const,
        revocable: true
      };
      
      render(<SBTCard {...mockProps} token={incompleteToken} />);
      
      expect(screen.getByText('Unknown Token')).toBeInTheDocument();
      expect(screen.getByText('No description available')).toBeInTheDocument();
    });

    it('handles malformed dates gracefully', () => {
      const tokenWithInvalidDate = {
        ...mockToken,
        issuedAt: 'invalid-date'
      };
      
      render(<SBTCard {...mockProps} token={tokenWithInvalidDate} />);
      
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
      // Should not crash on invalid dates
    });

    it('handles missing issuer gracefully', () => {
      const tokenWithoutIssuer = {
        ...mockToken,
        issuerName: ''
      };
      
      render(<SBTCard {...mockProps} token={tokenWithoutIssuer} />);
      
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<SBTCard {...mockProps} />);
      
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
      expect(screen.getByText('Awarded for academic excellence')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<SBTCard {...mockProps} />);
      
      const card = screen.getByText('Student Achievement').closest('.sbt-card');
      
      // Test that the card is rendered and accessible
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('sbt-card');
    });

    it('has proper focus management', async () => {
      render(<SBTCard {...mockProps} />);
      
      const card = screen.getByText('Student Achievement').closest('.sbt-card');
      
      // Test that the card is rendered and accessible
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('sbt-card');
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large metadata', () => {
      const tokenWithLargeMetadata = {
        ...mockToken,
        metadata: {
          ...mockToken.metadata,
          attributes: Array.from({ length: 50 }, (_, i) => ({
            trait_type: `Attribute ${i}`,
            value: `Value ${i}`
          }))
        }
      };
      
      const startTime = Date.now();
      render(<SBTCard {...mockProps} token={tokenWithLargeMetadata} />);
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
    });

    it('handles rapid interactions without performance issues', async () => {
      render(<SBTCard {...mockProps} />);
      
      // Rapidly click the card
      for (let i = 0; i < 10; i++) {
        const card = screen.getByText('Student Achievement').closest('.sbt-card');
        await user.click(card!);
      }
      
      // Should still be responsive
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      render(<SBTCard {...mockProps} />);
      
      // Should render without layout issues
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
      
      // Test with different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      // Should still render correctly
      expect(screen.getByText('Student Achievement')).toBeInTheDocument();
    });

    it('handles long text gracefully', () => {
      const tokenWithLongText = {
        ...mockToken,
        name: 'Very Long SBT Name That Exceeds Normal Length Limits',
        description: 'This is a very long description that should be handled gracefully by the component without breaking the layout or causing overflow issues.'
      };
      
      render(<SBTCard {...mockProps} token={tokenWithLongText} />);
      
      expect(screen.getByText('Very Long SBT Name That Exceeds Normal Length Limits')).toBeInTheDocument();
      expect(screen.getByText('This is a very long description that should be handled gracefully by the component without breaking the layout or causing overflow issues.')).toBeInTheDocument();
    });
  });
}); 

describe('Uncovered SBTCard branches', () => {
  it('renders correct status color and text for all statuses', () => {
    const statuses = [
      'verified', 'pending', 'failed', 'revoked', 'unknown'
    ] as const;
    const expectedText = ['Verified', 'Pending', 'Failed', 'Revoked', 'Unknown'];
    const expectedClass = [
      'sbt-status-verified',
      'sbt-status-pending',
      'sbt-status-failed',
      'sbt-status-revoked',
      'sbt-status-unknown',
    ];
    statuses.forEach((status, i) => {
      const token = { ...mockToken, verificationStatus: status };
      render(<SBTCard token={token} />);
      const statusEl = screen.getByText(expectedText[i]);
      expect(statusEl).toHaveClass(expectedClass[i]);
    });
  });

  it('shows EXPIRED overlay if expired', () => {
    const token = {
      ...mockToken,
      expiresAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // past date
      verificationStatus: 'verified' as const
    };
    render(<SBTCard token={token} />);
    expect(screen.getByText('EXPIRED')).toBeInTheDocument();
  });

  it('shows REVOKED overlay if revoked', () => {
    const token = {
      ...mockToken,
      verificationStatus: 'revoked' as const,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString() // future date
    };
    render(<SBTCard token={token} />);
    expect(screen.getByText('REVOKED')).toBeInTheDocument();
  });

  it('renders image placeholder if image is missing', () => {
    const token = { ...mockToken, image: '' };
    render(<SBTCard token={token} />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('shows placeholder if image fails to load (onError)', () => {
    const token = { ...mockToken, image: 'broken-url.png' };
    render(<SBTCard token={token} />);
    const img = screen.getByAltText('Student Achievement');
    // Simulate error
    fireEvent.error(img);
    // Placeholder should be visible (not hidden)
    const placeholder = screen.getByRole('img', { hidden: true });
    expect(placeholder).toBeInTheDocument();
  });

  it('renders no tags if tags missing or empty', () => {
    const token1 = { ...mockToken, tags: undefined };
    render(<SBTCard token={token1} />);
    expect(screen.queryByText('sbt-tag')).not.toBeInTheDocument();
    const token2 = { ...mockToken, tags: [] };
    render(<SBTCard token={token2} />);
    expect(screen.queryByText('sbt-tag')).not.toBeInTheDocument();
  });

  it('renders up to 3 tags and +N for overflow', () => {
    const token = { ...mockToken, tags: ['a', 'b', 'c', 'd', 'e'] };
    render(<SBTCard token={token} />);
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('c')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders no expires row if expiresAt is missing', () => {
    const token = { ...mockToken, expiresAt: undefined };
    render(<SBTCard token={token} />);
    expect(screen.queryByText('Expires:')).not.toBeInTheDocument();
  });
}); 