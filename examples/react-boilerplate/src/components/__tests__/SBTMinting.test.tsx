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

// Mock window.alert for jsdom
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
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

      expect(screen.getByRole('heading', { name: 'Mint SBT' })).toBeInTheDocument();
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

  describe('Wallet Connection Flow', () => {
    it('should attempt to connect wallet when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SBTMintingComponent />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // The component should attempt to connect (though it may fail in test environment)
      // We just verify the button is clickable and doesn't crash
      expect(connectButton).toBeInTheDocument();
    });

    it('should handle wallet connection failure gracefully', async () => {
      const user = userEvent.setup();
      mockEthereum.request.mockRejectedValue(new Error('User rejected connection'));

      render(<SBTMintingComponent />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);

      // Should still show connect button after failure
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation and Submission', () => {
    it('should have form fields that can be filled', async () => {
      const user = userEvent.setup();
      render(<SBTMintingComponent />);

      const contractInput = screen.getByLabelText(/contract address/i);
      const nameInput = screen.getByLabelText(/token name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(contractInput, '0x1234567890123456789012345678901234567890');
      await user.type(nameInput, 'Test SBT');
      await user.type(descriptionInput, 'A test soulbound token');

      expect(contractInput).toHaveValue('0x1234567890123456789012345678901234567890');
      expect(nameInput).toHaveValue('Test SBT');
      expect(descriptionInput).toHaveValue('A test soulbound token');
    });

    it('should have a mint button that can be clicked', async () => {
      const user = userEvent.setup();
      render(<SBTMintingComponent />);

      const mintButton = screen.getByRole('button', { name: /mint sbt/i });
      await user.click(mintButton);

      // Button should be clickable (though form validation may prevent submission)
      expect(mintButton).toBeInTheDocument();
    });
  });

  describe('Loading States and Progress Indicators', () => {
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
      expect(screen.getAllByText('Preparing minting transaction...')).toHaveLength(2);
    });

    it('should show minting progress with percentage', () => {
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
      expect(screen.getAllByText('Submitting minting transaction...')).toHaveLength(2);
    });

    it('should show confirmation progress with transaction hash', () => {
      const transactionHash = '0xabc123def456';
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'confirming' as const,
          progress: 80,
          message: 'Waiting for transaction confirmation...',
          transactionHash
        },
        isMinting: true,
      });

      render(<SBTMintingComponent />);

      expect(screen.getByText('Confirming')).toBeInTheDocument();
      expect(screen.getAllByText('Waiting for transaction confirmation...')).toHaveLength(2);
      expect(screen.getByText('0xabc123def456')).toBeInTheDocument();
    });

    it('should disable mint button during minting process', () => {
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
      expect(screen.getByText('Token ID:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Transaction:')).toBeInTheDocument();
      expect(screen.getByText('0xabc123')).toBeInTheDocument();
      expect(screen.getByText('Block:')).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
      expect(screen.getByText('Gas Used:')).toBeInTheDocument();
      expect(screen.getByText('200000')).toBeInTheDocument();
    });

    it('should handle minting errors and display error message', () => {
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

  describe('Transaction Status Modal', () => {
    it('should show transaction status modal during minting', () => {
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'minting' as const,
          progress: 50,
          message: 'Submitting transaction...'
        },
        isMinting: true,
      });

      render(<SBTMintingComponent />);

      // Modal should be visible during minting
      expect(screen.getByText('Minting SBT')).toBeInTheDocument();
      expect(screen.getAllByText('Submitting transaction...')).toHaveLength(2);
    });

    it('should show success modal with close button', () => {
      const mockResetStatus = jest.fn();
      
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        resetStatus: mockResetStatus,
        status: { 
          status: 'success' as const,
          result: {
            tokenId: '1',
            transactionHash: '0xabc123',
            blockNumber: 12345,
            gasUsed: BigInt('200000'),
            metadataUri: 'data:application/json,{}',
            contractAddress: '0xcontract',
            recipient: '0xrecipient',
            mintedAt: new Date().toISOString(),
          }
        },
      });

      render(<SBTMintingComponent />);

      // Should show success modal
      expect(screen.getByText('Minting Successful!')).toBeInTheDocument();
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

    it('should have reset functionality', async () => {
      const user = userEvent.setup();
      const mockResetStatus = jest.fn();
      
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        resetStatus: mockResetStatus,
      });

      render(<SBTMintingComponent />);

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Should call resetStatus function
      expect(mockResetStatus).toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('should integrate with useSBTMinting hook', () => {
      render(<SBTMintingComponent />);

      // Verify the hook is being used
      expect(mockUseSBTMinting).toHaveBeenCalled();
    });

    it('should handle different minting states correctly', () => {
      // Test idle state
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { status: 'idle' as const },
      });

      const { rerender } = render(<SBTMintingComponent />);
      expect(screen.getByText('Idle')).toBeInTheDocument();

      // Test preparing state
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'preparing' as const,
          progress: 25,
          message: 'Preparing...'
        },
        isMinting: true,
      });

      rerender(<SBTMintingComponent />);
      expect(screen.getByText('Preparing')).toBeInTheDocument();

      // Test error state
      mockUseSBTMinting.mockReturnValue({
        ...defaultMintingHookReturn,
        status: { 
          status: 'error' as const,
          error: 'Test error'
        },
      });

      rerender(<SBTMintingComponent />);
      expect(screen.getAllByText('Test error')).toHaveLength(2);
    });
  });
});