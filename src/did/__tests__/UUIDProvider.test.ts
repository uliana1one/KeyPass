import { PolkadotDIDProvider } from '../UUIDProvider';
import { AddressValidationError } from '../../errors/WalletErrors';
import { MULTIBASE_PREFIXES } from '../verification';
import { decodeAddress, encodeAddress, base58Encode, base58Decode } from '@polkadot/util-crypto';

// Valid Polkadot test addresses
const VALID_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice's address
const VALID_ADDRESS_2 = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'; // Bob's address
const INVALID_ADDRESS = 'invalid-address';
const INVALID_DID = 'did:invalid:123';
const INVALID_KEY_DID = 'did:key:invalid-key';

jest.mock('@polkadot/util-crypto', () => ({
  isAddress: jest.fn((address: string) => {
    return address === VALID_ADDRESS || address === VALID_ADDRESS_2;
  }),
  checkAddress: jest.fn((address: string) => {
    if (address === VALID_ADDRESS || address === VALID_ADDRESS_2) {
      return [true, null];
    }
    return [false, 'Invalid decoded address checksum'];
  }),
  decodeAddress: jest.fn((address: string) => {
    if (address === VALID_ADDRESS) {
      return new Uint8Array([1, 2, 3, 4]);
    }
    if (address === VALID_ADDRESS_2) {
      return new Uint8Array([5, 6, 7, 8]);
    }
    throw new Error('Invalid address');
  }),
  encodeAddress: jest.fn((key: Uint8Array) => {
    if (key[0] === 1) return VALID_ADDRESS;
    if (key[0] === 5) return VALID_ADDRESS_2;
    throw new Error('Invalid key');
  }),
  base58Encode: jest.fn((input: Uint8Array) => {
    if (input[0] === 1) return 'zz1111111111111111111111111111111111111111111111111111111111111111';
    if (input[0] === 5) return 'zz2222222222222222222222222222222222222222222222222222222222222222';
    throw new Error('Base58 encoding failed');
  }),
  base58Decode: jest.fn((input: string) => {
    if (input.startsWith('zz1')) return new Uint8Array([1, 2, 3, 4]);
    if (input.startsWith('zz2')) return new Uint8Array([5, 6, 7, 8]);
    throw new Error('Invalid base58 input');
  })
}));

jest.mock('../../adapters/types', () => ({
  validatePolkadotAddress: jest.fn((address: string) => {
    if (address === VALID_ADDRESS || address === VALID_ADDRESS_2) {
      return;
    }
    throw new AddressValidationError('Invalid address format');
  }),
  validateSignature: jest.fn()
}));

