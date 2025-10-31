import React, { useState } from 'react';
import { VerifiableCredential, CredentialStatus, PrivacyLevel } from '../types/credential';

interface CredentialCardProps {
  credential: VerifiableCredential;
  onShare?: (credentialId: string, selectiveFields?: string[]) => void;
  onRevoke?: (credentialId: string) => void;
  onViewDetails?: (credential: VerifiableCredential) => void;
  compact?: boolean;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  credential,
  onShare,
  onRevoke,
  onViewDetails,
  compact = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);

  const getStatusIcon = (status: CredentialStatus): string => {
    switch (status) {
      case CredentialStatus.VALID: return '✅';
      case CredentialStatus.EXPIRED: return '⏰';
      case CredentialStatus.REVOKED: return '❌';
      case CredentialStatus.SUSPENDED: return '⏸️';
      case CredentialStatus.PENDING: return '🔄';
      default: return '❓';
    }
  };

  const getStatusColor = (status: CredentialStatus): string => {
    switch (status) {
      case CredentialStatus.VALID: return 'credential-status-valid';
      case CredentialStatus.EXPIRED: return 'credential-status-expired';
      case CredentialStatus.REVOKED: return 'credential-status-revoked';
      case CredentialStatus.SUSPENDED: return 'credential-status-suspended';
      case CredentialStatus.PENDING: return 'credential-status-pending';
      default: return 'credential-status-unknown';
    }
  };

  const getPrivacyIcon = (privacy: PrivacyLevel): string => {
    switch (privacy) {
      case PrivacyLevel.PUBLIC: return '🌐';
      case PrivacyLevel.SELECTIVE: return '🔒';
      case PrivacyLevel.ZERO_KNOWLEDGE: return '🔐';
      case PrivacyLevel.PRIVATE: return '🔒';
      default: return '🔒';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (): boolean => {
    if (!credential.expirationDate) return false;
    return new Date(credential.expirationDate) < new Date();
  };

  const getCredentialType = (): string => {
    return credential.type.find(t => t !== 'VerifiableCredential') || 'Unknown';
  };

  const handleShare = () => {
    if (onShare) {
      onShare(credential.id);
    }
  };

  const handleRevoke = () => {
    if (onRevoke && window.confirm('Are you sure you want to revoke this credential?')) {
      onRevoke(credential.id);
    }
  };

  const renderCredentialSubject = () => {
    const subject = credential.credentialSubject;
    const displayFields = Object.entries(subject)
      .filter(([key]) => key !== 'id')
      .slice(0, compact ? 2 : 4);

    return (
      <div className="credential-subject">
        {displayFields.map(([key, value]) => (
          <div key={key} className="credential-field">
            <span className="field-label">{key}:</span>
            <span className="field-value">{String(value)}</span>
          </div>
        ))}
        {Object.keys(subject).length > (compact ? 3 : 5) && (
          <div className="field-more">
            +{Object.keys(subject).length - (compact ? 3 : 5)} more fields
          </div>
        )}
      </div>
    );
  };

  const renderZKProofBadge = () => {
    if (credential.proof.zkProof) {
      return (
        <div className="zk-proof-badge" title="Zero-Knowledge Proof Enabled">
          🔐 ZK-Proof
        </div>
      );
    }
    return null;
  };

  const renderKiltProofBadge = () => {
    if (credential.proof.kiltProof) {
      return (
        <div className="kilt-proof-badge" title="KILT Attestation Proof">
          🏆 KILT Proof
        </div>
      );
    }
    return null;
  };

  const renderChainTypeBadge = () => {
    if (credential.metadata?.chainType === 'kilt') {
      return (
        <div className="chain-type-badge kilt" title="KILT Blockchain">
          🔗 KILT
        </div>
      );
    } else if (credential.metadata?.chainType === 'ethereum') {
      return (
        <div className="chain-type-badge ethereum" title="Ethereum Blockchain">
          🔗 ETH
        </div>
      );
    } else if (credential.metadata?.chainType === 'polkadot') {
      return (
        <div className="chain-type-badge polkadot" title="Polkadot Blockchain">
          🔗 DOT
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={`credential-card ${compact ? 'compact' : ''} ${getStatusColor(credential.status)}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="credential-header">
        <div className="credential-type-section">
          <div className="credential-type">
            {getCredentialType()}
          </div>
          <div className="credential-status">
            <span className="status-icon">{getStatusIcon(credential.status)}</span>
            <span className="status-text">{credential.status}</span>
          </div>
        </div>
        
        <div className="credential-badges">
          {renderZKProofBadge()}
          {renderKiltProofBadge()}
          {renderChainTypeBadge()}
          <div className="privacy-badge" title={`Privacy Level: ${credential.metadata?.privacy || 'Unknown'}`}>
            {getPrivacyIcon(credential.metadata?.privacy)}
          </div>
        </div>
      </div>

      <div className="credential-issuer">
        {credential.issuer.logo && (
          <img 
            src={credential.issuer.logo} 
            alt={credential.issuer.name}
            className="issuer-logo"
          />
        )}
        <div className="issuer-info">
          <div className="issuer-name">{credential.issuer.name}</div>
          <div className="issuer-id">{credential.issuer.id}</div>
        </div>
      </div>

      {!compact && renderCredentialSubject()}

      <div className="credential-dates">
        <div className="date-item">
          <span className="date-label">Issued:</span>
          <span className="date-value">{formatDate(credential.issuanceDate)}</span>
        </div>
        {credential.expirationDate && (
          <div className="date-item">
            <span className="date-label">Expires:</span>
            <span className={`date-value ${isExpired() ? 'expired' : ''}`}>
              {formatDate(credential.expirationDate)}
            </span>
          </div>
        )}
      </div>

      <div className="credential-metadata">
        <div className="metadata-item">
          <span className="metadata-label">Privacy:</span>
          <span className="metadata-value">{credential.metadata?.privacy || 'Unknown'}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Revocable:</span>
          <span className="metadata-value">{credential.metadata?.revocable ? 'Yes' : 'No'}</span>
        </div>
        {credential.metadata?.chainType && (
          <div className="metadata-item">
            <span className="metadata-label">Blockchain:</span>
            <span className="metadata-value">{credential.metadata.chainType.toUpperCase()}</span>
          </div>
        )}
        {credential.proof.kiltProof && (
          <div className="metadata-item">
            <span className="metadata-label">Attestation Hash:</span>
            <span className="metadata-value kilt-hash">
              {credential.proof.kiltProof.attestationHash.slice(0, 8)}...{credential.proof.kiltProof.attestationHash.slice(-8)}
            </span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="credential-actions">
          <button 
            className="action-button view"
            onClick={() => onViewDetails?.(credential)}
            title="View Details"
          >
            View
          </button>
          
          {onShare && (
            <button 
              className="action-button share"
              onClick={handleShare}
              title="Share Credential"
            >
              Share
            </button>
          )}
          
          {credential.metadata?.revocable && onRevoke && (
            <button 
              className="action-button revoke"
              onClick={handleRevoke}
              title="Revoke Credential"
            >
              Revoke
            </button>
          )}
          
          <button 
            className="action-button privacy"
            onClick={() => setShowPrivacyControls(!showPrivacyControls)}
            title="Privacy Controls"
          >
            Privacy
          </button>
        </div>
      )}

      {showPrivacyControls && (
        <div className="privacy-controls">
          <h4>Privacy Controls</h4>
          <div className="privacy-option">
            <input type="checkbox" id={`selective-${credential.id}`} />
            <label htmlFor={`selective-${credential.id}`}>
              Enable selective disclosure
            </label>
          </div>
          <div className="privacy-option">
            <input type="checkbox" id={`zk-proof-${credential.id}`} />
            <label htmlFor={`zk-proof-${credential.id}`}>
              Require zero-knowledge proof
            </label>
          </div>
          <div className="privacy-fields">
            <label>Fields to share:</label>
            {Object.keys(credential.credentialSubject)
              .filter(key => key !== 'id')
              .map(field => (
                <div key={field} className="field-checkbox">
                  <input type="checkbox" id={`field-${credential.id}-${field}`} defaultChecked />
                  <label htmlFor={`field-${credential.id}-${field}`}>{field}</label>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}; 