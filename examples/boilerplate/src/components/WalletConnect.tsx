import { useState, useEffect } from 'react';
import { connectWallet } from '@keypass/login-sdk';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onError?: (error: Error) => void;
}

export function WalletConnect({ onConnect, onError }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check wallet connection status only when the component mounts or account changes
  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      if (!account || !mounted) return;
      
      try {
        const wallet = await connectWallet();
        const accounts = await wallet.getAccounts();
        const currentAccount = accounts.find(acc => acc.address === account);
        
        if (!currentAccount && mounted) {
          console.log('Wallet disconnected: Account no longer available');
          setAccount(null);
          setError('Wallet disconnected');
        }
      } catch (err) {
        if (mounted) {
          console.log('Wallet disconnected: Connection error', err);
          setAccount(null);
          setError('Wallet disconnected');
        }
      }
    };

    // Initial check
    checkConnection();

    // Set up a more reasonable interval (30 seconds)
    const interval = setInterval(checkConnection, 30000);

    // Cleanup function
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [account]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      console.log('Attempting to connect wallet...');

      // Connect to wallet
      const wallet = await connectWallet();
      
      // Get available accounts
      const accounts = await wallet.getAccounts();
      if (!accounts.length) {
        throw new Error('No accounts found in wallet');
      }
      
      const selectedAccount = accounts[0].address;
      console.log('Wallet connected successfully:', selectedAccount);
      
      // Update state
      setAccount(selectedAccount);
      onConnect?.(selectedAccount);

    } catch (err) {
      const error = err as Error;
      console.error('Wallet connection failed:', error.message);
      setError(error.message);
      onError?.(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    console.log('Manual disconnect initiated');
    setAccount(null);
    setError(null);
  };

  return (
    <div className="p-4 rounded-lg bg-white shadow-md">
      <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
      
      {!account ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connected Account:
            <span className="ml-2 font-mono text-gray-800">{account}</span>
          </p>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
} 