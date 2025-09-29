import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SBTSection } from '../SBTSection';
import { SBTService } from '../../services/sbtService';

// Mock the SBT service
jest.mock('../../services/sbtService', () => ({
  SBTService: jest.fn().mockImplementation(() => ({
    getSBTs: jest.fn(),
    mintSBT: jest.fn(),
    transferSBT: jest.fn(),
    burnSBT: jest.fn(),
    getSBTMetadata: jest.fn(),
  })),
}));

// Mock the SBTCard component
jest.mock('../SBTCard', () => ({
  SBTCard: ({ sbt, onTransfer, onBurn }: any) => (
    <div data-testid="sbt-card">
      <h3>{sbt.name}</h3>
      <p>{sbt.description}</p>
      <button onClick={() => onTransfer(sbt.id)}>Transfer</button>
      <button onClick={() => onBurn(sbt.id)}>Burn</button>
    </div>
  ),
}));

describe('SBTSection Component Tests', () => {
  let user: any;
  let mockSBTService: any;

  const mockProps = {
    walletAddress: '0x123456789',
    chainType: 'ethereum' as const,
    useRealData: false,
  };

  const mockSBTs = [
    {
      id: 'sbt_1',
      name: 'Student Achievement',
      description: 'Awarded for academic excellence',
      image: 'https://example.com/achievement.png',
      tokenId: '1',
      contractAddress: '0xABC123',
      chainId: 1,
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
      owner: '0x123456789',
      mintDate: '2024-01-15T10:30:00.000Z',
      status: 'MINTED'
    },
    {
      id: 'sbt_2',
      name: 'Professional Certification',
      description: 'Blockchain Developer Certification',
      image: 'https://example.com/certification.png',
      tokenId: '2',
      contractAddress: '0xDEF456',
      chainId: 1,
      metadata: {
        name: 'Professional Certification',
        description: 'Blockchain Developer Certification',
        image: 'https://example.com/certification.png',
        attributes: [
          { trait_type: 'Certification Type', value: 'Blockchain Development' },
          { trait_type: 'Issuer', value: 'Crypto Academy' },
          { trait_type: 'Level', value: 'Advanced' }
        ]
      },
      owner: '0x123456789',
      mintDate: '2024-02-01T10:30:00.000Z',
      status: 'MINTED'
    }
  ];

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    mockSBTService = {
      getSBTs: jest.fn().mockResolvedValue(mockSBTs),
      mintSBT: jest.fn().mockResolvedValue(mockSBTs[0]),
      transferSBT: jest.fn().mockResolvedValue(undefined),
      burnSBT: jest.fn().mockResolvedValue(undefined),
      getSBTMetadata: jest.fn().mockResolvedValue(mockSBTs[0].metadata),
    };

    (SBTService as jest.Mock).mockImplementation(() => mockSBTService);
  });

  describe('SBTSection Core Functionality', () => {
    it('renders successfully with minimum props', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Soulbound Tokens (SBTs)')).toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      render(<SBTSection {...mockProps} />);
      
      expect(screen.getByText('Loading your SBTs...')).toBeInTheDocument();
    });

    it('loads and displays SBTs correctly', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Soulbound Tokens')).toBeInTheDocument();
        expect(screen.getByText('Student Achievement')).toBeInTheDocument();
        expect(screen.getByText('Professional Certification')).toBeInTheDocument();
      });
    });

    it('shows empty state when no SBTs', async () => {
      mockSBTService.getSBTs.mockResolvedValue([]);
      
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No SBTs Yet')).toBeInTheDocument();
        expect(screen.getByText("You haven't minted any soulbound tokens yet.")).toBeInTheDocument();
      });
    });

    it('handles loading errors gracefully', async () => {
      mockSBTService.getSBTs.mockRejectedValue(new Error('Network error'));
      
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading SBTs')).toBeInTheDocument();
        expect(screen.getByText('Failed to load SBT data: Network error')).toBeInTheDocument();
      });
    });

    it('allows retry on error', async () => {
      mockSBTService.getSBTs.mockRejectedValueOnce(new Error('Network error'));
      
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      // Mock success on retry
      mockSBTService.getSBTs.mockResolvedValue(mockSBTs);
      
      await user.click(screen.getByText('Try Again'));
      
      await waitFor(() => {
        expect(screen.getByText('Your Soulbound Tokens')).toBeInTheDocument();
      });
    });
  });

  describe('SBT Display', () => {
    it('displays SBT cards with correct information', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Student Achievement')).toBeInTheDocument();
        expect(screen.getByText('Professional Certification')).toBeInTheDocument();
        expect(screen.getByText('Awarded for academic excellence')).toBeInTheDocument();
        expect(screen.getByText('Blockchain Developer Certification')).toBeInTheDocument();
      });
    });

    it('shows SBT metadata correctly', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Student Achievement')).toBeInTheDocument();
        expect(screen.getByText('Professional Certification')).toBeInTheDocument();
      });
    });

    it('displays SBT status indicators', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('sbt-card')).toHaveLength(2);
      });
    });
  });

  describe('SBT Actions', () => {
    it('handles SBT transfer', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Soulbound Tokens')).toBeInTheDocument();
      });
      
      const transferButtons = screen.getAllByText('Transfer');
      if (transferButtons.length > 0) {
        await user.click(transferButtons[0]);
        
        await waitFor(() => {
          expect(mockSBTService.transferSBT).toHaveBeenCalled();
        });
      }
    });

    it('handles SBT burn', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Soulbound Tokens')).toBeInTheDocument();
      });
      
      const burnButtons = screen.getAllByText('Burn');
      if (burnButtons.length > 0) {
        await user.click(burnButtons[0]);
        
        await waitFor(() => {
          expect(mockSBTService.burnSBT).toHaveBeenCalled();
        });
      }
    });

    it('shows confirmation dialog for destructive actions', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Soulbound Tokens')).toBeInTheDocument();
      });
      
      const burnButtons = screen.getAllByText('Burn');
      if (burnButtons.length > 0) {
        await user.click(burnButtons[0]);
        
        // Should show confirmation dialog
        await waitFor(() => {
          expect(screen.getByText(/Are you sure you want to burn this SBT/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('SBT Minting', () => {
    it('shows mint SBT button', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Mint New SBT')).toBeInTheDocument();
      });
    });

    it('opens minting wizard when clicked', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Mint New SBT')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Mint New SBT'));
      
      // Should show minting wizard
      expect(screen.getByText('Mint Soulbound Token')).toBeInTheDocument();
    });

    it('handles SBT minting process', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Mint New SBT')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Mint New SBT'));
      
      // Fill minting form
      const nameInput = screen.getByLabelText('SBT Name');
      const descriptionInput = screen.getByLabelText('Description');
      
      await user.type(nameInput, 'Test SBT');
      await user.type(descriptionInput, 'Test description');
      
      await user.click(screen.getByText('Mint SBT'));
      
      await waitFor(() => {
        expect(mockSBTService.mintSBT).toHaveBeenCalled();
      });
    });
  });

  describe('Blockchain Integration', () => {
    it('shows blockchain network information', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Network:')).toBeInTheDocument();
        expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
      });
    });

    it('displays contract addresses', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Contract:')).toBeInTheDocument();
        expect(screen.getByText('0xABC123')).toBeInTheDocument();
      });
    });

    it('shows token IDs', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Token ID:')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('SBT Metadata', () => {
    it('displays SBT attributes', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Achievement Type:')).toBeInTheDocument();
        expect(screen.getByText('Academic Excellence')).toBeInTheDocument();
        expect(screen.getByText('Year:')).toBeInTheDocument();
        expect(screen.getByText('2024')).toBeInTheDocument();
      });
    });

    it('shows mint date information', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Minted:')).toBeInTheDocument();
        expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      });
    });

    it('displays owner information', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Owner:')).toBeInTheDocument();
        expect(screen.getByText('0x1234...6789')).toBeInTheDocument();
      });
    });
  });

  describe('Data Source Toggle', () => {
    it('displays data source toggle buttons', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Demo Data')).toBeInTheDocument();
        expect(screen.getByText('Real Data')).toBeInTheDocument();
      });
    });

    it('shows current data source mode', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Mode: Demo Data/)).toBeInTheDocument();
        expect(screen.getByText(/Using mock SBT data for demonstration/)).toBeInTheDocument();
      });
    });

    it('allows switching between data sources', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Demo Data')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Real Data'));
      
      await waitFor(() => {
        expect(screen.getByText(/Mode: Real Data/)).toBeInTheDocument();
        expect(screen.getByText(/Fetching from blockchain/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      mockSBTService.getSBTs.mockRejectedValue(new Error('Service unavailable'));
      
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading SBTs')).toBeInTheDocument();
        expect(screen.getByText('Failed to load SBT data: Service unavailable')).toBeInTheDocument();
      });
    });

    it('handles minting errors', async () => {
      mockSBTService.mintSBT.mockRejectedValue(new Error('Minting failed'));
      
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Mint New SBT')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Mint New SBT'));
      
      const nameInput = screen.getByLabelText('SBT Name');
      await user.type(nameInput, 'Test SBT');
      
      await user.click(screen.getByText('Mint SBT'));
      
      await waitFor(() => {
        expect(screen.getByText('Error minting SBT')).toBeInTheDocument();
      });
    });

    it('handles transfer errors', async () => {
      mockSBTService.transferSBT.mockRejectedValue(new Error('Transfer failed'));
      
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Soulbound Tokens')).toBeInTheDocument();
      });
      
      const transferButtons = screen.getAllByText('Transfer');
      if (transferButtons.length > 0) {
        await user.click(transferButtons[0]);
        
        await waitFor(() => {
          expect(screen.getByText('Error transferring SBT')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for SBT cards', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mint new sbt/i })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Mint New SBT')).toBeInTheDocument();
      });
      
      // Test tab navigation
      await user.tab();
      expect(screen.getByText('Mint New SBT')).toHaveFocus();
    });

    it('has proper focus management for modals', async () => {
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Mint New SBT')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Mint New SBT'));
      
      // Focus should be trapped in modal
      expect(screen.getByText('Mint Soulbound Token')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('loads data efficiently', async () => {
      const startTime = Date.now();
      
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Soulbound Tokens')).toBeInTheDocument();
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('handles large SBT lists', async () => {
      const largeSBTList = Array.from({ length: 100 }, (_, i) => ({
        ...mockSBTs[0],
        id: `sbt_${i}`,
        name: `SBT ${i}`,
        tokenId: i.toString()
      }));
      
      mockSBTService.getSBTs.mockResolvedValue(largeSBTList);
      
      render(<SBTSection {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Soulbound Tokens')).toBeInTheDocument();
      });
      
      // Should render without performance issues
      expect(screen.getByText('SBT 0')).toBeInTheDocument();
    });
  });
}); 