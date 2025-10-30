import { KILTDIDProvider } from '../KILTDIDProvider';
import { KiltAdapter } from '../../adapters/KiltAdapter';
import { AddressValidationError } from '../../errors/WalletErrors';

// Mock the KiltAdapter
jest.mock('../../adapters/KiltAdapter', () => ({
  KiltAdapter: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      name: 'KILT Spiritnet',
      network: 'spiritnet',
      version: '5',
      runtime: 'kilt',
      ss58Format: 38,
      genesisHash: '0x1234567890123456789012345678901234567890',
    }),
    getChainInfo: jest.fn().mockReturnValue({
      name: 'KILT Spiritnet',
      network: 'spiritnet',
      version: '5',
      runtime: 'kilt',
      ss58Format: 38,
      genesisHash: '0x1234567890123456789012345678901234567890',
    }),
  })),
}));

// Mock Polkadot crypto functions
jest.mock('@polkadot/util-crypto', () => ({
  decodeAddress: jest.fn().mockReturnValue(new Uint8Array(32).fill(1)),
  encodeAddress: jest.fn().mockReturnValue('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'),
  base58Encode: jest.fn().mockReturnValue('base58encodedkey'),
}));

// Mock address validation
jest.mock('../../adapters/types', () => ({
  validatePolkadotAddress: jest.fn().mockImplementation((address, ss58Format) => {
    if (!address || address.length < 47) {
      throw new Error('Invalid address');
    }
    if (ss58Format !== 38) {
      throw new Error('Wrong SS58 format');
    }
    // Allow the address to pass validation by default
    return true;
  }),
}));

