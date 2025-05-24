/**
 * Selects an account from the provided adapter.
 * @param adapter - An object with a getAccounts method that returns a promise resolving to an array of accounts.
 * @returns A promise that resolves to the selected account's address.
 * @throws Will throw an error if no accounts are found or if multiple accounts are returned.
 */
export async function selectAccount(adapter: {
  getAccounts(): Promise<{ address: string }[]>;
}): Promise<string> {
  const accounts = await adapter.getAccounts();
  if (accounts.length === 0) {
    throw new Error('No accounts found');
  }
  if (accounts.length === 1) {
    return accounts[0].address;
  }
  throw new Error('Account selection not implemented');
}
