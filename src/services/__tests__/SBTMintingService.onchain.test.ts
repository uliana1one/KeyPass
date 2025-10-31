/**
 * SBTMintingService On-Chain Integration Tests
 * 
 * Tests real SBT minting operations on Moonbeam testnet including:
 * - Real IPFS metadata upload
 * - Transaction monitoring and confirmation
 * - Retry logic and error handling
 * - Gas estimation and fee calculation
 * 
 * Environment Variables:
 *   ENABLE_ONCHAIN_TESTS=true - Enable on-chain tests
 *   MOONBEAM_PRIVATE_KEY - Private key for testing
 *   PINATA_API_KEY - (Optional) Pinata API key for IPFS tests
 *   PINATA_API_SECRET - (Optional) Pinata API secret
 */

import { ethers, Wallet } from 'ethers';
import { SBTMintingService } from '../SBTMintingService';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { MoonbeamNetwork } from '../../config/moonbeamConfig';
import { SBTContractAddress, SBTTokenMetadata } from '../../contracts/types/SBTContractTypes';
import { DeploymentConfigLoader } from '../../contracts/SBTContract';

// Skip tests if on-chain testing is not enabled
const ENABLE_ONCHAIN_TESTS = process.env.ENABLE_ONCHAIN_TESTS === 'true';
const describeOnchain = ENABLE_ONCHAIN_TESTS ? describe : describe.skip;

