import React, { useState } from 'react';
import { KiltAdapter } from '../keypass/adapters/KiltAdapter';
import { KILTDIDProvider } from '../keypass/did/KILTDIDProvider';
import { KILTNetwork } from '../keypass/config/kiltConfig';

import './OnChainDemo.css';

interface OnChainDemoProps {
  address?: string;
}

export const OnChainDemo: React.FC<OnChainDemoProps> = ({ address }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const connectToKILT = async () => {
    setLoading(true);
    setError(null);
    setStatus('Connecting to KILT Spiritnet...');

    try {
      const adapter = new KiltAdapter(KILTNetwork.SPIRITNET);
      await adapter.connect();
      setStatus('✅ Connected to KILT Spiritnet');
      setLoading(false);
      return adapter;
    } catch (err: any) {
      setError(`Failed to connect: ${err.message}`);
      setStatus('❌ Connection failed');
      setLoading(false);
      throw err;
    }
  };

  const createOnChainDID = async () => {
    setLoading(true);
    setError(null);
    setStatus('Creating on-chain KILT DID...');

    try {
      // Step 1: Connect
      const adapter = await connectToKILT();
      setStatus('Wallet connected');

      // Step 2: Enable wallet
      await adapter.enable();
      setStatus('Wallet enabled');

      // Step 3: Get accounts
      const accounts = await adapter.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No KILT accounts found');
      }

      const selectedAccount = accounts[0];
      setStatus(`Using account: ${selectedAccount.address}`);

      // Step 4: Create real on-chain DID
      const didProvider = new KILTDIDProvider(adapter);
      
      // This will create a REAL on-chain DID
      const didString = await didProvider.createDid(selectedAccount.address);
      
      // Register on-chain
      const didResult = await didProvider.registerDidOnchain({}, selectedAccount.address);
      
      setStatus('✅ On-chain DID created!');
      setResult({
        did: didResult.did,
        address: selectedAccount.address,
        method: 'KILT',
        onChain: true,
        message: 'This DID is registered on KILT blockchain'
      });
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'Failed to create DID');
      setStatus('❌ DID creation failed');
      setLoading(false);
    }
  };

  return (
    <div className="onchain-demo">
      <div className="demo-container">
        <h1>🔗 KeyPass On-Chain DID Demo</h1>
        <p className="subtitle">
          Create real DIDs on KILT blockchain with actual transactions
        </p>

        <div className="demo-section">
          <h2>On-Chain vs Off-Chain</h2>
          
          <div className="comparison">
            <div className="comparison-item offchain">
              <h3>❌ Off-Chain DID</h3>
              <div className="example">did:key:zpolkadotCd1HrNp...</div>
              <ul>
                <li>No transaction</li>
                <li>No gas fees</li>
                <li>Not on blockchain</li>
                <li>Cannot verify on explorer</li>
              </ul>
            </div>

            <div className="comparison-item onchain">
              <h3>✅ On-Chain DID</h3>
              <div className="example">did:kilt:4abc123def...</div>
              <ul>
                <li>Real transaction</li>
                <li>Pays gas fees</li>
                <li>On KILT blockchain</li>
                <li>Verifiable on explorer</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h2>Create On-Chain DID</h2>
          
          <div className="requirements">
            <h4>Prerequisites:</h4>
            <ul>
              <li>✅ KILT wallet extension installed</li>
              <li>✅ Account on KILT Spiritnet</li>
              <li>✅ KILT tokens for gas fees</li>
            </ul>
            <p>
              <a href="https://faucet.kilt.io/" target="_blank" rel="noopener noreferrer">
                Get KILT tokens →
              </a>
            </p>
          </div>

          <button 
            onClick={createOnChainDID}
            disabled={loading}
            className="create-button"
          >
            {loading ? 'Processing...' : '🔗 Create On-Chain KILT DID'}
          </button>

          {status && (
            <div className="status-box">
              <strong>Status:</strong> {status}
            </div>
          )}

          {error && (
            <div className="error-box">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="result-box">
              <h3>✅ On-Chain DID Created!</h3>
              <div className="result-details">
                <div className="result-item">
                  <strong>DID:</strong>
                  <code>{result.did}</code>
                </div>
                <div className="result-item">
                  <strong>Method:</strong>
                  <span className="method-badge">{result.method}</span>
                </div>
                <div className="result-item">
                  <strong>On-Chain:</strong>
                  <span className="status-badge">✅ YES</span>
                </div>
                <div className="result-item">
                  <strong>Address:</strong>
                  <code>{result.address}</code>
                </div>
              </div>
              <div className="verify-box">
                <p>🔍 Verify on blockchain:</p>
                <a 
                  href={`https://spiritnet.subscan.io/account/${result.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                >
                  View on KILT Explorer →
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="demo-section">
          <h2>How It Works</h2>
          <ol className="steps">
            <li>Connect to KILT Spiritnet (wss://spiritnet.kilt.io)</li>
            <li>Enable KILT wallet extension</li>
            <li>Get your KILT account address</li>
            <li>Submit transaction to KILT blockchain</li>
            <li>Wait for block confirmation</li>
            <li>DID is now on-chain and verifiable!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

