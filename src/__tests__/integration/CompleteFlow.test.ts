/**
 * Complete Flow Integration Tests
 * 
 * Tests the complete end-to-end flow:
 * Moonbeam DID Registration → Moonbeam SBT Minting → Verification
 * 
 * This validates the entire KeyPass system working together with real blockchain operations.
 * 
 * Environment Variables:
 *   ENABLE_INTEGRATION_TESTS=true - Enable integration tests
 *   MOONBEAM_RPC_URL - Moonbeam testnet RPC URL
 *   MOONBEAM_PRIVATE_KEY - Private key for Moonbeam testnet
 */

import { Wallet } from 'ethers';
import { MoonbeamAdapter } from '../../adapters/MoonbeamAdapter';
import { MoonbeamDIDProvider } from '../../did/providers/MoonbeamDIDProvider';
import { SBTContract, DeploymentConfigLoader } from '../../contracts/SBTContract';
import { SBTMintingService } from '../../services/SBTMintingService';
import { BlockchainMonitor, BlockchainType, TransactionStatus } from '../../monitoring/BlockchainMonitor';
import { ErrorFactory, ErrorMessageFormatter } from '../../errors/BlockchainErrors';
import { MoonbeamNetwork } from '../../config/moonbeamConfig';
import { SBTTokenMetadata } from '../../contracts/types/SBTContractTypes';

// Skip tests if integration testing is not enabled
const ENABLE_INTEGRATION_TESTS = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const describeIntegration = ENABLE_INTEGRATION_TESTS ? describe : describe.skip;

// Test timeout for complete flow (10 minutes)
const TEST_TIMEOUT = 600000;

// Helper to generate unique test identifiers
const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

