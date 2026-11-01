import { lteBenchProxy } from '../server/lte-bench-proxy';
const port = Number(process.env.SOLAIR_LTE_BENCH_PORT || 3003);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid LTE bench port');
const server = lteBenchProxy(process.env.SOLAIR_LTE_BENCH_UPSTREAM || 'http://127.0.0.1:3000');
server.listen(port, '127.0.0.1', () => console.log(`LTE device-only bench ingress on 127.0.0.1:${port}; authenticated POST /api/ingest only`));
server.on('error', error => { console.error('LTE bench ingress failed:', (error as NodeJS.ErrnoException).code); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.closeAllConnections(); server.close(); });
