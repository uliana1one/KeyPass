import React, { useState, useEffect } from 'react';
import { KiltAdapter } from '../keypass/adapters/KiltAdapter';
import { KILTDIDProvider as KILTDIDProviderService } from '../keypass/did/KILTDIDProvider';
import { KILTConfigManager, KILTNetwork } from '../keypass/config/kiltConfig';

interface KiltDIDProviderProps {
  account: {
    address: string;
    name: string;
    injectedExtension: any;
  };
  onDIDCreated: (result: any) => void;
  onError: (error: string) => void;
}

export const KiltDIDProvider: React.FC<KiltDIDProviderProps> = ({
  account,
  onDIDCreated,
  onError
}) => {
  const [adapter, setAdapter] = useState<KiltAdapter | null>(null);
  const [didProvider, setDidProvider] = useState<KILTDIDProviderService | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    initializeKiltServices();
  }, []);

  const initializeKiltServices = async () => {
    try {
      setLoading(true);
      
      // Initialize KILT configuration
      const configManager = new KILTConfigManager();
      configManager.setCurrentNetwork(KILTNetwork.SPIRITNET);
      
      // Initialize KILT adapter
      const kiltAdapter = new KiltAdapter({
        network: KILTNetwork.SPIRITNET,
        configManager
      });
      
      // Connect to KILT network
      await kiltAdapter.connect();
      
      // Initialize DID provider
      const didProviderService = new KILTDIDProviderService(kiltAdapter);
      
      setAdapter(kiltAdapter);
      setDidProvider(didProviderService);
      setConnected(true);
      
    } catch (error: any) {
      console.error('Failed to initialize KILT services:', error);
      onError(`Failed to initialize KILT services: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createKiltDID = async () => {
    if (!didProvider || !adapter) {
      onError('KILT services not initialized');
      return;
    }

    try {
      setLoading(true);
      
      // Create DID document
      const didDocument = await didProvider.createDIDDocument(account.address);
      
      // Register DID on KILT blockchain
      const registrationResult = await didProvider.registerDIDOnChain(
        account.address,
        didDocument
      );
      
      const result = {
        did: registrationResult.did,
        didDocument: didDocument,
        address: account.address,
        chainType: 'kilt',
        registrationResult: registrationResult,
        createdAt: new Date().toISOString()
      };
      
      onDIDCreated(result);
      
    } catch (error: any) {
      console.error('Failed to create KILT DID:', error);
      onError(`Failed to create KILT DID: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingDID = async () => {
    if (!didProvider) {
      onError('KILT services not initialized');
      return;
    }

    try {
      setLoading(true);
      
      // Check if DID already exists on KILT blockchain
      const exists = await didProvider.checkDIDExists(account.address);
      
      if (exists) {
        // Resolve existing DID
        const didDocument = await didProvider.resolveDID(account.address);
        const result = {
          did: `did:kilt:${account.address}`,
          didDocument: didDocument,
          address: account.address,
          chainType: 'kilt',
          exists: true,
          createdAt: new Date().toISOString()
        };
        
        onDIDCreated(result);
      } else {
        // Create new DID
        await createKiltDID();
      }
      
    } catch (error: any) {
      console.error('Failed to check KILT DID:', error);
      onError(`Failed to check KILT DID: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !connected) {
    return (
      <div className="kilt-provider">
        <div className="loading">Initializing KILT services...</div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="kilt-provider">
        <div className="error">Failed to connect to KILT network</div>
        <button onClick={initializeKiltServices} className="retry-button">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="kilt-provider">
      <h3>KILT DID Management</h3>
      <div className="provider-info">
        <p><strong>Account:</strong> {account.name}</p>
        <p><strong>Address:</strong> {account.address}</p>
        <p><strong>Network:</strong> KILT Spiritnet</p>
      </div>
      
      <div className="provider-actions">
        <button 
          onClick={checkExistingDID}
          disabled={loading}
          className="primary-button"
        >
          {loading ? 'Checking...' : 'Check/Create KILT DID'}
        </button>
      </div>
      
      {loading && (
        <div className="loading">Processing KILT DID...</div>
      )}
    </div>
  );
};
