import React, { useState } from 'react';
import { VerifiableCredential, ZKProof, ZKCircuit } from '../types/credential';
import { credentialService } from '../services/credentialService';

interface ZKProofGeneratorProps {
  credentials: VerifiableCredential[];
  onGenerate: (proof: ZKProof) => void;
  onCancel: () => void;
}

export const ZKProofGenerator: React.FC<ZKProofGeneratorProps> = ({
  credentials,
  onGenerate,
  onCancel
}) => {
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [selectedCircuit, setSelectedCircuit] = useState<string>('');
  const [publicInputs, setPublicInputs] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);

  const availableCircuits = credentialService.getAvailableZKCircuits();

  const handleCredentialSelect = (credentialId: string) => {
    setSelectedCredential(credentialId);
    const credential = credentials.find(c => c.id === credentialId);
    if (credential) {
      // Auto-select appropriate circuit based on credential type
      if (credential.type.includes('AgeVerificationCredential')) {
        setSelectedCircuit('age-verification-circuit');
      } else if (credential.type.includes('StudentIDCredential')) {
        setSelectedCircuit('membership-proof-circuit');
      }
    }
  };

  const handleCircuitSelect = (circuitId: string) => {
    setSelectedCircuit(circuitId);
    const circuit = availableCircuits.find(c => c.id === circuitId);
    if (circuit) {
      // Initialize public inputs based on circuit requirements
      const initialInputs: Record<string, any> = {};
      circuit.publicInputs.forEach(input => {
        initialInputs[input] = '';
      });
      setPublicInputs(initialInputs);
    }
  };

  const handlePublicInputChange = (inputName: string, value: any) => {
    setPublicInputs(prev => ({
      ...prev,
      [inputName]: value
    }));
  };

  const handleGenerateProof = async () => {
    if (!selectedCredential || !selectedCircuit) {
      alert('Please select a credential and circuit');
      return;
    }

    setIsGenerating(true);
    try {
      const credential = credentials.find(c => c.id === selectedCredential);
      if (!credential) throw new Error('Credential not found');

      const zkProof = await credentialService.generateZKProof(
        selectedCircuit,
        publicInputs,
        [credential]
      );

      onGenerate(zkProof);
    } catch (error: any) {
      alert(`Failed to generate ZK-proof: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep1 = () => (
    <div className="generator-step">
      <h3>Select Credential</h3>
      <p>Choose the credential you want to create a zero-knowledge proof for:</p>
      
      <div className="credentials-list">
        {credentials.map(credential => (
          <div 
            key={credential.id}
            className={`credential-item ${selectedCredential === credential.id ? 'selected' : ''}`}
            onClick={() => handleCredentialSelect(credential.id)}
          >
            <div className="credential-header">
              <h4>{credential.type.find(t => t !== 'VerifiableCredential')}</h4>
              <span className="issuer">{credential.issuer.name}</span>
            </div>
            <div className="credential-info">
              <p>Issued: {new Date(credential.issuanceDate).toLocaleDateString()}</p>
              <p>Privacy Level: {credential.metadata.privacy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="generator-step">
      <h3>Select ZK Circuit</h3>
      <p>Choose the zero-knowledge circuit that matches your proof requirements:</p>
      
      <div className="circuits-grid">
        {availableCircuits.map(circuit => (
          <div 
            key={circuit.id}
            className={`circuit-card ${selectedCircuit === circuit.id ? 'selected' : ''}`}
            onClick={() => handleCircuitSelect(circuit.id)}
          >
            <h4>{circuit.name}</h4>
            <p>{circuit.description}</p>
            <div className="circuit-details">
              <div className="circuit-type">
                <strong>Type:</strong> {circuit.type}
              </div>
              <div className="circuit-inputs">
                <strong>Public Inputs:</strong>
                <ul>
                  {circuit.publicInputs.map(input => (
                    <li key={input}>{input}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedCircuitData = availableCircuits.find(c => c.id === selectedCircuit);
    
    return (
      <div className="generator-step">
        <h3>Configure Public Inputs</h3>
        <p>Set the public inputs for your zero-knowledge proof:</p>
        
        <div className="public-inputs-form">
          <h4>{selectedCircuitData?.name}</h4>
          <div className="inputs-grid">
            {selectedCircuitData?.publicInputs.map(inputName => (
              <div key={inputName} className="input-field">
                <label htmlFor={`input-${inputName}`}>{inputName}:</label>
                <input
                  id={`input-${inputName}`}
                  type={getInputType(inputName)}
                  value={publicInputs[inputName] || ''}
                  onChange={(e) => handlePublicInputChange(inputName, e.target.value)}
                  placeholder={getInputPlaceholder(inputName)}
                />
              </div>
            ))}
          </div>
          
          <div className="circuit-explanation">
            <h5>What this circuit proves:</h5>
            <p>{selectedCircuitData?.description}</p>
            
            <h5>Constraints:</h5>
            <ul>
              {Object.entries(selectedCircuitData?.constraints || {}).map(([key, value]) => (
                <li key={key}>{key}: {String(value)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const selectedCredentialData = credentials.find(c => c.id === selectedCredential);
    const selectedCircuitData = availableCircuits.find(c => c.id === selectedCircuit);
    
    return (
      <div className="generator-step">
        <h3>Generate Proof</h3>
        <p>Review your configuration and generate the zero-knowledge proof:</p>
        
        <div className="proof-summary">
          <div className="summary-section">
            <h4>Credential</h4>
            <p>{selectedCredentialData?.type.find(t => t !== 'VerifiableCredential')}</p>
            <p>Issuer: {selectedCredentialData?.issuer.name}</p>
          </div>
          
          <div className="summary-section">
            <h4>ZK Circuit</h4>
            <p>{selectedCircuitData?.name}</p>
            <p>Type: {selectedCircuitData?.type}</p>
          </div>
          
          <div className="summary-section">
            <h4>Public Inputs</h4>
            <div className="inputs-summary">
              {Object.entries(publicInputs).map(([key, value]) => (
                <div key={key} className="input-summary">
                  <span className="input-name">{key}:</span>
                  <span className="input-value">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="proof-explanation">
            <h5>Privacy Guarantee:</h5>
            <p>This proof will demonstrate the validity of your claims without revealing the actual credential data. Only the specified public inputs will be visible to verifiers.</p>
          </div>
        </div>
        
        {isGenerating && (
          <div className="generating-status">
            <div className="loading-spinner"></div>
            <p>Generating zero-knowledge proof...</p>
            <p className="generating-note">This may take a few moments.</p>
          </div>
        )}
      </div>
    );
  };

  const getInputType = (inputName: string): string => {
    if (inputName.includes('Age') || inputName.includes('score')) return 'number';
    if (inputName.includes('Valid') || inputName.includes('is')) return 'checkbox';
    return 'text';
  };

  const getInputPlaceholder = (inputName: string): string => {
    switch (inputName) {
      case 'minAge': return 'e.g., 18';
      case 'isValid': return 'true/false';
      case 'groupId': return 'Group identifier';
      case 'isMember': return 'true/false';
      default: return `Enter ${inputName}`;
    }
  };

  return (
    <div className="zk-proof-generator-overlay">
      <div className="generator-modal">
        <div className="generator-header">
          <h2>Generate Zero-Knowledge Proof</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="generator-progress">
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
        
        <div className="generator-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
        
        <div className="generator-actions">
          <button 
            className="secondary-button"
            onClick={onCancel}
            disabled={isGenerating}
          >
            Cancel
          </button>
          {step > 1 && (
            <button 
              className="secondary-button"
              onClick={() => setStep(step - 1)}
              disabled={isGenerating}
            >
              Previous
            </button>
          )}
          {step < 4 ? (
            <button 
              className="primary-button"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedCredential) ||
                (step === 2 && !selectedCircuit) ||
                (step === 3 && Object.values(publicInputs).some(v => v === ''))
              }
            >
              Next
            </button>
          ) : (
            <button 
              className="primary-button generate-button"
              onClick={handleGenerateProof}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Proof'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 