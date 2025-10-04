/**
 * IPFS Mocks for E2E Tests
 * 
 * This file provides mock implementations for IPFS-related dependencies
 * to avoid the need for actual IPFS infrastructure during testing.
 */

// Mock helia
export const createHelia = jest.fn().mockResolvedValue({
  add: jest.fn().mockResolvedValue({
    cid: {
      toString: jest.fn().mockReturnValue('QmMockedIPFSCID123456789')
    }
  }),
  stop: jest.fn().mockResolvedValue(undefined),
});

// Mock UnixFS
export const UnixFS = jest.fn().mockImplementation(() => ({
  addBytes: jest.fn().mockResolvedValue({
    cid: {
      toString: jest.fn().mockReturnValue('QmMockedUnixFSCID123456789')
    }
  })
}));

// Default export for helia
export default {
  createHelia
};

// Mock IPFS-related functions
export const mockIPFSFunctions = {
  createHelia,
  UnixFS,
  mockMetadataUpload: jest.fn().mockResolvedValue({
    cid: 'QmMockedMetadataCID123456789',
    uri: 'ipfs://QmMockedMetadataCID123456789'
  }),
  mockFileUpload: jest.fn().mockResolvedValue({
    cid: 'QmMockedFileCID123456789',
    uri: 'ipfs://QmMockedFileCID123456789'
  })
};

// Global mocks setup - using manual mocking to avoid module resolution issues
// Note: These mocks will be applied at runtime by Jest

export default mockIPFSFunctions;
