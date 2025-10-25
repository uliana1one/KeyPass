// KILT Network Configuration for React Boilerplate
export interface KiltNetworkConfig {
  name: string;
  displayName: string;
  wssUrl: string;
  httpUrl?: string;
  chainId: number;
  ss58Format: number;
  tokenSymbol: string;
  tokenDecimals: number;
  isTestnet: boolean;
  faucetUrl?: string;
  explorerUrl?: string;
}

export const KILT_NETWORKS: Record<string, KiltNetworkConfig> = {
  spiritnet: {
    name: 'spiritnet',
    displayName: 'KILT Spiritnet',
    wssUrl: process.env.REACT_APP_KILT_WSS_URL || 'wss://spiritnet.kilt.io',
    httpUrl: 'https://spiritnet.kilt.io',
    chainId: parseInt(process.env.REACT_APP_KILT_CHAIN_ID || '38'),
    ss58Format: 38,
    tokenSymbol: 'KILT',
    tokenDecimals: 15,
    isTestnet: true,
    faucetUrl: 'https://faucet.kilt.io/',
    explorerUrl: 'https://spiritnet.subscan.io/'
  },
  peregrine: {
    name: 'peregrine',
    displayName: 'KILT Peregrine',
    wssUrl: 'wss://peregrine.kilt.io',
    httpUrl: 'https://peregrine.kilt.io',
    chainId: 38,
    ss58Format: 38,
    tokenSymbol: 'PILT',
    tokenDecimals: 15,
    isTestnet: true,
    faucetUrl: 'https://faucet.peregrine.kilt.io/',
    explorerUrl: 'https://peregrine.subscan.io/'
  },
  mainnet: {
    name: 'mainnet',
    displayName: 'KILT Mainnet',
    wssUrl: 'wss://kilt-rpc.dwellir.com',
    httpUrl: 'https://kilt-rpc.dwellir.com',
    chainId: 38,
    ss58Format: 38,
    tokenSymbol: 'KILT',
    tokenDecimals: 15,
    isTestnet: false,
    explorerUrl: 'https://kilt.subscan.io/'
  }
};

export const DEFAULT_KILT_NETWORK = process.env.REACT_APP_KILT_NETWORK || 'spiritnet';

export const getKiltNetworkConfig = (networkName?: string): KiltNetworkConfig => {
  const network = networkName || DEFAULT_KILT_NETWORK;
  return KILT_NETWORKS[network] || KILT_NETWORKS.spiritnet;
};

export const isKiltTestnet = (networkName?: string): boolean => {
  const config = getKiltNetworkConfig(networkName);
  return config.isTestnet;
};

export const getKiltFaucetUrl = (networkName?: string): string | undefined => {
  const config = getKiltNetworkConfig(networkName);
  return config.faucetUrl;
};

export const getKiltExplorerUrl = (networkName?: string): string | undefined => {
  const config = getKiltNetworkConfig(networkName);
  return config.explorerUrl;
};
