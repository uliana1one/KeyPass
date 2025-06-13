import { WalletConnect } from './components/WalletConnect';

function App() {
  const handleConnect = (address: string) => {
    console.log('Connected to wallet:', address);
  };

  const handleError = (error: Error) => {
    console.error('Wallet connection error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            KeyPass Demo
          </h1>
          <p className="mt-2 text-gray-600">
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