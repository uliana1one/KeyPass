export const loginWithPolkadot = jest.fn().mockResolvedValue({
  address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  chainType: 'polkadot',
  signature: '0x1234567890abcdef',
  message: 'Test message',
  issuedAt: '2024-01-15T10:30:00.000Z',
  nonce: 'test-nonce',
  accountName: 'Test Account',
});

export const loginWithEthereum = jest.fn().mockResolvedValue({
  address: '0x742d35Cc6634C0532925a3b8D6f9C0dC65e6b8Fc',
  did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  chainType: 'ethereum',
  signature: '0x1234567890abcdef',
  message: 'Test message',
  issuedAt: '2024-01-15T10:30:00.000Z',
  nonce: 'test-nonce',
  accountName: 'Test Account',
}); 