import React, { useState, useEffect } from 'react';
import { CredentialCard } from './CredentialCard';
import { CredentialRequestWizard } from './CredentialRequestWizard';
import { ZKProofGenerator } from './ZKProofGenerator';
import { 
  VerifiableCredential, 
  CredentialRequest, 
  CredentialOffer,
  CredentialStatus,
  RequestStatus,
  OfferStatus,
  ZKProof 
} from '../types/credential';
import { credentialService, CredentialService } from '../services/credentialService';
import { zkProofService, generateAgeVerificationProof, generateStudentStatusProof } from '../services/zkProofService';

interface CredentialSectionProps {
  did: string;
  walletAddress: string;
  chainType: 'polkadot' | 'ethereum' | 'kilt';
  useRealData?: boolean; // Toggle between real and mock data
}

type TabType = 'credentials' | 'requests' | 'offers' | 'zkproofs';

export const CredentialSection: React.FC<CredentialSectionProps> = ({
  did,
  walletAddress,
  chainType,
  useRealData = false // Default to mock data for safety
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('credentials');
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [requests, setRequests] = useState<CredentialRequest[]>([]);
  const [offers, setOffers] = useState<CredentialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestWizard, setShowRequestWizard] = useState(false);
  const [showZKProofGenerator, setShowZKProofGenerator] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [dataSource, setDataSource] = useState<'real' | 'mock'>(
    useRealData ? 'real' : 'mock'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastProof, setLastProof] = useState<ZKProof | null>(null);
  const [verification, setVerification] = useState<{ ok: boolean; message?: string; sbt?: 'confirmed' | 'unknown' } | null>(null);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [selectiveFields, setSelectiveFields] = useState<Record<string, boolean>>({});
  const [proofError, setProofError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<null | { kind: 'age' | 'student' }>(null);

  // Configure credential service based on data source and chain type
  const configuredCredentialService = new CredentialService({
    enableMockData: dataSource === 'mock',
    enableZKProofs: true,
    zkProofProvider: chainType === 'kilt' ? 'kilt' : 'semaphore',
    chainType: chainType
  });

  useEffect(() => {
    loadAllData();
  }, [did, dataSource]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [credentialsData, requestsData, offersData] = await Promise.all([
        configuredCredentialService.getCredentials(did),
        configuredCredentialService.getCredentialRequests(did),
        configuredCredentialService.getCredentialOffers(did)
      ]);
      
      setCredentials(credentialsData);
      setRequests(requestsData);
      setOffers(offersData);
    } catch (err: any) {
      setError(`Failed to load credential data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShareCredential = async (credentialId: string, selectiveFields?: string[]) => {
    try {
      const credential = credentials.find(c => c.id === credentialId);
      if (!credential) return;

      // Create a verifiable presentation
      const presentation = await configuredCredentialService.createPresentation(
        [credential],
        'challenge_' + Date.now(),
        window.location.origin,
        selectiveFields ? { [credentialId]: selectiveFields } : undefined
      );
      
      // In a real app, this would open a sharing dialog or QR code
      console.log('Credential presentation created:', presentation);
      alert('Credential shared successfully! (Check console for details)');
    } catch (err: any) {
      alert(`Failed to share credential: ${err.message}`);
    }
  };

  const handleRevokeCredential = async (credentialId: string) => {
    try {
      await configuredCredentialService.revokeCredential(credentialId, 'User requested revocation');
      
      // Update local state
      setCredentials(prev => 
        prev.map(cred => 
          cred.id === credentialId 
            ? { ...cred, status: CredentialStatus.REVOKED }
            : cred
        )
      );
      
      alert('Credential revoked successfully');
    } catch (err: any) {
      alert(`Failed to revoke credential: ${err.message}`);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      const newCredential = await configuredCredentialService.acceptCredentialOffer(offerId, did);
      
      // Add to credentials and remove from offers
      setCredentials(prev => [...prev, newCredential]);
      setOffers(prev => prev.filter(offer => offer.id !== offerId));
      
      alert('Credential offer accepted successfully!');
    } catch (err: any) {
      alert(`Failed to accept offer: ${err.message}`);
    }
  };

  const handleDeclineOffer = (offerId: string) => {
    setOffers(prev => prev.filter(offer => offer.id !== offerId));
    alert('Credential offer declined');
  };

  const handleNewCredentialRequest = async (requestData: any) => {
    try {
      const newRequest = await configuredCredentialService.requestCredential(
        did,
        requestData.credentialType,
        requestData.requiredClaims,
        requestData.privacyRequirements
      );
      
      setRequests(prev => [...prev, newRequest]);
      setShowRequestWizard(false);
      alert('Credential request submitted successfully!');
    } catch (err: any) {
      alert(`Failed to submit request: ${err.message}`);
    }
  };

  const getTabCount = (tab: TabType): number => {
    switch (tab) {
      case 'credentials': return credentials.length;
      case 'requests': return requests.filter(r => r.status === RequestStatus.PENDING).length;
      case 'offers': return offers.filter(o => o.status === OfferStatus.PENDING).length;
      case 'zkproofs': return credentials.filter(c => c.proof.zkProof).length;
      default: return 0;
    }
  };

  const renderCredentials = () => (
    <div className="credentials-grid">
      {credentials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" />
          <h3>No Credentials Yet</h3>
          <p>You haven't received any verifiable credentials yet.</p>
        </div>
      ) : (
        <>
          <div className="section-header">
            <h3>Your Verifiable Credentials</h3>
          </div>
          <div className="cards-grid">
            {credentials.map(credential => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                onShare={handleShareCredential}
                onRevoke={credential.metadata?.revocable ? handleRevokeCredential : undefined}
                onViewDetails={setSelectedCredential}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderRequests = () => (
    <div className="requests-section">
      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" />
          <h3>No Pending Requests</h3>
          <p>You don't have any pending credential requests.</p>
        </div>
      ) : (
        <>
          <div className="section-header">
            <h3>Credential Requests</h3>
          </div>
          <div className="requests-list">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <h4>{(request.type || []).join(', ')}</h4>
                    <p>Requested by: {request.requestedBy?.name || 'Unknown'}</p>
                  </div>
                  <div className={`request-status status-${request.status}`}>
                    {request.status}
                  </div>
                </div>
                
                <div className="request-details">
                  <div className="required-claims">
                    <strong>Required Claims:</strong>
                    <ul>
                      {(request.requiredClaims || []).map(claim => (
                        <li key={claim}>{claim}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="privacy-requirements">
                    <strong>Privacy Requirements:</strong>
                    <div className="privacy-tags">
                      {request.privacyRequirements.zkProofRequired && (
                        <span className="privacy-tag">ZK-Proof Required</span>
                      )}
                      {request.privacyRequirements.selectiveDisclosure && (
                        <span className="privacy-tag">Selective Disclosure</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="request-dates">
                    <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                    {request.expiresAt && (
                      <span>Expires: {new Date(request.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderOffers = () => (
    <div className="offers-section">
      {offers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" />
          <h3>No Available Offers</h3>
          <p>You don't have any pending credential offers.</p>
        </div>
      ) : (
        <>
          <div className="section-header">
            <h3>Credential Offers</h3>
          </div>
          <div className="offers-grid">
            {offers.map(offer => (
              <div key={offer.id} className="offer-card">
                <div className="offer-header">
                  <div className="offer-issuer">
                    {offer.issuer.logo && (
                      <img src={offer.issuer.logo} alt={offer.issuer.name} className="issuer-logo" />
                    )}
                    <div>
                      <h4>{offer.issuer.name}</h4>
                      <div className="trust-score">
                        Trust Score: {offer.issuer.trustScore}/100
                      </div>
                    </div>
                  </div>
                  <div className={`offer-status status-${offer.status}`}>
                    {offer.status}
                  </div>
                </div>
                
                <div className="offer-content">
                  <h5>{(offer.type || []).join(', ')}</h5>
                  <div className="credential-preview">
                    {Object.entries(offer.credentialSubject).map(([key, value]) => (
                      <div key={key} className="preview-field">
                        <span className="field-label">{key}:</span>
                        <span className="field-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="offer-requirements">
                    <strong>Requirements:</strong>
                    <ul>
                      <li>Verification Method: {offer.requirements.verificationMethod}</li>
                      {offer.requirements.proofOfControl && (
                        <li>Proof of wallet control required</li>
                      )}
                      {offer.requirements.additionalVerification?.map(req => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="offer-actions">
                  <button 
                    className="primary-button"
                    onClick={() => handleAcceptOffer(offer.id)}
                  >
                    Accept Offer
                  </button>
                  <button 
                    className="secondary-button"
                    onClick={() => handleDeclineOffer(offer.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderZKProofs = () => {
    const zkCredentials = credentials.filter(c => c.proof.zkProof);
    
    return (
      <div className="zkproofs-section">
        <div className="section-header">
          <h3>Zero-Knowledge Proofs</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button 
              className="secondary-button"
              onClick={() => setShowZKProofGenerator(true)}
            >
              Advanced Generator
            </button>
            <button
              className="primary-button"
              disabled={isGenerating || credentials.length === 0}
              onClick={async () => {
                try {
                  setIsGenerating(true);
                  setCancelRequested(false);
                  setVerification(null);
                  setProofError(null);
                  setLastAttempt({ kind: 'age' });
                  const ageCred = credentials.find(c => c.type.some(t => t.toLowerCase().includes('age')) || c.credentialSubject.age || c.credentialSubject.birthDate || c.credentialSubject.dateOfBirth);
                  if (!ageCred) {
                    alert('No age-related credential found');
                    setIsGenerating(false);
                    return;
                  }
                  const proof = await generateAgeVerificationProof([ageCred], 18);
                  if (cancelRequested) { setIsGenerating(false); return; }
                  setLastProof(proof);
                  const expectedSignal = proof.publicSignals?.[2] || '';
                  const ok = await zkProofService.verifyZKProof(proof, expectedSignal, 'semaphore-age-verification');
                  if (cancelRequested) { setIsGenerating(false); return; }
                  setVerification({ ok });
                } catch (e: any) {
                  console.error('Age proof error:', e);
                  setProofError(e?.message || 'Failed to generate or verify age proof.');
                  setVerification({ ok: false, message: e?.message || String(e) });
                } finally {
                  setIsGenerating(false);
                }
              }}
            >
              {isGenerating ? 'Generating… (≈2–5s)' : 'Generate Age Proof'}
            </button>
            <button
              className="secondary-button"
              disabled={isGenerating || credentials.length === 0}
              onClick={async () => {
                try {
                  setIsGenerating(true);
                  setCancelRequested(false);
                  setVerification(null);
                  setProofError(null);
                  setLastAttempt({ kind: 'student' });
                  const studentCred = credentials.find(c => c.type.some(t => t.toLowerCase().includes('student')) || c.credentialSubject.studentId || c.credentialSubject.organizationId);
                  if (!studentCred) {
                    alert('No student credential found');
                    setIsGenerating(false);
                    return;
                  }
                  const proof = await generateStudentStatusProof([studentCred], 'student');
                  if (cancelRequested) { setIsGenerating(false); return; }
                  setLastProof(proof);
                  const expectedSignal = proof.publicSignals?.[2] || '';
                  const ok = await zkProofService.verifyZKProof(proof, expectedSignal, 'semaphore-membership-proof');
                  if (cancelRequested) { setIsGenerating(false); return; }
                  const sbt = studentCred.credentialSubject.studentId ? 'confirmed' : 'unknown';
                  setVerification({ ok, sbt });
                } catch (e: any) {
                  console.error('Student proof error:', e);
                  setProofError(e?.message || 'Failed to generate or verify student proof.');
                  setVerification({ ok: false, message: e?.message || String(e) });
                } finally {
                  setIsGenerating(false);
                }
              }}
            >
              {isGenerating ? 'Working… (≈2–5s)' : 'Prove Student Status'}
            </button>
            {isGenerating && (
              <button
                className="secondary-button"
                onClick={() => setCancelRequested(true)}
              >Cancel</button>
            )}
          </div>
        </div>

        {/* Selective disclosure UI: reveal fields alongside proofs */}
        {credentials.length > 0 && (
          <div style={{ margin: '8px 0', padding: 8, border: '1px solid #eee', borderRadius: 8 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Selective Disclosure (include fields when sharing)</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.keys(credentials[0].credentialSubject || {}).map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={!!selectiveFields[key]}
                    onChange={(e) => setSelectiveFields((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {proofError && (
          <div className="error-banner" style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 8, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Proof Error:</strong> {proofError}
              </div>
              {lastAttempt && (
                <button
                  className="secondary-button"
                  onClick={async () => {
                    // Retry the last attempted action
                    if (lastAttempt.kind === 'age') {
                      const btn = document.querySelector('button.primary-button') as HTMLButtonElement | null;
                      btn?.click();
                    } else if (lastAttempt.kind === 'student') {
                      const buttons = Array.from(document.querySelectorAll('button.secondary-button')) as HTMLButtonElement[];
                      const studentBtn = buttons.find(b => b.textContent?.toLowerCase().includes('prove student'));
                      studentBtn?.click();
                    }
                  }}
                >Retry</button>
              )}
            </div>
          </div>
        )}

        {lastProof && (
          <div className="zk-proof-result">
            <h4>Latest Proof</h4>
            <div className="zk-info">
              <div className="zk-field"><span>Type:</span><span>{lastProof.type}</span></div>
              <div className="zk-field"><span>Circuit:</span><span>{lastProof.circuit}</span></div>
              <div className="zk-field"><span>Public Signals:</span><span>{(lastProof.publicSignals || []).join(', ')}</span></div>
              <div className="zk-field"><span>Verification:</span><span style={{ color: verification?.ok ? '#16a34a' : '#dc2626' }}>{verification ? (verification.ok ? 'Valid' : 'Invalid') : '—'}</span></div>
              {verification?.sbt && (
                <div className="zk-field"><span>SBT Ownership:</span><span>{verification.sbt === 'confirmed' ? 'Confirmed' : 'Unknown'}</span></div>
              )}
              {verification?.message && (
                <div className="zk-field"><span>Error:</span><span>{verification.message}</span></div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="secondary-button"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(JSON.stringify(lastProof, null, 2));
                    alert('Proof copied to clipboard');
                  } catch {}
                }}
              >Copy JSON</button>
              <button
                className="secondary-button"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(lastProof, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `zk-proof-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >Download JSON</button>
            </div>
          </div>
        )}

        {zkCredentials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <h3>No ZK-Proof Credentials</h3>
            <p>You don't have any credentials with zero-knowledge proofs yet.</p>
          </div>
        ) : (
          <div className="zk-credentials-grid">
            {zkCredentials.map(credential => (
              <div key={credential.id} className="zk-credential-card">
                <CredentialCard 
                  credential={credential} 
                  compact={true}
                  onShare={handleShareCredential}
                />
                <div className="zk-proof-details">
                  <h5>ZK-Proof Details</h5>
                  <div className="zk-info">
                    <div className="zk-field">
                      <span>Type:</span>
                      <span>{credential.proof.zkProof?.type}</span>
                    </div>
                    <div className="zk-field">
                      <span>Circuit:</span>
                      <span>{credential.proof.zkProof?.circuit}</span>
                    </div>
                    <div className="zk-field">
                      <span>Public Signals:</span>
                      <span>{credential.proof.zkProof?.publicSignals.length} signals</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="credential-section loading">
        <div className="loading-spinner"></div>
        <p>Loading your credentials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="credential-section error">
        <div className="error-icon">❌</div>
        <h3>Error Loading Credentials</h3>
        <p>{error}</p>
        <button className="retry-button" onClick={loadAllData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="credential-section">
      <div className="section-header-main">
        <div>
          <h2>Verifiable Credentials</h2>
          <p>Manage your digital identity credentials with privacy controls</p>
          <small style={{ color: '#6b7280', fontSize: '12px' }}>
            Mode: {dataSource === 'real' ? 'Real Data' : 'Demo Data'} - 
            {dataSource === 'real' ? 'Fetching from actual credential APIs' : 'Using mock data for demonstration'}
          </small>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`secondary-button${dataSource === 'mock' ? ' active' : ''}`}
            onClick={() => setDataSource('mock')}
          >
            Demo Data
          </button>
          <button
            className={`secondary-button${dataSource === 'real' ? ' active' : ''}`}
            onClick={() => setDataSource('real')}
          >
            Real Data
          </button>
        </div>
      </div>
      
      <div className="credential-tabs">
        <button 
          className={`tab-button ${activeTab === 'credentials' ? 'active' : ''}`}
          onClick={() => setActiveTab('credentials')}
        >
          Credentials ({getTabCount('credentials')})
        </button>
        <button 
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({getTabCount('requests')})
        </button>
        <button 
          className={`tab-button ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          Offers ({getTabCount('offers')})
        </button>
        <button 
          className={`tab-button ${activeTab === 'zkproofs' ? 'active' : ''}`}
          onClick={() => setActiveTab('zkproofs')}
        >
          ZK-Proofs ({getTabCount('zkproofs')})
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'credentials' && renderCredentials()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'offers' && renderOffers()}
        {activeTab === 'zkproofs' && renderZKProofs()}
      </div>
      
      {showRequestWizard && (
        <CredentialRequestWizard
          did={did}
          onSubmit={handleNewCredentialRequest}
          onCancel={() => setShowRequestWizard(false)}
        />
      )}
      
      {showZKProofGenerator && (
        <ZKProofGenerator
          credentials={credentials}
          onGenerate={(proof: ZKProof) => {
            console.log('ZK-Proof generated:', proof);
            setShowZKProofGenerator(false);
            alert('ZK-Proof generated successfully!');
          }}
          onCancel={() => setShowZKProofGenerator(false)}
        />
      )}
    </div>
  );
}; 