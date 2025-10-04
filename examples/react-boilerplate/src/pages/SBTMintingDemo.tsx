import React, { useState } from 'react';
import SBTMintingComponent from '../components/SBTMintingComponent';

export const SBTMintingDemo: React.FC = () => {
  const [mintingResults, setMintingResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleMintingComplete = (result: any) => {
    setMintingResults(prev => [result, ...prev]);
    console.log('Minting completed:', result);
  };

  const handleError = (error: string) => {
    setErrors(prev => [error, ...prev]);
    console.error('Minting error:', error);
  };

  const clearResults = () => {
    setMintingResults([]);
    setErrors([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SBT Minting Demo
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This demo shows how to mint Soulbound Tokens (SBTs) using the KeyPass SBT service.
            Connect your wallet and deploy an SBT contract to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Minting Component */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Mint New SBT</h2>
            <SBTMintingComponent
              onMintingComplete={handleMintingComplete}
              onError={handleError}
            />
          </div>

          {/* Results and Errors */}
          <div className="space-y-6">
            {/* Recent Results */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Results</h2>
                <button
                  onClick={clearResults}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
              
              {mintingResults.length === 0 ? (
                <p className="text-gray-500 text-sm">No minting results yet</p>
              ) : (
                <div className="space-y-3">
                  {mintingResults.slice(0, 3).map((result, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">
                          SBT Minted Successfully
                        </span>
                        <span className="text-xs text-green-600">
                          {new Date(result.mintedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-green-700 space-y-1">
                        <p><strong>Token ID:</strong> {result.tokenId}</p>
                        <p><strong>TX:</strong> {result.transactionHash.slice(0, 10)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Errors */}
            {errors.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-red-600">Recent Errors</h2>
                <div className="space-y-3">
                  {errors.slice(0, 3).map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                How to Use
              </h3>
              <ol className="text-sm text-blue-800 space-y-2">
                <li>1. Connect your Web3 wallet (MetaMask recommended)</li>
                <li>2. Set the SBT contract address</li>
                <li>3. Fill in the token metadata</li>
                <li>4. Click "Mint SBT" to create your soulbound token</li>
                <li>5. Wait for transaction confirmation</li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-100 rounded">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> This demo uses Moonbase Alpha testnet. 
                  Make sure your wallet is connected to the correct network.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Network Information */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Network Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-900">Moonbase Alpha</h3>
              <p className="text-gray-600">Chain ID: 1287</p>
              <p className="text-gray-600">RPC: https://rpc.api.moonbase.moonbeam.network</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-900">Moonbeam</h3>
              <p className="text-gray-600">Chain ID: 1284</p>
              <p className="text-gray-600">RPC: https://rpc.api.moonbeam.network</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-900">Moonriver</h3>
              <p className="text-gray-600">Chain ID: 1285</p>
              <p className="text-gray-600">RPC: https://rpc.api.moonriver.moonbeam.network</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SBTMintingDemo;
