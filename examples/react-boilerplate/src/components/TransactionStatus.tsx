import React from 'react';
import { ethers } from 'ethers';

export interface TransactionStatusProps {
  status: 'idle' | 'preparing' | 'minting' | 'confirming' | 'success' | 'error';
  progress?: number;
  message?: string;
  error?: string;
  transactionHash?: string;
  gasEstimate?: bigint;
  gasUsed?: bigint;
  gasPrice?: bigint;
  blockNumber?: number;
  result?: {
    tokenId: string;
    transactionHash: string;
    blockNumber: number;
    gasUsed: bigint;
    metadataUri: string;
    contractAddress: string;
    recipient: string;
    mintedAt: string;
  };
  onClose?: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  progress = 0,
  message,
  error,
  transactionHash,
  gasEstimate,
  gasUsed,
  gasPrice,
  blockNumber,
  result,
  onClose,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'preparing':
      case 'minting':
      case 'confirming': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'preparing':
      case 'minting':
      case 'confirming':
        return (
          <div className="animate-spin">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatGas = (gas: bigint | undefined) => {
    if (!gas) return 'N/A';
    return gas.toString();
  };

  const formatGasPrice = (price: bigint | undefined) => {
    if (!price) return 'N/A';
    return `${ethers.formatUnits(price, 'gwei')} Gwei`;
  };

  const formatGasCost = (gas: bigint | undefined, price: bigint | undefined) => {
    if (!gas || !price) return 'N/A';
    const cost = gas * price;
    return `${ethers.formatEther(cost)} ETH`;
  };

  const getExplorerUrl = () => {
    if (!transactionHash) return null;
    // Moonbase Alpha explorer
    return `https://moonbase.moonscan.io/tx/${transactionHash}`;
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
      <div className={`max-w-md w-full mx-4 bg-white rounded-lg shadow-xl border-2 ${getStatusColor()}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <h3 className="text-lg font-semibold">
              {status === 'success' && 'Transaction Successful'}
              {status === 'error' && 'Transaction Failed'}
              {status === 'preparing' && 'Preparing Transaction'}
              {status === 'minting' && 'Minting SBT'}
              {status === 'confirming' && 'Confirming Transaction'}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <>
            {/* Progress Bar */}
            {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <p className="text-sm text-gray-700">{message}</p>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Transaction Hash */}
          {transactionHash && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Transaction Hash</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-xs bg-gray-100 p-2 rounded font-mono break-all">
                  {transactionHash}
                </code>
                {getExplorerUrl() && (
                  <a
                    href={getExplorerUrl()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Gas Information */}
          {(gasEstimate || gasUsed || gasPrice) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gas Information</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <>
                  {gasEstimate && (
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">Estimated</div>
                    <div className="text-gray-600">{formatGas(gasEstimate)}</div>
                  </div>
                )}
                {gasUsed && (
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">Used</div>
                    <div className="text-gray-600">{formatGas(gasUsed)}</div>
                  </div>
                )}
                {gasPrice && (
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">Gas Price</div>
                    <div className="text-gray-600">{formatGasPrice(gasPrice)}</div>
                  </div>
                )}
                {gasUsed && gasPrice && (
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">Total Cost</div>
                    <div className="text-gray-600">{formatGasCost(gasUsed, gasPrice)}</div>
                  </div>
                )}
                </>
              </div>
            </div>
          )}

          {/* Block Number */}
          {blockNumber && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Block Number</label>
              <div className="text-sm text-gray-600">{blockNumber.toLocaleString()}</div>
            </div>
          )}

          {/* Success Result */}
          {status === 'success' && result && (
            <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">SBT Minted Successfully!</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Token ID:</span>
                  <span className="font-mono text-green-800">{result.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Recipient:</span>
                  <span className="font-mono text-green-800 text-xs">
                    {result.recipient.slice(0, 6)}...{result.recipient.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Contract:</span>
                  <span className="font-mono text-green-800 text-xs">
                    {result.contractAddress.slice(0, 6)}...{result.contractAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Minted At:</span>
                  <span className="text-green-800">
                    {new Date(result.mintedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          </>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          {status === 'success' && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          )}
          {status === 'error' && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          )}
          {(status === 'preparing' || status === 'minting' || status === 'confirming') && (
            <button
              onClick={onClose}
              disabled
              className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
            >
              Processing...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionStatus;
