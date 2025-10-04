// Mock IPFS instance
const mockIPFS = {
  addBytes: jest.fn(),
  get: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

// Mock createHelia function
export const createHelia = jest.fn(() => Promise.resolve(mockIPFS));

// Export the mock IPFS instance for use in tests
export { mockIPFS };
