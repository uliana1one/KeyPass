import { zkProofService, generateAgeVerificationProof } from '../zkProofService';

describe('ZKProofService (real path scaffolding)', () => {
  test('generateSemaphoreIdentity from wallet-like signer', async () => {
    const wallet = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      async signMessage(msg: string) {
        // deterministic fake signature based on message
        return '0x' + Buffer.from(msg).toString('hex').slice(0, 130).padEnd(130, '0');
      },
    };

    const { identity, commitment } = await zkProofService.generateSemaphoreIdentity(wallet as any);
    expect(identity).toBeDefined();
    expect(commitment).toBeDefined();
  });

  test('create group and add member', async () => {
    const groupKey = 'test-group';
    const group = zkProofService.createSemaphoreGroup(groupKey, 20);
    expect(group.depth).toBe(20);
    const before = group.members.length;
    zkProofService.addMemberToGroup(groupKey, BigInt(123));
    expect(group.members.length).toBe(before + 1);
  });

  test('age verification helper routes to mock when real disabled', async () => {
    const credentials: any[] = [
      {
        id: 'cred-1',
        credentialSubject: { age: 25 },
        issuer: { id: 'issuer-1' },
        issuanceDate: new Date().toISOString(),
        type: ['VerifiableCredential', 'AgeCredential'],
      },
    ];

    const proof = await generateAgeVerificationProof(credentials, 18);
    expect(proof.type).toBe('semaphore');
    expect(typeof proof.proof).toBe('string');
  });
});


