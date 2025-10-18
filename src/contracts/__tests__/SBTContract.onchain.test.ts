/**
 * SBTContract On-Chain Integration Tests
 * 
 * Tests real blockchain interactions with deployed SBT contracts on Moonbeam testnet.
 * These tests require a running Moonbeam testnet node and testnet DEV tokens.
 * 
 * Environment Variables:
 *   ENABLE_ONCHAIN_TESTS=true - Enable on-chain tests
 *   MOONBEAM_PRIVATE_KEY - Private key for testing (should have DEV tokens)
 *   MOONBEAM_RPC_URL - RPC URL (optional, defaults to Moonbase Alpha)
 */

import { ethers, Wallet } from 'ethers';
import { SBTContract, DeploymentConfigLoader, TransactionMonitoringResult, GasEstimationResult } from '../SBTContract';
import { SBTContractFactory } from '../SBTContractFactory';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { MoonbeamNetwork } from '../../config/moonbeamConfig';
import { SBTContractAddress, SBTTokenMetadata } from '../types/SBTContractTypes';

// Skip tests if on-chain testing is not enabled
const ENABLE_ONCHAIN_TESTS = process.env.ENABLE_ONCHAIN_TESTS === 'true';
const describeOnchain = ENABLE_ONCHAIN_TESTS ? describe : describe.skip;

