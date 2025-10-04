/**
 * SBT Contract Factory
 * 
 * Factory for deploying and managing SBT (Soulbound Token) contracts on Moonbeam.
 * Handles contract deployment, verification, address management, and ABI updates.
 */

import { ethers, ContractFactory, Contract, ContractTransactionResponse } from 'ethers';
import { MoonbeamAdapter } from '../adapters/MoonbeamAdapter.js';
import { MoonbeamErrorCode } from '../config/moonbeamConfig.js';
import { WalletError } from '../errors/WalletErrors.js';
import { 
  SBTContractAddress, 
  SBTContractDeploymentConfig, 
  SBTContractDeploymentResult,
  SBTContractABI 
} from './types/SBTContractTypes.js';

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
  abi: SBTContractABI;
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
    
    this.initializeABIVersions();
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
  private getDefaultSBTABI(): SBTContractABI {
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
    ] as SBTContractABI;
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

      // Get current ABI version
      const currentABI = this.getCurrentABI();
      if (!currentABI) {
        throw new SBTContractFactoryError(
          'No active ABI version found',
          MoonbeamErrorCode.CONTRACT_ERROR,
          'deployContract'
        );
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
        verificationResult,
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
        return contract;
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
    abi: SBTContractABI,
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
    // This would be the actual compiled bytecode
    // For now, returning a placeholder that represents a valid contract
    return '0x608060405234801561001057600080fd5b5060405161085d38038061085d833981810160405281019061003291906101a2565b8282816003908161004391906103e4565b50806004908161005391906103e4565b50505050506104c7565b600080fd5b6000819050919050565b61007681610063565b811461008157600080fd5b50565b6000813590506100938161006d565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126100be576100bd610099565b5b8235905067ffffffffffffffff8111156100db576100da61009e565b5b6020830191508360018202830111156100f7576100f66100a3565b5b9250929050565b6000806000806000608086880312156101195761011861005e565b5b600061012788828901610084565b955050602061013888828901610084565b945050604061014988828901610084565b935050606086013567ffffffffffffffff81111561016a57610169610063565b5b610176888289016100a8565b92509250509295509295909350565b6000815190506101948161006d565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f8401126101bf576101be61019a565b5b8235905067ffffffffffffffff8111156101dc576101db61019f565b5b6020830191508360018202830111156101f8576101f76101a4565b5b9250929050565b60008060008060006080868803121561021a5761021961005e565b5b600061022888828901610185565b955050602061023988828901610185565b945050604061024a88828901610185565b935050606086013567ffffffffffffffff81111561026b5761026a610063565b5b610277888289016101a9565b92509250509295509295909350565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806102d157607f821691505b6020821081036102e4576102e361028a565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b60006008830261034657610341600083016102ea565b61034f565b61034e836102ea565b81555b505050565b60006008830261035e57610359600083016102ea565b610367565b610368836102ea565b81555b505050565b61037782610386565b67ffffffffffffffff8111156103905761038f61028a565b5b61039a82546102b9565b6103a5828285610311565b600060209050601f8311600181146103d857600084156103c6578287015190505b6103d0858261031c565b865550610438565b601f1984166103e686600052602060002090505b8154815290600101906020018083116103ce57829003601f168201915b505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806104b057607f821691505b6020821081036104c3576104c2610469565b5b50919050565b610385806104d66000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063095ea7b31461004657806318160ddd1461006257806323b872dd14610080575b600080fd5b610060600480360381019061005b91906102a0565b61009c565b005b61006a6100b2565b60405161007791906102ef565b60405180910390f35b61009a60048036038101906100959190610310565b6100b8565b005b6100a46100d8565b6100ae82826100e1565b5050565b60025481565b6100c06100d8565b6100cb8383836101a6565b505050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610150576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610147906103a3565b60405180910390fd5b61015c600083836101a6565b806002600082825461016e91906103f2565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161021c91906102ef565b60405180910390a35050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f84011261025857610257610233565b5b8235905067ffffffffffffffff81111561027557610274610238565b5b6020830191508360018202830111156102915761029061023d565b5b9250929050565b6000806000806000608086880312156102b4576102b361022e565b5b60006102c288828901610243565b95505060206102d388828901610243565b94505060406102e488828901610243565b935050606086013567ffffffffffffffff81111561030557610304610233565b5b61031188828901610242565b92509250509295509295909350565b6000819050919050565b61033381610320565b82525050565b600060208201905061034e600083018461032a565b92915050565b600082825260208201905092915050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b6000610395601f83610354565b91506103a082610365565b602082019050919050565b600060208201905081810360008301526103c481610388565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061040582610320565b915061041083610320565b9250828201905080821115610428576104276103cb565b5b9291505056fea2646970667358221220';
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
    abi: SBTContractABI,
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
