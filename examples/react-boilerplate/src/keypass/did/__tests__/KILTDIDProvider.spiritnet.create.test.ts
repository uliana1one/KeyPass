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

// Mock @polkadot/util-crypto to avoid decoding issues
jest.mock('@polkadot/util-crypto', () => ({
  decodeAddress: jest.fn(() => new Uint8Array(32).fill(1)),
  encodeAddress: jest.fn((pk: Uint8Array) => 'encodedAddress'),
  base58Encode: jest.fn(() => 'base58encoded'),
  isAddress: jest.fn(() => true),
}));

describe('KILTDIDProvider Spiritnet create DID (details, signature)', () => {
  test('builds details, requests signature and submits did.create(details, signature)', async () => {
    // Prepare mocked api
    const didCreateMeta = { args: [{ type: { toString: () => 'PalletDidLookupBoundedDidCallDetails' } }, { type: { toString: () => 'DidSignature' } }] };

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
      tx: {
        did: {
          create: jest.fn().mockImplementation((_details: any, _signature: any) => extrinsic),
        },
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
        payment: { queryFeeDetails: jest.fn().mockResolvedValue({ inclusionFee: null, tip: { toBn: () => 0n } }) },
      },
    };

    // Mock adapter
    const mockAdapter: any = {
      connect: jest.fn().mockResolvedValue(undefined),
      getChainInfo: jest.fn().mockReturnValue({ network: 'spiritnet' }),
      api,
    };
    // Inject meta
    (api.tx.did.create as any).meta = didCreateMeta;

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


