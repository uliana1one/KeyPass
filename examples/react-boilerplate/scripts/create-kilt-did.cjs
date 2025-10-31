#!/usr/bin/env node
/* eslint-disable no-console */
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { u8aToHex } = require('@polkadot/util');
const { ConfigService } = require('@kiltprotocol/config');
const { getStoreTx } = require('@kiltprotocol/did');

async function main() {
  const WS = process.env.KILT_WSS || 'wss://peregrine.kilt.io';
  const MNEMONIC = process.env.KILT_MNEMONIC || 'moment develop giant embrace wet sad rocket chicken moon glimpse blame enact';

  console.log(`[KILT] Connecting to ${WS}...`);
  const provider = new WsProvider(WS);
  const api = await ApiPromise.create({ provider });
  await api.isReady;
  console.log('[KILT] Connected');

  const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
  const pair = keyring.addFromMnemonic(MNEMONIC);
  console.log(`[KILT] Using address: ${pair.address}`);

  // Configure KILT SDK with API
  ConfigService.set({ api });

  // Build auth key for DID creation (sr25519 public key)
  const authKey = {
    publicKey: pair.publicKey,
    type: 'sr25519',
  };

  // No services
  const services = undefined;

  // Signer for KILT SDK (signs raw bytes with sr25519 pair)
  const signers = [{
    id: u8aToHex(pair.publicKey),
    algorithm: 'sr25519',
    sign: async ({ data }) => pair.sign(data),
  }];

  console.log('[KILT] Creating pre-signed DID extrinsic via KILT SDK...');
  const didCreate = await getStoreTx({ authentication: [authKey], service: services }, pair.address, signers);

  const nonce = await api.rpc.system.accountNextIndex(pair.address);
  console.log('[KILT] Signing transaction wrapper and submitting...');
  return new Promise(async (resolve, reject) => {
    try {
      const unsub = await didCreate.signAndSend(pair, { nonce }, (status) => {
        const s = status.status;
        if (s.isInBlock) {
          console.log(`[KILT] In block: ${s.asInBlock.toHex()}`);
        }
        if (s.isFinalized) {
          console.log(`[KILT] Finalized: ${s.asFinalized.toHex()}`);
          unsub();
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  }).finally(async () => { try { await api.disconnect(); } catch {} });
}

main().then(() => {
  console.log('[KILT] DID creation attempt completed');
  process.exit(0);
}).catch((e) => {
  console.error('[KILT] DID creation failed:', e?.message || e);
  process.exit(1);
});