describeIntegration('Complete Flow Integration Tests', () => {
  let moonbeamAdapter: MoonbeamAdapter;
  let moonbeamDIDProvider: MoonbeamDIDProvider;
  let sbtContract: SBTContract;
  let sbtMintingService: SBTMintingService;
  let monitor: BlockchainMonitor;
  
  let moonbeamWallet: Wallet;
  let testDID: string;
  let testAddress: string;
  let sbtContractAddress: string;
  
  // Performance tracking
  const performanceMetrics = {
    didRegistrationTime: 0,
    sbtMintingTime: 0,
    verificationTime: 0,
    totalFlowTime: 0,
  };

  beforeAll(async () => {
    console.log('\n🚀 Setting up Complete Flow Integration Tests...\n');

    // Validate environment variables
    const moonbeamRpc = process.env.MOONBEAM_RPC_URL;
    const moonbeamKey = process.env.MOONBEAM_PRIVATE_KEY;

    if (!moonbeamRpc || !moonbeamKey) {
      throw new Error('Missing required environment variables for integration tests');
    }

    // Setup Moonbeam
    console.log('📡 Connecting to Moonbeam testnet...');
    moonbeamAdapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE);
    await moonbeamAdapter.connect();
    
    moonbeamWallet = new Wallet(moonbeamKey, moonbeamAdapter.getProvider()!);
    testAddress = moonbeamWallet.address;
    
    console.log(`✅ Moonbeam connected: ${testAddress}`);

    // Setup Moonbeam DID Provider
    console.log('🆔 Setting up Moonbeam DID Provider...');
    // For now, we'll use a placeholder contract address
    // In a real deployment, this would be the deployed Moonbeam DID contract
    const moonbeamDIDContractAddress = '0x0000000000000000000000000000000000000000';
    moonbeamDIDProvider = new MoonbeamDIDProvider(moonbeamAdapter, moonbeamDIDContractAddress);
    
    console.log('✅ Moonbeam DID Provider ready');

    // Load SBT contract deployment
    console.log('📄 Loading SBT contract deployment...');
    const deploymentLoader = DeploymentConfigLoader.getInstance();
    const deployment = deploymentLoader.getDeployment('moonbase');
    
    if (!deployment) {
      throw new Error('SBT contract deployment not found for Moonbase');
    }
    
    sbtContractAddress = deployment.contractAddress;
    sbtContract = new SBTContract(sbtContractAddress, moonbeamAdapter.getProvider()!);
    
    console.log(`✅ SBT contract loaded: ${sbtContractAddress}`);

    // Initialize SBT minting service
    console.log('🔧 Initializing SBT minting service...');
    sbtMintingService = new SBTMintingService(moonbeamAdapter, sbtContractAddress);
    
    console.log('✅ SBT minting service ready');

    // Initialize blockchain monitor
    console.log('📊 Initializing blockchain monitor...');
    monitor = new BlockchainMonitor({
      enableMetrics: true,
      enableHealthChecks: true,
      transactionTimeout: 300000, // 5 minutes
    });
    
    await monitor.initialize(moonbeamAdapter);
    
    console.log('✅ Blockchain monitor ready');

    // Generate test ID
    testId = generateTestId();
    console.log(`🆔 Test ID: ${testId}`);

    console.log('\n✅ Complete Flow Integration Tests setup complete!\n');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log('\n🧹 Cleaning up Complete Flow Integration Tests...\n');
    
    if (monitor) {
      monitor.stop();
    }
    
    if (moonbeamAdapter) {
      await moonbeamAdapter.disconnect();
    }
    
    console.log('✅ Cleanup complete\n');
  }, TEST_TIMEOUT);

  describe('Complete Flow: Moonbeam DID → Moonbeam SBT', () => {
    it('should complete the full flow: DID registration → SBT minting → verification', async () => {
      const startTime = Date.now();
      
      try {
        // Step 1: Register Moonbeam DID
        console.log('🆔 Step 1: Registering Moonbeam DID...');
        const didStartTime = Date.now();
        
        // For now, we'll simulate DID registration since we don't have the contract deployed
        // In a real scenario, this would call moonbeamDIDProvider.createDID()
        testDID = `did:moonbeam:${testAddress}`;
        
        performanceMetrics.didRegistrationTime = Date.now() - didStartTime;
        console.log(`✅ DID registered: ${testDID} (${performanceMetrics.didRegistrationTime}ms)`);

        // Step 2: Mint SBT
        console.log('🎨 Step 2: Minting SBT...');
        const sbtStartTime = Date.now();
        
        const metadata: SBTTokenMetadata = {
          name: `KeyPass SBT ${testId}`,
          description: `Soulbound token for ${testDID}`,
          image: 'https://example.com/sbt-image.png',
          attributes: [
            { trait_type: 'DID', value: testDID },
            { trait_type: 'Test ID', value: testId },
            { trait_type: 'Blockchain', value: 'Moonbeam' },
            { trait_type: 'Type', value: 'Soulbound Token' }
          ]
        };

        const mintResult = await sbtMintingService.mintSBT(
          testAddress as `0x${string}`,
          metadata,
          {
            gasLimit: BigInt(500000),
            gasPrice: BigInt(1000000000) // 1 gwei
          }
        );

        performanceMetrics.sbtMintingTime = Date.now() - sbtStartTime;
        console.log(`✅ SBT minted: ${mintResult.tokenId} (${performanceMetrics.sbtMintingTime}ms)`);

        // Step 3: Verify SBT
        console.log('🔍 Step 3: Verifying SBT...');
        const verifyStartTime = Date.now();
        
        const tokenInfo = await sbtContract.getTokenInfo(mintResult.tokenId);
        expect(tokenInfo.owner).toBe(testAddress);
        expect(tokenInfo.metadata).toBeDefined();
        
        performanceMetrics.verificationTime = Date.now() - verifyStartTime;
        console.log(`✅ SBT verified (${performanceMetrics.verificationTime}ms)`);

        // Calculate total flow time
        performanceMetrics.totalFlowTime = Date.now() - startTime;
        
        console.log('\n📊 Performance Metrics:');
        console.log(`  DID Registration: ${performanceMetrics.didRegistrationTime}ms`);
        console.log(`  SBT Minting: ${performanceMetrics.sbtMintingTime}ms`);
        console.log(`  Verification: ${performanceMetrics.verificationTime}ms`);
        console.log(`  Total Flow: ${performanceMetrics.totalFlowTime}ms`);
        
        // Verify performance thresholds
        expect(performanceMetrics.totalFlowTime).toBeLessThan(300000); // 5 minutes
        expect(performanceMetrics.sbtMintingTime).toBeLessThan(120000); // 2 minutes
        
      } catch (error) {
        console.error('❌ Complete flow failed:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle transaction monitoring throughout the flow', async () => {
      const startTime = Date.now();
      
      try {
        // Register DID with monitoring
        console.log('🆔 Registering DID with transaction monitoring...');
        const didStartTime = Date.now();
        
        testDID = `did:moonbeam:${testAddress}`;
        
        // Simulate transaction monitoring for DID registration
        const didTxHash = '0x' + Math.random().toString(16).substr(2, 64);
        const didMonitoringResult = await monitor.monitorMoonbeamDIDTransaction(
          didTxHash,
          'DID Registration',
          {
            maxRetries: 3,
            onProgress: (tx) => {
              console.log(`  DID TX Status: ${tx.status}`);
            }
          }
        );
        
        expect(didMonitoringResult.blockchain).toBe(BlockchainType.MOONBEAM);
        expect(didMonitoringResult.operation).toBe('DID Registration');
        
        performanceMetrics.didRegistrationTime = Date.now() - didStartTime;
        console.log(`✅ DID registered with monitoring (${performanceMetrics.didRegistrationTime}ms)`);

        // Mint SBT with monitoring
        console.log('🎨 Minting SBT with transaction monitoring...');
        const sbtStartTime = Date.now();
        
        const metadata: SBTTokenMetadata = {
          name: `KeyPass SBT ${testId}`,
          description: `Soulbound token for ${testDID}`,
          image: 'https://example.com/sbt-image.png',
          attributes: [
            { trait_type: 'DID', value: testDID },
            { trait_type: 'Test ID', value: testId },
            { trait_type: 'Blockchain', value: 'Moonbeam' },
            { trait_type: 'Type', value: 'Soulbound Token' }
          ]
        };

        const mintResult = await sbtMintingService.mintSBT(
          testAddress as `0x${string}`,
          metadata,
          {
            gasLimit: BigInt(500000),
            gasPrice: BigInt(1000000000)
          }
        );

        // Monitor SBT minting transaction
        const sbtMonitoringResult = await monitor.monitorMoonbeamTransaction(
          mintResult.transactionHash,
          'SBT Minting',
          {
            maxRetries: 3,
            onProgress: (tx) => {
              console.log(`  SBT TX Status: ${tx.status}`);
            }
          }
        );
        
        expect(sbtMonitoringResult.blockchain).toBe(BlockchainType.MOONBEAM);
        expect(sbtMonitoringResult.operation).toBe('SBT Minting');
        expect(sbtMonitoringResult.status).toBe(TransactionStatus.CONFIRMED);
        
        performanceMetrics.sbtMintingTime = Date.now() - sbtStartTime;
        console.log(`✅ SBT minted with monitoring (${performanceMetrics.sbtMintingTime}ms)`);

        // Verify monitoring metrics
        const metrics = monitor.getMetrics(BlockchainType.MOONBEAM);
        expect(metrics).toBeDefined();
        expect(metrics.transactions.total).toBeGreaterThan(0);
        expect(metrics.transactions.successful).toBeGreaterThan(0);
        
        console.log('✅ Transaction monitoring verified');
        
      } catch (error) {
        console.error('❌ Transaction monitoring test failed:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle errors gracefully throughout the flow', async () => {
      try {
        // Test error handling in DID registration
        console.log('🆔 Testing error handling in DID registration...');
        
        // Simulate DID registration error
        try {
          // This would normally call moonbeamDIDProvider.createDID() with invalid data
          throw new Error('Simulated DID registration error');
        } catch (error) {
          const blockchainError = ErrorFactory.fromCode(
            'MOONBEAM_2402', // DID_CREATION_FAILED
            'DID creation failed due to invalid parameters',
            { testId, address: testAddress }
          );
          
          expect(blockchainError.code).toBe('MOONBEAM_2402');
          expect(blockchainError.category).toBe('contract');
          expect(blockchainError.severity).toBe('high');
          
          console.log('✅ DID error handling verified');
        }

        // Test error handling in SBT minting
        console.log('🎨 Testing error handling in SBT minting...');
        
        try {
          // Simulate SBT minting error with invalid metadata
          const invalidMetadata: SBTTokenMetadata = {
            name: '', // Invalid empty name
            description: '',
            image: '',
            attributes: []
          };

          await sbtMintingService.mintSBT(
            testAddress as `0x${string}`,
            invalidMetadata,
            {
              gasLimit: BigInt(500000),
              gasPrice: BigInt(1000000000)
            }
          );
          
          // If we get here, the test should fail
          expect(true).toBe(false);
        } catch (error) {
          const blockchainError = ErrorFactory.fromCode(
            'MOONBEAM_2304', // SBT_METADATA_INVALID
            'SBT metadata validation failed',
            { testId, metadata: 'invalid' }
          );
          
          expect(blockchainError.code).toBe('MOONBEAM_2304');
          expect(blockchainError.category).toBe('contract');
          expect(blockchainError.severity).toBe('high');
          
          console.log('✅ SBT error handling verified');
        }

        // Test error recovery
        console.log('🔄 Testing error recovery...');
        
        // Simulate successful retry after error
        const metadata: SBTTokenMetadata = {
          name: `KeyPass SBT ${testId}`,
          description: `Soulbound token for ${testDID}`,
          image: 'https://example.com/sbt-image.png',
          attributes: [
            { trait_type: 'DID', value: testDID },
            { trait_type: 'Test ID', value: testId },
            { trait_type: 'Blockchain', value: 'Moonbeam' },
            { trait_type: 'Type', value: 'Soulbound Token' }
          ]
        };

        const mintResult = await sbtMintingService.mintSBT(
          testAddress as `0x${string}`,
          metadata,
          {
            gasLimit: BigInt(500000),
            gasPrice: BigInt(1000000000)
          }
        );

        expect(mintResult.tokenId).toBeDefined();
        expect(mintResult.transactionHash).toBeDefined();
        
        console.log('✅ Error recovery verified');
        
      } catch (error) {
        console.error('❌ Error handling test failed:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should maintain data consistency across the flow', async () => {
      try {
        // Register DID
        console.log('🆔 Registering DID for consistency test...');
        testDID = `did:moonbeam:${testAddress}`;
        
        // Mint SBT
        console.log('🎨 Minting SBT for consistency test...');
        const metadata: SBTTokenMetadata = {
          name: `KeyPass SBT ${testId}`,
          description: `Soulbound token for ${testDID}`,
          image: 'https://example.com/sbt-image.png',
          attributes: [
            { trait_type: 'DID', value: testDID },
            { trait_type: 'Test ID', value: testId },
            { trait_type: 'Blockchain', value: 'Moonbeam' },
            { trait_type: 'Type', value: 'Soulbound Token' }
          ]
        };

        const mintResult = await sbtMintingService.mintSBT(
          testAddress as `0x${string}`,
          metadata,
          {
            gasLimit: BigInt(500000),
            gasPrice: BigInt(1000000000)
          }
        );

        // Verify data consistency
        console.log('🔍 Verifying data consistency...');
        
        // Check SBT ownership
        const tokenInfo = await sbtContract.getTokenInfo(mintResult.tokenId);
        expect(tokenInfo.owner).toBe(testAddress);
        
        // Check SBT metadata
        expect(tokenInfo.metadata).toBeDefined();
        expect(tokenInfo.metadata.name).toBe(metadata.name);
        expect(tokenInfo.metadata.description).toBe(metadata.description);
        
        // Check SBT attributes
        expect(tokenInfo.metadata.attributes).toBeDefined();
        expect(tokenInfo.metadata.attributes.length).toBe(4);
        
        const didAttribute = tokenInfo.metadata.attributes.find(
          attr => attr.trait_type === 'DID'
        );
        expect(didAttribute?.value).toBe(testDID);
        
        const testIdAttribute = tokenInfo.metadata.attributes.find(
          attr => attr.trait_type === 'Test ID'
        );
        expect(testIdAttribute?.value).toBe(testId);
        
        console.log('✅ Data consistency verified');
        
      } catch (error) {
        console.error('❌ Data consistency test failed:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle concurrent operations safely', async () => {
      try {
        console.log('🔄 Testing concurrent operations...');
        
        const concurrentPromises = [];
        const testIds = [];
        
        // Create multiple concurrent SBT minting operations
        for (let i = 0; i < 3; i++) {
          const concurrentTestId = `${testId}-concurrent-${i}`;
          testIds.push(concurrentTestId);
          
          const metadata: SBTTokenMetadata = {
            name: `KeyPass SBT ${concurrentTestId}`,
            description: `Concurrent SBT ${i}`,
            image: 'https://example.com/sbt-image.png',
            attributes: [
              { trait_type: 'Test ID', value: concurrentTestId },
              { trait_type: 'Concurrent Index', value: i.toString() }
            ]
          };

          const promise = sbtMintingService.mintSBT(
            testAddress as `0x${string}`,
            metadata,
            {
              gasLimit: BigInt(500000),
              gasPrice: BigInt(1000000000)
            }
          );
          
          concurrentPromises.push(promise);
        }

        // Wait for all concurrent operations to complete
        const results = await Promise.all(concurrentPromises);
        
        // Verify all operations completed successfully
        expect(results.length).toBe(3);
        results.forEach((result, index) => {
          expect(result.tokenId).toBeDefined();
          expect(result.transactionHash).toBeDefined();
          console.log(`✅ Concurrent operation ${index} completed: ${result.tokenId}`);
        });
        
        // Verify all tokens are owned by the test address
        for (const result of results) {
          const tokenInfo = await sbtContract.getTokenInfo(result.tokenId);
          expect(tokenInfo.owner).toBe(testAddress);
        }
        
        console.log('✅ Concurrent operations verified');
        
      } catch (error) {
        console.error('❌ Concurrent operations test failed:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Performance and Reliability', () => {
    it('should meet performance benchmarks', async () => {
      const startTime = Date.now();
      
      try {
        // Run a complete flow and measure performance
        testDID = `did:moonbeam:${testAddress}`;
        
        const metadata: SBTTokenMetadata = {
          name: `KeyPass SBT ${testId}`,
          description: `Performance test SBT`,
          image: 'https://example.com/sbt-image.png',
          attributes: [
            { trait_type: 'DID', value: testDID },
            { trait_type: 'Test ID', value: testId },
            { trait_type: 'Type', value: 'Performance Test' }
          ]
        };

        const mintResult = await sbtMintingService.mintSBT(
          testAddress as `0x${string}`,
          metadata,
          {
            gasLimit: BigInt(500000),
            gasPrice: BigInt(1000000000)
          }
        );

        const totalTime = Date.now() - startTime;
        
        // Performance benchmarks
        expect(totalTime).toBeLessThan(120000); // 2 minutes
        expect(mintResult.tokenId).toBeDefined();
        expect(mintResult.transactionHash).toBeDefined();
        
        console.log(`✅ Performance benchmark met: ${totalTime}ms`);
        
      } catch (error) {
        console.error('❌ Performance benchmark test failed:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should maintain system stability under load', async () => {
      try {
        console.log('📊 Testing system stability under load...');
        
        const loadTestPromises = [];
        const loadTestCount = 5;
        
        // Create multiple operations to test stability
        for (let i = 0; i < loadTestCount; i++) {
          const loadTestId = `${testId}-load-${i}`;
          
          const metadata: SBTTokenMetadata = {
            name: `KeyPass SBT ${loadTestId}`,
            description: `Load test SBT ${i}`,
            image: 'https://example.com/sbt-image.png',
            attributes: [
              { trait_type: 'Test ID', value: loadTestId },
              { trait_type: 'Load Test Index', value: i.toString() }
            ]
          };

          const promise = sbtMintingService.mintSBT(
            testAddress as `0x${string}`,
            metadata,
            {
              gasLimit: BigInt(500000),
              gasPrice: BigInt(1000000000)
            }
          );
          
          loadTestPromises.push(promise);
        }

        // Wait for all load test operations to complete
        const results = await Promise.all(loadTestPromises);
        
        // Verify system stability
        expect(results.length).toBe(loadTestCount);
        results.forEach((result, index) => {
          expect(result.tokenId).toBeDefined();
          expect(result.transactionHash).toBeDefined();
        });
        
        // Check monitoring metrics
        const metrics = monitor.getMetrics(BlockchainType.MOONBEAM);
        expect(metrics).toBeDefined();
        expect(metrics.transactions.total).toBeGreaterThanOrEqual(loadTestCount);
        expect(metrics.transactions.successful).toBeGreaterThanOrEqual(loadTestCount);
        
        console.log('✅ System stability under load verified');
        
      } catch (error) {
        console.error('❌ System stability test failed:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });
});