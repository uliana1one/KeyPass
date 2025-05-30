import { connectWallet } from './walletConnector';
import { selectAccount } from './accounts/AccountSelector';
import { buildLoginMessage } from './message/messageBuilder';
import { v4 as uuidv4 } from 'uuid';
import messageFormat from '../config/messageFormat.json';
import { WalletConnectionError } from './errors/WalletErrors';
import { PolkadotDIDProvider } from './did/UUIDProvider';
import { WalletAccount } from './adapters/types';

export interface LoginResult {
  address: string;
  signature: string;
  message: string;
  did: string;
  issuedAt: string;
  nonce: string;
}

/**
 * Main function to handle login with Polkadot.
 * @returns A promise that resolves to an object containing address, did, message, signature, issuedAt, and nonce.
 */
export async function loginWithPolkadot(): Promise<LoginResult> {
  const adapter = await connectWallet();
  const accounts = await adapter.getAccounts();
  if (!accounts.length) {
    throw new WalletConnectionError('No accounts found');
  }
  const address = accounts[0].address;
  const nonce = uuidv4();
  const issuedAt = new Date().toISOString();
  const message = await buildLoginMessage({
    template: messageFormat.template,
    address,
    nonce,
    issuedAt,
  });
  const signature = await adapter.signMessage(message);
  const didProvider = new PolkadotDIDProvider();
  const did = await didProvider.createDid(address);

  return {
    address,
    signature,
    message,
    did,
    issuedAt,
    nonce
  };
}
