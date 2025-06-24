import React, { useState, useEffect } from 'react';
import './App.css';
import { SBTSection } from './components/SBTSection';

// Types
interface Wallet {
  id: string;
  name: string;
  status: string;
  available: boolean;
  extension?: any;
  provider?: any;
}

interface Account {
  address: string;
  name: string;
  meta?: any;
  injectedExtension?: any;
  provider?: any;
}

interface LoginResult {
  address: string;
  did: string;
  chainType: string;
  signature: string;
  message: string;
  issuedAt: string;
  nonce: string;
  accountName: string;
}

// Declare global types for wallet extensions
declare global {
  interface Window {
    injectedWeb3?: any;
    ethereum?: any;
  }
}

// Wallet detection functions
const detectPolkadotWallets = async (): Promise<Wallet[]> => {
  const wallets: Wallet[] = [];
  
  // Wait for extensions to load
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (window.injectedWeb3) {
    const extensions = Object.keys(window.injectedWeb3);
    
    for (const extensionName of extensions) {
      const extension = window.injectedWeb3[extensionName];
      let displayName = extensionName;
      let status = 'Available';
      
      // Map extension names to display names
      if (extensionName === 'polkadot-js') {
        displayName = 'Polkadot.js Extension';
      } else if (extensionName === 'talisman') {
        displayName = 'Talisman';
      } else if (extensionName === 'subwallet-js') {
        displayName = 'SubWallet';
      }
      
      // Check if extension is available
      if (!extension.enable) {
        status = 'Not Compatible';
      }
      
      wallets.push({
        id: extensionName,
        name: displayName,
        status: status,
        available: extension.enable !== undefined,
        extension: extension
      });
    }
  }
  
  if (wallets.length === 0) {
    wallets.push({
      id: 'none',
      name: 'No Polkadot wallets detected',
      status: 'Install Polkadot.js or Talisman',
      available: false,
      extension: null
    });
  }
  
  return wallets;
};

const detectEthereumWallets = async (): Promise<Wallet[]> => {
  const wallets: Wallet[] = [];
  
  // Check for MetaMask
  if (window.ethereum) {
    let walletName = 'Ethereum Wallet';
    
    // Try to detect specific wallet
    if (window.ethereum.isMetaMask) {
      walletName = 'MetaMask';
    } else if (window.ethereum.isTrust) {
      walletName = 'Trust Wallet';
    } else if (window.ethereum.isCoinbaseWallet) {
      walletName = 'Coinbase Wallet';
    }
    
    wallets.push({
      id: 'ethereum',
      name: walletName,
      status: 'Available',
      available: true,
      provider: window.ethereum
    });
  }
  
  if (wallets.length === 0) {
    wallets.push({
      id: 'none',
      name: 'No Ethereum wallets detected',
      status: 'Install MetaMask or another Ethereum wallet',
      available: false,
      provider: null
    });
  }
  
  return wallets;
};

// Account fetching functions
const getPolkadotAccounts = async (wallet: Wallet): Promise<Account[]> => {
  try {
    const injectedExtension = await wallet.extension.enable('KeyPass Demo');
    if (!injectedExtension) {
      throw new Error('Failed to enable extension');
    }
    
    const accounts = await injectedExtension.accounts.get();
    return accounts.map((account: any) => ({
      address: account.address,
      name: account.name || 'Unnamed Account',
      meta: account.meta,
      injectedExtension: injectedExtension
    }));
  } catch (error: any) {
    throw new Error(`Failed to get accounts: ${error.message}`);
  }
};

const getEthereumAccounts = async (wallet: Wallet): Promise<Account[]> => {
  try {
    const accounts = await wallet.provider.request({
      method: 'eth_requestAccounts'
    });
    
    return accounts.map((address: string, index: number) => ({
      address: address,
      name: `Account ${index + 1}`,
      provider: wallet.provider
    }));
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    }
    throw new Error(`Failed to get accounts: ${error.message}`);
  }
};

