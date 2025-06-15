import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Polyfills to include
      include: ['util', 'buffer', 'process', 'stream', 'crypto', 'events'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@keypass/login-sdk'],
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      include: [/@keypass\/login-sdk/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
}) 