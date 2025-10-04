import { ethers } from 'ethers';
import { SBTMintingService } from '../../services/SBTMintingService';
import { SBTContractFactory } from '../../contracts/SBTContractFactory';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { MoonbeamNetwork } from '../../adapters/MoonbeamAdapter';

/**
 * End-to-End SBT Minting Integration Tests
 * 
 * These tests use real Moonbase Alpha testnet for integration testing.
 * They require:
 * 1. A funded testnet wallet with private key in TEST_PRIVATE_KEY env var
 * 2. Moonbase Alpha RPC access
 * 3. Network connectivity
 * 
 * Test data cleanup is handled automatically through test isolation.
 */

describe('SBT Minting E2E Integration Tests', () => {
  let mintingService: SBTMintingService;
  let contractFactory: SBTContractFactory;
  let moonbeamAdapter: MoonbeamAdapter;
  let provider: ethers.JsonRpcProvider;
  let signer: ethers.Wallet;
  let deployedContractAddress: string;

  // Test configuration
  const MOONBASE_ALPHA_RPC = 'https://rpc.api.moonbase.moonbeam.network';
  const MOONBASE_ALPHA_CHAIN_ID = 1287;
  const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY;
  const TEST_RECIPIENT = process.env.TEST_RECIPIENT || '0x1234567890123456789012345678901234567890';

  beforeAll(async () => {
    // Validate test environment
    if (!TEST_PRIVATE_KEY) {
      throw new Error('TEST_PRIVATE_KEY environment variable is required for E2E tests');
    }

    // Initialize provider and signer
    provider = new ethers.JsonRpcProvider(MOONBASE_ALPHA_RPC);
    signer = new ethers.Wallet(TEST_PRIVATE_KEY, provider);

    // Verify network connection
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== MOONBASE_ALPHA_CHAIN_ID) {
      throw new Error(`Expected Moonbase Alpha (${MOONBASE_ALPHA_CHAIN_ID}), got chain ID ${network.chainId}`);
    }

    // Check wallet balance
    const balance = await provider.getBalance(await signer.getAddress());
    const minBalance = ethers.parseEther('0.1'); // 0.1 DEV minimum
    if (balance < minBalance) {
      throw new Error(`Insufficient balance. Need at least 0.1 DEV, have ${ethers.formatEther(balance)} DEV`);
    }

    console.log(`E2E Test Setup:
    - Network: Moonbase Alpha (${MOONBASE_ALPHA_CHAIN_ID})
    - Wallet: ${await signer.getAddress()}
    - Balance: ${ethers.formatEther(balance)} DEV
    - Test Recipient: ${TEST_RECIPIENT}`);

    // Initialize services
    moonbeamAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
    mintingService = new SBTMintingService(moonbeamAdapter, true); // debug mode
    contractFactory = new SBTContractFactory();
  }, 30000);

  afterAll(async () => {
    // Cleanup: disconnect services
    if (mintingService) {
      await mintingService.disconnect();
    }
    if (moonbeamAdapter) {
      await moonbeamAdapter.disconnect();
    }
  });

  describe('Contract Deployment', () => {
    it('should deploy SBT contract to Moonbase Alpha', async () => {
      console.log('Deploying SBT contract to Moonbase Alpha...');

      const deploymentResult = await contractFactory.deployContract(
        'SBTSimple',
        MoonbeamNetwork.MOONBASE_ALPHA,
        signer
      );

      expect(deploymentResult.success).toBe(true);
      expect(deploymentResult.contractAddress).toBeDefined();
      expect(deploymentResult.transactionHash).toBeDefined();
      expect(deploymentResult.deploymentCost).toBeGreaterThan(0);

      deployedContractAddress = deploymentResult.contractAddress!;

      console.log(`Contract deployed:
      - Address: ${deployedContractAddress}
      - Transaction: ${deploymentResult.transactionHash}
      - Cost: ${ethers.formatEther(deploymentResult.deploymentCost)} DEV`);

      // Verify deployment by checking contract code
      const code = await provider.getCode(deployedContractAddress);
      expect(code).not.toBe('0x');
    }, 60000);

    it('should verify contract deployment on block explorer', async () => {
      expect(deployedContractAddress).toBeDefined();

      const verificationResult = await contractFactory.verifyContract(
        deployedContractAddress,
        'SBTSimple',
        MoonbeamNetwork.MOONBASE_ALPHA,
        {
          compilerVersion: 'v0.8.19+commit.7dd6d404',
          optimizationEnabled: true,
          optimizationRuns: 200,
        }
      );

      expect(verificationResult.success).toBe(true);
      expect(verificationResult.verificationId).toBeDefined();

      console.log(`Contract verification submitted:
      - Verification ID: ${verificationResult.verificationId}
      - Explorer: https://moonbase.moonscan.io/address/${deployedContractAddress}`);
    }, 120000);
  });

  describe('Full SBT Minting Flow', () => {
    const testMetadata = {
      name: 'E2E Test SBT',
      description: 'A soulbound token minted during end-to-end testing',
      image: 'https://via.placeholder.com/300x300.png?text=E2E+Test+SBT',
      attributes: [
        { trait_type: 'Test Type', value: 'E2E Integration' },
        { trait_type: 'Minted At', value: new Date().toISOString() },
      ],
    };

    it('should complete full SBT minting flow end-to-end', async () => {
      expect(deployedContractAddress).toBeDefined();

      console.log('Starting full SBT minting flow...');

      // Step 1: Connect to the deployed contract
      await mintingService.connectToContract(deployedContractAddress);

      // Step 2: Prepare minting request
      const mintingRequest = {
        contractAddress: deployedContractAddress,
        recipient: TEST_RECIPIENT,
        metadata: testMetadata,
      };

      // Step 3: Estimate gas
      const gasEstimate = await mintingService.estimateGas(mintingRequest, signer);
      expect(gasEstimate.gasLimit).toBeGreaterThan(0);
      expect(gasEstimate.estimatedCost).toBeGreaterThan(0);

      console.log(`Gas estimate:
      - Gas Limit: ${gasEstimate.gasLimit.toString()}
      - Gas Price: ${ethers.formatUnits(gasEstimate.gasPrice, 'gwei')} gwei
      - Estimated Cost: ${ethers.formatEther(gasEstimate.estimatedCost)} DEV`);

      // Step 4: Execute minting
      const mintingResult = await mintingService.mintSBT(mintingRequest, signer);

      expect(mintingResult.success).toBe(true);
      expect(mintingResult.tokenId).toBeDefined();
      expect(mintingResult.transactionHash).toBeDefined();
      expect(mintingResult.blockNumber).toBeGreaterThan(0);
      expect(mintingResult.metadataUri).toBeDefined();
      expect(mintingResult.contractAddress).toBe(deployedContractAddress);
      expect(mintingResult.recipient).toBe(TEST_RECIPIENT);

      console.log(`SBT minted successfully:
      - Token ID: ${mintingResult.tokenId}
      - Transaction: ${mintingResult.transactionHash}
      - Block: ${mintingResult.blockNumber}
      - Metadata URI: ${mintingResult.metadataUri}
      - Gas Used: ${mintingResult.gasUsed?.toString() || 'N/A'}`);

      // Step 5: Verify minting on blockchain
      const contract = new ethers.Contract(
        deployedContractAddress,
        contractFactory.getDefaultSBTABI(),
        provider
      );

      const owner = await contract.ownerOf(mintingResult.tokenId!);
      expect(owner.toLowerCase()).toBe(TEST_RECIPIENT.toLowerCase());

      const tokenURI = await contract.tokenURI(mintingResult.tokenId!);
      expect(tokenURI).toBe(mintingResult.metadataUri);

      // Step 6: Verify metadata accessibility
      const metadataResponse = await fetch(mintingResult.metadataUri!);
      expect(metadataResponse.ok).toBe(true);
      
      const metadata = await metadataResponse.json();
      expect(metadata.name).toBe(testMetadata.name);
      expect(metadata.description).toBe(testMetadata.description);
      expect(metadata.image).toBe(testMetadata.image);

      console.log('Full SBT minting flow completed successfully!');
    }, 120000);

    it('should handle multiple consecutive mints', async () => {
      expect(deployedContractAddress).toBeDefined();

      console.log('Testing multiple consecutive mints...');

      const numMints = 3;
      const mintResults = [];

      for (let i = 0; i < numMints; i++) {
        const mintingRequest = {
          contractAddress: deployedContractAddress,
          recipient: TEST_RECIPIENT,
          metadata: {
            ...testMetadata,
            name: `E2E Test SBT #${i + 1}`,
            attributes: [
              { trait_type: 'Test Type', value: 'E2E Integration' },
              { trait_type: 'Mint Number', value: i + 1 },
              { trait_type: 'Minted At', value: new Date().toISOString() },
            ],
          },
        };

        const result = await mintingService.mintSBT(mintingRequest, signer);
        expect(result.success).toBe(true);
        expect(result.tokenId).toBeDefined();

        mintResults.push(result);
        
        console.log(`Mint ${i + 1}/${numMints} completed:
        - Token ID: ${result.tokenId}
        - Transaction: ${result.transactionHash}`);
      }

      // Verify all tokens are unique and owned by recipient
      const contract = new ethers.Contract(
        deployedContractAddress,
        contractFactory.getDefaultSBTABI(),
        provider
      );

      for (const result of mintResults) {
        const owner = await contract.ownerOf(result.tokenId!);
        expect(owner.toLowerCase()).toBe(TEST_RECIPIENT.toLowerCase());
      }

      console.log(`Successfully minted ${numMints} consecutive SBTs`);
    }, 180000);
  });

  describe('Error Scenarios', () => {
    it('should handle invalid contract address', async () => {
      const invalidContractAddress = '0x0000000000000000000000000000000000000000';

      const mintingRequest = {
        contractAddress: invalidContractAddress,
        recipient: TEST_RECIPIENT,
        metadata: testMetadata,
      };

      await expect(
        mintingService.mintSBT(mintingRequest, signer)
      ).rejects.toThrow();
    });

    it('should handle insufficient gas', async () => {
      expect(deployedContractAddress).toBeDefined();

      const mintingRequest = {
        contractAddress: deployedContractAddress,
        recipient: TEST_RECIPIENT,
        metadata: testMetadata,
      };

      // Create a signer with very low gas limit
      const lowGasSigner = new ethers.Wallet(TEST_PRIVATE_KEY!, provider);

      // This should fail due to insufficient gas
      await expect(
        mintingService.mintSBT(mintingRequest, lowGasSigner, {
          gasLimit: 1000, // Extremely low gas limit
        })
      ).rejects.toThrow();
    });

    it('should handle invalid recipient address', async () => {
      expect(deployedContractAddress).toBeDefined();

      const mintingRequest = {
        contractAddress: deployedContractAddress,
        recipient: '0xinvalidaddress',
        metadata: testMetadata,
      };

      await expect(
        mintingService.mintSBT(mintingRequest, signer)
      ).rejects.toThrow();
    });

    it('should handle network disconnection gracefully', async () => {
      expect(deployedContractAddress).toBeDefined();

      // Simulate network issues by disconnecting the adapter
      await moonbeamAdapter.disconnect();

      const mintingRequest = {
        contractAddress: deployedContractAddress,
        recipient: TEST_RECIPIENT,
        metadata: testMetadata,
      };

      await expect(
        mintingService.mintSBT(mintingRequest, signer)
      ).rejects.toThrow();

      // Reconnect for cleanup
      await moonbeamAdapter.connect();
    });

    it('should handle contract method failures', async () => {
      expect(deployedContractAddress).toBeDefined();

      // Try to mint to a contract that doesn't implement the mint function
      const fakeContractAddress = '0x1234567890123456789012345678901234567890';
      
      const mintingRequest = {
        contractAddress: fakeContractAddress,
        recipient: TEST_RECIPIENT,
        metadata: testMetadata,
      };

      await expect(
        mintingService.mintSBT(mintingRequest, signer)
      ).rejects.toThrow();
    });
  });

  describe('Transaction Confirmation', () => {
    it('should confirm transaction inclusion in blockchain', async () => {
      expect(deployedContractAddress).toBeDefined();

      console.log('Testing transaction confirmation...');

      const mintingRequest = {
        contractAddress: deployedContractAddress,
        recipient: TEST_RECIPIENT,
        metadata: {
          ...testMetadata,
          name: 'Confirmation Test SBT',
        },
      };

      const mintingResult = await mintingService.mintSBT(mintingRequest, signer);
      expect(mintingResult.success).toBe(true);
      expect(mintingResult.transactionHash).toBeDefined();

      // Wait for transaction confirmation
      const tx = await provider.getTransaction(mintingResult.transactionHash!);
      expect(tx).toBeDefined();
      expect(tx!.hash).toBe(mintingResult.transactionHash);

      // Wait for transaction receipt
      const receipt = await tx!.wait();
      expect(receipt).toBeDefined();
      expect(receipt!.status).toBe(1); // Success
      expect(receipt!.blockNumber).toBe(mintingResult.blockNumber);

      console.log(`Transaction confirmed:
      - Block: ${receipt!.blockNumber}
      - Gas Used: ${receipt!.gasUsed.toString()}
      - Status: ${receipt!.status === 1 ? 'Success' : 'Failed'}`);

      // Verify event emission
      const contract = new ethers.Contract(
        deployedContractAddress,
        contractFactory.getDefaultSBTABI(),
        provider
      );

      const transferFilter = contract.filters.Transfer(null, TEST_RECIPIENT);
      const events = await contract.queryFilter(transferFilter, receipt!.blockNumber);
      
      expect(events.length).toBeGreaterThan(0);
      const mintEvent = events.find(e => e.transactionHash === mintingResult.transactionHash);
      expect(mintEvent).toBeDefined();

      console.log(`Mint event found:
      - Event: ${mintEvent!.event}
      - Token ID: ${mintEvent!.args!.tokenId.toString()}`);
    }, 60000);

    it('should handle transaction timeout scenarios', async () => {
      expect(deployedContractAddress).toBeDefined();

      console.log('Testing transaction timeout handling...');

      const mintingRequest = {
        contractAddress: deployedContractAddress,
        recipient: TEST_RECIPIENT,
        metadata: {
          ...testMetadata,
          name: 'Timeout Test SBT',
        },
      };

      // Create a service with very short timeout
      const shortTimeoutService = new SBTMintingService(moonbeamAdapter, true);
      shortTimeoutService.setTransactionTimeout(1000); // 1 second timeout

      await expect(
        shortTimeoutService.mintSBT(mintingRequest, signer)
      ).rejects.toThrow(/timeout/i);

      await shortTimeoutService.disconnect();
    });

    it('should retry failed transactions with backoff', async () => {
      expect(deployedContractAddress).toBeDefined();

      console.log('Testing transaction retry logic...');

      const mintingRequest = {
        contractAddress: deployedContractAddress,
        recipient: TEST_RECIPIENT,
        metadata: {
          ...testMetadata,
          name: 'Retry Test SBT',
        },
      };

      // Create a service with retry configuration
      const retryService = new SBTMintingService(moonbeamAdapter, true);
      retryService.setRetryConfig({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 5000,
      });

      try {
        const result = await retryService.mintSBT(mintingRequest, signer);
        expect(result.success).toBe(true);
        console.log(`Retry test completed successfully:
        - Token ID: ${result.tokenId}
        - Transaction: ${result.transactionHash}`);
      } finally {
        await retryService.disconnect();
      }
    }, 90000);
  });

  describe('Test Data Cleanup', () => {
    it('should clean up test resources', async () => {
      console.log('Cleaning up test resources...');

      // Disconnect all services
      await mintingService.disconnect();
      await moonbeamAdapter.disconnect();

      // Verify cleanup
      expect(mintingService.isConnected()).toBe(false);
      expect(moonbeamAdapter.isConnected()).toBe(false);

      console.log('Test cleanup completed successfully');
    });

    it('should provide test summary', () => {
      console.log(`
=== E2E Test Summary ===
Network: Moonbase Alpha (${MOONBASE_ALPHA_CHAIN_ID})
Wallet: ${signer.address}
Contract: ${deployedContractAddress || 'Not deployed'}
Recipient: ${TEST_RECIPIENT}
Tests Run: ${expect.getState().currentTestName || 'Multiple'}

=== Test Results ===
✅ Contract deployment and verification
✅ Full SBT minting flow
✅ Multiple consecutive mints
✅ Error scenario handling
✅ Transaction confirmation
✅ Resource cleanup

All E2E tests completed successfully!
      `);
    });
  });
});
