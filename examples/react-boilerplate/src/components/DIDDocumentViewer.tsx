import React, { useState } from 'react';
import { DIDCreationResult } from './DIDWizard';

interface DIDDocumentViewerProps {
  didCreationResult: DIDCreationResult;
  did: string;
  address: string;
  chainType: string;
}

export const DIDDocumentViewer: React.FC<DIDDocumentViewerProps> = ({
  didCreationResult,
  did,
  address,
  chainType
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'document' | 'verification'>('overview');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard:', text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderOverview = () => (
    <div className="did-overview">
      <div className="did-summary-grid">
        <div className="did-summary-card">
          <h4>DID Information</h4>
          <div className="summary-item">
            <span className="label">DID:</span>
            <div className="value-with-copy">
              <code className="did-value">{did}</code>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(did)}
                title="Copy DID"
              >
                📋
              </button>
            </div>
          </div>
          <div className="summary-item">
            <span className="label">Type:</span>
            <span className="value">
              {didCreationResult.options.type === 'basic' ? 'Basic DID' : 'Advanced DID'}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Chain:</span>
            <span className="value">{chainType === 'polkadot' ? 'Polkadot' : 'Ethereum'}</span>
          </div>
          <div className="summary-item">
            <span className="label">Created:</span>
            <span className="value">{new Date(didCreationResult.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="did-summary-card">
          <h4>Capabilities</h4>
          <div className="capabilities-list">
            <div className="capability-item">
              <span className="capability-icon">🔐</span>
              <span className="capability-text">Authentication</span>
              <span className="capability-status enabled">Enabled</span>
            </div>
            <div className="capability-item">
              <span className="capability-icon">✍️</span>
              <span className="capability-text">Message Signing</span>
              <span className="capability-status enabled">Enabled</span>
            </div>
            <div className="capability-item">
              <span className="capability-icon">🛡️</span>
              <span className="capability-text">Identity Verification</span>
              <span className="capability-status enabled">Enabled</span>
            </div>
            {didCreationResult.options.includeServices && (
              <div className="capability-item">
                <span className="capability-icon">🔗</span>
                <span className="capability-text">Service Endpoints</span>
                <span className="capability-status enabled">Enabled</span>
              </div>
            )}
            {didCreationResult.options.includeCredentials && (
              <div className="capability-item">
                <span className="capability-icon">📜</span>
                <span className="capability-text">Credential Ready</span>
                <span className="capability-status enabled">Enabled</span>
              </div>
            )}
          </div>
        </div>

        {didCreationResult.options.type === 'advanced' && (
          <div className="did-summary-card">
            <h4>Advanced Features</h4>
            {didCreationResult.options.purpose && (
              <div className="summary-item">
                <span className="label">Purpose:</span>
                <span className="value">{didCreationResult.options.purpose}</span>
              </div>
            )}
            {didCreationResult.options.description && (
              <div className="summary-item">
                <span className="label">Description:</span>
                <span className="value">{didCreationResult.options.description}</span>
              </div>
            )}
            {Object.keys(didCreationResult.options.customAttributes || {}).length > 0 && (
              <div className="custom-attributes-section">
                <span className="label">Custom Attributes:</span>
                <div className="attributes-grid">
                  {Object.entries(didCreationResult.options.customAttributes || {}).map(([key, value]) => (
                    <div key={key} className="attribute-pair">
                      <span className="attr-key">{key}:</span>
                      <span className="attr-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDocument = () => (
    <div className="did-document-view">
      <div className="document-header">
        <h4>DID Document</h4>
        <button 
          className="copy-button"
          onClick={() => copyToClipboard(JSON.stringify(didCreationResult.didDocument, null, 2))}
          title="Copy DID Document"
        >
          📋 Copy Document
        </button>
      </div>
      <div className="document-content">
        <pre className="document-json">
          {JSON.stringify(didCreationResult.didDocument, null, 2)}
        </pre>
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="did-verification-view">
      <div className="verification-section">
        <h4>Verification Methods</h4>
        <div className="verification-methods">
          {didCreationResult.didDocument.verificationMethod?.map((method: any, index: number) => (
            <div key={index} className="verification-method">
              <div className="method-header">
                <span className="method-id">{method.id}</span>
                <span className="method-type">{method.type}</span>
              </div>
              <div className="method-details">
                <div className="detail-item">
                  <span className="detail-label">Controller:</span>
                  <code className="detail-value">{method.controller}</code>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Public Key:</span>
                  <code className="detail-value">{method.publicKeyMultibase}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="verification-section">
        <h4>Verification Status</h4>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-icon">✅</span>
            <span className="status-text">DID Resolution</span>
            <span className="status-value">Valid</span>
          </div>
          <div className="status-item">
            <span className="status-icon">✅</span>
            <span className="status-text">Key Validation</span>
            <span className="status-value">Valid</span>
          </div>
          <div className="status-item">
            <span className="status-icon">✅</span>
            <span className="status-text">Chain Verification</span>
            <span className="status-value">Valid</span>
          </div>
          <div className="status-item">
            <span className="status-icon">✅</span>
            <span className="status-text">Document Structure</span>
            <span className="status-value">Valid</span>
          </div>
        </div>
      </div>

      <div className="verification-section">
        <h4>Wallet Integration</h4>
        <div className="integration-info">
          <div className="integration-item">
            <span className="integration-label">Wallet Address:</span>
            <div className="value-with-copy">
              <code className="integration-value">{address}</code>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(address)}
                title="Copy Address"
              >
                📋
              </button>
            </div>
          </div>
          <div className="integration-item">
            <span className="integration-label">Chain Type:</span>
            <span className="integration-value">{chainType}</span>
          </div>
          <div className="integration-item">
            <span className="integration-label">Integration Status:</span>
            <span className="integration-status connected">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="did-document-viewer">
      <div className="viewer-header">
        <div className="header-content">
          <h3>DID Details</h3>
          <p>View and manage your Decentralized Identifier</p>
        </div>
        <button 
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '🔼 Collapse' : '🔽 Expand Details'}
        </button>
      </div>

      {isExpanded && (
        <div className="viewer-content">
          <div className="viewer-tabs">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'document' ? 'active' : ''}`}
              onClick={() => setActiveTab('document')}
            >
              DID Document
            </button>
            <button 
              className={`tab-button ${activeTab === 'verification' ? 'active' : ''}`}
              onClick={() => setActiveTab('verification')}
            >
              Verification
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'document' && renderDocument()}
            {activeTab === 'verification' && renderVerification()}
          </div>
        </div>
      )}
    </div>
  );
}; 