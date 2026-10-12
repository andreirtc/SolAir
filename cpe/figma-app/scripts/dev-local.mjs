import { createServer, createLogger } from 'vite';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { createBackend } from '../backend/server.mjs';

// Both services run here, without a Windows shell or npm child tree.
// Alternate ports support isolated diagnostics; defaults remain unchanged.
const root = fileURLToPath(new URL('../', import.meta.url));
function port(name, fallback) {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? fallback : Number(process.argv[index + 1]);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`Invalid ${name}`);
  return value;
}
let backend, server, frontend, stopping, startup;
let service = 'launcher';
async function stop(code = 0) {
  process.exitCode = Math.max(process.exitCode ?? 0, code);
  if (stopping) return stopping;
  stopping = (async () => {
    await startup;
    console.log('[launcher] Stopping owned services.');
    const results = await Promise.allSettled([
      frontend?.close(),
      (async () => {
        backend?.close();
        if (server?.listening) {
          const closed = new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
          server.closeAllConnections();
          await closed;
        }
      })(),
    ]);
    for (const result of results) if (result.status === 'rejected') {
      console.error(`[launcher] Shutdown error: ${result.reason.message}; exit code 1`);
      process.exitCode = 1;
    }
    console.log('[launcher] Services stopped.');
  })();
  return stopping;
}
function fail(name, error) {
  console.error(`[${name}] ${error.code ? `${error.code}: ` : ''}${error.message}; exit code 1`);
  if (error.code === 'EADDRINUSE' || /already in use/.test(error.message)) {
    console.error(`[${name}] Port conflict: stop the known owner yourself or choose unused diagnostic ports. No unrelated processes were stopped.`);
  }
  void stop(1);
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { void stop(); });
process.on('uncaughtException', error => fail(service, error));
process.on('unhandledRejection', error => fail(service, error instanceof Error ? error : new Error(String(error))));
startup = (async () => {
  const backendPort = port('--backend-port', 3001);
  const frontendPort = port('--frontend-port', 5173);
  service = 'backend';
  backend = createBackend({ localDevelopment: true, origin: `http://127.0.0.1:${frontendPort}`,
    allowedHosts: [`127.0.0.1:${backendPort}`, `127.0.0.1:${frontendPort}`] });
  server = backend.app.listen(backendPort, '127.0.0.1');
  await once(server, 'listening');
  server.on('error', error => fail('backend', error));
  server.on('close', () => { if (!stopping) fail('backend', new Error('Unexpected server close')); });
  console.log(`[backend] Listening on http://127.0.0.1:${backendPort} (SIMULATED, local SQLite)`);
  if (stopping) return;
  service = 'frontend';
  const logger = createLogger();
  const customLogger = { ...logger };
  for (const method of ['info', 'warn', 'warnOnce', 'error']) customLogger[method] = (message, options) => logger[method](`[frontend] ${message}`, options);
  frontend = await createServer({ root, customLogger, clearScreen: false,
    server: { host: '127.0.0.1', port: frontendPort, strictPort: true,
      proxy: { '/api': { target: `http://127.0.0.1:${backendPort}` } } } });
  if (stopping) return;
  await frontend.listen();
  frontend.httpServer.on('error', error => fail('frontend', error));
  // Vite may close/recreate its HTTP server during a config reload.
  // Its close event alone is not a service failure.
  console.log(`[frontend] Listening on http://127.0.0.1:${frontendPort}`);
  console.log(`[launcher] Both services ready: http://127.0.0.1:${frontendPort}/dashboard; Ctrl+C stops both.`);
})().catch(error => fail(service, error));
