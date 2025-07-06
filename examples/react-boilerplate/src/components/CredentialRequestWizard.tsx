import React, { useState } from 'react';

interface CredentialRequestWizardProps {
  did: string;
  onSubmit: (requestData: {
    credentialType: string;
    requiredClaims: string[];
    privacyRequirements: {
      zkProofRequired: boolean;
      selectiveDisclosure: boolean;
    };
  }) => void;
  onCancel: () => void;
}

const CREDENTIAL_TYPES = [
  {
    id: 'StudentIDCredential',
    name: 'Student ID',
    description: 'Academic institution student identification',
    claims: ['studentId', 'institution', 'program', 'enrollmentDate', 'graduationDate', 'gpa']
  },
  {
    id: 'EmploymentCredential',
    name: 'Employment Verification',
    description: 'Employment status and position verification',
    claims: ['employer', 'position', 'startDate', 'endDate', 'salary', 'department']
  },
  {
    id: 'AgeVerificationCredential',
    name: 'Age Verification',
    description: 'Proof of age for age-restricted services',
    claims: ['isOver18', 'isOver21', 'verificationDate']
  },
  {
    id: 'CertificationCredential',
    name: 'Professional Certification',
    description: 'Professional skills and certification verification',
    claims: ['certification', 'level', 'skills', 'examScore', 'certificationDate']
  }
];

export const CredentialRequestWizard: React.FC<CredentialRequestWizardProps> = ({
  did,
  onSubmit,
  onCancel
}) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [zkProofRequired, setZkProofRequired] = useState(false);
  const [selectiveDisclosure, setSelectiveDisclosure] = useState(true);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const type = CREDENTIAL_TYPES.find(t => t.id === typeId);
    if (type) {
      setSelectedClaims(type.claims);
    }
  };

  const handleClaimToggle = (claim: string) => {
    setSelectedClaims(prev => 
      prev.includes(claim) 
        ? prev.filter(c => c !== claim)
        : [...prev, claim]
    );
  };

  const handleSubmit = () => {
    if (!selectedType || selectedClaims.length === 0) {
      alert('Please select a credential type and at least one claim');
      return;
    }

    onSubmit({
      credentialType: selectedType,
      requiredClaims: selectedClaims,
      privacyRequirements: {
        zkProofRequired,
        selectiveDisclosure
      }
    });
  };

  const renderStep1 = () => (
    <div className="wizard-step">
      <h3>Select Credential Type</h3>
      <p>Choose the type of credential you want to request:</p>
      
      <div className="credential-types-grid">
        {CREDENTIAL_TYPES.map(type => (
          <div 
            key={type.id}
            className={`credential-type-card ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => handleTypeSelect(type.id)}
          >
            <h4>{type.name}</h4>
            <p>{type.description}</p>
            <div className="claims-preview">
              <strong>Claims:</strong>
              <ul>
                {type.claims.slice(0, 3).map(claim => (
                  <li key={claim}>{claim}</li>
                ))}
                {type.claims.length > 3 && (
                  <li>+{type.claims.length - 3} more</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const selectedTypeData = CREDENTIAL_TYPES.find(t => t.id === selectedType);
    
    return (
      <div className="wizard-step">
        <h3>Select Claims</h3>
        <p>Choose which claims you want to include in your credential request:</p>
        
        <div className="claims-selection">
          <h4>{selectedTypeData?.name}</h4>
          <div className="claims-list">
            {selectedTypeData?.claims.map(claim => (
              <div key={claim} className="claim-item">
                <input
                  type="checkbox"
                  id={`claim-${claim}`}
                  checked={selectedClaims.includes(claim)}
                  onChange={() => handleClaimToggle(claim)}
                />
                <label htmlFor={`claim-${claim}`}>
                  {claim}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="wizard-step">
      <h3>Privacy Settings</h3>
      <p>Configure privacy and verification requirements:</p>
      
      <div className="privacy-settings">
        <div className="privacy-option">
          <input
            type="checkbox"
            id="zk-proof-required"
            checked={zkProofRequired}
            onChange={(e) => setZkProofRequired(e.target.checked)}
          />
          <label htmlFor="zk-proof-required">
            <strong>Require Zero-Knowledge Proof</strong>
            <span className="option-description">
              Enable ZK-proofs for maximum privacy protection
            </span>
          </label>
        </div>
        
        <div className="privacy-option">
          <input
            type="checkbox"
            id="selective-disclosure"
            checked={selectiveDisclosure}
            onChange={(e) => setSelectiveDisclosure(e.target.checked)}
          />
          <label htmlFor="selective-disclosure">
            <strong>Enable Selective Disclosure</strong>
            <span className="option-description">
              Allow sharing only specific fields when presenting credentials
            </span>
          </label>
        </div>
      </div>
      
      <div className="privacy-explanation">
        <h4>Privacy Levels Explained:</h4>
        <ul>
          <li><strong>ZK-Proof:</strong> Proves claims without revealing actual values</li>
          <li><strong>Selective Disclosure:</strong> Share only necessary information</li>
          <li><strong>Standard:</strong> Traditional credential sharing</li>
        </ul>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const selectedTypeData = CREDENTIAL_TYPES.find(t => t.id === selectedType);
    
    return (
      <div className="wizard-step">
        <h3>Review Request</h3>
        <p>Please review your credential request before submitting:</p>
        
        <div className="request-summary">
          <div className="summary-section">
            <h4>Credential Type</h4>
            <p>{selectedTypeData?.name}</p>
          </div>
          
          <div className="summary-section">
            <h4>Required Claims ({selectedClaims.length})</h4>
            <ul>
              {selectedClaims.map(claim => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
          </div>
          
          <div className="summary-section">
            <h4>Privacy Settings</h4>
            <div className="privacy-badges">
              {zkProofRequired && (
                <span className="privacy-badge zk">🔐 ZK-Proof Required</span>
              )}
              {selectiveDisclosure && (
                <span className="privacy-badge selective">🔒 Selective Disclosure</span>
              )}
              {!zkProofRequired && !selectiveDisclosure && (
                <span className="privacy-badge standard">📄 Standard</span>
              )}
            </div>
          </div>
          
          <div className="summary-section">
            <h4>Request Details</h4>
            <div className="request-details">
              <p><strong>Requester DID:</strong> {did}</p>
              <p><strong>Request Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Expires:</strong> {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="credential-request-wizard-overlay">
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2>Request New Credential</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="wizard-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
          <div className="progress-steps">
            {[1, 2, 3, 4].map(stepNum => (
              <div 
                key={stepNum}
                className={`progress-step ${step >= stepNum ? 'active' : ''}`}
              >
                {stepNum}
              </div>
            ))}
          </div>
        </div>
        
        <div className="wizard-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
        
        <div className="wizard-actions">
          <button 
            className="secondary-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          
          {step > 1 && (
            <button 
              className="secondary-button"
              onClick={() => setStep(step - 1)}
            >
              Previous
            </button>
          )}
          
          {step < 4 ? (
            <button 
              className="primary-button"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedType}
            >
              Next
            </button>
          ) : (
            <button 
              className="primary-button"
              onClick={handleSubmit}
            >
              Submit Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 