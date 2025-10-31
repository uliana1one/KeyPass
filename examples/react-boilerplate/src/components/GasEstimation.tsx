import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface GasEstimationProps {
  contractAddress?: string;
  recipient?: string;
  metadataUri?: string;
  signer?: ethers.Signer;
  onEstimate?: (estimate: GasEstimationResult) => void;
  onError?: (error: string) => void;
}

export interface GasEstimationResult {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostInETH: string;
  estimatedCostInUSD?: string;
}

export const GasEstimation: React.FC<GasEstimationProps> = ({
  contractAddress,
  recipient,
  metadataUri,
  signer,
  onEstimate,
  onError,
}) => {
  const [estimate, setEstimate] = useState<GasEstimationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimateGas = async () => {
    if (!contractAddress || !recipient || !metadataUri || !signer) {
      setError('Missing required parameters for gas estimation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Basic ERC-721 ABI for minting
      const abi = [
        'function mint(address to, string memory uri) external returns (uint256)',
        'function safeMint(address to, string memory uri) external returns (uint256)',
      ];

      // Connect to the contract
      const provider = signer.provider;
      if (!provider) {
        throw new Error('Provider not available');
      }

      const contract = new ethers.Contract(contractAddress, abi, provider);
      const contractWithSigner = contract.connect(signer);

      // Estimate gas for minting
      const gasLimit = await (contractWithSigner as any).mint.estimateGas(recipient, metadataUri);

      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);

      // Calculate estimated cost
      const estimatedCost = gasLimit * gasPrice;
      const estimatedCostInETH = ethers.formatEther(estimatedCost);

      // Try to get EIP-1559 fees
      let maxFeePerGas: bigint | undefined;
      let maxPriorityFeePerGas: bigint | undefined;

      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        maxFeePerGas = feeData.maxFeePerGas;
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      }

      const result: GasEstimationResult = {
        gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimatedCost,
        estimatedCostInETH,
      };

      setEstimate(result);
      onEstimate?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to estimate gas';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auto-estimate when parameters change
  useEffect(() => {
    if (contractAddress && recipient && metadataUri && signer) {
      estimateGas();
    } else {
      setEstimate(null);
      setError(null);
    }
  }, [contractAddress, recipient, metadataUri, signer]);

  const formatGas = (gas: bigint) => {
    return gas.toString();
  };

  const formatGasPrice = (price: bigint) => {
    return `${ethers.formatUnits(price, 'gwei')} Gwei`;
  };

  const formatEIP1559Fee = (fee: bigint) => {
    return `${ethers.formatUnits(fee, 'gwei')} Gwei`;
  };

  if (!contractAddress || !recipient || !metadataUri) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">Fill in contract address, recipient, and metadata to estimate gas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gas Estimation</h3>
        <button
          onClick={estimateGas}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Estimating...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <span className="text-sm">Estimating gas costs...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {estimate && !loading && (
        <div className="space-y-3">
          {/* Gas Limit */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-700 mb-1">Gas Limit</div>
                <div className="text-gray-900 font-mono">{formatGas(estimate.gasLimit)}</div>
              </div>

              {/* Gas Price */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-700 mb-1">Gas Price</div>
                <div className="text-gray-900">{formatGasPrice(estimate.gasPrice)}</div>
              </div>

              {/* EIP-1559 Fees (if available) */}
              {estimate.maxFeePerGas && estimate.maxPriorityFeePerGas && (
                <>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-blue-700 mb-1">Max Fee Per Gas</div>
                    <div className="text-blue-900">{formatEIP1559Fee(estimate.maxFeePerGas)}</div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-blue-700 mb-1">Max Priority Fee</div>
                    <div className="text-blue-900">{formatEIP1559Fee(estimate.maxPriorityFeePerGas)}</div>
                  </div>
                </>
              )}
            </>
          </div>

          {/* Total Cost */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-green-800">Estimated Cost</div>
                <div className="text-sm text-green-600">Total transaction cost</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-800">
                  {estimate.estimatedCostInETH} ETH
                </div>
                {estimate.estimatedCostInUSD && (
                  <div className="text-sm text-green-600">
                    ≈ ${estimate.estimatedCostInUSD} USD
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Gas Limit: {formatGas(estimate.gasLimit)}</div>
            <div>Gas Price: {formatGasPrice(estimate.gasPrice)}</div>
            <div>Total: {formatGas(estimate.gasLimit)} × {formatGasPrice(estimate.gasPrice)} = {estimate.estimatedCostInETH} ETH</div>
          </div>

          {/* Warning for high costs */}
          {estimate.estimatedCost > BigInt('1000000000000000000') && ( // > 1 ETH
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm text-yellow-700">
                  High gas cost detected. Consider waiting for lower network congestion.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GasEstimation;
