# KeyPass Identity Platform Tutorial

This comprehensive tutorial will guide you through integrating the KeyPass Identity Platform with **wallet authentication**, **DID creation**, **credential management**, and **privacy-preserving features** into your applications. We'll cover both React and vanilla JavaScript implementations with step-by-step examples.

## What is KeyPass?

KeyPass is a **self-sovereign login and identity system** that replaces "Sign in with Google" using decentralized identifiers (DIDs) and crypto wallets. Users can log into apps using their wallet, own their digital identity, and prove traits like age or student status via zk-proofs—all while maintaining privacy and data control.

### **Key Identity Platform Features**
- **Multi-chain wallet authentication**: Polkadot.js Extension, Talisman, MetaMask, Trust Wallet
- **DID creation and management**: Create and manage decentralized identifiers
- **Credential/SBT management**: Display and manage Soulbound Tokens and credentials
- **zkProof generation**: Privacy-preserving credential verification
- **Professional UI**: Dark theme with glassmorphism design and smooth animations
- **Mobile-responsive**: Works perfectly on all devices

## Prerequisites

Before you begin, make sure you have:

1. **Node.js** (v16 or later) - [Download here](https://nodejs.org/)
2. **A code editor** (VS Code recommended)
3. **Basic knowledge of JavaScript/TypeScript** (we'll explain as we go!)
4. **Wallet extensions installed** for testing:
   - **Polkadot**: [Polkadot.js Extension](https://polkadot.js.org/extension/) or [Talisman](https://talisman.xyz/)
   - **Ethereum**: [MetaMask](https://metamask.io/) or [Trust Wallet](https://trustwallet.com/)

## Server Setup (Required)

The identity platform functionality requires the KeyPass server to be running:

```bash
# From the root KeyPass directory
cd /path/to/KeyPass
npm start
```

You should see:
```
Server running on port 3000
Verification endpoint available at http://0.0.0.0:3000/api/verify
```

**Troubleshooting**: If port 3000 is busy, kill the existing process:
```bash
lsof -ti:3000 | xargs kill -9
```

## Quick Start with Interactive Examples

The fastest way to get started is using our enhanced boilerplate projects with full identity features:

### Option 1: React Boilerplate (Recommended for Production)

```bash
# Navigate to the React boilerplate
cd examples/react-boilerplate

# Install dependencies
npm install

# Start the development server
npm start
```

This includes:
- ✅ **DID Explorer dashboard** with multi-step creation wizard
- ✅ **Credential/SBT display** with grid and card layouts
- ✅ **zkProof credential demo** with circuit selection
- ✅ **Complete wallet selection flow**
- ✅ **Professional UI with animations**
- ✅ **Error handling and user feedback**
- ✅ **Mobile-responsive design**

### Option 2: Vanilla JavaScript Boilerplate (Great for Learning)

```bash
# Navigate to the vanilla boilerplate directory
cd examples/vanilla-boilerplate

# Start a local HTTP server
python3 -m http.server 8006

# Open http://localhost:8006 in your browser
```

## Understanding the Identity Platform

Let's break down what the KeyPass Identity Platform does and how you can customize it.

### Project Structure

```
your-project/
├── src/
│   ├── components/
│   │   ├── DIDWizard.tsx           # DID creation wizard
│   │   ├── CredentialSection.tsx   # Credential/SBT display
│   │   ├── ZKProofGenerator.tsx    # zkProof generation
│   │   └── WalletConnect.tsx       # Main wallet connection component
│   ├── services/
│   │   ├── credentialService.ts    # Credential management
│   │   ├── sbtService.ts          # SBT service
│   │   └── zkProofService.ts      # zkProof generation
│   ├── App.tsx                     # Your main app component
│   ├── main.tsx                   # App entry point
│   └── index.css                  # Styles
├── .env                           # Environment variables
├── package.json                   # Dependencies and scripts
├── vite.config.ts                # Build configuration
└── tsconfig.json                 # TypeScript configuration
```

### The Main App Component

Here's what `App.tsx` looks like with full identity features:

```tsx
import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { DIDWizard } from './components/DIDWizard';
import { CredentialSection } from './components/CredentialSection';
import { ZKProofGenerator } from './components/ZKProofGenerator';

function App() {
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [currentDID, setCurrentDID] = useState<string>('');
  const [credentials, setCredentials] = useState<any[]>([]);

  const handleConnect = (accounts: string[]) => {
    console.log('Connected accounts:', accounts);
    setConnectedAccounts(accounts);
  };

  const handleDIDCreated = (did: string) => {
    console.log('DID created:', did);
    setCurrentDID(did);
  };

  const handleCredentialsLoaded = (creds: any[]) => {
    console.log('Credentials loaded:', creds);
    setCredentials(creds);
  };

  const handleError = (error: Error) => {
    console.error('Error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          KeyPass Identity Platform Demo
        </h1>
        
        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnect
            onConnect={handleConnect}
            onError={handleError}
          />
        </div>

        {/* DID Creation */}
        {connectedAccounts.length > 0 && !currentDID && (
          <div className="mb-8">
            <DIDWizard
              walletAddress={connectedAccounts[0]}
              onComplete={handleDIDCreated}
              onError={handleError}
            />
          </div>
        )}

        {/* Credential Management */}
        {currentDID && (
          <div className="mb-8">
            <CredentialSection
              did={currentDID}
              onCredentialsLoaded={handleCredentialsLoaded}
              onError={handleError}
            />
          </div>
        )}

        {/* zkProof Generation */}
        {credentials.length > 0 && (
          <div className="mb-8">
            <ZKProofGenerator
              credentials={credentials}
              onError={handleError}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

> **Beginner Note**: This component manages the full identity flow: wallet connection → DID creation → credential management → zkProof generation. Each step depends on the previous one being completed.

## Building Your Own Identity Components

Now let's create identity components from scratch:

### Step 1: Basic DID Creation

Create a new file `src/components/SimpleDIDCreator.tsx`:

```tsx
import React, { useState } from 'react';
import { DIDProvider } from '@keypass/login-sdk';

interface SimpleDIDCreatorProps {
  walletAddress: string;
  onComplete: (did: string) => void;
  onError: (error: Error) => void;
}

export function SimpleDIDCreator({ walletAddress, onComplete, onError }: SimpleDIDCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [didType, setDidType] = useState<'basic' | 'advanced'>('basic');

  const handleCreateDID = async () => {
    try {
      setIsCreating(true);
      
      const didProvider = new DIDProvider();
      const did = await didProvider.createDid(walletAddress);
      
      onComplete(did);
      
    } catch (err) {
      onError(err instanceof Error ? err : new Error('DID creation failed'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Create Your Digital Identity</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">DID Type:</label>
        <select
          value={didType}
          onChange={(e) => setDidType(e.target.value as 'basic' | 'advanced')}
          className="w-full p-2 border rounded"
        >
          <option value="basic">Basic DID</option>
          <option value="advanced">Advanced DID</option>
        </select>
      </div>

      <button
        onClick={handleCreateDID}
        disabled={isCreating}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isCreating ? 'Creating DID...' : 'Create DID'}
      </button>
    </div>
  );
}
```

### Step 2: Credential Display Component

Create `src/components/SimpleCredentialDisplay.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { SBTService } from '@keypass/login-sdk';

interface SimpleCredentialDisplayProps {
  address: string;
  onCredentialsLoaded: (credentials: any[]) => void;
  onError: (error: Error) => void;
}

export function SimpleCredentialDisplay({ address, onCredentialsLoaded, onError }: SimpleCredentialDisplayProps) {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        setIsLoading(true);
        
        const sbtService = new SBTService({
          providers: {
            // Configure your blockchain providers
          },
          cache: {
            enabled: true,
            ttl: 300000,
            maxSize: 100
          },
          defaultTimeout: 10000
        });

        const tokens = await sbtService.getTokens(address);
        setCredentials(tokens);
        onCredentialsLoaded(tokens);
        
      } catch (err) {
        onError(err instanceof Error ? err : new Error('Failed to load credentials'));
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      loadCredentials();
    }
  }, [address, onCredentialsLoaded, onError]);

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">Loading credentials...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Your Credentials</h2>
      
      {credentials.length === 0 ? (
        <p className="text-gray-500">No credentials found for this address.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((credential, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{credential.name || 'Credential'}</h3>
              <p className="text-sm text-gray-600">{credential.description}</p>
              <p className="text-xs text-gray-500 mt-2">Chain: {credential.chainType}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 3: zkProof Generator Component

Create `src/components/SimpleZKProofGenerator.tsx`:

```tsx
import React, { useState } from 'react';
import { ZKProofService } from '@keypass/login-sdk';

interface SimpleZKProofGeneratorProps {
  credentials: any[];
  onError: (error: Error) => void;
}

export function SimpleZKProofGenerator({ credentials, onError }: SimpleZKProofGeneratorProps) {
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [selectedCircuit, setSelectedCircuit] = useState<'semaphore' | 'plonk' | 'groth16'>('semaphore');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proof, setProof] = useState<string>('');

  const handleGenerateProof = async () => {
    if (!selectedCredential) return;

    try {
      setIsGenerating(true);
      
      const zkService = new ZKProofService();
      const generatedProof = await zkService.generateProof(selectedCredential, selectedCircuit);
      
      setProof(generatedProof);
      
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Proof generation failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Generate Privacy-Preserving Proof</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Credential:</label>
        <select
          value={selectedCredential?.id || ''}
          onChange={(e) => {
            const credential = credentials.find(c => c.id === e.target.value);
            setSelectedCredential(credential);
          }}
          className="w-full p-2 border rounded"
        >
          <option value="">Choose a credential...</option>
          {credentials.map((credential) => (
            <option key={credential.id} value={credential.id}>
              {credential.name || credential.id}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Circuit:</label>
        <select
          value={selectedCircuit}
          onChange={(e) => setSelectedCircuit(e.target.value as any)}
          className="w-full p-2 border rounded"
        >
          <option value="semaphore">Semaphore</option>
          <option value="plonk">PLONK</option>
          <option value="groth16">Groth16</option>
        </select>
      </div>

      <button
        onClick={handleGenerateProof}
        disabled={!selectedCredential || isGenerating}
        className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {isGenerating ? 'Generating Proof...' : 'Generate Proof'}
      </button>

      {proof && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Generated Proof:</h3>
          <p className="text-sm font-mono break-all">{proof}</p>
        </div>
      )}
    </div>
  );
}
```

## How the Identity Platform Works

Here's what happens in a complete identity flow:

1. **Wallet Connection**: User connects their wallet (Polkadot or Ethereum)
2. **DID Creation**: System creates a decentralized identifier for the user
3. **Credential Discovery**: Platform discovers user's SBTs and credentials
4. **Proof Generation**: User can generate privacy-preserving proofs for credential verification
5. **Verification**: Other parties can verify proofs without seeing the original credentials

## Advanced Identity Features

Now let's explore some advanced features you can implement.

### Adding DID Document Preview

Let's enhance our DID creator to show the DID document:

```tsx
import React, { useState } from 'react';
import { DIDProvider } from '@keypass/login-sdk';

interface DIDDocument {
  did: string;
  document: any;
  metadata: any;
}

export function AdvancedDIDCreator({ walletAddress, onComplete, onError }: SimpleDIDCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [didDocument, setDidDocument] = useState<DIDDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCreateDID = async () => {
    try {
      setIsCreating(true);
      
      const didProvider = new DIDProvider();
      const did = await didProvider.createDid(walletAddress);
      
      // Get DID document
      const document = await didProvider.resolveDID(did);
      
      const didDoc: DIDDocument = {
        did,
        document,
        metadata: {
          created: new Date().toISOString(),
          walletAddress
        }
      };
      
      setDidDocument(didDoc);
      setShowPreview(true);
      
    } catch (err) {
      onError(err instanceof Error ? err : new Error('DID creation failed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirm = () => {
    if (didDocument) {
      onComplete(didDocument.did);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Create Your Digital Identity</h2>
      
      {!showPreview ? (
        <button
          onClick={handleCreateDID}
          disabled={isCreating}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isCreating ? 'Creating DID...' : 'Create DID'}
        </button>
      ) : (
        <div>
          <h3 className="font-semibold mb-2">DID Document Preview:</h3>
          <div className="p-4 bg-gray-50 rounded mb-4">
            <p className="text-sm font-mono break-all">{didDocument?.did}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Confirm DID
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Credential Request Wizard

Create a component for requesting new credentials:

```tsx
interface CredentialRequest {
  type: string;
  issuer: string;
  description: string;
  requirements: string[];
}

export function CredentialRequestWizard({ onRequest }: { onRequest: (request: CredentialRequest) => void }) {
  const [request, setRequest] = useState<CredentialRequest>({
    type: '',
    issuer: '',
    description: '',
    requirements: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequest(request);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Request New Credential</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Credential Type:</label>
          <input
            type="text"
            value={request.type}
            onChange={(e) => setRequest({...request, type: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="e.g., Student ID, Age Verification"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Issuer:</label>
          <input
            type="text"
            value={request.issuer}
            onChange={(e) => setRequest({...request, issuer: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="e.g., University, Government"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description:</label>
          <textarea
            value={request.description}
            onChange={(e) => setRequest({...request, description: e.target.value})}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Describe what this credential represents..."
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Request Credential
        </button>
      </form>
    </div>
  );
}
```

### Privacy Controls for Credentials

Add privacy controls to credential display:

```tsx
interface CredentialPrivacyControlsProps {
  credential: any;
  onShare: (credential: any, proof: string) => void;
  onRevoke: (credential: any) => void;
}

export function CredentialPrivacyControls({ credential, onShare, onRevoke }: CredentialPrivacyControlsProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareProof, setShareProof] = useState(false);

  const handleShare = async () => {
    if (shareProof) {
      // Generate zkProof for sharing
      const zkService = new ZKProofService();
      const proof = await zkService.generateProof(credential, 'semaphore');
      onShare(credential, proof);
    } else {
      // Share credential directly
      onShare(credential, '');
    }
    setShowShareDialog(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">{credential.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{credential.description}</p>
      
      <div className="flex space-x-2">
        <button
          onClick={() => setShowShareDialog(true)}
          className="py-1 px-3 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Share
        </button>
        <button
          onClick={() => onRevoke(credential)}
          className="py-1 px-3 bg-red-500 text-white text-sm rounded hover:bg-red-600"
        >
          Revoke
        </button>
      </div>

      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-semibold mb-4">Share Credential</h3>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareProof}
                  onChange={(e) => setShareProof(e.target.checked)}
                  className="mr-2"
                />
                Share with privacy-preserving proof
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleShare}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Share
              </button>
              <button
                onClick={() => setShowShareDialog(false)}
                className="flex-1 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

### 1. **Start with Wallet Connection, Build Up**
- Begin with basic wallet authentication
- Add DID creation once wallet connection works
- Add credential management after DID creation
- Add zkProof generation last

### 2. **User Experience First**
```tsx
// ✅ Good: Clear progress indication
<div className="flex items-center space-x-2">
  <div className={`w-4 h-4 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
  <div className={`w-4 h-4 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
  <div className={`w-4 h-4 rounded-full ${step >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
</div>

// ❌ Bad: No progress indication
<div>Creating DID...</div>
```

### 3. **Handle Identity Errors Gracefully**
```tsx
// ✅ Good: Specific error handling
if (error.message.includes('DID creation failed')) {
  setError('Unable to create your digital identity. Please try again.');
} else if (error.message.includes('No credentials found')) {
  setError('No credentials found for this address.');
}

// ❌ Bad: Generic error messages
setError(error.message);
```

### 4. **Test with Real Identity Flows**
- Test DID creation with different wallet types
- Test credential loading with various SBTs
- Test zkProof generation with different circuits
- Test privacy controls and sharing features

### 5. **Follow the Boilerplate Pattern**
The React boilerplate shows the recommended patterns:
- Component structure for identity flows
- Error handling for identity operations
- State management for DID and credentials
- User interface design for identity features

## Next Steps

### 1. **Explore the Full Identity Platform**
Take a deep dive into the complete React boilerplate:
```bash
cd examples/react-boilerplate
npm install
npm run dev
```

The boilerplate includes:
- Complete DID creation wizard
- Credential/SBT display and management
- zkProof generation with multiple circuits
- Privacy controls and sharing features
- Production-ready styling and animations

### 2. **Add Advanced Identity Features**
Once you have basic identity flows working:
- Implement credential verification
- Add multi-chain DID support
- Build credential revocation flows
- Create privacy-preserving sharing mechanisms

### 3. **Customize for Your Use Case**
Make it match your application:
- Update credential types for your domain
- Customize DID creation flows
- Add your branding and styling
- Integrate with your existing systems

### 4. **Learn More**
Check out the other documentation:
- [API Reference](./api.md) - Complete API documentation
- [Integration Guide](./integration.md) - Advanced integration patterns
- [Architecture Documentation](./architecture.md) - How the platform works internally
- [DID Wizard Guide](../examples/react-boilerplate/DID_WIZARD_README.md) - DID creation implementation
- [Credential Implementation Guide](../examples/react-boilerplate/CREDENTIAL_IMPLEMENTATION_GUIDE.md) - Credential management
- [zkProof Implementation Guide](../examples/react-boilerplate/ZK_PROOF_IMPLEMENTATION.md) - Privacy features

### 5. **Common Next Features**
Real identity applications often need:
- Credential verification and validation
- Multi-chain DID resolution
- Credential revocation and updates
- Privacy-preserving sharing mechanisms
- Integration with existing identity systems

## Troubleshooting

### Common Issues and Solutions

**"DID creation failed"**
- Make sure wallet is connected and unlocked
- Check if the wallet address is valid
- Verify server is running on port 3000

**"No credentials found"**
- Make sure the address has SBTs or credentials
- Check blockchain provider configuration
- Verify network connection

**"Proof generation failed"**
- Make sure credential is valid and accessible
- Check circuit configuration
- Verify zkProof service is properly configured

**"Privacy controls not working"**
- Check browser permissions for sharing
- Verify zkProof generation is working
- Test with different credential types

## Getting Help

### 1. **Check the Examples**
- Look at the working React boilerplate in `examples/react-boilerplate`
- Compare your code with the working examples
- Try running the boilerplate first

### 2. **Documentation**
- [API Reference](./api.md) - Complete API documentation
- [Integration Guide](./integration.md) - Advanced integration patterns
- [Architecture Documentation](./architecture.md) - How the platform works
- [DID Wizard Guide](../examples/react-boilerplate/DID_WIZARD_README.md) - DID creation
- [Credential Implementation Guide](../examples/react-boilerplate/CREDENTIAL_IMPLEMENTATION_GUIDE.md) - Credential management
- [zkProof Implementation Guide](../examples/react-boilerplate/ZK_PROOF_IMPLEMENTATION.md) - Privacy features

### 3. **Community Support**
- Visit our [GitHub repository](https://github.com/uliana1one/keypass)
- Open an issue for bugs or feature requests
- Check existing issues for solutions

## What You've Learned

Congratulations! You now know how to:

✅ Set up a React project with KeyPass Identity Platform  
✅ Connect to blockchain wallets  
✅ Create and manage decentralized identifiers (DIDs)  
✅ Display and manage credentials/SBTs  
✅ Generate privacy-preserving zkProofs  
✅ Implement privacy controls and sharing  
✅ Handle identity errors gracefully  
✅ Build production-ready identity applications  

You're ready to build amazing self-sovereign identity applications with KeyPass! 🚀

## License

Apache License 2.0 - see [LICENSE](../LICENSE) for details. 