import React, { useState } from 'react';
import { ethers } from 'ethers';

export interface TransactionHistoryItem {
  id: string;
  tokenId: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  metadataUri: string;
  contractAddress: string;
  recipient: string;
  mintedAt: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}

interface TransactionHistoryProps {
  transactions: TransactionHistoryItem[];
  onClearHistory?: () => void;
  onViewTransaction?: (transactionHash: string) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onClearHistory,
  onViewTransaction,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'pending':
        return (
          <div className="animate-spin">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getExplorerUrl = (transactionHash: string) => {
    return `https://moonbase.moonscan.io/tx/${transactionHash}`;
  };

  const formatGas = (gas: bigint) => {
    return gas.toString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
          <p className="text-gray-600">Mint your first SBT to see transaction history here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </span>
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(transaction.status)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      SBT Mint #{transaction.tokenId}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(transaction.mintedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleExpanded(transaction.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg 
                    className={`w-5 h-5 transform transition-transform ${expandedItems.has(transaction.id) ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {onViewTransaction && (
                  <button
                    onClick={() => onViewTransaction(transaction.transactionHash)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedItems.has(transaction.id) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Transaction Hash:</span>
                    <div className="flex items-center space-x-2">
                      <code className="font-mono text-xs bg-white px-2 py-1 rounded">
                        {formatAddress(transaction.transactionHash)}
                      </code>
                      <a
                        href={getExplorerUrl(transaction.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Block Number:</span>
                    <div className="text-gray-900">{transaction.blockNumber.toLocaleString()}</div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Gas Used:</span>
                    <div className="text-gray-900">{formatGas(transaction.gasUsed)}</div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Recipient:</span>
                    <div className="text-gray-900 font-mono text-xs">
                      {formatAddress(transaction.recipient)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Contract:</span>
                    <div className="text-gray-900 font-mono text-xs">
                      {formatAddress(transaction.contractAddress)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Token ID:</span>
                    <div className="text-gray-900 font-mono">{transaction.tokenId}</div>
                  </div>
                </div>

                {transaction.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="font-medium text-red-800 mb-1">Error:</div>
                    <div className="text-sm text-red-700">{transaction.error}</div>
                  </div>
                )}

                {transaction.metadataUri && (
                  <div>
                    <span className="font-medium text-gray-700">Metadata URI:</span>
                    <div className="text-xs text-gray-600 break-all bg-white p-2 rounded mt-1">
                      {transaction.metadataUri}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
