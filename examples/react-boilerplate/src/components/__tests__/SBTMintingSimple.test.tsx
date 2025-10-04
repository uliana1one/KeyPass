import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SBTMintingComponent from '../SBTMintingComponent';
import { useSBTMinting } from '../../hooks/useSBTMinting';

// Mock the useSBTMinting hook
jest.mock('../../hooks/useSBTMinting');
const mockUseSBTMinting = useSBTMinting as jest.MockedFunction<typeof useSBTMinting>;

// Mock ethers
const mockBrowserProvider = jest.fn();
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  BrowserProvider: mockBrowserProvider,
}));

// Mock window.ethereum
const mockEthereum = {
  request: jest.fn(),
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

describe('SBTMintingComponent', () => {
  const mockSigner = {
    getAddress: jest.fn(),
  };

  const defaultMintingHookReturn = {
    status: { status: 'idle' as const },
    isMinting: false,
    isAvailable: true,
    providerStatus: { available: true, connected: true, network: 'moonbase-alpha' },
    mintSBT: jest.fn(),
    setContract: jest.fn(),
    resetStatus: jest.fn(),
    connectProvider: jest.fn(),
    disconnectProvider: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSBTMinting.mockReturnValue(defaultMintingHookReturn);
    mockSigner.getAddress.mockResolvedValue('0x1234567890123456789012345678901234567890');
    mockBrowserProvider.mockImplementation(() => ({
      getSigner: jest.fn().mockResolvedValue(mockSigner),
    }));
  });

  describe('Component Rendering', () => {
    it('should render minting form with all required fields', () => {
      render(<SBTMintingComponent />);

      expect(screen.getByText('Mint SBT')).toBeInTheDocument();
      expect(screen.getByLabelText(/contract address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recipient address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/token name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/image url/i)).toBeInTheDocument();
    });

    it('should display provider status when available', () => {
      render(<SBTMintingComponent />);

      expect(screen.getByText('Provider:')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Network: moonbase-alpha')).toBeInTheDocument();
    });

    it('should show connect wallet button when not connected', () => {
      render(<SBTMintingComponent />);

      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });
  });

  describe('Wallet Connection', () => {
    it('should connect wallet successfully', async () => {
      const user = userEvent.setup();
      render(<SBTMintingComponent />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('✓ Wallet Connected')).toBeInTheDocument();
      });
    });

    it('should handle wallet connection failure gracefully', async () => {
      const user = userEvent.setup();
      mockEthereum.request.mockRejectedValue(new Error('User rejected connection'));

      render(<SBTMintingComponent />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should still show connect button after failure
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<SBTMintingComponent />);

      // Connect wallet first
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('✓ Wallet Connected')).toBeInTheDocument();
      });
    });

    it('should validate required fields before submission', async () => {
      const user = userEvent.setup();
      const mintButton = screen.getByRole('button', { name: /mint sbt/i });

      // Try to submit without filling required fields
      await user.click(mintButton);

      // Should not call mintSBT
      expect(defaultMintingHookReturn.mintSBT).not.toHaveBeenCalled();
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockMintSBT = jest.fn().mockResolvedValue({
        tokenId: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        gasUsed: BigInt('200000'),
        metadataUri: 'data:application/json,{}',
        contractAddress: '0xcontract',
        recipient: '0xrecipient',
        mintedAt: new Date().toISOString(),
      });

      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        mintSBT: mockMintSBT,
      });

      render(<SBTMintingComponent />);

      // Fill form
      await user.type(screen.getByLabelText(/contract address/i), '0x1234567890123456789012345678901234567890');
      await user.type(screen.getByLabelText(/token name/i), 'Test SBT');
      await user.type(screen.getByLabelText(/description/i), 'A test soulbound token');

      const mintButton = screen.getByRole('button', { name: /mint sbt/i });
      await user.click(mintButton);

      expect(mockMintSBT).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during minting preparation', () => {
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'preparing' as const,
          progress: 10,
          message: 'Preparing minting transaction...'
        },
        isMinting: true,
      });

      render(<SBTMintingComponent />);

      expect(screen.getByText('Preparing')).toBeInTheDocument();
      expect(screen.getByText('Preparing minting transaction...')).toBeInTheDocument();
    });

    it('should show minting progress', () => {
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'minting' as const,
          progress: 50,
          message: 'Submitting minting transaction...'
        },
        isMinting: true,
      });

      render(<SBTMintingComponent />);

      expect(screen.getByText('Minting')).toBeInTheDocument();
      expect(screen.getByText('Submitting minting transaction...')).toBeInTheDocument();
    });

    it('should disable mint button during minting', () => {
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        isMinting: true,
        status: { status: 'minting' as const },
      });

      render(<SBTMintingComponent />);

      const mintButton = screen.getByRole('button', { name: /minting.../i });
      expect(mintButton).toBeDisabled();
    });
  });

  describe('Success and Error Handling', () => {
    it('should display success message with transaction details', () => {
      const mockResult = {
        tokenId: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        gasUsed: BigInt('200000'),
        metadataUri: 'data:application/json,{}',
        contractAddress: '0xcontract',
        recipient: '0xrecipient',
        mintedAt: new Date().toISOString(),
      };

      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'success' as const,
          result: mockResult
        },
      });

      render(<SBTMintingComponent />);

      expect(screen.getByText('Minting Successful!')).toBeInTheDocument();
      expect(screen.getByText('Token ID: 1')).toBeInTheDocument();
      expect(screen.getByText('TX: 0xabc123')).toBeInTheDocument();
      expect(screen.getByText('Block: 12345')).toBeInTheDocument();
      expect(screen.getByText('Gas Used: 200000')).toBeInTheDocument();
    });

    it('should handle minting errors', () => {
      const errorMessage = 'Transaction failed: insufficient funds';
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'error' as const,
          error: errorMessage
        },
      });

      render(<SBTMintingComponent />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should call onMintingComplete callback on success', async () => {
      const mockOnMintingComplete = jest.fn();
      const mockResult = {
        tokenId: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        gasUsed: BigInt('200000'),
        metadataUri: 'data:application/json,{}',
        contractAddress: '0xcontract',
        recipient: '0xrecipient',
        mintedAt: new Date().toISOString(),
      };

      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'success' as const,
          result: mockResult
        },
      });

      render(<SBTMintingComponent onMintingComplete={mockOnMintingComplete} />);

      await waitFor(() => {
        expect(mockOnMintingComplete).toHaveBeenCalledWith(mockResult);
      });
    });

    it('should call onError callback on failure', async () => {
      const mockOnError = jest.fn();
      const errorMessage = 'Transaction failed: network error';

      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'error' as const,
          error: errorMessage
        },
      });

      render(<SBTMintingComponent onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('Contract Address Prop', () => {
    it('should pre-fill contract address when provided as prop', () => {
      const contractAddress = '0x1234567890123456789012345678901234567890';
      render(<SBTMintingComponent contractAddress={contractAddress} />);

      const contractInput = screen.getByLabelText(/contract address/i) as HTMLInputElement;
      expect(contractInput.value).toBe(contractAddress);
    });

    it('should call setContract when contractAddress prop is provided', () => {
      const mockSetContract = jest.fn();
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        setContract: mockSetContract,
      });

      const contractAddress = '0x1234567890123456789012345678901234567890';
      render(<SBTMintingComponent contractAddress={contractAddress} />);

      expect(mockSetContract).toHaveBeenCalledWith(contractAddress);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle minting service unavailable error', () => {
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        isAvailable: false,
        providerStatus: { available: false, connected: false },
      });

      render(<SBTMintingComponent />);

      expect(screen.getByText('Provider:')).toBeInTheDocument();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockEthereum.request.mockRejectedValue(new Error('Network error'));

      render(<SBTMintingComponent />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should handle error gracefully without crashing
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });
  });
});
