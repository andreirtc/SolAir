import { randomBytes } from 'node:crypto';
import { openAuthStorage } from '../backend/auth.mjs';
import { demoTelemetry } from '../src/app/data/demoTelemetry.ts';

// Test fixtures only: callers must supply isolated auth/telemetry database paths.
export async function createTestOperator(path, username = 'fixture', deviceId = demoTelemetry.deviceId) {
  const password = randomBytes(24).toString('hex');
  const auth = openAuthStorage(path);
  try { await auth.create(username, password, deviceId); } finally { auth.close(); }
  return { username, password };
}
export async function testLogin(base, credentials, origin = 'http://127.0.0.1:5173') {
  const bootstrap = await fetch(base + '/api/auth/session');
  const anonymousCookie = bootstrap.headers.get('set-cookie').split(';')[0];
  const before = await bootstrap.json();
  const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { Cookie: anonymousCookie, Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': before.csrfToken }, body: JSON.stringify(credentials) });
  if (!response.ok) throw new Error(`Fixture login failed: ${response.status}`);
  const data = await response.json();
  return { Cookie: response.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': data.csrfToken };
}
