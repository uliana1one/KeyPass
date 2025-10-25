import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSBTMinting } from '../hooks/useSBTMinting';
import { SBTMintRequest } from '../services/sbtService';
import TransactionStatus from './TransactionStatus';
import GasEstimation from './GasEstimation';

interface SBTMintingComponentProps {
  contractAddress?: string;
  onMintingComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export const SBTMintingComponent: React.FC<SBTMintingComponentProps> = ({
  contractAddress,
  onMintingComplete,
  onError,
}) => {
  const {
    status,
    isMinting,
    isAvailable,
    providerStatus,
    mintSBT,
    setContract,
    resetStatus,
    connectProvider,
  } = useSBTMinting();

  const [formData, setFormData] = useState({
    recipient: '',
    name: '',
    description: '',
    image: '',
    contractAddress: contractAddress || '',
  });

  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showTransactionStatus, setShowTransactionStatus] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<any>(null);

  // Set contract when contractAddress prop changes
  useEffect(() => {
    if (contractAddress) {
      setContract(contractAddress);
      setFormData(prev => ({ ...prev, contractAddress }));
    }
  }, [contractAddress, setContract]);

  // Handle minting completion
  useEffect(() => {
    if (status.status === 'success' && status.result) {
      onMintingComplete?.(status.result);
    } else if (status.status === 'error' && status.error) {
      onError?.(status.error);
    }
  }, [status, onMintingComplete, onError]);

  // Show transaction status when minting starts
  useEffect(() => {
    if (status.status === 'preparing' || status.status === 'minting' || status.status === 'confirming') {
      setShowTransactionStatus(true);
    }
  }, [status.status]);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await provider.getSigner();
        
        setSigner(newSigner);
        setWalletConnected(true);
        
        // Connect provider to service
        await connectProvider(newSigner);
        
        // Get wallet address for recipient field
        const address = await newSigner.getAddress();
        setFormData(prev => ({ ...prev, recipient: address }));
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.contractAddress) {
      alert('Please set a contract address');
      return;
    }

    if (!isAvailable) {
      alert('SBT minting is not available');
      return;
    }

    try {
      const request: SBTMintRequest = {
        contractAddress: formData.contractAddress,
        recipient: formData.recipient,
        metadata: {
          name: formData.name,
          description: formData.description,
          image: formData.image,
          attributes: [
            { trait_type: 'Type', value: 'Soulbound Token' },
            { trait_type: 'Minted At', value: new Date().toISOString() },
          ],
        },
      };

      await mintSBT(request, signer);
    } catch (error) {
      console.error('Minting failed:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Get status color for UI
  const getStatusColor = () => {
    switch (status.status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'preparing':
      case 'minting':
      case 'confirming': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Mint SBT</h2>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Status:</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </span>
        </div>
        
        {status.message && (
          <p className="text-sm text-gray-600 mb-2">{status.message}</p>
        )}
        
        {status.progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        )}
        
        {status.transactionHash && (
          <p className="text-xs text-gray-500 mt-2">
            TX: {status.transactionHash.slice(0, 10)}...{status.transactionHash.slice(-8)}
          </p>
        )}
        
        {status.error && (
          <p className="text-sm text-red-600 mt-2">{status.error}</p>
        )}
      </div>

      {/* Provider Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Provider:</span>
          <span className={`text-sm ${providerStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
            {providerStatus.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {providerStatus.network && (
          <p className="text-xs text-gray-600 mt-1">Network: {providerStatus.network}</p>
        )}
      </div>

      {/* Wallet Connection */}
      {!walletConnected ? (
        <button
          onClick={connectWallet}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-6"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="mb-6 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600">✓ Wallet Connected</p>
        </div>
      )}

      {/* Minting Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contractAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Contract Address
          </label>
          <input
            type="text"
            id="contractAddress"
            name="contractAddress"
            value={formData.contractAddress}
            onChange={handleInputChange}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            id="recipient"
            name="recipient"
            value={formData.recipient}
            onChange={handleInputChange}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Token Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="My Soulbound Token"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description of the soulbound token..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleInputChange}
            placeholder="https://example.com/image.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Gas Estimation */}
        {walletConnected && signer && formData.contractAddress && formData.recipient && (
          <div className="mt-6">
            <GasEstimation
              contractAddress={formData.contractAddress}
              recipient={formData.recipient}
              metadataUri={`data:application/json,${encodeURIComponent(JSON.stringify({
                name: formData.name,
                description: formData.description,
                image: formData.image,
              }))}`}
              signer={signer}
              onEstimate={setGasEstimate}
              onError={(error) => console.warn('Gas estimation error:', error)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isMinting || !isAvailable || !walletConnected}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isMinting ? 'Minting...' : 'Mint SBT'}
          </button>
          
          <button
            type="button"
            onClick={resetStatus}
            disabled={isMinting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Success Result */}
      {status.status === 'success' && status.result && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Minting Successful!</h3>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Token ID:</strong> {status.result.tokenId}</p>
            <p><strong>Transaction:</strong> {status.result.transactionHash}</p>
            <p><strong>Block:</strong> {status.result.blockNumber}</p>
            <p><strong>Gas Used:</strong> {status.result.gasUsed?.toString() || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Transaction Status Modal */}
      {showTransactionStatus && (
        <TransactionStatus
          status={status.status}
          progress={status.progress}
          message={status.message}
          error={status.error}
          transactionHash={status.transactionHash}
          gasEstimate={gasEstimate?.gasLimit}
          gasUsed={status.result?.gasUsed}
          gasPrice={gasEstimate?.gasPrice}
          blockNumber={status.result?.blockNumber}
          result={status.result}
          onClose={() => {
            setShowTransactionStatus(false);
            if (status.status === 'success' || status.status === 'error') {
              resetStatus();
            }
          }}
        />
      )}
    </div>
  );
};

export default SBTMintingComponent;
