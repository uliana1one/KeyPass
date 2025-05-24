import { PolkadotJsAdapter } from '../PolkadotJsAdapter';

describe('PolkadotJsAdapter', () => {
  let adapter: PolkadotJsAdapter;

  beforeEach(() => {
    adapter = new PolkadotJsAdapter();
  });

  it('should instantiate successfully', () => {
    expect(adapter).toBeInstanceOf(PolkadotJsAdapter);
  });

  describe('enable()', () => {
    it('should throw "Not implemented" error', async () => {
      await expect(adapter.enable()).rejects.toThrow('Not implemented');
    });
  });

  describe('getAccounts()', () => {
    it('should throw "Not implemented" error', async () => {
      await expect(adapter.getAccounts()).rejects.toThrow('Not implemented');
    });
  });

  describe('signMessage()', () => {
    it('should throw "Not implemented" error', async () => {
      const message = 'test message';
      await expect(adapter.signMessage(message)).rejects.toThrow('Not implemented');
    });
  });
});
