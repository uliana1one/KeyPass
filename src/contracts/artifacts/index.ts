/**
 * SBT Contract Artifacts
 * 
 * Exports for contract artifacts, deployment configurations, and verification data.
 * Provides easy access to compiled contract information for deployment and interaction.
 */

// Contract artifacts
import SBTSimpleArtifact from './SBTSimple.json';
import bytecodeData from './bytecode.json';
import deploymentConfigs from './deployment-configs.json';
import verificationData from './verification-data.json';

export { SBTSimpleArtifact, bytecodeData, deploymentConfigs, verificationData };

// Type definitions for artifacts
export interface ContractArtifact {
  contractName: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  metadata: {
    useLiteralContent: boolean;
    bytecodeHash: string;
    appendCBOR: boolean;
  };
  compiler: {
    name: string;
    version: string;
  };
  networks: Record<string, any>;
  schemaVersion: string;
  updatedAt: string;
}

export interface BytecodeData {
  [contractName: string]: {
    bytecode: string;
    deployedBytecode: string;
    compilerVersion: string;
    optimizationEnabled: boolean;
    optimizationRuns: number;
    constructorArgs: string[];
    gasEstimate: {
      deployment: string;
      mint: string;
      burn: string;
      transfer: string;
    };
    size: {
      bytecode: string;
      deployed: string;
    };
    metadata: {
      compiledAt: string;
      sourceHash: string;
      ipfsHash: string;
    };
  };
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  deployment: {
    gasLimit: string;
    gasPrice: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    confirmations: number;
    timeout: number;
    verification: {
      enabled: boolean;
      apiKey: string;
      delay: number;
      retries: number;
    };
  };
  contracts: {
    [contractName: string]: {
      address: string;
      deployedAt: string;
      transactionHash: string;
      verified: boolean;
      verificationId: string;
    };
  };
}

export interface DeploymentConfigs {
  networks: {
    [network: string]: NetworkConfig;
  };
  defaults: {
    contractName: string;
    constructorArgs: {
      name: string;
      symbol: string;
      baseURI: string;
    };
    deployment: {
      gasLimit: string;
      gasPrice: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      confirmations: number;
      timeout: number;
      retries: number;
      retryDelay: number;
    };
    verification: {
      enabled: boolean;
      delay: number;
      retries: number;
      retryDelay: number;
    };
  };
  environment: {
    required: string[];
    optional: string[];
  };
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    description: string;
  };
}

export interface VerificationTemplate {
  apiUrl: string;
  endpoint: string;
  requiredFields: string[];
  optionalFields: string[];
}

export interface VerificationData {
  verificationTemplates: {
    [network: string]: VerificationTemplate;
  };
  sourceCode: {
    [contractName: string]: {
      source: string;
      compilerVersion: string;
      optimizationEnabled: boolean;
      optimizationRuns: number;
      evmVersion: string;
      licenseType: string;
    };
  };
  verificationHistory: {
    [network: string]: any[];
  };
  verificationStatus: {
    [status: string]: string;
  };
  verificationResults: {
    [result: string]: {
      status: string;
      message: string;
      [key: string]: any;
    };
  };
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    description: string;
  };
}

// Utility functions
export const getNetworkConfig = (network: string): NetworkConfig | undefined => {
  return (deploymentConfigs.networks as any)[network];
};

export const getContractBytecode = (contractName: string = 'SBTSimple'): string => {
  return (bytecodeData as any)[contractName]?.bytecode || '';
};

export const getDeployedBytecode = (contractName: string = 'SBTSimple'): string => {
  return (bytecodeData as any)[contractName]?.deployedBytecode || '';
};

export const getGasEstimate = (contractName: string = 'SBTSimple', operation: string): string => {
  return (bytecodeData as any)[contractName]?.gasEstimate[operation] || '0';
};

export const getVerificationTemplate = (network: string): VerificationTemplate | undefined => {
  return (verificationData.verificationTemplates as any)[network];
};

export const getContractSourceCode = (contractName: string = 'SBTSimple'): string => {
  return (verificationData.sourceCode as any)[contractName]?.source || '';
};

export const getSupportedNetworks = (): string[] => {
  return Object.keys((deploymentConfigs as any).networks);
};

export const getDefaultConstructorArgs = () => {
  return (deploymentConfigs as any).defaults.constructorArgs;
};

export const getDefaultDeploymentConfig = () => {
  return (deploymentConfigs as any).defaults.deployment;
};

export const getDefaultVerificationConfig = () => {
  return (deploymentConfigs as any).defaults.verification;
};

// Network-specific utilities
export const isTestnet = (network: string): boolean => {
  return network === 'moonbase-alpha';
};

export const isMainnet = (network: string): boolean => {
  return network === 'moonbeam' || network === 'moonriver';
};

export const getExplorerUrl = (network: string, address: string): string => {
  const config = getNetworkConfig(network);
  if (!config) return '';
  return `${config.blockExplorer}/address/${address}`;
};

export const getRpcUrl = (network: string): string => {
  const config = getNetworkConfig(network);
  return config?.rpcUrl || '';
};

export const getChainId = (network: string): number => {
  const config = getNetworkConfig(network);
  return config?.chainId || 0;
};

// Contract-specific utilities
export const getContractABI = (contractName: string = 'SBTSimple') => {
  if (contractName === 'SBTSimple') {
    return SBTSimpleArtifact.abi;
  }
  return [];
};

export const getContractName = (contractName: string = 'SBTSimple') => {
  if (contractName === 'SBTSimple') {
    return SBTSimpleArtifact.contractName;
  }
  return contractName;
};

export const getCompilerVersion = (contractName: string = 'SBTSimple'): string => {
  if (contractName === 'SBTSimple') {
    return (SBTSimpleArtifact as any).compiler.version;
  }
  return (bytecodeData as any)[contractName]?.compilerVersion || '';
};

export const getOptimizationSettings = (contractName: string = 'SBTSimple') => {
  return {
    enabled: (bytecodeData as any)[contractName]?.optimizationEnabled || false,
    runs: (bytecodeData as any)[contractName]?.optimizationRuns || 200,
  };
};

// Validation utilities
export const validateNetwork = (network: string): boolean => {
  return getSupportedNetworks().includes(network);
};

export const validateContractName = (contractName: string): boolean => {
  return Object.keys(bytecodeData as any).includes(contractName);
};

export const validateGasEstimate = (gasEstimate: string): boolean => {
  const gas = parseInt(gasEstimate);
  return !isNaN(gas) && gas > 0;
};

// Export all utilities
export const ArtifactUtils = {
  getNetworkConfig,
  getContractBytecode,
  getDeployedBytecode,
  getGasEstimate,
  getVerificationTemplate,
  getContractSourceCode,
  getSupportedNetworks,
  getDefaultConstructorArgs,
  getDefaultDeploymentConfig,
  getDefaultVerificationConfig,
  isTestnet,
  isMainnet,
  getExplorerUrl,
  getRpcUrl,
  getChainId,
  getContractABI,
  getContractName,
  getCompilerVersion,
  getOptimizationSettings,
  validateNetwork,
  validateContractName,
  validateGasEstimate,
};

export default {
  SBTSimpleArtifact,
  bytecodeData,
  deploymentConfigs,
  verificationData,
  ArtifactUtils,
};