// Authentication functions
const authenticateWithPolkadot = async (account: Account): Promise<LoginResult> => {
  try {
    // Create message to sign
    const message = `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: ${Math.random().toString(36).substring(7)}\nAddress: ${account.address}`;
    
    // Sign the message
    const signature = await account.injectedExtension.signer.signRaw({
      address: account.address,
      data: message,
      type: 'bytes'
    });

    return {
      address: account.address,
      did: `did:key:${account.address}`,
      chainType: 'polkadot',
      signature: signature.signature,
      message: message,
      issuedAt: new Date().toISOString(),
      nonce: Math.random().toString(36).substring(7),
      accountName: account.name
    };
  } catch (error: any) {
    throw new Error(`Signing failed: ${error.message}`);
  }
};

const authenticateWithEthereum = async (account: Account): Promise<LoginResult> => {
  try {
    // Create message to sign
    const message = `KeyPass Login\nIssued At: ${new Date().toISOString()}\nNonce: ${Math.random().toString(36).substring(7)}\nAddress: ${account.address}`;
    
    // Sign the message
    const signature = await account.provider.request({
      method: 'personal_sign',
      params: [message, account.address]
    });

    return {
      address: account.address,
      did: `did:ethr:${account.address}`,
      chainType: 'ethereum',
      signature: signature,
      message: message,
      issuedAt: new Date().toISOString(),
      nonce: Math.random().toString(36).substring(7),
      accountName: account.name
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the signing request');
    }
    throw new Error(`Signing failed: ${error.message}`);
  }
};

