import React, { useState, useEffect, useCallback, useRef } from 'react';
import { connectWallet } from '@keypass/login-sdk/dist/walletConnector';
import type { WalletAdapter, WalletAccount } from '@keypass/login-sdk/dist/adapters/types';

interface ConnectedWallet {
  instance: WalletAdapter;
  account: string;
  provider: string;
}

interface WalletConnectProps {
  onConnect?: (accounts: string[]) => void;
  onError?: (error: Error) => void;
}

export function WalletConnect({ onConnect, onError }: WalletConnectProps) {
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [accountModal, setAccountModal] = useState<{
    wallet: WalletAdapter;
    provider: string;
    accounts: WalletAccount[];
  } | null>(null);
  const mountedRef = useRef(true);

  // Reset specific wallet connection
  const resetWallet = useCallback(async (walletToReset?: ConnectedWallet) => {
    if (!mountedRef.current) return;

    try {
      if (walletToReset) {
        console.log('Disconnecting specific wallet...');
        await walletToReset.instance.disconnect();
        console.log('Wallet disconnected successfully');
        
        if (mountedRef.current) {
          setConnectedWallets(prev => prev.filter(w => w.account !== walletToReset.account));
          onConnect?.(connectedWallets.filter(w => w.account !== walletToReset.account).map(w => w.account));
        }
      } else {
        // Reset all wallets
        console.log('Disconnecting all wallets...');
        await Promise.all(connectedWallets.map(wallet => wallet.instance.disconnect()));
        console.log('All wallets disconnected successfully');
        
        if (mountedRef.current) {
          setConnectedWallets([]);
          onConnect?.([]);
        }
      }
      setError(null);
    } catch (error) {
      console.error('Error during wallet disconnect:', error);
      if (mountedRef.current) {
        setError(error instanceof Error ? error.message : 'Disconnect failed');
        onError?.(error instanceof Error ? error : new Error('Disconnect failed'));
      }
    }
  }, [connectedWallets, onConnect, onError]);

  // Check wallet connections status
  useEffect(() => {
    mountedRef.current = true;
    let intervalId: NodeJS.Timeout | null = null;
    let isChecking = false; // Add flag to prevent concurrent checks

    const checkConnections = async () => {
      if (!mountedRef.current || connectedWallets.length === 0 || isChecking) return;

      try {
        isChecking = true;
        const validWallets: ConnectedWallet[] = [];
        const disconnectedWallets: string[] = [];
        
        for (const wallet of connectedWallets) {
          try {
            // Skip if wallet was already marked as disconnected
            if (disconnectedWallets.includes(wallet.account)) continue;

            const accounts = await wallet.instance.getAccounts();
            if (!mountedRef.current) return;

            if (!accounts || accounts.length === 0) {
              console.log('No accounts found for wallet, marking for disconnect:', wallet.account);
              disconnectedWallets.push(wallet.account);
              continue;
            }

            // Check if our current account is still in the list
            const currentAccountStillValid = accounts.some((acc: WalletAccount) => acc.address === wallet.account);
            if (!currentAccountStillValid) {
              console.log('Current account no longer available, marking for disconnect:', wallet.account);
              disconnectedWallets.push(wallet.account);
              continue;
            }

            validWallets.push(wallet);
          } catch (error) {
            console.error('Error checking wallet connection:', error);
            // Only mark for disconnect if it's a permanent error
            if (error instanceof Error && 
                (error.message.includes('WalletNotFoundError') || 
                 error.message.includes('Extension unavailable'))) {
              disconnectedWallets.push(wallet.account);
            } else {
              // For temporary errors, keep the wallet
              validWallets.push(wallet);
            }
          }
        }

        // Only update state if we have changes
        if (mountedRef.current && 
            (validWallets.length !== connectedWallets.length || 
             disconnectedWallets.length > 0)) {
          
          // Disconnect invalid wallets
          for (const account of disconnectedWallets) {
            const walletToDisconnect = connectedWallets.find(w => w.account === account);
            if (walletToDisconnect) {
              try {
                await walletToDisconnect.instance.disconnect();
              } catch (error) {
                console.error('Error disconnecting wallet:', error);
              }
            }
          }

          setConnectedWallets(validWallets);
          if (validWallets.length > 0) {
            onConnect?.(validWallets.map(w => w.account));
          } else {
            onConnect?.([]);
          }
        }
      } catch (error) {
        console.error('Error in connection check:', error);
      } finally {
        isChecking = false;
      }
    };

    // Initial check with a longer delay to allow extensions to initialize
    const initialCheck = setTimeout(() => {
      if (mountedRef.current) {
        checkConnections();
      }
    }, 2000); // Increased initial delay

    // Set up interval for subsequent checks with a longer interval
    intervalId = setInterval(checkConnections, 60000); // Increased check interval

    return () => {
      mountedRef.current = false;
      clearTimeout(initialCheck);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [connectedWallets, onConnect]);

  const handleConnect = async () => {
    if (!mountedRef.current) return;
    try {
      setIsConnecting(true);
      setError(null);
      // Connect to wallet
      const wallet = await connectWallet();
      if (!mountedRef.current) return;
      const accounts = await wallet.getAccounts();
      if (!mountedRef.current) return;
      if (!accounts.length) {
        throw new Error('No accounts found in wallet');
      }
      const provider = (await wallet.getProvider()) || 'unknown';
      // If only one account, connect directly
      if (accounts.length === 1) {
        const selectedAccount = accounts[0].address;
        if (connectedWallets.some(w => w.account === selectedAccount)) {
          throw new Error('This account is already connected');
        }
        const newWallet: ConnectedWallet = {
          instance: wallet,
          account: selectedAccount,
          provider
        };
        setConnectedWallets(prev => {
          const updated = [...prev, newWallet];
          onConnect?.(updated.map(w => w.account));
          return updated;
        });
        setIsConnecting(false);
      } else {
        // Show modal for account selection
        setAccountModal({ wallet, provider, accounts });
        setIsConnecting(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      setIsConnecting(false);
    }
  };

  const handleSelectAccount = (account: WalletAccount) => {
    if (!accountModal) return;
    if (connectedWallets.some(w => w.account === account.address)) {
      setError('This account is already connected');
      setAccountModal(null);
      return;
    }
    const newWallet: ConnectedWallet = {
      instance: accountModal.wallet,
      account: account.address,
      provider: accountModal.provider
    };
    setConnectedWallets(prev => {
      const updated = [...prev, newWallet];
      onConnect?.(updated.map(w => w.account));
      return updated;
    });
    setAccountModal(null);
  };

  const handleDisconnect = async (walletToDisconnect?: ConnectedWallet) => {
    if (!mountedRef.current) return;
    console.log('Manual disconnect initiated');
    await resetWallet(walletToDisconnect);
    console.log('Wallet state reset complete');
  };

  return (
    <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-900/80 shadow-xl max-w-lg mx-auto border border-gray-200 dark:border-gray-800 backdrop-blur-md" role="region" aria-label="Wallet Connection">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">Connect Your Wallets</h2>
      {connectedWallets.length === 0 ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full px-6 py-3 text-base font-semibold bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-busy={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="space-y-6">
          {connectedWallets.map((wallet) => (
            <div key={wallet.account} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-full">
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Account:</span>
                  <span className="break-all font-mono text-base text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 mt-1">{wallet.account}</span>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(wallet)}
                className="mt-2 sm:mt-0 px-5 py-2 text-base font-semibold bg-red-500 text-white rounded-lg shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200"
                aria-label="Disconnect wallet"
              >
                Disconnect
              </button>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 px-6 py-3 text-base font-semibold bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-busy={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Another Wallet'}
            </button>
            <button
              onClick={() => handleDisconnect()}
              className="flex-1 px-6 py-3 text-base font-semibold bg-red-500 text-white rounded-xl shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200"
              aria-label="Disconnect all wallets"
            >
              Disconnect All
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-700 shadow" role="alert">
          {error}
        </div>
      )}
      {/* Account selection modal */}
      {accountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Select an Account</h3>
            <ul className="space-y-3 mb-6">
              {accountModal.accounts.map(acc => (
                <li key={acc.address} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <span className="font-mono text-sm text-gray-900 dark:text-white break-all">{acc.address}</span>
                  <button
                    onClick={() => handleSelectAccount(acc)}
                    className="ml-4 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Select
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setAccountModal(null)}
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 