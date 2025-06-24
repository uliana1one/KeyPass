import React, { useState, useEffect } from 'react';
import { SBTGrid } from './SBTGrid';
import { SBTToken } from './SBTCard';
import { sbtService } from '../services/sbtService';

interface SBTSectionProps {
  userAddress: string;
}

export const SBTSection: React.FC<SBTSectionProps> = ({ userAddress }) => {
  const [tokens, setTokens] = useState<SBTToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<SBTToken | null>(null);

  useEffect(() => {
    loadTokens();
  }, [userAddress]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      setError(null);
      const userTokens = await sbtService.getTokens(userAddress);
      setTokens(userTokens);
    } catch (err) {
      setError('Failed to load Soulbound Tokens');
      console.error('Error loading SBTs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenClick = (token: SBTToken) => {
    setSelectedToken(token);
  };

  const handleCloseModal = () => {
    setSelectedToken(null);
  };

  const handleRefresh = () => {
    loadTokens();
  };

  return (
    <div className="sbt-section">
      <div className="sbt-section-header">
        <div>
          <h2 className="sbt-section-title">Soulbound Tokens</h2>
          <p className="sbt-section-subtitle">
            Your digital credentials and achievements on the blockchain
          </p>
        </div>
        <button
          className="sbt-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="sbt-error">
          <svg className="sbt-error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="sbt-error-text">{error}</span>
        </div>
      )}

      <SBTGrid
        tokens={tokens}
        loading={loading}
        onTokenClick={handleTokenClick}
      />

      {selectedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Token Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden">
                  {selectedToken.image ? (
                    <img 
                      src={selectedToken.image} 
                      alt={selectedToken.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {selectedToken.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedToken.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Issuer:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedToken.issuerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Chain:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedToken.chainType}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Issued:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedToken.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedToken.expiresAt && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedToken.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedToken.attributes && selectedToken.attributes.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Attributes</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedToken.attributes.map((attr, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{attr.trait_type}:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedToken.tags && selectedToken.tags.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Tags</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedToken.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Contract Information</h5>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Contract Address:</span>
                        <p className="font-mono text-gray-900 dark:text-white break-all">
                          {selectedToken.contractAddress}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Token ID:</span>
                        <p className="font-mono text-gray-900 dark:text-white">{selectedToken.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Standard:</span>
                        <p className="font-mono text-gray-900 dark:text-white">{selectedToken.tokenStandard}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 