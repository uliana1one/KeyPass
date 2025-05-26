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
    return 'zz' + '0'.repeat(62);
  }),
  base58Decode: jest.fn((input: string) => {
    if (input.startsWith('zz1')) return new Uint8Array([1, 2, 3, 4]);
    if (input.startsWith('zz2')) return new Uint8Array([5, 6, 7, 8]);
    throw new Error('Invalid base58 input');
  })
}));

import { PolkadotDIDProvider } from '../UUIDProvider';
import { AddressValidationError } from '../../errors/WalletErrors';

describe('PolkadotDIDProvider', () => {
  let provider: PolkadotDIDProvider;

  beforeEach(() => {
    provider = new PolkadotDIDProvider();
  });

  describe('createDid', () => {
    it('should create a valid did:key for a Polkadot address', async () => {
      const did = await provider.createDid(VALID_ADDRESS);
      expect(did).toMatch(/^did:key:z[1-9A-HJ-NP-Za-km-z]+$/);
    });

    it('should create the same DID for the same address', async () => {
      const did1 = await provider.createDid(VALID_ADDRESS);
      const did2 = await provider.createDid(VALID_ADDRESS);
      expect(did1).toBe(did2);
    });

    it('should create different DIDs for different addresses', async () => {
      const did1 = await provider.createDid(VALID_ADDRESS);
      const did2 = await provider.createDid(VALID_ADDRESS_2);
      expect(did1).not.toBe(did2);
      expect(did1).toMatch(/^did:key:zz/);
      expect(did2).toMatch(/^did:key:zz/);
      expect(did1).not.toBe(did2);
    });

    it('should throw error for invalid address format', async () => {
      await expect(provider.createDid(INVALID_ADDRESS)).rejects.toThrow(AddressValidationError);
    });
  });

  describe('createDIDDocument', () => {
    it('should create a valid DID document', async () => {
      const doc = await provider.createDIDDocument(VALID_ADDRESS);
      const did = await provider.createDid(VALID_ADDRESS);
      
      expect(doc).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/sr25519-2020/v1'
        ],
        id: did,
        controller: did,
        verificationMethod: [{
          id: `${did}#zzz11111`,
          type: 'Sr25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: expect.stringMatching(/^zz/)
        }],
        authentication: [`${did}#zzz11111`],
        assertionMethod: [`${did}#zzz11111`],
        capabilityDelegation: [`${did}#zzz11111`],
        capabilityInvocation: [`${did}#zzz11111`],
        keyAgreement: [],
        service: []
      });
    });

    it('should include authentication and assertion verification methods', async () => {
      const doc = await provider.createDIDDocument(VALID_ADDRESS);
      const verificationMethod = doc.verificationMethod[0];
      
      expect(doc.authentication).toContain(verificationMethod.id);
      expect(doc.assertionMethod).toContain(verificationMethod.id);
      expect(verificationMethod.type).toBe('Sr25519VerificationKey2020');
    });

    it('should throw error for invalid address', async () => {
      await expect(provider.createDIDDocument(INVALID_ADDRESS)).rejects.toThrow(AddressValidationError);
    });
  });

  describe('resolve', () => {
    it('should resolve a DID to its document', async () => {
      const did = await provider.createDid(VALID_ADDRESS);
      const doc = await provider.resolve(did);
      
      expect(doc).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/sr25519-2020/v1'
        ],
        id: did,
        controller: did,
        verificationMethod: [{
          id: `${did}#zzz11111`,
          type: 'Sr25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: expect.stringMatching(/^zz/)
        }],
        authentication: [`${did}#zzz11111`],
        assertionMethod: [`${did}#zzz11111`],
        capabilityDelegation: [`${did}#zzz11111`],
        capabilityInvocation: [`${did}#zzz11111`],
        keyAgreement: [],
        service: []
      });
    });

    it('should throw error for invalid DID format', async () => {
      await expect(provider.resolve(INVALID_DID)).rejects.toThrow('Invalid DID format');
    });

    it('should throw error for invalid public key in DID', async () => {
      await expect(provider.resolve(INVALID_KEY_DID)).rejects.toThrow('Invalid public key in DID');
    });
  });

  describe('extractAddress', () => {
    it('should extract the original address from a DID', async () => {
      const did = await provider.createDid(VALID_ADDRESS);
      const address = await provider.extractAddress(did);
      expect(address).toBe(VALID_ADDRESS);
    });

    it('should throw error for invalid DID format', async () => {
      await expect(provider.extractAddress(INVALID_DID)).rejects.toThrow('Invalid DID format');
    });

    it('should throw error for invalid public key in DID', async () => {
      await expect(provider.extractAddress(INVALID_KEY_DID)).rejects.toThrow('Invalid public key in DID');
    });
  });
});
