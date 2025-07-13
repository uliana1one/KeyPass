import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Types for DID creation
export interface DIDCreationOptions {
  type: 'basic' | 'advanced';
  includeServices?: boolean;
  includeCredentials?: boolean;
  customAttributes?: Record<string, string>;
  purpose?: string;
  description?: string;
}

export interface DIDCreationResult {
  did: string;
  didDocument: any;
  options: DIDCreationOptions;
  createdAt: string;
}

interface DIDWizardProps {
  walletAddress: string;
  chainType: 'polkadot' | 'ethereum';
  accountName: string;
  onComplete: (result: DIDCreationResult) => void;
  onCancel: () => void;
  onBack: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export const DIDWizard: React.FC<DIDWizardProps> = ({
  walletAddress,
  chainType,
  accountName,
  onComplete,
  onCancel,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [didOptions, setDidOptions] = useState<DIDCreationOptions>({
    type: 'basic',
    includeServices: false,
    includeCredentials: false,
    customAttributes: {},
    purpose: 'authentication',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');

  const generatePreview = async () => {
    try {
      setLoading(true);
      console.log('[DIDWizard] generatePreview called. didOptions:', didOptions, 'walletAddress:', walletAddress, 'chainType:', chainType);
      // Generate preview DID document
      const previewDID = `did:key:z${chainType}${walletAddress.slice(-8)}preview`;
      const previewDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          chainType === 'polkadot' 
            ? 'https://w3id.org/security/suites/sr25519-2020/v1'
            : 'https://w3id.org/security/suites/secp256k1-2019/v1'
        ],
        id: previewDID,
        controller: previewDID,
        verificationMethod: [{
          id: `${previewDID}#keys-1`,
          type: chainType === 'polkadot' ? 'Sr25519VerificationKey2020' : 'EcdsaSecp256k1VerificationKey2019',
          controller: previewDID,
          publicKeyMultibase: `z${walletAddress.slice(-16)}`
        }],
        authentication: [`${previewDID}#keys-1`],
        assertionMethod: [`${previewDID}#keys-1`],
        capabilityInvocation: [`${previewDID}#keys-1`],
        capabilityDelegation: [`${previewDID}#keys-1`],
        ...(didOptions.type === 'advanced' && {
          service: didOptions.includeServices ? [{
            id: `${previewDID}#service-1`,
            type: 'IdentityService',
            serviceEndpoint: 'https://identity.example.com'
          }] : [],
          metadata: {
            purpose: didOptions.purpose,
            description: didOptions.description,
            customAttributes: didOptions.customAttributes,
            credentialReady: didOptions.includeCredentials
          }
        })
      };
      console.log('[DIDWizard] Setting previewData:', previewDocument);
      setPreviewData(previewDocument);
    } catch (err: any) {
      setError(`Failed to generate preview: ${err.message}`);
      console.error('[DIDWizard] Error in generatePreview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Choose DID Type
  const renderTypeSelection = useCallback(() => (
    <div className="did-step">
      <h3>Choose Your DID Type</h3>
      <p className="step-description">
        Select the type of Decentralized Identifier (DID) you want to create for your wallet.
      </p>
      
      <div className="did-type-options">
        <div 
          className={`did-type-card ${didOptions.type === 'basic' ? 'selected' : ''}`}
          onClick={() => setDidOptions({...didOptions, type: 'basic'})}
        >
          <div className="did-type-icon">🔑</div>
          <h4>Basic DID</h4>
          <p>Simple DID for authentication and basic identity verification</p>
          <ul className="did-features">
            <li>✅ Wallet-based authentication</li>
            <li>✅ Basic identity verification</li>
            <li>✅ Quick setup</li>
            <li>✅ Standard compliance</li>
          </ul>
          <div className="did-recommended">Recommended for most users</div>
        </div>
        
        <div 
          className={`did-type-card ${didOptions.type === 'advanced' ? 'selected' : ''}`}
          onClick={() => setDidOptions({...didOptions, type: 'advanced'})}
        >
          <div className="did-type-icon">🛡️</div>
          <h4>Advanced DID</h4>
          <p>Enhanced DID with additional identity attributes and services</p>
          <ul className="did-features">
            <li>✅ Everything in Basic DID</li>
            <li>✅ Custom attributes</li>
            <li>✅ Service endpoints</li>
            <li>✅ Credential readiness</li>
          </ul>
          <div className="did-advanced">For advanced users</div>
        </div>
      </div>
    </div>
  ), [didOptions]);

  // Step 2: Configure Options (for advanced DID)
  const renderAdvancedOptions = useCallback(() => (
    <div className="did-step">
      <h3>Configure Advanced Options</h3>
      <p className="step-description">
        Customize your DID with additional features and attributes.
      </p>
      
      <div className="did-options">
        <div className="option-group">
          <h4>Identity Purpose</h4>
          <select 
            value={didOptions.purpose}
            onChange={(e) => setDidOptions({...didOptions, purpose: e.target.value})}
            className="did-select"
          >
            <option value="authentication">Authentication</option>
            <option value="professional">Professional Identity</option>
            <option value="academic">Academic Credentials</option>
            <option value="social">Social Identity</option>
            <option value="business">Business Identity</option>
            <option value="custom">Custom Purpose</option>
          </select>
        </div>
        
        <div className="option-group">
          <h4>Description</h4>
          <textarea
            value={didOptions.description || ''}
            onChange={(e) => setDidOptions({...didOptions, description: e.target.value})}
            placeholder="Optional description for your DID (e.g., 'Professional identity for blockchain development')"
            className="did-textarea"
            rows={3}
          />
        </div>
        
        <div className="option-group">
          <h4>Additional Features</h4>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={didOptions.includeServices || false}
                onChange={(e) => setDidOptions({...didOptions, includeServices: e.target.checked})}
              />
              <span className="checkbox-text">Include service endpoints</span>
              <span className="checkbox-help">Allow your DID to reference external services</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={didOptions.includeCredentials || false}
                onChange={(e) => setDidOptions({...didOptions, includeCredentials: e.target.checked})}
              />
              <span className="checkbox-text">Prepare for verifiable credentials</span>
              <span className="checkbox-help">Set up your DID to receive and manage credentials</span>
            </label>
          </div>
        </div>
        
        <div className="option-group">
          <h4>Custom Attributes</h4>
          <div className="custom-attributes">
            <input
              type="text"
              placeholder="Attribute name (e.g., 'role')"
              className="attribute-input"
              value={newAttributeKey}
              onChange={(e) => setNewAttributeKey(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const valueInput = document.getElementById('attribute-value-input') as HTMLInputElement;
                  if (valueInput) {
                    valueInput.focus();
                  }
                }
              }}
            />
            <input
              type="text"
              placeholder="Attribute value (e.g., 'developer')"
              className="attribute-input"
              id="attribute-value-input"
              value={newAttributeValue}
              onChange={(e) => setNewAttributeValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const key = newAttributeKey.trim();
                  const value = newAttributeValue.trim();
                  
                  if (key && value) {
                    setDidOptions({
                      ...didOptions,
                      customAttributes: {
                        ...didOptions.customAttributes,
                        [key]: value
                      }
                    });
                    setNewAttributeKey('');
                    setNewAttributeValue('');
                  }
                }
              }}
            />
            <button 
              className="add-attribute-btn"
              onClick={() => {
                const key = newAttributeKey.trim();
                const value = newAttributeValue.trim();
                
                if (key && value) {
                  setDidOptions({
                    ...didOptions,
                    customAttributes: {
                      ...didOptions.customAttributes,
                      [key]: value
                    }
                  });
                  setNewAttributeKey('');
                  setNewAttributeValue('');
                }
              }}
            >
              Add
            </button>
          </div>
          
          {Object.keys(didOptions.customAttributes || {}).length > 0 && (
            <div className="attributes-list">
              {Object.entries(didOptions.customAttributes || {}).map(([key, value]) => (
                <div key={key} className="attribute-item">
                  <span className="attribute-key">{key}:</span>
                  <span className="attribute-value">{value}</span>
                  <button 
                    className="remove-attribute"
                    onClick={() => {
                      const newAttributes = {...didOptions.customAttributes};
                      delete newAttributes[key];
                      setDidOptions({...didOptions, customAttributes: newAttributes});
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ), [didOptions, newAttributeKey, newAttributeValue, setDidOptions, setNewAttributeKey, setNewAttributeValue]);

  // Step 3: Preview DID
  const renderPreview = useCallback(() => {
    return (
      <div className="did-step">
        <h3>Preview Your DID</h3>
        <p className="step-description">
          Review your DID configuration before creation. This is how your DID document will look.
        </p>
        
        {loading && (
          <div className="loading">Generating preview...</div>
        )}
        
        {previewData && (
          <div className="did-preview">
            <div className="preview-section">
              <h4>DID Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Type:</span>
                  <span className="summary-value">{didOptions.type === 'basic' ? 'Basic DID' : 'Advanced DID'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Chain:</span>
                  <span className="summary-value">{chainType === 'polkadot' ? 'Polkadot' : 'Ethereum'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Account:</span>
                  <span className="summary-value">{accountName}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Address:</span>
                  <span className="summary-value">{walletAddress}</span>
                </div>
                {didOptions.purpose && (
                  <div className="summary-item">
                    <span className="summary-label">Purpose:</span>
                    <span className="summary-value">{didOptions.purpose}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="preview-section">
              <h4>DID Document</h4>
              <div className="did-document">
                <pre>{JSON.stringify(previewData, null, 2)}</pre>
              </div>
            </div>
            
            <div className="preview-section">
              <h4>Features Included</h4>
              <div className="features-list">
                <div className="feature-item">✅ Authentication capability</div>
                <div className="feature-item">✅ Message signing</div>
                <div className="feature-item">✅ Identity verification</div>
                {didOptions.includeServices && (
                  <div className="feature-item">✅ Service endpoints</div>
                )}
                {didOptions.includeCredentials && (
                  <div className="feature-item">✅ Credential readiness</div>
                )}
                {Object.keys(didOptions.customAttributes || {}).length > 0 && (
                  <div className="feature-item">✅ Custom attributes ({Object.keys(didOptions.customAttributes || {}).length})</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [loading, previewData, didOptions, chainType, accountName, walletAddress]);

  // Step 4: Create DID
  const renderCreation = useCallback(() => {
    const handleCreateDID = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate DID creation (in real implementation, this would call the DID provider)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const result: DIDCreationResult = {
          did: `did:key:z${chainType}${walletAddress.slice(-8)}${Date.now()}`,
          didDocument: previewData,
          options: didOptions,
          createdAt: new Date().toISOString()
        };
        
        onComplete(result);
      } catch (err: any) {
        setError(`Failed to create DID: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="did-step">
        <h3>Create Your DID</h3>
        <p className="step-description">
          Ready to create your Decentralized Identifier? This will generate your DID on the blockchain.
        </p>
        
        <div className="creation-summary">
          <div className="creation-icon">🎉</div>
          <h4>You're all set!</h4>
          <p>Your DID will be created with the following configuration:</p>
          
          <div className="creation-details">
            <div className="detail-row">
              <span>Type:</span>
              <span>{didOptions.type === 'basic' ? 'Basic DID' : 'Advanced DID'}</span>
            </div>
            <div className="detail-row">
              <span>Chain:</span>
              <span>{chainType === 'polkadot' ? 'Polkadot' : 'Ethereum'}</span>
            </div>
            <div className="detail-row">
              <span>Purpose:</span>
              <span>{didOptions.purpose}</span>
            </div>
          </div>
        </div>
        
        <div className="creation-actions">
          <button 
            className="create-did-btn"
            onClick={handleCreateDID}
            disabled={loading}
          >
            {loading ? 'Creating DID...' : 'Create My DID'}
          </button>
        </div>
        
        {loading && (
          <div className="creation-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>Creating your DID on the blockchain...</p>
          </div>
        )}
      </div>
    );
  }, [loading, previewData, didOptions, chainType, walletAddress, accountName, onComplete]);

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'type',
      title: 'DID Type',
      description: 'Choose your DID type',
      component: renderTypeSelection()
    },
    ...(didOptions.type === 'advanced' ? [{
      id: 'options',
      title: 'Configuration',
      description: 'Configure advanced options',
      component: renderAdvancedOptions()
    }] : []),
    {
      id: 'preview',
      title: 'Preview',
      description: 'Review your DID',
      component: renderPreview()
    },
    {
      id: 'create',
      title: 'Create',
      description: 'Create your DID',
      component: renderCreation()
    }
  ], [didOptions.type, renderTypeSelection, renderAdvancedOptions, renderPreview, renderCreation]);

  // Add debug logging for didOptions.type and steps
  useEffect(() => {
    console.log('[DIDWizard] didOptions.type:', didOptions.type);
    console.log('[DIDWizard] steps:', steps.map(s => s.id));
    console.log('[DIDWizard] currentStep:', currentStep);
  }, [didOptions.type, steps.length, currentStep]);

  // Generate preview when step changes to preview step
  useEffect(() => {
    console.log('[DIDWizard] useEffect fired. currentStep:', currentStep, 'steps:', steps.map(s => s.id));
    if (steps[currentStep]?.id === 'preview') {
      console.log('[DIDWizard] Generating preview for step', currentStep, 'with type', didOptions.type);
      generatePreview();
    }
  }, [currentStep, didOptions, walletAddress, chainType, steps]);

  const canProceed = () => {
    if (currentStep === 0) return true; // Type selection
    if (currentStep === 1 && didOptions.type === 'advanced') return true; // Advanced options
    if (steps[currentStep].id === 'preview') return previewData !== null;
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  return (
    <div className="did-wizard">
      <div className="wizard-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Wallet Selection
        </button>
        <h2>Create Your DID</h2>
        <p>Set up your Decentralized Identifier for secure authentication</p>
      </div>
      
      <div className="wizard-progress">
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="wizard-content">
        {steps[currentStep].component}
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}
      </div>
      
      <div className="wizard-actions">
        <button 
          className="wizard-button secondary"
          onClick={currentStep === 0 ? onCancel : handlePrevious}
        >
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </button>
        
        {currentStep < steps.length - 1 ? (
          <button 
            className="wizard-button primary"
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            Next
          </button>
        ) : null}
      </div>
    </div>
  );
}; 