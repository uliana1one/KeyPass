/**
 * Mock Moonbeam Adapter for Testing
 * 
 * This provides a mock implementation of MoonbeamAdapter that bypasses
 * the RPC connection issues in the test environment.
 */

import { MoonbeamAdapter, MoonbeamNetworkInfo, MoonbeamGasInfo, MoonbeamTransactionStatus, NonceInfo } from '../adapters/MoonbeamAdapter';
import { MoonbeamNetwork, MoonbeamErrorCode } from '../config/moonbeamConfig';

export class MockMoonbeamAdapter extends MoonbeamAdapter {
  private mockConnected: boolean = false;
  private mockBlockNumber: number = 14079818;
  private mockGasPrice: string = '31250000';
  private mockNonce: number = 0;
  private mockTokenOwnership: Map<string, string> = new Map(); // tokenId -> owner
  private mockTokenMetadata: Map<string, any> = new Map(); // tokenId -> metadata

  constructor(network: MoonbeamNetwork = MoonbeamNetwork.MOONBASE_ALPHA) {
    super(network);
  }

  public async connect(): Promise<MoonbeamNetworkInfo> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.mockConnected = true;
    
    return {
      chainId: 1287,
      name: 'Moonbase Alpha',
      network: this.currentNetwork,
      rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
      explorerUrl: 'https://moonbase.moonscan.io',
      nativeToken: 'DEV',
      nativeTokenDecimals: 18,
      currentBlockNumber: this.mockBlockNumber,
      latestBlockHash: '0x1234567890abcdef',
      gasPrice: this.mockGasPrice,
      connected: true,
      connectedAt: new Date().toISOString(),
    };
  }

  public async disconnect(): Promise<void> {
    this.mockConnected = false;
  }

  public isConnected(): boolean {
    return this.mockConnected;
  }

  public async getNetworkInfo(): Promise<MoonbeamNetworkInfo> {
    if (!this.mockConnected) {
      throw new Error('Not connected to Moonbeam network');
    }

    return {
      chainId: 1287,
      name: 'Moonbase Alpha',
      network: this.currentNetwork,
      rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
      explorerUrl: 'https://moonbase.moonscan.io',
      nativeToken: 'DEV',
      nativeTokenDecimals: 18,
      currentBlockNumber: this.mockBlockNumber,
      latestBlockHash: '0x1234567890abcdef',
      gasPrice: this.mockGasPrice,
      connected: true,
      connectedAt: new Date().toISOString(),
    };
  }

  public async getGasPrice(): Promise<MoonbeamGasInfo> {
    if (!this.mockConnected) {
      throw new Error('Not connected to Moonbeam network');
    }

    return {
      gasPrice: this.mockGasPrice,
      gasPriceGwei: '0.03125',
      estimatedGasLimit: '21000',
      maxGasLimit: '30000000',
      maxPriorityFeePerGas: '0',
      maxFeePerGas: '62500000',
    };
  }

  public async getCurrentBlockNumber(): Promise<number> {
    if (!this.mockConnected) {
      throw new Error('Not connected to Moonbeam network');
    }
    return this.mockBlockNumber;
  }

  public async getBalance(address: string): Promise<string> {
    if (!this.mockConnected) {
      throw new Error('Not connected to Moonbeam network');
    }
    // Return mock balance
    return '1000000000000000000'; // 1 DEV
  }

  public async getNonce(address: string, pending: boolean = false): Promise<number> {
    if (!this.mockConnected) {
      throw new Error('Not connected to Moonbeam network');
    }
    return this.mockNonce;
  }

  public async getNextNonce(address: string): Promise<number> {
    if (!this.mockConnected) {
      throw new Error('Not connected to Moonbeam network');
    }
    return this.mockNonce++;
  }

  public async getNonceInfo(address: string): Promise<NonceInfo> {
    if (!this.mockConnected) {
      throw new Error('Not connected to Moonbeam network');
    }
    return {
      nonce: this.mockNonce,
      pendingNonce: this.mockNonce,
      address,
    };
  }

  public async getTransactionStatus(txHash: string): Promise<MoonbeamTransactionStatus> {
    if (!this.mockConnected) {
      throw new Error('Not connected to Moonbeam network');
    }
    
    // Simulate transaction status
    return {
      hash: txHash,
      status: 'confirmed',
      blockNumber: this.mockBlockNumber,
      blockHash: '0x1234567890abcdef',
      confirmations: 1,
      gasUsed: BigInt(21000),
      effectiveGasPrice: BigInt(this.mockGasPrice),
      transactionFee: BigInt(21000) * BigInt(this.mockGasPrice),
      timestamp: Date.now(),
    };
  }

  public getProvider(): any {
    if (!this.mockConnected) {
      return null;
    }
    
    // Return a mock provider
    return {
      getNetwork: async () => ({ chainId: BigInt(1287) }),
      getBlockNumber: async () => this.mockBlockNumber,
      getFeeData: async () => ({
        gasPrice: BigInt(this.mockGasPrice),
        maxFeePerGas: BigInt('62500000'),
        maxPriorityFeePerGas: BigInt('0'),
      }),
      getBalance: async (address: string) => BigInt('1000000000000000000'),
      getTransactionCount: async (address: string) => this.mockNonce,
    };
  }

  public getCurrentNetwork(): MoonbeamNetwork {
    return this.currentNetwork;
  }

  public getConnectionStatus(): {
    connected: boolean;
    network: MoonbeamNetwork;
    connectedAt: string | null;
  } {
    return {
      connected: this.mockConnected,
      network: this.currentNetwork,
      connectedAt: this.mockConnected ? new Date().toISOString() : null,
    };
  }

  public setDebug(enabled: boolean): void {
    // Mock implementation
  }

  public get debug(): boolean {
    return false;
  }

  public async estimateGas(transaction: any): Promise<bigint> {
    // Mock gas estimation - return a reasonable default
    return BigInt(210000); // Standard gas limit for most transactions
  }

  // Mock-specific methods for testing
  public setTokenOwner(tokenId: string, owner: string): void {
    this.mockTokenOwnership.set(tokenId, owner);
  }

  public getTokenOwner(tokenId: string): string | undefined {
    return this.mockTokenOwnership.get(tokenId);
  }

  public setTokenMetadata(tokenId: string, metadata: any): void {
    this.mockTokenMetadata.set(tokenId, metadata);
  }

  public getTokenMetadata(tokenId: string): any | undefined {
    return this.mockTokenMetadata.get(tokenId);
  }
}
