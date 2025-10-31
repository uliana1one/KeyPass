const express = require('express');
const cors = require('cors');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { u8aToHex } = require('@polkadot/util');
const { getStoreTx } = require('@kiltprotocol/did');
const { ConfigService } = require('@kiltprotocol/config');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Mock real credential data
const mockCredentials = [
  {
    id: 'cred_1',
    type: ['VerifiableCredential', 'EducationalCredential'],
    issuer: 'did:web:university.edu',
    issuanceDate: '2024-01-15T10:00:00Z',
    credentialSubject: {
      id: 'did:key:zpolkadot5bByGMXg1761362941291',
      name: 'John Doe',
      degree: 'Bachelor of Computer Science',
      gpa: 3.8,
      graduationDate: '2024-05-15'
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: '2024-01-15T10:00:00Z',
      verificationMethod: 'did:web:university.edu#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: 'z5J8X7K2M9N1P4Q6R8S3T5U7V9W2X4Y6Z8A1B3C5D7E9F2G4H6I8J1K3L5M7N9P2Q4R6S8T1U3V5W7X9Y2Z4A6B8C1D3E5F7G9H2I4J6K8L1M3N5P7Q9R2S4T6U8V1W3X5Y7Z9'
    }
  },
  {
    id: 'cred_2',
    type: ['VerifiableCredential', 'ProfessionalCredential'],
    issuer: 'did:web:company.com',
    issuanceDate: '2024-02-20T14:30:00Z',
    credentialSubject: {
      id: 'did:key:zpolkadot5bByGMXg1761362941291',
      name: 'John Doe',
      position: 'Senior Software Engineer',
      company: 'Tech Corp',
      startDate: '2024-01-01',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js']
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: '2024-02-20T14:30:00Z',
      verificationMethod: 'did:web:company.com#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: 'z9A2B4C6D8E1F3G5H7I9J2K4L6M8N1O3P5Q7R9S2T4U6V8W1X3Y5Z7A9B2C4D6E8F1G3H5I7J9K2L4M6N8O1P3Q5R7S9T2U4V6W8X1Y3Z5A7B9C2D4E6F8G1H3I5J7K9L2M4N6O8P1Q3R5S7T9U2V4W6X8Y1Z3A5B7C9D2E4F6G8H1I3J5K7L9M2N4O6P8Q1R3S5T7U9V2W4X6Y8Z1A3B5C7D9E2F4G6H8I1J3K5L7M9N2O4P6Q8R1S3T5U7V9W2X4Y6Z8A1B3C5D7E9F2G4H6I8J1K3L5M7N9P2Q4R6S8T1U3V5W7X9Y2Z4A6B8C1D3E5F7G9H2I4J6K8L1M3N5P7Q9R2S4T6U8V1W3X5Y7Z9'
    }
  }
];

const mockCredentialRequests = [
  {
    id: 'req_1',
    requester: 'did:web:employer.com',
    requestedCredential: 'EducationalCredential',
    purpose: 'Job Application',
    status: 'pending',
    requestedAt: '2024-03-01T09:00:00Z',
    expiresAt: '2024-03-15T09:00:00Z'
  }
];

const mockCredentialOffers = [
  {
    id: 'offer_1',
    issuer: 'did:web:certification.org',
    credentialType: 'ProfessionalCertification',
    title: 'Blockchain Developer Certification',
    description: 'Certified blockchain developer with expertise in smart contracts',
    requirements: ['Portfolio Review', 'Technical Interview'],
    validUntil: '2024-12-31T23:59:59Z',
    offeredAt: '2024-03-05T10:00:00Z'
  }
];

// API Routes
app.get('/api/credentials/:did', (req, res) => {
  console.log(`[API] GET /api/credentials/${req.params.did}`);
  res.json(mockCredentials);
});

app.get('/api/credential-requests/:did', (req, res) => {
  console.log(`[API] GET /api/credential-requests/${req.params.did}`);
  res.json(mockCredentialRequests);
});

