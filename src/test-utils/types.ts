import { WalletAdapter } from '../adapters/types';

export type MockedWalletAdapter = {
  [K in keyof WalletAdapter]: jest.Mock<ReturnType<WalletAdapter[K]>, Parameters<WalletAdapter[K]>>;
}; 