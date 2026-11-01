import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { lteBenchProxy } from '../server/lte-bench-proxy';

test('LTE tunnel forwards only bounded credentialed device ingestion, never browser access', async () => {
  const captured: { headers: Record<string, unknown>; body: string }[] = [];
  const upstream = createServer(async (req, res) => {
    let body = ''; for await (const b of req) body += b;
    captured.push({ headers: req.headers, body }); res.writeHead(201, { 'Content-Type': 'application/json' }); res.end('{"accepted":true}');
  });
  await new Promise<void>(r => upstream.listen(0, '127.0.0.1', r));
  const proxy = lteBenchProxy(`http://127.0.0.1:${(upstream.address() as any).port}`);
  await new Promise<void>(r => proxy.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(proxy.address() as any).port}`;
  const credential = 'Bearer TEST-FIXTURE-device-token-12345';
  const post = (path = '/api/ingest', headers = {}, body = '{}') => fetch(base + path, { method: 'POST', headers: { Authorization: credential, 'Content-Type': 'application/json', ...headers }, body });
  try {
    for (const path of ['/', '/api/health', '/api/login', '/api/ingest?other=1']) assert.equal((await post(path)).status, 404);
    assert.equal((await fetch(base + '/api/ingest')).status, 404);
    for (const headers of [{ Origin: base }, { Cookie: 'session=fixture' }, { 'X-Bench-Transport': 'usb' }]) assert.equal((await post('/api/ingest', headers)).status, 404);
    assert.equal((await post('/api/ingest', { Authorization: '' })).status, 401);
    assert.equal((await post('/api/ingest', { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await post('/api/ingest', {}, 'x'.repeat(96 * 1024 + 1))).status, 413);
    assert.equal(captured.length, 0);
    const response = await post('/api/ingest', { 'X-Forwarded-For': '1.2.3.4' }, '{"device_id":"TEST FIXTURE"}');
    assert.equal(response.status, 201); assert.equal((await response.json()).accepted, true);
    assert.equal(captured.length, 1); assert.equal(captured[0].headers.authorization, credential);
    assert.equal(captured[0].headers['x-forwarded-for'], undefined);
    assert.equal(captured[0].body, '{"device_id":"TEST FIXTURE"}');
    assert.throws(() => lteBenchProxy('http://example.org'), /loopback/);
  } finally {
    proxy.closeAllConnections(); upstream.closeAllConnections();
    await Promise.all([new Promise<void>(r => proxy.close(() => r())), new Promise<void>(r => upstream.close(() => r()))]);
  }
});
