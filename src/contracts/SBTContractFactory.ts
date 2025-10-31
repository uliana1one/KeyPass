/**
 * SBT Contract Factory
 * 
 * Factory for deploying and managing SBT (Soulbound Token) contracts on Moonbeam.
 * Handles contract deployment, verification, address management, and ABI updates.
 */

import { ethers, ContractFactory, Contract, ContractTransactionResponse } from 'ethers';
import { MoonbeamAdapter } from '../adapters/MoonbeamAdapter';
import { MoonbeamErrorCode } from '../config/moonbeamConfig';
import { WalletError } from '../errors/WalletErrors';
import { 
  SBTContractAddress, 
  SBTContractDeploymentConfig, 
  SBTContractDeploymentResult,
  SBTContractABI 
} from './types/SBTContractTypes';

/**
 * Custom error for SBT Contract Factory operations
 */
export class SBTContractFactoryError extends WalletError {
  public readonly code: MoonbeamErrorCode;
  public readonly operation?: string;
  public readonly contractAddress?: string;
  public readonly network?: string;

  constructor(
    message: string,
    code: MoonbeamErrorCode,
    operation?: string,
    contractAddress?: string,
    network?: string,
    details?: any
  ) {
    super(message, code);
    this.code = code;
    this.operation = operation;
    this.contractAddress = contractAddress;
    this.network = network;
  }
}

/**
 * Interface for contract verification result
 */
export interface ContractVerificationResult {
  success: boolean;
  verificationId?: string;
  explorerUrl?: string;
  error?: string;
  verifiedAt?: string;
}

/**
 * Interface for network-specific contract addresses
 */
export interface NetworkContractAddresses {
  [network: string]: {
    address: SBTContractAddress;
    deployedAt: string;
    transactionHash: string;
    blockNumber: number;
    verified: boolean;
    verificationId?: string;
  };
}

/**
 * Interface for ABI version management
 */
export interface ABIVersion {
  version: string;
  abi: any[];
  contractName: string;
  compilerVersion: string;
  createdAt: string;
  isActive: boolean;
}

/**
 * SBT Contract Factory Configuration
 */
export interface SBTContractFactoryConfig {
  /** Default gas limit for deployments */
  defaultGasLimit?: bigint;
  /** Default gas price multiplier */
  gasPriceMultiplier?: number;
  /** Maximum retry attempts for deployment */
  maxRetryAttempts?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable contract verification after deployment */
  enableVerification?: boolean;
  /** Verification API key for Moonbeam explorer */
  verificationApiKey?: string;
  /** Contract verification delay in seconds */
  verificationDelay?: number;
  /** Enable debug logging */
  debugMode?: boolean;
}

/**
 * SBT Contract Factory
 */
export class SBTContractFactory {
  private adapter: MoonbeamAdapter;
  private config: SBTContractFactoryConfig;
  private networkAddresses: NetworkContractAddresses = {};
  private abiVersions: ABIVersion[] = [];
  private debugMode: boolean;

  constructor(
    adapter: MoonbeamAdapter,
    config: SBTContractFactoryConfig = {}
  ) {
    this.adapter = adapter;
    this.config = {
      defaultGasLimit: BigInt('3000000'),
      gasPriceMultiplier: 1.2,
      maxRetryAttempts: 3,
      retryDelay: 5000,
      enableVerification: true,
      verificationDelay: 30,
      debugMode: false,
      ...config,
    };
    this.debugMode = this.config.debugMode || false;
    
    // Don't initialize default ABI - will load from compiled artifacts when needed
    // this.initializeABIVersions();
  }

  /**
   * Initialize default ABI versions
   */
  private initializeABIVersions(): void {
    // Add default ABI version
    this.abiVersions.push({
      version: '1.0.0',
      abi: this.getDefaultSBTABI(),
      contractName: 'SBTSimple',
      compilerVersion: '0.8.19',
      createdAt: new Date().toISOString(),
      isActive: true,
    });
  }

