import { describe, test } from '@jest/globals';

/**
 * Manual test to inspect Spiritnet runtime metadata
 * Run this to see what Spiritnet actually expects
 */
describe('KILTDIDProvider Spiritnet Manual Inspection', () => {
  test('inspect Spiritnet did.create metadata and types', async () => {
    // Dynamically import to avoid ESM issues
    const { ApiPromise, WsProvider } = await import('@polkadot/api');
    
    console.log('\n🔍 Connecting to Spiritnet to inspect metadata...\n');
    const wsProvider = new WsProvider('wss://spiritnet.kilt.io');
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;
    
    console.log('✅ Connected to Spiritnet');
    console.log('Chain:', api.runtimeChain.toString());
    console.log('Version:', api.runtimeVersion.toString());
    
    // Get did.create metadata
    const didCreateMeta = (api.tx as any).did?.create?.meta;
    console.log('\n📋 did.create metadata:');
    console.log('Args count:', didCreateMeta?.args?.length);
    
    didCreateMeta?.args?.forEach((arg: any, i: number) => {
      console.log(`\nArg ${i}:`);
      console.log('  Name:', arg.name?.toString());
      console.log('  Type:', arg.type?.toString());
      console.log('  TypeName:', arg.typeName?.toString());
    });
    
    // Try to see what types are available
    console.log('\n🔍 Checking available registry types...');
    // Note: getKnownTypes might not be available, skip if it fails
    try {
      const knownTypes = Object.keys(api.registry.getKnownTypes().types);
      const didTypes = knownTypes.filter(t => t.toLowerCase().includes('did'));
      console.log('DID-related types found:', didTypes.length);
      console.log('First 20 types:', didTypes.slice(0, 20).join(', '));
    } catch {
      console.log('getKnownTypes not available');
    }
    
    // Try to create types
    console.log('\n🧪 Testing type creation...');
    const testAddress = '4o1wrD1mTt6ckP7aDWKNhe1MqeuSdXDKoWhzHm8suLrVENaN';
    
    const didTypesToTest = [
      'DidDidDetailsDidCreationDetails',  // The actual type name from Spiritnet!
      'DidDidDetailsDidSignature',        // The actual type name from Spiritnet!
      'PalletDidDidCreationDetails',
      'DidDidCreationDetails',
      'DidSignature',
      'DidDidDetailsDidEncryptionKey',
      'DidDidDetailsDidVerificationKey',
      'DidServiceEndpointsDidEndpoint',
    ];
    
    for (const typeName of didTypesToTest) {
      try {
        console.log(`\nTesting ${typeName}:`);
        const testValue = typeName.includes('Signature') 
          ? { Sr25519: new Uint8Array(64) }
          : { did: testAddress, submitter: testAddress };
        const type = api.registry.createType(typeName as any, testValue);
        console.log(`✅ ${typeName} is available`);
        console.log('  Encoded size:', type.toU8a().length, 'bytes');
      } catch (error: any) {
        console.log(`❌ ${typeName}: ${error.message}`);
      }
    }
    
    // Test various approaches to calling did.create
    console.log('\n🧪 Testing did.create with different parameter structures...');
    
    const testCases = [
      {
        name: 'Minimal details',
        params: [{ did: testAddress, submitter: testAddress }, { Sr25519: new Uint8Array(64) }]
      },
      {
        name: 'Full details',
        params: [
          {
            did: testAddress,
            submitter: testAddress,
            newKeyAgreementKeys: [],
            newAttestationKey: null,
            newDelegationKey: null,
            newServiceDetails: [],
          },
          { Sr25519: new Uint8Array(64) }
        ]
      },
      {
        name: 'Plain strings',
        params: [testAddress, { Sr25519: '0x' + '00'.repeat(64) }]
      },
    ];
    
    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      try {
        const extrinsic = (api.tx as any).did.create(...testCase.params);
        console.log(`✅ ${testCase.name}: Success`);
        console.log('  Method:', extrinsic.method.section + '.' + extrinsic.method.method);
        console.log('  Args:', extrinsic.method.args.length);
      } catch (error: any) {
        console.log(`❌ ${testCase.name}: ${error.message.substring(0, 100)}`);
      }
    }
    
    await api.disconnect();
    console.log('\n✅ Test complete');
  }, 60000);
});

