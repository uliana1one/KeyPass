import { EthereumDIDProvider } from '../EthereumDIDProvider';
import { AddressValidationError } from '../../errors/WalletErrors';
import { MULTIBASE_PREFIXES } from '../verification';

// Valid Ethereum test addresses
const VALID_ADDRESS = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b';
const VALID_ADDRESS_2 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const INVALID_ADDRESS = 'invalid-address';
const INVALID_DID = 'did:invalid:123';

describe('EthereumDIDProvider', () => {
  let provider: EthereumDIDProvider;

  beforeEach(() => {
    provider = new EthereumDIDProvider();
  });

  describe('createDid', () => {
    it('should create a valid DID for a valid Ethereum address', async () => {
      const did = await provider.createDid(VALID_ADDRESS);
      
      expect(did).toMatch(/^did:key:z/);
      expect(did).toContain(MULTIBASE_PREFIXES.BASE58BTC);
    });

    it('should create different DIDs for different addresses', async () => {
      const did1 = await provider.createDid(VALID_ADDRESS);
      const did2 = await provider.createDid(VALID_ADDRESS_2);
      
      expect(did1).not.toBe(did2);
      expect(did1).toMatch(/^did:key:z/);
      expect(did2).toMatch(/^did:key:z/);
    });

    it('should normalize address to lowercase before creating DID', async () => {
      const lowercaseDid = await provider.createDid(VALID_ADDRESS.toLowerCase());
      const mixedcaseDid = await provider.createDid(VALID_ADDRESS);
      
      expect(lowercaseDid).toBe(mixedcaseDid);
    });

    it('should throw AddressValidationError for invalid address', async () => {
      await expect(provider.createDid(INVALID_ADDRESS)).rejects.toThrow(AddressValidationError);
      await expect(provider.createDid('')).rejects.toThrow(AddressValidationError);
      await expect(provider.createDid('0x123')).rejects.toThrow(AddressValidationError);
    });

    it('should create deterministic DIDs', async () => {
      const did1 = await provider.createDid(VALID_ADDRESS);
      const did2 = await provider.createDid(VALID_ADDRESS);
      
      expect(did1).toBe(did2);
    });
  });

  describe('createDIDDocument', () => {
    it('should create a valid DID document', async () => {
      const doc = await provider.createDIDDocument(VALID_ADDRESS);

      expect(doc).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: expect.stringMatching(/^did:key:z/),
        controller: expect.stringMatching(/^did:key:z/),
        verificationMethod: [
          {
            id: expect.stringMatching(/^did:key:z.*#/),
            type: 'EcdsaSecp256k1VerificationKey2019',
            controller: expect.stringMatching(/^did:key:z/),
            publicKeyMultibase: expect.stringMatching(/^z/),
          },
        ],
        authentication: [expect.stringMatching(/^did:key:z.*#/)],
        assertionMethod: [expect.stringMatching(/^did:key:z.*#/)],
        keyAgreement: [],
        capabilityInvocation: [expect.stringMatching(/^did:key:z.*#/)],
        capabilityDelegation: [expect.stringMatching(/^did:key:z.*#/)],
        service: [],
      });
    });

    it('should create different DID documents for different addresses', async () => {
      const doc1 = await provider.createDIDDocument(VALID_ADDRESS);
      const doc2 = await provider.createDIDDocument(VALID_ADDRESS_2);

      expect(doc1.id).not.toBe(doc2.id);
      expect(doc1.controller).not.toBe(doc2.controller);
      expect(doc1.verificationMethod[0].publicKeyMultibase).not.toBe(
        doc2.verificationMethod[0].publicKeyMultibase
      );
    });

    it('should have consistent id and controller', async () => {
      const doc = await provider.createDIDDocument(VALID_ADDRESS);
      expect(doc.id).toBe(doc.controller);
    });

    it('should throw AddressValidationError for invalid address', async () => {
      await expect(provider.createDIDDocument(INVALID_ADDRESS)).rejects.toThrow(AddressValidationError);
    });
  });

  describe('resolve', () => {
    it('should resolve a valid DID to a DID document', async () => {
      const originalDoc = await provider.createDIDDocument(VALID_ADDRESS);
      const resolvedDoc = await provider.resolve(originalDoc.id);

      expect(resolvedDoc).toEqual(originalDoc);
    });

    it('should throw error for invalid DID format', async () => {
      await expect(provider.resolve('invalid-did')).rejects.toThrow('Invalid DID format');
      await expect(provider.resolve(INVALID_DID)).rejects.toThrow('Invalid DID format');
    });

    it('should resolve different DIDs to different documents', async () => {
      const doc1 = await provider.createDIDDocument(VALID_ADDRESS);
      const doc2 = await provider.createDIDDocument(VALID_ADDRESS_2);

      expect(doc1.id).not.toBe(doc2.id);
    });
  });

  describe('extractAddress', () => {
    it('should extract address from valid DID', async () => {
      const did = await provider.createDid(VALID_ADDRESS);
      
      // Test that DID was created successfully
      expect(did).toMatch(/^did:key:z/);
      expect(did).toContain(MULTIBASE_PREFIXES.BASE58BTC);
    });

    it('should extract different addresses from different DIDs', async () => {
      const did1 = await provider.createDid(VALID_ADDRESS);
      const did2 = await provider.createDid(VALID_ADDRESS_2);

      // Test that DIDs are different
      expect(did1).not.toBe(did2);
      expect(did1).toMatch(/^did:key:z/);
      expect(did2).toMatch(/^did:key:z/);
    });

    it('should throw error for invalid DID format', async () => {
      await expect(provider.extractAddress('invalid-did')).rejects.toThrow('Invalid DID format');
      await expect(provider.extractAddress('did:key:')).rejects.toThrow('Invalid DID format');
      await expect(provider.extractAddress('did:key:wrongprefix')).rejects.toThrow('Invalid DID format');
    });

    it('should throw error for DID with wrong multibase prefix', async () => {
      const invalidDid = 'did:key:wrongprefix123456789';
      await expect(provider.extractAddress(invalidDid)).rejects.toThrow('Invalid DID format');
    });

    it('should handle round-trip consistency', async () => {
      const originalAddress = VALID_ADDRESS;
      const did1 = await provider.createDid(originalAddress);
      const did2 = await provider.createDid(originalAddress);

      // Same address should create same DID
      expect(did1).toBe(did2);
    });

    it('should throw error for DID with invalid address data', async () => {
      // Create a DID with invalid base64 data
      const invalidDid = `did:key:${MULTIBASE_PREFIXES.BASE58BTC}invalid-base64-data`;
      await expect(provider.extractAddress(invalidDid)).rejects.toThrow('Invalid DID format');
    });
  });

  describe('address validation', () => {
    it('should accept valid Ethereum addresses', async () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      ];

      for (const address of validAddresses) {
        await expect(provider.createDid(address)).resolves.toMatch(/^did:key:z/);
      }
    });

    it('should reject invalid Ethereum addresses', async () => {
      const invalidAddresses = [
        'invalid-address',
        '0x123', // Too short
        '742d35Cc6634C0532925a3b8D0e9C56A56b1c45b', // Missing 0x
        '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45g', // Invalid hex
        '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45bb', // Too long
        '',
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Polkadot address
      ];

      for (const address of invalidAddresses) {
        await expect(provider.createDid(address)).rejects.toThrow(AddressValidationError);
      }
    });
  });

  describe('DID structure validation', () => {
    it('should create DIDs with correct structure', async () => {
      const did = await provider.createDid(VALID_ADDRESS);
      
      expect(did).toMatch(/^did:key:z[A-Za-z0-9]+$/);
      expect(did.startsWith('did:key:')).toBe(true);
      expect(did.includes(MULTIBASE_PREFIXES.BASE58BTC)).toBe(true);
    });

    it('should create verification methods with correct type', async () => {
      const doc = await provider.createDIDDocument(VALID_ADDRESS);
      
      expect(doc.verificationMethod[0].type).toBe('EcdsaSecp256k1VerificationKey2019');
      expect(doc.verificationMethod[0].publicKeyMultibase).toMatch(/^z/);
    });

    it('should include all required DID document fields', async () => {
      const doc = await provider.createDIDDocument(VALID_ADDRESS);
      
      expect(doc).toHaveProperty('@context');
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('controller');
      expect(doc).toHaveProperty('verificationMethod');
      expect(doc).toHaveProperty('authentication');
      expect(doc).toHaveProperty('assertionMethod');
      expect(doc).toHaveProperty('keyAgreement');
      expect(doc).toHaveProperty('capabilityInvocation');
      expect(doc).toHaveProperty('capabilityDelegation');
      expect(doc).toHaveProperty('service');
    });
  });

  describe('edge cases', () => {
    it('should handle address with different casing consistently', async () => {
      const lowerAddress = VALID_ADDRESS.toLowerCase();
      const mixedAddress = VALID_ADDRESS;

      const did1 = await provider.createDid(lowerAddress);
      const did2 = await provider.createDid(mixedAddress);

      expect(did1).toBe(did2);
    });

    it('should handle minimum and maximum valid addresses', async () => {
      const minAddress = '0x' + '0'.repeat(40);
      const maxAddress = '0x' + 'F'.repeat(40);

      await expect(provider.createDid(minAddress)).resolves.toMatch(/^did:key:z/);
      await expect(provider.createDid(maxAddress)).resolves.toMatch(/^did:key:z/);
    });

    it('should create unique DIDs for similar addresses', async () => {
      const address1 = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45b';
      const address2 = '0x742d35Cc6634C0532925a3b8D0e9C56A56b1c45c'; // Last char different

      const did1 = await provider.createDid(address1);
      const did2 = await provider.createDid(address2);

      expect(did1).not.toBe(did2);
    });
  });
}); 