describe('PolkadotDIDProvider', () => {
  let provider: PolkadotDIDProvider;
  const VALID_PUBLIC_KEY = new Uint8Array(32).fill(1);
  const VALID_BASE58 = 'base58encodedkey';
  const VALID_DID = `did:key:${MULTIBASE_PREFIXES.BASE58BTC}${VALID_BASE58}`;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (decodeAddress as jest.Mock).mockReturnValue(VALID_PUBLIC_KEY);
    (encodeAddress as jest.Mock).mockReturnValue(VALID_ADDRESS);
    (base58Decode as jest.Mock).mockReturnValue(VALID_PUBLIC_KEY);
    
    provider = new PolkadotDIDProvider();
  });

  describe('createDid', () => {
    it('should create a valid DID for a valid address', async () => {
      const did = await provider.createDid(VALID_ADDRESS);
      expect(did).toBe(`did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz1111111111111111111111111111111111111111111111111111111111111111`);
      expect(decodeAddress).toHaveBeenCalledWith(VALID_ADDRESS);
      expect(base58Encode).toHaveBeenCalledWith(new Uint8Array([1, 2, 3, 4]));
    });

    it('should create different DIDs for different addresses', async () => {
      const did1 = await provider.createDid(VALID_ADDRESS);
      const did2 = await provider.createDid(VALID_ADDRESS_2);
      expect(did1).toBe(`did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz1111111111111111111111111111111111111111111111111111111111111111`);
      expect(did2).toBe(`did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz2222222222222222222222222222222222222222222222222222222222222222`);
      expect(did1).not.toBe(did2);
    });

    it('should throw AddressValidationError for invalid address', async () => {
      const invalidAddress = 'invalid-address';
      (decodeAddress as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid address');
      });

      await expect(provider.createDid(invalidAddress)).rejects.toThrow(AddressValidationError);
    });

    it('should throw AddressValidationError when address validation fails', async () => {
      const { validatePolkadotAddress } = require('../../adapters/types');
      validatePolkadotAddress.mockImplementation(() => {
        throw new AddressValidationError('Invalid address format');
      });

      await expect(provider.createDid('invalid-address')).rejects.toThrow(AddressValidationError);
    });

    it('should handle base58 encoding errors', async () => {
      (base58Encode as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Base58 encoding failed');
      });

      await expect(provider.createDid(VALID_ADDRESS)).rejects.toThrow('Failed to encode public key');
    });
  });

  describe('createDIDDocument', () => {
    it('should create a valid DID document', async () => {
      const doc = await provider.createDIDDocument(VALID_ADDRESS);
      
      expect(doc).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/sr25519-2020/v1'
        ],
        id: VALID_DID,
        controller: VALID_DID,
        verificationMethod: [{
          id: `${VALID_DID}#${(MULTIBASE_PREFIXES.BASE58BTC + VALID_BASE58).slice(0, 8)}`,
          type: 'Sr25519VerificationKey2020',
          controller: VALID_DID,
          publicKeyMultibase: MULTIBASE_PREFIXES.BASE58BTC + VALID_BASE58
        }],
        authentication: [`${VALID_DID}#${(MULTIBASE_PREFIXES.BASE58BTC + VALID_BASE58).slice(0, 8)}`],
        assertionMethod: [`${VALID_DID}#${(MULTIBASE_PREFIXES.BASE58BTC + VALID_BASE58).slice(0, 8)}`],
        keyAgreement: [],
        capabilityInvocation: [`${VALID_DID}#${(MULTIBASE_PREFIXES.BASE58BTC + VALID_BASE58).slice(0, 8)}`],
        capabilityDelegation: [`${VALID_DID}#${(MULTIBASE_PREFIXES.BASE58BTC + VALID_BASE58).slice(0, 8)}`],
        service: []
      });
    });

    it('should create different DID documents for different addresses', async () => {
      const doc1 = await provider.createDIDDocument(VALID_ADDRESS);
      const doc2 = await provider.createDIDDocument(VALID_ADDRESS_2);
      expect(doc1.id).toBe(`did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz1111111111111111111111111111111111111111111111111111111111111111`);
      expect(doc2.id).toBe(`did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz2222222222222222222222222222222222222222222222222222222222222222`);
      expect(doc1.id).not.toBe(doc2.id);
      expect(doc1.verificationMethod[0].publicKeyMultibase).not.toBe(doc2.verificationMethod[0].publicKeyMultibase);
    });

    it('should throw AddressValidationError for invalid address', async () => {
      (decodeAddress as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid address');
      });

      await expect(provider.createDIDDocument('invalid-address')).rejects.toThrow(AddressValidationError);
    });

    it('should handle base58 encoding errors', async () => {
      (base58Encode as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Base58 encoding failed');
      });

      await expect(provider.createDIDDocument(VALID_ADDRESS)).rejects.toThrow('Failed to encode public key');
    });
  });

  describe('resolve', () => {
    it('should resolve a valid DID to a DID document', async () => {
      const doc = await provider.resolve(VALID_DID);
      expect(doc.id).toBe(VALID_DID);
      expect(doc.controller).toBe(VALID_DID);
      expect(doc.verificationMethod).toHaveLength(1);
      expect(doc.verificationMethod[0].type).toBe('Sr25519VerificationKey2020');
    });

    it('should resolve different DIDs to different documents', async () => {
      const did1 = `did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz1111111111111111111111111111111111111111111111111111111111111111`;
      const did2 = `did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz2222222222222222222222222222222222222222222222222222222222222222`;
      const doc1 = await provider.resolve(did1);
      const doc2 = await provider.resolve(did2);
      expect(doc1.id).toBe(did1);
      expect(doc2.id).toBe(did2);
      expect(doc1.id).not.toBe(doc2.id);
      expect(doc1.verificationMethod[0].publicKeyMultibase).not.toBe(doc2.verificationMethod[0].publicKeyMultibase);
    });

    it('should throw error for invalid DID format', async () => {
      await expect(provider.resolve('invalid-did')).rejects.toThrow('Invalid DID format');
      await expect(provider.resolve('did:key:')).rejects.toThrow('Invalid DID format');
      await expect(provider.resolve('did:key:z')).rejects.toThrow('Invalid DID format');
    });

    it('should throw error for DID with invalid public key', async () => {
      (base58Decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid base58');
      });

      await expect(provider.resolve(VALID_DID)).rejects.toThrow('Invalid public key in DID');
    });

    it('should throw error for DID with wrong multibase prefix', async () => {
      const invalidDid = 'did:key:wrongprefix' + VALID_BASE58;
      await expect(provider.resolve(invalidDid)).rejects.toThrow('Invalid public key in DID');
    });

    it('should handle base58 decoding errors', async () => {
      (base58Decode as jest.Mock).mockImplementation(() => {
        throw new Error('Base58 decoding failed');
      });

      await expect(provider.resolve(VALID_DID)).rejects.toThrow('Invalid public key in DID');
    });
  });

  describe('extractAddress', () => {
    it('should extract address from valid DID', async () => {
      const address = await provider.extractAddress(VALID_DID);
      expect(address).toBe(VALID_ADDRESS);
      expect(base58Decode).toHaveBeenCalledWith(VALID_BASE58);
      expect(encodeAddress).toHaveBeenCalledWith(VALID_PUBLIC_KEY);
    });

    it('should extract different addresses from different DIDs', async () => {
      const did1 = `did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz1111111111111111111111111111111111111111111111111111111111111111`;
      const did2 = `did:key:${MULTIBASE_PREFIXES.BASE58BTC}zz2222222222222222222222222222222222222222222222222222222222222222`;
      const address1 = await provider.extractAddress(did1);
      const address2 = await provider.extractAddress(did2);
      expect(address1).toBe(VALID_ADDRESS);
      expect(address2).toBe(VALID_ADDRESS_2);
    });

    it('should throw error for invalid DID format', async () => {
      await expect(provider.extractAddress('invalid-did')).rejects.toThrow('Invalid DID format');
      await expect(provider.extractAddress('did:key:')).rejects.toThrow('Invalid DID format');
      await expect(provider.extractAddress('did:key:z')).rejects.toThrow('Invalid DID format');
    });

    it('should throw error for DID with invalid public key', async () => {
      (base58Decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid base58');
      });

      await expect(provider.extractAddress(VALID_DID)).rejects.toThrow('Invalid public key in DID');
    });

    it('should throw error for DID with wrong multibase prefix', async () => {
      const invalidDid = 'did:key:wrongprefix' + VALID_BASE58;
      await expect(provider.extractAddress(invalidDid)).rejects.toThrow('Invalid public key in DID');
    });

    it('should preserve specific error message for invalid public key', async () => {
      (base58Decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid public key in DID');
      });

      await expect(provider.extractAddress(VALID_DID)).rejects.toThrow('Invalid public key in DID');
    });

    it('should handle address encoding errors', async () => {
      (encodeAddress as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Address encoding failed');
      });

      await expect(provider.extractAddress(VALID_DID)).rejects.toThrow('Failed to encode address');
    });
  });
});
