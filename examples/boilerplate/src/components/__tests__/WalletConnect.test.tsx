import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WalletConnect } from '../WalletConnect';
import { connectWallet } from '@keypass/login-sdk/dist/walletConnector';
import type { WalletAdapter, WalletAccount } from '@keypass/login-sdk/dist/adapters/types';

// Mock the wallet connector
jest.mock('@keypass/login-sdk/dist/walletConnector', () => ({
  connectWallet: jest.fn(),
}));

// Extend WalletAdapter to include our mock methods
interface MockWalletAdapter extends WalletAdapter {
  disconnect: jest.Mock<Promise<void>>;
}

// Mock the wallet adapter
const mockWalletAdapter = {
  enable: jest.fn().mockResolvedValue(undefined),
  getAccounts: jest.fn().mockResolvedValue([]),
  signMessage: jest.fn().mockResolvedValue(''),
  getProvider: jest.fn().mockReturnValue('polkadot-js'),
  validateAddress: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<MockWalletAdapter>;

describe('WalletConnect', () => {
  const mockOnConnect = jest.fn();
  const mockOnError = jest.fn();
  const mockAccounts: WalletAccount[] = [{
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    name: undefined,
    source: 'polkadot-js'
  }];

  beforeEach(() => {
    jest.clearAllMocks();
    (connectWallet as jest.Mock).mockResolvedValue(mockWalletAdapter);
    mockWalletAdapter.getAccounts.mockResolvedValue(mockAccounts);
    mockWalletAdapter.getProvider.mockReturnValue('polkadot-js');
  });

  it('renders connect button when not connected', () => {
    render(<WalletConnect onConnect={mockOnConnect} onError={mockOnError} />);
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  describe('Connection', () => {
    it('connects to wallet successfully', async () => {
      render(<WalletConnect onConnect={mockOnConnect} onError={mockOnError} />);
      
      await act(async () => {
        fireEvent.click(screen.getByText('Connect Wallet'));
      });

      expect(connectWallet).toHaveBeenCalled();
      expect(mockWalletAdapter.enable).toHaveBeenCalled();
      expect(mockWalletAdapter.getAccounts).toHaveBeenCalled();
      expect(screen.getByText(mockAccounts[0].address)).toBeInTheDocument();
      expect(mockOnConnect).toHaveBeenCalledWith(mockAccounts[0]);
    });

    it('handles connection errors', async () => {
      const mockError = new Error('Connection failed');
      (connectWallet as jest.Mock).mockRejectedValueOnce(mockError);

      render(<WalletConnect onConnect={mockOnConnect} onError={mockOnError} />);
      
      await act(async () => {
        fireEvent.click(screen.getByText('Connect Wallet'));
      });

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    it('shows loading state during connection', async () => {
      // Delay the wallet connection
      (connectWallet as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(mockWalletAdapter), 100))
      );

      render(<WalletConnect onConnect={mockOnConnect} onError={mockOnError} />);
      
      await act(async () => {
        fireEvent.click(screen.getByText('Connect Wallet'));
      });

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  describe('Disconnection', () => {
    beforeEach(async () => {
      render(<WalletConnect onConnect={mockOnConnect} onError={mockOnError} />);
      
      // Connect first
      await act(async () => {
        fireEvent.click(screen.getByText('Connect Wallet'));
      });
    });

    it('disconnects wallet successfully', async () => {
      await act(async () => {
        fireEvent.click(screen.getByText('Disconnect'));
      });

      expect(mockWalletAdapter.disconnect).toHaveBeenCalled();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.queryByText(mockAccounts[0].address)).not.toBeInTheDocument();
    });

    it('handles disconnection errors', async () => {
      const mockError = new Error('Disconnect failed');
      mockWalletAdapter.disconnect.mockRejectedValueOnce(mockError);

      await act(async () => {
        fireEvent.click(screen.getByText('Disconnect'));
      });

      expect(screen.getByText('Disconnect failed')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    it('requires new connection after disconnect', async () => {
      // First disconnect
      await act(async () => {
        fireEvent.click(screen.getByText('Disconnect'));
      });

      // Try to connect again
      await act(async () => {
        fireEvent.click(screen.getByText('Connect Wallet'));
      });

      expect(connectWallet).toHaveBeenCalledTimes(2);
      expect(mockWalletAdapter.enable).toHaveBeenCalledTimes(2);
    });
  });

  describe('Connection Status Check', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      render(<WalletConnect onConnect={mockOnConnect} onError={mockOnError} />);
      
      // Connect first
      await act(async () => {
        fireEvent.click(screen.getByText('Connect Wallet'));
      });

      // Wait for the account to be displayed using findByText with a more flexible matcher
      await screen.findByText((content, element) => {
        return element?.tagName.toLowerCase() === 'span' && 
               element?.textContent === mockAccounts[0].address;
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('detects when account is no longer available', async () => {
      // Mock getAccounts to return empty array after some time
      mockWalletAdapter.getAccounts.mockResolvedValueOnce([]);

      // Fast-forward time to trigger connection check
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.queryByText(mockAccounts[0].address)).not.toBeInTheDocument();
    });

    it('detects when wallet is disconnected', async () => {
      // Mock getAccounts to throw error after some time
      mockWalletAdapter.getAccounts.mockRejectedValueOnce(new Error('Wallet disconnected'));

      // Fast-forward time to trigger connection check
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.queryByText(mockAccounts[0].address)).not.toBeInTheDocument();
    });

    it('maintains connection when account is still valid', async () => {
      // Fast-forward time to trigger connection check
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // Use a more reliable way to find the account text
      const accountElement = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'span' && 
               element?.textContent === mockAccounts[0].address;
      });
      expect(accountElement).toBeInTheDocument();
      expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument();
    });
  });

  describe('Component Cleanup', () => {
    it('cleans up interval on unmount', async () => {
      jest.useFakeTimers();
      const { unmount } = render(<WalletConnect onConnect={mockOnConnect} onError={mockOnError} />);
      
      // Connect first
      await act(async () => {
        fireEvent.click(screen.getByText('Connect Wallet'));
      });

      // Unmount component
      unmount();

      // Fast-forward time
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // Should not have called getAccounts after unmount
      expect(mockWalletAdapter.getAccounts).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });
}); 