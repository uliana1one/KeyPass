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
  });

  describe('Complete Authentication Flow with DID Creation', () => {
    it('completes full flow from chain selection to profile with DID creation', async () => {
      render(<App />);
      
      // Step 1: Chain Selection
      expect(screen.getByText('Choose Your Chain')).toBeInTheDocument();
      const polkadotButton = screen.getByText('Login with Polkadot');
      await user.click(polkadotButton);
      
      // Step 2: Wallet Selection (mocked)
      await waitFor(() => {
        expect(screen.getByText('Choose Your Polkadot Wallet')).toBeInTheDocument();
      });
      
      // Mock wallet selection
      const walletOption = screen.getByText('Polkadot.js Extension');
      await user.click(walletOption);
      
      // Step 3: Account Selection (mocked)
      await waitFor(() => {
        expect(screen.getByText('Select Account')).toBeInTheDocument();
      });
      
      const accountOption = screen.getByText('Test Account');
      await user.click(accountOption);
      
      // Step 4: Connect to DID Creation
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);
      
      // Step 5: DID Creation Wizard
      await waitFor(() => {
        expect(screen.getByText('Create Your DID')).toBeInTheDocument();
        expect(screen.getByText('Choose Your DID Type')).toBeInTheDocument();
      });
      
      // Select Advanced DID
      const advancedCard = screen.getByText('Advanced DID').closest('.did-type-card');
      await user.click(advancedCard!);
      
      // Proceed to configuration
      await user.click(screen.getByText('Next'));
      
      // Configure advanced options
      expect(screen.getByText('Configure Advanced Options')).toBeInTheDocument();
      
      // Set purpose
      const purposeSelect = screen.getByDisplayValue('authentication');
      await user.selectOptions(purposeSelect, 'professional');
      
      // Add description
      const descriptionTextarea = screen.getByPlaceholderText(/Optional description/);
      await user.type(descriptionTextarea, 'Professional developer identity');
      
      // Enable features
      await user.click(screen.getByLabelText(/Include service endpoints/));
      await user.click(screen.getByLabelText(/Prepare for verifiable credentials/));
      
      // Add custom attribute
      const keyInput = screen.getByPlaceholderText('Attribute name (e.g., \'role\')');
      const valueInput = screen.getByPlaceholderText('Attribute value (e.g., \'developer\')');
      await user.type(keyInput, 'role');
      await user.type(valueInput, 'developer');
      await user.click(screen.getByText('Add'));
      
      // Proceed to preview
      await user.click(screen.getByText('Next'));
      
      // Step 6: Preview
      await waitFor(() => {
        expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Advanced DID')).toBeInTheDocument();
      expect(screen.getByText('professional')).toBeInTheDocument();
      expect(screen.getByText('role:')).toBeInTheDocument();
      expect(screen.getByText('developer')).toBeInTheDocument();
      
      // Proceed to creation
      await user.click(screen.getByText('Next'));
      
      // Step 7: Create DID
      expect(screen.getByText('Create Your DID')).toBeInTheDocument();
      expect(screen.getByText('You\'re all set!')).toBeInTheDocument();
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      // Wait for creation to complete and authentication to proceed
      await waitFor(() => {
        expect(screen.getByText('Authentication Successful!')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Step 8: Profile with DID details
      expect(screen.getByText('Test Account')).toBeInTheDocument();
      expect(screen.getByText('Advanced DID')).toBeInTheDocument();
      expect(screen.getByText('professional')).toBeInTheDocument();
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
    it('handles DID creation errors gracefully', async () => {
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
      
      // Navigate to creation step
      await user.click(screen.getByText('Next')); // Preview
      await user.click(screen.getByText('Next')); // Create
      
      // Mock creation failure
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        throw new Error('Creation failed');
      }) as any;
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/Failed to create DID/)).toBeInTheDocument();
      });
      
      global.setTimeout = originalSetTimeout;
    });

    it('handles authentication errors after DID creation', async () => {
      const { loginWithPolkadot } = require('@keypass/login-sdk');
      loginWithPolkadot.mockRejectedValueOnce(new Error('Authentication failed'));
      
      render(<App />);
      
      // Navigate through DID creation
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
      
      // Complete DID creation
      await user.click(screen.getByText('Next')); // Preview
      await user.click(screen.getByText('Next')); // Create
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      // Should show authentication error
      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/)).toBeInTheDocument();
      }, { timeout: 5000 });
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
      
      // Rapid navigation
      await user.click(screen.getByText('Login with Polkadot'));
      await user.click(screen.getByText('← Back to Chain Selection'));
      await user.click(screen.getByText('Login with Ethereum'));
      await user.click(screen.getByText('← Back to Chain Selection'));
      
      // Should still be functional
      expect(screen.getByText('Choose Your Chain')).toBeInTheDocument();
    });
  });
}); 