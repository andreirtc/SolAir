import { createTestOperator, testLogin } from './auth-test-client.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

const directory = await mkdtemp(join(tmpdir(), 'solair-launcher-'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const bind = async port => { const server = createServer(); server.listen(port, '127.0.0.1'); await once(server, 'listening'); return server; };
const available = async () => { const server = await bind(0); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; };
const free = async port => { const server = await bind(port); await new Promise(resolve => server.close(resolve)); };
const authDatabasePath = join(directory, 'auth.sqlite');
const credentials = await createTestOperator(authDatabasePath);
let child;
async function run({ backendPort, frontendPort, databasePath = join(directory, 'telemetry.sqlite'), failure, startPaused = true } = {}) {
  backendPort ??= await available(); frontendPort ??= await available();
  // IPC asks this test harness to emit a signal in-process. This is NOT an actual Ctrl+C.
  child = spawn(process.execPath, ['--input-type=module', '-e',
    "process.on('message', signal => { process.disconnect(); process.emit(signal); }); process.channel.unref(); await import('./scripts/dev-local.mjs');",
    '--', '--backend-port', String(backendPort), '--frontend-port', String(frontendPort)], {
    cwd: new URL('../', import.meta.url), env: { ...process.env, SOLAIR_AUTH_DB_PATH: authDatabasePath, SOLAIR_DB_PATH: databasePath, SOLAIR_SIMULATOR_PAUSED: startPaused ? '1' : '0' },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });
  const current = child;
  let output = '';
  current.stdout.on('data', data => output += data);
  current.stderr.on('data', data => output += data);
  const exited = once(current, 'exit');
  const deadline = Date.now() + 20000;
  while (!output.includes('Both services ready:') && current.exitCode === null && Date.now() < deadline) await delay(50);
  if (failure) {
    // Failure must exit by itself, without the test requesting shutdown.
    while (current.exitCode === null && Date.now() < deadline) await delay(50);
    assert.notEqual(current.exitCode, null, output);
    const [code] = await exited;
    assert.equal(code, 1, output);
    assert.match(output, failure);
    assert.ok(!output.includes('Both services ready:'), output);
  } else {
    assert.match(output, /Both services ready:/);
    for (const [method, path] of [['GET', '/api/telemetry/latest'], ['GET', '/api/telemetry/stream'], ['GET', '/api/telemetry/history'], ['GET', '/api/telemetry/export.csv'], ['POST', '/api/simulator/pause'], ['POST', '/api/simulator/resume']]) {
      const denied = await fetch(`http://127.0.0.1:${frontendPort}${path}`, { method });
      assert.equal(denied.status, 401, path); assert.equal((await denied.json()).code, 'AUTH_REQUIRED');
    }
    const headers = await testLogin(`http://127.0.0.1:${frontendPort}`, credentials, `http://127.0.0.1:${frontendPort}`);
    const response = await fetch(`http://127.0.0.1:${frontendPort}/api/telemetry/latest`, { headers });
    assert.equal(response.status, 200);
    const state = await response.json();
    assert.equal(state.paused, startPaused); assert.equal(state.count, 0);
    if (!startPaused) {
      await delay(3400);
      const latest = await (await fetch(`http://127.0.0.1:${frontendPort}/api/telemetry/latest`, { headers })).json();
      assert.ok(latest.count > 0, 'Unpaused startup should save samples to the temporary database');
    }
    assert.equal((await fetch(`http://127.0.0.1:${frontendPort}/dashboard`)).status, 200);
    current.stdin.end(); await delay(1200);
    assert.equal(current.exitCode, null, 'Input EOF must not end the services');
    current.send('SIGINT');
    const [code] = await Promise.race([exited, delay(10000).then(() => { throw new Error('Shutdown timeout: ' + output); })]);
    assert.equal(code, 0, output);
    assert.match(output, /Services stopped/);
  }
  child = undefined;
  return { backendPort, frontendPort, output };
}
try {
  const normal = await run();
  await free(normal.backendPort); await free(normal.frontendPort);
  console.log('PASS normal startup, frontend/proxy HTTP, paused temporary DB, input EOF, injected SIGINT cleanup; no orphan listeners');
  const running = await run({ startPaused: false });
  await free(running.backendPort); await free(running.frontendPort);
  console.log('PASS unpaused startup saves simulated samples to temporary SQLite; shutdown frees both ports');
  const invalid = join(directory, 'invalid.sqlite'); await writeFile(invalid, 'not a SQLite database');
  const failed = await run({ databasePath: invalid, failure: /\[backend\].*exit code 1/ });
  await free(failed.backendPort); await free(failed.frontendPort);
  console.log('PASS backend SQLite startup failure: named error/code, no partial startup');
  for (const name of ['backend', 'frontend']) {
    const owner = await bind(0);
    try {
      const occupied = owner.address().port;
      const result = await run({ [`${name}Port`]: occupied, failure: new RegExp(`\\[${name}\\].*exit code 1`) });
      assert.equal(owner.listening, true);
      await free(name === 'backend' ? result.frontendPort : result.backendPort);
      console.log(`PASS occupied ${name} port: named error/code, sibling cleaned up, unrelated listener retained`);
    } finally { await new Promise(resolve => owner.close(resolve)); }
  }
} finally {
  if (child?.exitCode === null) { child.kill(); await once(child, 'exit'); }
  await rm(directory, { recursive: true, force: true });
}
console.log('Launcher checks passed. Actual terminal Ctrl+C is a separate manual/PTY check.');

