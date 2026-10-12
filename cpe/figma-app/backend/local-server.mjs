// This entry point explicitly enables HTTP cookies for loopback development only.
process.env.SOLAIR_LOCAL_HTTP = '1';
const { createBackend } = await import('./server.mjs');
const backend = createBackend();
const server = backend.app.listen(3001, '127.0.0.1', () => console.log('SolAir local authenticated simulator: http://127.0.0.1:3001'));
server.on('error', error => { backend.close(); console.error(`Backend startup failed: ${error.code}`); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { backend.close(); server.close(); server.closeAllConnections(); });
