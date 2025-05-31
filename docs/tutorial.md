# KeyPass Integration Tutorial

This tutorial guides you through integrating KeyPass Login SDK into a Next.js Polkadot application.

## Prerequisites

- Node.js 16+ and npm/yarn
- Basic knowledge of Next.js and React
- Polkadot.js or Talisman wallet installed in your browser
- A Polkadot account with some tokens for testing

## Project Setup

### 1. Create a New Next.js Project

```bash
npx create-next-app@latest my-polkadot-app --typescript
cd my-polkadot-app
```

### 2. Install Dependencies

```bash
# Install KeyPass SDK and required dependencies
npm install @keypass/login-sdk @polkadot/api @polkadot/util-crypto

# Install additional dependencies for the tutorial
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_APP_NAME=My Polkadot App
NEXT_PUBLIC_VERIFICATION_API_URL=http://localhost:3001/api
```

## Implementation

### 1. Create Authentication Context

Create `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginWithPolkadot, LoginResult } from '@keypass/login-sdk';

interface AuthContextType {
  isAuthenticated: boolean;
  user: LoginResult | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('keypass_session');
    if (session) {
      try {
        const parsedSession = JSON.parse(session);
        if (parsedSession.expiresAt > Date.now()) {
          setUser(parsedSession.user);
        } else {
          localStorage.removeItem('keypass_session');
        }
      } catch (e) {
        localStorage.removeItem('keypass_session');
      }
    }
  }, []);

  const login = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginWithPolkadot();
      setUser(result);
      
      // Store session
      const session = {
        user: result,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };
      localStorage.setItem('keypass_session', JSON.stringify(session));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('keypass_session');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        isLoading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 2. Create Login Components

Create `src/components/WalletButton.tsx`:

```typescript
import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export function WalletButton() {
  const { login, logout, isAuthenticated, isLoading, error, user } = useAuth();
  const toast = useToast();

  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Login Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  return (
    <Button
      onClick={isAuthenticated ? logout : login}
      isLoading={isLoading}
      loadingText="Connecting..."
      colorScheme={isAuthenticated ? 'red' : 'blue'}
      size="lg"
    >
      {isAuthenticated 
        ? `Disconnect ${user?.address.slice(0, 6)}...${user?.address.slice(-4)}`
        : 'Connect Wallet'
      }
    </Button>
  );
}
```

### 3. Create Verification API Route

Create `src/pages/api/verify.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { VerificationService } from '@keypass/login-sdk';

const verificationService = new VerificationService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'INVALID_REQUEST'
      });
    }

    const result = await verificationService.verifySignature({
      message,
      signature,
      address
    });

    if (result.status === 'success') {
      // Create session token or JWT here
      const token = 'your-jwt-token'; // Implement your token generation
      res.status(200).json({ token, did: result.did });
    } else {
      res.status(401).json({ error: result.message, code: result.code });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}
```

### 4. Update App Layout

Update `src/pages/_app.tsx`:

```typescript
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ChakraProvider>
  );
}

export default MyApp;
```

### 5. Create Home Page

Update `src/pages/index.tsx`:

```typescript
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { WalletButton } from '../components/WalletButton';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8}>
        <Heading>My Polkadot App</Heading>
        
        <WalletButton />

        {isAuthenticated && user && (
          <Box p={6} borderWidth={1} borderRadius="lg" width="100%">
            <VStack align="start" spacing={4}>
              <Text>
                <strong>Address:</strong> {user.address}
              </Text>
              <Text>
                <strong>DID:</strong> {user.did}
              </Text>
              <Text>
                <strong>Issued At:</strong> {new Date(user.issuedAt).toLocaleString()}
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
```

## Advanced Features

### 1. Custom Wallet Selection

Create `src/components/WalletSelector.tsx`:

```typescript
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  useDisclosure
} from '@chakra-ui/react';
import { PolkadotJsAdapter, TalismanAdapter } from '@keypass/login-sdk';
import { useAuth } from '../contexts/AuthContext';

export function WalletSelector() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { login } = useAuth();

  const handleWalletSelect = async (walletType: 'polkadot' | 'talisman') => {
    const adapter = walletType === 'polkadot'
      ? new PolkadotJsAdapter()
      : new TalismanAdapter();

    try {
      await adapter.enable();
      await login();
      onClose();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  return (
    <>
      <Button onClick={onOpen} colorScheme="blue" size="lg">
        Select Wallet
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Button
                width="100%"
                onClick={() => handleWalletSelect('polkadot')}
              >
                Polkadot.js
              </Button>
              <Button
                width="100%"
                onClick={() => handleWalletSelect('talisman')}
              >
                Talisman
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
```

### 2. Protected Routes

Create `src/components/ProtectedRoute.tsx`:

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}
```

### 3. Example Protected Page

Create `src/pages/dashboard.tsx`:

```typescript
import { Box, Container, Heading } from '@chakra-ui/react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Container maxW="container.xl" py={10}>
        <Heading mb={6}>Dashboard</Heading>
        <Box p={6} borderWidth={1} borderRadius="lg">
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </Box>
      </Container>
    </ProtectedRoute>
  );
}
```

## Testing the Integration

1. Start the development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000` in your browser

3. Test the following scenarios:
   - Connect with Polkadot.js wallet
   - Connect with Talisman wallet
   - Disconnect and reconnect
   - Access protected routes
   - Handle wallet rejection
   - Handle network errors

## Troubleshooting

### Common Issues

1. **Wallet Not Found**
   - Ensure the wallet extension is installed
   - Check if the wallet is enabled for the site
   - Try refreshing the page

2. **Connection Timeout**
   - Check network connectivity
   - Ensure the wallet is unlocked
   - Try increasing the timeout in the SDK config

3. **Verification Failed**
   - Check the message format
   - Verify the signature format
   - Ensure the address matches the signer

### Debug Mode

Enable debug mode to see detailed logs:

```typescript
import { setDebug } from '@keypass/login-sdk';

// In your _app.tsx or development environment
if (process.env.NODE_ENV === 'development') {
  setDebug(true);
}
```

## Next Steps

1. Implement proper session management with JWT
2. Add rate limiting to the verification endpoint
3. Implement proper error handling and user feedback
4. Add loading states and animations
5. Implement proper security headers
6. Add unit and integration tests

## Support

For additional help:
- Check the [API Reference](./api.md)
- Review the [Integration Guide](./integration.md)
- Open an issue on GitHub
- Join our Discord community 