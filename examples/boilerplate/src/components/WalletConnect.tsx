import React, { useState, useEffect, useCallback, useRef } from 'react';
import { connectWallet } from '@keypass/login-sdk/dist/walletConnector';
import type { WalletAdapter, WalletAccount } from '@keypass/login-sdk/dist/adapters/types';

interface WalletConnectProps {
  onConnect?: (account: string) => void;
  onError?: (error: Error) => void;
}

export function WalletConnect({ onConnect, onError }: WalletConnectProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletInstance, setWalletInstance] = useState<WalletAdapter | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const mountedRef = useRef(true);

  // Reset wallet connection
  const resetWallet = useCallback(async () => {
    if (!mountedRef.current) return;

    if (walletInstance) {
      try {
        console.log('Disconnecting wallet...');
        await walletInstance.disconnect();
        console.log('Wallet disconnected successfully');
        
        // Only clear error state on successful disconnect
        if (mountedRef.current) {
          setWalletInstance(null);
          setAccount(null);
          setError(null);
        }
      } catch (error) {
        console.error('Error during wallet disconnect:', error);
        // Set error state but don't clear other states until disconnect succeeds
        if (mountedRef.current) {
          setError(error instanceof Error ? error.message : 'Disconnect failed');
          onError?.(error instanceof Error ? error : new Error('Disconnect failed'));
        }
      }
    } else {
      // If no wallet instance, just clear the states
      if (mountedRef.current) {
        setWalletInstance(null);
        setAccount(null);
        setError(null);
      }
    }
  }, [walletInstance, onError]);

  // Check wallet connection status
  useEffect(() => {
    mountedRef.current = true;
    let intervalId: NodeJS.Timeout | null = null;

    const checkConnection = async () => {
      if (!mountedRef.current || !account || !walletInstance) return;

      try {
        const accounts = await walletInstance.getAccounts();
        if (!mountedRef.current) return;

        if (!accounts || accounts.length === 0) {
          console.log('No accounts found, wallet disconnected');
          await resetWallet();
          return;
        }

        // Check if our current account is still in the list
        const currentAccountStillValid = accounts.some((acc: WalletAccount) => acc.address === account);
        if (!currentAccountStillValid) {
          console.log('Current account no longer available, resetting state');
          await resetWallet();
          return;
        }

        console.log('Wallet connection check passed');
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        if (mountedRef.current) {
          await resetWallet();
        }
      }
    };

    // Initial check - wrapped in setTimeout to avoid race conditions
    const initialCheck = setTimeout(() => {
      if (mountedRef.current) {
        checkConnection();
      }
    }, 0);

    // Set up interval for subsequent checks
    intervalId = setInterval(checkConnection, 30000);

    // Cleanup function
    return () => {
      mountedRef.current = false;
      clearTimeout(initialCheck);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [account, walletInstance, resetWallet]);

  const handleConnect = async () => {
    if (!mountedRef.current) return;

    try {
      setIsConnecting(true);
      setError(null);
      console.log('Attempting to connect wallet...');

      // Reset any existing wallet connection first
      await resetWallet();

      if (!mountedRef.current) return;

      // Connect to wallet
      const wallet = await connectWallet();
      if (!mountedRef.current) return;

      setWalletInstance(wallet);
      
      // Get available accounts
      const accounts = await wallet.getAccounts();
      if (!mountedRef.current) return;

      if (!accounts.length) {
        throw new Error('No accounts found in wallet');
      }
      
      const selectedAccount = accounts[0].address;
      console.log('Wallet connected successfully:', selectedAccount);
      
      // Update state
      setAccount(selectedAccount);
      onConnect?.(selectedAccount);

    } catch (err) {
      if (!mountedRef.current) return;

      const error = err as Error;
      console.error('Wallet connection failed:', error.message);
      
      // Set error state first
      setError(error.message);
      onError?.(error);
      
      // Then reset wallet state without clearing error
      if (walletInstance) {
        try {
          await walletInstance.disconnect();
        } catch (disconnectError) {
          console.error('Error during wallet disconnect:', disconnectError);
        }
        if (mountedRef.current) {
          setWalletInstance(null);
          setAccount(null);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsConnecting(false);
      }
    }
  };

  const handleDisconnect = async () => {
    if (!mountedRef.current) return;
    console.log('Manual disconnect initiated');
    await resetWallet();
    console.log('Wallet state reset complete');
  };

  return (
    <div className="p-4 rounded-lg bg-white shadow-md" role="region" aria-label="Wallet Connection">
      <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
      
      {!account ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          aria-busy={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connected Account:
            <span className="ml-2 font-mono text-gray-800" aria-label="Account address">
              {account}
            </span>
          </p>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md" role="alert">
          {error}
        </div>
      )}
    </div>
  );
} 