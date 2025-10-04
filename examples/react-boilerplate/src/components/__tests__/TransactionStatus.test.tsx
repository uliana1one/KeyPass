import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionStatus from '../TransactionStatus';

describe('TransactionStatus', () => {
  const defaultProps = {
    status: 'idle' as const,
  };

  describe('Component Rendering', () => {
    it('should not render when status is idle', () => {
      render(<TransactionStatus {...defaultProps} />);
      
      expect(screen.queryByText('Transaction Successful')).not.toBeInTheDocument();
      expect(screen.queryByText('Transaction Failed')).not.toBeInTheDocument();
      expect(screen.queryByText('Preparing Transaction')).not.toBeInTheDocument();
    });

    it('should render preparing transaction status', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="preparing"
          progress={10}
          message="Preparing minting transaction..."
        />
      );

      expect(screen.getByText('Preparing Transaction')).toBeInTheDocument();
      expect(screen.getByText('Preparing minting transaction...')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('should render minting transaction status', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="minting"
          progress={50}
          message="Submitting minting transaction..."
        />
      );

      expect(screen.getByText('Minting SBT')).toBeInTheDocument();
      expect(screen.getByText('Submitting minting transaction...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render confirming transaction status', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="confirming"
          progress={80}
          message="Waiting for transaction confirmation..."
          transactionHash="0xabc123def456"
        />
      );

      expect(screen.getByText('Confirming Transaction')).toBeInTheDocument();
      expect(screen.getByText('Waiting for transaction confirmation...')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('0xabc123def456')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    const successProps = {
      ...defaultProps,
      status: 'success' as const,
      progress: 100,
      message: 'SBT minted successfully!',
      transactionHash: '0xabc123def456',
      blockNumber: 12345,
      gasUsed: BigInt('200000'),
      gasPrice: BigInt('20000000000'),
      result: {
        tokenId: '1',
        transactionHash: '0xabc123def456',
        blockNumber: 12345,
        gasUsed: BigInt('200000'),
        metadataUri: 'data:application/json,{}',
        contractAddress: '0xcontract123',
        recipient: '0xrecipient123',
        mintedAt: '2024-01-15T10:30:00Z',
      },
    };

    it('should display success status with all details', () => {
      render(<TransactionStatus {...successProps} />);

      expect(screen.getByText('Transaction Successful')).toBeInTheDocument();
      expect(screen.getByText('SBT minted successfully!')).toBeInTheDocument();
      expect(screen.getByText('SBT Minted Successfully!')).toBeInTheDocument();
      expect(screen.getByText('Token ID: 1')).toBeInTheDocument();
      expect(screen.getByText('Block: 12,345')).toBeInTheDocument();
    });

    it('should display transaction hash with explorer link', () => {
      render(<TransactionStatus {...successProps} />);

      const hashElement = screen.getByText('0xabc123def456');
      expect(hashElement).toBeInTheDocument();

      const explorerLink = screen.getByRole('link');
      expect(explorerLink).toHaveAttribute('href', 'https://moonbase.moonscan.io/tx/0xabc123def456');
      expect(explorerLink).toHaveAttribute('target', '_blank');
    });

    it('should format gas information correctly', () => {
      render(<TransactionStatus {...successProps} />);

      expect(screen.getByText('Gas Information')).toBeInTheDocument();
      expect(screen.getByText('200000')).toBeInTheDocument(); // gasUsed
      expect(screen.getByText('20 Gwei')).toBeInTheDocument(); // gasPrice
    });

    it('should show done button for success state', () => {
      render(<TransactionStatus {...successProps} />);

      const doneButton = screen.getByRole('button', { name: /done/i });
      expect(doneButton).toBeInTheDocument();
      expect(doneButton).toHaveClass('bg-green-600');
    });
  });

  describe('Error State', () => {
    const errorProps = {
      ...defaultProps,
      status: 'error' as const,
      error: 'Transaction failed: insufficient funds',
    };

    it('should display error status with error message', () => {
      render(<TransactionStatus {...errorProps} />);

      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
      expect(screen.getByText('Transaction failed: insufficient funds')).toBeInTheDocument();
    });

    it('should show close button for error state', () => {
      render(<TransactionStatus {...errorProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('bg-red-600');
    });
  });

  describe('Progress Bar', () => {
    it('should display progress bar with correct percentage', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="minting"
          progress={75}
          message="Processing..."
        />
      );

      const progressBar = screen.getByText('75%');
      expect(progressBar).toBeInTheDocument();

      // Check if progress bar has correct width
      const progressBarFill = document.querySelector('.bg-blue-600');
      expect(progressBarFill).toHaveStyle('width: 75%');
    });

    it('should not show progress bar when progress is 0', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="preparing"
          progress={0}
        />
      );

      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });
  });

  describe('Gas Information Display', () => {
    it('should display gas estimate and gas price', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="confirming"
          gasEstimate={BigInt('250000')}
          gasPrice={BigInt('25000000000')}
          transactionHash="0xabc123"
        />
      );

      expect(screen.getByText('Gas Information')).toBeInTheDocument();
      expect(screen.getByText('250000')).toBeInTheDocument(); // gasEstimate
      expect(screen.getByText('25 Gwei')).toBeInTheDocument(); // gasPrice
    });

    it('should display EIP-1559 fees when available', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="confirming"
          gasEstimate={BigInt('200000')}
          maxFeePerGas={BigInt('30000000000')}
          maxPriorityFeePerGas={BigInt('2000000000')}
          transactionHash="0xabc123"
        />
      );

      expect(screen.getByText('Max Fee Per Gas')).toBeInTheDocument();
      expect(screen.getByText('30 Gwei')).toBeInTheDocument();
      expect(screen.getByText('Max Priority Fee')).toBeInTheDocument();
      expect(screen.getByText('2 Gwei')).toBeInTheDocument();
    });

    it('should calculate and display total cost', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="confirming"
          gasUsed={BigInt('200000')}
          gasPrice={BigInt('25000000000')}
          transactionHash="0xabc123"
        />
      );

      expect(screen.getByText('Estimated Cost')).toBeInTheDocument();
      expect(screen.getByText('0.005 ETH')).toBeInTheDocument();
    });
  });

  describe('Modal Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      
      render(
        <TransactionStatus
          {...defaultProps}
          status="success"
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /done/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button is clicked', () => {
      const mockOnClose = jest.fn();
      
      render(
        <TransactionStatus
          {...defaultProps}
          status="success"
          onClose={mockOnClose}
        />
      );

      const xButton = screen.getByRole('button', { name: '' }); // X button has no accessible name
      fireEvent.click(xButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should disable processing button during transaction', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="minting"
          message="Processing..."
        />
      );

      const processingButton = screen.getByRole('button', { name: /processing.../i });
      expect(processingButton).toBeDisabled();
    });
  });

  describe('Block Explorer Integration', () => {
    it('should create correct explorer URL for transaction hash', () => {
      const transactionHash = '0x1234567890abcdef';
      
      render(
        <TransactionStatus
          {...defaultProps}
          status="confirming"
          transactionHash={transactionHash}
        />
      );

      const explorerLink = screen.getByRole('link');
      expect(explorerLink).toHaveAttribute(
        'href',
        `https://moonbase.moonscan.io/tx/${transactionHash}`
      );
      expect(explorerLink).toHaveAttribute('target', '_blank');
      expect(explorerLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not show explorer link when no transaction hash', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="preparing"
        />
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('Status Icons and Colors', () => {
    it('should show correct icon for success status', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="success"
        />
      );

      // Check for checkmark icon (success)
      const successIcon = document.querySelector('path[d="M5 13l4 4L19 7"]');
      expect(successIcon).toBeInTheDocument();
    });

    it('should show correct icon for error status', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="error"
        />
      );

      // Check for X icon (error)
      const errorIcon = document.querySelector('path[d="M6 18L18 6M6 6l12 12"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should show correct icon for processing status', () => {
      render(
        <TransactionStatus
          {...defaultProps}
          status="minting"
        />
      );

      // Check for spinning icon (processing)
      const processingIcon = document.querySelector('.animate-spin');
      expect(processingIcon).toBeInTheDocument();
    });

    it('should apply correct color classes for different statuses', () => {
      const { rerender } = render(
        <TransactionStatus
          {...defaultProps}
          status="success"
        />
      );

      let modal = document.querySelector('.text-green-600.bg-green-50.border-green-200');
      expect(modal).toBeInTheDocument();

      rerender(
        <TransactionStatus
          {...defaultProps}
          status="error"
        />
      );

      modal = document.querySelector('.text-red-600.bg-red-50.border-red-200');
      expect(modal).toBeInTheDocument();

      rerender(
        <TransactionStatus
          {...defaultProps}
          status="minting"
        />
      );

      modal = document.querySelector('.text-blue-600.bg-blue-50.border-blue-200');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Result Details Display', () => {
    const resultProps = {
      ...defaultProps,
      status: 'success' as const,
      result: {
        tokenId: '123',
        transactionHash: '0xabc123def456',
        blockNumber: 98765,
        gasUsed: BigInt('300000'),
        metadataUri: 'ipfs://QmExample',
        contractAddress: '0xcontract456',
        recipient: '0xrecipient789',
        mintedAt: '2024-01-15T15:45:30Z',
      },
    };

    it('should display all result details in success section', () => {
      render(<TransactionStatus {...resultProps} />);

      expect(screen.getByText('Token ID: 123')).toBeInTheDocument();
      expect(screen.getByText('TX: 0xabc123...')).toBeInTheDocument();
      expect(screen.getByText('Block: 98,765')).toBeInTheDocument();
      expect(screen.getByText('Gas Used: 300000')).toBeInTheDocument();
    });

    it('should format addresses correctly in result details', () => {
      render(<TransactionStatus {...resultProps} />);

      expect(screen.getByText('0xrecipient789'.slice(0, 6) + '...' + '0xrecipient789'.slice(-4))).toBeInTheDocument();
      expect(screen.getByText('0xcontract456'.slice(0, 6) + '...' + '0xcontract456'.slice(-4))).toBeInTheDocument();
    });

    it('should format timestamp correctly', () => {
      render(<TransactionStatus {...resultProps} />);

      const expectedDate = new Date('2024-01-15T15:45:30Z').toLocaleString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });
  });
});
