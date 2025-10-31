// MoonbeamAdapter for React boilerplate
import { ethers } from 'ethers';

export enum MoonbeamNetwork {
  MOONBASE_ALPHA = 'moonbase-alpha',
  MOONBEAM = 'moonbeam'
}

export interface MoonbeamNetworkInfo {
  chainId: number;
  name: string;
  network: MoonbeamNetwork;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: string;
  nativeTokenDecimals: number;
  currentBlockNumber: number;
  gasPrice: string;
  connected: boolean;
  connectedAt: string;
}

export class MoonbeamAdapter {
  private provider: ethers.JsonRpcProvider | null = null;
  private connected: boolean = false;
  private connectedAt: string = '';
  private currentNetwork: MoonbeamNetwork;

  constructor(network: MoonbeamNetwork = MoonbeamNetwork.MOONBASE_ALPHA) {
    this.currentNetwork = network;
  }

  async connect(): Promise<MoonbeamNetworkInfo> {
    try {
      const rpcUrl = this.currentNetwork === MoonbeamNetwork.MOONBASE_ALPHA 
        ? 'https://rpc.api.moonbase.moonbeam.network'
        : 'https://rpc.api.moonbeam.network';
      
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      
      this.connected = true;
      this.connectedAt = new Date().toISOString();

      return {
        chainId: Number(network.chainId),
        name: this.currentNetwork === MoonbeamNetwork.MOONBASE_ALPHA ? 'Moonbase Alpha' : 'Moonbeam',
        network: this.currentNetwork,
        rpcUrl,
        explorerUrl: this.currentNetwork === MoonbeamNetwork.MOONBASE_ALPHA 
          ? 'https://moonbase.moonscan.io' 
          : 'https://moonscan.io',
        nativeToken: 'DEV',
        nativeTokenDecimals: 18,
        currentBlockNumber: blockNumber,
        gasPrice: feeData.gasPrice?.toString() || '1000000000',
        connected: true,
        connectedAt: this.connectedAt
      };
    } catch (error) {
      throw new Error(`Failed to connect to Moonbeam: ${error}`);
    }
  }

  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  isConnected(): boolean {
    return this.connected;
  }
}