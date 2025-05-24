import { UUIDProvider } from '../UUIDProvider';

describe('UUIDProvider', () => {
  let provider: UUIDProvider;

  beforeEach(() => {
    provider = new UUIDProvider();
  });

  it('returns a string matching the DID format', () => {
    const did = provider.createDid('5FfD…xyz');
    expect(did).toMatch(/^did:key:[0-9a-fA-F-]{36}$/);
  });

  it('produces different UUIDs for the same input', () => {
    const did1 = provider.createDid('5FfD…xyz');
    const did2 = provider.createDid('5FfD…xyz');
    expect(did1).not.toBe(did2);
  });
}); 