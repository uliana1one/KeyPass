import { jest } from '@jest/globals';
import { KILTDIDProvider } from '../../did/KILTDIDProvider';

// Mock polkadot extension dapp API
jest.mock('@polkadot/extension-dapp', () => ({
  web3Enable: jest.fn(async () => [{ name: 'Sporran' }]),
  web3FromAddress: jest.fn(async () => ({
    signer: {
      signRaw: jest.fn(async ({ data }: { data: string }) => ({ signature: data.slice(0, 132) || '0x' })),
    },
  })),
}));

// Mock address validation
jest.mock('../../adapters/types', () => ({
  validatePolkadotAddress: jest.fn(() => true),
}));

// Mock @kiltprotocol/utils to handle multibase keypair operations
jest.mock('@kiltprotocol/utils', () => ({
  Multikey: {
    encodeMultibaseKeypair: jest.fn(({ publicKey, type }: any) => ({
      publicKeyMultibase: `z` + 'testmultibasekey', // Valid multibase format
    })),
    decodeMultibaseKeypair: jest.fn(({ publicKeyMultibase }: any) => ({
      type: 'sr25519',
      publicKey: new Uint8Array(32).fill(1),
    })),
  },
  Signers: {
    select: {
      bySignerId: jest.fn((ids: any) => (sig: any) => true),
      verifiableOnChain: jest.fn(),
    },
    selectSigner: jest.fn((signers: any, verifiable: any, matcher: any) => signers[0]),
    DID_PALLET_SUPPORTED_ALGORITHMS: ['sr25519', 'ed25519', 'ecdsa'],
    ALGORITHMS: {
      ECRECOVER_SECP256K1_BLAKE2B: 'EcdsaSecp256k1',
    },
  },
  Crypto: {
    u8aToHex: jest.fn((u8a: Uint8Array) => '0x' + Array.from(u8a).map(b => b.toString(16).padStart(2, '0')).join('')),
  },
  ss58Format: 38,
  SDKErrors: {
    NoSuitableSignerError: class extends Error {
      constructor(message: string, details: any) {
        super(message);
        this.name = 'NoSuitableSignerError';
      }
    },
    DidError: class extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'DidError';
      }
    },
  },
}));

// Mock @polkadot/util-crypto to avoid decoding issues
// Need to return a valid multibase key: z + base58(prefix + key)
jest.mock('@polkadot/util-crypto', () => {
  const mockKey = new Uint8Array(32).fill(1);
  return {
    decodeAddress: jest.fn(() => mockKey),
    encodeAddress: jest.fn((pk: Uint8Array) => 'encodedAddress'),
    base58Encode: jest.fn((data: Uint8Array) => {
      // Return a valid-looking base58 string when encoding
      // The SDK will prefix with 'z' to make it multibase
      return 'kQJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJ';
    }),
    isAddress: jest.fn(() => true),
  };
});

describe('KILTDIDProvider Spiritnet create DID (details, signature)', () => {
  test('builds details, requests signature and submits did.create(details, signature)', async () => {
    const unsubscribe = jest.fn();
    const signAsync = jest.fn().mockResolvedValue({
      hash: { toHex: () => '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
      send: jest.fn().mockImplementation((cb: (status: any) => void) => {
        // fire finalized immediately  
        cb({ status: { type: 'Finalized', asFinalized: { toHex: () => '0xabcdef' } }, isFinalized: true, isInBlock: false });
        return unsubscribe;
      }),
    });

    const extrinsic = {
      signAsync,
      paymentInfo: jest.fn().mockResolvedValue({ partialFee: { toBn: () => ({ toString: () => '100000' }) } }),
    } as any;

    const api: any = {
      isConnected: true,
      registry: {
        createType: jest.fn().mockImplementation((type: string, value: unknown) => ({ type, value, toU8a: () => new Uint8Array([1, 2, 3]) })),
        getKnownTypes: jest.fn().mockReturnValue({ types: {} }),
      },
      consts: {
        did: {
          maxNewKeyAgreementKeys: { toNumber: () => 5 },
          maxNumberOfServicesPerDid: { toNumber: () => 25 },
        },
      },
      tx: {
        did: {} as any,
        utility: { batchAll: jest.fn() },
      },
      query: {
        system: {
          events: { at: jest.fn().mockResolvedValue([{ phase: { isApplyExtrinsic: true, asApplyExtrinsic: { eqn: (i: number) => i === 0 } }, event: { section: 'did', method: 'DidCreated', data: [] } }]) },
        },
      },
      rpc: {
        system: { accountNextIndex: jest.fn().mockResolvedValue({ toNumber: () => 0 }) },
        author: { pendingExtrinsics: jest.fn().mockResolvedValue([]) },
        chain: {
          getFinalizedHead: jest.fn().mockResolvedValue('0xhead'),
          getBlock: jest.fn().mockResolvedValue({ block: { extrinsics: [{ hash: { toHex: () => '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' } }] } }),
          getHeader: jest.fn().mockResolvedValue({ number: { toNumber: () => 12345 }, parentHash: { toHex: () => '0xparent' } }),
        },
        payment: { queryFeeDetails: jest.fn().mockResolvedValue({ inclusionFee: null, tip: { toBn: () => BigInt(0) } }) },
      },
    };

    // Mock adapter
    const mockAdapter: any = {
      connect: jest.fn().mockResolvedValue(undefined),
      getChainInfo: jest.fn().mockReturnValue({ network: 'spiritnet' }),
      api,
    };
    // Mock the extrinsic creation to return a proper extrinsic object
    const didCreateExtrinsic = {
      method: {
        section: 'did',
        method: 'create',
        args: [],
      },
      signAsync,
      send: jest.fn().mockImplementation((cb: (status: any) => void) => {
        cb({ status: { type: 'Finalized', asFinalized: { toHex: () => '0xabcdef' } }, isFinalized: true, isInBlock: false });
        return unsubscribe;
      }),
      paymentInfo: jest.fn().mockResolvedValue({ partialFee: { toBn: () => ({ toString: () => '100000' }) } }),
    };
    
    api.tx.did.create = jest.fn().mockImplementation((_encoded: any, _signature: any) => didCreateExtrinsic);
    
    // Inject meta for KILT SDK (needs to match Spiritnet 2-arg format)
    (api.tx.did.create as any).meta = {
      args: [{
        type: { toString: () => 'PalletDidLookupBoundedDidCallDetails' },
        name: 'details',
      }, {
        type: { toString: () => 'DidSignature' },
        name: 'signature',
      }],
    };

    const { web3Enable, web3FromAddress } = await import('@polkadot/extension-dapp');
    
    const provider = new KILTDIDProvider(mockAdapter);
    // Use a valid KILT address format (Peregrine/S in testnet-accounts-summary.txt)
    const address = '4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN';
    const result = await provider.registerDidOnchain({ controller: address, metadata: { test: true } } as any, address);

    expect(web3Enable).toHaveBeenCalled();
    expect(web3FromAddress).toHaveBeenCalledWith(address);
    expect(api.tx.did.create).toHaveBeenCalled();
    expect(signAsync).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.transactionResult.success).toBe(true);
    expect(result.transactionResult.blockNumber).toBeGreaterThan(0);
  });
});


