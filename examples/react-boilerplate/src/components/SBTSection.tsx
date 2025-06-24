import React, { useState, useEffect } from 'react';
import { SBTGrid } from './SBTGrid';
import { SBTToken } from './SBTCard';
import { sbtService } from '../services/sbtService';
import { API_CONFIG } from '../config/api';

// Mock SBT service for demonstration (fallback)
const mockSBTService = {
  async getTokens(walletAddress: string): Promise<SBTToken[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: '1',
        name: 'Ethereum Developer Certification',
        description: 'Certified Ethereum smart contract developer with expertise in Solidity and DeFi protocols.',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
        issuer: '0x1234567890123456789012345678901234567890',
        issuerName: 'Ethereum Foundation',
        issuedAt: '2024-01-15T10:30:00Z',
        expiresAt: '2025-01-15T10:30:00Z',
        chainId: '1',
        chainType: 'Ethereum',
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        tokenStandard: 'ERC-721',
        verificationStatus: 'verified' as const,
        attributes: [
          { trait_type: 'Level', value: 'Advanced' },
          { trait_type: 'Skills', value: 'Solidity, DeFi, Smart Contracts' },
          { trait_type: 'Experience', value: '3+ years' }
        ],
        revocable: true,
        tags: ['Developer', 'Certification', 'Ethereum']
      },
      {
        id: '2',
        name: 'Polkadot Ambassador',
        description: 'Official Polkadot ecosystem ambassador with proven contributions to the community.',
        image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=300&fit=crop',
        issuer: '0x2345678901234567890123456789012345678901',
        issuerName: 'Polkadot Network',
        issuedAt: '2024-02-20T14:15:00Z',
        chainId: '0',
        chainType: 'Polkadot',
        contractAddress: '0xbcdef1234567890abcdef1234567890abcdef123',
        tokenStandard: 'ERC-721',
        verificationStatus: 'verified' as const,
        attributes: [
          { trait_type: 'Role', value: 'Ambassador' },
          { trait_type: 'Region', value: 'North America' },
          { trait_type: 'Contributions', value: '50+' }
        ],
        revocable: false,
        tags: ['Ambassador', 'Polkadot', 'Community']
      },
      {
        id: '3',
        name: 'DeFi Protocol Contributor',
        description: 'Active contributor to major DeFi protocols with significant impact on the ecosystem.',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
        issuer: '0x3456789012345678901234567890123456789012',
        issuerName: 'DeFi Alliance',
        issuedAt: '2024-03-10T09:45:00Z',
        expiresAt: '2024-12-31T23:59:59Z',
        chainId: '1',
        chainType: 'Ethereum',
        contractAddress: '0xcdef1234567890abcdef1234567890abcdef1234',
        tokenStandard: 'ERC-721',
        verificationStatus: 'pending' as const,
        attributes: [
          { trait_type: 'Protocols', value: 'Uniswap, Aave, Compound' },
          { trait_type: 'Contributions', value: '100+' },
          { trait_type: 'Impact Score', value: '95' }
        ],
        revocable: true,
        tags: ['DeFi', 'Contributor', 'Protocol']
      },
      {
        id: '4',
        name: 'Blockchain Security Expert',
        description: 'Certified blockchain security expert with specialization in smart contract auditing.',
        image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=300&fit=crop',
        issuer: '0x4567890123456789012345678901234567890123',
        issuerName: 'Security Guild',
        issuedAt: '2024-01-05T16:20:00Z',
        chainId: '1',
        chainType: 'Ethereum',
        contractAddress: '0xdef1234567890abcdef1234567890abcdef12345',
        tokenStandard: 'ERC-721',
        verificationStatus: 'verified' as const,
        attributes: [
          { trait_type: 'Specialization', value: 'Smart Contract Auditing' },
          { trait_type: 'Audits Completed', value: '25+' },
          { trait_type: 'Success Rate', value: '100%' }
        ],
        revocable: false,
        tags: ['Security', 'Auditing', 'Expert']
      },
      {
        id: '5',
        name: 'DAO Governance Participant',
        description: 'Active participant in DAO governance with voting power and proposal creation rights.',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
        issuer: '0x5678901234567890123456789012345678901234',
        issuerName: 'DAO Collective',
        issuedAt: '2024-02-28T11:00:00Z',
        chainId: '1',
        chainType: 'Ethereum',
        contractAddress: '0xef1234567890abcdef1234567890abcdef123456',
        tokenStandard: 'ERC-721',
        verificationStatus: 'verified' as const,
        attributes: [
          { trait_type: 'Voting Power', value: '1000' },
          { trait_type: 'Proposals Created', value: '5' },
          { trait_type: 'Participation Rate', value: '85%' }
        ],
        revocable: true,
        tags: ['DAO', 'Governance', 'Voting']
      },
      {
        id: '6',
        name: 'NFT Artist Recognition',
        description: 'Recognized NFT artist with successful collections and community engagement.',
        image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=300&fit=crop',
        issuer: '0x6789012345678901234567890123456789012345',
        issuerName: 'NFT Art Council',
        issuedAt: '2024-03-15T13:30:00Z',
        chainId: '1',
        chainType: 'Ethereum',
        contractAddress: '0xf1234567890abcdef1234567890abcdef1234567',
        tokenStandard: 'ERC-721',
        verificationStatus: 'failed' as const,
        attributes: [
          { trait_type: 'Collections', value: '3' },
          { trait_type: 'Total Sales', value: '50 ETH' },
          { trait_type: 'Community Size', value: '10K+' }
        ],
        revocable: false,
        tags: ['NFT', 'Artist', 'Creative']
      }
    ];
  }
};

