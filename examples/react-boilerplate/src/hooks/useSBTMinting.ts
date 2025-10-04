import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  sbtService, 
  SBTMintRequest, 
  SBTMintResult, 
  SBTMintStatus 
} from '../services/sbtService';

export interface UseSBTMintingReturn {
  // State
  status: SBTMintStatus;
  isMinting: boolean;
  isAvailable: boolean;
  providerStatus: ReturnType<typeof sbtService.getProviderStatus>;
  
  // Actions
  mintSBT: (request: SBTMintRequest, signer: ethers.Signer) => Promise<SBTMintResult>;
  setContract: (contractAddress: string) => void;
  resetStatus: () => void;
  connectProvider: (signer: ethers.Signer) => Promise<boolean>;
  disconnectProvider: () => Promise<void>;
}

export function useSBTMinting(): UseSBTMintingReturn {
  const [status, setStatus] = useState<SBTMintStatus>(sbtService.getMintingStatus());
  const [isAvailable, setIsAvailable] = useState<boolean>(sbtService.isMintingAvailable());
  const [providerStatus, setProviderStatus] = useState(sbtService.getProviderStatus());

  // Subscribe to status updates
  useEffect(() => {
    const unsubscribe = sbtService.onMintingStatusUpdate((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  // Update availability and provider status
  useEffect(() => {
    setIsAvailable(sbtService.isMintingAvailable());
    setProviderStatus(sbtService.getProviderStatus());
  }, [status]);

  // Mint SBT function
  const mintSBT = useCallback(async (
    request: SBTMintRequest,
    signer: ethers.Signer
  ): Promise<SBTMintResult> => {
    try {
      const result = await sbtService.mintSBT(request, signer);
      return result;
    } catch (error) {
      // Error is already handled by the service and reflected in status
      throw error;
    }
  }, []);

  // Set contract function
  const setContract = useCallback((contractAddress: string) => {
    sbtService.setContract(contractAddress);
    setIsAvailable(sbtService.isMintingAvailable());
  }, []);

  // Reset status function
  const resetStatus = useCallback(() => {
    sbtService.resetMintingStatus();
  }, []);

  // Connect provider function
  const connectProvider = useCallback(async (signer: ethers.Signer): Promise<boolean> => {
    try {
      const connected = await sbtService.connectProvider(signer);
      setProviderStatus(sbtService.getProviderStatus());
      return connected;
    } catch (error) {
      console.error('Failed to connect provider:', error);
      return false;
    }
  }, []);

  // Disconnect provider function
  const disconnectProvider = useCallback(async () => {
    try {
      await sbtService.disconnectProvider();
      setProviderStatus(sbtService.getProviderStatus());
    } catch (error) {
      console.error('Failed to disconnect provider:', error);
    }
  }, []);

  const isMinting = status.status === 'preparing' || 
                   status.status === 'minting' || 
                   status.status === 'confirming';

  return {
    status,
    isMinting,
    isAvailable,
    providerStatus,
    mintSBT,
    setContract,
    resetStatus,
    connectProvider,
    disconnectProvider,
  };
}