function App() {
  // State management
  const [currentView, setCurrentView] = useState<'login' | 'wallet-selection' | 'profile'>('login');
  const [currentChainType, setCurrentChainType] = useState<'polkadot' | 'ethereum' | null>(null);
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wallets when chain type is selected
  useEffect(() => {
    if (currentChainType && currentView === 'wallet-selection') {
      loadWallets();
    }
  }, [currentChainType, currentView]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let wallets: Wallet[];
      if (currentChainType === 'polkadot') {
        wallets = await detectPolkadotWallets();
      } else {
        wallets = await detectEthereumWallets();
      }
      
      setAvailableWallets(wallets);
    } catch (err: any) {
      setError(`Failed to load wallets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChainSelection = (chainType: 'polkadot' | 'ethereum') => {
    setCurrentChainType(chainType);
    setCurrentView('wallet-selection');
    setError(null);
    resetSelection();
  };

  const resetSelection = () => {
    setSelectedWallet(null);
    setSelectedAccount(null);
    setAvailableAccounts([]);
  };

  const handleWalletSelection = async (wallet: Wallet) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedWallet(wallet);
      setSelectedAccount(null);
      
      let accounts: Account[];
      if (currentChainType === 'polkadot') {
        accounts = await getPolkadotAccounts(wallet);
      } else {
        accounts = await getEthereumAccounts(wallet);
      }
      
      setAvailableAccounts(accounts);
    } catch (err: any) {
      setError(err.message);
      setAvailableAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelection = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleConnect = async () => {
    if (!selectedWallet || !selectedAccount) {
      setError('Please select a wallet and account');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      let result: LoginResult;
      if (currentChainType === 'polkadot') {
        result = await authenticateWithPolkadot(selectedAccount);
      } else {
        result = await authenticateWithEthereum(selectedAccount);
      }
      
      setLoginResult(result);
      setCurrentView('profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoginResult(null);
    setCurrentView('login');
    setCurrentChainType(null);
    resetSelection();
    setError(null);
  };

  const handleBackToChain = () => {
    setCurrentView('login');
    setCurrentChainType(null);
    resetSelection();
    setError(null);
  };

  // Render functions
  const renderLogin = () => (
    <div className="login-section">
      <h2>Choose Your Chain</h2>
      <div className="button-group">
        <button 
          className="login-button polkadot"
          onClick={() => handleChainSelection('polkadot')}
          disabled={loading}
        >
          Login with Polkadot
        </button>
        
        <button 
          className="login-button ethereum"
          onClick={() => handleChainSelection('ethereum')}
          disabled={loading}
        >
          Login with Ethereum
        </button>
      </div>
      
      {error && (
        <div className="error">
          {error}
        </div>
      )}
      
      <div className="info-section">
        <h3>Prerequisites</h3>
        <ul>
          <li><strong>For Polkadot:</strong> Install <a href="https://polkadot.js.org/extension/" target="_blank" rel="noopener noreferrer">Polkadot.js</a> or <a href="https://talisman.xyz/" target="_blank" rel="noopener noreferrer">Talisman</a></li>
          <li><strong>For Ethereum:</strong> Install <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> or another Ethereum wallet</li>
          <li><strong>HTTPS:</strong> This demo requires HTTPS in production</li>
        </ul>
      </div>
    </div>
  );

  const renderWalletSelection = () => (
    <div className="wallet-selection">
      <button className="back-button" onClick={handleBackToChain}>
        ← Back to Chain Selection
      </button>
      <h3>Choose Your {currentChainType === 'polkadot' ? 'Polkadot' : 'Ethereum'} Wallet</h3>
      
      {loading && !selectedWallet && (
        <div className="loading">Loading wallets...</div>
      )}
      
      <div className="wallet-grid">
        {availableWallets.map(wallet => (
          <div 
            key={wallet.id}
            className={`wallet-option ${!wallet.available ? 'disabled' : ''} ${selectedWallet?.id === wallet.id ? 'selected' : ''}`}
            onClick={() => wallet.available && handleWalletSelection(wallet)}
          >
            <div className="wallet-name">{wallet.name}</div>
            <div className="wallet-status">{wallet.status}</div>
          </div>
        ))}
      </div>

      {selectedWallet && (
        <div className="account-selection">
          <h4>Select Account</h4>
          {loading && (
            <div className="loading">Loading accounts...</div>
          )}
          
          <div className="account-list">
            {availableAccounts.map((account, index) => (
              <div 
                key={`${account.address}-${index}`}
                className={`account-option ${selectedAccount?.address === account.address ? 'selected' : ''}`}
                onClick={() => handleAccountSelection(account)}
              >
                <div className="account-address">{account.address}</div>
                <div className="account-name">{account.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="selection-buttons">
        <button 
          className="selection-button primary"
          onClick={handleConnect}
          disabled={!selectedWallet || !selectedAccount || loading}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
        <button 
          className="selection-button secondary"
          onClick={handleBackToChain}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="profile-section">
      <h2>Authentication Successful!</h2>
      <div className="profile-card">
        <div className="chain-badge">
          {loginResult?.chainType === 'polkadot' ? 'Polkadot' : 'Ethereum'}
        </div>
        
        <div className="profile-info">
          <div className="info-row">
            <strong>Account:</strong>
            <span>{loginResult?.accountName}</span>
          </div>
          
          <div className="info-row">
            <strong>Address:</strong>
            <code>{loginResult?.address}</code>
          </div>
          
          <div className="info-row">
            <strong>DID:</strong>
            <code>{loginResult?.did}</code>
          </div>
          
          <div className="info-row">
            <strong>Chain:</strong>
            <span>{loginResult?.chainType}</span>
          </div>
          
          <div className="info-row">
            <strong>Logged in at:</strong>
            <span>{loginResult ? new Date(loginResult.issuedAt).toLocaleString() : ''}</span>
          </div>
        </div>
        
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      {/* SBT Section */}
      {loginResult?.address && (
        <SBTSection userAddress={loginResult.address} />
      )}
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>KeyPass Multi-Chain Auth</h1>
        <p>Secure authentication for Polkadot and Ethereum</p>
        
        {currentView === 'login' && renderLogin()}
        {currentView === 'wallet-selection' && renderWalletSelection()}
        {currentView === 'profile' && renderProfile()}
        
        <div className="footer">
          <p>
            <a href="https://github.com/uliana1one/keypass" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </p>
        </div>
      </header>
    </div>
  );
}

export default App; 