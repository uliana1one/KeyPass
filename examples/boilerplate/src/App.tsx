import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has a dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Update document class when dark mode changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleConnect = (address: string) => {
    console.log('Connected to wallet:', address);
  };

  const handleError = (error: Error) => {
    console.error('Wallet connection error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '🌞' : '🌙'}
          </button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            KeyPass Demo
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Connect your wallet to get started
          </p>
        </div>

        <WalletConnect
          onConnect={handleConnect}
          onError={handleError}
        />
      </div>
    </div>
  );
}

export default App; 