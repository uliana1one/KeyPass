import { jest } from '@jest/globals';
import { KILTDIDProvider } from '../../did/KILTDIDProvider';
import { KiltAdapter } from '../../adapters/KiltAdapter';

// Mock polkadot extension dapp API
jest.mock('@polkadot/extension-dapp', () => ({
  web3Enable: jest.fn(async () => [{ name: 'Sporran' }]),
  web3FromAddress: jest.fn(async () => ({
    signer: {
      signRaw: jest.fn(async ({ data }: { data: string }) => ({ signature: '0x' + data.slice(2, 130) || '0x'.padEnd(132, '0') })),
    },
  })),
}));

/**
 * Live test for KILT Spiritnet DID creation
 * Tests the actual Spiritnet runtime to verify DID creation flow
 */
describe('KILTDIDProvider Spiritnet DID Creation (Live Test)', () => {
  let api: any = null;

  beforeAll(async () => {
    try {
      // Dynamic import to avoid module loading issues
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      console.log('Connecting to Spiritnet...');
      // Connect to Spiritnet
      const wsProvider = new WsProvider('wss://spiritnet.kilt.io');
      api = await ApiPromise.create({ provider: wsProvider });
      await api.isReady;
      console.log('✅ Connected to Spiritnet');
    } catch (error) {
      console.error('❌ Failed to connect to Spiritnet:', error);
      api = null;
    }
  }, 45000);

  afterAll(async () => {
    if (api) {
      await api.disconnect();
    }
  });

  test.skip('should detect correct did.create signature from Spiritnet runtime', async () => {
    if (!api) {
      console.log('Skipping - no connection');
      return;
    }

    // Check the actual runtime metadata
    const createMeta = (api.tx as any).did?.create?.meta;
    expect(createMeta).toBeDefined();
    
    const argLength = createMeta?.args?.length;
    console.log('Spiritnet did.create args length:', argLength);
    console.log('Spiritnet did.create metadata:', JSON.stringify(createMeta, null, 2));

    // Log type information
    createMeta?.args?.forEach((arg: any, i: number) => {
      console.log(`Arg ${i}:`, {
        type: arg.type?.toString(),
        name: arg.name?.toString(),
      });
    });

    expect(argLength).toBeGreaterThan(0);
  });

  test.skip('should query Spiritnet runtime for DID pallet types', async () => {
    if (!api) {
      console.log('Skipping - no connection');
      return;
    }

    // Try to create a simple AccountId32 type
    const testAddress = '4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN';
    const accountId = api.registry.createType('AccountId32', testAddress);
    expect(accountId).toBeDefined();
    console.log('AccountId32 created:', accountId.toString());

    // Check available types
    const registryTypes = Object.keys(api.registry.getKnownTypes().types);
    console.log('Available DID types:', registryTypes.filter(t => t.toLowerCase().includes('did')).slice(0, 20).join(', '));

    // Try DID-specific types
    const didTypes = [
      'DidSignature',
      'PalletDidDidCreationDetails',
      'DidDidDetailsDidEncryptionKey',
      'DidDidDetailsDidVerificationKey',
      'DidServiceEndpointsDidEndpoint',
    ];

    didTypes.forEach(typeName => {
      try {
        const type = api.registry.createType(typeName as any, {});
        console.log(`✅ Type ${typeName} is available`);
      } catch (error: any) {
        console.log(`❌ Type ${typeName} not available:`, error.message);
      }
    });
  });

  test.skip('should show what went wrong with type encoding', async () => {
    if (!api) {
      console.log('Skipping - no connection');
      return;
    }

    const testAddress = '4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN';
    
    // Build what we need to test
    const details = {
      did: api.registry.createType('AccountId32', testAddress),
      submitter: api.registry.createType('AccountId32', testAddress),
      newKeyAgreementKeys: [],
      newAttestationKey: null,
      newDelegationKey: null,
      newServiceDetails: [],
    };

    // Try to encode details
    const typeName = 'PalletDidDidCreationDetails';
    console.log('\n🔍 Testing DID type encoding:');
    console.log('Type name:', typeName);
    
    try {
      const typed = api.registry.createType(typeName, details);
      console.log('✅ Type encoded successfully');
      console.log('Encoded length:', typed.toU8a().length);
    } catch (error: any) {
      console.log('❌ Type encoding failed:', error.message);
      console.log('Available registry types:');
      const knownTypes = Object.keys(api.registry.getKnownTypes().types);
      const didTypes = knownTypes.filter(t => t.toLowerCase().includes('did'));
      console.log('DID-related types:', didTypes.length > 0 ? didTypes.join(', ') : 'none found');
    }

    // Try signature type
    try {
      const sigType = api.registry.createType('DidSignature', { Sr25519: '0x' + 'a'.repeat(128) });
      console.log('✅ Signature type encoded successfully');
    } catch (error: any) {
      console.log('❌ Signature encoding failed:', error.message);
    }
  });
});