describe('KILTDIDProvider', () => {
  let kiltDidProvider: KILTDIDProvider;
  let mockKiltAdapter: jest.Mocked<KiltAdapter>;

  const validKiltAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset address validation mock to default behavior
    const { validatePolkadotAddress } = require('../../adapters/types');
    validatePolkadotAddress.mockImplementation((address, ss58Format) => {
      if (!address || address.length < 47) {
        throw new Error('Invalid address');
      }
      if (ss58Format !== 38) {
        throw new Error('Wrong SS58 format');
      }
      return true;
    });
    
    // Mock KiltAdapter instance
    mockKiltAdapter = {
      connect: jest.fn().mockResolvedValue({
        name: 'KILT Spiritnet',
        network: 'spiritnet',
        version: '5',
        runtime: 'kilt',
        ss58Format: 38,
        genesisHash: '0x1234567890123456789012345678901234567890',
      }),
      getChainInfo: jest.fn().mockReturnValue({
        name: 'KILT Spiritnet',
        network: 'spiritnet',
        version: '5',
        runtime: 'kilt',
        ss58Format: 38,
        genesisHash: '0x1234567890123456789012345678901234567890',
      }),
      disconnect: jest.fn(),
    } as any;

    kiltDidProvider = new KILTDIDProvider(mockKiltAdapter);
  });

  describe('createDid', () => {
    it('should create a KILT DID in the correct format', async () => {
      const did = await kiltDidProvider.createDid(validKiltAddress);

      expect(did).toBe(`did:kilt:${validKiltAddress}`);
      expect(did).toMatch(/^did:kilt:5[A-Za-z0-9]{47}$/); // KILT address format (48 chars including 5)
    });

    it('should throw error for invalid address format', async () => {
      const { validatePolkadotAddress } = require('../../adapters/types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Invalid address');
      });

      await expect(kiltDidProvider.createDid('invalid-address')).rejects.toThrow(AddressValidationError);
    });

    it('should reject non-KILT SS58 format', async () => {
      const { validatePolkadotAddress } = require('../../adapters/types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Wrong SS58 format');
      });

      const nonKiltAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Non-KILT format
      
      await expect(kiltDidProvider.createDid(nonKiltAddress)).rejects.toThrow(AddressValidationError);
    });

    it('should handle empty or whitespace-only addresses', async () => {
      const { validatePolkadotAddress } = require('../../adapters/types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Invalid address');
      });

      await expect(kiltDidProvider.createDid('')).rejects.toThrow(AddressValidationError);
      await expect(kiltDidProvider.createDid('   ')).rejects.toThrow(AddressValidationError);
    });

    it('should trim whitespace from valid addresses', async () => {
      const addressWithSpaces = `  ${validKiltAddress}  `;
      const did = await kiltDidProvider.createDid(addressWithSpaces);

      expect(did).toBe(`did:kilt:${validKiltAddress}`); // Should match clean address
    });
  });

  describe('createDIDDocument', () => {
    it('should create a valid KILT DID document', async () => {
      const doc = await kiltDidProvider.createDIDDocument(validKiltAddress);

      expect(doc).toMatchObject({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/sr25519-2020/v1',
          'https://w3id.org/security/suites/kilt-2023/v1',
        ],
        id: `did:kilt:${validKiltAddress}`,
        controller: `did:kilt:${validKiltAddress}`,
      });

      expect(doc.verificationMethod).toHaveLength(1);
      expect(doc.authentication).toHaveLength(1);
      expect(doc.assertionMethod).toHaveLength(1);
      expect(doc.capabilityInvocation).toHaveLength(1);
      expect(doc.capabilityDelegation).toHaveLength(1);
    });

    it('should include KILT-specific services', async () => {
      const doc = await kiltDidProvider.createDIDDocument(validKiltAddress);

      expect(doc.service).toHaveLength(2);
      expect(doc.service![0]).toMatchObject({
        id: `did:kilt:${validKiltAddress}#kilt-parachain`,
        type: 'KiltParachainService',
        serviceEndpoint: 'wss://spiritnet.kilt.io',
      });
      expect(doc.service![1]).toMatchObject({
        id: `did:kilt:${validKiltAddress}#kilt-did-registry`,
        type: 'KiltDIDRegistry',
        serviceEndpoint: 'https://spiritnet.api.subscan.io/api',
      });
    });

    it('should create verification method with correct type', async () => {
      const doc = await kiltDidProvider.createDIDDocument(validKiltAddress);
      const verificationMethod = doc.verificationMethod[0];

      expect(verificationMethod).toMatchObject({
        type: 'Sr25519VerificationKey2020',
        controller: `did:kilt:${validKiltAddress}`,
      });
      expect(verificationMethod.publicKeyMultibase).toMatch(/^z[A-Za-z0-9]+$/); // Base58BTC format
    });

    it('should throw error for invalid address', async () => {
      const { validatePolkadotAddress } = require('../../adapters/types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Invalid address');
      });

      await expect(kiltDidProvider.createDIDDocument('invalid')).rejects.toThrow(AddressValidationError);
    });
  });

  describe('resolve', () => {
    it('should resolve a valid KILT DID', async () => {
      const kiltDid = `did:kilt:${validKiltAddress}`;
      const doc = await kiltDidProvider.resolve(kiltDid);

      expect(doc.id).toBe(kiltDid);
      expect(doc.controller).toBe(kiltDid);
    });

    it('should throw error for non-KILT DID format', async () => {
      await expect(kiltDidProvider.resolve('did:key:123')).rejects.toThrow('Invalid KILT DID format');
      await expect(kiltDidProvider.resolve('did:ethr:456')).rejects.toThrow('Invalid KILT DID format');
      await expect(kiltDidProvider.resolve('not-a-did')).rejects.toThrow('Invalid KILT DID format');
    });

    it('should throw error for malformed KILT DID', async () => {
      await expect(kiltDidProvider.resolve('did:kilt:')).rejects.toThrow('Failed to resolve KILT DID');
      await expect(kiltDidProvider.resolve('did:kilt:invalid')).rejects.toThrow('Failed to resolve KILT DID');
    });
  });

  describe('extractAddress', () => {
    it('should extract address from valid KILT DID', async () => {
      const kiltDid = `did:kilt:${validKiltAddress}`;
      const address = await kiltDidProvider.extractAddress(kiltDid);

      expect(address).toBe(validKiltAddress);
    });

    it('should throw error for non-KILT DID', async () => {
      await expect(kiltDidProvider.extractAddress('did:key:123')).rejects.toThrow('Invalid KILT DID format');
      await expect(kiltDidProvider.extractAddress('did:ethr:456')).rejects.toThrow('Invalid KILT DID format');
    });

    it('should validate extracted address', async () => {
      const { validatePolkadotAddress } = require('../../adapters/types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new Error('Invalid address');
      });

      await expect(kiltDidProvider.extractAddress('did:kilt:invalid')).rejects.toThrow('Failed to extract address from KILT DID');
    });
  });

  describe('verifyOnchain', () => {
    it('should return true for valid address when connected', async () => {
      const isValid = await kiltDidProvider.verifyOnchain(`did:kilt:${validKiltAddress}`);

      expect(isValid).toBe(true);
      expect(mockKiltAdapter.connect).toHaveBeenCalled();
    });

    it('should return false when KiltAdapter connection fails', async () => {
      mockKiltAdapter.connect.mockRejectedValue(new Error('Connection failed'));

      const isValid = await kiltDidProvider.verifyOnchain(`did:kilt:${validKiltAddress}`);

      expect(isValid).toBe(false);
    });

    it('should return false for invalid DID format', async () => {
      const isValid = await kiltDidProvider.verifyOnchain('did:key:123');

      expect(isValid).toBe(false);
      expect(mockKiltAdapter.connect).toHaveBeenCalled();
    });

    it('should return false when not connected to spiritnet', async () => {
      mockKiltAdapter.getChainInfo.mockReturnValue({
        network: 'testnet', // Not spiritnet
        name: 'Test Network',
        version: '1',
        runtime: 'test',
        ss58Format: 42,
        genesisHash: '0xabc',
      });

      const isValid = await kiltDidProvider.verifyOnchain(`did:kilt:${validKiltAddress}`);

      expect(isValid).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should create provider with provided KiltAdapter', () => {
      const customAdapter = mockKiltAdapter;
      const provider = new KILTDIDProvider(customAdapter);

      expect(provider).not.toBeNull();
    });

    it('should create provider with default KiltAdapter when none provided', () => {
      const provider = new KILTDIDProvider();

      expect(provider).not.toBeNull();
    });
  });
});
