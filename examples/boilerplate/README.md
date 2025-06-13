# KeyPass Boilerplate

This is a boilerplate project demonstrating how to integrate the KeyPass Login SDK into a React application. It provides a minimal working example with wallet connection functionality.

## Features

- React + TypeScript + Vite setup
- Wallet connection with KeyPass SDK
- Modern UI with Tailwind CSS
- Type-safe components
- Error handling
- Session management

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- A modern web browser
- A WalletConnect project ID (for WalletConnect support)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/keypass-boilerplate.git
cd keypass-boilerplate
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your WalletConnect project ID:
```bash
WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Development

Start the development server:
```bash
npm start
```

The application will be available at http://localhost:3000

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run serve
```

## Project Structure

```
keypass-boilerplate/
├── src/
│   ├── components/
│   │   └── WalletConnect.tsx    # Wallet connection component
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
├── public/                     # Static assets
├── .env.example               # Environment variables template
├── package.json              # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md              # Project documentation
```

## Usage

The boilerplate provides a basic wallet connection component that you can use in your application:

```tsx
import { WalletConnect } from './components/WalletConnect';

function App() {
  const handleConnect = (address: string) => {
    console.log('Connected to wallet:', address);
  };

  const handleError = (error: Error) => {
    console.error('Wallet connection error:', error);
  };

  return (
    <WalletConnect
      onConnect={handleConnect}
      onError={handleError}
    />
  );
}
```

## Customization

1. **Styling**: The project uses Tailwind CSS. You can customize the styles in `tailwind.config.js`.

2. **Environment Variables**: Add your own environment variables in `.env` and update the types in `src/env.d.ts`.

3. **Components**: Add your own components in the `src/components` directory.

4. **Routing**: Add React Router for navigation between pages.

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For help and support:

1. Check the [KeyPass documentation](https://github.com/uliana1one/keypass)
2. Open an issue in this repository
3. Join our community chat 

## Required Polyfills and Browser Compatibility

Some dependencies (such as WalletConnect) require Node.js core modules that are not available in the browser by default. To ensure compatibility, you must install the following polyfills and update your Vite configuration:

### 1. Install Required Packages

```bash
npm install --save-dev @esbuild-plugins/node-globals-polyfill
npm install util
```

### 2. Update Vite Config

Add the following to your `vite.config.ts`:

```ts
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
...
resolve: {
  alias: {
    ...,
    util: 'util', // Polyfill for Node.js util
  },
},
optimizeDeps: {
  ...,
  esbuildOptions: {
    ...,
    plugins: [
      NodeGlobalsPolyfillPlugin({
        buffer: true,
        process: true,
        global: true,
      }),
    ],
    define: {
      global: 'globalThis',
    },
  },
},
```

After making these changes, restart your dev server:

```bash
npm run dev
# or
npx vite
``` 