interface SBTSectionProps {
  walletAddress: string;
  useRealData?: boolean; // Toggle between real and mock data
}

export const SBTSection: React.FC<SBTSectionProps> = ({ 
  walletAddress, 
  useRealData = true // Enable real data by default
}) => {
  const [tokens, setTokens] = useState<SBTToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<'real' | 'mock' | 'test'>(
    useRealData ? 'real' : 'mock'
  );

  // Configure SBT service with test mode
  const configuredSbtService = new (sbtService.constructor as any)({
    enableTestMode: dataSource === 'test',
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000
  });

  const loadTokens = async () => {
    try {
      setError(null);
      let fetchedTokens: SBTToken[];
      
      if (dataSource === 'real') {
        // Use real SBT service (requires API keys)
        fetchedTokens = await sbtService.getTokens(walletAddress);
      } else if (dataSource === 'test') {
        // Use test mode with realistic simulated data
        fetchedTokens = await configuredSbtService.getTokens(walletAddress);
      } else {
        // Use mock service for demonstration
        fetchedTokens = await mockSBTService.getTokens(walletAddress);
      }
      
      setTokens(fetchedTokens);
    } catch (err) {
      setError('Failed to load Soulbound Tokens. Please try again.');
      console.error('Error loading SBTs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTokens();
    setRefreshing(false);
  };

  const handleTokenClick = (token: SBTToken) => {
    // In a real app, this would open a modal with detailed token information
    console.log('Token clicked:', token);
    alert(`Viewing details for: ${token.name}\n\nThis would open a detailed modal with:\n- Full token metadata\n- Verification details\n- Blockchain transaction history\n- Issuer information\n- Token attributes and properties`);
  };

  const toggleDataSource = () => {
    const sources: ('real' | 'mock' | 'test')[] = ['mock', 'test', 'real'];
    const currentIndex = sources.indexOf(dataSource);
    const newDataSource = sources[(currentIndex + 1) % sources.length];
    setDataSource(newDataSource);
    setLoading(true);
    // Reload tokens with new data source
    setTimeout(() => loadTokens(), 100);
  };

  useEffect(() => {
    loadTokens();
  }, [walletAddress, dataSource]);

  const getDataSourceLabel = () => {
    switch (dataSource) {
      case 'real': return 'Real Data';
      case 'test': return 'Test Mode';
      case 'mock': return 'Demo Data';
      default: return 'Demo Data';
    }
  };

  const getDataSourceDescription = () => {
    switch (dataSource) {
      case 'real': return 'Fetching from actual blockchain APIs (requires configuration)';
      case 'test': return 'Simulated real API calls with realistic test data';
      case 'mock': return 'Static demo data for UI demonstration';
      default: return 'Static demo data for UI demonstration';
    }
  };

  return (
    <div className="sbt-section">
      <div className="sbt-section-header">
        <div>
          <h2 className="sbt-section-title">Soulbound Tokens</h2>
          <p className="sbt-section-subtitle">
            Your digital credentials and achievements on the blockchain
            <br />
            <small style={{ color: '#6b7280', fontSize: '12px' }}>
              Mode: {getDataSourceLabel()} - {getDataSourceDescription()}
            </small>
          </p>
        </div>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setDataSource('mock')}
            style={{
              padding: '8px 16px',
              background: dataSource === 'mock' ? '#3b82f6' : '#e5e7eb',
              color: dataSource === 'mock' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Demo Data
          </button>
          <button
            onClick={() => setDataSource('test')}
            style={{
              padding: '8px 16px',
              background: dataSource === 'test' ? '#3b82f6' : '#e5e7eb',
              color: dataSource === 'test' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Test Mode
          </button>
          <button
            onClick={() => setDataSource('real')}
            style={{
              padding: '8px 16px',
              background: dataSource === 'real' ? '#3b82f6' : '#e5e7eb',
              color: dataSource === 'real' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Real Data
          </button>
          <button
            onClick={async () => {
              console.log('🔍 Testing real data fetching...');
              console.log('Wallet address:', walletAddress);
              console.log('API config:', API_CONFIG);
              try {
                const testTokens = await configuredSbtService.getTokens(walletAddress);
                console.log('✅ Real data fetch result:', testTokens);
                console.log('📊 Tokens found:', testTokens.length);
              } catch (error) {
                console.error('❌ Real data fetch error:', error);
              }
            }}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🧪 Test Fetch
          </button>
          <button
            className="sbt-refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '8px 16px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="sbt-error">
          <svg className="sbt-error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="sbt-error-text">{error}</span>
        </div>
      )}

      {dataSource === 'test' && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          background: '#f0f9ff', 
          border: '1px solid #bfdbfe', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1e40af'
        }}>
          <strong>Test Mode:</strong> This simulates real API calls with realistic test data:
          <ul style={{ margin: '8px 0 0 20px' }}>
            <li>Simulates API delays and network requests</li>
            <li>Generates different tokens based on wallet address</li>
            <li>Includes realistic metadata, attributes, and verification statuses</li>
            <li>Perfect for testing the real data flow without API keys</li>
          </ul>
        </div>
      )}

      {dataSource === 'real' && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          background: '#f0f9ff', 
          border: '1px solid #bfdbfe', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1e40af'
        }}>
          <strong>Real Data Mode:</strong> Fetching actual SBT tokens from multiple sources:
          <ul style={{ margin: '8px 0 0 20px' }}>
            <li>✅ Ethereum blockchain via Etherscan API</li>
            <li>✅ Polygon blockchain via Alchemy RPC</li>
            <li>✅ Gitcoin Passport registry</li>
            <li>✅ Known SBT contract addresses</li>
          </ul>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            <strong>Note:</strong> API calls are being made with placeholder keys. For production use, 
            add real API keys to your .env file (see env-template.txt for setup instructions).
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#059669' }}>
            <strong>Status:</strong> Real data fetching is active. Check browser console for API call logs.
          </p>
        </div>
      )}

      <SBTGrid
        tokens={tokens}
        loading={loading}
        onTokenClick={handleTokenClick}
      />
    </div>
  );
}; 