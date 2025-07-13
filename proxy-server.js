const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Etherscan proxy example
app.get('/api/etherscan/:address', async (req, res) => {
  const { address } = req.params;
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${process.env.ETHERSCAN_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Etherscan fetch failed', details: err.message });
  }
});

// Alchemy proxy example (Ethereum mainnet NFTs)
app.get('/api/alchemy/nfts/:address', async (req, res) => {
  const { address } = req.params;
  const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}/getNFTs/?owner=${address}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Alchemy fetch failed', details: err.message });
  }
});

// Polkadot RPC proxy (example: system_health)
app.get('/api/polkadot/health', async (req, res) => {
  const url = 'https://rpc.polkadot.io'; // Public endpoint, or use your own
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'system_health',
        params: []
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Polkadot RPC fetch failed', details: err.message });
  }
});

// Fallback for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not implemented' });
});

module.exports = app; 