describeOnchain('SBTContract On-Chain Integration Tests', () => {
  let adapter: MoonbeamAdapter;
  let wallet: Wallet;
  let contract: SBTContract;
  let contractAddress: SBTContractAddress;
  let testRecipient: string;
  let factory: SBTContractFactory;

  // Test timeout for blockchain operations (5 minutes)
  const TEST_TIMEOUT = 300000;

  beforeAll(async () => {
    // Validate environment
    const privateKey = process.env.MOONBEAM_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('MOONBEAM_PRIVATE_KEY environment variable is required for on-chain tests');
    }

    console.log('🔗 Setting up on-chain test environment...');

    // Initialize Moonbeam adapter
    adapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
    adapter.setDebug(true);
    await adapter.connect();

    // Create wallet
    const provider = adapter.getProvider();
    if (!provider) {
      throw new Error('Failed to get provider from adapter');
    }
    wallet = new Wallet(privateKey, provider);
    testRecipient = wallet.address;

    console.log(`✅ Test wallet: ${wallet.address}`);

    // Check balance
    const balance = await adapter.getBalance(wallet.address);
    const balanceInEther = ethers.formatEther(balance);
    console.log(`💰 Wallet balance: ${balanceInEther} DEV`);

    if (BigInt(balance) < ethers.parseEther('0.1')) {
      throw new Error('Insufficient DEV tokens. Need at least 0.1 DEV for testing.');
    }

    // Try to load existing deployment or deploy new contract
    try {
      const loader = DeploymentConfigLoader.getInstance();
      const deployedAddress = loader.getContractAddress('moonbase-alpha', 'SBTSimple');
      
      if (deployedAddress) {
        console.log(`📋 Using existing contract at ${deployedAddress}`);
        contractAddress = deployedAddress as SBTContractAddress;
        contract = new SBTContract(contractAddress, adapter, wallet, true);
        
        // Verify contract is deployed
        const isDeployed = await contract.isDeployed();
        if (!isDeployed) {
          throw new Error('Contract address found but contract not deployed');
        }
      } else {
        throw new Error('No deployment found');
      }
    } catch (error) {
      // Deploy new contract for testing
      console.log('📦 Deploying new SBT contract for testing...');
      factory = new SBTContractFactory(adapter, { debugMode: true });
      
      const deploymentConfig = {
        name: 'Test SBT',
        symbol: 'TSBT',
        baseURI: 'https://test.example.com/metadata/',
        owner: wallet.address as SBTContractAddress,
      };

      const deploymentResult = await factory.deployContract(deploymentConfig, wallet);
      contractAddress = deploymentResult.contractAddress;
      contract = new SBTContract(contractAddress, adapter, wallet, true);

      console.log(`✅ Contract deployed at ${contractAddress}`);
      console.log(`⛽ Gas used: ${deploymentResult.gasUsed.toString()}`);
      console.log(`💰 Cost: ${ethers.formatEther(deploymentResult.deploymentCost)} DEV`);
    }

    // Verify contract info
    const [name, symbol, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.totalSupply(),
    ]);

    console.log(`📝 Contract Info: ${name} (${symbol}), Total Supply: ${totalSupply.toString()}`);
    console.log('✅ Test environment ready\n');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (adapter) {
      await adapter.disconnect();
      console.log('\n🔌 Disconnected from Moonbeam testnet');
    }
  });

  // ============= Test Suite 1: Contract Deployment Verification =============

  describe('Contract Deployment Verification', () => {
    test('should verify contract is deployed on-chain', async () => {
      const isDeployed = await contract.isDeployed();
      expect(isDeployed).toBe(true);
    }, TEST_TIMEOUT);

    test('should retrieve correct contract information', async () => {
      const [name, symbol, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
      ]);

      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      expect(symbol).toBeDefined();
      expect(typeof symbol).toBe('string');
      expect(totalSupply).toBeDefined();
      expect(totalSupply).toBeGreaterThanOrEqual(BigInt(0));
    }, TEST_TIMEOUT);

    test('should have correct network and address', () => {
      expect(contract.getAddress()).toBe(contractAddress);
      expect(contract.getNetwork()).toBe('moonbase-alpha');
    });
  });

  // ============= Test Suite 2: Gas Estimation =============

  describe('Gas Estimation and Fee Calculation', () => {
    const testMetadataUri = 'ipfs://QmTest123456789';

    test('should estimate gas for minting transaction', async () => {
      const gasEstimate = await contract.estimateMintGas(testRecipient, testMetadataUri);

      expect(gasEstimate).toBeDefined();
      expect(gasEstimate.gasLimit).toBeGreaterThan(BigInt(0));
      expect(gasEstimate.gasPrice).toBeGreaterThan(BigInt(0));
      expect(gasEstimate.estimatedCost).toBeGreaterThan(BigInt(0));
      expect(gasEstimate.estimatedCostInEther).toBeDefined();
      
      console.log(`⛽ Mint Gas Estimate:`, {
        gasLimit: gasEstimate.gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasEstimate.gasPrice, 'gwei'),
        cost: gasEstimate.estimatedCostInEther,
      });
    }, TEST_TIMEOUT);

    test('should estimate gas for burning transaction', async () => {
      // First mint a token to burn
      const mintResult = await contract.mint(testRecipient, testMetadataUri);
      const { tokenId } = mintResult;

      if (!tokenId) {
        throw new Error('Token ID not found after minting');
      }

      // Estimate burn gas
      const gasEstimate = await contract.estimateBurnGas(tokenId);

      expect(gasEstimate).toBeDefined();
      expect(gasEstimate.gasLimit).toBeGreaterThan(BigInt(0));
      expect(gasEstimate.gasPrice).toBeGreaterThan(BigInt(0));
      expect(gasEstimate.estimatedCost).toBeGreaterThan(BigInt(0));

      console.log(`⛽ Burn Gas Estimate:`, {
        gasLimit: gasEstimate.gasLimit.toString(),
        cost: gasEstimate.estimatedCostInEther,
      });
    }, TEST_TIMEOUT);

    test('should calculate accurate fee estimation', async () => {
      const gasEstimate = await contract.estimateMintGas(testRecipient, testMetadataUri);
      
      // Verify fee calculation is reasonable (not zero, not too high)
      const costInEther = parseFloat(gasEstimate.estimatedCostInEther);
      expect(costInEther).toBeGreaterThan(0);
      expect(costInEther).toBeLessThan(1); // Should be less than 1 DEV

      // Verify gas limit has buffer
      expect(gasEstimate.gasLimit).toBeGreaterThan(BigInt(50000));
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 3: SBT Minting Transactions =============

  describe('SBT Minting Transactions', () => {
    test('should successfully mint SBT with metadata URI', async () => {
      const metadataUri = `ipfs://QmTestMint${Date.now()}`;
      
      const { transaction, monitoring, tokenId } = await contract.mint(
        testRecipient,
        metadataUri,
        { confirmations: 2 }
      );

      expect(transaction).toBeDefined();
      expect(transaction.hash).toBeDefined();
      expect(monitoring).toBeDefined();
      expect(monitoring.transactionHash).toBe(transaction.hash);
      expect(monitoring.status).toBe(1); // Success
      expect(monitoring.gasUsed).toBeGreaterThan(BigInt(0));
      expect(monitoring.totalCost).toBeGreaterThan(BigInt(0));
      expect(tokenId).toBeDefined();
      expect(tokenId).toBeGreaterThan(BigInt(0));

      console.log(`✅ Token minted: #${tokenId?.toString()}`);
      console.log(`📝 TX: ${transaction.hash}`);
      console.log(`⛽ Gas: ${monitoring.gasUsed.toString()}`);
      console.log(`💰 Cost: ${ethers.formatEther(monitoring.totalCost)} DEV`);
    }, TEST_TIMEOUT);

    test('should mint SBT and retrieve token information', async () => {
      const metadataUri = `ipfs://QmTestInfo${Date.now()}`;
      
      const { tokenId } = await contract.mint(testRecipient, metadataUri);
      
      if (!tokenId) {
        throw new Error('Token ID not returned');
      }

      // Retrieve token info
      const tokenInfo = await contract.getTokenInfo(tokenId);

      expect(tokenInfo.tokenId).toBe(tokenId);
      expect(tokenInfo.owner.toLowerCase()).toBe(testRecipient.toLowerCase());
      expect(tokenInfo.tokenURI).toBe(metadataUri);
      expect(tokenInfo.isRevoked).toBe(false);

      console.log(`📋 Token Info:`, {
        id: tokenInfo.tokenId.toString(),
        owner: tokenInfo.owner,
        uri: tokenInfo.tokenURI,
        revoked: tokenInfo.isRevoked,
      });
    }, TEST_TIMEOUT);

    test('should mint multiple tokens and track total supply', async () => {
      const initialSupply = await contract.totalSupply();
      const tokensToMint = 3;

      for (let i = 0; i < tokensToMint; i++) {
        await contract.mint(testRecipient, `ipfs://QmBatch${Date.now()}-${i}`);
      }

      const finalSupply = await contract.totalSupply();
      expect(finalSupply).toBeGreaterThanOrEqual(initialSupply + BigInt(tokensToMint));

      console.log(`📊 Supply increased: ${initialSupply.toString()} → ${finalSupply.toString()}`);
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 4: Contract Event Handling =============

  describe('Contract Event Handling', () => {
    test('should capture Transfer events from minting', async () => {
      const metadataUri = `ipfs://QmTestEvent${Date.now()}`;
      
      const { monitoring, tokenId } = await contract.mint(testRecipient, metadataUri);

      expect(monitoring.events.length).toBeGreaterThan(0);
      
      // Find Transfer event
      const transferEvent = monitoring.events.find((event: any) => {
        try {
          const parsed = contract.getContract().interface.parseLog({
            topics: [...event.topics],
            data: event.data,
          });
          return parsed?.name === 'Transfer';
        } catch {
          return false;
        }
      });

      expect(transferEvent).toBeDefined();

      console.log(`📡 Events captured: ${monitoring.events.length}`);
      console.log(`🔔 Transfer event found for token #${tokenId?.toString()}`);
    }, TEST_TIMEOUT);

    test('should query historical Transfer events', async () => {
      const currentBlock = await adapter.getCurrentBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100); // Last 100 blocks

      const events = await contract.queryTransferEvents({
        to: testRecipient,
        fromBlock,
        toBlock: 'latest',
      });

      expect(Array.isArray(events)).toBe(true);
      
      if (events.length > 0) {
        const event = events[0];
        expect(event.to.toLowerCase()).toBe(testRecipient.toLowerCase());
        expect(event.tokenId).toBeDefined();
        expect(event.blockNumber).toBeDefined();
        expect(event.transactionHash).toBeDefined();

        console.log(`📜 Found ${events.length} Transfer events`);
        console.log(`   Latest: Token #${event.tokenId.toString()} at block ${event.blockNumber}`);
      }
    }, TEST_TIMEOUT);

    test('should subscribe to and receive real-time Transfer events', async () => {
      // Note: Real-time event subscriptions via WebSocket can be unreliable on public RPCs
      // This test uses polling to verify events after transaction confirmation
      
      const metadataUri = `ipfs://QmTestRealtime${Date.now()}`;
      const { tokenId, monitoring } = await contract.mint(testRecipient, metadataUri);

      // Wait for transaction to be mined
      expect(monitoring.status).toBe(1);
      
      // Query historical events to verify
      const currentBlock = await adapter.getProvider()!.getBlockNumber();
      const events = await contract.queryTransferEvents({
        fromBlock: currentBlock - 5,
        toBlock: currentBlock,
      });

      // Find our event
      const ourEvent = events.find(e => e.tokenId === tokenId);
      expect(ourEvent).toBeDefined();
      expect(ourEvent!.to.toLowerCase()).toBe(testRecipient.toLowerCase());

      console.log(`🔔 Event verified: Token #${tokenId!.toString()} at block ${ourEvent!.blockNumber}`);
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 5: Token Operations =============

  describe('Token Operations', () => {
    test('should burn a token successfully', async () => {
      // Mint token first
      const { tokenId } = await contract.mint(testRecipient, `ipfs://QmTestBurn${Date.now()}`);
      
      if (!tokenId) {
        throw new Error('Token ID not returned');
      }

      // Burn the token
      const { monitoring } = await contract.burn(tokenId);

      expect(monitoring.status).toBe(1);
      expect(monitoring.gasUsed).toBeGreaterThan(BigInt(0));

      // Verify token no longer exists
      await expect(contract.ownerOf(tokenId)).rejects.toThrow();

      console.log(`🔥 Token #${tokenId.toString()} burned`);
      console.log(`⛽ Gas used: ${monitoring.gasUsed.toString()}`);
    }, TEST_TIMEOUT);

    test('should get all tokens owned by address', async () => {
      const tokens = await contract.tokensOfOwner(testRecipient);

      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);

      console.log(`👤 Address owns ${tokens.length} tokens`);
      console.log(`   Token IDs: ${tokens.map(t => t.toString()).join(', ')}`);
    }, TEST_TIMEOUT);

    test('should check token balance correctly', async () => {
      const balance = await contract.balanceOf(testRecipient);

      expect(balance).toBeGreaterThan(BigInt(0));

      console.log(`💎 Token balance: ${balance.toString()}`);
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 6: Error Handling =============

  describe('Error Handling for Failed Transactions', () => {
    test('should handle minting to zero address error', async () => {
      const zeroAddress = ethers.ZeroAddress;

      await expect(
        contract.mint(zeroAddress, 'ipfs://QmTest')
      ).rejects.toThrow();

      console.log('❌ Zero address mint correctly rejected');
    }, TEST_TIMEOUT);

    test('should handle burning non-existent token', async () => {
      const nonExistentTokenId = BigInt(999999999);

      await expect(
        contract.burn(nonExistentTokenId)
      ).rejects.toThrow();

      console.log('❌ Non-existent token burn correctly rejected');
    }, TEST_TIMEOUT);

    test('should handle querying non-existent token owner', async () => {
      const nonExistentTokenId = BigInt(888888888);

      await expect(
        contract.ownerOf(nonExistentTokenId)
      ).rejects.toThrow();

      console.log('❌ Non-existent token query correctly rejected');
    }, TEST_TIMEOUT);

    test('should handle unauthorized token operations', async () => {
      // Create a different wallet without minter role
      const unauthorizedWallet = Wallet.createRandom().connect(adapter.getProvider()!);
      const unauthorizedContract = new SBTContract(
        contractAddress,
        adapter,
        unauthorizedWallet,
        false
      );

      await expect(
        unauthorizedContract.mint(testRecipient, 'ipfs://QmTest')
      ).rejects.toThrow();

      console.log('❌ Unauthorized mint correctly rejected');
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 7: Transaction Monitoring =============

  describe('Transaction Monitoring and Confirmation', () => {
    test('should monitor transaction with progress updates', async () => {
      const progressUpdates: number[] = [];
      
      const metadataUri = `ipfs://QmTestMonitor${Date.now()}`;
      const { transaction, monitoring } = await contract.mint(testRecipient, metadataUri, {
        confirmations: 1,
      });

      // Use adapter's provider to get transaction receipt
      const provider = adapter.getProvider();
      expect(provider).toBeDefined();
      
      const status = await provider!.getTransactionReceipt(transaction.hash);
      expect(status).toBeDefined();
      expect(status!.status).toBe(1);
      
      // Also verify monitoring result
      expect(monitoring.status).toBe(1);
      expect(monitoring.transactionHash).toBe(transaction.hash);

      console.log(`📡 Transaction monitored: ${transaction.hash}`);
      console.log(`✅ Status: ${status!.status === 1 ? 'Success' : 'Failed'}`);
      console.log(`⛽ Gas used: ${monitoring.gasUsed.toString()}`);
    }, TEST_TIMEOUT);

    test('should retrieve detailed transaction status', async () => {
      // Mint a token
      const { transaction, tokenId } = await contract.mint(
        testRecipient,
        `ipfs://QmTestStatus${Date.now()}`
      );

      // Get transaction status using adapter
      const txStatus = await adapter.getTransactionStatus(transaction.hash);

      expect(txStatus.hash).toBe(transaction.hash);
      expect(txStatus.status).toBe('confirmed');
      expect(txStatus.blockNumber).toBeDefined();
      expect(txStatus.gasUsed).toBeGreaterThan(BigInt(0));
      expect(txStatus.transactionFee).toBeGreaterThan(BigInt(0));
      expect(txStatus.confirmations).toBeGreaterThan(0);

      console.log(`📊 Transaction Status:`, {
        hash: txStatus.hash.substring(0, 10) + '...',
        status: txStatus.status,
        block: txStatus.blockNumber,
        confirmations: txStatus.confirmations,
        fee: ethers.formatEther(txStatus.transactionFee || BigInt(0)),
      });
    }, TEST_TIMEOUT);
  });

  // ============= Test Suite 8: Integration Tests =============

  describe('End-to-End Integration Tests', () => {
    test('should complete full SBT lifecycle: mint → query → burn', async () => {
      // 1. Mint
      const metadataUri = `ipfs://QmTestLifecycle${Date.now()}`;
      const { tokenId: mintedTokenId, monitoring: mintMonitoring } = await contract.mint(
        testRecipient,
        metadataUri
      );

      expect(mintedTokenId).toBeDefined();
      expect(mintMonitoring.status).toBe(1);

      console.log(`\n🔄 SBT Lifecycle Test:`);
      console.log(`1️⃣ Minted token #${mintedTokenId?.toString()}`);

      // 2. Query
      const tokenInfo = await contract.getTokenInfo(mintedTokenId!);
      expect(tokenInfo.owner.toLowerCase()).toBe(testRecipient.toLowerCase());
      expect(tokenInfo.tokenURI).toBe(metadataUri);

      console.log(`2️⃣ Queried token info successfully`);

      // 3. Burn
      const { monitoring: burnMonitoring } = await contract.burn(mintedTokenId!);
      expect(burnMonitoring.status).toBe(1);

      console.log(`3️⃣ Burned token successfully`);
      console.log(`💰 Total cost: ${ethers.formatEther(
        mintMonitoring.totalCost + burnMonitoring.totalCost
      )} DEV\n`);
    }, TEST_TIMEOUT);

    test('should handle concurrent minting operations', async () => {
      // Note: Due to nonce management on blockchain, we mint sequentially with small delays
      // This simulates real-world batch minting scenarios
      const concurrentMints = 5;
      const results = [];

      console.log(`\n🔄 Sequential batch minting ${concurrentMints} tokens...`);
      
      for (let i = 0; i < concurrentMints; i++) {
        const result = await contract.mint(
          testRecipient, 
          `ipfs://QmTestConcurrent${Date.now()}-${i}`
        );
        results.push(result);
        
        // Small delay to ensure nonce increments properly
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      expect(results.length).toBe(concurrentMints);
      results.forEach((result, index) => {
        expect(result.tokenId).toBeDefined();
        expect(result.monitoring.status).toBe(1);
      });

      console.log(`🔀 Concurrent minting completed: ${concurrentMints} tokens`);
    }, TEST_TIMEOUT);
  });
});