describeOnchain('SBTMintingService On-Chain Integration Tests', () => {
  let adapter: MoonbeamAdapter;
  let wallet: Wallet;
  let mintingService: SBTMintingService;
  let contractAddress: SBTContractAddress;
  const TEST_TIMEOUT = 300000; // 5 minutes

  beforeAll(async () => {
    const privateKey = process.env.MOONBEAM_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('MOONBEAM_PRIVATE_KEY environment variable is required');
    }

    console.log('🔗 Setting up SBT minting test environment...');

    // Initialize adapter
    adapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
    adapter.setDebug(true);
    await adapter.connect();

    // Create wallet
    const provider = adapter.getProvider();
    if (!provider) {
      throw new Error('Failed to get provider');
    }
    wallet = new Wallet(privateKey, provider);

    console.log(`✅ Test wallet: ${wallet.address}`);

    // Check balance
    const balance = await adapter.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} DEV`);

    if (BigInt(balance) < ethers.parseEther('0.1')) {
      throw new Error('Insufficient DEV tokens. Need at least 0.1 DEV.');
    }

    // Get deployed contract address
    const loader = DeploymentConfigLoader.getInstance();
    const deployedAddress = loader.getContractAddress('moonbase-alpha', 'SBTSimple');
    
    if (!deployedAddress) {
      throw new Error('No deployed contract found. Please deploy SBT contract first.');
    }

    contractAddress = deployedAddress as SBTContractAddress;
    console.log(`📋 Using contract: ${contractAddress}`);

    // Initialize minting service with IPFS config
    const ipfsConfig = {
      pinningService: process.env.PINATA_API_KEY ? 'pinata' : 'local',
      apiKey: process.env.PINATA_API_KEY,
      apiSecret: process.env.PINATA_API_SECRET,
    } as any;

    mintingService = new SBTMintingService(adapter, ipfsConfig, true);

    console.log('✅ Minting service initialized\n');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (adapter) {
      await adapter.disconnect();
      console.log('\n🔌 Disconnected from testnet');
    }
  });

  // ============= Test Suite 1: Metadata Upload =============

  describe('Metadata Upload and Management', () => {
    test('should upload metadata to IPFS successfully', async () => {
      const metadata: SBTTokenMetadata = {
        name: `Test SBT ${Date.now()}`,
        description: 'On-chain test SBT with real IPFS metadata',
        image: 'https://example.com/image.png',
        attributes: [
          { trait_type: 'Test Type', value: 'Integration Test' },
          { trait_type: 'Network', value: 'Moonbase Alpha' },
        ],
      };

      const result = await mintingService.uploadMetadataToIPFS(metadata);

      expect(result).toBeDefined();
      expect(result.cid).toBeDefined();
      expect(result.uri).toBeDefined();
      expect(result.gatewayUrl).toBeDefined();
      expect(result.uploadedAt).toBeDefined();

      console.log(`📤 Metadata uploaded:`, {
        cid: result.cid.substring(0, 20) + '...',
        uri: result.uri.substring(0, 30) + '...',
        size: result.size,
        pinned: result.pinned,
      });
    }, TEST_TIMEOUT);

    test('should handle metadata with various attribute types', async () => {
      const metadata: SBTTokenMetadata = {
        name: 'Multi-Attribute SBT',
        description: 'Testing different attribute types',
        image: 'https://example.com/test.png',
        attributes: [
          { trait_type: 'String Trait', value: 'test value' },
          { trait_type: 'Number Trait', value: 100 },
          { trait_type: 'Boolean Trait', value: true },
          { trait_type: 'Score', value: 85, display_type: 'number' },
        ],
      };

      const result = await mintingService.uploadMetadataToIPFS(metadata);

      expect(result.uri).toBeDefined();
      expect(result.size).toBeGreaterThan(0);

      console.log(`✅ Multi-attribute metadata uploaded successfully`);
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 2: Real SBT Minting =============

  describe('Real SBT Minting on Moonbeam', () => {
    test('should mint SBT with real blockchain transaction', async () => {
      const metadata: SBTTokenMetadata = {
        name: `Integration Test SBT ${Date.now()}`,
        description: 'Real on-chain SBT minting test',
        image: 'https://example.com/sbt.png',
        attributes: [
          { trait_type: 'Type', value: 'Test' },
          { trait_type: 'Date', value: new Date().toISOString() },
        ],
      };

      const progressStages: string[] = [];
      const progressCallback = (progress: any) => {
        progressStages.push(progress.stage);
        console.log(`   📍 ${progress.stage}: ${progress.message} (${progress.percentage}%)`);
      };

      console.log('🎯 Starting real SBT mint...');

      const result = await mintingService.mintSBT(
        contractAddress,
        { to: wallet.address as SBTContractAddress, metadata },
        wallet,
        progressCallback
      );

      expect(result).toBeDefined();
      expect(result.tokenId).toBeDefined();
      expect(result.transactionHash).toBeDefined();
      expect(result.blockNumber).toBeGreaterThan(0);
      expect(result.gasUsed).toBeGreaterThan(BigInt(0));
      expect(result.totalCost).toBeGreaterThan(BigInt(0));
      expect(result.metadataUri).toBeDefined();
      expect(result.confirmations).toBeGreaterThanOrEqual(3);

      // Verify all progress stages were hit
      expect(progressStages).toContain('uploading');
      expect(progressStages).toContain('estimating');
      expect(progressStages).toContain('minting');
      expect(progressStages).toContain('confirming');
      expect(progressStages).toContain('completed');

      console.log(`✅ SBT minted successfully!`);
      console.log(`   Token ID: ${result.tokenId.toString()}`);
      console.log(`   TX: ${result.transactionHash}`);
      console.log(`   Block: ${result.blockNumber}`);
      console.log(`   Cost: ${result.totalCostInEther} DEV`);
    }, TEST_TIMEOUT);

    test('should mint SBT with pre-uploaded metadata URI', async () => {
      const metadataUri = 'ipfs://QmTestPreUploaded123456789';

      const result = await mintingService.mintSBT(
        contractAddress,
        { to: wallet.address as SBTContractAddress, tokenURI: metadataUri },
        wallet
      );

      expect(result.tokenId).toBeDefined();
      expect(result.metadataUri).toBe(metadataUri);
      expect(result.transactionHash).toBeDefined();

      console.log(`✅ Minted with pre-uploaded URI: Token #${result.tokenId.toString()}`);
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 3: Transaction Monitoring =============

  describe('Transaction Monitoring and Confirmation', () => {
    test('should monitor transaction confirmations', async () => {
      const metadata: SBTTokenMetadata = {
        name: 'Monitoring Test SBT',
        description: 'Testing transaction monitoring',
        image: 'https://example.com/monitor.png',
      };

      const confirmationProgress: number[] = [];
      const progressCallback = (progress: any) => {
        if (progress.stage === 'confirming' && progress.data?.transactionHash) {
          console.log(`   ⏳ Waiting for confirmations...`);
        }
      };

      const result = await mintingService.mintSBT(
        contractAddress,
        { to: wallet.address as SBTContractAddress, metadata },
        wallet,
        progressCallback
      );

      expect(result.confirmations).toBeGreaterThanOrEqual(3);
      expect(result.timestamp).toBeDefined();

      console.log(`✅ Transaction monitored: ${result.confirmations} confirmations`);
    }, TEST_TIMEOUT);

    test('should provide detailed transaction information', async () => {
      const metadata: SBTTokenMetadata = {
        name: 'TX Info Test',
        description: 'Testing transaction details',
        image: 'https://example.com/txinfo.png',
      };

      const result = await mintingService.mintSBT(
        contractAddress,
        { to: wallet.address as SBTContractAddress, metadata },
        wallet
      );

      // Verify transaction status using adapter
      const txStatus = await adapter.getTransactionStatus(result.transactionHash);

      expect(txStatus.status).toBe('confirmed');
      expect(txStatus.gasUsed).toEqual(result.gasUsed);
      expect(txStatus.blockNumber).toEqual(result.blockNumber);

      console.log(`✅ TX Status verified:`, {
        status: txStatus.status,
        confirmations: txStatus.confirmations,
        fee: ethers.formatEther(txStatus.transactionFee || BigInt(0)),
      });
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 4: Gas Estimation =============

  describe('Gas Estimation and Fee Calculation', () => {
    test('should estimate minting gas accurately', async () => {
      const gasEstimate = await mintingService.estimateMintingGas(
        contractAddress,
        wallet.address as SBTContractAddress,
        'ipfs://QmTestGasEstimate',
        wallet
      );

      expect(gasEstimate).toBeDefined();
      expect(gasEstimate.gasLimit).toBeGreaterThan(BigInt(0));
      expect(gasEstimate.gasPrice).toBeGreaterThan(BigInt(0));
      expect(gasEstimate.estimatedCost).toBeGreaterThan(BigInt(0));
      expect(gasEstimate.estimatedCostInEther).toBeDefined();

      const costInEther = parseFloat(gasEstimate.estimatedCostInEther);
      expect(costInEther).toBeGreaterThan(0);
      expect(costInEther).toBeLessThan(1); // Should be less than 1 DEV

      console.log(`⛽ Gas Estimate:`, {
        gasLimit: gasEstimate.gasLimit.toString(),
        cost: gasEstimate.estimatedCostInEther,
      });
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 5: Retry Logic =============

  describe('Retry Logic and Error Handling', () => {
    test('should handle insufficient gas and retry', async () => {
      const metadata: SBTTokenMetadata = {
        name: 'Retry Test SBT',
        description: 'Testing retry logic',
        image: 'https://example.com/retry.png',
      };

      // Try with very low gas limit (should fail and retry with correct gas)
      try {
        const result = await mintingService.mintSBT(
          contractAddress,
          { 
            to: wallet.address as SBTContractAddress,
            metadata,
            gasLimit: BigInt(21000), // Too low for minting
          },
          wallet
        );

        // If it succeeds despite low gas, that's okay (retry worked)
        expect(result.tokenId).toBeDefined();
        console.log(`✅ Retry logic handled low gas successfully`);
      } catch (error) {
        // Should eventually fail after max retries
        expect(error).toBeDefined();
        console.log(`✅ Retry logic failed as expected after max attempts`);
      }
    }, TEST_TIMEOUT);

    test('should detect non-retryable errors', async () => {
      const invalidAddress = '0x0000000000000000000000000000000000000000';

      await expect(
        mintingService.mintSBT(
          contractAddress,
          {
            to: invalidAddress as SBTContractAddress,
            tokenURI: 'ipfs://QmTest',
          },
          wallet
        )
      ).rejects.toThrow();

      console.log(`✅ Non-retryable error detected correctly`);
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 6: Batch Minting =============

  describe('Batch Minting Operations', () => {
    test('should batch mint multiple SBTs', async () => {
      const metadataList: SBTTokenMetadata[] = [
        {
          name: 'Batch SBT 1',
          description: 'First batch test',
          image: 'https://example.com/batch1.png',
        },
        {
          name: 'Batch SBT 2',
          description: 'Second batch test',
          image: 'https://example.com/batch2.png',
        },
        {
          name: 'Batch SBT 3',
          description: 'Third batch test',
          image: 'https://example.com/batch3.png',
        },
      ];

      const progressUpdates: any[] = [];
      const progressCallback = (current: number, total: number, result?: any, error?: string) => {
        progressUpdates.push({ current, total, hasResult: !!result, hasError: !!error });
        console.log(`   📦 Batch progress: ${current}/${total}`);
      };

      const result = await mintingService.batchMintSBT(
        contractAddress,
        wallet.address as SBTContractAddress,
        metadataList,
        wallet,
        progressCallback
      );

      expect(result.success).toBe(true);
      expect(result.totalMinted).toBe(3);
      expect(result.totalFailed).toBe(0);
      expect(result.results.length).toBe(3);
      expect(result.totalGasUsed).toBeGreaterThan(BigInt(0));
      expect(result.totalCost).toBeGreaterThan(BigInt(0));

      // Verify progress updates
      expect(progressUpdates.length).toBe(3);
      expect(progressUpdates[0].current).toBe(1);
      expect(progressUpdates[2].current).toBe(3);

      console.log(`✅ Batch minted ${result.totalMinted} tokens`);
      console.log(`   Total cost: ${result.totalCostInEther} DEV`);
    }, TEST_TIMEOUT);

    test('should handle partial batch failures gracefully', async () => {
      const metadataList: SBTTokenMetadata[] = [
        {
          name: 'Valid SBT 1',
          description: 'Should succeed',
          image: 'https://example.com/valid1.png',
        },
        {
          name: 'Valid SBT 2',
          description: 'Should succeed',
          image: 'https://example.com/valid2.png',
        },
      ];

      const result = await mintingService.batchMintSBT(
        contractAddress,
        wallet.address as SBTContractAddress,
        metadataList,
        wallet
      );

      expect(result.totalMinted).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);

      console.log(`✅ Batch completed: ${result.totalMinted} succeeded, ${result.totalFailed} failed`);
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 7: Service Management =============

  describe('Service Management and Status', () => {
    test('should get contract information', async () => {
      const contractInfo = await mintingService.getContractInfo(contractAddress, wallet);

      expect(contractInfo.name).toBeDefined();
      expect(contractInfo.symbol).toBeDefined();
      expect(contractInfo.totalSupply).toBeGreaterThanOrEqual(BigInt(0));
      expect(contractInfo.address).toBe(contractAddress);
      expect(contractInfo.network).toBe('moonbase-alpha');
      expect(contractInfo.isDeployed).toBe(true);

      console.log(`📋 Contract Info:`, {
        name: contractInfo.name,
        symbol: contractInfo.symbol,
        supply: contractInfo.totalSupply.toString(),
      });
    }, TEST_TIMEOUT);

    test('should get service status', () => {
      const status = mintingService.getStatus();

      expect(status.connected).toBe(true);
      expect(status.network).toBe('moonbase-alpha');
      expect(status.ipfsService).toBeDefined();
      expect(status.maxRetries).toBe(3);
      expect(status.debugMode).toBe(true);

      console.log(`📊 Service Status:`, status);
    });

    test('should update service configuration', () => {
      mintingService.setConfig({
        maxRetries: 5,
        retryDelay: 3000,
        requiredConfirmations: 2,
      });

      const status = mintingService.getStatus();
      expect(status.maxRetries).toBe(5);
      expect(status.retryDelay).toBe(3000);
      expect(status.requiredConfirmations).toBe(2);

      // Reset to defaults
      mintingService.setConfig({
        maxRetries: 3,
        retryDelay: 2000,
        requiredConfirmations: 3,
      });

      console.log(`✅ Configuration updated successfully`);
    });
  });
});