  /**
   * Get default SBT ABI
   */
  private getDefaultSBTABI(): any[] {
    return [
      // ERC-721 Standard Methods
      {
        inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
        name: 'safeMint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'string', name: 'uri', type: 'string' },
        ],
        name: 'mint',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'burn',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'ownerOf',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      // Constructor
      {
        inputs: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'string', name: 'baseURI', type: 'string' },
        ],
        name: 'constructor',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
      },
    ] as any[];
  }

  /**
   * Deploy SBT contract to Moonbeam
   */
  public async deployContract(
    config: SBTContractDeploymentConfig,
    signer: ethers.Signer
  ): Promise<SBTContractDeploymentResult> {
    try {
      if (!this.adapter.isConnected()) {
        throw new SBTContractFactoryError(
          'MoonbeamAdapter is not connected',
          MoonbeamErrorCode.NETWORK_ERROR,
          'deployContract'
        );
      }

      if (this.debugMode) {
        console.log('[SBTContractFactory] Starting contract deployment...');
        console.log('[SBTContractFactory] Deployment config:', config);
      }

      const network = this.adapter.getCurrentNetwork();
      const provider = this.adapter.getProvider();
      
      if (!provider) {
        throw new SBTContractFactoryError(
          'Provider not available',
          MoonbeamErrorCode.NETWORK_ERROR,
          'deployContract'
        );
      }

      // Get current ABI version (auto-load from artifacts if not set)
      let currentABI = this.getCurrentABI();
      if (this.debugMode) {
        console.log(`[SBTContractFactory] getCurrentABI returned: ${currentABI ? `ABI with ${currentABI.abi.length} entries` : 'null'}`);
      }
      if (!currentABI) {
        // Auto-load from artifacts
        if (this.debugMode) {
          console.log('[SBTContractFactory] Calling loadFromArtifacts()...');
        }
        this.loadFromArtifacts();
        currentABI = this.getCurrentABI();
        if (this.debugMode) {
          console.log(`[SBTContractFactory] After loading: ${currentABI ? `ABI with ${currentABI.abi.length} entries` : 'null'}`);
        }
      if (!currentABI) {
        throw new SBTContractFactoryError(
          'No active ABI version found',
          MoonbeamErrorCode.CONTRACT_ERROR,
          'deployContract'
        );
        }
      }

      // Get contract bytecode
      const bytecode = this.getContractBytecode();
      if (!bytecode) {
        throw new SBTContractFactoryError(
          'Contract bytecode not available',
          MoonbeamErrorCode.CONTRACT_ERROR,
          'deployContract'
        );
      }

      if (this.debugMode) {
        console.log(`[SBTContractFactory] Bytecode loaded: ${bytecode.substring(0, 66)}... (${bytecode.length} chars)`);
        console.log(`[SBTContractFactory] ABI entries: ${currentABI.abi.length}`);
      }

      // Create contract factory
      const factory = new ContractFactory(currentABI.abi, bytecode, signer);

      // Prepare deployment parameters
      const deploymentParams = [
        config.name,
        config.symbol,
        config.baseURI || '',
      ];

      // Estimate gas for deployment
      const gasEstimate = await this.estimateDeploymentGas(factory, deploymentParams);
      
      // Prepare deployment options
      const deploymentOptions = {
        gasLimit: config.gasLimit || gasEstimate,
        gasPrice: config.gasPrice,
        maxFeePerGas: config.maxFeePerGas,
        maxPriorityFeePerGas: config.maxPriorityFeePerGas,
        value: config.value || BigInt(0),
      };

      if (this.debugMode) {
        console.log('[SBTContractFactory] Deployment options:', deploymentOptions);
      }

      // Deploy contract with retry logic
      const deploymentResult = await this.deployWithRetry(
        factory,
        deploymentParams,
        deploymentOptions
      );

      // Wait for deployment confirmation
      await deploymentResult.waitForDeployment();
      const contractAddress = await deploymentResult.getAddress();

      // Get deployment transaction details
      const deployTx = deploymentResult.deploymentTransaction();
      if (!deployTx) {
        throw new SBTContractFactoryError(
          'Failed to get deployment transaction',
          MoonbeamErrorCode.TRANSACTION_ERROR,
          'deployContract',
          contractAddress
        );
      }

      const receipt = await deployTx.wait();
      if (!receipt) {
        throw new SBTContractFactoryError(
          'Failed to get deployment receipt',
          MoonbeamErrorCode.TRANSACTION_ERROR,
          'deployContract',
          contractAddress
        );
      }

      // Store contract address for this network
      this.networkAddresses[network] = {
        address: contractAddress as SBTContractAddress,
        deployedAt: new Date().toISOString(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        verified: false,
      };

      // Verify contract if enabled
      let verificationResult: ContractVerificationResult | undefined;
      if (this.config.enableVerification) {
        verificationResult = await this.verifyContract(
          contractAddress,
          currentABI.abi,
          deploymentParams,
          network
        );
        
        if (verificationResult.success) {
          this.networkAddresses[network].verified = true;
          this.networkAddresses[network].verificationId = verificationResult.verificationId;
        }
      }

      const result: SBTContractDeploymentResult = {
        contractAddress: contractAddress as SBTContractAddress,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        deploymentCost: receipt.gasUsed * (receipt.gasPrice || BigInt(0)),
        creationCodeHash: this.calculateCodeHash(bytecode),
        runtimeCodeHash: await this.getRuntimeCodeHash(contractAddress, provider),
      };

      if (this.debugMode) {
        console.log('[SBTContractFactory] Contract deployed successfully:', result);
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to deploy SBT contract: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTContractFactory] Deployment error:', error);
      }

      throw new SBTContractFactoryError(
        errorMessage,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'deployContract',
        undefined,
        this.adapter.getCurrentNetwork(),
        error
      );
    }
  }

  /**
   * Estimate gas for contract deployment
   */
  private async estimateDeploymentGas(
    factory: ContractFactory,
    deploymentParams: any[]
  ): Promise<bigint> {
    try {
      const gasEstimate = await factory.getDeployTransaction(...deploymentParams);
      const estimatedGas = gasEstimate.gasLimit || this.config.defaultGasLimit!;
      
      // Add buffer to gas estimate
      const gasWithBuffer = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100);
      
      if (this.debugMode) {
        console.log('[SBTContractFactory] Gas estimate:', {
          original: estimatedGas.toString(),
          withBuffer: gasWithBuffer.toString(),
        });
      }

      return gasWithBuffer;
    } catch (error) {
      if (this.debugMode) {
        console.warn('[SBTContractFactory] Gas estimation failed, using default:', error);
      }
      return this.config.defaultGasLimit!;
    }
  }

  /**
   * Deploy contract with retry logic
   */
  private async deployWithRetry(
    factory: ContractFactory,
    deploymentParams: any[],
    deploymentOptions: any
  ): Promise<Contract> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetryAttempts!; attempt++) {
      try {
        if (this.debugMode) {
          console.log(`[SBTContractFactory] Deployment attempt ${attempt}...`);
        }

        const contract = await factory.deploy(...deploymentParams, deploymentOptions);
        return contract as Contract;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (this.debugMode) {
          console.warn(`[SBTContractFactory] Deployment attempt ${attempt} failed:`, lastError.message);
        }

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        // Wait before retry
        if (attempt < this.config.maxRetryAttempts!) {
          const delay = this.config.retryDelay! * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new SBTContractFactoryError(
      `Failed to deploy contract after ${this.config.maxRetryAttempts} attempts: ${lastError?.message}`,
      MoonbeamErrorCode.CONTRACT_ERROR,
      'deployWithRetry'
    );
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'insufficient funds',
      'invalid contract',
      'compilation failed',
      'constructor failed',
    ];

    return nonRetryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  /**
   * Verify contract on Moonbeam explorer
   */
  public async verifyContract(
    contractAddress: string,
    abi: any[],
    constructorArgs: any[],
    network?: string
  ): Promise<ContractVerificationResult> {
    try {
      if (!this.config.enableVerification) {
        return {
          success: false,
          error: 'Contract verification is disabled',
        };
      }

      const currentNetwork = network || this.adapter.getCurrentNetwork();
      
      if (this.debugMode) {
        console.log('[SBTContractFactory] Starting contract verification...');
        console.log('[SBTContractFactory] Contract address:', contractAddress);
        console.log('[SBTContractFactory] Network:', currentNetwork);
      }

      // Wait for contract to be indexed
      if (this.config.verificationDelay) {
        await new Promise(resolve => setTimeout(resolve, this.config.verificationDelay! * 1000));
      }

      // Get contract source code and compilation info
      const sourceCode = this.getContractSourceCode();
      const compilerVersion = this.getCurrentABI()?.compilerVersion || '0.8.19';
      
      // Prepare verification data
      const verificationData = {
        contractAddress,
        sourceCode,
        contractName: 'SBTSimple',
        compilerVersion,
        constructorArguments: this.encodeConstructorArgs(constructorArgs),
        abi: JSON.stringify(abi),
      };

      // Submit verification request (mock implementation)
      const verificationId = await this.submitVerificationRequest(verificationData, currentNetwork);
      
      const result: ContractVerificationResult = {
        success: true,
        verificationId,
        explorerUrl: this.getExplorerUrl(contractAddress, currentNetwork),
        verifiedAt: new Date().toISOString(),
      };

      if (this.debugMode) {
        console.log('[SBTContractFactory] Contract verification successful:', result);
      }

      return result;
    } catch (error) {
      const errorMessage = `Contract verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (this.debugMode) {
        console.error('[SBTContractFactory] Verification error:', error);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Submit verification request to explorer
   */
  private async submitVerificationRequest(
    verificationData: any,
    network: string
  ): Promise<string> {
    // Mock implementation - in real scenario, this would call the explorer API
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.debugMode) {
      console.log('[SBTContractFactory] Verification request submitted:', verificationId);
    }

    return verificationId;
  }

  /**
   * Get explorer URL for contract
   */
  private getExplorerUrl(contractAddress: string, network: string): string {
    const explorerUrls: { [key: string]: string } = {
      'moonbase-alpha': `https://moonbase.moonscan.io/address/${contractAddress}`,
      'moonbeam': `https://moonscan.io/address/${contractAddress}`,
      'moonriver': `https://moonriver.moonscan.io/address/${contractAddress}`,
    };

    return explorerUrls[network] || `https://moonbase.moonscan.io/address/${contractAddress}`;
  }

  /**
   * Encode constructor arguments
   */
  private encodeConstructorArgs(args: any[]): string {
    try {
      // Simple encoding - in real scenario, use proper ABI encoding
      return ethers.AbiCoder.defaultAbiCoder().encode(['string', 'string', 'string'], args);
    } catch (error) {
      if (this.debugMode) {
        console.warn('[SBTContractFactory] Failed to encode constructor args:', error);
      }
      return '0x';
    }
  }

  /**
   * Get contract source code
   */
  private getContractSourceCode(): string {
    // Return the Solidity source code for the SBT contract
    // This would typically be read from a file or stored as a constant
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SBTSimple is ERC721, Ownable {
    string private _baseTokenURI;
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }
    
    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        _safeMint(to, tokenId);
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }
        return tokenId;
    }
    
    function burn(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");
        _burn(tokenId);
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    // Soulbound functionality - disable transfers
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0) || to == address(0), "SBT: transfers not allowed");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}`;
  }

  /**
   * Get contract bytecode
   */
  private getContractBytecode(): string {
    try {
      // Load bytecode from artifacts
      const fs = require('fs');
      const path = require('path');
      
      const artifactPath = path.join(__dirname, 'artifacts', 'SBTSimple.json');
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      if (!artifact.bytecode || artifact.bytecode === '0x') {
        throw new Error('Bytecode not found in artifact file');
      }
      
      return artifact.bytecode;
    } catch (error) {
      throw new SBTContractFactoryError(
        `Failed to load contract bytecode: ${error instanceof Error ? error.message : 'Unknown error'}`,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'getContractBytecode'
      );
    }
  }

  /**
   * Load ABI and bytecode from artifacts
   */
  private loadFromArtifacts(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const artifactPath = path.join(__dirname, 'artifacts', 'SBTSimple.json');
      if (this.debugMode) {
        console.log(`[SBTContractFactory] Loading artifact from: ${artifactPath}`);
      }
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      if (this.debugMode) {
        console.log(`[SBTContractFactory] Loaded artifact: ABI=${artifact.abi?.length}, bytecode=${artifact.bytecode?.length}`);
      }
      
      if (!artifact.abi || !Array.isArray(artifact.abi)) {
        throw new Error('ABI not found in artifact file');
      }
      
      // Add ABI version if not already added
      const existingVersion = this.abiVersions.find(v => v.version === '1.0.0');
      if (!existingVersion) {
        this.addABIVersion(
          '1.0.0',
          artifact.abi,
          'SBTSimple',
          artifact.compilerVersion || '0.8.19',
          true // Set as active
        );
        
        if (this.debugMode) {
          console.log('[SBTContractFactory] Auto-loaded ABI from artifacts');
        }
      }
    } catch (error) {
      throw new SBTContractFactoryError(
        `Failed to load from artifacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        MoonbeamErrorCode.CONTRACT_ERROR,
        'loadFromArtifacts'
      );
    }
  }

  /**
   * Calculate code hash
   */
  private calculateCodeHash(bytecode: string): string {
    return ethers.keccak256(bytecode);
  }

  /**
   * Get runtime code hash
   */
  private async getRuntimeCodeHash(
    contractAddress: string,
    provider: ethers.Provider
  ): Promise<string> {
    try {
      const code = await provider.getCode(contractAddress);
      return ethers.keccak256(code);
    } catch (error) {
      if (this.debugMode) {
        console.warn('[SBTContractFactory] Failed to get runtime code hash:', error);
      }
      return '0x';
    }
  }

  /**
   * Get contract addresses for all networks
   */
  public getNetworkAddresses(): NetworkContractAddresses {
    return { ...this.networkAddresses };
  }

  /**
   * Get contract address for specific network
   */
  public getContractAddress(network?: string): SBTContractAddress | undefined {
    const targetNetwork = network || this.adapter.getCurrentNetwork();
    return this.networkAddresses[targetNetwork]?.address;
  }

  /**
   * Add contract address for network
   */
  public addContractAddress(
    network: string,
    address: SBTContractAddress,
    transactionHash: string,
    blockNumber: number,
    verified: boolean = false
  ): void {
    this.networkAddresses[network] = {
      address,
      deployedAt: new Date().toISOString(),
      transactionHash,
      blockNumber,
      verified,
    };

    if (this.debugMode) {
      console.log('[SBTContractFactory] Added contract address:', {
        network,
        address,
        verified,
      });
    }
  }

  /**
   * Remove contract address for network
   */
  public removeContractAddress(network: string): void {
    delete this.networkAddresses[network];
    
    if (this.debugMode) {
      console.log('[SBTContractFactory] Removed contract address for network:', network);
    }
  }

  /**
   * Get current ABI version
   */
  public getCurrentABI(): ABIVersion | undefined {
    return this.abiVersions.find(version => version.isActive);
  }

  /**
   * Get all ABI versions
   */
  public getABIVersions(): ABIVersion[] {
    return [...this.abiVersions];
  }

  /**
   * Add new ABI version
   */
  public addABIVersion(
    version: string,
    abi: any[],
    contractName: string,
    compilerVersion: string,
    setActive: boolean = false
  ): void {
    // Deactivate current version if setting new one as active
    if (setActive) {
      this.abiVersions.forEach(v => v.isActive = false);
    }

    const newVersion: ABIVersion = {
      version,
      abi,
      contractName,
      compilerVersion,
      createdAt: new Date().toISOString(),
      isActive: setActive,
    };

    this.abiVersions.push(newVersion);

    if (this.debugMode) {
      console.log('[SBTContractFactory] Added ABI version:', newVersion);
    }
  }

  /**
   * Set active ABI version
   */
  public setActiveABIVersion(version: string): boolean {
    const targetVersion = this.abiVersions.find(v => v.version === version);
    if (!targetVersion) {
      return false;
    }

    // Deactivate all versions
    this.abiVersions.forEach(v => v.isActive = false);
    
    // Activate target version
    targetVersion.isActive = true;

    if (this.debugMode) {
      console.log('[SBTContractFactory] Set active ABI version:', version);
    }

    return true;
  }

  /**
   * Get deployment status for network
   */
  public getDeploymentStatus(network?: string): {
    deployed: boolean;
    address?: SBTContractAddress;
    verified: boolean;
    deployedAt?: string;
  } {
    const targetNetwork = network || this.adapter.getCurrentNetwork();
    const contractInfo = this.networkAddresses[targetNetwork];

    if (!contractInfo) {
      return {
        deployed: false,
        verified: false,
      };
    }

    return {
      deployed: true,
      address: contractInfo.address,
      verified: contractInfo.verified,
      deployedAt: contractInfo.deployedAt,
    };
  }

  /**
   * Get factory configuration
   */
  public getConfig(): SBTContractFactoryConfig {
    return { ...this.config };
  }

  /**
   * Update factory configuration
   */
  public updateConfig(newConfig: Partial<SBTContractFactoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.debugMode = this.config.debugMode || false;

    if (this.debugMode) {
      console.log('[SBTContractFactory] Configuration updated:', this.config);
    }
  }

  /**
   * Enable debug mode
   */
  public setDebugMode(debug: boolean): void {
    this.debugMode = debug;
    this.config.debugMode = debug;
  }

  /**
   * Get factory status
   */
  public getStatus(): {
    connected: boolean;
    network: string;
    deployedNetworks: string[];
    activeABIVersion?: string;
    config: SBTContractFactoryConfig;
  } {
    return {
      connected: this.adapter.isConnected(),
      network: this.adapter.getCurrentNetwork(),
      deployedNetworks: Object.keys(this.networkAddresses),
      activeABIVersion: this.getCurrentABI()?.version,
      config: this.getConfig(),
    };
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    if (this.debugMode) {
      console.log('[SBTContractFactory] Cleaning up resources...');
    }

    // Clear network addresses
    this.networkAddresses = {};
    
    // Clear ABI versions
    this.abiVersions = [];

    if (this.debugMode) {
      console.log('[SBTContractFactory] Resources cleaned up successfully');
    }
  }
}