app.get('/api/credential-offers/:did', (req, res) => {
  console.log(`[API] GET /api/credential-offers/${req.params.did}`);
  res.json(mockCredentialOffers);
});

app.post('/api/credentials/request', (req, res) => {
  console.log('[API] POST /api/credentials/request', req.body);
  res.json({ success: true, requestId: 'req_' + Date.now() });
});

app.post('/api/credentials/accept', (req, res) => {
  console.log('[API] POST /api/credentials/accept', req.body);
  res.json({ success: true, credentialId: 'cred_' + Date.now() });
});

app.post('/api/credentials/revoke', (req, res) => {
  console.log('[API] POST /api/credentials/revoke', req.body);
  res.json({ success: true });
});

// --- KILT DID creation (backend) ---
// body: { network?: 'spiritnet'|'peregrine', mnemonic?: string }
app.post('/api/kilt/did/create', async (req, res) => {
  const network = (req.body?.network || 'peregrine').toLowerCase();
  const WS = network === 'spiritnet' ? 'wss://spiritnet.kilt.io' : 'wss://peregrine.kilt.io';
  const MNEMONIC = req.body?.mnemonic || process.env.KILT_MNEMONIC || 'moment develop giant embrace wet sad rocket chicken moon glimpse blame enact';

  console.log(`[API] POST /api/kilt/did/create network=${network} ws=${WS}`);

  let api;
  try {
    const provider = new WsProvider(WS);
    api = await ApiPromise.create({ provider });
    await api.isReady;

    // Configure KILT SDK with this api instance
    ConfigService.set({ api });

    // Build signer from mnemonic
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
    const pair = keyring.addFromMnemonic(MNEMONIC);

    const authKey = { publicKey: pair.publicKey, type: 'sr25519' };
    const signers = [{ id: u8aToHex(pair.publicKey), algorithm: 'sr25519', sign: async ({ data }) => pair.sign(data) }];

    // Optional: if on Spiritnet, ensure account has funds; otherwise fallback to Peregrine
    if (network === 'spiritnet') {
      try {
        const info = await api.query.system.account(pair.address);
        const free = info.data.free.toBn();
        // Require minimal balance (0.1 KILT ~ 100000000000000000)
        const min = BigInt('100000000000000000');
        if (free < min) {
          console.warn('[KILT] Spiritnet balance too low; falling back to Peregrine');
          await api.disconnect();
          const provider2 = new WsProvider('wss://peregrine.kilt.io');
          api = await ApiPromise.create({ provider: provider2 });
          await api.isReady;
          ConfigService.set({ api });
        }
      } catch {}
    }

    // Create Spiritnet-style pre-signed extrinsic using SDK
    const didTx = await getStoreTx({ authentication: [authKey] }, pair.address, signers);

    // Sign the outer transaction and submit
    const nonce = await api.rpc.system.accountNextIndex(pair.address);
    let blockHashHex = '';
    await new Promise(async (resolve, reject) => {
      try {
        const unsub = await didTx.signAndSend(pair, { nonce }, (status) => {
          if (status.status.isInBlock) {
            blockHashHex = status.status.asInBlock.toHex();
            console.log('[KILT] In block', blockHashHex);
          }
          if (status.status.isFinalized) {
            blockHashHex = status.status.asFinalized.toHex();
            console.log('[KILT] Finalized', blockHashHex);
            unsub();
            resolve();
          }
        });
      } catch (e) { reject(e); }
    });

    res.json({
      success: true,
      network,
      address: pair.address,
      blockHash: blockHashHex,
      txHash: didTx.hash.toHex(),
    });
  } catch (e) {
    console.error('[API] /api/kilt/did/create failed:', e?.message || e);
    res.status(500).json({ success: false, error: e?.message || String(e) });
  } finally {
    try { await api?.disconnect(); } catch {}
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  GET /api/credentials/:did');
  console.log('  GET /api/credential-requests/:did');
  console.log('  GET /api/credential-offers/:did');
  console.log('  POST /api/credentials/request');
  console.log('  POST /api/credentials/accept');
  console.log('  POST /api/credentials/revoke');
});
