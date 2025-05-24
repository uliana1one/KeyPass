import { connectWallet } from './walletConnector';
import { selectAccount } from './accounts/AccountSelector';
import { buildLoginMessage } from './message/messageBuilder';
import { UUIDProvider } from './did/UUIDProvider';
import { v4 as uuidv4 } from 'uuid';
import messageFormat from '../config/messageFormat.json';

/**
 * Main function to handle login with Polkadot.
 * @returns A promise that resolves to an object containing address, did, message, signature, issuedAt, and nonce.
 */
export async function loginWithPolkadot(): Promise<{
  address: string;
  did: string;
  message: string;
  signature: string;
  issuedAt: string;
  nonce: string;
}> {
  const adapter = await connectWallet();
  const address = await selectAccount(adapter);
  const nonce = uuidv4();
  const issuedAt = new Date().toISOString();
  const message = await buildLoginMessage({
    template: messageFormat.template,
    address,
    nonce,
    issuedAt,
  });
  const signature = await adapter.signMessage(message);
  const did = new UUIDProvider().createDid(address);

  return {
    address,
    did,
    message,
    signature,
    issuedAt,
    nonce,
  };
}
