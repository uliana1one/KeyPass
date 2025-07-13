const request = require('supertest');
const express = require('express');
const fetch = require('node-fetch');

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');

let app;
beforeAll(() => {
  app = require('./proxy-server');
});

describe('Proxy Server API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/etherscan/:address returns JSON', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ result: 'ok' }), { status: 200 }));
    const res = await request(app).get('/api/etherscan/0x123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ result: 'ok' });
  });

  it('GET /api/alchemy/nfts/:address returns JSON', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ nfts: [] }), { status: 200 }));
    const res = await request(app).get('/api/alchemy/nfts/0x123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ nfts: [] });
  });

  it('GET /api/polkadot/health returns JSON', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ result: { isSyncing: false } }), { status: 200 }));
    const res = await request(app).get('/api/polkadot/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ result: { isSyncing: false } });
  });

  it('GET /api/unknown returns 404', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
}); 