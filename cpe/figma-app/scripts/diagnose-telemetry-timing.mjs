import { performance } from 'node:perf_hooks';
import { createBackend } from '../backend/server.mjs';

// Read-only against existing services; otherwise measure an isolated simulator.
const duration = Number(process.argv[2] ?? 45000);
if (!Number.isFinite(duration) || duration <= 0) throw new Error('Duration must be a positive number of milliseconds.');
let backend;
let server;
let url = process.argv[3] ?? 'http://127.0.0.1:3001';
const callbacks = [];
try {
  if (url === '--isolated') throw new Error('Isolated measurement requested.');
  const health = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2000) });
  if (!health.ok) throw new Error(`Health HTTP ${health.status}`);
} catch (error) {
  if (process.argv[3] && url !== '--isolated') throw error;
  const allowedHosts = [];
  backend = createBackend({ allowedHosts, schedule(fn, delay) {
    let previous = performance.now();
    return setInterval(() => {
      const current = performance.now();
      if (delay === 3000) callbacks.push({ gapMs: Math.round(current - previous), at: Date.now() });
      previous = current;
      fn();
    }, delay);
  } });
  server = backend.app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  allowedHosts.push(new URL(url).host);
}
console.log(JSON.stringify({ mode: backend ? 'isolated simulator' : 'existing backend', durationMs: duration }));
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), duration);
let previous;
try {
  const response = await fetch(`${url}/api/telemetry/stream`, { signal: controller.signal });
  if (!response.ok) throw new Error(`SSE HTTP ${response.status}`);
  let buffer = '';
  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = frame.match(/^data: (.+)$/m);
      if (!data) continue;
      const state = JSON.parse(data[1]);
      const delivery = performance.now();
      const latest = await (await fetch(`${url}/api/telemetry/latest`)).json();
      console.log(JSON.stringify({ count: state.count, sequence: state.message?.sequence ?? null,
        paused: state.paused, validationError: state.validationError, receivedAt: state.receivedAt,
        senderToReceiptMs: state.message ? state.receivedAt - Date.parse(state.message.sampledAtUtc) : null,
        receiptGapMs: previous?.receivedAt != null ? state.receivedAt - previous.receivedAt : null,
        deliveryGapMs: previous ? Math.round(delivery - previous.delivery) : null,
        deliveryAgeMs: state.receivedAt == null ? null : Date.now() - state.receivedAt,
        latestMatches: latest.count === state.count && latest.receivedAt === state.receivedAt }));
      previous = { ...state, delivery };
    }
  }
} catch (error) {
  if (!controller.signal.aborted) throw error;
} finally {
  clearTimeout(timeout);
  backend?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if (backend) console.log(JSON.stringify({ generationCallbacks: callbacks }));
}
