// Mock UnixFS instance
const mockUnixFS = {
  addBytes: jest.fn(),
  addFile: jest.fn(),
};

// Mock UnixFS constructor
export const UnixFS = jest.fn(() => mockUnixFS);

// Export the mock UnixFS instance for use in tests
export { mockUnixFS };
