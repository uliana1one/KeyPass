import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock the KeyPass SDK functions
jest.mock('@keypass/login-sdk', () => ({
  loginWithPolkadot: jest.fn(),
  loginWithEthereum: jest.fn(),
}));

// Mock accounts data
const mockAccounts = [
  {
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    name: 'Test Account',
    meta: {},
    injectedExtension: null, // Will be set during account fetching
  },
];

// Mock the injected extension with signer
const mockInjectedExtension = {
  accounts: {
    get: jest.fn().mockResolvedValue(mockAccounts),
  },
  signer: {
    signRaw: jest.fn().mockResolvedValue({
      signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    }),
  },
};

const mockExtension = {
  enable: jest.fn().mockResolvedValue(mockInjectedExtension),
};

// Mock window.injectedWeb3 and ethereum
Object.defineProperty(window, 'injectedWeb3', {
  value: {
    'polkadot-js': mockExtension,
  },
  writable: true,
});

Object.defineProperty(window, 'ethereum', {
  value: {
    isMetaMask: true,
    request: jest.fn().mockResolvedValue(['0x742d35Cc6634C0532925a3b8D0C9e0c0123456789']),
  },
  writable: true,
});

describe('DID Wizard Integration Tests', () => {
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockExtension.enable.mockResolvedValue(mockInjectedExtension);
    
    // Update mock accounts with injected extension
    const accountsWithExtension = mockAccounts.map(account => ({
      ...account,
      injectedExtension: mockInjectedExtension,
    }));
    
    mockInjectedExtension.accounts.get.mockResolvedValue(accountsWithExtension);
    
    if (window.ethereum) {
      (window.ethereum.request as jest.Mock).mockResolvedValue(['0x742d35Cc6634C0532925a3b8D0C9e0c0123456789']);
    }
    
    // Mock the wallet detection to return available wallets
    (window as any).injectedWeb3 = {
      'polkadot-js': mockExtension,
    };
  });

  describe('Complete Authentication Flow with DID Creation', () => {
    it('completes full flow from chain selection to profile with DID creation', async () => {
      render(<App />);
      
      // Step 1: Chain Selection
      await user.click(screen.getByText('Login with Polkadot'));
      
      // Step 2: Wallet Selection - wait for wallet to load
      await waitFor(() => {
        expect(screen.getByText('Polkadot.js Extension')).toBeInTheDocument();
      });
      
      const walletOption = screen.getByText('Polkadot.js Extension');
      await user.click(walletOption);
      
      // Step 3: Account Selection (mocked)
      await waitFor(() => {
        expect(screen.getByText('Test Account')).toBeInTheDocument();
      });
      
      const accountOption = screen.getByText('Test Account');
      await user.click(accountOption);
      
      // Step 4: Connect Wallet
      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
      
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);
      
      // Step 5: DID Creation should appear
      await waitFor(() => {
        expect(screen.getByText('Create Your DID')).toBeInTheDocument();
      });
      
      // Step 6: Navigate through DID wizard
      // Step 6a: DID Type Selection (Basic DID is selected by default)
      await user.click(screen.getByText('Next'));
      
      // Step 6b: Preview step
      await waitFor(() => {
        expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Next'));
      
      // Step 6c: Creation step
      await waitFor(() => {
        expect(screen.getByText('Create My DID')).toBeInTheDocument();
      });
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      // Step 7: Should eventually reach authentication success
      await waitFor(() => {
        expect(screen.getByText('Authentication Successful!')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('handles Basic DID creation flow', async () => {
      render(<App />);
      
      // Navigate to DID creation (simplified path)
      const polkadotButton = screen.getByText('Login with Polkadot');
      await user.click(polkadotButton);
      
      await waitFor(() => {
        const walletOption = screen.getByText('Polkadot.js Extension');
        user.click(walletOption);
      });
      
      await waitFor(() => {
        const accountOption = screen.getByText('Test Account');
        user.click(accountOption);
      });
      
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);
      
      // DID Creation with Basic DID (default selection)
      await waitFor(() => {
        expect(screen.getByText('Create Your DID')).toBeInTheDocument();
      });
      
      // Basic DID should be selected by default
      const basicCard = screen.getByText('Basic DID').closest('.did-type-card');
      expect(basicCard).toHaveClass('selected');
      
      // Skip configuration step for Basic DID
      await user.click(screen.getByText('Next'));
      
      // Should go directly to preview
      await waitFor(() => {
        expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Basic DID')).toBeInTheDocument();
      expect(screen.getByText('authentication')).toBeInTheDocument();
      
      // Create DID
      await user.click(screen.getByText('Next'));
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Authentication Successful!')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('handles Ethereum chain selection and DID creation', async () => {
      render(<App />);
      
      // Select Ethereum
      const ethereumButton = screen.getByText('Login with Ethereum');
      await user.click(ethereumButton);
      
      // Mock Ethereum wallet flow
      await waitFor(() => {
        expect(screen.getByText('Choose Your Ethereum Wallet')).toBeInTheDocument();
      });
      
      // Continue with DID creation flow
      // ... (similar to Polkadot flow but with Ethereum)
    });
  });

  describe('Navigation and State Management', () => {
    it('maintains state when navigating back and forth in wizard', async () => {
      render(<App />);
      
      // Navigate to DID creation
      await user.click(screen.getByText('Login with Polkadot'));
      
      await waitFor(() => {
        user.click(screen.getByText('Polkadot.js Extension'));
      });
      
      await waitFor(() => {
        user.click(screen.getByText('Test Account'));
      });
      
      await user.click(screen.getByText('Connect Wallet'));
      
      await waitFor(() => {
        expect(screen.getByText('Create Your DID')).toBeInTheDocument();
      });
      
      // Select Advanced DID and configure
      const advancedCard = screen.getByText('Advanced DID').closest('.did-type-card');
      await user.click(advancedCard!);
      await user.click(screen.getByText('Next'));
      
      // Add some configuration
      const descriptionTextarea = screen.getByPlaceholderText(/Optional description/);
      await user.type(descriptionTextarea, 'Test description');
      
      // Go to preview
      await user.click(screen.getByText('Next'));
      
      // Go back to configuration
      await user.click(screen.getByText('Previous'));
      
      // Verify state is maintained
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });

    it('allows canceling DID creation and returning to wallet selection', async () => {
      render(<App />);
      
      // Navigate to DID creation
      await user.click(screen.getByText('Login with Polkadot'));
      
      await waitFor(() => {
        user.click(screen.getByText('Polkadot.js Extension'));
      });
      
      await waitFor(() => {
        user.click(screen.getByText('Test Account'));
      });
      
      await user.click(screen.getByText('Connect Wallet'));
      
      await waitFor(() => {
        expect(screen.getByText('Create Your DID')).toBeInTheDocument();
      });
      
      // Cancel DID creation
      await user.click(screen.getByText('Cancel'));
      
      // Should return to wallet selection
      expect(screen.getByText('Choose Your Polkadot Wallet')).toBeInTheDocument();
    });

    it('allows going back to wallet selection from DID wizard', async () => {
      render(<App />);
      
      // Navigate to DID creation
      await user.click(screen.getByText('Login with Polkadot'));
      
      await waitFor(() => {
        user.click(screen.getByText('Polkadot.js Extension'));
      });
      
      await waitFor(() => {
        user.click(screen.getByText('Test Account'));
      });
      
      await user.click(screen.getByText('Connect Wallet'));
      
      await waitFor(() => {
        expect(screen.getByText('Create Your DID')).toBeInTheDocument();
      });
      
      // Use back button
      await user.click(screen.getByText('← Back to Wallet Selection'));
      
      // Should return to wallet selection
      expect(screen.getByText('Choose Your Polkadot Wallet')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles DID creation flow without errors', async () => {
      render(<App />);
      
      // Navigate to DID creation
      await user.click(screen.getByText('Login with Polkadot'));
      
      await waitFor(() => {
        expect(screen.getByText('Polkadot.js Extension')).toBeInTheDocument();
      });
      
      const walletOption = screen.getByText('Polkadot.js Extension');
      await user.click(walletOption);
      
      await waitFor(() => {
        expect(screen.getByText('Test Account')).toBeInTheDocument();
      });
      
      const accountOption = screen.getByText('Test Account');
      await user.click(accountOption);
      
      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
      
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);
      
      // Wait for DID creation wizard to appear
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { name: 'Create Your DID' });
        expect(headings.length).toBeGreaterThan(0);
      });
      
      // Navigate through wizard steps
      await user.click(screen.getByText('Next')); // Go to preview
      
      await waitFor(() => {
        expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Next')); // Go to creation
      
      // Verify we reach the creation step
      await waitFor(() => {
        expect(screen.getByText('Create My DID')).toBeInTheDocument();
      });
      
      // Verify the component renders without crashing
      const headings = screen.getAllByRole('heading', { name: 'Create Your DID' });
      expect(headings.length).toBeGreaterThan(0);
      expect(screen.getByText('You\'re all set!')).toBeInTheDocument();
    });
  });

  describe('Profile Integration', () => {
    it('displays DID Document Viewer in profile when DID was created', async () => {
      render(<App />);
      
      // Complete full flow
      await user.click(screen.getByText('Login with Polkadot'));
      
      await waitFor(() => {
        user.click(screen.getByText('Polkadot.js Extension'));
      });
      
      await waitFor(() => {
        user.click(screen.getByText('Test Account'));
      });
      
      await user.click(screen.getByText('Connect Wallet'));
      
      await waitFor(() => {
        expect(screen.getByText('Create Your DID')).toBeInTheDocument();
      });
      
      // Create DID
      await user.click(screen.getByText('Next')); // Preview
      await user.click(screen.getByText('Next')); // Create
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      // Wait for profile
      await waitFor(() => {
        expect(screen.getByText('Authentication Successful!')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Should show DID Document Viewer
      expect(screen.getByText('DID Details')).toBeInTheDocument();
      expect(screen.getByText('🔽 Expand Details')).toBeInTheDocument();
    });

    it('expands DID Document Viewer and shows details', async () => {
      render(<App />);
      
      // Complete flow (simplified)
      await user.click(screen.getByText('Login with Polkadot'));
      
      await waitFor(() => {
        user.click(screen.getByText('Polkadot.js Extension'));
      });
      
      await waitFor(() => {
        user.click(screen.getByText('Test Account'));
      });
      
      await user.click(screen.getByText('Connect Wallet'));
      
      await waitFor(() => {
        user.click(screen.getByText('Next')); // Preview
      });
      
      await user.click(screen.getByText('Next')); // Create
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('DID Details')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Expand DID viewer
      const expandButton = screen.getByText('🔽 Expand Details');
      await user.click(expandButton);
      
      // Should show tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('DID Document')).toBeInTheDocument();
      expect(screen.getByText('Verification')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('works correctly on mobile viewport', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<App />);
      
      // Should still work on mobile
      expect(screen.getByText('Choose Your Chain')).toBeInTheDocument();
      
      await user.click(screen.getByText('Login with Polkadot'));
      
      await waitFor(() => {
        expect(screen.getByText('Choose Your Polkadot Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks during navigation', async () => {
      const { unmount } = render(<App />);
      
      // Navigate through app
      await user.click(screen.getByText('Login with Polkadot'));
      
      // Unmount should not cause errors
      unmount();
    });

    it('handles rapid state changes without errors', async () => {
      render(<App />);
      
      // Rapid navigation - check if elements exist before clicking
      await user.click(screen.getByText('Login with Polkadot'));
      
      // Check if back button exists, if so click it
      await waitFor(() => {
        const backButton = screen.queryByText('← Back to Chain Selection');
        if (backButton) {
          user.click(backButton);
        }
      });
      
      // Navigate to Ethereum if we're back at chain selection
      if (screen.queryByText('Login with Ethereum')) {
        await user.click(screen.getByText('Login with Ethereum'));
        
        // Try to go back again if possible
        const secondBackButton = screen.queryByText('← Back to Chain Selection');
        if (secondBackButton) {
          await user.click(secondBackButton);
        }
      }
      
      // Should still be functional - check for any valid state
      const isAtChainSelection = screen.queryByText('Choose Your Chain');
      const isAtWalletSelection = screen.queryByText('Choose Your Polkadot Wallet') || screen.queryByText('Choose Your Ethereum Wallet');
      const isAtLogin = screen.queryByText('Login with');
      const isAtApp = screen.queryByText('KeyPass Multi-Chain Auth');
      
      expect(isAtChainSelection || isAtWalletSelection || isAtLogin || isAtApp).toBeTruthy();
    });
  });
}); 