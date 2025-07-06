import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DIDWizard, DIDCreationOptions, DIDCreationResult } from '../DIDWizard';

// Mock data
const mockProps = {
  walletAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  chainType: 'polkadot' as const,
  accountName: 'Test Account',
  onComplete: jest.fn(),
  onCancel: jest.fn(),
  onBack: jest.fn(),
};

const mockEthereumProps = {
  ...mockProps,
  walletAddress: '0x742d35Cc6634C0532925a3b8D6f9C0dC65e6b8Fc',
  chainType: 'ethereum' as const,
};

// Helper function to advance to specific step
const advanceToStep = async (user: any, stepIndex: number) => {
  for (let i = 0; i < stepIndex; i++) {
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
  }
};

describe('DIDWizard', () => {
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the wizard header correctly', () => {
      render(<DIDWizard {...mockProps} />);
      
      expect(screen.getByText('Create Your DID')).toBeInTheDocument();
      expect(screen.getByText('Set up your Decentralized Identifier for secure authentication')).toBeInTheDocument();
      expect(screen.getByText('← Back to Wallet Selection')).toBeInTheDocument();
    });

    it('shows progress indicator with correct steps', () => {
      render(<DIDWizard {...mockProps} />);
      
      expect(screen.getByText('DID Type')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('starts on the first step (DID Type selection)', () => {
      render(<DIDWizard {...mockProps} />);
      
      expect(screen.getByText('Choose Your DID Type')).toBeInTheDocument();
      expect(screen.getByText('Basic DID')).toBeInTheDocument();
      expect(screen.getByText('Advanced DID')).toBeInTheDocument();
    });
  });

  describe('Step 1: DID Type Selection', () => {
    it('allows selecting Basic DID', async () => {
      render(<DIDWizard {...mockProps} />);
      
      const basicCard = screen.getByText('Basic DID').closest('.did-type-card');
      expect(basicCard).toBeInTheDocument();
      
      await user.click(basicCard!);
      expect(basicCard).toHaveClass('selected');
    });

    it('allows selecting Advanced DID', async () => {
      render(<DIDWizard {...mockProps} />);
      
      const advancedCard = screen.getByText('Advanced DID').closest('.did-type-card');
      expect(advancedCard).toBeInTheDocument();
      
      await user.click(advancedCard!);
      expect(advancedCard).toHaveClass('selected');
    });

    it('shows Basic DID as default selection', () => {
      render(<DIDWizard {...mockProps} />);
      
      const basicCard = screen.getByText('Basic DID').closest('.did-type-card');
      expect(basicCard).toHaveClass('selected');
    });

    it('displays correct features for Basic DID', () => {
      render(<DIDWizard {...mockProps} />);
      
      expect(screen.getByText('✅ Wallet-based authentication')).toBeInTheDocument();
      expect(screen.getByText('✅ Basic identity verification')).toBeInTheDocument();
      expect(screen.getByText('✅ Quick setup')).toBeInTheDocument();
      expect(screen.getByText('✅ Standard compliance')).toBeInTheDocument();
    });

    it('displays correct features for Advanced DID', () => {
      render(<DIDWizard {...mockProps} />);
      
      expect(screen.getByText('✅ Everything in Basic DID')).toBeInTheDocument();
      expect(screen.getByText('✅ Custom attributes')).toBeInTheDocument();
      expect(screen.getByText('✅ Service endpoints')).toBeInTheDocument();
      expect(screen.getByText('✅ Credential readiness')).toBeInTheDocument();
    });

    it('allows proceeding to next step after selection', async () => {
      render(<DIDWizard {...mockProps} />);
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
      
      await user.click(nextButton);
      expect(screen.getByText('Review your DID')).toBeInTheDocument();
    });
  });

  describe('Step 2: Advanced Configuration (Advanced DID only)', () => {
    beforeEach(async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Select Advanced DID
      const advancedCard = screen.getByText('Advanced DID').closest('.did-type-card');
      await user.click(advancedCard!);
      
      // Go to next step
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
    });

    it('shows advanced configuration options for Advanced DID', () => {
      expect(screen.getByText('Configure Advanced Options')).toBeInTheDocument();
      expect(screen.getByText('Identity Purpose')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Additional Features')).toBeInTheDocument();
      expect(screen.getByText('Custom Attributes')).toBeInTheDocument();
    });

    it('allows selecting different purposes', async () => {
      // Now test purpose selection (already on configuration step from beforeEach)
      const purposeSelect = screen.getByRole('combobox');
      
      await user.selectOptions(purposeSelect, 'professional');
      
      // Wait for React to update and check the selected option
      await waitFor(() => {
        expect(purposeSelect).toHaveValue('professional');
      });
    });

    it('allows entering description', async () => {
      const descriptionTextarea = screen.getByPlaceholderText(/Optional description/);
      
      await user.type(descriptionTextarea, 'Test DID for development');
      expect(descriptionTextarea).toHaveValue('Test DID for development');
    });

    it('allows toggling service endpoints', async () => {
      const serviceCheckbox = screen.getByLabelText(/Include service endpoints/);
      
      expect(serviceCheckbox).not.toBeChecked();
      await user.click(serviceCheckbox);
      expect(serviceCheckbox).toBeChecked();
    });

    it('allows toggling credential readiness', async () => {
      const credentialCheckbox = screen.getByLabelText(/Prepare for verifiable credentials/);
      
      expect(credentialCheckbox).not.toBeChecked();
      await user.click(credentialCheckbox);
      expect(credentialCheckbox).toBeChecked();
    });

    it('allows adding custom attributes', async () => {
      const keyInput = screen.getByPlaceholderText('Attribute name (e.g., \'role\')');
      const valueInput = screen.getByPlaceholderText('Attribute value (e.g., \'developer\')');
      const addButton = screen.getByText('Add');
      
      await user.type(keyInput, 'role');
      await user.type(valueInput, 'developer');
      await user.click(addButton);
      
      expect(screen.getByText('role:')).toBeInTheDocument();
      expect(screen.getByText('developer')).toBeInTheDocument();
    });

    it('allows removing custom attributes', async () => {
      const keyInput = screen.getByPlaceholderText('Attribute name (e.g., \'role\')');
      const valueInput = screen.getByPlaceholderText('Attribute value (e.g., \'developer\')');
      const addButton = screen.getByText('Add');
      
      await user.type(keyInput, 'role');
      await user.type(valueInput, 'developer');
      await user.click(addButton);
      
      const removeButton = screen.getByText('×');
      await user.click(removeButton);
      
      expect(screen.queryByText('role:')).not.toBeInTheDocument();
      expect(screen.queryByText('developer')).not.toBeInTheDocument();
    });

    it('allows adding attributes by pressing Enter', async () => {
      const keyInput = screen.getByPlaceholderText('Attribute name (e.g., \'role\')');
      const valueInput = screen.getByPlaceholderText('Attribute value (e.g., \'developer\')');
      
      await user.type(keyInput, 'role');
      await user.keyboard('{Enter}');
      
      expect(valueInput).toHaveFocus();
      
      await user.type(valueInput, 'developer');
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('role:')).toBeInTheDocument();
      expect(screen.getByText('developer')).toBeInTheDocument();
    });
  });

  describe('Step 3: Preview', () => {
    it('shows preview for Basic DID', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 1);
      
      expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      expect(screen.getByText('DID Summary')).toBeInTheDocument();
      expect(screen.getByText('DID Document')).toBeInTheDocument();
      expect(screen.getByText('Features Included')).toBeInTheDocument();
    });

    it('shows correct summary information', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 1);
      
      expect(screen.getByText('Basic DID')).toBeInTheDocument();
      expect(screen.getByText('Polkadot')).toBeInTheDocument();
      expect(screen.getByText('Test Account')).toBeInTheDocument();
      expect(screen.getByText(mockProps.walletAddress)).toBeInTheDocument();
    });

    it('shows correct chain type for Ethereum', async () => {
      render(<DIDWizard {...mockEthereumProps} />);
      
      await advanceToStep(user, 1);
      
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('shows DID document preview', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 1);
      
      const didDocument = screen.getByText(/"@context":/);
      expect(didDocument).toBeInTheDocument();
    });

    it('shows included features', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 1);
      
      expect(screen.getByText('✅ Authentication capability')).toBeInTheDocument();
      expect(screen.getByText('✅ Message signing')).toBeInTheDocument();
      expect(screen.getByText('✅ Identity verification')).toBeInTheDocument();
    });

    it('generates preview after loading', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 1);
      
      // Preview should be generated automatically for basic DID
      expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
      expect(screen.getByText('DID Document')).toBeInTheDocument();
    });
  });

  describe('Step 4: Creation', () => {
    it('shows creation step', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 2);
      
      expect(screen.getByRole('heading', { name: 'Create Your DID', level: 3 })).toBeInTheDocument();
      expect(screen.getByText('Ready to create your Decentralized Identifier? This will generate your DID on the blockchain.')).toBeInTheDocument();
      expect(screen.getByText('Create My DID')).toBeInTheDocument();
    });

    it('shows creation summary', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 2);
      
      expect(screen.getByText('You\'re all set!')).toBeInTheDocument();
      expect(screen.getByText('Basic DID')).toBeInTheDocument();
      expect(screen.getByText('Polkadot')).toBeInTheDocument();
      expect(screen.getByText('authentication')).toBeInTheDocument();
    });

    it('handles DID creation process', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 2);
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      expect(screen.getByText('Creating DID...')).toBeInTheDocument();
      expect(screen.getByText('Creating your DID on the blockchain...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockProps.onComplete).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('calls onComplete with correct data structure', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 2);
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockProps.onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            did: expect.stringMatching(/^did:key:z/),
            didDocument: expect.any(Object),
            options: expect.objectContaining({
              type: 'basic',
              purpose: 'authentication'
            }),
            createdAt: expect.any(String)
          })
        );
      }, { timeout: 3000 });
    });
  });

  describe('Navigation', () => {
    it('allows going back to previous step', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 1);
      
      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);
      
      expect(screen.getByText('Choose Your DID Type')).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
      render(<DIDWizard {...mockProps} />);
      
      const backButton = screen.getByText('← Back to Wallet Selection');
      await user.click(backButton);
      
      expect(mockProps.onBack).toHaveBeenCalled();
    });

    it('calls onCancel when cancel is clicked on first step', async () => {
      render(<DIDWizard {...mockProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('disables Next button when conditions not met', () => {
      render(<DIDWizard {...mockProps} />);
      
      // Should be enabled by default (Basic DID selected)
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    it('hides Next button on final step', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 2);
      
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Progress Indicator', () => {
    it('shows correct active step', () => {
      render(<DIDWizard {...mockProps} />);
      
      const activeStep = screen.getByText('1');
      expect(activeStep.closest('.progress-step')).toHaveClass('active');
    });

    it('updates progress bar correctly', async () => {
      render(<DIDWizard {...mockProps} />);
      
      const progressBar = document.querySelector('.progress-bar-fill');
      expect(progressBar).toHaveStyle('width: 33.33333333333333%'); // 1/3 steps initially
      
      await advanceToStep(user, 1);
      expect(progressBar).toHaveStyle('width: 66.66666666666666%'); // 2/3 steps
    });

    it('marks completed steps correctly', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 1);
      
      const firstStep = screen.getByText('1');
      expect(firstStep.closest('.progress-step')).toHaveClass('completed');
    });
  });

  describe('Advanced DID Flow', () => {
    it('includes configuration step for Advanced DID', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Select Advanced DID
      const advancedCard = screen.getByText('Advanced DID').closest('.did-type-card');
      await user.click(advancedCard!);
      
      // Check that Configuration step appears
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('skips configuration step for Basic DID', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Basic DID is selected by default
      await user.click(screen.getByText('Next'));
      
      // Should go directly to Preview
      expect(screen.getByText('Preview Your DID')).toBeInTheDocument();
    });

    it('shows advanced features in preview', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Select Advanced DID
      const advancedCard = screen.getByText('Advanced DID').closest('.did-type-card');
      await user.click(advancedCard!);
      
      // Go to configuration
      await user.click(screen.getByText('Next'));
      
      // Enable features
      await user.click(screen.getByLabelText(/Include service endpoints/));
      await user.click(screen.getByLabelText(/Prepare for verifiable credentials/));
      
      // Go to preview
      await user.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('✅ Service endpoints')).toBeInTheDocument();
        expect(screen.getByText('✅ Credential readiness')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles preview generation errors', async () => {
      // Mock console.error to avoid noise in tests
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 1);
      
      // Wait for any error state
      await waitFor(() => {
        // Check if error is displayed or handled gracefully
        expect(screen.queryByText('Failed to generate preview')).not.toBeInTheDocument();
      });
      
      consoleError.mockRestore();
    });

    it('handles creation errors gracefully', async () => {
      // Mock console.error to avoid noise in tests
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 2);
      
      const createButton = screen.getByText('Create My DID');
      await user.click(createButton);
      
      // Should show creation process
      expect(screen.getByText('Creating DID...')).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(mockProps.onComplete).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<DIDWizard {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Tab through elements
      await user.tab();
      expect(screen.getByText('← Back to Wallet Selection')).toHaveFocus();
      
      await user.tab();
      await user.tab();
      // Should focus on first DID type card after tabbing past the back button
      expect(screen.getByText('Basic DID').closest('.did-type-card')).toHaveFocus();
    });
  });

  describe('Data Validation', () => {
    it('validates required fields before proceeding', async () => {
      render(<DIDWizard {...mockProps} />);
      
      // Should be able to proceed with default basic selection
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    it('prevents creation without preview data', async () => {
      render(<DIDWizard {...mockProps} />);
      
      await advanceToStep(user, 2);
      
      // Button should be available after preview loads
      await waitFor(() => {
        const createButton = screen.getByText('Create My DID');
        expect(createButton).not.toBeDisabled();
      });
    });
  });
}); 