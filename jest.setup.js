// Mock TextEncoder/TextDecoder which are not available in jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.injectedWeb3
Object.defineProperty(window, 'injectedWeb3', {
  writable: true,
  value: {},
});
