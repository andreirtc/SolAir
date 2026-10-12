import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createBackend } from '../backend/server.mjs';
import { openAuthStorage, installAuth } from '../backend/auth.mjs';
import express from 'express';
import { get as httpGet } from 'node:http';
import { openTelemetryStorage } from '../backend/telemetry-storage.mjs';
import { createTestOperator, testLogin } from './auth-test-client.mjs';
import { demoTelemetry } from '../src/app/data/demoTelemetry.ts';
import { createSimulatedMessage } from '../src/app/data/telemetrySimulation.ts';

const directory = mkdtempSync(join(tmpdir(), 'solair-auth-'));
const authDatabasePath = join(directory, 'auth.sqlite'), databasePath = join(directory, 'telemetry.sqlite');
const origin = 'http://127.0.0.1:5173';
let clock = Date.now();
const hosts = [], options = { databasePath, authDatabasePath, allowedHosts: hosts, startPaused: true, localDevelopment: true, authNow: () => clock, authLifetime: 60000 };
let backend, server;
async function readClosed(reader) {
  let timeout;
  try {
    return await Promise.race([(async () => {
      let text = '';
      while (true) { const part = await reader.read(); if (part.done) return text; text += new TextDecoder().decode(part.value); }
    })(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Revoked stream did not close')), 3500); })]);
  } finally { clearTimeout(timeout); }
}
const routes = [['GET', '/api/telemetry/latest'], ['GET', '/api/telemetry/stream'], ['GET', '/api/telemetry/history'], ['GET', '/api/telemetry/export.csv'], ['POST', '/api/simulator/pause'], ['POST', '/api/simulator/resume']];
try {
  const credentials = await createTestOperator(authDatabasePath);
  const other = await createTestOperator(authDatabasePath, 'other', 'OTHER-02');
  const storage = openTelemetryStorage(databasePath);
  try { storage.save(createSimulatedMessage({ ...demoTelemetry, deviceId: 'OTHER-02' }, 1, 'isolated-other', clock), 'OTHER-02', clock); } finally { storage.close(); }
  backend = createBackend(options);
  const listen = async () => { server = backend.app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); hosts.push(`127.0.0.1:${server.address().port}`); return `http://127.0.0.1:${server.address().port}`; };
  let base = await listen();
  const call = (path, method = 'GET', headers = {}, body) => fetch(base + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  for (const [method, path] of routes) {
    const response = await call(path, method);
    assert.equal(response.status, 401, path); assert.equal((await response.json()).code, 'AUTH_REQUIRED'); assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.deepEqual(await (await call('/api/health')).json(), { ok: true });
  const bootstrap = await call('/api/auth/session');
  const cookieSettings = bootstrap.headers.get('set-cookie');
  assert.match(cookieSettings, /HttpOnly/); assert.match(cookieSettings, /SameSite=Strict/); assert.match(cookieSettings, /Path=\/api/); assert.doesNotMatch(cookieSettings, /Secure/);
  const anonymous = cookieSettings.split(';')[0], token = (await bootstrap.json()).csrfToken;
  const loginHeaders = { Cookie: anonymous, Origin: origin, 'X-CSRF-Token': token, 'Content-Type': 'application/json' };
  assert.equal((await call('/api/auth/login', 'POST', { ...loginHeaders, 'X-CSRF-Token': 'wrong' }, credentials)).status, 403);
  const incorrect = await call('/api/auth/login', 'POST', loginHeaders, { ...credentials, password: randomBytes(24).toString('hex') });
  assert.equal(incorrect.status, 401); assert.equal((await incorrect.json()).error, 'Invalid username or password.');
  const login = await call('/api/auth/login', 'POST', loginHeaders, credentials);
  assert.equal(login.status, 200);
  const loggedCookie = login.headers.get('set-cookie'); assert.notEqual(loggedCookie.split(';')[0], anonymous);
  assert.match(loggedCookie, /HttpOnly/); assert.match(loggedCookie, /SameSite=Strict/); assert.match(loggedCookie, /Expires=/);
  const state = await login.json(), headers = { Cookie: loggedCookie.split(';')[0], 'X-CSRF-Token': state.csrfToken, Origin: origin };
  const unexpectedHostStatus = await new Promise((resolve, reject) => {
    const request = httpGet(base + '/api/telemetry/latest', { headers: { Host: 'unexpected.example' } }, response => { response.resume(); resolve(response.statusCode); });
    request.on('error', reject);
  });
  assert.equal(unexpectedHostStatus, 403);
  assert.equal((await call('/api/telemetry/stream', 'GET', { ...headers, Origin: 'https://foreign.example' })).status, 403);
  assert.equal((await call('/api/telemetry/latest', 'GET', { Cookie: anonymous })).status, 401);
  assert.equal((await (await call('/api/auth/session', 'GET', headers)).json()).authenticated, true);
  assert.equal((await call('/api/simulator/pause', 'POST', { Cookie: headers.Cookie, Origin: origin })).status, 403);
  assert.equal((await call('/api/auth/logout', 'POST', { Cookie: headers.Cookie, Origin: origin })).status, 403);
  const inputHeaders = { ...headers, 'Content-Type': 'application/json' };
  assert.equal((await call('/api/auth/login', 'POST', inputHeaders, { username: 'x'.repeat(65), password: 'x' })).status, 401);
  assert.equal((await call('/api/auth/login', 'POST', inputHeaders, { username: 'fixture', password: 'x'.repeat(257) })).status, 401);
  assert.equal((await call('/api/auth/login', 'POST', inputHeaders, { username: 'fixture', password: 'x'.repeat(3000) })).status, 413);
  assert.equal((await call('/api/simulator/pause', 'POST', { ...headers, Origin: 'https://foreign.example' })).status, 403);
  assert.equal((await call('/api/simulator/resume', 'POST', headers)).status, 200);
  assert.equal((await call('/api/simulator/pause', 'POST', headers)).status, 200);
  backend.accept(createSimulatedMessage(demoTelemetry, 1, 'isolated-own', clock));
  const latest = await (await call('/api/telemetry/latest?deviceId=OTHER-02', 'GET', headers)).json();
  assert.equal(latest.count, 1); assert.equal(latest.message.deviceId, demoTelemetry.deviceId);
  const history = await (await call('/api/telemetry/history?deviceId=OTHER-02', 'GET', headers)).json();
  assert.equal(history.records.length, 1); assert.equal(history.records[0].message.deviceId, demoTelemetry.deviceId);
  const csv = await call('/api/telemetry/export.csv?deviceId=OTHER-02', 'GET', headers);
  assert.equal(csv.status, 200); assert.equal(csv.headers.get('x-telemetry-record-count'), '1'); assert.doesNotMatch(await csv.text(), /OTHER-02/);
  const otherHeaders = await testLogin(base, other);
  for (const [method, path] of routes) assert.equal((await call(path, method, { ...otherHeaders, Origin: origin })).status, 403, path);
  const stream = await call('/api/telemetry/stream', 'GET', headers), reader = stream.body.getReader();
  assert.match(new TextDecoder().decode((await reader.read()).value), /isolated-own/);
  const logout = await call('/api/auth/logout', 'POST', headers);
  assert.equal(logout.status, 200); assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  backend.accept(createSimulatedMessage(demoTelemetry, 2, 'isolated-own', clock));
  // Another-tab logout invalidates this existing stream within one second.
  const ended = await readClosed(reader);
  assert.match(ended, /auth-required/); assert.doesNotMatch(ended, /"sequence":2/); assert.equal(backend.clientCount(), 0);
  assert.equal((await call('/api/telemetry/latest', 'GET', headers)).status, 401);
  const freshHeaders = await testLogin(base, credentials);
  const expiring = await call('/api/telemetry/stream', 'GET', freshHeaders), expiryReader = expiring.body.getReader(); await expiryReader.read();
  clock += 60001;
  assert.equal((await call('/api/telemetry/latest', 'GET', freshHeaders)).status, 401);
  assert.match(await readClosed(expiryReader), /auth-required/);
  const resetHeaders = await testLogin(base, credentials);
  const resetStream = await call('/api/telemetry/stream', 'GET', resetHeaders), resetReader = resetStream.body.getReader(); await resetReader.read();
  const password = randomBytes(24).toString('hex'), auth = openAuthStorage(authDatabasePath, () => clock);
  try { await auth.reset(credentials.username, password); } finally { auth.close(); }
  assert.equal((await call('/api/telemetry/latest', 'GET', resetHeaders)).status, 401);
  assert.match(await readClosed(resetReader), /auth-required/);
  await assert.rejects(testLogin(base, credentials), /Fixture login failed: 401/);
  const resetLogin = await testLogin(base, { ...credentials, password });
  // Sessions and the signing secret survive an orderly backend restart.
  backend.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  backend = createBackend(options); base = await listen();
  assert.equal((await call('/api/telemetry/latest', 'GET', resetLogin)).status, 200);
  for (let i = 0; i < 12; i++) {
    const boot = await call('/api/auth/session'), data = await boot.json();
    const response = await call('/api/auth/login', 'POST', { Cookie: boot.headers.get('set-cookie').split(';')[0], Origin: origin, 'X-CSRF-Token': data.csrfToken, 'Content-Type': 'application/json' }, { username: 'nonexistent', password: 'x' });
    if (response.status === 429) break;
    if (i === 11) assert.fail('Login throttle missing');
  }
  const inspection = new DatabaseSync(authDatabasePath);
  try { assert.equal(inspection.prepare('SELECT COUNT(*) AS n FROM operators').get().n, 2); assert.equal(inspection.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name='telemetry_samples'").get().n, 0); } finally { inspection.close(); }
  // Middleware configuration check simulates Express's encrypted transport flag.
  // This is not an HTTPS deployment or certificate/browser integration test.
  const secureAuth = openAuthStorage(join(directory, 'secure.sqlite'));
  const secureApp = express();
  secureApp.use((req, _res, next) => { req.socket.encrypted = true; next(); });
  installAuth(secureApp, { auth: secureAuth, origin: 'https://localhost' });
  const secureServer = secureApp.listen(0, '127.0.0.1'); await new Promise(resolve => secureServer.once('listening', resolve));
  try {
    const secureResponse = await fetch(`http://127.0.0.1:${secureServer.address().port}/api/auth/session`);
    assert.match(secureResponse.headers.get('set-cookie'), /; Secure/);
    assert.match(secureResponse.headers.get('set-cookie'), /HttpOnly/);
    const unsafeAuth = openAuthStorage(join(directory, 'unsafe.sqlite'));
    try { assert.throws(() => installAuth(express(), { auth: unsafeAuth, origin: 'http://external.example', localDevelopment: true }), /loopback/); } finally { unsafeAuth.close(); }
  } finally { secureServer.closeAllConnections(); await new Promise(resolve => secureServer.close(resolve)); secureAuth.close(); }
  console.log('Passed auth: every protected route 401/403, login/rotation/cookies, refresh/restart, device query isolation, CSRF/throttle, history/CSV/controls, expiry/logout/reset SSE closure (temporary databases).');
} finally {
  backend?.close(); if (server?.listening) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  rmSync(directory, { recursive: true, force: true });
}
