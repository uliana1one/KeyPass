import React, { useState, useEffect } from 'react';
import { KILTDIDProvider } from '../keypass/did/KILTDIDProvider';
import { KiltAdapter } from '../keypass/adapters/KiltAdapter';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

interface KiltDIDProviderProps {
  account: {
    address: string;
    name: string;
    injectedExtension: any;
  };
  onDIDCreated: (result: any) => void;
  onError: (error: string) => void;
}

export const KiltDIDProviderComponent: React.FC<KiltDIDProviderProps> = ({
  account,
  onDIDCreated,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>('Initializing...');
  const [didProvider, setDidProvider] = useState<KILTDIDProvider | null>(null);

  useEffect(() => {
    initializeKILT();
    return () => {
      cleanup();
    };
  }, []);

  const initializeKILT = async () => {
    try {
      setStatus('Connecting to KILT network...');
      
      // Create KILT adapter and DID provider
      const kiltAdapter = new KiltAdapter();
      const provider = new KILTDIDProvider(kiltAdapter);
      setDidProvider(provider);

      // Connect to KILT
      await kiltAdapter.connect();
      setConnected(true);
      setStatus('Connected to KILT Spiritnet');
    } catch (error: any) {
      console.error('Failed to initialize KILT:', error);
      onError(`Failed to connect to KILT: ${error.message}`);
      setStatus('Connection failed');
    }
  };

  const cleanup = async () => {
    if (didProvider) {
      try {
        await didProvider['kiltAdapter']?.disconnect();
      } catch (error) {
        console.error('Error cleaning up KILT adapter:', error);
      }
    }
  };

  const createKiltDID = async () => {
    if (!didProvider || !connected) {
      onError('Not connected to KILT network');
      return;
    }

    try {
      setLoading(true);
      setStatus('Creating DID...');
      
      // Convert address to KILT format (SS58 prefix 38)
      let kiltAddress = account.address;
      try {
        const publicKey = decodeAddress(account.address);
        kiltAddress = encodeAddress(publicKey, 38); // KILT uses SS58 prefix 38
        console.log('Converted address to KILT format:', kiltAddress);
      } catch (err) {
        console.warn('Failed to convert address format:', err);
      }
      
      // Create DID using real KILT provider
      const did = await didProvider.createDid(kiltAddress);
      
      setStatus('Creating DID document...');
      const didDocument = await didProvider.createDIDDocument(kiltAddress);
      
      const result = {
        did: did,
        didDocument: didDocument,
        address: account.address,
        chainType: 'kilt',
        createdAt: new Date().toISOString()
      };
      
      setStatus('DID created successfully');
      onDIDCreated(result);
      
    } catch (error: any) {
      console.error('Failed to create KILT DID:', error);
      onError(`Failed to create KILT DID: ${error.message}`);
      setStatus('DID creation failed');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingDID = async () => {
    if (!didProvider || !connected) {
      onError('Not connected to KILT network');
      return;
    }

    try {
      // resolve is not available in the interface
      // For now, always create a new DID
      await createKiltDID();
      
    } catch (error: any) {
      console.error('Failed to check KILT DID:', error);
      onError(`Failed to check KILT DID: ${error.message}`);
    }
  };

  return (
    <div className="kilt-provider">
      <h3>KILT DID Management</h3>
      <div className="provider-info">
        <p><strong>Account:</strong> {account.name}</p>
        <p><strong>Address:</strong> {account.address}</p>
        <p><strong>Network:</strong> KILT Spiritnet</p>
        <p className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '✓ Connected' : '✗ Disconnected'}
        </p>
        <p className="status-note">{status}</p>
      </div>
      
      <div className="provider-actions">
        <button 
          onClick={checkExistingDID}
          disabled={loading || !connected}
          className="primary-button"
        >
          {loading ? 'Processing...' : 'Create KILT DID'}
        </button>
      </div>
      
      {loading && (
        <div className="loading">Processing KILT DID...</div>
      )}
    </div>
  );
};