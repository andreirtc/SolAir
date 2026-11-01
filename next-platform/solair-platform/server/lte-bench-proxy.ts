import { createServer, request } from 'node:http';

// Tunnel only this listener, never the development app with its browser sessions.
// Authentication, schema validation, persistence and replay checks stay in SOLAIR.
export function lteBenchProxy(upstream: string) {
  const target = new URL('/api/ingest', upstream);
  if (target.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)) {
    throw new Error('LTE bench upstream must be a loopback HTTP application');
  }
  return createServer(async (req, res) => {
    const reply = (status: number, message: string) => {
      if (res.headersSent) { res.destroy(); return; }
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: message }));
    };
    if (req.method !== 'POST' || req.url !== '/api/ingest' || req.headers.origin || req.headers.cookie || req.headers['x-bench-transport']) {
      req.resume(); reply(404, 'Device ingestion only'); return;
    }
    if (!/^Bearer [A-Za-z0-9_-]{20,256}$/.test(req.headers.authorization || '')) {
      req.resume(); reply(401, 'Device credential required'); return;
    }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
      req.resume(); reply(415, 'JSON required'); return;
    }
    const chunks: Buffer[] = []; let size = 0;
    req.setTimeout(15000, () => { reply(408, 'Request timeout'); req.destroy(); });
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 96 * 1024) { reply(413, 'Telemetry too large'); return; }
        chunks.push(Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks);
      // Forward only device credentials and JSON; browser/session/proxy headers
      // cannot open the USB engineer-ingestion path or change trusted identity.
      const forward = request(target, { method: 'POST', headers: {
        Authorization: req.headers.authorization!, 'Content-Type': 'application/json', 'Content-Length': body.length,
      }, timeout: 15000 }, response => {
        res.writeHead(response.statusCode || 502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        response.pipe(res);
        response.on('error', () => res.destroy());
      });
      forward.on('timeout', () => forward.destroy(new Error('Upstream timeout')));
      forward.on('error', () => reply(502, 'Local ingestion unavailable'));
      res.on('close', () => forward.destroy());
      forward.end(body);
    } catch { reply(400, 'Incomplete telemetry'); }
  });
}
