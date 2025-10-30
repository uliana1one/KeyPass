import React, { useState } from 'react';
import { KiltAdapter } from '../keypass/adapters/KiltAdapter';
import { KILTDIDProvider } from '../keypass/did/KILTDIDProvider';
import { KILTNetwork } from '../keypass/config/kiltConfig';
import { SBTMintingService } from '../keypass/services/SBTMintingService';
import { MoonbeamAdapter } from '../keypass/adapters/MoonbeamAdapter';
import { MoonbeamNetwork } from '../keypass/config/moonbeamConfig';
import { MoonbeamDIDProvider } from '../keypass/did/providers/MoonbeamDIDProvider';
import { ethers } from 'ethers';
import './RealOnChainDemo.css';

interface OnChainResult {
  type: 'did' | 'sbt';
  success: boolean;
  data: any;
  txHash?: string;
  explorerUrl?: string;
}

export const RealOnChainDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [results, setResults] = useState<OnChainResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [kiltAccount, setKiltAccount] = useState<string>('');
  const [moonbeamAccount, setMoonbeamAccount] = useState<string>('');

  const connectKILT = async () => {
    setLoading(true);
    setError(null);
    setCurrentStep('Connecting to KILT Spiritnet...');
    
    try {
      const adapter = new KiltAdapter(KILTNetwork.SPIRITNET);
      await adapter.connect();
      await adapter.enable();
      
      const accounts = await adapter.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No KILT accounts found');
      }
      
      setKiltAccount(accounts[0].address);
      setCurrentStep('✅ Connected to KILT');
      return adapter;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createKILTDID = async () => {
    setLoading(true);
    setError(null);
    setCurrentStep('Creating on-chain KILT DID...');
    
    try {
      const adapter = await connectKILT();
      const provider = new KILTDIDProvider(adapter);
      
      const result = await provider.registerDidOnchain({}, kiltAccount);
      
      const explorerUrl = `https://spiritnet.subscan.io/extrinsic/${result.transactionResult.transactionHash}`;
      
      setResults(prev => [...prev, {
        type: 'did',
        success: true,
        data: {
          did: result.did,
          address: kiltAccount,
          blockNumber: result.transactionResult.blockNumber
        },
        txHash: result.transactionResult.transactionHash,
        explorerUrl
      }]);
      
      setCurrentStep('✅ KILT DID created on-chain!');
    } catch (err: any) {
      setError(err.message);
      setResults(prev => [...prev, {
        type: 'did',
        success: false,
        data: { error: err.message }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const connectMoonbeam = async () => {
    setLoading(true);
    setError(null);
    setCurrentStep('Connecting to Moonbeam Moonbase Alpha...');
    
    try {
      const adapter = new MoonbeamAdapter(MoonbeamNetwork.MOONBASE_ALPHA);
      await adapter.connect();
      
      // Get wallet from MetaMask
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setMoonbeamAccount(address);
      setCurrentStep('✅ Connected to Moonbeam');
      return { adapter, signer };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const mintSBT = async () => {
    setLoading(true);
    setError(null);
    setCurrentStep('Minting SBT for identity...');
    
    try {
      const { adapter, signer } = await connectMoonbeam();
      
      // Create DID provider for Moonbeam
      const didProvider = new MoonbeamDIDProvider(adapter, '0x0000000000000000000000000000000000000000');
      
      // Get the KILT DID from previous step
      const kiltDidResult = results.find(r => r.type === 'did' && r.success);
      if (!kiltDidResult) {
        throw new Error('KILT DID must be created first');
      }
      
      const kiltDID = kiltDidResult.data.did;
      
      // Prepare SBT metadata
      const metadata = {
        name: 'KeyPass Identity SBT',
        description: `Soulbound token for KILT DID: ${kiltDID}`,
        image: 'https://example.com/sbt.png',
        attributes: [
          { trait_type: 'KILT DID', value: kiltDID },
          { trait_type: 'Identity Type', value: 'Verified' },
          { trait_type: 'Mint Date', value: new Date().toISOString() }
        ]
      };
      
      // Mint SBT (this would need a deployed contract address)
      const contractAddress = '0x0000000000000000000000000000000000000000'; // Replace with actual
      const sbtService = new SBTMintingService(adapter, contractAddress, {});
      
      const result = await sbtService.mintSBT(
        contractAddress as `0x${string}`,
        {
          to: moonbeamAccount as `0x${string}`,
          metadata
        },
        signer
      );
      
      const explorerUrl = `https://moonbase.moonscan.io/tx/${result.transactionHash}`;
      
      setResults(prev => [...prev, {
        type: 'sbt',
        success: true,
        data: {
          tokenId: result.tokenId,
          recipient: moonbeamAccount,
          metadata
        },
        txHash: result.transactionHash,
        explorerUrl
      }]);
      
      setCurrentStep('✅ SBT minted for identity!');
    } catch (err: any) {
      setError(err.message);
      setResults(prev => [...prev, {
        type: 'sbt',
        success: false,
        data: { error: err.message }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runCompleteFlow = async () => {
    setResults([]);
    setError(null);
    
    try {
      // Step 1: Create KILT DID
      await createKILTDID();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Mint SBT for identity
      await mintSBT();
      
      setCurrentStep('✅ Complete! On-chain DID and SBT created.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="real-onchain-demo">
      <div className="demo-container">
        <h1>🔗 KeyPass On-Chain Identity Demo</h1>
        <p className="subtitle">
          Create real KILT DIDs on-chain • Mint SBTs for identities
        </p>

        <div className="demo-flow">
          <div className="flow-steps">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Create KILT DID</h3>
              <p>Register identity on KILT blockchain</p>
              <div className="step-details">
                <strong>On-Chain:</strong> ✅ YES<br/>
                <strong>Cost:</strong> Gas fees only<br/>
                <strong>Blockchain:</strong> KILT Spiritnet
              </div>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Mint SBT</h3>
              <p>Issue soulbound token for identity</p>
              <div className="step-details">
                <strong>On-Chain:</strong> ✅ YES<br/>
                <strong>Cost:</strong> Gas fees only<br/>
                <strong>Blockchain:</strong> Moonbeam Moonbase Alpha
              </div>
            </div>
          </div>
        </div>

        <div className="demo-actions">
          <button 
            onClick={runCompleteFlow}
            disabled={loading}
            className="primary-button"
          >
            {loading ? 'Processing...' : '🚀 Create On-Chain Identity'}
          </button>
          
          <button 
            onClick={createKILTDID}
            disabled={loading}
            className="secondary-button"
          >
            Step 1: Create KILT DID Only
          </button>
        </div>

        {currentStep && (
          <div className="status-box">
            <strong>Status:</strong> {currentStep}
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section">
            <h2>On-Chain Results</h2>
            
            {results.map((result, index) => (
              <div key={index} className={`result-card ${result.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  <h3>
                    {result.type === 'did' ? '🔗 KILT DID' : '🎨 SBT Token'}
                    {result.success && ' ✅'}
                  </h3>
                </div>

                {result.success ? (
                  <>
                    {result.type === 'did' && (
                      <>
                        <div className="result-field">
                          <strong>DID:</strong>
                          <code>{result.data.did}</code>
                        </div>
                        <div className="result-field">
                          <strong>Address:</strong>
                          <code>{result.data.address}</code>
                        </div>
                        <div className="result-field">
                          <strong>Block Number:</strong>
                          <code>{result.data.blockNumber}</code>
                        </div>
                      </>
                    )}
                    
                    {result.type === 'sbt' && (
                      <>
                        <div className="result-field">
                          <strong>Token ID:</strong>
                          <code>{result.data.tokenId}</code>
                        </div>
                        <div className="result-field">
                          <strong>Recipient:</strong>
                          <code>{result.data.recipient}</code>
                        </div>
                      </>
                    )}

                    {result.txHash && (
                      <div className="result-field">
                        <strong>Transaction Hash:</strong>
                        <code>{result.txHash}</code>
                      </div>
                    )}

                    {result.explorerUrl && (
                      <a 
                        href={result.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="explorer-button"
                      >
                        🔍 View on Blockchain Explorer
                      </a>
                    )}
                  </>
                ) : (
                  <div className="result-field error-text">
                    <strong>Error:</strong> {result.data.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="info-section">
          <h2>How On-Chain Identity Works</h2>
          
          <div className="info-grid">
            <div className="info-card">
              <h3>🔗 KILT DID</h3>
              <ul>
                <li>✅ <strong>Real blockchain transaction</strong></li>
                <li>✅ <strong>Stored on KILT Spiritnet</strong></li>
                <li>✅ <strong>Verifiable on Subscan</strong></li>
                <li>✅ <strong>Immutable identity</strong></li>
              </ul>
            </div>

            <div className="info-card">
              <h3>🎨 SBT Token</h3>
              <ul>
                <li>✅ <strong>Real ERC-721 transaction</strong></li>
                <li>✅ <strong>Non-transferable (soulbound)</strong></li>
                <li>✅ <strong>Linked to KILT DID</strong></li>
                <li>✅ <strong>Verifiable on Moonscan</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="prerequisites">
          <h2>Prerequisites</h2>
          <ul>
            <li>Install <a href="https://polkadot.js.org/extension/" target="_blank">Polkadot.js Extension</a></li>
            <li>Add KILT account to extension</li>
            <li>Get KILT tokens: <a href="https://faucet.kilt.io/" target="_blank">KILT Faucet</a></li>
            <li>Install <a href="https://metamask.io/" target="_blank">MetaMask</a></li>
            <li>Add Moonbase Alpha network to MetaMask</li>
            <li>Get DEV tokens: <a href="https://apps.moonbeam.network/moonbase-alpha/faucet/" target="_blank">Moonbeam Faucet</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

