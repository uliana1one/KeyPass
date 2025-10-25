import React from 'react';
import './SBTCard.css';

// Define the types locally since we can't import from the main src directory
export const SBTVerificationStatus = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  FAILED: 'failed',
  REVOKED: 'revoked',
  UNKNOWN: 'unknown',
} as const;

export type SBTVerificationStatus = (typeof SBTVerificationStatus)[keyof typeof SBTVerificationStatus];

export interface SBTTokenAttribute {
  trait_type: string;
  value: string | number | boolean;
  display_type?: string;
  max_value?: number;
}

export interface SBTToken {
  id: string;
  name: string;
  description: string;
  image: string;
  issuer: string;
  issuerName: string;
  issuedAt: string;
  expiresAt?: string;
  chainId: string;
  chainType: string;
  contractAddress: string;
  tokenStandard: string;
  tokenUri?: string;
  metadata?: any;
  verificationStatus: SBTVerificationStatus;
  attributes?: SBTTokenAttribute[];
  revocable: boolean;
  revokedAt?: string;
  collectionId?: string;
  rarityScore?: number;
  tags?: string[];
  [key: string]: any;
}

interface SBTCardProps {
  token: SBTToken;
  onClick?: (token: SBTToken) => void;
  showTransactionDetails?: boolean;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: bigint;
}

const getStatusColor = (status: SBTVerificationStatus): string => {
  switch (status) {
    case SBTVerificationStatus.VERIFIED:
      return 'sbt-status-verified';
    case SBTVerificationStatus.PENDING:
      return 'sbt-status-pending';
    case SBTVerificationStatus.FAILED:
      return 'sbt-status-failed';
    case SBTVerificationStatus.REVOKED:
      return 'sbt-status-revoked';
    default:
      return 'sbt-status-unknown';
  }
};

const getStatusText = (status: SBTVerificationStatus): string => {
  switch (status) {
    case SBTVerificationStatus.VERIFIED:
      return 'Verified';
    case SBTVerificationStatus.PENDING:
      return 'Pending';
    case SBTVerificationStatus.FAILED:
      return 'Failed';
    case SBTVerificationStatus.REVOKED:
      return 'Revoked';
    default:
      return 'Unknown';
  }
};

export const SBTCard: React.FC<SBTCardProps> = ({ 
  token, 
  onClick, 
  showTransactionDetails = false,
  transactionHash,
  blockNumber,
  gasUsed 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(token);
    }
  };

  const isExpired = token.expiresAt && new Date(token.expiresAt) < new Date();
  const isRevoked = token.verificationStatus === SBTVerificationStatus.REVOKED;

  const formatGas = (gas: bigint | undefined) => {
    if (!gas) return 'N/A';
    return gas.toString();
  };

  const getExplorerUrl = () => {
    if (!transactionHash) return null;
    // Moonbase Alpha explorer
    return `https://moonbase.moonscan.io/tx/${transactionHash}`;
  };

  return (
    <div 
      className={`sbt-card ${isExpired || isRevoked ? 'sbt-card-disabled' : ''}`}
      onClick={handleClick}
    >
      {/* Status Badge */}
      <div className="sbt-status-badge">
        <span className={`sbt-status ${getStatusColor(token.verificationStatus)}`}>
          {getStatusText(token.verificationStatus)}
        </span>
      </div>

      {/* Expired/Revoked Overlay */}
      {(isExpired || isRevoked) && (
        <div className="sbt-overlay">
          <span className="sbt-overlay-text">
            {isRevoked ? 'REVOKED' : 'EXPIRED'}
          </span>
        </div>
      )}

      {/* Token Image */}
      <div className="sbt-image-container">
        {token.image ? (
          <img 
            src={token.image} 
            alt={token.name}
            className="sbt-image"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`sbt-image-placeholder ${token.image ? 'hidden' : ''}`}>
          <svg className="sbt-placeholder-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Token Info */}
      <div className="sbt-content">
        <>
          <h3 className="sbt-title">
            {token.name}
          </h3>
          
          <p className="sbt-description">
            {token.description}
          </p>

          {/* Issuer Info */}
          <div className="sbt-issuer">
            <div className="sbt-issuer-avatar">
              <span className="sbt-issuer-initial">
                {token.issuerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="sbt-issuer-name">
              {token.issuerName}
            </span>
          </div>

          {/* Token Details */}
          <div className="sbt-details">
          <div className="sbt-detail-row">
            <span>Chain:</span>
            <span className="sbt-detail-value">{token.chainType}</span>
          </div>
          <div className="sbt-detail-row">
            <span>Issued:</span>
            <span className="sbt-detail-value">
              {new Date(token.issuedAt).toLocaleDateString()}
            </span>
          </div>
          {token.expiresAt && (
            <div className="sbt-detail-row">
              <span>Expires:</span>
              <span className={`sbt-detail-value ${isExpired ? 'sbt-expired' : ''}`}>
                {new Date(token.expiresAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {token.tags && token.tags.length > 0 && (
          <div className="sbt-tags">
            {token.tags.slice(0, 3).map((tag: string, index: number) => (
              <span 
                key={index}
                className="sbt-tag"
              >
                {tag}
              </span>
            ))}
            {token.tags.length > 3 && (
              <span className="sbt-tag-more">
                +{token.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Transaction Details */}
        {showTransactionDetails && (transactionHash || blockNumber || gasUsed) && (
          <div className="sbt-transaction-details">
            <div className="sbt-transaction-header">
              <svg className="sbt-transaction-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="sbt-transaction-title">Transaction Details</span>
            </div>
            
            <div className="sbt-transaction-info">
              <>
                {transactionHash && (
                <div className="sbt-transaction-row">
                  <span className="sbt-transaction-label">TX Hash:</span>
                  <div className="sbt-transaction-value">
                    <code className="sbt-transaction-hash">
                      {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                    </code>
                    {getExplorerUrl() && (
                      <a
                        href={getExplorerUrl()!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sbt-transaction-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {blockNumber && (
                <div className="sbt-transaction-row">
                  <span className="sbt-transaction-label">Block:</span>
                  <span className="sbt-transaction-value">{blockNumber.toLocaleString()}</span>
                </div>
              )}
              
              {gasUsed && (
                <div className="sbt-transaction-row">
                  <span className="sbt-transaction-label">Gas Used:</span>
                  <span className="sbt-transaction-value">{formatGas(gasUsed)}</span>
                </div>
              )}
              </>
            </div>
          </div>
        )}
      </>
      </div>
    </div>
  );
}; 