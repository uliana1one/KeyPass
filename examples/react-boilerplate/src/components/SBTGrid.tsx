import React, { useState } from 'react';
import { SBTCard, SBTToken } from './SBTCard';
import './SBTCard.css';

interface SBTGridProps {
  tokens: SBTToken[];
  loading?: boolean;
  onTokenClick?: (token: SBTToken) => void;
  itemsPerPage?: number;
  showTransactionDetails?: boolean;
  transactionData?: Map<string, {
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: bigint;
  }>;
}

export const SBTGrid: React.FC<SBTGridProps> = ({ 
  tokens, 
  loading = false, 
  onTokenClick,
  itemsPerPage = 6,
  showTransactionDetails = false,
  transactionData = new Map()
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(tokens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTokens = tokens.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTokenClick = (token: SBTToken) => {
    if (onTokenClick) {
      onTokenClick(token);
    }
  };

  if (loading) {
    return (
      <div className="sbt-grid-loading">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="sbt-loading-card" />
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="sbt-empty-state">
        <svg className="sbt-empty-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <h3 className="sbt-empty-title">No Soulbound Tokens Found</h3>
        <p className="sbt-empty-description">
          This wallet doesn't have any Soulbound Tokens yet. SBTs will appear here once they are issued to this address.
        </p>
      </div>
    );
  }

  return (
    <div className="sbt-grid">
      {/* Token Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex + 1}-{Math.min(endIndex, tokens.length)} of {tokens.length} tokens
        </div>
      </div>

      {/* Token Grid */}
      {currentTokens.map((token) => {
        const txData = transactionData.get(token.id);
        return (
          <SBTCard 
            key={token.id} 
            token={token} 
            onClick={handleTokenClick}
            showTransactionDetails={showTransactionDetails}
            transactionHash={txData?.transactionHash}
            blockNumber={txData?.blockNumber}
            gasUsed={txData?.gasUsed}
          />
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sbt-pagination">
          <button
            className="secondary-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              className={`primary-button${currentPage === page ? ' active' : ''}`}
              onClick={() => handlePageChange(page)}
              disabled={currentPage === page}
            >
              {page}
            </button>
          ))}
          <button
            className="secondary-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}; 