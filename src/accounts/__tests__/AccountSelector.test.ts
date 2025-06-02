import { selectAccount } from '../AccountSelector';

// Mock adapter object
const createMockAdapter = (accounts: { address: string }[]) => ({
  getAccounts: jest.fn().mockResolvedValue(accounts),
});

describe('selectAccount', () => {
  it('throws an error when no accounts are found', async () => {
    const adapter = createMockAdapter([]);
    await expect(selectAccount(adapter)).rejects.toMatchObject({
      message: 'No accounts found',
      code: 'NO_ACCOUNTS',
    });
  });

  it('returns the address when a single account is found', async () => {
    const adapter = createMockAdapter([{ address: '0x123' }]);
    await expect(selectAccount(adapter)).resolves.toBe('0x123');
  });

  it('throws an error when multiple accounts are found', async () => {
    const adapter = createMockAdapter([{ address: '0x123' }, { address: '0x456' }]);
    await expect(selectAccount(adapter)).rejects.toMatchObject({
      message: 'Account selection not implemented',
      code: 'MULTIPLE_ACCOUNTS',
    });
  });
});
