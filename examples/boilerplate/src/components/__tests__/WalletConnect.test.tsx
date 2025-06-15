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
  enable: jest.fn().mockResolvedValue(['0x123']),
  getAccounts: jest.fn().mockResolvedValue([{
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    name: 'Test Account',
    source: 'polkadot-js'
  }]),
  signMessage: jest.fn().mockResolvedValue('0x1234'),
  getProvider: jest.fn().mockReturnValue('polkadot-js'),
  validateAddress: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
} as unknown as jest.Mocked<WalletAdapter>;

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

      // Verify the public API was called
      expect(connectWallet).toHaveBeenCalled();
      
      // Verify the component state after connection
      expect(mockWalletAdapter.getAccounts).toHaveBeenCalled();
      expect(screen.getByText(mockAccounts[0].address)).toBeInTheDocument();
      expect(mockOnConnect).toHaveBeenCalledWith([mockAccounts[0].address]);
      
      // Verify the component is in connected state
      expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
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

      // Wait for the account to be displayed
      await screen.findByText(mockAccounts[0].address);
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

      // Verify connectWallet was called twice (once for initial connect, once for reconnect)
      expect(connectWallet).toHaveBeenCalledTimes(2);
      
      // Verify the wallet was properly reset between connections
      expect(mockWalletAdapter.disconnect).toHaveBeenCalled();
      
      // Verify we got a new wallet instance for the second connection
      const walletCalls = (connectWallet as jest.Mock).mock.calls;
      expect(walletCalls.length).toBe(2);
      
      // Verify the component state is correct
      expect(screen.getByText(mockAccounts[0].address)).toBeInTheDocument();
      expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument();
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
      // Use an error that the component recognizes as permanent
      mockWalletAdapter.getAccounts.mockRejectedValueOnce(new Error('WalletNotFoundError'));

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